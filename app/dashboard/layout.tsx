'use client';

import React from 'react';
import { ModalProvider } from '@/context/ModalContext';
import { WalletProvider } from '@/context/WalletContext';
import { GitHubProvider } from '@/context/GitHubContext';
import { ProjectProvider } from '@/context/ProjectContext';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <WalletProvider>
      <ProjectProvider>
        <ModalProvider>
          <GitHubProvider>{children}</GitHubProvider>
        </ModalProvider>
      </ProjectProvider>
    </WalletProvider>
  );
};

export default Layout;
