'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Globe, Loader2, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useGlobalState, useWallet } from '@/hooks';

// Types
type ArnsRecord = {
  name: string;
  processId: string;
  startTimestamp: number;
  endTimestamp?: number;
  type: 'lease' | 'permabuy';
  isPrimary: boolean;
};

const FormSchema = z.object({
  selectedArns: z.string().min(1, 'Please select an ARNS domain'),
  undername: z.string().optional(),
});

export default function CustomDomain({ className }: { className?: string }) {
  const { connected, address } = useWallet();
  const { activeProject } = useGlobalState();
  const [arnsRecords, setArnsRecords] = useState<ArnsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [currentMapping, setCurrentMapping] = useState<{
    domain: string;
    url: string;
  } | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      selectedArns: '',
      undername: '',
    },
  });

  // Fetch user's ARNS records
  const fetchArnsRecords = useCallback(async () => {
    if (!connected || !address || typeof window === 'undefined') return;

    setIsLoading(true);
    try {
      const { ANTRegistry, ARIO } = await import('@ar.io/sdk');
      const antRegistry = ANTRegistry.init();
      const ario = ARIO.mainnet();

      // Get user's owned/controlled ANTs
      const acl = await antRegistry.accessControlList({ address });
      const allProcessIds = { ...acl.Owned, ...acl.Controlled };

      if (Object.keys(allProcessIds).length === 0) {
        setArnsRecords([]);
        return;
      }

      // Get ARNS records for user's process IDs
      const arnsRecords = await ario.getArNSRecords({
        filters: { processId: allProcessIds },
      });

      // Get primary name for this address
      let primaryName = null;
      try {
        primaryName = await ario.getPrimaryName({ address });
      } catch {
        // No primary name found, that's okay
        console.log('No primary name found');
      }

      const recordsWithNames = arnsRecords.items.map((record) => ({
        ...record,
        isPrimary: primaryName?.name === record.name,
      }));

      setArnsRecords(recordsWithNames);
    } catch (error) {
      console.error('Error fetching ARNS records:', error);
      toast.error('Failed to fetch your ARNS domains');
    } finally {
      setIsLoading(false);
    }
  }, [connected, address]);

  // Migrate project to ARNS domain
  const migrateToArns = async (data: z.infer<typeof FormSchema>) => {
    if (!activeProject?.deploymentUrl || !connected) {
      toast.error('No active project or deployment URL found');
      return;
    }

    const selectedRecord = arnsRecords.find(
      (record) => record.name === data.selectedArns
    );

    if (!selectedRecord) {
      toast.error('Selected ARNS domain not found');
      return;
    }

    setIsMigrating(true);
    try {
      const { ANT, ArconnectSigner } = await import('@ar.io/sdk');

      if (!window.arweaveWallet) {
        throw new Error('ArConnect wallet not found');
      }

      const ant = ANT.init({
        processId: selectedRecord.processId,
        signer: new ArconnectSigner(window.arweaveWallet),
      });

      // Extract transaction ID from deployment URL
      const txIdMatch =
        activeProject.deploymentUrl.match(/\/([a-zA-Z0-9_-]+)$/);
      if (!txIdMatch) {
        throw new Error('Invalid deployment URL format');
      }

      const transactionId = txIdMatch[1];
      const undername = data.undername?.trim() || '@';

      let result;
      if (undername === '@' || !undername) {
        // Set as base domain
        result = await ant.setBaseNameRecord(
          {
            transactionId,
            ttlSeconds: 300,
          },
          {
            tags: [
              { name: 'App-Name', value: 'Anon' },
              { name: 'Project-Id', value: activeProject.projectId },
              { name: 'Project-Name', value: activeProject.title },
              { name: 'Timestamp', value: new Date().toISOString() },
            ],
          }
        );
      } else {
        // Set as undername
        result = await ant.setUndernameRecord(
          {
            undername,
            transactionId,
            ttlSeconds: 300,
          },
          {
            tags: [
              { name: 'App-Name', value: 'Anon' },
              { name: 'Project-Id', value: activeProject.projectId },
              { name: 'Project-Name', value: activeProject.title },
              { name: 'Timestamp', value: new Date().toISOString() },
            ],
          }
        );
      }

      const finalUrl =
        undername === '@' || !undername
          ? `https://${selectedRecord.name}.ar.io`
          : `https://${undername}_${selectedRecord.name}.ar.io`;

      setCurrentMapping({
        domain: finalUrl,
        url: activeProject.deploymentUrl,
      });

      toast.success(
        `Successfully mapped ${activeProject.title} to ${finalUrl}${result?.id ? ` (TX: ${result.id.slice(0, 8)}...)` : ''}`,
        { duration: 5000 }
      );

      // Reset form
      form.reset();
    } catch (error) {
      console.error('Migration error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Migration failed';
      toast.error(`Failed to map domain: ${errorMessage}`);
    } finally {
      setIsMigrating(false);
    }
  };

  // Load ARNS records when component mounts
  useEffect(() => {
    if (connected && address) {
      fetchArnsRecords();
    }
  }, [connected, address, fetchArnsRecords]);

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    migrateToArns(data);
  };

  useEffect(() => {
    async function getReservedName() {
      const { ARIO } = await import('@ar.io/sdk');
      const ario = ARIO.mainnet();

      const reservedName = await ario.getArNSReservedName({ name: 'aykansal' });
      console.log(reservedName);
    }
    getReservedName();
  }, []);

  if (!connected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            title="Custom Domain"
            aria-label="Custom Domain"
          >
            <Settings size={16} className="text-primary/80" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="start">
          <DropdownMenuLabel>Custom Domain</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-4 text-center text-sm text-muted-foreground">
            Connect your wallet to manage ARNS domains
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (!activeProject) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            title="Custom Domain"
            aria-label="Custom Domain"
          >
            <Settings size={16} className="text-primary/80" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="start">
          <DropdownMenuLabel>Custom Domain</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-4 text-center text-sm text-muted-foreground">
            No active project selected
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          title="Custom Domain"
          aria-label="Custom Domain"
        >
          <Globe size={16} className="text-primary/80" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={`w-96 ${className}`} align="start">
        <div className="flex justify-between">
          <DropdownMenuLabel className="flex items-center gap-2">
            Link ARNS Domain
          </DropdownMenuLabel>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchArnsRecords}
            disabled={isLoading}
            className=" h-8"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <div className="px-1.5 py-1 space-y-4">
            {/* <Card className="p-2">
              <CardContent className="space-y-2">
                <div className="text-sm font-medium">{activeProject.title}</div>
                <div className="text-xs text-muted-foreground">
                  {activeProject.deploymentUrl ? (
                    <a
                      href={activeProject.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <span className="truncate">
                        {activeProject.deploymentUrl}
                      </span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    'No deployment URL'
                  )}
                </div>
              </CardContent>
            </Card> */}

            {currentMapping && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600">
                    Active Mapping
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-600" />
                    <a
                      href={currentMapping.domain}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-green-600 hover:underline"
                    >
                      {currentMapping.domain}
                    </a>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Points to: {currentMapping.url}
                  </div>
                </CardContent>
              </Card>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading domains...</span>
                  </div>
                ) : arnsRecords.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No ARNS domains found.{' '}
                    <Button variant="link" className="p-0 h-auto text-xs">
                      Purchase domains
                    </Button>
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="selectedArns"
                      render={({ field }) => (
                        <FormItem>
                          {/* <FormLabel className="text-xs">
                            Select ARNS Domain
                          </FormLabel> */}
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Choose domain" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {arnsRecords.map((record) => (
                                <SelectItem
                                  key={record.name}
                                  value={record.name}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{record.name}.ar.io</span>
                                    {record.isPrimary && (
                                      <Badge
                                        variant="secondary"
                                        className="ml-2 text-xs"
                                      >
                                        Primary
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="undername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            Subdomain (optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="eg. xyz_domain.ar.io"
                              className="h-8"
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            {field.value
                              ? `Will create: ${field.value}_${form.watch('selectedArns') || 'domain'}.ar.io`
                              : `default: ${form.watch('selectedArns') || 'domain'}.ar.io`}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-8"
                      disabled={isMigrating || !activeProject.deploymentUrl}
                    >
                      {isMigrating ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Mapping...
                        </>
                      ) : (
                        <>
                          {/* <Link2 className="mr-2 h-3 w-3" /> */}
                          Publish
                        </>
                      )}
                    </Button>

                    {!activeProject.deploymentUrl && (
                      <div className="text-xs text-destructive text-center">
                        Project must be deployed before mapping a domain
                      </div>
                    )}
                  </>
                )}
              </form>
            </Form>
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
