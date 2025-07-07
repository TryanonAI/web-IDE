'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet, useGlobalState } from '@/hooks';
import {
  ARIO,
  ANTRegistry,
  AoArNSNameData,
  AoPrimaryName,
  ANT,
  ArconnectSigner,
} from '@ar.io/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search,
  Loader2,
  User,
  Calendar,
  Hash,
  ExternalLink,
  Link,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

type arnsrecord = AoArNSNameData & {
  name: string;
  isPrimary: boolean;
};

const ARNS = () => {
  const { connected, address } = useWallet();
  const { projects } = useGlobalState();

  // State for ArNS records and primary names
  const [arnsRecords, setArnsRecords] = useState<arnsrecord[]>([]);
  const [primaryName, setPrimaryName] = useState<AoPrimaryName | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastAddress, setLastAddress] = useState<string | null>(null);

  // State for deployments and migration
  const [isLoadingDeployments, setIsLoadingDeployments] = useState(false);
  const [selectedArns, setSelectedArns] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  // to change the ant name
  // const { id: txId } = await ant.setName(
  //   { name: 'My ANT' },
  //   // optional additional tags
  //   { tags: [{ name: 'App-Name', value: 'My-Awesome-App' }] },
  // );

  // Migration function
  const migrateToArns = async (
    processId: string,
    undername: string,
    arweaveUrl: string,
    ttlSeconds: number
  ): Promise<{ arnsUrl: string; transactionId: string }> => {
    try {
      // Extract transaction ID from arweave URL
      console.log('Arweave URL:', arweaveUrl);
      const txIdMatch = arweaveUrl.match(/\/([a-zA-Z0-9_-]+)$/);
      if (!txIdMatch) {
        throw new Error('Invalid Arweave URL format');
      }

      const transactionId = txIdMatch[1];
      console.log('Migrating transaction ID:', transactionId);
      console.log('To ANT process:', processId);
      console.log('With undername:', undername);

      // Check if ArConnect is available
      if (typeof window === 'undefined' || !window.arweaveWallet) {
        throw new Error('ArConnect wallet not found');
      }

      // Initialize ANT
      const ant = ANT.init({
        processId,
        signer: new ArconnectSigner(window.arweaveWallet),
      });
      let result;
      if (undername === '@') {
        const { id: txId } = await ant.removeUndernameRecord(
          { undername: '@' },
          // optional additional tags
          { tags: [{ name: 'App-Name', value: 'tryanon.ai' }] }
        );
        console.log(txId);

        // Update the basename '@' record
        result = await ant.setBaseNameRecord(
          {
            transactionId,
            ttlSeconds,
          },
          {
            tags: [
              { name: 'App-Name', value: 'Anon-Project-Link' },
              { name: 'Project-Link', value: arweaveUrl },
              { name: 'Timestamp', value: new Date().toISOString() },
            ],
          }
        );
      } else {
        result = await ant.setUndernameRecord(
          {
            undername,
            transactionId,
            ttlSeconds,
          },
          {
            tags: [
              { name: 'App-Name', value: 'Anon-Project-Link' },
              { name: 'Project-Link', value: arweaveUrl },
              { name: 'Timestamp', value: new Date().toISOString() },
            ],
          }
        );
      }
      // Get the ARNS name from the process ID
      const arnsRecord = arnsRecords.find(
        (record) => record.processId === processId
      );

      if (!arnsRecord) {
        throw new Error('Could not find ARNS name for the given process ID');
      }

      // Construct the final ARNS URL
      const arnsUrl =
        undername === '@' || !undername
          ? `https://${arnsRecord.name}.ar.io`
          : `https://${undername}_${arnsRecord.name}.ar.io`;

      console.log('Migration successful:', {
        arnsUrl,
        transactionId: result.id || 'pending',
      });

      return {
        arnsUrl,
        transactionId: result.id || 'pending',
      };
    } catch (error) {
      console.error('Error during migration:', error);
      throw new Error(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Fetch user's primary name
  const fetchPrimaryName = useCallback(async (userAddress: string) => {
    try {
      const ario = ARIO.testnet();
      const primary = await ario.getPrimaryName({ address: userAddress });
      console.log('Primary name:', primary);
      setPrimaryName(primary);
      return primary;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Primary name data not found')
      ) {
        console.log('No primary name found for address');
        setPrimaryName(null);
        return null;
      }
      console.error('Error fetching primary name:', error);
      setPrimaryName(null);
      return null;
    }
  }, []);

  // Fetch all ArNS records owned or controlled by the user
  const fetchAllArnsRecords = useCallback(async (userAddress: string) => {
    try {
      const antRegistry = ANTRegistry.init();
      const ario = ARIO.testnet();

      // Get access control list for the user
      const acl = await antRegistry.accessControlList({
        address: userAddress,
      });

      // Get all ArNS records for owned and skipped controlled process IDs
      const allProcessIds = {
        ...acl.Owned,
      };

      if (Object.keys(allProcessIds).length === 0) {
        console.log('No process IDs found for user');
        return [];
      }

      const arnsRecords = await ario.getArNSRecords({
        filters: {
          processId: {
            ...allProcessIds,
          },
        },
      });

      // Convert to our format with name included
      const recordsWithNames = arnsRecords.items.map((record) => ({
        ...record,
        name: record.name,
      }));

      return recordsWithNames;
    } catch (error) {
      console.error('Error fetching ArNS records:', error);
      return [];
    }
  }, []);

  // Main fetch function that gets both primary name and ArNS records
  const fetchUserData = useCallback(async () => {
    if (!connected || !address) return;

    // Prevent duplicate requests for the same address
    if (lastAddress === address) return;

    setIsLoading(true);
    setLastAddress(address);

    try {
      // Fetch primary name and ArNS records in parallel
      const [primary, records] = await Promise.all([
        fetchPrimaryName(address),
        fetchAllArnsRecords(address),
      ]);

      // Mark the primary name record if it exists
      const recordsWithPrimary = records.map((record) => ({
        ...record,
        isPrimary: primary?.name === record.name,
      }));

      setArnsRecords(recordsWithPrimary);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to fetch your ArNS names');
      // Reset the last address on error so it can be retried
      setLastAddress(null);
    } finally {
      setIsLoading(false);
    }
  }, [connected, address, lastAddress, fetchPrimaryName, fetchAllArnsRecords]);

  // Handle migration
  const handleMigration = async () => {
    if (!selectedArns || !selectedProject) {
      setMigrationError(
        'Please select an ARNS name and either a project or enter a custom URL'
      );
      return;
    }

    let arweaveUrl = '';

    if (selectedProject) {
      const project = projects.find((p) => p.projectId === selectedProject);
      console.log(project);
      if (!project?.deploymentUrl) {
        setMigrationError('Selected project has no deployment URL');
        return;
      }
      arweaveUrl = project.deploymentUrl;
    } else {
      arweaveUrl = customUrl;
    }

    setIsMigrating(true);
    setMigrationError(null);

    try {
      const selectedArnsData = arnsRecords.find(
        (arns) => arns.name === selectedArns
      );
      if (!selectedArnsData) {
        throw new Error('Selected ARNS name not found');
      }

      const result = await migrateToArns(
        selectedArnsData.processId,
        '@',
        arweaveUrl,
        500
      );

      toast.success(
        `Successfully migrated to ${result.arnsUrl}! Transaction ID: ${result.transactionId.slice(0, 8)}...`
      );

      // Reset form
      setSelectedArns('');
      setSelectedProject('');
      setCustomUrl('');
    } catch (err) {
      setMigrationError(
        err instanceof Error ? err.message : 'Migration failed'
      );
    } finally {
      setIsMigrating(false);
    }
  };

  // Initial load when address changes
  useEffect(() => {
    if (connected && address && lastAddress !== address) {
      fetchUserData();
    }
  }, [connected, address, lastAddress, fetchUserData]);

  // Filter ArNS records based on search
  const filteredRecords = arnsRecords.filter((record) =>
    record.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-96 border-0 shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Connect Wallet</h3>
            <p className="text-muted-foreground text-center text-sm">
              Connect your wallet to view your ArNS names.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">My ArNS Names</h1>
        <p className="text-muted-foreground">
          Manage your Arweave Name System (ArNS) names and link them to your
          deployments.
        </p>
      </div>

      <Tabs defaultValue="names" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="names">ArNS Names</TabsTrigger>
          <TabsTrigger value="migrate">Link Deployments</TabsTrigger>
        </TabsList>

        <TabsContent value="names" className="space-y-6">
          <Card className="border-0 shadow-none">
            <CardContent className="p-6 space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your ArNS names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-muted"
                />
              </div>

              {/* Primary name display */}
              {primaryName && (
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="text-xs">
                      Primary Name
                    </Badge>
                  </div>
                  <div className="font-medium text-lg">
                    {primaryName.name}.ar.io
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Set as primary since{' '}
                    {formatTimestamp(primaryName.startTimestamp)}
                  </div>
                </div>
              )}

              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">
                    Loading your ArNS names...
                  </span>
                </div>
              )}

              {/* ArNS records list */}
              {!isLoading && (
                <div className="space-y-3">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border border-muted/50 hover:border-muted transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">
                              {record.name}.ar.io
                            </div>
                            {record.isPrimary && (
                              <Badge variant="default" className="text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Since {formatTimestamp(record.startTimestamp)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              <span className="font-mono">
                                {record.processId?.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              record.type === 'permabuy'
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {record.type === 'permabuy' ? 'Permanent' : 'Lease'}
                          </Badge>
                          {record.type === 'lease' && record.endTimestamp && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Expires {formatTimestamp(record.endTimestamp)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-muted-foreground mb-2">
                        {searchQuery ? 'No names found' : 'No ArNS names found'}
                      </div>
                      {!searchQuery && (
                        <p className="text-sm text-muted-foreground">
                          You don&apos;t own or control any ArNS names yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Refresh button */}
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setLastAddress(null);
                    fetchUserData();
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migrate" className="space-y-6">
          {/* Migration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Link Deployment to ArNS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select ArNS Name
                  </label>
                  <Select value={selectedArns} onValueChange={setSelectedArns}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an ArNS name" />
                    </SelectTrigger>
                    <SelectContent>
                      {arnsRecords.map((record) => (
                        <SelectItem key={record.name} value={record.name}>
                          {record.name}.ar.io
                          {record.isPrimary && (
                            <Badge variant="default" className="ml-2 text-xs">
                              Primary
                            </Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Project</label>
                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project deployment" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem
                          key={project.projectId}
                          value={project.projectId}
                        >
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* <div className="space-y-2">
                <label className="text-sm font-medium">
                  Or Enter Custom Arweave URL
                </label>
                <Input
                  placeholder="https://example.arweave.net/txId or https://example.ar.io/txId"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  disabled={!!selectedProject}
                />
                <p className="text-xs text-muted-foreground">
                  URL must point to a valid Arweave transaction ID
                </p>
              </div> */}

              {migrationError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {migrationError}
                </div>
              )}

              <Button
                onClick={handleMigration}
                disabled={
                  isMigrating ||
                  !selectedArns ||
                  (!selectedProject && !customUrl)
                }
                className="w-full"
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Link to ArNS
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Project Deployments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Your Project Deployments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDeployments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">
                    Loading deployments...
                  </span>
                </div>
              ) : projects.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Framework</TableHead>
                      <TableHead>Deployment URL</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects
                      .filter(
                        (project) =>
                          project.deploymentUrl &&
                          project.deploymentUrl.trim() !== ''
                      )
                      .map((project) => (
                        <TableRow key={project.projectId}>
                          <TableCell className="font-medium">
                            {project.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{project.framework}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm truncate max-w-xs">
                                {project.deploymentUrl}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(project.deploymentUrl, '_blank')
                                }
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(project.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-2">
                    No deployments found
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create and deploy projects to see them here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ARNS;
