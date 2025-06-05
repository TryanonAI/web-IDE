'use client';

import React, { useEffect } from 'react';
import { useWallet } from '@/hooks';
import { toast } from 'sonner';
import { notifyNoWallet } from '@/hooks/use-mobile';

const CheckConnection = ({ children }: { children: React.ReactNode }) => {
  const setWalletLoaded = useWallet((state) => state.setWalletLoaded);
  const updateAddress = useWallet((state) => state.updateAddress);
  const connect = useWallet((state) => state.connect);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.arweaveWallet) {
      notifyNoWallet();
    }

    const handleWalletLoaded = async (e: CustomEvent) => {
      setWalletLoaded(true);
      const { permissions } = await e.detail;
      if (permissions.length === 0 && window.arweaveWallet) {
        await connect();
      }
      // else if (window.arweaveWallet) {
      //   // const address = await window.arweaveWallet.getActiveAddress();
      //   // updateAddress(address);
      // }
    };

    const handleWalletSwitch = async (e: CustomEvent) => {
      const { address } = e.detail;
      if (address) {
        try {
          // await connect();
          updateAddress(address);
          const saddress = useWallet.getState().shortAddress;
          toast.info(`Connected ${saddress}`);
        } catch (error) {
          console.error('Error connecting to wallet:', error);
        }
      }
    };

    window.addEventListener('arweaveWalletLoaded', handleWalletLoaded);
    window.addEventListener('walletSwitch', handleWalletSwitch);

    return () => {
      window.removeEventListener('arweaveWalletLoaded', handleWalletLoaded);
      window.removeEventListener('walletSwitch', handleWalletSwitch);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
};

export default CheckConnection;
