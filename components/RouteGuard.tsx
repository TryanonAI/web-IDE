'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

// Public routes that don't require trial access
const publicRoutes = ['/'];

export default function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const { walletStatus, hasTrialAvailable, showAccessRequiredModal } = useWallet();

  useEffect(() => {
    const isPublicRoute = publicRoutes.some((route) => pathname === route);
    const isDashboardRoute = pathname.includes('/dashboard');
    
    if (walletStatus === 'connected' && !isPublicRoute && !hasTrialAvailable && !isDashboardRoute) {
      console.log('Access restricted: showing modal for non-dashboard route');
      showAccessRequiredModal(true);
    } else {
      showAccessRequiredModal(false);
    }
  }, [pathname, walletStatus, hasTrialAvailable, showAccessRequiredModal]);

  return <>{children}</>;
}
