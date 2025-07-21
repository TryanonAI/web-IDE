import { useState, useEffect } from 'react';
import { AlertTriangle, Zap, X } from 'lucide-react';
import { useGlobalState } from '@/hooks';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Framework } from '@/types';

interface ErrorFixButtonProps {
  onSendErrorToChat: (errorMessage: string) => void;
}

const ErrorFixButton = ({ onSendErrorToChat }: ErrorFixButtonProps) => {
  const consoleErrors = useGlobalState((state) => state.consoleErrors);
  const hasUnhandledErrors = useGlobalState((state) => state.hasUnhandledErrors);
  const clearConsoleErrors = useGlobalState((state) => state.clearConsoleErrors);
  const activeProject = useGlobalState((state) => state.activeProject);
  const isCodeGenerating = useGlobalState((state) => state.isCodeGenerating);
  const [isVisible, setIsVisible] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Show the button if there are unhandled errors and we're not already generating code
    setIsVisible(hasUnhandledErrors && !isCodeGenerating && !!activeProject && !isDismissed);
  }, [hasUnhandledErrors, isCodeGenerating, activeProject, isDismissed]);

  useEffect(() => {
    // Reset dismissal when new errors come in
    if (hasUnhandledErrors) {
      setIsDismissed(false);
    }
  }, [hasUnhandledErrors]);

  const handleFixWithAnon = async () => {
    if (consoleErrors.length === 0) return;

    setIsFixing(true);
    
    // Get the latest errors (max 3 to avoid overwhelming the prompt)
    const latestErrors = consoleErrors.slice(-3);
    
    // Format the error message for the AI
    const errorSummary = latestErrors.map((error, index) => {
      const errorNumber = latestErrors.length > 1 ? `${index + 1}. ` : '';
      return `${errorNumber}${error.type.toUpperCase()}: ${error.message}${error.stack ? `\n   Stack: ${error.stack.split('\n')[0]}` : ''}`;
    }).join('\n\n');

    const contextualPrompt = activeProject?.framework === Framework.Html 
      ? `I'm getting console errors in my web application. Please help me fix these errors:\n\n${errorSummary}\n\nPlease review the code and fix these issues.`
      : `I'm getting console errors in my React application. Please help me fix these errors:\n\n${errorSummary}\n\nPlease review the code and fix these issues.`;

    try {
      // Send to chat
      onSendErrorToChat(contextualPrompt);
      
      // Clear the errors since we've sent them for fixing
      clearConsoleErrors();
      
      toast.info('Sent error details to Anon AI for fixing', {
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to send error to chat:', error);
      toast.error('Failed to send error to Anon. Please try again.');
    } finally {
      setIsFixing(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/3 z-60 animate-in slide-in-from-bottom-2 fade-in-0 duration-500">
      <div className="group relative flex items-center gap-3 bg-card/95 backdrop-blur-md border border-border/50 rounded-lg shadow-xl px-3 py-2.5 transition-all duration-300 hover:border-border/80 hover:shadow-2xl">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 via-transparent to-transparent rounded-lg pointer-events-none" />
        
        {/* Status indicator */}
        <div className="relative flex items-center gap-2.5 z-10">
          <div className="relative flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
            <div className="absolute inset-0 w-1.5 h-1.5 bg-destructive rounded-full animate-ping opacity-40" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-mono text-muted-foreground leading-none">
              {consoleErrors.length} error{consoleErrors.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Action button */}
        <Button
          onClick={handleFixWithAnon}
          disabled={isFixing || isCodeGenerating}
          size="sm"
          className="h-7 px-2.5 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 hover:border-primary/30 transition-all duration-200 disabled:opacity-60 font-mono text-xs"
          variant="outline"
        >
          {isFixing ? (
            <>
              <Zap className="h-3 w-3 mr-1.5 animate-spin" />
              Fixing
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3 mr-1.5" />
              Fix
            </>
          )}
        </Button>

        {/* Dismiss button */}
        <Button
          onClick={handleDismiss}
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50 transition-colors duration-200 group-hover:opacity-100 opacity-70"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default ErrorFixButton;