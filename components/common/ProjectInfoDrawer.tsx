import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Info,
  LayoutGrid,
  Calendar,
  Clock,
  Code,
  Github,
  GitCommit,
  RefreshCwIcon,
  AlertCircle,
  CheckCircle2,
  User,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useGlobalState } from '@/hooks';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { DrawerType, GITHUB_STATUS } from '@/hooks/useGlobalState';

interface Commit {
  id: string;
  message: string;
  author: string;
  date: string;
  hash: string;
  url?: string;
}

export function ProjectInfoDrawer() {
  const [commits, setCommits] = useState<Commit[]>([]);
  //   const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  const {
    activeDrawer,
    closeDrawer,
    openDrawer,
    activeProject,
    githubStatus,
    githubToken,
    isLoadingCommits,
    setIsLoadingCommits,
  } = useGlobalState();

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
      console.log('Repository not connected, cannot fetch commits');
      setCommits([]);
      setCommitError('No commits available. Please create a repository first.');
      return;
    }

    try {
      setIsLoadingCommits(true);
      setCommitError(null);

      console.log(
        `Manually refreshing commits for project: ${activeProject.title}`
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/github/commits?token=${githubToken}&repo=${activeProject.title}`
      );

      if (response.status === 404) {
        // Repository or commits not found
        console.log('Repository or commits not found (404)');
        setCommits([]);
        setCommitError('No commits found. Repository may be empty.');
        toast.info('No commits found in this repository');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch commits');
      }

      const data = await response.json();
      console.log('Commits refreshed successfully:', data.commits);
      setCommits(data.commits || []);
      toast.success('Commits refreshed');
    } catch (error) {
      console.error('Error refreshing commits:', error);
      setCommitError(
        error instanceof Error ? error.message : 'Failed to fetch commits'
      );
      setCommits([]);
      toast.error('Failed to refresh commits');
    } finally {
      setIsLoadingCommits(false);
    }
  };

  // Load commits when drawer opens and conditions are met
  useEffect(() => {
    if (
      activeDrawer === 'projectInfo' &&
      activeProject &&
      githubToken &&
      githubStatus === GITHUB_STATUS.REPO_EXISTS &&
      commits.length === 0 &&
      !isLoadingCommits
    ) {
      refreshCommits();
    }
  }, [activeDrawer, activeProject, githubToken, githubStatus]);

  return (
    <Drawer
      direction="right"
      open={activeDrawer === 'projectInfo'}
      onOpenChange={() => closeDrawer()}
    >
      <DrawerContent className="w-96">
        <DrawerHeader className="bg-secondary/30">
          <DrawerTitle className="flex items-center gap-2">
            <Info size={18} className="text-primary" />
            Project Information
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          {activeProject && (
            <>
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
                      <Calendar size={14} className="text-muted-foreground" />
                      <span>{'Created: '}</span>
                      <span className="text-muted-foreground">
                        {new Date(activeProject.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-muted-foreground" />
                      <span>Updated: </span>
                      <span className="text-muted-foreground">
                        {new Date(activeProject.updatedAt).toLocaleDateString()}
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
                      closeDrawer();
                      openDrawer(DrawerType.GITHUB_STATUS);
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
                    <Loader2 size={24} className="animate-spin text-primary" />
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
                          closeDrawer();
                          openDrawer(DrawerType.GITHUB_STATUS);
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
                          closeDrawer();
                          openDrawer(DrawerType.GITHUB_STATUS);
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
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
