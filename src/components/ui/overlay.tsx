// import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface OverlayProps {
  isVisible: boolean;
  type: 'loading' | 'wallet' | 'creating';
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
  className?: string;
  statusTimeline?: Array<{
    id: string;
    message: string;
    timestamp: number;
  }>;
}

export function Overlay({
  isVisible,
  type,
  title,
  description,
  action,
  actionLabel,
  className,
  statusTimeline = [],
}: OverlayProps) {
  if (!isVisible) return null;

  // Only show the last 5 timeline events
  const recentEvents = statusTimeline.slice(-5).reverse();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center',
        className
      )}
    >
      <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4 text-center border border-border">
        <div className="mb-4">
          {type === 'loading' && (
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          )}
          {type === 'wallet' && (
            <div className="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <div className="h-5 w-5 bg-destructive rounded-full animate-pulse" />
            </div>
          )}
          {type === 'creating' && (
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          )}
        </div>

        <h2 className="text-xl font-bold mb-2">{title}</h2>

        {description && (
          <p className="text-muted-foreground mb-4">{description}</p>
        )}

        {/* Status Timeline */}
        {recentEvents.length > 0 && (
          <div className="mt-4 mb-4 border-t border-border pt-3">
            <div className="text-sm font-medium text-left mb-2">Progress:</div>
            <div className="space-y-2 max-h-40 overflow-y-auto text-left">
              {recentEvents.map((event, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  {index === 0 ? (
                    <Loader2
                      size={14}
                      className="text-primary shrink-0 animate-spin mt-0.5"
                    />
                  ) : (
                    <CheckCircle
                      size={14}
                      className="text-muted-foreground shrink-0 mt-0.5"
                    />
                  )}
                  <span
                    className={
                      index === 0 ? 'text-primary' : 'text-muted-foreground'
                    }
                  >
                    {event.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {action && actionLabel && (
          <Button onClick={action} className="w-full">
            {actionLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
