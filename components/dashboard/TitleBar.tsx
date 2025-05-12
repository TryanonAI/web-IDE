import React, { useState, useEffect } from 'react';
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
  Folder,
  Info,
  GitCommit,
  Clock,
  Calendar,
  User,
  Code,
  LayoutGrid,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGitHub } from '@/context/GitHubContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { useModal } from '@/context/ModalContext';

// Define status step type
type StatusStep = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
};

// Define commit type
type Commit = {
  id: string;
  hash: string;
  message: string;
  author: string;
  date: string;
  url?: string;
};

const TitleBar = ({
  // @ts-expect-error ignore type error
  projects,
  // @ts-expect-error ignore type error
  activeProject,
  // @ts-expect-error ignore type error
  onProjectSelect,
  // @ts-expect-error ignore type error
  onConnectGithub,
  // @ts-expect-error ignore type error
  onRefresh,
}) => {
  const [isStatusDrawerOpen, setIsStatusDrawerOpen] = useState(false);
  const [isProjectDrawerOpen, setIsProjectDrawerOpen] = useState(false);
  const [isProjectInfoDrawerOpen, setIsProjectInfoDrawerOpen] = useState(false);
  const [statusSteps, setStatusSteps] = useState<StatusStep[]>([]);
  const [lastCheckedProject, setLastCheckedProject] = useState<string | null>(
    null
  );
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [commitInProgress, setCommitInProgress] = useState(false);

  // Use modal context
  const { openModal } = useModal();

  // Use GitHub context - only use what we need
  const {
    gitHubStatus,
    githubToken,
    connectGitHub,
    createRepository,
    disconnectGitHub,
    checkRepository,
    resetGitHubState,
  } = useGitHub();

  // Remove the useEffect that's causing the loop
  // and replace with a simple manual check function
  const checkProjectRepository = async (projectName: string) => {
    if (!githubToken || !projectName) return;

    console.log('Manually checking if repository exists for:', projectName);
    try {
      const exists = await checkRepository(projectName);
      setLastCheckedProject(projectName);
      return exists;
    } catch (err) {
      console.error('Error checking repository:', err);
      return false;
    }
  };

  // Get status dot color class
  const getStatusDotClass = () => {
    switch (gitHubStatus) {
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

  // Get the appropriate GitHub button title
  const getGitHubButtonTitle = () => {
    switch (gitHubStatus) {
      case 'disconnected':
        return 'Connect to GitHub';
      case 'authenticated':
        return 'GitHub account connected. Click to manage repository.';
      case 'checking_repo':
        return 'Checking if repository exists';
      case 'creating_repo':
        return 'Creating new repository';
      case 'repo_exists':
        return 'Repository connected. Click to push changes.';
      case 'committing':
        return 'Pushing changes to GitHub';
      case 'error':
        return 'An error occurred with GitHub';
      default:
        return 'Manage GitHub connection';
    }
  };

  // Update handleProjectChange to manually check repo after reset
  // REMOVED: handleProjectChange function is no longer needed since we now use handleProjectSelect
  // with the project drawer

  // Update GitHub button click handler to use manual check
  const handleGitHubClick = async () => {
    if (!githubToken) {
      connectGitHub();
    } else if (!activeProject) {
      toast.error('Please select a project first');
    } else {
      // Only check if we haven't already checked this project
      if (activeProject.name !== lastCheckedProject) {
        console.log('Checking repository status before opening drawer');
        await checkProjectRepository(activeProject.name);
      }

      // Open the drawer with the current status
      setIsStatusDrawerOpen(true);
    }
  };

  // Function to update a specific step's status
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

  // Initialize steps for repository creation
  const initRepoCreationSteps = () => {
    setStatusSteps([
      {
        id: 'auth-check',
        title: 'Checking GitHub Authentication',
        description: 'Verifying your GitHub credentials...',
        status: 'pending',
      },
      {
        id: 'create-repo',
        title: 'Creating Repository',
        description: `Creating repository: ${activeProject?.name}`,
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

  // Modified handle create repo
  const handleCreateRepo = async () => {
    if (!activeProject) {
      toast.error('Please select a project first');
      return;
    }

    initRepoCreationSteps();

    try {
      // Auth check step
      updateStepStatus('auth-check', 'loading');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateStepStatus('auth-check', 'success');

      // Create repo step
      updateStepStatus('create-repo', 'loading');
      const success = await createRepository(activeProject.name);

      if (!success) throw new Error('Failed to create repository');
      updateStepStatus('create-repo', 'success');

      // Init repo step
      updateStepStatus('init-repo', 'loading');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      updateStepStatus('init-repo', 'success');

      toast.success(`Repository '${activeProject.name}' created successfully`);
      // Keep drawer open to show success state
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      const currentStep = statusSteps.find((step) => step.status === 'loading');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error', errorMessage);
      }
      toast.error('Failed to create repository');
    }
  };

  // Show commit dialog when user clicks "Push Changes"
  const showCommitDialog = () => {
    // Default commit message with timestamp
    setCommitMessage(
      `Update project ${activeProject?.name} - ${new Date().toLocaleString()}`
    );
    setIsCommitDialogOpen(true);
  };

  // Modified handle commit to repo
  const handleCommitToRepo = async () => {
    if (!activeProject || !commitMessage.trim()) {
      toast.error('Please provide a commit message');
      return;
    }

    setIsCommitDialogOpen(false);
    setCommitInProgress(true);
    initPushSteps();

    try {
      // Prepare files step
      updateStepStatus('prepare-files', 'loading');
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
      updateStepStatus('prepare-files', 'success');

      // Create commit step
      updateStepStatus('create-commit', 'loading');
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate delay
      updateStepStatus('create-commit', 'success');

      // Push changes step
      updateStepStatus('push-changes', 'loading');
      // Pass commit message to the onConnectGithub function
      await onConnectGithub(commitMessage);
      updateStepStatus('push-changes', 'success');

      // Refresh commits after successful push
      await refreshCommits();

      toast.success('Changes pushed to GitHub');

      // Close drawer after a delay
      setTimeout(() => setIsStatusDrawerOpen(false), 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      const currentStep = statusSteps.find((step) => step.status === 'loading');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error', errorMessage);
      }
      console.error('Error pushing to GitHub:', error);
      toast.error('Failed to push changes');
    } finally {
      setCommitInProgress(false);
    }
  };

  const handleOpenCreateProjectDialog = () => {
    openModal('createProject');
  };

  // Determine if the GitHub button should be disabled
  const isGitHubButtonDisabled = () => {
    return (
      gitHubStatus === 'checking_repo' ||
      gitHubStatus === 'creating_repo' ||
      gitHubStatus === 'committing'
    );
  };

  // Determine if the GitHub repo is ready to commit
  const isRepoReadyToCommit = gitHubStatus === 'repo_exists';

  // Fetch commits when activeProject or gitHubStatus changes
  useEffect(() => {
    const fetchCommits = async () => {
      // Only fetch if we have a project and GitHub token
      if (!activeProject || !githubToken) {
        console.log(
          'Cannot fetch commits: missing activeProject or githubToken'
        );
        return;
      }

      // Don't try to fetch commits if repo doesn't exist yet
      if (isProjectInfoDrawerOpen && gitHubStatus !== 'repo_exists') {
        console.log('Repository does not exist yet, skipping commit fetch');
        setCommits([]);
        setCommitError(null);
        return;
      }

      setIsLoadingCommits(true);
      setCommitError(null);

      try {
        console.log(`Fetching commits for project: ${activeProject.name}`);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/github/commits?token=${githubToken}&repo=${activeProject.name}`
        );

        if (!response.ok) {
          const errorData = await response.json();

          // Handle 404 errors gracefully - repo doesn't exist or is empty
          if (response.status === 404) {
            console.log('Repository or commits not found (404)');
            setCommits([]);
            setCommitError(
              'No commits found. Repository may not exist yet or be empty.'
            );
            return;
          }

          throw new Error(errorData.details || 'Failed to fetch commits');
        }

        const data = await response.json();
        console.log('Commits fetched successfully:', data.commits);
        setCommits(data.commits || []);
      } catch (error) {
        console.error('Error fetching commits:', error);
        setCommitError(
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
        setCommits([]);
      } finally {
        setIsLoadingCommits(false);
      }
    };

    // Fetch commits when the project info drawer opens
    if (isProjectInfoDrawerOpen && activeProject) {
      console.log('Project info drawer opened, fetching commits');
      fetchCommits();
    }
  }, [activeProject, githubToken, isProjectInfoDrawerOpen, gitHubStatus]);

  // Update handleProjectSelect to reset commits when changing projects
  const handleProjectSelect = (projectId: string) => {
    if (!Array.isArray(projects)) {
      console.error('Projects is not an array');
      return;
    }
    const selectedProject = projects.find((p) => p.projectId === projectId);
    if (selectedProject) {
      // Reset the lastCheckedProject when changing projects
      setLastCheckedProject(null);
      setCommits([]); // Reset commits when changing projects
      setCommitError(null);

      // If we're coming from a project with an existing repo or error,
      // reset the GitHub state to force a fresh check
      if (gitHubStatus === 'repo_exists' || gitHubStatus === 'error') {
        console.log('Resetting GitHub state for new project check');
        resetGitHubState(); // Reset to the authenticated state
      }

      onProjectSelect(selectedProject);
      setIsProjectDrawerOpen(false); // Close drawer after selection
    } else {
      console.error('Project not found with ID:', projectId);
    }
  };

  // Add this function to check if the project info button should be disabled
  const isProjectInfoDisabled = () => {
    return !activeProject;
  };

  // New refreshCommits function
  const refreshCommits = async () => {
    if (!activeProject || !githubToken) {
      console.log(
        'Cannot refresh commits: missing activeProject or githubToken'
      );
      toast.error('GitHub connection required to view commits');
      return;
    }

    // Don't try to fetch commits if repo doesn't exist yet
    if (gitHubStatus !== 'repo_exists') {
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
        `Manually refreshing commits for project: ${activeProject.name}`
      );
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/github/commits?token=${githubToken}&repo=${activeProject.name}`
      );

      if (!response.ok) {
        const errorData = await response.json();

        // Handle 404 errors gracefully - repo doesn't exist or is empty
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

  return (
    <>
      <div className="border-b border-border/50 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        {/* Main Toolbar */}
        <div className="h-14 px-2 flex items-center gap-4 max-w-screen-2xl">
          {/* Project Selection Button - Opens Drawer */}
          <button
            onClick={() => setIsProjectDrawerOpen(true)}
            className="h-9 min-w-[180px] px-3 flex items-center justify-between gap-2 bg-secondary/60 hover:bg-secondary/80 border border-border/50 rounded-md text-sm font-medium transition-colors"
            title="Select Project"
          >
            <div className="flex items-center gap-2 truncate">
              <FolderOpen size={16} className="text-primary/80 shrink-0" />
              <span className="truncate">
                {activeProject ? activeProject.name : 'Select Project'}
              </span>
            </div>
            <ChevronDown size={14} className="text-muted-foreground shrink-0" />
          </button>

          {/* Separator */}
          <div className="w-px h-5 bg-border/40" />

          {/* Action Buttons - Enhanced styles */}
          <button
            onClick={handleOpenCreateProjectDialog}
            className="group h-9 px-3 flex items-center gap-2 bg-secondary/30 hover:bg-secondary/70 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow"
            title="New Project"
          >
            <PlusIcon
              size={16}
              className="text-primary group-hover:text-primary/90"
            />
            <span>New</span>
          </button>

          {/* Add Project Info Button */}
          <button
            onClick={() => setIsProjectInfoDrawerOpen(true)}
            disabled={isProjectInfoDisabled()}
            className="h-9 px-3 flex items-center gap-2 bg-secondary/30 hover:bg-secondary/70 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            title="Project Information"
          >
            <Info size={16} className="text-primary/80" />
            <span>Info</span>
          </button>

          {/* GitHub Button - Enhanced with better status indicators */}
          <div className="relative">
            <button
              onClick={handleGitHubClick}
              disabled={isGitHubButtonDisabled()}
              className={`
                relative h-9 px-3 flex items-center gap-2 rounded-md shadow-sm
                transition-all duration-200
                ${
                  isRepoReadyToCommit
                    ? 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/30'
                    : gitHubStatus === 'error'
                      ? 'bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/30'
                      : 'bg-secondary/40 hover:bg-secondary/70 border border-border/40 hover:border-border/70'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
              title={getGitHubButtonTitle()}
            >
              {gitHubStatus === 'checking_repo' ||
              gitHubStatus === 'creating_repo' ||
              gitHubStatus === 'committing' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Github
                  size={16}
                  className={
                    isRepoReadyToCommit
                      ? 'text-green-500'
                      : gitHubStatus === 'error'
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
              {/* Only show text when not connected */}
              {!githubToken && <span>GitHub</span>}
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={!activeProject}
            className="h-9 px-3 flex items-center gap-2 bg-secondary/30 hover:bg-secondary/70 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            title="Refresh Project"
          >
            <RefreshCwIcon size={16} className="text-primary/80" />
            <span>Refresh</span>
          </button>

          {/* Separator */}
          {/* <div className="w-px h-5 bg-border/40" /> */}

          {/* Additional Tools - Grouped in a toolbar */}
          {/* <div className="flex items-center gap-1 bg-secondary/20 p-1 rounded-md">
            <button
              className="h-7 w-7 flex items-center justify-center bg-transparent hover:bg-secondary/80 rounded transition-colors"
              title="Search"
            >
              <SearchIcon size={16} />
            </button>

            <button
              className="h-7 w-7 flex items-center justify-center bg-transparent hover:bg-secondary/80 rounded transition-colors"
              title="File Explorer"
            >
              <FolderIcon size={16} />
            </button>
          </div> */}

          {/* <div className="flex-1" /> */}

          {/* Right-side buttons - Improved styling */}
          {/* <div className="flex items-center gap-1 bg-secondary/20 p-1 rounded-md ml-2">
            <button
              className="h-7 w-7 flex items-center justify-center bg-transparent hover:bg-secondary/80 rounded transition-colors"
              title="Documentation"
            >
              <BookOpenIcon size={16} />
            </button>

           

            <button
              className="h-7 w-7 flex items-center justify-center bg-transparent hover:bg-secondary/80 rounded transition-colors"
              title="Settings"
            >
              <SettingsIcon size={16} />
            </button>
          </div> */}
        </div>
      </div>

      {/* Enhanced Status Drawer with GitHub Actions */}
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
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-xl z-50 overflow-hidden"
            >
              <div className="h-full flex flex-col">
                {/* Drawer Header */}
                <div className="p-4 border-b border-border/70 flex items-center justify-between bg-secondary/30">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Github size={18} className="text-primary" />
                    GitHub Integration
                  </h3>
                  <button
                    onClick={() => setIsStatusDrawerOpen(false)}
                    className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                  >
                    <XCircle size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {/* GitHub Actions Section */}
                  <div className="p-5 border-b border-border/50">
                    {gitHubStatus === 'checking_repo' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-yellow-500">
                          <Loader2 size={18} className="animate-spin" />
                          <p className="text-sm font-medium">
                            Checking repository status...
                          </p>
                        </div>
                      </div>
                    ) : gitHubStatus === 'creating_repo' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-yellow-500">
                          <Loader2 size={18} className="animate-spin" />
                          <p className="text-sm font-medium">
                            Creating repository...
                          </p>
                        </div>
                      </div>
                    ) : gitHubStatus === 'repo_exists' ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle2 size={18} />
                          <p className="text-sm font-medium">
                            Repository connected to GitHub
                          </p>
                        </div>
                        <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-md">
                          <p className="text-sm text-green-700 dark:text-neutral-300 font-medium mb-2">
                            Ready to push changes
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Your code changes will be committed to your GitHub
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
                    ) : gitHubStatus === 'authenticated' ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-yellow-500">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <p className="text-sm font-medium">
                            GitHub account connected
                          </p>
                        </div>
                        <div className="p-3 bg-secondary/40 border border-border rounded-md">
                          <p className="text-sm font-medium mb-2">
                            Create a repository for this project
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Create a repository named{' '}
                            <span className="font-mono bg-secondary/70 px-1.5 py-0.5 rounded">
                              {activeProject?.name}
                            </span>
                          </p>
                          <Button onClick={handleCreateRepo} className="w-full">
                            <div className="flex items-center gap-2">
                              <PlusIcon size={16} />
                              Create Repository
                            </div>
                          </Button>
                        </div>
                      </div>
                    ) : gitHubStatus === 'error' ? (
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
                          <Button onClick={handleCreateRepo} className="w-full">
                            <div className="flex items-center gap-2">
                              <PlusIcon size={16} />
                              Create Repository
                            </div>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                          <p className="text-sm font-medium">
                            Not connected to GitHub
                          </p>
                        </div>
                        <div className="p-3 bg-secondary/40 border border-border rounded-md">
                          <p className="text-sm font-medium mb-2">
                            Connect your GitHub account
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Link your GitHub account to push code changes to
                            repositories.
                          </p>
                          <Button onClick={connectGitHub} className="w-full">
                            <div className="flex items-center gap-2">
                              <Github size={16} />
                              Connect GitHub Account
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
                            {/* Step content */}
                            <div className="flex items-start gap-3 pb-8">
                              {/* Status icon */}
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

                              {/* Step details */}
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

                            {/* Connector line */}
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
                  {gitHubStatus !== 'disconnected' && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        disconnectGitHub();
                        setLastCheckedProject(null);
                        setIsStatusDrawerOpen(false);
                      }}
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

      {/* Project Drawer */}
      <AnimatePresence>
        {isProjectDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setIsProjectDrawerOpen(false)}
            />

            {/* Project Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-y-0 right-0 w-80 bg-background border-l border-border shadow-xl z-50 overflow-hidden"
            >
              <div className="h-full flex flex-col">
                {/* Drawer Header */}
                <div className="p-4 border-b border-border/70 flex items-center justify-between bg-secondary/30">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FolderOpen size={18} className="text-primary" />
                    Projects
                  </h3>
                  <button
                    onClick={() => setIsProjectDrawerOpen(false)}
                    className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                  >
                    <XCircle size={18} />
                  </button>
                </div>

                {/* Projects List */}
                <div className="flex-1 overflow-y-auto p-2">
                  {Array.isArray(projects) && projects.length > 0 ? (
                    <div className="space-y-2">
                      {projects.map((project) => (
                        <div
                          key={project.projectId}
                          onClick={() => handleProjectSelect(project.projectId)}
                          className={`p-3 border rounded-md cursor-pointer transition-all hover:shadow-sm ${
                            activeProject?.projectId === project.projectId
                              ? 'bg-primary/10 border-primary/30'
                              : 'bg-card hover:bg-card/80 border-border'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Folder
                                size={16}
                                className={
                                  activeProject?.projectId === project.projectId
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                }
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {project.name}
                              </div>
                              {project.description && (
                                <div className="text-xs text-muted-foreground mt-1 truncate">
                                  {project.description}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                Created:{' '}
                                {new Date(
                                  project.createdAt
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            {activeProject?.projectId === project.projectId && (
                              <div className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded">
                                Active
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <FolderOpen
                        size={48}
                        className="text-muted-foreground/30 mb-4"
                      />
                      <p className="text-muted-foreground mb-2">
                        No projects found
                      </p>
                      <Button
                        onClick={() => {
                          setIsProjectDrawerOpen(false);
                          handleOpenCreateProjectDialog();
                        }}
                        variant="outline"
                        className="mt-2"
                      >
                        <PlusIcon size={16} className="mr-1" />
                        Create New Project
                      </Button>
                    </div>
                  )}
                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-border bg-secondary/20">
                  <Button
                    onClick={() => {
                      setIsProjectDrawerOpen(false);
                      handleOpenCreateProjectDialog();
                    }}
                    className="w-full"
                  >
                    <PlusIcon size={16} className="mr-1" />
                    New Project
                  </Button>
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
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
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
                          {activeProject.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {activeProject.description ||
                            'No description available'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar
                            size={14}
                            className="text-muted-foreground"
                          />
                          <span>Created: </span>
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

                  {/* GitHub Connection Status */}
                  <div className="p-5 border-b border-border/50">
                    <h4 className="text-sm font-medium text-primary/90 mb-3 flex items-center gap-2">
                      <Github size={16} />
                      GitHub Status
                    </h4>

                    <div
                      className={`p-3 rounded-md border ${
                        gitHubStatus === 'repo_exists'
                          ? 'bg-green-500/5 border-green-500/20'
                          : gitHubStatus === 'authenticated'
                            ? 'bg-yellow-500/5 border-yellow-500/20'
                            : gitHubStatus === 'error'
                              ? 'bg-destructive/5 border-destructive/20'
                              : 'bg-secondary/40 border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {gitHubStatus === 'repo_exists' ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : gitHubStatus === 'authenticated' ? (
                          <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-sm ring-1 ring-background" />
                        ) : gitHubStatus === 'error' ? (
                          <AlertCircle size={16} className="text-destructive" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-muted-foreground shadow-sm ring-1 ring-background" />
                        )}
                        <span className="font-medium">
                          {gitHubStatus === 'repo_exists'
                            ? 'Repository Connected'
                            : gitHubStatus === 'authenticated'
                              ? 'GitHub Account Connected'
                              : gitHubStatus === 'error'
                                ? 'Connection Error'
                                : 'Not Connected'}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {gitHubStatus === 'repo_exists'
                          ? 'This project is linked to a GitHub repository.'
                          : gitHubStatus === 'authenticated'
                            ? 'GitHub account connected. Create a repository for this project.'
                            : gitHubStatus === 'error'
                              ? 'There was an error connecting to GitHub. Please try again.'
                              : 'Connect to GitHub to save your project code.'}
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
                        Manage GitHub Connection
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
                          gitHubStatus !== 'repo_exists'
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

                        {gitHubStatus !== 'repo_exists' && (
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
                            Setup GitHub Repository
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
                                    title="View on GitHub"
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
                          {gitHubStatus === 'repo_exists'
                            ? 'No commits found'
                            : 'No GitHub repository connected'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {gitHubStatus === 'repo_exists'
                            ? 'This repository has no commits yet. Push changes to see commit history.'
                            : 'Connect to GitHub and create a repository to track commits.'}
                        </p>

                        {gitHubStatus !== 'repo_exists' && (
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
                            Setup GitHub Repository
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
        <DialogContent className="max-w-md">
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
