import React from 'react';
import { ModalProvider } from '@/context/ModalContext';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <ModalProvider>
    
    
    {children}
    
    </ModalProvider>;
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

/*
import RestrictedAccessView from '@/components/dashboard/RestrictedAccessView';
import { Button } from '@/components/ui/button';
import { TrialStatus } from '@/types/types';
function DashboardAccessControl({ children }: { children: React.ReactNode }) {
  const { trialStatus, walletStatus, disconnectWallet } = useWallet();
  if (walletStatus === WalletStatus.CONNECTED) {
    if (trialStatus !== TrialStatus.APPROVED) {
      return (
        <div className="flex flex-col">
          {walletStatus === 'connected' && (
            <header className="flex justify-end p-4">
              <Button
                className="z-[60] cursor-pointer"
                onClick={disconnectWallet}
              >
                Disconnect Wallet
              </Button>
            </header>
          )}
          <RestrictedAccessView />
        </div>
      );
    }
  }
  return <>{children}</>;
}
*/
