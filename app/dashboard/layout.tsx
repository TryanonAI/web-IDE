'use client';

import React from 'react';
import { ModalProvider } from '@/context/ModalContext';
import { WalletProvider, useWallet } from '@/context/WalletContext';
import { GitHubProvider } from '@/context/GitHubContext';
import { ProjectProvider } from '@/context/ProjectContext';
import RestrictedAccessView from '@/components/dashboard/RestrictedAccessView';
import { Button } from '@/components/ui/button';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <WalletProvider>
      <ProjectProvider>
        <ModalProvider>
          <GitHubProvider>
            <DashboardAccessControl>{children}</DashboardAccessControl>
          </GitHubProvider>
        </ModalProvider>
      </ProjectProvider>
    </WalletProvider>
  );
};

function DashboardAccessControl({ children }: { children: React.ReactNode }) {
  const { hasTrialAvailable, walletStatus, disconnectWallet } = useWallet();

  if (walletStatus === 'connected' && !hasTrialAvailable) {
    return (
      <div className="flex flex-col h-screen">
        {walletStatus === 'connected' && (
          <header className="flex justify-end p-4">
            <Button className='z-[60] cursor-pointer' onClick={disconnectWallet}>Disconnect Wallet</Button>
          </header>
        )}
        <RestrictedAccessView />
      </div>
    );
  }

  return <>{children}</>;
}

export default Layout;
