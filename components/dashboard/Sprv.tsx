import React, { useEffect, useState } from 'react';
import { SandpackPreview, useSandpack } from '@codesandbox/sandpack-react';
import { useGlobalState } from '@/hooks';
import { Maximize, Minimize } from 'lucide-react';

const Sprv = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { sandpack } = useSandpack();
  const codebase = useGlobalState((state) => state.codebase);

  const refreshSandpack = async () => {
    try {
      setIsRefreshing(true);
      await sandpack.runSandpack();
      console.log('[SPRV] sandpack_status', sandpack.status);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshSandpack();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codebase]);

  return (
    <div
      className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative h-full'}`}
    >
      <div className="absolute top-2 right-2 z-[60] flex gap-2">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
        <button
          onClick={refreshSandpack}
          className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Preview'}
        </button>
      </div>

      <div className="h-full">
        {isRefreshing ? (
          <div className="flex items-center justify-center h-full bg-background">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <SandpackPreview
            showNavigator={false}
            style={{ height: '100%' }}
            showRefreshButton={true}
            onReset={() => {
              console.log('Resetting...');
            }}
            showOpenInCodeSandbox={false}
            showRestartButton={true}
            showSandpackErrorOverlay={false}
          />
        )}
      </div>
    </div>
  );
};

export default Sprv;
