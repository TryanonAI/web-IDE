'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn, validateProjectName } from '@/lib/utils';
import TitleBar from '@/components/dashboard/TitleBar';
import StatusBar from '@/components/dashboard/StatusBar';
import { ProjectDrawer } from '@/components/drawers/ProjectDrawer';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGlobalState, useWallet } from '@/hooks';
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Loader2,
  PlusCircle,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Framework } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
  showProjectDrawer?: boolean;
}

const Layout = ({ children }: LayoutProps) => {
  const connect = useWallet((state) => state.connect);
  const connected = useWallet((state) => state.connected);
  const isCreating = useGlobalState((state) => state.isCreating);
  const createProject = useGlobalState((state) => state.createProject);
  const framework = useGlobalState((state) => state.framework);
  const setIsLoading = useGlobalState((state) => state.setIsLoading);

  const [nameError, setNameError] = useState<string>('');
  const { activeModal, projectName, openModal, closeModal, setProjectName } =
    useGlobalState();

  const handleCreateProject = async (mode: Framework) => {
    if (!projectName.trim()) return;
    closeModal();
    setIsLoading(true);
    try {
      console.log('Creating project from modal:', projectName);
      await createProject(projectName.trim(), mode);
      setProjectName('');
    } catch (error) {
      console.error('Error creating project:', error);
      openModal('createProject');
    } finally {
      setIsLoading(false);
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

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Framework>(framework);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border">
        <TitleBar />
      </div>
      {!connected ? (
        <div className="flex flex-1 items-center justify-center">
          <Button
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 text-base h-auto"
            onClick={() => connect()}
            size="lg"
          >
            Connect Wallet
          </Button>
        </div>
      ) : (
        <div
          id="main-container"
          className="flex flex-1 min-h-0 overflow-hidden"
        >
          {children}
        </div>
      )}

      <ProjectDrawer />
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
            onSubmit={async (e) => {
              e.preventDefault();
              await handleCreateProject(mode);
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
                <div className="flex flex-col gap-2">
                  <label htmlFor="framework" className="text-sm font-medium">
                    Select Mode
                  </label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full p-3 justify-between"
                      >
                        {framework
                          ? [
                              { value: Framework.React, label: 'Code Mode' },
                              { value: Framework.Html, label: 'Vibe Mode' },
                            ].find((fmk) => fmk.value === framework)?.label
                          : 'Select framework...'}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search framework..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No mode found.</CommandEmpty>
                          <CommandGroup>
                            {[
                              { value: Framework.React, label: 'Code Mode' },
                              { value: Framework.Html, label: 'Vibe Mode' },
                            ].map((fmk) => (
                              <CommandItem
                                key={fmk.value}
                                value={fmk.value}
                                onSelect={(fmk) => {
                                  setMode(fmk as Framework);
                                  setOpen(false);
                                }}
                              >
                                {fmk.label}
                                <Check
                                  className={cn(
                                    'ml-auto',
                                    framework === fmk.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Choose the mode for your project.
                  </p>
                </div>
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
      <div className="shrink-0 border-t border-border">
        <StatusBar />
      </div>
    </div>
  );
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
