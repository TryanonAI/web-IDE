import axios from 'axios';
import { toast } from 'sonner';
import { create } from 'zustand';
import { Octokit } from '@octokit/core';
import { useWallet } from './useWallet';
import { devtools, persist } from 'zustand/middleware';
import { defaultFiles, updateDefaultFiles } from '@/lib/filesUtils';
import { mergeDependencies } from '@/constant/dependencies';
import { DbAdmin_LUA_CODE, runLua, spawnProcess } from '@/lib/arkit';
import {
  Project,
  ChatMessage,
  StatusTimelineEvent,
  Framework,
  SandpackAction,
  CodebaseType,
  CodeVersion,
} from '@/types';

export interface GithubError extends Error {
  status?: number;
  response?: {
    data?: {
      message?: string;
      errors?: Array<{ message?: string }>;
    };
  };
}

export interface GithubFile {
  filePath: string;
  code: string;
}

export interface TreeItem {
  path: string;
  mode: '100644' | '100755' | '040000' | '160000' | '120000';
  type: 'blob' | 'tree' | 'commit';
  sha: string;
}

export enum GITHUB_STATUS {
  DISCONNECTED = 'disconnected',
  AUTHENTICATED = 'authenticated',
  CHECKING_REPO = 'checking_repo',
  REPO_EXISTS = 'repo_exists',
  CREATING_REPO = 'creating_repo',
  COMMITTING = 'committing',
  ERROR = 'error',
};

export type GitHubStatus =
  | 'disconnected'
  | 'authenticated'
  | 'checking_repo'
  | 'error';

export type DrawerType = 'project' | 'projectInfo' | 'githubStatus';

export type ModalType = 'createProject' | 'github' | 'projectInfo';


export interface ModalState {
  activeModal: ModalType | null;
  projectName: string;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setProjectName: (name: string) => void;
}

export interface DrawerState {
  activeDrawer: DrawerType | null;
  openDrawer: (drawer: DrawerType) => void;
  closeDrawer: () => void;
}

export interface GlobalState extends GithubState, ProjectState, SandpackState, ModalState, DrawerState {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  statusBarMessage: string;
  setStatusBarMessage: (message: string) => void;
  refreshGlobalState: () => Promise<void>;
  resetGlobalState: () => void;
}

interface GithubState {
  githubStatus: GITHUB_STATUS;
  setGithubStatus: (githubStatus: GITHUB_STATUS) => void;
  // error: string | null;
  // setError: (error: string | null) => void;
  octokit: Octokit | null;
  setOctokit: (octokit: Octokit | null) => void;
  githubToken: string | null;
  setGithubToken: (githubToken: string | null) => void;
  githubUsername: string | null;
  setGithubUsername: (githubUsername: string | null) => void;
  isLoadingCommits: boolean;
  setIsLoadingCommits: (isLoading: boolean) => void;

  checkRepository: (projectName: string) => Promise<boolean>;
  createRepository: (projectName: string) => Promise<boolean>;
  commitToRepository: (
    activeProject: Project,
    walletAddress: string,
    forcePush?: boolean,
    commitMessage?: string
  ) => Promise<void>;
  resetGithubState: () => void;
  disconnectGithub: () => void;
  validateWalletConnection: () => void;
}

export interface DependencyMap {
  [key: string]: string;  // package name -> version
}

export interface ProjectState {
  framework: Framework;
  setFramework: (framework: Framework) => void;
  status: string;
  isCreating: boolean;
  projects: Project[];
  codeVersions: CodeVersion[];
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  codebase: CodebaseType | null;
  activeProject: Project | null;
  statusTimeline: StatusTimelineEvent[];
  fetchProjects: () => Promise<void>;
  setCodebase: (codebase: CodebaseType | null) => void;
  setCodeVersions: (codeVersions: CodeVersion[]) => void;
  createProject: (projectName: string, framework: Framework) => Promise<Project | null>;
  loadProjectData: (project: Project | null, address: string) => Promise<void>;
  deploymentUrl: string | null;
  setDeploymentUrl: (url: string | null) => void;
  isCodeGenerating: boolean;
  setIsCodeGenerating: (isCodeGenerating: boolean) => void;
  dependencies: DependencyMap;
  setDependencies: (deps: DependencyMap) => void;
  updateDependencies: (newDeps: string[]) => void;
}

interface SandpackState {
  sandpackAction: SandpackAction;
  setSandpackAction: (action: SandpackAction) => void;
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!backendUrl) {
  throw new Error('NEXT_PUBLIC_BACKEND_URL environment variable is not set');
}

const fetchCodeVersions = async (projectId: string, address: string) => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${projectId}/versions?walletAddress=${address}`
    );
    if (response.data.versions && Array.isArray(response.data.versions)) {
      return response.data.versions;
    }
  } catch (error) {
    console.log('[Codeview_fetchCodeVersions] Error:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log('[Codeview_fetchCodeVersions] No code versions found');
      return;
    } else {
      console.error(
        '[Codeview_fetchCodeVersions] Failed to load code versions:',
        error
      );
      toast.error('[Codeview_fetchCodeVersions] Failed to load code versions');
    }
  }
};

const Initial_GithubState = {
  // error: null,
  octokit: null,
  githubToken: null,
  githubUsername: null,
  isLoadingCommits: false,
  githubStatus: GITHUB_STATUS.DISCONNECTED,
}

const Initial_ProjectState = {
  projects: [],
  framework: Framework.React,
  activeProject: null,
  isCreating: false,
  codebase: null,
  chatMessages: [],
  status: '',
  statusTimeline: [],
  codeVersions: [],
  deploymentUrl: null,
  isCodeGenerating: false,
  dependencies: {},
}

export const useGlobalState = create<
  GlobalState & GithubState & ProjectState & SandpackState
>()(
  persist(
    devtools(
      (set, get) => ({
        // ----------------Global States----------------
        error: null,
        setError: (error: string | null) => set({ error }),
        isLoading: false,
        setIsLoading: (isLoading: boolean) => set({ isLoading }),
        statusBarMessage: '',
        setStatusBarMessage: (message: string) => set({ statusBarMessage: message }),

        validateWalletConnection: () => {
          if (!useWallet.getState().connected) {
            throw new Error('Wallet connection required to create a project');
          }
        },
        refreshGlobalState: async () => {
          try {
            const walletAddress = useWallet.getState().address;
            if (!walletAddress) {
              throw new Error('No wallet address found');
            }

            set({ isLoading: true, error: null });

            // Fetch projects and update state
            await get().fetchProjects();

            // If there's an active project, reload its data
            if (get().activeProject) {
              await get().loadProjectData(get().activeProject, walletAddress);
            }

            set({ isLoading: false });
          } catch (error) {
            console.error('Error refreshing global state:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to refresh global state';
            set({ error: errorMessage, isLoading: false });
            toast.error(errorMessage);
          }
        },
        resetGlobalState: () => {
          set({
            projects: [],
            activeProject: null,
            codebase: null,
            chatMessages: [],
            error: null,
            codeVersions: [],
            statusBarMessage: '',
            sandpackAction: SandpackAction.PREVIEW,
            githubStatus: GITHUB_STATUS.DISCONNECTED,
          });
        },
        // clearPersistedState: () => {
        // useGlobalState.persist.clearStorage();
        // },

        // ----------------Github States----------------
        ...Initial_GithubState,
        setOctokit: (octokit: Octokit | null) => set({ octokit }),
        setGithubToken: (githubToken: string | null) => set({ githubToken }),
        setGithubUsername: (githubUsername: string | null) => set({ githubUsername }),
        setIsLoadingCommits: (isLoadingCommits: boolean) => set({ isLoadingCommits }),
        setGithubStatus: (githubStatus: GITHUB_STATUS) => set({ githubStatus }),

        disconnectGithub: () => {
          set({
            octokit: null,
            githubToken: null,
            githubUsername: null,
            githubStatus: GITHUB_STATUS.DISCONNECTED,
          });
        },

        resetGithubState: () => {
          const githubToken = get().githubToken;

          set({
            githubStatus: githubToken ? GITHUB_STATUS.AUTHENTICATED : GITHUB_STATUS.DISCONNECTED,
            error: null,
          });
        },

        checkRepository: async (projectName: string): Promise<boolean> => {
          const { octokit, githubUsername } = get();
          if (!octokit || !githubUsername) {
            set({ error: 'GitHub not authenticated' });
            return false;
          }

          set({ githubStatus: GITHUB_STATUS.CHECKING_REPO, error: null });
          console.log(
            `Checking if repository exists: ${githubUsername}/${projectName}`
          );

          try {
            const repoResponse = await octokit.request(
              'GET /repos/{owner}/{repo}',
              {
                owner: githubUsername,
                repo: projectName,
                headers: { 'X-GitHub-Api-Version': '2022-11-28' },
              }
            );

            if (repoResponse.status === 200) {
              console.log(`Repository found: ${githubUsername}/${projectName}`);
              set({ githubStatus: GITHUB_STATUS.REPO_EXISTS });
              toast.success('Connected to existing GitHub repository');
              return true;
            }
            set({ githubStatus: GITHUB_STATUS.AUTHENTICATED });
            return false;
          } catch (err) {
            const error = err as GithubError;
            if (error.status === 404) {
              console.log(
                `Repository does not exist: ${githubUsername}/${projectName} (404 Not Found)`
              );
              set({ githubStatus: GITHUB_STATUS.AUTHENTICATED });
              return false;
            }

            console.error(
              `Error checking repository ${githubUsername}/${projectName}:`,
              error
            );
            set({
              error: error.message || 'Failed to check repository',
              githubStatus: GITHUB_STATUS.ERROR,
            });
            return false;
          }
        },

        commitToRepository: async (
          activeProject: Project,
          walletAddress: string,
          forcePush: boolean = false,
          commitMessage?: string
        ): Promise<void> => {
          const { octokit, githubUsername } = get();
          if (!octokit || !githubUsername) {
            set({ error: 'GitHub not authenticated' });
            throw new Error('GitHub not authenticated');
          }

          if (!activeProject) {
            set({ error: 'No project selected' });
            throw new Error('No project selected');
          }

          set({ githubStatus: GITHUB_STATUS.COMMITTING, error: null });
          console.log(`Starting GitHub commit for project: ${activeProject.title}`);

          try {
            // Verify repository exists
            let repoExists = await get().checkRepository(activeProject.title);

            if (!repoExists) {
              console.log(`Repository ${githubUsername}/${activeProject.title} not found. Attempting to create.`);
              toast.info(`Repository not found. Creating ${activeProject.title}...`);

              const repoCreated = await get().createRepository(activeProject.title);
              if (!repoCreated) {
                const creationError = get().error || 'Failed to create repository after checking.';
                set({ error: creationError, githubStatus: GITHUB_STATUS.ERROR });
                throw new Error(creationError);
              }
              repoExists = true;
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            // Get current branch info
            let currentCommitSha: string | undefined;
            let currentTreeSha: string | undefined;

            try {
              const branchResponse = await octokit.request(
                'GET /repos/{owner}/{repo}/branches/{branch}',
                {
                  owner: githubUsername,
                  repo: activeProject.title,
                  branch: 'main',
                  headers: { 'X-GitHub-Api-Version': '2022-11-28' },
                }
              );
              currentCommitSha = branchResponse.data.commit.sha;
              currentTreeSha = branchResponse.data.commit.commit.tree.sha;
            } catch (error) {
              if (!forcePush) {
                console.error('Could not get current branch info:', error);
                throw new Error('Failed to get current branch information. Repository might be empty or inaccessible.');
              }
            }

            // Fetch project files
            const filesToCommitResponse = await axios.get(
              `${backendUrl}/projects/${activeProject.projectId}?walletAddress=${walletAddress}`
            );

            let codebaseData = filesToCommitResponse.data.codebase;
            if (!codebaseData) {
              set({ error: 'No codebase data returned from server', githubStatus: GITHUB_STATUS.REPO_EXISTS });
              toast.error('No codebase data returned');
              throw new Error('No codebase data returned from server');
            }
            codebaseData = { ...defaultFiles, ...codebaseData };

            // Process files to commit
            const filesToCommit: Record<string, string> = {};
            if (Array.isArray(codebaseData)) {
              codebaseData.forEach((file: GithubFile) => {
                if (file && file.filePath && file.code) {
                  const cleanPath = file.filePath.startsWith('/') ? file.filePath.substring(1) : file.filePath;
                  filesToCommit[cleanPath] = file.code;
                }
              });
            } else if (typeof codebaseData === 'object' && codebaseData !== null) {
              Object.entries(codebaseData).forEach(([path, content]) => {
                if (path && content) {
                  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
                  if (typeof content === 'object' && content !== null && 'code' in content) {
                    filesToCommit[cleanPath] = (content as { code: string }).code;
                  } else if (typeof content === 'string') {
                    filesToCommit[cleanPath] = content;
                  }
                }
              });
            }

            if (Object.keys(filesToCommit).length === 0) {
              set({ error: 'No files to commit', githubStatus: GITHUB_STATUS.REPO_EXISTS });
              toast.error('No files to commit');
              throw new Error('No files to commit');
            }

            // Create blobs and tree
            const treeItems: TreeItem[] = [];
            const blobPromises = Object.entries(filesToCommit).map(async ([filePath, content]) => {
              if (!content || typeof content !== 'string') {
                console.warn(`Skipping ${filePath}: Invalid or empty content`);
                return;
              }

              try {
                const blobResponse = await octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
                  owner: githubUsername,
                  repo: activeProject.title,
                  content: btoa(content),
                  encoding: 'base64',
                  headers: { 'X-GitHub-Api-Version': '2022-11-28' },
                });

                treeItems.push({
                  path: filePath,
                  mode: '100644' as const,
                  type: 'blob' as const,
                  sha: blobResponse.data.sha,
                });
              } catch (error) {
                console.error(`Failed to create blob for file ${filePath}:`, error);
              }
            });

            await Promise.all(blobPromises);

            if (treeItems.length === 0) {
              set({ error: 'No valid files to commit', githubStatus: GITHUB_STATUS.REPO_EXISTS });
              toast.error('No valid files to commit');
              throw new Error('No valid files to commit');
            }

            // Create tree
            const treeResponse = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
              owner: githubUsername,
              repo: activeProject.title,
              tree: treeItems,
              base_tree: !forcePush ? currentTreeSha : undefined,
              headers: { 'X-GitHub-Api-Version': '2022-11-28' },
            });

            // Create commit
            const defaultMessage = forcePush ? 'Force push from ANON AI (complete codebase)' : 'Update from ANON AI';
            const finalCommitMessage = commitMessage || defaultMessage;

            const commitResponse = await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
              owner: githubUsername,
              repo: activeProject.title,
              message: finalCommitMessage,
              tree: treeResponse.data.sha,
              parents: !forcePush && currentCommitSha ? [currentCommitSha] : [],
              headers: { 'X-GitHub-Api-Version': '2022-11-28' },
            });

            // Update reference
            await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
              owner: githubUsername,
              repo: activeProject.title,
              ref: 'heads/main',
              sha: commitResponse.data.sha,
              force: forcePush,
              headers: { 'X-GitHub-Api-Version': '2022-11-28' },
            });

            set({ githubStatus: GITHUB_STATUS.REPO_EXISTS });
            toast.success(
              `Changes successfully ${forcePush ? 'force pushed' : 'committed'} to GitHub!`
            );
          } catch (err) {
            const error = err as GithubError;
            let errorMessage = error.response?.data?.message || error.message || 'Failed to commit to GitHub';

            if (errorMessage.includes('Git Repository is empty')) {
              errorMessage = 'Repository is empty. Try force pushing the first commit.';
            } else if (errorMessage.includes('Not Found') || error.status === 404) {
              errorMessage = `Repository "${activeProject.title}" not found. It may have been deleted or renamed on GitHub.`;
            } else if (errorMessage.includes('reference already exists')) {
              errorMessage = 'Branch already exists. Try force pushing.';
            } else if (errorMessage.includes('Branch not found')) {
              errorMessage = 'Branch not found. Try force pushing the first commit.';
            } else if (error.status === 403 && errorMessage.includes('rate limit exceeded')) {
              errorMessage = 'GitHub API rate limit exceeded. Please try again later.';
            } else if (error.status === 409) {
              errorMessage = 'Conflict with existing data. The repository has been modified. Try pulling changes first.';
            }

            console.error('GitHub error details:', error);
            set({ error: errorMessage, githubStatus: GITHUB_STATUS.ERROR });
            toast.error('GitHub Error', { description: errorMessage });
            throw error;
          }
        },

        // ----------------Project States----------------
        ...Initial_ProjectState,
        setIsCodeGenerating: (isCodeGenerating: boolean) => set({ isCodeGenerating }),
        setFramework: (framework: Framework) => set({ framework }),
        setDeploymentUrl: (url: string | null) => set({ deploymentUrl: url }),
        setCodebase: (codebase: CodebaseType | null) => set({ codebase }),
        setCodeVersions: (codeVersions: CodeVersion[]) => set({ codeVersions: codeVersions.length > 0 ? codeVersions : [] }),
        loadProjectData: async (project: Project | null, address: string) => {
          if (!project || !project.projectId || !address) {
            set({
              activeProject: null,
              codebase: null,
              chatMessages: [],
              codeVersions: [],
            });
            return;
          }

          set({
            activeProject: project,
            isLoading: true,
            codeVersions: await fetchCodeVersions(project.projectId, address),
            deploymentUrl: project.deploymentUrl,
            chatMessages: project.messages,
          });

          // Get existing stored projects
          const existingStoredProjects = JSON.parse(localStorage.getItem('storedActiveProjects') || '[]');

          // Create new project entry
          const newStoredProject = {
            storedProjectId: project.projectId,
            ownerAddress: address,
          };

          // Check if project already exists for this wallet
          const projectIndex = existingStoredProjects.findIndex(
            (p: { ownerAddress: string }) => p.ownerAddress === address
          );

          if (projectIndex >= 0) {
            // Update existing entry
            existingStoredProjects[projectIndex] = newStoredProject;
          } else {
            // Add new entry
            existingStoredProjects.push(newStoredProject);
          }

          // Store updated projects array
          localStorage.setItem('storedActiveProjects', JSON.stringify(existingStoredProjects));

          try {
            // Fetch codebase
            console.log('Fetching codebase');
            const codebaseResponse = await axios.get(
              `${backendUrl}/projects/${project.projectId}?walletAddress=${address}`
            );

            console.log('codebaseResponse', codebaseResponse.data);
            if (codebaseResponse.data) {
              set({ codebase: codebaseResponse.data.codebase || {} });
              if (codebaseResponse.data.externalPackages && codebaseResponse.data.externalPackages.length > 0) {
                get().updateDependencies(codebaseResponse.data.externalPackages);
              }
              if (codebaseResponse.data.messages && codebaseResponse.data.messages.length > 0) {
                set({ chatMessages: codebaseResponse.data.messages as ChatMessage[] });
              }
            }
          } catch (error) {
            console.error('Error loading project data:', error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Failed to load project data';
            set({ error: errorMessage });
            toast.error(errorMessage);
          } finally {
            set({ isLoading: false });
          }
        },
        fetchProjects: async () => {
          if (!useWallet.getState().connected || !useWallet.getState().address) {
            return;
          }

          try {
            set({ isLoading: true });

            const res = await axios.get(
              `${backendUrl}/projects?walletAddress=${useWallet.getState().address}`
            );

            if (!res.data || typeof res.data.projects === 'undefined') {
              throw new Error('Invalid response format from server');
            }

            if (res.data.projects.length > 0) {
              await res.data.projects.sort(
                (a: Project, b: Project) => {
                  return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                  );
                }
              );
              set({ projects: res.data.projects });

              const storedProjectDetails = JSON.parse(localStorage.getItem('storedActiveProjects') || '[]');
              const isOwner = storedProjectDetails.find((p: { ownerAddress: string }) => p.ownerAddress === useWallet.getState().address);
              const storedProjectIdForOwner = storedProjectDetails.find((p: { ownerAddress: string }) => p.ownerAddress === useWallet.getState().address)?.storedProjectId;

              if (isOwner && storedProjectIdForOwner) {
                const storedProjectFetched = res.data.projects.find(
                  (p: Project) =>
                    p.projectId === storedProjectIdForOwner
                );
                if (storedProjectFetched) {
                  await get().loadProjectData(
                    storedProjectFetched,
                    useWallet.getState().address as string
                  );
                } else {
                  await get().loadProjectData(
                    res.data.projects[0],
                    useWallet.getState().address as string
                  );
                }
              } else {
                await get().loadProjectData(
                  res.data.projects[0],
                  useWallet.getState().address as string
                );
              }
            } else {
              set({ ...Initial_ProjectState });
            }
          } catch (error) {
            console.error('Error fetching projects:', error);
            const errorMessage =
              (error instanceof Error && error.message) ||
              'Failed to fetch projects';
            set({ error: errorMessage });
            toast.error(errorMessage);
          } finally {
            set({ isLoading: false });
          }
        },
        createProject: async (
          projectName: string,
          framework: Framework
        ): Promise<Project | null> => {
          try {
            get().validateWalletConnection();
            console.log('✅ [useGlobalState] Validation passed');
            console.log('📊 [useGlobalState] isLoading state:', get().isLoading);
            console.log('🚀 [useGlobalState] Starting createProject');

            if (
              !projectName ||
              typeof projectName !== 'string' ||
              projectName.trim() === ''
            ) {
              throw new Error(
                'Project name is required and must be a non-empty string'
              );
            }

            if (!useWallet.getState().connected) {
              throw new Error('Wallet connection required to create a project');
            }

            set({ isCreating: true });
            set({ error: null });

            // Clear timeline for new project creation
            set({
              statusTimeline: [
                {
                  id: Date.now().toString(),
                  message: `Creating new project: ${projectName}...`,
                  timestamp: Date.now(),
                },
              ],
            });

            // Spawn a process for the project using arkit.ts
            const processId = await spawnProcess(projectName, [
              { name: 'Action', value: 'create-project' },
            ]);

            if (!processId || typeof processId !== 'string') {
              throw new Error('Failed to generate process ID');
            }

            const luaResult = await runLua({
              process: processId,
              code: DbAdmin_LUA_CODE,
              tags: [
                {
                  name: 'Description',
                  value: `${projectName} now supports sqlite database operations.`,
                },
              ],
            });

            console.log(
              'Successfully added DbAdmin support to project:',
              luaResult.id
            );

            // Create the project in the backend
            const res = await axios.post(`${backendUrl}/projects`, {
              processId,
              framework,
              title: projectName,
              walletAddress: useWallet.getState().address,
            });

            if (!res.data?.project) {
              throw new Error(
                'Invalid response from server: missing project data'
              );
            }

            const newProject = res.data.project;
            console.log('Created new project:', newProject);

            // Update state with new project
            set({ projects: [...get().projects, newProject] });
            set({ activeProject: newProject });
            set({ chatMessages: [] });

            // Load the new project data
            await get().loadProjectData(
              newProject,
              useWallet.getState().address as string
            );

            toast.success('Project created successfully');
            return newProject;
          } catch (error) {
            console.error('Error creating project:', error);
            const errorMessage =
              error instanceof Error ? error.message : 'Error creating project';
            set({ error: errorMessage });
            toast.error(errorMessage);
            return null;
          } finally {
            set({ isCreating: false });
          }
        },

        // ----------------Sandpack States----------------
        sandpackAction: SandpackAction.PREVIEW,
        setSandpackAction: (action: SandpackAction) => set({ sandpackAction: action }),

        addChatMessage: (message: ChatMessage) => {
          set((state) => ({
            chatMessages: [...state.chatMessages, message]
          }));
        },

        // Drawer States
        activeDrawer: null,
        openDrawer: (drawer: DrawerType) => set({ activeDrawer: drawer }),
        closeDrawer: () => set({ activeDrawer: null }),

        // Modal States
        activeModal: null,
        projectName: '',
        openModal: (modal: ModalType) => set({ activeModal: modal }),
        closeModal: () => set({ activeModal: null }),
        setProjectName: (name: string) => set({ projectName: name }),

        // Project State
        setDependencies: (deps: DependencyMap) => set({ dependencies: deps }),
        updateDependencies: (newDeps: string[]) => {
          const { dependencies } = get();
          const updatedDeps = mergeDependencies(dependencies, newDeps);
          set({ dependencies: updatedDeps });
          updateDefaultFiles(newDeps);
        },
      }),
      {
        name: 'global-state',
      }
    ),
    {
      name: 'global-github-state',
      partialize: (state) => ({
        githubToken: state.githubToken,
      }),
    }
  )
);