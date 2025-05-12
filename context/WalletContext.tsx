'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { toast } from 'sonner';
import {
  connectWallet as connectArweaveWallet,
  disconnectWallet as disconnectArweaveWallet,
  getWalletDetails,
} from '@/lib/arkit';
import axios from 'axios';

// Define enum for wallet status for better type safety
export enum WalletStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

// Define enum for connection results
export enum WalletConnectionResult {
  CONNECTED = 'connected',
  USER_CANCELLED = 'cancelled',
  ERROR = 'error',
}

// Define interface for wallet connection response
export interface WalletConnectionResponse {
  status: WalletConnectionResult;
  message?: string;
  error?: Error;
}

// Update the context type with the enum
interface WalletContextType {
  walletAddress: string;
  walletStatus: WalletStatus;
  isConnecting: boolean;
  error: string | null;
  hasTrialAvailable: boolean;
  isShowingAccessModal: boolean;
  showAccessRequiredModal: (show: boolean) => void;
  connectToWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  // @ts-expect-error ignore
  user: User | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletStatus, setWalletStatus] = useState<WalletStatus>(
    WalletStatus.DISCONNECTED
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTrialAvailable, setHasTrialAvailable] = useState<boolean>(false);
  const [isShowingAccessModal, setIsShowingAccessModal] =
    useState<boolean>(false);
  // @ts-expect-error ignore
  const [user, setUser] = useState<User | null>(null);

  /**
   * Fetch user data from the backend
   */
  const fetchUserData = async (address: string) => {
    try {
      console.log(`Fetching user data for address: ${address}`);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${address}`
      );

      if (response.data && response.data.user) {
        console.log('User data retrieved successfully:', response.data.user);
        return response.data.user;
      }

      console.warn('No user data found in response:', response.data);
      return null;
    } catch (error) {
      // Check if it's a 404 error, which is expected for new users
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(
          `User not found (404) for address: ${address} - This is normal for new users`
        );
      } else if (axios.isAxiosError(error)) {
        console.error(
          `Error fetching user data (${error.response?.status || 'unknown status'}):`,
          error.message
        );
      } else {
        console.error('Unknown error fetching user data:', error);
      }
      return null;
    }
  };

  // Check wallet connection on component mount
  useEffect(() => {
    const checkWalletConnection = async (): Promise<void> => {
      try {
        if (typeof window !== 'undefined' && window.arweaveWallet) {
          const permissions = await window.arweaveWallet?.getPermissions();

          if (permissions && permissions.length > 0) {
            // If we have permissions, get the address using arkit.ts getWalletDetails
            try {
              const details = await getWalletDetails();
              if (details.walletAddress) {
                setWalletAddress(details.walletAddress);
                setWalletStatus(WalletStatus.CONNECTED);
                console.log('Wallet already connected:', details.walletAddress);

                // Check if user has trial access
                const userData = await fetchUserData(details.walletAddress);
                if (userData) {
                  setHasTrialAvailable(userData.hasTrialAvailable);
                  setUser(userData);
                  // If no trial available, show access modal
                  if (!userData.hasTrialAvailable) {
                    setIsShowingAccessModal(true);
                  }
                }

                return;
              }
            } catch (err) {
              console.log('Error getting wallet details', err);
            }
          }
        }

        setWalletStatus(WalletStatus.DISCONNECTED);
      } catch (err) {
        console.error('Error checking wallet connection:', err);
        setWalletStatus(WalletStatus.ERROR);
        setError('Failed to check wallet connection');
      }
    };
    // Wait for arweave wallet to be injected
    if (typeof window !== 'undefined') {
      if (window.arweaveWallet) {
        checkWalletConnection();
      } else {
        // Listen for wallet load
        window.addEventListener('arweaveWalletLoaded', () => {
          checkWalletConnection();
        });
      }

      // Cleanup event listener
      return () => {
        window.removeEventListener('arweaveWalletLoaded', () => {
          checkWalletConnection();
        });
      };
    }
  }, []);

  // Listen for wallet switch events
  useEffect(() => {
    const handleWalletSwitch = async (e: CustomEvent): Promise<void> => {
      console.log('Wallet switched to new address:', e.detail?.address);
      if (e.detail?.address) {
        setWalletAddress(e.detail.address);
        setWalletStatus(WalletStatus.CONNECTED);

        try {
          // First, try to fetch existing user data
          let userData = await fetchUserData(e.detail.address);

          // If no user data exists (404 happened), create the user
          if (!userData) {
            console.log(
              'User not found, creating new user for wallet:',
              e.detail.address
            );
            try {
              const createResponse = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/create`,
                { walletAddress: e.detail.address }
              );

              if (createResponse.data?.user) {
                console.log(
                  'User created on wallet switch:',
                  createResponse.data.user
                );
                userData = createResponse.data.user;

                // Add a small delay to ensure backend processing is complete
                await new Promise((resolve) => setTimeout(resolve, 500));
              } else {
                console.error(
                  'User creation response missing user data:',
                  createResponse.data
                );
                throw new Error('Failed to create user: Invalid response data');
              }
            } catch (createErr) {
              console.error('Error creating user on wallet switch:', createErr);
              throw createErr; // Rethrow to be caught by outer catch
            }
          }

          // If we have user data (either fetched or created), update state
          if (userData) {
            console.log('Setting user data in state:', userData);
            setUser(userData);
            setHasTrialAvailable(userData.hasTrialAvailable);

            if (!userData.hasTrialAvailable) {
              setIsShowingAccessModal(true);
            }
          } else {
            // This should not happen with the improved error handling above
            throw new Error('Failed to get or create user data');
          }
        } catch (error) {
          console.error('Error handling wallet switch:', error);
          // Reset to safe default state
          setHasTrialAvailable(false);
          setIsShowingAccessModal(true);
          toast.error('Error syncing wallet. Please try again.');
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'walletSwitch',
        handleWalletSwitch as unknown as EventListener
      );
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'walletSwitch',
          handleWalletSwitch as unknown as EventListener
        );
      }
    };
  }, []);

  /**
   * Connect to wallet and handle different connection scenarios
   */
  const connectToWallet = async (): Promise<boolean> => {
    if (walletStatus === WalletStatus.CONNECTED) {
      return true; // Already connected
    }

    try {
      setIsConnecting(true);
      setWalletStatus(WalletStatus.CONNECTING);
      setError(null);

      // Check if wallet is available
      if (typeof window === 'undefined' || !window.arweaveWallet) {
        throw new Error(
          'Arweave wallet extension not found. Please install a compatible wallet.'
        );
      }

      // Use the updated connectWallet from arkit.ts
      const connectionResult = await connectArweaveWallet();

      switch (connectionResult.status) {
        case WalletConnectionResult.CONNECTED:
          // Get wallet details using arkit.ts getWalletDetails
          const details: { walletAddress: string; balance: number } =
            await getWalletDetails();
          setWalletAddress(details.walletAddress);
          setWalletStatus(WalletStatus.CONNECTED);

          try {
            // First try to fetch existing user
            let userData = await fetchUserData(details.walletAddress);

            // If user doesn't exist, create a new one
            if (!userData) {
              console.log(
                'Creating new user for wallet:',
                details.walletAddress
              );
              const createResponse = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/create`,
                { walletAddress: details.walletAddress }
              );

              if (!createResponse.data?.user) {
                throw new Error('Failed to create user: Invalid response data');
              }

              userData = createResponse.data.user;
              console.log('User created successfully:', userData);

              // Add a small delay to ensure backend processing is complete
              await new Promise((resolve) => setTimeout(resolve, 500));
            }

            console.log('Setting user data in state:', userData);
            setUser(userData);
            setHasTrialAvailable(userData.hasTrialAvailable);

            // If trial is not available, show the access required modal
            if (!userData.hasTrialAvailable) {
              console.log('Trial not available, showing access modal');
              setIsShowingAccessModal(true);
            }

            return true;
          } catch (userErr) {
            console.error('Error creating/fetching user:', userErr);
            throw new Error('Failed to complete user setup. Please try again.');
          }

        case WalletConnectionResult.USER_CANCELLED:
          console.log('User cancelled the wallet connection');
          setWalletStatus(WalletStatus.DISCONNECTED); // Reset to disconnected state
          return false;

        case WalletConnectionResult.ERROR:
        default:
          throw (
            connectionResult.error ||
            new Error(
              connectionResult.message || 'Unknown wallet connection error'
            )
          );
      }
    } catch (err) {
      console.error('Error connecting to wallet:', err);
      setWalletStatus(WalletStatus.ERROR);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      console.log('Wallet Connection Process Complete');
      setIsConnecting(false);
    }
  };

  /**
   * Disconnect the wallet
   */
  const handleDisconnectWallet = (): void => {
    try {
      // Use disconnectWallet from arkit.ts
      disconnectArweaveWallet();
      setWalletAddress('');
      setWalletStatus(WalletStatus.DISCONNECTED);
      setUser(null);
      setHasTrialAvailable(false);
      toast.info('Wallet disconnected');
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to disconnect wallet';
      toast.error(errorMessage);
    }
  };

  /**
   * Show or hide the access required modal
   */
  const showAccessRequiredModal = (show: boolean): void => {
    setIsShowingAccessModal(show);
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        walletStatus,
        isConnecting,
        error,
        hasTrialAvailable,
        isShowingAccessModal,
        showAccessRequiredModal,
        connectToWallet,
        disconnectWallet: handleDisconnectWallet,
        user,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Custom hook to use the wallet context
 */
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
