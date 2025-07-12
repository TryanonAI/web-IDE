'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@/hooks';
import {
  ARIO,
  mARIOToken,
  ArconnectSigner,
  AoArNSNameData,
  ANTRegistry,
} from '@ar.io/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Plus, Loader2, User, Clock, Infinity } from 'lucide-react';
import { toast } from 'sonner';
import { spawnProcess } from '@/lib/arkit';

interface PrimaryName {
  name: string;
  owner: string;
  startTimestamp: number;
}

const ARNS = () => {
  const { connected, address } = useWallet();

  // Left pane state - existing primary names
  const [primaryNames, setPrimaryNames] = useState<PrimaryName[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingPrimaryNames, setIsLoadingPrimaryNames] = useState(false);

  // Right pane state - new name registration
  const [newNameInput, setNewNameInput] = useState('');
  const [debouncedNameInput, setDebouncedNameInput] = useState('');
  const [selectedYears, setSelectedYears] = useState(1);
  const [purchaseType, setPurchaseType] = useState<'lease' | 'permabuy'>(
    'lease'
  );
  const [nameAvailability, setNameAvailability] = useState<{
    available: boolean;
    record?: AoArNSNameData;
    pricing?: {
      lease1Year: number;
      lease2Years: number;
      lease3Years: number;
      lease4Years: number;
      lease5Years: number;
      permabuy: number;
    };
    loading: boolean;
  }>({ available: false, loading: false });
  const [isRegistering, setIsRegistering] = useState(false);

  // State to prevent unnecessary re-renders and API calls
  const [lastAddress, setLastAddress] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce effect for name input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNameInput(newNameInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [newNameInput]);

  // Fetch user's primary names - optimized to prevent loops
  const fetchPrimaryNames = useCallback(async () => {
    if (!connected || !address) return;

    // Prevent duplicate requests for the same address
    if (lastAddress === address) return;

    setIsLoadingPrimaryNames(true);
    setLastAddress(address);

    try {
      const ario = ARIO.mainnet();
      const primaryName = await ario.getPrimaryName({ address });
      console.log(primaryName);
      if (primaryName) {
        setPrimaryNames([primaryName]);
      } else {
        setPrimaryNames([]);
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Primary name data not found')
      ) {
        console.log(error);
        setPrimaryNames([]);
        return;
      }
      console.error('Error fetching primary names:', error);
      setPrimaryNames([]);
      setLastAddress(null);
    } finally {
      setIsLoadingPrimaryNames(false);
    }
  }, [connected, address, lastAddress]);

  const fetchAllAnts = useCallback(async (address: string) => {
    const antRegistry = ANTRegistry.init({
      signer: new ArconnectSigner(window.arweaveWallet),
    });
    const ario = ARIO.init();

    const acl = await antRegistry.accessControlList({
      address,
    });
    const allARNS = await ario.getArNSRecords({
      filters: {
        processId: {
          ...acl.Owned,
          ...acl.Controlled,
        },
      },
    });

    console.log(allARNS);
  }, []);

  const checkNameAvailability = useCallback(async (name: string) => {
    if (!name || name.length < 1) {
      setNameAvailability({ available: false, loading: false });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const currentController = abortControllerRef.current;

    setNameAvailability((prev) => ({ ...prev, loading: true }));

    try {
      // Create ARIO instance for this operation
      const ario = ARIO.testnet();
      // Check if name exists
      const record = await ario.getArNSRecord({ name });

      // Check if request was aborted
      if (currentController.signal.aborted) return;

      if (record) {
        // Name is taken
        setNameAvailability({
          available: false,
          record,
          loading: false,
        });
      } else {
        // Name is available, prefetch all pricing options
        try {
          const [
            lease1Year,
            lease2Years,
            lease3Years,
            lease4Years,
            lease5Years,
            permabuy,
          ] = await Promise.all([
            ario.getTokenCost({
              intent: 'Buy-Name',
              name,
              type: 'lease',
              years: 1,
            }),
            ario.getTokenCost({
              intent: 'Buy-Name',
              name,
              type: 'lease',
              years: 2,
            }),
            ario.getTokenCost({
              intent: 'Buy-Name',
              name,
              type: 'lease',
              years: 3,
            }),
            ario.getTokenCost({
              intent: 'Buy-Name',
              name,
              type: 'lease',
              years: 4,
            }),
            ario.getTokenCost({
              intent: 'Buy-Name',
              name,
              type: 'lease',
              years: 5,
            }),
            ario.getTokenCost({
              intent: 'Buy-Name',
              name,
              type: 'permabuy',
            }),
          ]);

          // Check if request was aborted
          if (currentController.signal.aborted) return;

          setNameAvailability({
            available: true,
            pricing: {
              lease1Year,
              lease2Years,
              lease3Years,
              lease4Years,
              lease5Years,
              permabuy,
            },
            loading: false,
          });
        } catch (costError) {
          console.error('Error getting cost:', costError);
          if (!currentController.signal.aborted) {
            setNameAvailability({
              available: true,
              loading: false,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking name availability:', error);
      if (!currentController.signal.aborted) {
        // If error, assume available but show warning
        setNameAvailability({
          available: true,
          loading: false,
        });
      }
    }
  }, []); // No dependencies to prevent recreation

  // Effect to check name availability when debounced input changes
  useEffect(() => {
    if (debouncedNameInput && debouncedNameInput.trim()) {
      checkNameAvailability(debouncedNameInput.trim());
    } else {
      setNameAvailability({ available: false, loading: false });
    }
  }, [debouncedNameInput, checkNameAvailability]);

  // Initial load of primary names - only when address changes
  useEffect(() => {
    if (connected && address && lastAddress !== address) {
      fetchPrimaryNames();
      fetchAllAnts(address);
    }
  }, [connected, address, lastAddress, fetchPrimaryNames, fetchAllAnts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Filter primary names based on search
  const filteredPrimaryNames = primaryNames.filter((name) =>
    name.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle name registration with actual purchase using ARIO SDK
  const handleRegisterName = async () => {
    if (!connected || !debouncedNameInput) {
      toast.error('Please connect wallet and enter a name');
      return;
    }

    if (!nameAvailability.available || !nameAvailability.pricing) {
      toast.error('This name is not available or pricing not loaded');
      return;
    }

    // Check for wallet availability
    if (!window.arweaveWallet) {
      toast.error('ArConnect wallet not found. Please install ArConnect.');
      return;
    }

    setIsRegistering(true);

    try {
      const ario = ARIO.testnet({
        signer: new ArconnectSigner(window.arweaveWallet),
      });
      let result;

      const spawned = await spawnProcess('tryanon-deployed', [
        {
          name: 'ANT-Registry-Id',
          value: 'i_le_yKKPVstLTDSmkHRqf-wYphMnwB9OhleiTgMkWc',
        },
        {
          name: 'Authority',
          value: 'fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY',
        },
        { name: 'Referrer', value: 'tryanon' },
      ]);

      if (purchaseType === 'lease') {
        // Purchase lease for specified years
        result = await ario.buyRecord(
          {
            name: debouncedNameInput,
            type: 'lease',
            processId: spawned,
            referrer: 'Anon',
          },
          {
            // Optional tags
            tags: [
              { name: 'App-Name', value: 'Anon' },
              { name: 'Referrer', value: 'Anon' },
            ],
          }
        );

        toast.success(
          `Successfully registered ${debouncedNameInput}.ar.io for ${selectedYears} year${selectedYears === 1 ? '' : 's'}!`
        );
      } else {
        // Purchase permanent ownership
        result = await ario.buyRecord(
          {
            name: debouncedNameInput,
            type: 'permabuy',
            processId: spawned, // Will be auto-assigned by the protocol
            referrer: 'Anon', // Optional: track purchase referrals
          },
          {
            // Optional tags
            tags: [{ name: 'App-Name', value: 'Anon' }],
          }
        );

        toast.success(
          `Successfully purchased ${debouncedNameInput}.ar.io permanently!`
        );
      }

      console.log('Purchase result:', result);

      // Show transaction ID in success message
      if (result?.id) {
        toast.success(
          `Purchase successful! Transaction ID: ${result.id.slice(0, 8)}...`,
          { duration: 5000 }
        );
      }

      // Clear the form and refresh primary names
      setNewNameInput('');
      setNameAvailability({ available: false, loading: false });

      // Refresh the primary names list
      setLastAddress(null); // Force refresh
      await fetchPrimaryNames();
    } catch (error) {
      console.error('Error purchasing name:', error);

      if (error instanceof Error) {
        if (
          error.message.includes('insufficient funds') ||
          error.message.includes('Insufficient')
        ) {
          toast.error('Insufficient ARIO tokens to complete purchase');
        } else if (
          error.message.includes('name already exists') ||
          error.message.includes('Name is already registered')
        ) {
          toast.error('This name has already been registered');
        } else if (
          error.message.includes('User rejected') ||
          error.message.includes('canceled') ||
          error.message.includes('cancelled')
        ) {
          toast.error('Transaction was cancelled by user');
        } else if (error.message.includes('User denied access')) {
          toast.error(
            'Wallet access denied. Please grant permission and try again.'
          );
        } else {
          toast.error(`Failed to register name: ${error.message}`);
        }
      } else {
        toast.error('Failed to register name. Please try again.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatARIO = (marioAmount: number) => {
    return new mARIOToken(marioAmount).toARIO().valueOf().toFixed(1);
  };

  // Helper function to get price for selected year
  const getSelectedYearPrice = (
    pricing: NonNullable<typeof nameAvailability.pricing>
  ): number => {
    switch (selectedYears) {
      case 1:
        return pricing.lease1Year;
      case 2:
        return pricing.lease2Years;
      case 3:
        return pricing.lease3Years;
      case 4:
        return pricing.lease4Years;
      case 5:
        return pricing.lease5Years;
      default:
        return pricing.lease1Year;
    }
  };

  // Get current price based on purchase type
  const getCurrentPrice = (): number | null => {
    if (!nameAvailability.pricing) return null;

    if (purchaseType === 'lease') {
      return getSelectedYearPrice(nameAvailability.pricing);
    } else {
      return nameAvailability.pricing.permabuy;
    }
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
              Connect your wallet to manage ARNS names and registrations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="my-names">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50">
          <TabsTrigger value="my-names" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Names
          </TabsTrigger>
          <TabsTrigger value="register" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Register
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-names">
          <Card className="border-0 shadow-none">
            <CardContent className="p-6 space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-muted"
                />
              </div>

              {/* Loading state */}
              {isLoadingPrimaryNames && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Names list */}
              {!isLoadingPrimaryNames && (
                <div className="space-y-3">
                  {filteredPrimaryNames.length > 0 ? (
                    filteredPrimaryNames.map((name, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border border-muted/50 hover:border-muted transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">{name.name}.ar.io</div>
                          <div className="text-sm text-muted-foreground">
                            {formatTimestamp(name.startTimestamp)}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Primary
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-muted-foreground mb-2">
                        {searchQuery ? 'No names found' : 'No registered names'}
                      </div>
                      {!searchQuery && (
                        <p className="text-sm text-muted-foreground">
                          Register your first ARNS name to get started
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register">
          <Card className="border-0 shadow-none">
            <CardContent className="p-6 space-y-6">
              {/* Name input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <div className="relative">
                  <Input
                    placeholder="Enter name"
                    value={newNameInput}
                    onChange={(e) =>
                      setNewNameInput(e.target.value.toLowerCase())
                    }
                    className="pr-16 border-muted"
                  />
                  <div className="absolute right-3 top-3 text-sm text-muted-foreground">
                    .ar.io
                  </div>
                </div>
              </div>

              {/* Availability status */}
              {(nameAvailability.loading || debouncedNameInput) && (
                <div className="space-y-4">
                  {nameAvailability.loading ? (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Checking availability...
                      </span>
                    </div>
                  ) : debouncedNameInput ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {debouncedNameInput}.ar.io
                        </span>
                        <Badge
                          variant={
                            nameAvailability.available
                              ? 'default'
                              : 'destructive'
                          }
                          className="text-xs"
                        >
                          {nameAvailability.available ? 'Available' : 'Taken'}
                        </Badge>
                      </div>

                      {nameAvailability.available ? (
                        nameAvailability.pricing && (
                          <div className="space-y-6">
                            {/* Purchase type selector */}
                            <div className="space-y-3">
                              <span className="text-sm font-medium">
                                Purchase Type
                              </span>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => setPurchaseType('lease')}
                                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                                    purchaseType === 'lease'
                                      ? 'border-primary bg-primary/5'
                                      : 'border-muted/50 hover:border-muted'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div className="text-left">
                                      <div className="text-sm font-medium">
                                        Lease
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Renewable
                                      </div>
                                    </div>
                                  </div>
                                </button>

                                <button
                                  onClick={() => setPurchaseType('permabuy')}
                                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                                    purchaseType === 'permabuy'
                                      ? 'border-primary bg-primary/5'
                                      : 'border-muted/50 hover:border-muted'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Infinity className="h-4 w-4 text-muted-foreground" />
                                    <div className="text-left">
                                      <div className="text-sm font-medium">
                                        Permanent
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Own forever
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              </div>
                            </div>

                            {/* Duration selector - only show for lease */}
                            {purchaseType === 'lease' && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">
                                    Duration
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {selectedYears}{' '}
                                    {selectedYears === 1 ? 'year' : 'years'}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="5"
                                  step="1"
                                  value={selectedYears}
                                  onChange={(e) =>
                                    setSelectedYears(parseInt(e.target.value))
                                  }
                                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                  style={{
                                    background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((selectedYears - 1) / 4) * 100}%, hsl(var(--muted)) ${((selectedYears - 1) / 4) * 100}%, hsl(var(--muted)) 100%)`,
                                  }}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>1yr</span>
                                  <span>2yr</span>
                                  <span>3yr</span>
                                  <span>4yr</span>
                                  <span>5yr</span>
                                </div>
                              </div>
                            )}

                            {/* Price display */}
                            <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
                              <div>
                                <div className="text-sm font-medium">
                                  {purchaseType === 'lease'
                                    ? `${selectedYears} Year${selectedYears === 1 ? '' : 's'} Lease`
                                    : 'Permanent Ownership'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {purchaseType === 'lease'
                                    ? 'Renewable after expiration'
                                    : 'Own forever, no renewals needed'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-lg">
                                  {getCurrentPrice()
                                    ? formatARIO(getCurrentPrice()!)
                                    : '---'}{' '}
                                  <span className="text-xs text-muted-foreground font-normal">
                                    ARIO
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Button
                              onClick={handleRegisterName}
                              disabled={isRegistering || !getCurrentPrice()}
                              className="w-full"
                              size="lg"
                            >
                              {isRegistering ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Processing Transaction...
                                </>
                              ) : (
                                `Buy ${debouncedNameInput}.ar.io for ${getCurrentPrice() ? formatARIO(getCurrentPrice()!) : '---'} ARIO`
                              )}
                            </Button>
                          </div>
                        )
                      ) : nameAvailability.record ? (
                        <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                          <div className="text-sm text-muted-foreground">
                            This name is registered
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground">
                                Type:
                              </span>{' '}
                              {nameAvailability.record.type}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Since:
                              </span>{' '}
                              {formatTimestamp(
                                nameAvailability.record.startTimestamp
                              )}
                            </div>
                            {nameAvailability.record.type === 'lease' && (
                              <div>
                                <span className="text-muted-foreground">
                                  Expires:
                                </span>{' '}
                                {formatTimestamp(
                                  nameAvailability.record.endTimestamp
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
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
