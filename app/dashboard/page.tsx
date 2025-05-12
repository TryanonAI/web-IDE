'use client';

import {
  PanelRightClose,
  PanelRightOpen,
  PlusCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCallback, useState, useEffect } from 'react';

import { AnimatePresence } from 'framer-motion';

import { useModal } from '@/context/ModalContext';
import { Overlay } from '@/components/ui/overlay';
import { useWallet } from '@/context/WalletContext';
import { useProject } from '@/context/ProjectContext';

import { Button } from '@/components/ui/button';
import Chatview from '@/components/dashboard/Chatview';
import Codeview from '@/components/dashboard/Codeview';
import TitleBar from '@/components/dashboard/TitleBar';
import StatusBar from '@/components/dashboard/StatusBar';

// Define types for overlay
type OverlayType = 'loading' | 'wallet' | 'creating';

// Add the StatusTimelineEvent type
type StatusTimelineEvent = {
  id: string;
  message: string;
  timestamp: number;
};

interface OverlayConfig {
  type: OverlayType;
  title: string;
  description: string;
  action?: () => Promise<void>;
  actionLabel?: string;
  statusTimeline?: StatusTimelineEvent[];
}

const ProjectsPageContent = () => {
  const [splitPosition] = useState<number>(70);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [nameError, setNameError] = useState<string>('');
  // Use our modal context
  const { isOpen, projectName, openModal, closeModal, setProjectName } =
    useModal();

  // Use our wallet and project context hooks
  const { walletStatus, connectToWallet, error: walletError } = useWallet();

  const {
    projects,
    activeProject,
    isLoading,
    isCreating,
    isLoadingProjectData,
    codebase,
    chatMessages,
    error: projectError,
    status,
    statusTimeline,
    handleProjectSelect,
    createProject,
    refreshProject,
    setCodebase,
  } = useProject();

  // Add initialization effect to smooth out the initial loading experience
  useEffect(() => {
    // This creates a smoother initial loading experience
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 800); // Short delay to prevent UI jumps

    return () => clearTimeout(timer);
  }, []);

  // Handler for project creation
  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    console.log('Creating project from modal:', projectName);

    // Close modal first
    closeModal('createProject');

    try {
      // Create the project
      await createProject(projectName.trim());
      setProjectName('');
    } catch (error) {
      console.error('Error creating project:', error);
      // Reopen the modal if there was an error
      openModal('createProject');
    }
  };

  // Handle creating new project from the centralized button
  const handleCreateNewProjectClick = () => {
    setProjectName('');
    openModal('createProject');
  };

  // Determine what overlay to show - only show one at a time based on priority
  const getActiveOverlay = (): OverlayConfig | null => {
    // Initialization takes precedence over everything initially
    if (isInitializing) {
      return {
        type: 'loading',
        title: 'Initializing',
        description: 'Loading dashboard...',
      };
    }

    // Next, check wallet connection
    if (walletStatus !== 'connected') {
      return {
        type: 'wallet',
        title: 'Wallet Connection Required',
        description:
          'Please connect your wallet to access the dashboard and manage your projects.',
        action: handleConnectWallet,
        actionLabel:
          walletStatus === 'connecting' ? 'Connecting...' : 'Connect Wallet',
      };
    }

    // Once wallet is connected, check project creation
    if (isCreating) {
      return {
        type: 'creating',
        title: 'Creating New Project',
        description: status || 'Setting up your new project...',
        statusTimeline: statusTimeline,
      };
    }

    // Next, check if we're loading the project list
    if (isLoading) {
      return {
        type: 'loading',
        title: 'Loading Projects',
        description: status || 'Loading your projects...',
        statusTimeline: statusTimeline,
      };
    }

    // Finally, check if we're loading project data
    if (isLoadingProjectData) {
      return {
        type: 'loading',
        title: 'Loading Project Data',
        description: status || 'Loading code and chat history...',
        statusTimeline: statusTimeline,
      };
    }

    // No overlay needed
    return null;
  };

  const isSavingCode: boolean = false;

  // Handle connecting to wallet
  const handleConnectWallet = useCallback(async () => {
    await connectToWallet();
  }, [connectToWallet]);

  // Handle commit to GitHub
  const handleSaveToGithub = async (commitMessage?: string) => {
    // Implementation would be here, keeping it minimal
    console.log('Saving to GitHub:', commitMessage);
  };

  // Determine if the main interface should be shown
  const shouldShowInterface =
    // Only show interface when:
    // - Not initializing
    !isInitializing &&
    // - Wallet is connected
    walletStatus === 'connected' &&
    // - Not creating a project
    !isCreating &&
    // - Not in initial loading state
    !isLoading &&
    // - Either no active project, or it's loaded (not loading project data)
    (!activeProject || !isLoadingProjectData);

  // Get the current active overlay based on state
  const activeOverlay = getActiveOverlay();

  const validateProjectName = (name: string) => {
    // Repository name validation: only ASCII letters, digits, and the characters ., - and _
    const validPattern = /^[a-zA-Z0-9._-]+$/;
    return validPattern.test(name);
  };
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setProjectName(name);

    if (name && !validateProjectName(name)) {
      setNameError(
        'Project name can only contain letters, numbers, dots, hyphens, and underscores'
      );
    } else {
      setNameError('');
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Single Unified Overlay System - Only one overlay at a time */}
      <AnimatePresence mode="wait">
        {activeOverlay && (
          <Overlay
            isVisible={true}
            type={activeOverlay.type}
            title={activeOverlay.title}
            description={activeOverlay.description}
            action={activeOverlay.action}
            actionLabel={activeOverlay.actionLabel}
            statusTimeline={activeOverlay.statusTimeline}
          />
        )}
      </AnimatePresence>

      {/* Header is always visible */}
      <div className="shrink-0 border-b border-border">
        <TitleBar
          onProjectSelect={handleProjectSelect}
          onRefresh={refreshProject}
          activeProject={activeProject}
          onConnectGithub={handleSaveToGithub}
          projects={projects}
        />
      </div>

      {/* Error Display */}
      {(walletError || projectError) && !activeOverlay && (
        <div className="bg-destructive/5 px-4 py-2 text-destructive flex justify-between items-center border-b border-destructive/10">
          <p>
            {walletError ||
              (projectError instanceof Error
                ? projectError.message
                : 'An error occurred')}
          </p>
          <button
            onClick={walletError ? handleConnectWallet : refreshProject}
            className="text-sm text-destructive hover:text-destructive/80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content - Only shown when appropriate */}
      {shouldShowInterface && (
        <>
          {activeProject ? (
            <div
              id="main-container"
              className="flex flex-1 min-h-0 overflow-hidden"
            >
              <div
                style={{
                  width: isChatVisible ? `${splitPosition}%` : '100%',
                  transition: 'width 0.3s ease-in-out',
                }}
                className="h-full min-h-0 relative flex"
              >
                {/* Code Editor Container */}
                <div className="flex-1 relative">
                  <Codeview
                    isSaving={isSavingCode}
                    isGenerating={isGenerating}
                    activeProject={activeProject}
                    onCommit={handleSaveToGithub}
                    codebase={codebase as Record<string, string> | null}
                  />
                </div>

                {/* Toggle Chat Button */}
                <div className="relative w-0">
                  <button
                    onClick={() => setIsChatVisible(!isChatVisible)}
                    className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-primary/10 hover:bg-primary/20 text-primary p-1.5 rounded-full transition-colors border border-border"
                    title={isChatVisible ? 'Hide Chat' : 'Show Chat'}
                  >
                    {isChatVisible ? (
                      <PanelRightClose size={16} />
                    ) : (
                      <PanelRightOpen size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Animated Chat Panel */}
              <AnimatePresence>
                {isChatVisible && (
                  <div
                    style={{ width: `${100 - splitPosition}%` }}
                    className="h-full min-h-0 border-l border-border relative"
                  >
                    <Chatview
                      activeProject={activeProject}
                      onGenerateStart={() => setIsGenerating(true)}
                      onGenerateEnd={() => setIsGenerating(false)}
                      showLuaToggle={true}
                      chatMessages={chatMessages}
                      onNewCodebase={setCodebase}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-background">
              <div className="flex flex-col items-center justify-center text-center">
                <p className="mb-6 text-xl font-semibold text-foreground">
                  Create your first project and start vibe coding with{' '}
                  <span className="font-bold">Anon</span>
                </p>
                <Button
                  size="lg"
                  onClick={handleCreateNewProjectClick}
                  className="flex items-center gap-2 px-4 py-2.5 text-base h-auto"
                >
                  <PlusCircle size={20} />
                  <span>Create New Project</span>
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Project Dialog - Shared across components */}
      <Dialog
        open={isOpen.createProject && !isCreating}
        onOpenChange={(open) => {
          // Only allow closing if not in creating state
          if (!isCreating) {
            if (open) openModal('createProject');
            else closeModal('createProject');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Project</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateProject();
            }}
            className="space-y-4"
          >
            <div className="flex flex-col justify-center py-2">
              <div className="flex flex-col justify-center gap-2">
                <label htmlFor="projectName" className="text-sm font-medium">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={handleNameChange}
                  className="w-full p-3 rounded-md border border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="todo-list"
                  required
                  autoFocus
                />
                {nameError ? (
                  <div className="mt-1.5 flex items-center text-destructive text-xs bg-destructive/5 p-2 rounded-md">
                    <AlertCircle size={14} className="mr-2 shrink-0" />
                    <span>{nameError}</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Choose a clear, descriptive name for your project.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => closeModal('createProject')}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex items-center gap-1"
                disabled={!projectName.trim() || isCreating || !!nameError}
              >
                {isCreating ? (
                  <Loader2 size={16} className="animate-spin mr-1" />
                ) : (
                  <PlusCircle size={16} />
                )}
                {isCreating ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Bar - Always visible */}
      <div className="shrink-0 border-t border-border">
        <StatusBar
          activeProject={activeProject}
          connectionStatus={
            walletStatus === 'connected'
              ? 'connected'
              : walletStatus === 'connecting'
                ? 'connecting'
                : 'disconnected'
          }
          status={status}
        />
      </div>
    </div>
  );
};

export default ProjectsPageContent;
