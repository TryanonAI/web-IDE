'use client';

import { useState, useEffect } from 'react';

export function useMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Set initial value on mount
    setIsMobile(window.innerWidth < breakpoint);

    // Handler for window resize events
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}

export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export default useMobile;

import { toast } from 'sonner';

export const notifyNoWallet = () => {
  toast.error('No wallet detected', {
    description: 'Please install the Wander app to continue',
    action: {
      label: 'Install',
      onClick: () => {
        window.open(
          'https://www.wander.app/download?tab=download-browser',
          '_blank'
        );
      },
    },
  });
};
