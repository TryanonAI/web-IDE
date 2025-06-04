'use client';
import { useSandpack } from '@codesandbox/sandpack-react';
import { useEffect } from 'react';

export default function CustomRefreshButton() {
  const { dispatch, listen } = useSandpack();

  const handleRefresh = () => {
    // sends the refresh message to the bundler, should be logged by the listener
    dispatch({ type: 'refresh' });
  };

  useEffect(() => {
    // listens for any message dispatched between sandpack and the bundler
    const stopListening = listen((msg) => console.log(msg));

    return () => {
      // unsubscribe
      stopListening();
    };
  }, [listen]);

  return (
    <button type="button" onClick={handleRefresh}>
      Refresh
    </button>
  );
}
