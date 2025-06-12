import React from 'react';
import { WalletStatus } from '@/types';
import { useWallet } from '@/hooks';
import { useGlobalState } from '@/hooks';
import { Loader2Icon, GitBranchIcon } from 'lucide-react';

const StatusBar = () => {
  const status = useGlobalState((state) => state.status);
  const activeProject = useGlobalState((state) => state.activeProject);
  const walletStatus = useWallet((state) => state.walletStatus);

  return (
    <div className="h-8 shrink-0 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 border-t border-border/50 px-4 flex items-center text-xs font-medium text-muted-foreground ">
      <div className="flex-1 flex items-center gap-6">
        {/* Project Status */}
        <div className="flex items-center gap-2">
          <GitBranchIcon size={13} className="text-primary/70" />
          <span className="hover:text-foreground transition-colors">
            {activeProject ? activeProject.title : 'No project selected'}
          </span>
        </div>

        {/* Status Message */}
        {status && (
          <div className="flex items-center gap-2">
            <Loader2Icon size={13} className="animate-spin text-primary/70" />
            <span className="text-primary/90">{status}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {walletStatus === WalletStatus.CONNECTED && (
          <>
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px] shadow-primary" />
            <span className="hover:text-foreground transition-colors">
              Connected
            </span>
          </>
        )}
        {walletStatus === WalletStatus.CONNECTING && (
          <>
            <Loader2Icon size={13} className="animate-spin text-primary/70" />
            <span className="text-primary/90">Connecting...</span>
          </>
        )}
        {walletStatus === WalletStatus.DISCONNECTED && (
          <>
            <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_6px] shadow-destructive" />
            <span className="text-destructive/90">Disconnected</span>
          </>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
