import React from 'react';
import { Loader2Icon, GitBranchIcon } from 'lucide-react';

const StatusBar = ({
  // @ts-expect-error ignore,
  activeProject,
  // @ts-expect-error ignore,
  status, // New status prop
  connectionStatus = 'connected', // 'connected' | 'disconnected' | 'connecting',
}) => {
  return (
    <div className="h-8 shrink-0 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 border-t border-border/50 px-4 flex items-center text-xs font-medium text-muted-foreground">
      <div className="flex-1 flex items-center gap-6">
        {/* Project Status */}
        <div className="flex items-center gap-2">
          <GitBranchIcon size={13} className="text-primary/70" />
          <span className="hover:text-foreground transition-colors">
            {activeProject ? activeProject.name : 'No project selected'}
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

      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {connectionStatus === 'connected' && (
          <>
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px] shadow-primary"></div>
            <span className="hover:text-foreground transition-colors">
              Connected
            </span>
          </>
        )}
        {connectionStatus === 'connecting' && (
          <>
            <Loader2Icon size={13} className="animate-spin text-primary/70" />
            <span className="text-primary/90">Connecting...</span>
          </>
        )}
        {connectionStatus === 'disconnected' && (
          <>
            <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_6px] shadow-destructive"></div>
            <span className="text-destructive/90">Disconnected</span>
          </>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
