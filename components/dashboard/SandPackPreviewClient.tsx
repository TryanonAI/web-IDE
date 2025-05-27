'use client';

import React, { Suspense, lazy, useMemo, useEffect } from 'react';
import {
  useSandpack,
  type SandpackPreviewRef,
} from '@codesandbox/sandpack-react';
import { toast } from 'sonner';
import {
  getSandpackClient,
  getCodeSandboxURL,
  copyDeploymentLink,
} from '@/lib/sandpack/sandpackUtils';
import SandpackErrorBoundary from './SandpackErrorBoundary';
import SandpackModuleLoader from './SandpackModuleLoader';
import { registerSandpackCacheListener } from '@/lib/sandpack/sandpackCache';
import { useGlobalState } from '@/hooks/global-state';
import { SandpackAction } from '@/types';

// Dynamically import the SandpackPreview component to reduce initial bundle size
const SandpackPreview = lazy(() =>
  import('@codesandbox/sandpack-react').then((mod) => ({
    default: mod.SandpackPreview,
  }))
);

// Loading component for Sandpack preview
const SandpackLoading = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <p className="text-gray-600">Loading code preview...</p>
      <div className="mt-2 w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
    </div>
  </div>
);

const SandPackPreviewClient = () => {
  const { sandpack } = useSandpack();
  const { sandpackAction } = useGlobalState();
  const previewRef = React.useRef<SandpackPreviewRef>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [cacheEnabled, setCacheEnabled] = React.useState(true);

  const dependencies = useMemo(() => {
    interface ExtendedSandpack {
      sandboxInfo?: {
        dependencies?: Record<string, string>;
      };
    }
    const extendedSandpack = sandpack as unknown as ExtendedSandpack;
    return extendedSandpack.sandboxInfo?.dependencies || {};
  }, [sandpack]);

  useEffect(() => {
    if (cacheEnabled && Object.keys(dependencies).length > 0) {
      console.log('Setting up cache listener for dependencies:', dependencies);
      registerSandpackCacheListener(dependencies);
    }
  }, [dependencies, cacheEnabled]);

  const handleSandpackAction = async () => {
    try {
      setIsLoading(true);
      console.log(
        '[SandPackPreviewClient] Handling SandPack action:',
        sandpackAction
      );

      const clientData = await getSandpackClient(previewRef);
      if (!clientData) {
        setIsLoading(false);
        return;
      }

      const { client, clientId } = clientData;

      if (!sandpack.clients[clientId]) {
        console.warn('Client not found in sandpack clients');
        toast.error('Preview client not properly initialized');
        setIsLoading(false);
        return;
      }

      const result = await getCodeSandboxURL(client);
      if (!result) {
        setIsLoading(false);
        return;
      }

      if (sandpackAction === SandpackAction.DEPLOY) {
        copyDeploymentLink(result.sandboxId);
      } else if (sandpackAction === SandpackAction.EXPORT) {
        window.open(result.editorUrl);
      }
    } catch (err) {
      console.error('[SandPackPreviewClient] Error in handling action:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error(`Failed to ${sandpackAction}`);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (
      sandpackAction === SandpackAction.DEPLOY ||
      sandpackAction === SandpackAction.EXPORT
    ) {
      handleSandpackAction();
    }
  }, [sandpackAction, sandpack]);

  // Toggle cache method
  const toggleCache = () => {
    setCacheEnabled((prev) => {
      const newValue = !prev;
      toast.info(`Dependency caching ${newValue ? 'enabled' : 'disabled'}`);
      return newValue;
    });
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4 rounded-md">
        <div className="text-red-500">
          <h3 className="font-bold">Preview Error</h3>
          <p>{error.message || 'Failed to load preview'}</p>
          <button
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={() => {
              setError(null);
              handleSandpackAction();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <SandpackModuleLoader
      dependencies={dependencies}
      enableCache={cacheEnabled}
    >
      <SandpackErrorBoundary>
        <Suspense fallback={<SandpackLoading />}>
          <div className="relative w-full h-full">
            <SandpackPreview
              ref={previewRef}
              showNavigator={true}
              style={{ height: '100%' }}
            />
            {isLoading && (
              <div className="absolute top-0 right-0 m-2">
                <div className="flex items-center bg-blue-500 text-white px-3 py-1 rounded text-xs">
                  <div className="w-3 h-3 mr-2 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                  Loading...
                </div>
              </div>
            )}
            <div className="absolute bottom-2 right-2 flex space-x-2">
              <button
                onClick={toggleCache}
                className={`text-xs px-2 py-1 rounded ${cacheEnabled ? 'bg-green-500' : 'bg-gray-400'} text-white`}
                title={
                  cacheEnabled
                    ? 'Disable dependency caching'
                    : 'Enable dependency caching'
                }
              >
                {cacheEnabled ? '🔄 Cache On' : '⏹ Cache Off'}
              </button>
            </div>
          </div>
        </Suspense>
      </SandpackErrorBoundary>
    </SandpackModuleLoader>
  );
};

export default SandPackPreviewClient;
