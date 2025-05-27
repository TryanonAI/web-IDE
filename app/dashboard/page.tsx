'use client';

import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useModal } from '@/context/ModalContext';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Chatview from '@/components/dashboard/Chatview';
import Codeview from '@/components/dashboard/Codeview';
import TitleBar from '@/components/dashboard/TitleBar';
import StatusBar from '@/components/dashboard/StatusBar';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useWallet } from '@/hooks/use-wallet';
import { validateProjectName } from '@/lib/utils';
import { useGlobalState } from '@/hooks/global-state';
import { Loading_Gif } from '@/app/loading';
import { Framework } from '@/types';

const Dashboard = () => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string>('');
  const { isOpen, projectName, openModal, closeModal, setProjectName } =
    useModal();

  const connect = useWallet((state) => state.connect);
  const connected = useWallet((state) => state.connected);
  const codebase = useGlobalState((state) => state.codebase);
  const isLoading = useGlobalState((state) => state.isLoading);
  const isCreating = useGlobalState((state) => state.isCreating);
  const chatMessages = useGlobalState((state) => state.chatMessages);
  const fetchProjects = useGlobalState((state) => state.fetchProjects);
  const activeProject = useGlobalState((state) => state.activeProject);
  const createProject = useGlobalState((state) => state.createProject);
  const framework = useGlobalState((state) => state.framework);
  const setFramework = useGlobalState((state) => state.setFramework);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    closeModal('createProject');
    try {
      console.log('Creating project from modal:', projectName);
      await createProject(projectName.trim(), framework);
      setProjectName('');
    } catch (error) {
      console.error('Error creating project:', error);
      openModal('createProject');
    }
  };

  const handleCreateNewProjectClick = () => {
    setProjectName('');
    openModal('createProject');
  };

  const isSavingCode: boolean = false;

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

  useEffect(() => {
    if (connected) {
      fetchProjects();
    }
  }, [connected, fetchProjects]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header is always visible */}
      <div className="shrink-0 border-b border-border">
        <TitleBar />
      </div>

      <div id="main-container" className="flex flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <Loading_Gif count={3} />
        ) : connected ? (
          activeProject ? (
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={60} minSize={30}>
                {activeProject.framework === 'React' ? (
                  <Codeview
                    isSaving={isSavingCode}
                    isGenerating={isGenerating}
                  />
                ) : (
                  <iframe
                    srcDoc={codebase as string}
                    className="w-full h-full"
                    aria-label="Code Preview"
                    title="Code Preview"
                  />
                )}
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={18}>
                <AnimatePresence>
                  <Chatview
                    onGenerateStart={() => setIsGenerating(true)}
                    onGenerateEnd={() => setIsGenerating(false)}
                    showLuaToggle={true}
                    chatMessages={chatMessages}
                  />
                </AnimatePresence>
              </ResizablePanel>
            </ResizablePanelGroup>
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
                  className="flex items-center gap-2 px-4 py-2.5 text-base h-auto cursor-pointer"
                >
                  <PlusCircle size={20} />
                  <span>Create New Project</span>
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Button className="cursor-pointer" onClick={() => connect()}>
              Connect Wallet
            </Button>
          </div>
        )}
      </div>

      {/* Status Bar - Always visible */}
      <div className="shrink-0 border-t border-border">
        <StatusBar />
      </div>

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
        <DialogContent
          aria-description="Create New Project"
          className="sm:max-w-md"
        >
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
                  placeholder="project-name"
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
                <select
                  id="framework"
                  value={framework}
                  onChange={(e) => {
                    setFramework(e.target.value as Framework);
                  }}
                  className="w-full p-3 rounded-md border border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value={Framework.Html}>Html</option>
                  <option value={Framework.React}>React</option>
                </select>
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
    </div>
  );
};

export default Dashboard;
