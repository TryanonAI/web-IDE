'use client';

import { toast } from 'sonner';
import {
  Github,
  Loader2,
  Info,
  Rocket,
  Copy,
  Check,
  LogOutIcon,
  UserIcon,
  SquareArrowOutUpRight,
} from 'lucide-react';
import { useWallet } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Framework } from '@/types';
import React, { useState, useEffect } from 'react';
import { useGlobalState } from '@/hooks';
import { Octokit } from '@octokit/core';
import Link from 'next/link';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { useRouter, usePathname } from 'next/navigation';
import Logo from '@/public/logo_white.png';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DrawerType, GITHUB_STATUS } from '@/hooks/useGlobalState';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

const TitleBar = () => {
  const disconnect = useWallet((state) => state.disconnect);
  const [, copyToClipboard] = useCopyToClipboard();
  const [copy, setCopy] = useState<boolean>(false);
  const pathname = usePathname();

  const isLoading = useGlobalState((state) => state.isLoading);
  const isCodeGenerating = useGlobalState((state) => state.isCodeGenerating);
  const { openDrawer } = useGlobalState();
  const { connected, shortAddress } = useWallet();
  const {
    githubToken,
    isDeploying,
    githubStatus,
    deploymentUrl,
    setOctokit,
    setGithubToken,
    setGithubStatus,
    setGithubUsername,
  } = useGlobalState();

  const { activeProject } = useGlobalState();

  const { user } = useWallet();
  const router = useRouter();

  // Check if we're in the codeview route
  const isCodeView = pathname?.includes('/projects/') && activeProject;

  const commonDisabledState =
    isCodeGenerating ||
    isLoading ||
    isDeploying ||
    !connected ||
    !activeProject;
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

  const isRepoReadyToCommit = githubStatus === GITHUB_STATUS.REPO_EXISTS;

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
          const octokitInstance = new Octokit({ auth: accessToken });
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

  return (
    <>
      <div className="border-b border-border/50 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 flex justify-between items-center pl-2 pr-5">
        {/* Logo with Link wrapper */}
        <Link
          href="/projects"
          className="w-[20%] sm:w-[15%] md:w-[12%] lg:w-[10%] xl:w-[9.5%] max-w-[120px] py-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Image
            className="w-full h-[36px] object-contain"
            src={Logo}
            alt="Logo"
            width={290}
            height={290}
            priority
          />
        </Link>
        {/* Main Toolbar */}
        <div className="h-14 flex items-center gap-4 max-w-screen-2xl">
          {/* Only show utility buttons in codeview */}
          {isCodeView && activeProject?.framework !== Framework.Html && (
            <>
              <Button
                variant="outline"
                onClick={() => openDrawer(DrawerType.PROJECT_INFO)}
                disabled={commonDisabledState}
                title="Active Project Information"
                aria-label="Active Project Information"
              >
                <Info size={16} className="text-primary/80" />
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

          {/* Deploy Button and Status for HTML projects */}
          {isCodeView && activeProject?.framework === Framework.Html && (
            <div className="flex items-center gap-2">
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
                    <span className="text-sm font-medium">View Permaweb</span>
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

          {/* Always show profile dropdown when connected */}
          {connected && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={
                    isCodeGenerating || isLoading || isDeploying || !connected
                  }
                  className="rounded-md border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 group h-9 px-3 py-5 flex items-center gap-2 tracking-wider text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
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
      </div>
    </>
  );
};

export default TitleBar;
