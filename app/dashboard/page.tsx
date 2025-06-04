'use client';

import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import Chatview from '@/components/dashboard/Chatview';
import Codeview from '@/components/dashboard/Codeview';
import { useGlobalState } from '@/hooks/global-state';
import { validateProjectName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { Loading_Gif } from '@/app/loading';
import { useEffect, useState } from 'react';
import { Framework } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

const Dashboard = () => {
  const [nameError, setNameError] = useState<string>('');
  const { activeModal, projectName, openModal, closeModal, setProjectName } =
    useGlobalState();

  const connected = useWallet((state) => state.connected);
  const isLoading = useGlobalState((state) => state.isLoading);
  const isCreating = useGlobalState((state) => state.isCreating);
  const fetchProjects = useGlobalState((state) => state.fetchProjects);
  const activeProject = useGlobalState((state) => state.activeProject);
  const createProject = useGlobalState((state) => state.createProject);
  const framework = useGlobalState((state) => state.framework);
  const setFramework = useGlobalState((state) => state.setFramework);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    closeModal();
    try {
      console.log('Creating project from modal:', projectName);
      await createProject(projectName.trim(), framework);
      setProjectName('');
    } catch (error) {
      console.error('Error creating project:', error);
      openModal('createProject');
    }
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

  useEffect(() => {
    if (connected) {
      fetchProjects();
    }
  }, [connected, fetchProjects]);

  return (
    <>
      <div id="main-container" className="flex flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <Loading_Gif count={3} />
        ) : activeProject ? (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={70} minSize={30}>
              <Codeview />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={30} minSize={18}>
              <Chatview />
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
                onClick={() => openModal('createProject')}
                className="flex items-center gap-2 px-4 py-2.5 text-base h-auto cursor-pointer"
              >
                <PlusCircle size={20} />
                <span>Create New Project</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={activeModal === 'createProject' && !isCreating}
        onOpenChange={(open) => {
          // Only allow closing if not in creating state
          if (!isCreating) {
            if (open) openModal('createProject');
            else closeModal();
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
                  <option value={Framework.Html}>Vibe Mode</option>
                  <option value={Framework.React}>Code Mode</option>
                </select>
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => closeModal()}
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
    </>
  );
};

export default Dashboard;
