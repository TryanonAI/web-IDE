'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProjectDrawer } from '@/components/common/ProjectDrawer';
import { usePathname, useRouter } from 'next/navigation';

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
  ChevronsUpDown,
  Loader2,
  PlusCircle,
  LogOutIcon,
  UserIcon,
  X,
} from 'lucide-react';
import {
  Popover,
  // PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from '@/components/ui/command';
import { Framework } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { validateProjectName } from '@/lib/utils';
import TitleBar from '@/components/features/dashboard/TitleBar';
import StatusBar from '@/components/features/dashboard/StatusBar';

interface LayoutProps {
  children: React.ReactNode;
  showProjectDrawer?: boolean;
}

const Layout = ({ children }: LayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [nameError, setNameError] = useState<string>('');
  const [mode, setMode] = useState<Framework>(Framework.React);

  const { user, shortAddress, connect, disconnect, connected } = useWallet();
  const {
    activeModal,
    projectName,
    openModal,
    closeModal,
    setProjectName,
    isCreating,
    setIsLoading,
    setFramework,
    createProject,
  } = useGlobalState();

  const isDashboard = pathname === '/dashboard';

  const handleCreateProject = async (mode: Framework) => {
    if (!projectName.trim()) return;
    closeModal();
    setIsLoading(true);
    setFramework(Framework.React);
    setMode(Framework.React);
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
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Announcement Banner */}
      {showBanner && (
        <div className="relative bg-primary/5 border-b border-primary/10">
          <div className="max-w-screen-xl mx-auto py-2 px-3 sm:px-6 lg:px-8">
            <div className="pr-3 text-center text-sm font-medium text-primary/80">
              <span>✨ Open with Cursor feature coming soon!</span>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-1/2 right-2 -translate-y-1/2 p-1 hover:bg-primary/10 rounded-md transition-colors"
            >
              <X size={16} className="text-primary/80" />
            </button>
          </div>
        </div>
      )}

      {/* Conditional Navigation Bar */}
      <div className="shrink-0 border-b border-border">
        {isDashboard ? (
          <TitleBar />
        ) : (
          <div className="h-14 px-4 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="font-semibold">ANON</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-md border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 group h-9 px-3 py-5 flex items-center gap-2 tracking-wider text-sm">
                <Avatar>
                  <AvatarImage src={user?.avatarUrl} alt={user?.username} />
                  <AvatarFallback>
                    {user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{shortAddress}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer focus:bg-secondary/80"
                  onClick={() => router.push('/dashboard')}
                >
                  <UserIcon size={16} className="text-primary/80" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => disconnect()}
                  className="flex items-center gap-2 cursor-pointer focus:bg-destructive focus:text-destructive-foreground"
                >
                  <LogOutIcon size={16} />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
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
          className="flex flex-1 min-h-0 overflow-hidden bg-background pb-2"
        >
          {children}
        </div>
      )}

      <ProjectDrawer />
      <Dialog
        open={activeModal === 'createProject' && !isCreating}
        onOpenChange={(open) => {
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
                    {/* Choose a clear, descriptive name for your project. */}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="framework"
                    className="text-sm font-medium opacity-50 "
                  >
                    Select Mode
                  </label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger disabled={true} asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full p-3 justify-between opacity-60 cursor-not-allowed"
                      >
                        {/* {framework
                            ? [
                                { value: Framework.React, label: 'Code Mode' },
                                { value: Framework.Html, label: 'Vibe Mode' },
                              ].find((fmk) => fmk.value === framework)?.label
                            : 'Select framework...'} */}
                        {/* Code Mode */}
                        {/* <div className='flex gap-1'> */}
                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                        <ChevronsUpDown className="opacity-50" />
                        {/* </div> */}
                      </Button>
                    </PopoverTrigger>
                    {/* Commenting out the PopoverContent section for now */}
                    {/* <PopoverContent className="w-full p-0">
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
                                    setFramework(fmk as Framework);
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
                      </PopoverContent> */}
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Additional project modes will be available soon.
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
      {isDashboard && (
        <div className="shrink-0 border-t border-border">
          <StatusBar />
        </div>
      )}
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
