import React from 'react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
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
