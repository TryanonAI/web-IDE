import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { Octokit } from '@octokit/core';
import {
  Github,
  XCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PlusIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useGlobalState } from '@/hooks';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { GITHUB_STATUS, DrawerType, GithubError } from '@/hooks/useGlobalState';

interface StatusStep {
  id: string;
  title: string;
  description: string;
  status: 'loading' | 'success' | 'error' | 'pending';
  error?: string;
}

interface StatusDrawerProps {
  statusSteps: StatusStep[];
  setStatusSteps: React.Dispatch<React.SetStateAction<StatusStep[]>>;
  commitInProgress: boolean;
  showCommitDialog: () => void;
}

export default function GithubDrawer({
  statusSteps,
  setStatusSteps,
  commitInProgress,
  showCommitDialog,
}: StatusDrawerProps) {
  const {
    activeDrawer,
    closeDrawer,
    activeProject,
    githubStatus,
    setGithubStatus,
    octokit,
    setOctokit,
    setGithubUsername,
    githubUsername,
    githubToken,
    setGithubToken,
    disconnectGithub,
    checkRepository,
    setError,
    // createRepository,
  } = useGlobalState();

  const updateStepStatus = (
    stepId: string,
    status: StatusStep['status'],
    error?: string
  ) => {
    setStatusSteps((steps) =>
      steps.map((step) =>
        step.id === stepId
          ? { ...step, status, ...(error ? { error } : {}) }
          : step
      )
    );
  };

  const handleCreateRepository = async () => {
    if (!octokit || !githubUsername || !activeProject) {
      setGithubStatus(GITHUB_STATUS.ERROR);
      throw new Error('Missing required parameters');
    }

    // await createRepository(activeProject.title);
    setGithubStatus(GITHUB_STATUS.CREATING_REPO);

    try {
      const createResponse = await octokit.request('POST /user/repos', {
        name: activeProject.title,
        description: 'Created with ANON AI',
        private: true,
        headers: { 'X-GitHub-Api-Version': '2022-11-28' },
      });

      if (createResponse.status === 201) {
        updateStepStatus('create-repo', 'success');
        setGithubStatus(GITHUB_STATUS.REPO_EXISTS);
        toast.success('New repository created successfully!');
        return true;
      }
      return false;
    } catch (err) {
      updateStepStatus('create-repo', 'error', (err as Error).message);
      const error = err as GithubError;

      if (
        error.response?.data?.errors?.some((e) =>
          e.message?.includes('name already exists')
        )
      ) {
        try {
          const exists = await checkRepository(activeProject.title);
          return exists;
        } catch {
          setGithubStatus(GITHUB_STATUS.ERROR);
          setError(
            'A repository with this name already exists but is not accessible'
          );
          toast.error('Repository name conflict', {
            description:
              'A repository with this name already exists but is not accessible. Please use a different project name.',
          });
          return false;
        }
      }

      setGithubStatus(GITHUB_STATUS.ERROR);
      setError(error.message || 'Failed to create repository');
      toast.error('Failed to create repository');
      return false;
    }
  };

  // const handleCreateRepository = async () => {
  //   if (!activeProject?.title) {
  //     setGithubStatus(GITHUB_STATUS.ERROR);
  //     toast.error('No active project to create repository for');
  //     return;
  //   }

  //   try {
  //     setGithubStatus(GITHUB_STATUS.CREATING_REPO);

  //     const success = await createRepository(activeProject.title);

  //     if (success) {
  //       setGithubStatus(GITHUB_STATUS.REPO_EXISTS);
  //       toast.success(
  //         `Repository '${activeProject.title}' created successfully!`
  //       );
  //     } else {
  //       setGithubStatus(GITHUB_STATUS.ERROR);
  //       toast.error('Failed to create repository. Please try again.');
  //     }
  //   } catch (error) {
  //     console.error('Error creating repository:', error);
  //     setGithubStatus(GITHUB_STATUS.ERROR);

  //     let errorMessage = 'Failed to create repository';
  //     if (error instanceof Error) {
  //       if (error.message.includes('name already exists')) {
  //         errorMessage =
  //           'Repository name already exists. Please use a different name.';
  //       } else {
  //         errorMessage = error.message;
  //       }
  //     }

  //     toast.error(errorMessage);
  //   }
  // };

  const handleGithubClick = async () => {
    if (!githubToken) {
      // Start GitHub OAuth flow
      try {
        const authUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/github`;
        window.location.href = authUrl;
      } catch (error) {
        console.error('Failed to initiate GitHub auth:', error);
        toast.error('Failed to connect to GitHub');
      }
    } else if (!activeProject) {
      toast.error('Please select a project first');
    }
    // else {
    //   if (activeProject.title !== lastCheckedProject) {
    //     setGithubStatus(GITHUB_STATUS.CHECKING_REPO);
    //     try {
    //       const repoExists = await checkRepository(activeProject.title);
    //       if (repoExists) {
    //         setGithubStatus(GITHUB_STATUS.REPO_EXISTS);
    //       }
    //     } catch (error) {
    //       console.error('Error checking repository:', error);
    //       toast.error('Failed to check repository status');
    //       setGithubStatus(GITHUB_STATUS.ERROR);
    //     }
    //   }
    // }
    // if (!githubToken) {
    //   // Redirect to GitHub OAuth
    //   const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    //   const redirectUri = encodeURIComponent(
    //     `${window.location.origin}/auth/github/callback`
    //   );
    //   const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo`;

    //   window.location.href = githubAuthUrl;
    //   return;
    // }

    // Check repository status if we have a token and active project
    // if (activeProject?.title) {
    //   try {
    //     setGithubStatus(GITHUB_STATUS.CHECKING_REPO);

    //     const repoExists = await checkRepository(activeProject.title);

    //     if (repoExists) {
    //       setGithubStatus(GITHUB_STATUS.REPO_EXISTS);
    //       toast.success('Repository connected successfully!');
    //     } else {
    //       setGithubStatus(GITHUB_STATUS.ERROR);
    //       toast.error('Repository not found. Please create one.');
    //     }
    //   } catch (error) {
    //     console.error('Error checking repository:', error);
    //     setGithubStatus(GITHUB_STATUS.ERROR);
    //     toast.error('Failed to check repository status');
    //   }
    // }
  };

  const handleGithubDisconnect = () => {
    disconnectGithub();
    closeDrawer();
  };

  // Handle GitHub OAuth callback
  useEffect(() => {
    const handleGitHubCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        console.error('GitHub OAuth error:', error);
        setGithubStatus(GITHUB_STATUS.ERROR);
        toast.error('GitHub authentication failed');
        return;
      }

      if (code && !githubToken) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/github/callback?code=${code}`
          );

          if (!response.ok) {
            throw new Error('Failed to authenticate with GitHub');
          }

          const data = await response.json();
          setGithubToken(data.accessToken);

          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          setGithubStatus(GITHUB_STATUS.AUTHENTICATED);
          toast.success('Connected to GitHub successfully!');

          // Auto-check repository status if we have an active project
          if (activeProject?.title) {
            setTimeout(async () => {
              try {
                const repoExists = await checkRepository(activeProject.title);
                if (repoExists) {
                  setGithubStatus(GITHUB_STATUS.REPO_EXISTS);
                }
              } catch (error) {
                console.error('Error checking repository after auth:', error);
              }
            }, 1000);
          }
        } catch (error) {
          console.error('Error during GitHub callback:', error);
          setGithubStatus(GITHUB_STATUS.ERROR);
          toast.error('Failed to complete GitHub authentication');
        }
      }
    };

    handleGitHubCallback();
  }, [
    githubToken,
    activeProject,
    setGithubToken,
    setGithubStatus,
    checkRepository,
  ]);

  // // Validate GitHub token and check repository on mount
  // useEffect(() => {
  //   const validateAndCheckRepo = async () => {
  //     if (!githubToken) {
  //       return;
  //     }

  //     try {
  //       const octokitInstance = new Octokit({ auth: githubToken });

  //       // Test the token
  //       await octokitInstance.request('GET /user');

  //       if (!activeProject?.title) {
  //         setGithubStatus(GITHUB_STATUS.AUTHENTICATED);
  //         return;
  //       }

  //       // Check if repository exists
  //       const repoExists = await checkRepository(activeProject.title);
  //       if (repoExists) {
  //         setGithubStatus(GITHUB_STATUS.REPO_EXISTS);
  //       } else {
  //         setGithubStatus(GITHUB_STATUS.AUTHENTICATED);
  //       }
  //     } catch (error) {
  //       console.error('GitHub token validation failed:', error);
  //       // Clear invalid token using Zustand's setGithubToken
  //       setGithubToken(null);

  //       setGithubStatus(GITHUB_STATUS.DISCONNECTED);
  //       toast.error('GitHub token expired. Please reconnect.');
  //     }
  //   };

  //   validateAndCheckRepo();
  // }, [githubToken, activeProject]);

  // Initialize GitHub connection
  useEffect(() => {
    const initializeGitHub = async () => {
      if (!githubToken) {
        console.log('No GitHub token found, skipping initialization');
        return;
      }

      try {
        const octokitInstance = new Octokit({ auth: githubToken });
        setOctokit(octokitInstance);

        // Verify token is still valid
        const { data: user } = await octokitInstance.request('GET /user', {
          headers: { 'X-GitHub-Api-Version': '2022-11-28' },
        });

        if (!user || !user.login) {
          throw new Error('Invalid GitHub token');
        }

        setGithubUsername(user.login);
        setGithubStatus(GITHUB_STATUS.AUTHENTICATED);

        // If there's an active project, check its repository status
        if (activeProject) {
          const repoExists = await checkRepository(activeProject.title);
          if (repoExists) {
            setGithubStatus(GITHUB_STATUS.REPO_EXISTS);
          }
        }
      } catch (error) {
        console.error('GitHub initialization failed:', error);

        // Clear invalid token using Zustand's setGithubToken
        setGithubToken(null);
        setOctokit(null);
        setGithubUsername(null);
        setGithubStatus(GITHUB_STATUS.DISCONNECTED);

        toast.error('GitHub session expired', {
          description: 'Please reconnect your GitHub account',
        });
      }
    };

    initializeGitHub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubToken, activeProject]);

  return (
    <Drawer
      direction="right"
      open={activeDrawer === DrawerType.GITHUB_STATUS}
      onOpenChange={() => closeDrawer()}
    >
      <DrawerContent className="w-96">
        <DrawerHeader className="bg-secondary/30">
          <DrawerTitle className="flex items-center gap-2">
            <Github size={18} className="text-primary" />
            Github Integration
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Github Actions Section */}
          <div className="p-5 border-b border-border/50">
            {githubStatus === GITHUB_STATUS.CHECKING_REPO && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-yellow-500">
                  <Loader2 size={18} className="animate-spin" />
                  <p className="text-sm font-medium">
                    Checking repository status...
                  </p>
                </div>
              </div>
            )}

            {githubStatus === GITHUB_STATUS.CREATING_REPO && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-yellow-500">
                  <Loader2 size={18} className="animate-spin" />
                  <p className="text-sm font-medium">Creating repository...</p>
                </div>
              </div>
            )}

            {githubStatus === GITHUB_STATUS.REPO_EXISTS && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 size={18} />
                  <p className="text-sm font-medium">
                    Repository connected to Github
                  </p>
                </div>
                <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-md">
                  <p className="text-sm text-green-700 dark:text-neutral-300 font-medium mb-2">
                    Ready to push changes
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Your code changes will be committed to your Github
                    repository.
                  </p>
                  <Button
                    onClick={showCommitDialog}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={commitInProgress}
                  >
                    <div className="flex items-center gap-2 text-black">
                      <Github size={16} />
                      {commitInProgress ? 'Committing...' : 'Commit Changes'}
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {githubStatus === GITHUB_STATUS.AUTHENTICATED && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-yellow-500">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <p className="text-sm font-medium">
                    Github account connected
                  </p>
                </div>
                <div className="p-3 bg-secondary/40 border border-border rounded-md">
                  <p className="text-sm font-medium mb-2">
                    Create a repository for this project
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Create a repository named{' '}
                    <span className="font-mono bg-secondary/70 px-1.5 py-0.5 rounded">
                      {activeProject?.title}
                    </span>
                  </p>
                  <Button onClick={handleCreateRepository} className="w-full">
                    <div className="flex items-center gap-2">
                      <PlusIcon size={16} />
                      Create Repository
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {githubStatus === GITHUB_STATUS.ERROR && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle size={18} />
                  <p className="text-sm font-medium">
                    Error connecting to repository
                  </p>
                </div>
                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive font-medium mb-2">
                    Failed to connect repository
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Try creating a new repository for this project.
                  </p>
                  <Button onClick={handleCreateRepository} className="w-full">
                    <div className="flex items-center gap-2">
                      <PlusIcon size={16} />
                      Create Repository
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {(!githubStatus || githubStatus === GITHUB_STATUS.DISCONNECTED) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <p className="text-sm font-medium">Not connected to Github</p>
                </div>
                <div className="p-3 bg-secondary/40 border border-border rounded-md">
                  <p className="text-sm font-medium mb-2">
                    Connect your Github account
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Link your Github account to push code changes to
                    repositories.
                  </p>
                  <Button onClick={handleGithubClick} className="w-full">
                    <div className="flex items-center gap-2">
                      <Github size={16} />
                      Connect Github Account
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Status Steps Section */}
          {statusSteps.length > 0 && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-primary/90">
                  Recent Activity
                </h4>
                {statusSteps.some(
                  (step) => step.status === 'success' || step.status === 'error'
                ) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setStatusSteps([])}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="space-y-0.5">
                {statusSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-start gap-3 pb-8">
                      <div className="mt-1">
                        {step.status === 'loading' ? (
                          <div className="w-6 h-6 flex items-center justify-center bg-primary/10 rounded-full">
                            <Loader2
                              size={16}
                              className="text-primary animate-spin"
                            />
                          </div>
                        ) : step.status === 'success' ? (
                          <div className="w-6 h-6 flex items-center justify-center bg-green-500/10 rounded-full">
                            <CheckCircle2
                              size={16}
                              className="text-green-500"
                            />
                          </div>
                        ) : step.status === 'error' ? (
                          <div className="w-6 h-6 flex items-center justify-center bg-destructive/10 rounded-full">
                            <XCircle size={16} className="text-destructive" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 flex items-center justify-center bg-secondary/40 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{step.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {step.description}
                        </p>
                        {step.status === 'error' && step.error && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md flex items-start gap-2"
                          >
                            <AlertCircle
                              size={14}
                              className="mt-0.5 shrink-0"
                            />
                            <span>{step.error}</span>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {index < statusSteps.length - 1 && (
                      <div
                        className="absolute left-3 top-7 bottom-0 w-px bg-border"
                        style={{ transform: 'translateX(50%)' }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-border bg-secondary/20">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => closeDrawer()}
            >
              Close
            </Button>
            {githubStatus !== GITHUB_STATUS.DISCONNECTED && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleGithubDisconnect}
              >
                Disconnect
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
