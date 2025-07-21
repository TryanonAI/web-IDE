import { useEffect } from 'react';
import { SandpackPreview, useSandpack } from '@codesandbox/sandpack-react';
import { useGlobalState } from '@/hooks';

interface SprvProps {
  onRefreshClick?: () => void;
  isRefreshing?: boolean;
}

const Sprv = ({ onRefreshClick, isRefreshing = false }: SprvProps) => {
  const { sandpack } = useSandpack();
  const codebase = useGlobalState((state) => state.codebase);

  const refreshSandpack = async () => {
    try {
      if (onRefreshClick) {
        onRefreshClick();
      }
      await sandpack.runSandpack();
      console.log('[SPRV] sandpack_status', sandpack.status);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    refreshSandpack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codebase]);

  return (
    <div className="h-full">
      {isRefreshing ? (
        <div className="flex items-center justify-center h-full bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <SandpackPreview
        className=''
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
  );
};

export default Sprv;
