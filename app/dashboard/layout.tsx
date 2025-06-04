'use client';
import React from 'react';
import TitleBar from '@/components/dashboard/TitleBar';
import { ProjectDrawer } from '@/components/drawers/ProjectDrawer';
import StatusBar from '@/components/dashboard/StatusBar';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const connect = useWallet((state) => state.connect);
  const connected = useWallet((state) => state.connected);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border">
        <TitleBar />
      </div>
      {!connected ? (
        <div className="flex flex-1 items-center justify-center">
          <Button
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 text-base h-auto"
            onClick={() => connect()}
            size="lg"
          >
            Connect Wallet
          </Button>
        </div>
      ) : (
        children
      )}

      <ProjectDrawer />
      <div className="shrink-0 border-t border-border">
        <StatusBar />
      </div>
    </div>
  );
};

export default Layout;

// const [lastStrategy] = useLocalStorage<ConnectionStrategies | null>(
//   'anon-conn-strategy',
//   null
// );
// const {
//   connect,
//   wanderInstance,
//   connected,
//   connectionStrategy,
// } = useWallet();
// useEffect(() => {
//   console.log('connected', connected);
//   console.log('lastStrategy', lastStrategy);
//   if (!connected && lastStrategy) {
//     console.log('Connecting with last strategy', lastStrategy);
//     connect(lastStrategy).then(() => {
//       if (connectionStrategy == ConnectionStrategies.WanderConnect) {
//         wanderInstance?.close();
//       }
//     });
//   }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [lastStrategy, connected]);
