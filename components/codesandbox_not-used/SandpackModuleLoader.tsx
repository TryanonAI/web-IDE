'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  registerSandpackCacheListener,
  clearDependencyCache,
} from '@/lib/sandpack/sandpackCache';

interface SandpackModuleLoaderProps {
  children: React.ReactNode;
  dependencies?: Record<string, string>;
  enableCache?: boolean;
}

let sandpackLoaded = false;

/**
 * A component to preload and handle Sandpack modules with caching and retry capability
 */
const SandpackModuleLoader: React.FC<SandpackModuleLoaderProps> = ({
  children,
  dependencies = {},
  enableCache = true,
}) => {
  const [loading, setLoading] = useState(!sandpackLoaded);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [cacheStatus, setCacheStatus] = useState<
    'idle' | 'checking' | 'hit' | 'miss'
  >('idle');

  useEffect(() => {
    // Skip if already loaded
    if (sandpackLoaded) {
      return;
    }

    const loadSandpackModules = async () => {
      try {
        console.log('Preloading Sandpack modules...');
        setLoading(true);
        setError(null);

        if (enableCache && Object.keys(dependencies).length > 0) {
          setCacheStatus('checking');
          console.log('Setting up dependency cache for:', dependencies);
          // Register cache listener for these dependencies
          registerSandpackCacheListener(dependencies);
        }

        // Dynamically import key Sandpack modules with error handling
        await Promise.all([
          // Load the main Sandpack React module
          import('@codesandbox/sandpack-react').then(() => {
            console.log('Successfully loaded Sandpack React module');
          }),

          // Ensure the client is preloaded
          import('@codesandbox/sandpack-client').then(() => {
            console.log('Successfully loaded Sandpack client');
          }),
        ]);

        // Try to preload the problematic runtime module dynamically
        try {
          // Use dynamic import with string to avoid TypeScript errors
          // This path might need adjustment based on the actual package structure
          const runtimeImport = '@codesandbox/sandpack-client/dist/index';
          await import(/* webpackIgnore: true */ runtimeImport);
          console.log('Successfully preloaded Sandpack runtime client');
        } catch (e) {
          // Safe error handling for unknown error type
          const errorMessage = e instanceof Error ? e.message : 'Unknown error';
          console.warn(
            'Could not preload runtime directly, but continuing...',
            errorMessage
          );
        }

        console.log('Sandpack modules preloaded successfully');
        sandpackLoaded = true;
        setCacheStatus('hit'); // We'll let the actual client update this if it's a miss
      } catch (err) {
        console.error('Error preloading Sandpack modules:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setCacheStatus('miss');

        if (retryCount < 3) {
          // Auto-retry with exponential backoff
          const retryDelay = Math.pow(2, retryCount) * 1000;
          toast.error(
            `Failed to load code editor modules. Retrying in ${retryDelay / 1000}s...`,
            {
              duration: retryDelay,
            }
          );

          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, retryDelay);
        } else {
          toast.error(
            'Failed to load code editor after multiple attempts. Please refresh the page.'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadSandpackModules();
  }, [retryCount, dependencies, enableCache]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const handleClearCache = () => {
    clearDependencyCache();
    toast.success('Dependency cache cleared. Reloading...');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-md">
        <div className="text-center p-4">
          <div className="mb-4 w-10 h-10 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <h3 className="text-lg font-medium text-gray-700">
            Loading code editor...
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            {cacheStatus === 'checking'
              ? 'Checking dependency cache...'
              : 'Please wait while we set up the environment'}
          </p>
          {retryCount > 0 && (
            <div className="mt-3 text-xs text-amber-600">
              Retry attempt {retryCount}/3
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4 rounded-md">
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-700">
            Failed to load code editor
          </h3>
          <p className="text-sm text-gray-500 mt-2 mb-4">{error.message}</p>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 justify-center">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SandpackModuleLoader;
