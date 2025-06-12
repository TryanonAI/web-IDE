'use client';

import { useEffect } from 'react';
import { monkeyPatchSandpack } from '@/lib/sandpack/monkeyPatchSandpack';

/**
 * This component initializes client-side only functionality
 * It should be imported in the app layout
 */
const ClientInitializer: React.FC = () => {
  useEffect(() => {
    // Initialize Sandpack caching
    const initializeSandpack = async () => {
      try {
        console.log('Initializing Sandpack caching...');
        monkeyPatchSandpack();
      } catch (error) {
        console.error('Failed to initialize Sandpack caching:', error);
      }
    };

    // Initialize client-side only features
    initializeSandpack();

    // Monitor localStorage for cache settings changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sandpack-cache-enabled') {
        console.log('Sandpack cache settings changed:', e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default ClientInitializer;
