'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import AccessRequiredModal from '@/components/AccessRequiredModal';
import { usePathname } from 'next/navigation';

interface AccessControlWrapperProps {
  children: React.ReactNode;
}

/**
 * Provides access control for general app pages (non-dashboard routes)
 * Dashboard pages have their own access control directly in dashboard/page.tsx
 * This component only shows modals for general routes, never for dashboard
 */
export default function AccessControlWrapper({ children }: AccessControlWrapperProps) {
  const { isShowingAccessModal, showAccessRequiredModal } = useWallet();
  const pathname = usePathname();
  const isDashboardPage = pathname.includes('/dashboard');

  const handleCloseModal = () => {
    showAccessRequiredModal(false);
  };

  return (
    <>
      {children}
      {!isDashboardPage && (
        <AccessRequiredModal 
          isOpen={isShowingAccessModal} 
          onClose={handleCloseModal} 
        />
      )}
    </>
  );
} 