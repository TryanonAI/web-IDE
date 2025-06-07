'use client';

import { toast } from 'sonner';
import {
  PlusIcon,
  RefreshCwIcon,
  Github,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  FolderOpen,
  Info,
  GitCommit,
  Clock,
  Calendar,
  User,
  Code,
  LayoutGrid,
  ExternalLink,
  MessageSquare,
  Rocket,
  Eye,
  Copy,
  Check,
  LogOutIcon,
  UserIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useWallet } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Commit, Framework } from '@/types';
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useGlobalState } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Octokit } from '@octokit/core';
import Link from 'next/link';
import { uploadToTurbo } from '@/lib/turbo-utils';
import axios from 'axios';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { useRouter } from 'next/navigation';

type StatusStep = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
};

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { GITHUB_STATUS, GithubError } from '@/hooks/useGlobalState';

const TitleBar = () => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const disconnect = useWallet((state) => state.disconnect);
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [commitError, setCommitError] = useState<string | null>(null);
  const [isStatusDrawerOpen, setIsStatusDrawerOpen] = useState<boolean>(false);
  const [isCommitDialogOpen, setIsCommitDialogOpen] = useState<boolean>(false);
  const [isProjectInfoDrawerOpen, setIsProjectInfoDrawerOpen] =
    useState<boolean>(false);
  const [lastCheckedProject, setLastCheckedProject] = useState<string | null>(
    null
  );
  const [commitInProgress, setCommitInProgress] = useState<boolean>(false);
  const [statusSteps, setStatusSteps] = useState<StatusStep[]>([]);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [, copyToClipboard] = useCopyToClipboard();
  const [copy, setCopy] = useState<boolean>(false);

  const isLoading = useGlobalState((state) => state.isLoading);
  const isCodeGenerating = useGlobalState((state) => state.isCodeGenerating);
  const { openDrawer } = useGlobalState();
  const { connected, address, shortAddress } = useWallet();
  const {
    setOctokit,
    checkRepository,
    commitToRepository,
    setIsLoadingCommits,
    setGithubStatus,
    setGithubToken,
    octokit,
    githubToken,
    githubStatus,
    githubUsername,
    isLoadingCommits,
    setGithubUsername,
    disconnectGithub,
  } = useGlobalState();

  const {
    activeProject,
    // fetchProjects: onRefresh,
    setError,
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

  // Step 3: Create a new repository
  const handleCreateRepository = async () => {
    if (!octokit || !githubUsername || !activeProject) {
      setGithubStatus(GITHUB_STATUS.ERROR);
      throw new Error('Missing required parameters');
    }

    initRepoCreationSteps();
    setGithubStatus(GITHUB_STATUS.CREATING_REPO);

    try {
      updateStepStatus('create-repo', 'loading');
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

  // Initialize steps for repository creation
  const initRepoCreationSteps = async () => {
    setStatusSteps([
      {
        id: 'auth-check',
        title: 'Checking Github Authentication',
        description: 'Verifying your Github credentials...',
        status: 'pending',
      },
      {
        id: 'create-repo',
        title: 'Creating Repository',
        description: `Creating repository: ${activeProject?.title}`,
        status: 'pending',
      },
      {
        id: 'init-repo',
        title: 'Initializing Repository',
        description: 'Setting up the initial repository structure...',
        status: 'pending',
      },
    ]);
  };

  // Initialize steps for pushing changes
  const initPushSteps = () => {
    setStatusSteps([
      {
        id: 'prepare-files',
        title: 'Preparing Files',
        description: 'Gathering and preparing files for commit...',
        status: 'pending',
      },
      {
        id: 'create-commit',
        title: 'Creating Commit',
        description: 'Creating a new commit with your changes...',
        status: 'pending',
      },
      {
        id: 'push-changes',
        title: 'Pushing to GitHub',
        description: 'Uploading your changes to GitHub...',
        status: 'pending',
      },
    ]);
  };

  // Show commit dialog
  const showCommitDialog = () => {
    setCommitMessage(
      `Update project ${activeProject?.title} - ${new Date().toLocaleString()}`
    );
    setIsCommitDialogOpen(true);
  };

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

  // Handle commit to repository
  const handleCommitToRepo = async () => {
    if (!activeProject || !commitMessage.trim()) {
      toast.error('Please provide a commit message');
      return;
    }

    if (!address) {
      toast.error('Wallet must be connected to commit changes');
      return;
    }

    setIsCommitDialogOpen(false);
    setCommitInProgress(true);
    initPushSteps();

    try {
      updateStepStatus('prepare-files', 'loading');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateStepStatus('prepare-files', 'success');

      updateStepStatus('create-commit', 'loading');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      updateStepStatus('create-commit', 'success');

      updateStepStatus('push-changes', 'loading');
      // Set forcePush to false for sequential commits
      await commitToRepository(activeProject, address, false, commitMessage);
      updateStepStatus('push-changes', 'success');

      await refreshCommits();
      toast.success('Changes pushed to Github');
      setTimeout(() => setIsStatusDrawerOpen(false), 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      const currentStep = statusSteps.find((step) => step.status === 'loading');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error', errorMessage);
      }
      console.error('Error pushing to Github:', error);
      toast.error('Failed to push changes', { description: errorMessage });
    } finally {
      setCommitInProgress(false);
    }
  };

  // Determine if repo is ready to commit
  const isRepoReadyToCommit = githubStatus === GITHUB_STATUS.REPO_EXISTS;

  // Refresh commits
  const refreshCommits = async () => {
    if (!activeProject || !githubToken) {
      console.log(
        'Cannot refresh commits: missing activeProject or githubToken'
      );
      toast.error('Github connection required to view commits');
      return;
    }

    if (githubStatus !== GITHUB_STATUS.REPO_EXISTS) {
      console.log('Repository does not exist yet, skipping commit refresh');
      setCommits([]);
      setCommitError('No commits available. Please create a repository first.');
      toast.info('No repository found for this project');
      return;
    }

    setIsLoadingCommits(true);
    setCommitError(null);

    try {
      console.log(
        `Manually refreshing commits for project: ${activeProject.title}`
      );
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/github/commits?token=${githubToken}&repo=${activeProject.title}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404) {
          console.log('Repository or commits not found (404)');
          setCommits([]);
          setCommitError('No commits found. Repository may be empty.');
          toast.info('No commits found in this repository');
          return;
        }
        throw new Error(errorData.details || 'Failed to fetch commits');
      }

      const data = await response.json();
      console.log('Commits refreshed successfully:', data.commits);
      setCommits(data.commits || []);
      toast.success('Commits refreshed');
    } catch (error) {
      console.error('Error refreshing commits:', error);
      setCommitError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      setCommits([]);
      toast.error('Failed to refresh commits');
    } finally {
      setIsLoadingCommits(false);
    }
  };

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
  const handleGithubDisconnect = () => {
    try {
      // Use Zustand's setGithubToken instead of localStorage
      disconnectGithub();
      setLastCheckedProject(null);
      setIsStatusDrawerOpen(false);
      toast.info('Disconnected from GitHub');
    } catch (error) {
      console.error('Error disconnecting from GitHub:', error);
      toast.error('Failed to disconnect from GitHub');
    }
  };

  // Step 1: Connect to GitHub (Authentication)
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
    } else {
      if (activeProject.title !== lastCheckedProject) {
        setGithubStatus(GITHUB_STATUS.CHECKING_REPO);
        try {
          const repoExists = await checkRepository(activeProject.title);
          if (repoExists) {
            setGithubStatus(GITHUB_STATUS.REPO_EXISTS);
          }
        } catch (error) {
          console.error('Error checking repository:', error);
          toast.error('Failed to check repository status');
          setGithubStatus(GITHUB_STATUS.ERROR);
        }
      }
      setIsStatusDrawerOpen(true);
    }
  };

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

      const blob = new Blob([codebase as string], { type: 'text/html' });
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

  // Update project button click handler
  const handleProjectButtonClick = () => {
    openDrawer('project');
  };

  return (
    <>
      <div className="border-b border-border/50 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 flex justify-between items-center pl-2 pr-5">
        {/* Main Toolbar */}
        <div className="h-14 flex items-center gap-4 max-w-screen-2xl">
          {/* Project Selection Button - Opens Drawer */}
          <button
            className="h-9 min-w-[180px] px-3 flex items-center justify-between gap-2 bg-secondary/60 hover:bg-secondary/80 border border-border/50 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleProjectButtonClick}
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

          {/* New Project Button */}
          {/* Hidden coz we have a button in the project drawer */}
          {/* <button
            onClick={handleOpenCreateProjectDialog}
            className="group h-9 px-3 flex items-center gap-2 bg-secondary/30 hover:bg-secondary/70 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow disabled:opacity-40 disabled:cursor-not-allowed"
            title="Create New Project"
            aria-label="Create New Project"
            disabled={commonDisabledState}
          >
            <PlusIcon
              size={16}
              className="text-primary group-hover:text-primary/90"
            />
            <span>New</span>
          </button> */}

          {/* Project Info Button */}
          {activeProject?.framework !== Framework.Html && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsProjectInfoDrawerOpen(true)}
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
                  onClick={handleGithubClick}
                  title={getGithubButtonTitle()}
                  disabled={githubButtonDisabledState}
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
            </>
          )}

          {/* Deploy Button and Status */}
          {activeProject?.framework === Framework.Html && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDeploy}
                disabled={deployDisabledState}
                variant="outline"
                className="relative"
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
                    <span>Deploying...</span>
                  </>
                ) : (
                  <>
                    <Rocket size={16} className="mr-2" />
                    <span>{deploymentUrl ? 'Redeploy' : 'Deploy'}</span>
                  </>
                )}
              </Button>

              {deploymentUrl && (
                <div className="flex items-center bg-secondary/20 rounded-md border border-border/50 p-1">
                  <Link
                    href={deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-1.5 hover:bg-secondary/40 rounded-sm transition-colors"
                  >
                    <Eye size={16} className="text-primary/80 mr-2" />
                    <span className="mr-1">View Live</span>
                  </Link>
                  <div className="h-4 w-px bg-border/50 mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-8 px-3 hover:bg-secondary/40"
                    onClick={() => {
                      setCopy(true);
                      copyToClipboard(deploymentUrl);
                      toast.success('Deployment URL copied to clipboard');
                      setTimeout(() => setCopy(false), 2000);
                    }}
                    title="Copy deployment URL"
                  >
                    {copy ? (
                      <div className="flex items-center text-green-500">
                        <Check size={16} className="mr-1.5" />
                        <span className="text-sm">Copied!</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Copy size={16} className="mr-1.5" />
                        <span className="text-sm">Copy URL</span>
                      </div>
                    )}
                  </Button>
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

      {/* Status Drawer with Github Actions */}
      <AnimatePresence>
        {isStatusDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setIsStatusDrawerOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                duration: 0.25,
                ease: 'easeInOut',
              }}
              className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-xl z-50 overflow-hidden"
            >
              <div className="h-full flex flex-col">
                {/* Drawer Header */}
                <div className="p-4 border-b border-border/70 flex items-center justify-between bg-secondary/30">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Github size={18} className="text-primary" />
                    Github Integration
                  </h3>
                  <button
                    onClick={() => setIsStatusDrawerOpen(false)}
                    className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                  >
                    <XCircle size={18} />
                  </button>
                </div>

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
                          <p className="text-sm font-medium">
                            Creating repository...
                          </p>
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
                              {commitInProgress
                                ? 'Committing...'
                                : 'Commit Changes'}
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
                          <Button
                            onClick={handleCreateRepository}
                            className="w-full"
                          >
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
                          <Button
                            onClick={handleCreateRepository}
                            className="w-full"
                          >
                            <div className="flex items-center gap-2">
                              <PlusIcon size={16} />
                              Create Repository
                            </div>
                          </Button>
                        </div>
                      </div>
                    )}

                    {(!githubStatus ||
                      githubStatus === GITHUB_STATUS.DISCONNECTED) && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                          <p className="text-sm font-medium">
                            Not connected to Github
                          </p>
                        </div>
                        <div className="p-3 bg-secondary/40 border border-border rounded-md">
                          <p className="text-sm font-medium mb-2">
                            Connect your Github account
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Link your Github account to push code changes to
                            repositories.
                          </p>
                          <Button
                            onClick={handleGithubClick}
                            className="w-full"
                          >
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
                          (step) =>
                            step.status === 'success' || step.status === 'error'
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
                                    <XCircle
                                      size={16}
                                      className="text-destructive"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 flex items-center justify-center bg-secondary/40 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1">
                                <h4 className="text-sm font-medium">
                                  {step.title}
                                </h4>
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

                {/* Drawer Footer */}
                <div className="p-4 border-t border-border flex gap-2 bg-secondary/20">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsStatusDrawerOpen(false)}
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Project Info Drawer */}
      <AnimatePresence>
        {isProjectInfoDrawerOpen && activeProject && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setIsProjectInfoDrawerOpen(false)}
            />

            {/* Project Info Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                duration: 0.25,
                ease: 'easeInOut',
              }}
              className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-xl z-50 overflow-hidden"
            >
              <div className="h-full flex flex-col">
                {/* Drawer Header */}
                <div className="p-4 border-b border-border/70 flex items-center justify-between bg-secondary/30">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Info size={18} className="text-primary" />
                    Project Information
                  </h3>
                  <button
                    onClick={() => setIsProjectInfoDrawerOpen(false)}
                    className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                  >
                    <XCircle size={18} />
                  </button>
                </div>

                {/* Project Info Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Project Details */}
                  <div className="p-5 border-b border-border/50">
                    <h4 className="text-sm font-medium text-primary/90 mb-3 flex items-center gap-2">
                      <LayoutGrid size={16} />
                      Project Details
                    </h4>

                    <div className="bg-card p-4 rounded-md border border-border/50">
                      <div className="mb-4">
                        <h2 className="text-xl font-semibold mb-1">
                          {activeProject.title}
                        </h2>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar
                            size={14}
                            className="text-muted-foreground"
                          />
                          <span>{'Created: '}</span>
                          <span className="text-muted-foreground">
                            {new Date(
                              activeProject.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-muted-foreground" />
                          <span>Updated: </span>
                          <span className="text-muted-foreground">
                            {new Date(
                              activeProject.updatedAt
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 col-span-2">
                          <Code size={14} className="text-muted-foreground" />
                          <span>ID: </span>
                          <code className="bg-secondary/40 px-1.5 py-0.5 rounded text-xs">
                            {activeProject.projectId}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Github Connection Status */}
                  <div className="p-5 border-b border-border/50">
                    <h4 className="text-sm font-medium text-primary/90 mb-3 flex items-center gap-2">
                      <Github size={16} />
                      Github Status
                    </h4>

                    <div
                      className={`p-3 rounded-md border ${
                        githubStatus === GITHUB_STATUS.REPO_EXISTS
                          ? 'bg-green-500/5 border-green-500/20'
                          : githubStatus === GITHUB_STATUS.AUTHENTICATED
                            ? 'bg-yellow-500/5 border-yellow-500/20'
                            : githubStatus === GITHUB_STATUS.ERROR
                              ? 'bg-destructive/5 border-destructive/20'
                              : 'bg-secondary/40 border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {githubStatus === GITHUB_STATUS.REPO_EXISTS ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : githubStatus === GITHUB_STATUS.AUTHENTICATED ? (
                          <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-sm ring-1 ring-background" />
                        ) : githubStatus === GITHUB_STATUS.ERROR ? (
                          <AlertCircle size={16} className="text-destructive" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-muted-foreground shadow-sm ring-1 ring-background" />
                        )}
                        <span className="font-medium">
                          {githubStatus === GITHUB_STATUS.REPO_EXISTS
                            ? 'Repository Connected'
                            : githubStatus === GITHUB_STATUS.AUTHENTICATED
                              ? 'Github Account Connected'
                              : githubStatus === GITHUB_STATUS.ERROR
                                ? 'Connection Error'
                                : 'Not Connected'}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {githubStatus === GITHUB_STATUS.REPO_EXISTS
                          ? 'This project is linked to a Github repository.'
                          : githubStatus === GITHUB_STATUS.AUTHENTICATED
                            ? 'Github account connected. Create a repository for this project.'
                            : githubStatus === GITHUB_STATUS.ERROR
                              ? 'There was an error connecting to Github. Please try again.'
                              : 'Connect to Github to save your project code.'}
                      </p>

                      <Button
                        onClick={() => {
                          setIsProjectInfoDrawerOpen(false);
                          setIsStatusDrawerOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                      >
                        <Github size={14} className="mr-1" />
                        Manage Github Connection
                      </Button>
                    </div>
                  </div>

                  {/* Recent Commits */}
                  <div className="p-5">
                    <h4 className="text-sm font-medium text-primary/90 mb-3 flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <GitCommit size={16} />
                        Recent Commits
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshCommits}
                        disabled={
                          isLoadingCommits ||
                          !githubToken ||
                          githubStatus !== GITHUB_STATUS.REPO_EXISTS
                        }
                        className="h-7 px-2"
                      >
                        <RefreshCwIcon
                          size={14}
                          className={isLoadingCommits ? 'animate-spin' : ''}
                        />
                      </Button>
                    </h4>

                    {isLoadingCommits ? (
                      <div className="bg-card p-4 rounded-md border border-border/50 flex justify-center items-center">
                        <Loader2
                          size={24}
                          className="animate-spin text-primary"
                        />
                        <span className="ml-2 text-sm">Loading commits...</span>
                      </div>
                    ) : commitError ? (
                      <div className="bg-card p-4 rounded-md border border-destructive/20 text-center">
                        <AlertCircle
                          size={20}
                          className="mx-auto mb-2 text-destructive"
                        />
                        <p className="text-sm text-destructive font-medium">
                          Failed to load commits
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {commitError}
                        </p>

                        {githubStatus !== GITHUB_STATUS.REPO_EXISTS && (
                          <Button
                            onClick={() => {
                              setIsProjectInfoDrawerOpen(false);
                              setIsStatusDrawerOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="mt-3"
                          >
                            <Github size={14} className="mr-1" />
                            Setup Github Repository
                          </Button>
                        )}
                      </div>
                    ) : commits.length > 0 ? (
                      <div className="space-y-3">
                        {commits.map((commit) => (
                          <div
                            key={commit.id}
                            className="p-3 bg-card border border-border/50 rounded-md"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium text-sm truncate flex-1">
                                {commit.message}
                              </div>
                              <div className="flex items-center shrink-0 ml-2">
                                <code className="text-xs bg-secondary/40 px-1.5 py-0.5 rounded">
                                  {commit.hash}
                                </code>
                                {commit.url && (
                                  <a
                                    href={commit.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-1 text-muted-foreground hover:text-primary transition-colors"
                                    title="View on Github"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User size={12} />
                                <span>{commit.author}</span>
                              </div>
                              <div>
                                {new Date(commit.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-card p-4 rounded-md border border-border/50 text-center">
                        <p className="text-muted-foreground text-sm">
                          {githubStatus === GITHUB_STATUS.REPO_EXISTS
                            ? 'No commits found'
                            : 'No Github repository connected'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {githubStatus === GITHUB_STATUS.REPO_EXISTS
                            ? 'This repository has no commits yet. Push changes to see commit history.'
                            : 'Connect to Github and create a repository to track commits.'}
                        </p>

                        {githubStatus !== GITHUB_STATUS.REPO_EXISTS && (
                          <Button
                            onClick={() => {
                              setIsProjectInfoDrawerOpen(false);
                              setIsStatusDrawerOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="mt-3"
                          >
                            <Github size={14} className="mr-1" />
                            Setup Github Repository
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Commit Message Dialog */}
      <Dialog open={isCommitDialogOpen} onOpenChange={setIsCommitDialogOpen}>
        <DialogContent aria-description="Commit Changes" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <GitCommit size={18} />
              Commit Changes
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="space-y-2">
              <label
                htmlFor="commitMessage"
                className="text-sm font-medium leading-none flex items-center gap-2"
              >
                <MessageSquare size={14} />
                Commit Message
              </label>
              <Textarea
                id="commitMessage"
                value={commitMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCommitMessage(e.target.value)
                }
                className="w-full min-h-[100px] p-3 rounded-md border border-border bg-background text-foreground resize-none"
                placeholder="Describe your changes..."
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Write a meaningful message describing the changes you&apos;re
                committing.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCommitDialogOpen(false)}
              disabled={commitInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCommitToRepo}
              className="gap-1.5"
              disabled={!commitMessage.trim() || commitInProgress}
            >
              <GitCommit size={16} />
              Commit & Push
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TitleBar;
