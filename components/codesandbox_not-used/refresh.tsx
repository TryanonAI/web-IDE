'use client';
import { useSandpack } from '@codesandbox/sandpack-react';
import { RefreshCwIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CustomRefreshButton() {
  const { dispatch, listen } = useSandpack();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = () => {
    setIsRefreshing(true);
    // sends the refresh message to the bundler, should be logged by the listener
    dispatch({ type: 'refresh' });
    setIsRefreshing(false);
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
      <RefreshCwIcon size={14} className={isRefreshing?'animate-spin':''} />
    </button>
  );
}
