'use client';

import { toast } from 'sonner';
import {
  Github,
  Loader2,
  ChevronDown,
  FolderOpen,
  Info,
  Rocket,
  Copy,
  Check,
  LogOutIcon,
  UserIcon,
  SquareArrowOutUpRight,
  // SquarePen,
} from 'lucide-react';
import { useWallet } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Framework } from '@/types';
import React, { useState, useEffect } from 'react';
import { useGlobalState } from '@/hooks';
import { Octokit } from '@octokit/core';
import Link from 'next/link';
import axios from 'axios';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { useRouter } from 'next/navigation';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DrawerType, GITHUB_STATUS } from '@/hooks/useGlobalState';
import { uploadToTurbo } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const TitleBar = () => {
  const disconnect = useWallet((state) => state.disconnect);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [, copyToClipboard] = useCopyToClipboard();
  const [copy, setCopy] = useState<boolean>(false);

  const isLoading = useGlobalState((state) => state.isLoading);
  const isCodeGenerating = useGlobalState((state) => state.isCodeGenerating);
  const { openDrawer } = useGlobalState();
  const { connected, address, shortAddress } = useWallet();
  const {
    setOctokit,
    setGithubStatus,
    setGithubToken,
    githubToken,
    githubStatus,
    setGithubUsername,
  } = useGlobalState();

  const {
    activeProject,
    codebase,
    deploymentUrl,
    setDeploymentUrl,
    chatMessages,
  } = useGlobalState();

  const { user } = useWallet();
  const router = useRouter();
  // Add unified disabled states
  const commonDisabledState =
    isCodeGenerating ||
    isLoading ||
    isDeploying ||
    !connected ||
    !activeProject;
  const deployDisabledState =
    commonDisabledState ||
    !codebase ||
    (chatMessages && chatMessages?.length === 0);
  const githubButtonDisabledState =
    !connected ||
    githubStatus ===
      (GITHUB_STATUS.CHECKING_REPO ||
        GITHUB_STATUS.CREATING_REPO ||
        GITHUB_STATUS.COMMITTING);

  // Get status dot color class
  const getStatusDotClass = () => {
    switch (githubStatus) {
      case 'repo_exists':
        return 'bg-green-500';
      case 'authenticated':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-destructive';
      case 'checking_repo':
        return 'bg-blue-500 animate-pulse';
      case 'creating_repo':
        return 'bg-yellow-500 animate-pulse';
      case 'committing':
        return 'bg-green-500 animate-pulse';
      default:
        return 'bg-muted-foreground';
    }
  };

  // Get the appropriate Github button title
  const getGithubButtonTitle = () => {
    switch (githubStatus) {
      case GITHUB_STATUS.DISCONNECTED:
        return 'Connect to Github';
      case GITHUB_STATUS.AUTHENTICATED:
        return 'Github account connected. Click to manage repository.';
      case GITHUB_STATUS.CHECKING_REPO:
        return 'Checking if repository exists';
      case GITHUB_STATUS.CREATING_REPO:
        return 'Creating new repository';
      case GITHUB_STATUS.REPO_EXISTS:
        return 'Repository connected. Click to push changes.';
      case GITHUB_STATUS.COMMITTING:
        return 'Pushing changes to Github';
      case GITHUB_STATUS.ERROR:
        return 'An error occurred with Github';
      default:
        return 'Manage Github connection';
    }
  };

  // // Step 3: Create a new repository
  // const handleCreateRepository = async () => {
  //   if (!octokit || !githubUsername || !activeProject) {
  //     setGithubStatus(GITHUB_STATUS.ERROR);
  //     throw new Error('Missing required parameters');
  //   }

  //   setGithubStatus(GITHUB_STATUS.CREATING_REPO);

  //   try {
  //     const createResponse = await octokit.request('POST /user/repos', {
  //       name: activeProject.title,
  //       description: 'Created with ANON AI',
  //       private: true,
  //       headers: { 'X-GitHub-Api-Version': '2022-11-28' },
  //     });

  //     if (createResponse.status === 201) {
  //       updateStepStatus('create-repo', 'success');
  //       setGithubStatus(GITHUB_STATUS.REPO_EXISTS);
  //       toast.success('New repository created successfully!');
  //       return true;
  //     }
  //     return false;
  //   } catch (err) {
  //     updateStepStatus('create-repo', 'error', (err as Error).message);
  //     const error = err as GithubError;

  //     if (
  //       error.response?.data?.errors?.some((e) =>
  //         e.message?.includes('name already exists')
  //       )
  //     ) {
  //       try {
  //         const exists = await checkRepository(activeProject.title);
  //         return exists;
  //       } catch {
  //         setGithubStatus(GITHUB_STATUS.ERROR);
  //         setError(
  //           'A repository with this name already exists but is not accessible'
  //         );
  //         toast.error('Repository name conflict', {
  //           description:
  //             'A repository with this name already exists but is not accessible. Please use a different project name.',
  //         });
  //         return false;
  //       }
  //     }

  //     setGithubStatus(GITHUB_STATUS.ERROR);
  //     setError(error.message || 'Failed to create repository');
  //     toast.error('Failed to create repository');
  //     return false;
  //   }
  // };

  // Determine if repo is ready to commit
  const isRepoReadyToCommit = githubStatus === GITHUB_STATUS.REPO_EXISTS;

  // Refresh commits
  // const refreshCommits = async () => {
  //   if (!activeProject || !githubToken) {
  //     console.log(
  //       'Cannot refresh commits: missing activeProject or githubToken'
  //     );
  //     toast.error('Github connection required to view commits');
  //     return;
  //   }

  //   if (githubStatus !== GITHUB_STATUS.REPO_EXISTS) {
  //     console.log('Repository does not exist yet, skipping commit refresh');
  //     setCommits([]);
  //     setCommitError('No commits available. Please create a repository first.');
  //     toast.info('No repository found for this project');
  //     return;
  //   }

  //   setIsLoadingCommits(true);
  //   setCommitError(null);

  //   try {
  //     console.log(
  //       `Manually refreshing commits for project: ${activeProject.title}`
  //     );
  //     const response = await fetch(
  //       `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/github/commits?token=${githubToken}&repo=${activeProject.title}`
  //     );

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       if (response.status === 404) {
  //         console.log('Repository or commits not found (404)');
  //         setCommits([]);
  //         setCommitError('No commits found. Repository may be empty.');
  //         toast.info('No commits found in this repository');
  //         return;
  //       }
  //       throw new Error(errorData.details || 'Failed to fetch commits');
  //     }

  //     const data = await response.json();
  //     console.log('Commits refreshed successfully:', data.commits);
  //     setCommits(data.commits || []);
  //     toast.success('Commits refreshed');
  //   } catch (error) {
  //     console.error('Error refreshing commits:', error);
  //     setCommitError(
  //       error instanceof Error ? error.message : 'Unknown error occurred'
  //     );
  //     setCommits([]);
  //     toast.error('Failed to refresh commits');
  //   } finally {
  //     setIsLoadingCommits(false);
  //   }
  // };

  // Initialize GitHub connection
  // useEffect(() => {
  //   const initializeGitHub = async () => {
  //     if (!githubToken) {
  //       console.log('No GitHub token found, skipping initialization');
  //       return;
  //     }

  //     try {
  //       const octokitInstance = new Octokit({ auth: githubToken });
  //       setOctokit(octokitInstance);

  //       // Verify token is still valid
  //       const { data: user } = await octokitInstance.request('GET /user', {
  //         headers: { 'X-GitHub-Api-Version': '2022-11-28' },
  //       });

  //       if (!user || !user.login) {
  //         throw new Error('Invalid GitHub token');
  //       }

  //       setGithubUsername(user.login);
  //       setGithubStatus(GITHUB_STATUS.AUTHENTICATED);

  //       // If there's an active project, check its repository status
  //       if (activeProject) {
  //         const repoExists = await checkRepository(activeProject.title);
  //         if (repoExists) {
  //           setGithubStatus(GITHUB_STATUS.REPO_EXISTS);
  //         }
  //       }
  //     } catch (error) {
  //       console.error('GitHub initialization failed:', error);

  //       // Clear invalid token using Zustand's setGithubToken
  //       setGithubToken(null);
  //       setOctokit(null);
  //       setGithubUsername(null);
  //       setGithubStatus(GITHUB_STATUS.DISCONNECTED);

  //       toast.error('GitHub session expired', {
  //         description: 'Please reconnect your GitHub account',
  //       });
  //     }
  //   };

  //   initializeGitHub();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [githubToken, activeProject]);

  // Handle Github auth redirect
  useEffect(() => {
    const handleGithubAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const error = urlParams.get('error');

      if (error) {
        toast.error('GitHub Authentication Failed', {
          description: error,
        });
        setGithubStatus(GITHUB_STATUS.ERROR);
        return;
      }

      if (accessToken) {
        try {
          // Initialize Octokit with the new token
          const octokitInstance = new Octokit({ auth: accessToken });

          // Verify token by making a test API call
          const { data: user } = await octokitInstance.request('GET /user', {
            headers: { 'X-GitHub-Api-Version': '2022-11-28' },
          });

          if (!user || !user.login) {
            throw new Error('Failed to get GitHub user info');
          }

          // Store token and update state using Zustand
          setGithubToken(accessToken);
          setOctokit(octokitInstance);
          setGithubUsername(user.login);
          setGithubStatus(GITHUB_STATUS.AUTHENTICATED);

          // Clear URL parameters
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          toast.success('Successfully connected to Github', {
            description: `Connected as ${user.login}`,
          });
        } catch (error) {
          console.error('Error initializing GitHub:', error);
          toast.error('Failed to initialize GitHub connection', {
            description:
              error instanceof Error ? error.message : 'Unknown error occurred',
          });
          setGithubStatus(GITHUB_STATUS.ERROR);
        }
      }
    };

    handleGithubAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle GitHub disconnect
  // const handleGithubDisconnect = () => {
  //   try {
  //     // Use Zustand's setGithubToken instead of localStorage
  //     disconnectGithub();
  //     setLastCheckedProject(null);
  //     setIsStatusDrawerOpen(false);
  //     toast.info('Disconnected from GitHub');
  //   } catch (error) {
  //     console.error('Error disconnecting from GitHub:', error);
  //     toast.error('Failed to disconnect from GitHub');
  //   }
  // };

  // Step 1: Connect to GitHub (Authentication)
  // const handleGithubClick = async () => {
  //   if (!githubToken) {
  //     // Start GitHub OAuth flow
  //     try {
  //       const authUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/github`;
  //       window.location.href = authUrl;
  //     } catch (error) {
  //       console.error('Failed to initiate GitHub auth:', error);
  //       toast.error('Failed to connect to GitHub');
  //     }
  //   } else if (!activeProject) {
  //     toast.error('Please select a project first');
  //   } else {
  //     if (activeProject.title !== lastCheckedProject) {
  //       setGithubStatus(GITHUB_STATUS.CHECKING_REPO);
  //       try {
  //         const repoExists = await checkRepository(activeProject.title);
  //         if (repoExists) {
  //           setGithubStatus(GITHUB_STATUS.REPO_EXISTS);
  //         }
  //       } catch (error) {
  //         console.error('Error checking repository:', error);
  //         toast.error('Failed to check repository status');
  //         setGithubStatus(GITHUB_STATUS.ERROR);
  //       }
  //     }
  //     openDrawer('githubStatus');
  //   }
  // };

  const handleDeploy = async () => {
    if (isDeploying) {
      toast.error('Deployment already in progress');
      return;
    }
    setIsDeploying(true);
    try {
      console.log('Deploying project...');
      if (!activeProject?.projectId || !address) {
        toast.error(
          'Project ID and wallet address are required for deployment'
        );
        return;
      }

      // @ts-expect-error index.html is always present in the codebase
      const blob = new Blob([codebase['/index.html'] as string], {
        type: 'text/html',
      });
      const file = new File([blob], activeProject.title, {
        type: 'text/html',
      });
      const txnID = await uploadToTurbo(file, address);
      const deploymentUrl = `https://arweave.net/${txnID}`;

      const updateStatus = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${activeProject.projectId}`,
        {
          deploymentUrl: deploymentUrl,
        },
        {
          params: {
            walletAddress: address,
          },
        }
      );

      if (updateStatus.data?.project?.deploymentUrl) {
        setDeploymentUrl(deploymentUrl);
        toast.success('Project deployed successfully!');
        console.log('Deployment status updated:', updateStatus.data);
      } else {
        throw new Error('Failed to update deployment URL');
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      toast.error('Failed to deploy project', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <>
      <div className="border-b border-border/50 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 flex justify-between items-center pl-2 pr-5">
        {/* Main Toolbar */}
        <div className="h-14 flex items-center gap-4 max-w-screen-2xl">
          {/* Project Selection Button - Opens Drawer */}
          <button
            className="h-9 min-w-[180px] px-3 flex items-center justify-between gap-2 bg-secondary/60 hover:bg-secondary/80 border border-border/50 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => openDrawer(DrawerType.CREATE_PROJECT)}
            disabled={commonDisabledState}
            title="Select Project"
            aria-label="Select Project"
          >
            <div className="flex items-center gap-2 truncate">
              <FolderOpen size={16} className="text-primary/80 shrink-0" />
              <span className="truncate">
                {activeProject ? activeProject.title : 'Select Project'}
              </span>
            </div>
            <ChevronDown size={14} className="text-muted-foreground shrink-0" />
          </button>

          {/* Project Info Button */}
          {activeProject?.framework !== Framework.Html && (
            <>
              <Button
                variant="outline"
                onClick={() => openDrawer(DrawerType.PROJECT_INFO)}
                disabled={commonDisabledState}
                title="Active Project Information"
                aria-label="Active Project Information"
              >
                <Info size={16} className="text-primary/80" />
                <span>Info</span>
              </Button>

              {/* Github Button */}
              <div className="relative">
                <button
                  className={`
                relative h-9 px-3 flex items-center gap-2 rounded-md shadow-sm
                transition-all duration-200
                ${
                  isRepoReadyToCommit
                    ? 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/30'
                    : githubStatus === GITHUB_STATUS.ERROR
                      ? 'bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/30'
                      : 'bg-secondary/40 hover:bg-secondary/70 border border-border/40 hover:border-border/70'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
                  onClick={() => openDrawer(DrawerType.GITHUB_STATUS)}
                  title={getGithubButtonTitle()}
                  disabled={githubButtonDisabledState || commonDisabledState}
                  aria-label={getGithubButtonTitle()}
                >
                  {githubStatus === GITHUB_STATUS.CHECKING_REPO ||
                  githubStatus === GITHUB_STATUS.CREATING_REPO ||
                  githubStatus === GITHUB_STATUS.COMMITTING ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Github
                      size={16}
                      className={
                        isRepoReadyToCommit
                          ? 'text-green-500'
                          : githubStatus === GITHUB_STATUS.ERROR
                            ? 'text-destructive'
                            : 'text-foreground'
                      }
                    />
                  )}
                  {/* Status Dot */}
                  {githubToken && (
                    <div
                      className={`
                  absolute top-1.5 right-1.5 w-2 h-2 rounded-full 
                  ${getStatusDotClass()}
                  shadow-sm ring-1 ring-background
                `}
                    />
                  )}
                  {!githubToken && <span>Github</span>}
                </button>
              </div>

              <Button
                variant="outline"
                disabled={true}
                title="Coming Soon"
                aria-label="Deploy Project"
                className="h-9 px-3 flex items-center gap-2 bg-secondary/40 hover:bg-secondary/70 border border-border/40 hover:border-border/70 disabled:opacity-40 disabled:cursor-not-allowed rounded-md shadow-sm transition-all duration-200"
              >
                <Rocket size={16} />
                <span>Deploy</span>
                <span className="text-muted-foreground">(Coming Soon)</span>
              </Button>
            </>
          )}

          {/* Deploy Button and Status */}
          {activeProject?.framework === Framework.Html && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDeploy}
                disabled={deployDisabledState}
                variant="outline"
                className={`relative ${isDeploying ? 'animate-pulse' : ''}`}
                title={
                  !connected
                    ? 'Connect wallet to deploy'
                    : !activeProject
                      ? 'Select a project to deploy'
                      : !codebase || chatMessages?.length === 0
                        ? 'Generate some code before deploying'
                        : isDeploying
                          ? 'Deployment in progress'
                          : deploymentUrl
                            ? 'Redeploy project with latest changes'
                            : 'Deploy project'
                }
              >
                {isDeploying ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    <span className="animate-pulse">
                      Publishing to Permaweb...
                    </span>
                  </>
                ) : (
                  <>
                    {deploymentUrl ? (
                      <Rocket size={16} className="mr-2" />
                    ) : (
                      <Rocket size={16} className="mr-2" />
                    )}
                    <span>{deploymentUrl ? 'Redeploy' : 'Deploy'}</span>
                  </>
                )}
              </Button>

              {deploymentUrl && (
                <div className="flex items-center bg-card/50 rounded-lg border border-border shadow-sm overflow-hidden">
                  <Link
                    href={deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 transition-colors duration-200 border-r border-border/50"
                  >
                    <SquareArrowOutUpRight
                      size={16}
                      className="text-primary mr-2"
                    />
                    <span className="text-sm font-medium">View Live</span>
                  </Link>
                  <button
                    className="flex items-center px-4 py-2 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => {
                      setCopy(true);
                      copyToClipboard(deploymentUrl);
                      toast.success('Deployment URL copied to clipboard');
                      setTimeout(() => setCopy(false), 2000);
                    }}
                    title="Copy deployment URL"
                  >
                    {copy ? (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <Check size={16} className="mr-2" />
                        <span className="text-sm font-medium">Copied!</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Copy size={16} className="mr-2" />
                        <span className="text-sm font-medium">Copy URL</span>
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {connected && (
          <div className="flex items-center gap-2">
            {/* Refresh Project Button */}
            {/* <button
              onClick={onRefresh}
              disabled={commonDisabledState}
              className="h-9 px-3 flex items-center gap-2 bg-secondary/30 hover:bg-secondary/70 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              title="Refresh Projects"
              aria-label="Refresh Projects"
            >
              <RefreshCwIcon size={16} className="text-primary/80" />
              <span>Sync</span>
            </button> */}

            <DropdownMenu>
              {/* <DropdownMenuTrigger className="h-9 px-3 flex items-center gap-2 bg-secondary/30 hover:bg-secondary/70 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"> */}
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
                  onClick={() => router.push('/profile')}
                >
                  <UserIcon size={16} className="text-primary/80" />
                  <span>Profile</span>
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
    </>
  );
};

export default TitleBar;
