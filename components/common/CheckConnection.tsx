'use client';

import React, { useEffect } from 'react';
import { useGlobalState, useWallet } from '@/hooks';
import { notifyNoWallet } from '@/hooks/use-mobile';

const CheckConnection = ({ children }: { children: React.ReactNode }) => {
  const {
    setWalletLoaded,
    checkWalletStatus,
    syncWithWallet,
    isWalletAvailable,
  } = useWallet();
  const { refreshGlobalState } = useGlobalState();

  useEffect(() => {
    refreshGlobalState();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial wallet check
    if (!isWalletAvailable()) {
      notifyNoWallet();
      return;
    }

    // Set wallet as loaded and perform initial sync
    setWalletLoaded(true);
    syncWithWallet();

    // The main wallet event handling is now done in useWallet.ts
    // We just need to trigger additional checks here if needed
    const handleWalletLoaded = async () => {
      console.log('[CheckConnection] Wallet loaded event received');
      setWalletLoaded(true);
      await syncWithWallet();
    };

    const handleWalletSwitch = async () => {
      console.log('[CheckConnection] Wallet switch event received');
      // The actual address update is handled in useWallet.ts
      // We just trigger a status check here for extra safety
      await checkWalletStatus();
    };

    // Add event listeners (these work alongside the ones in useWallet.ts)
    window.addEventListener('arweaveWalletLoaded', handleWalletLoaded);
    window.addEventListener('disconnect', (e) => {
      console.log('disconnect');
      console.log(e)
    });
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
