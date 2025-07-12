import axios from 'axios';
import { toast } from 'sonner';
import { create } from 'zustand';
import { Octokit } from '@octokit/core';
import { useWallet } from './useWallet';
import { devtools, persist } from 'zustand/middleware';
import { runLua, spawnProcess } from '@/lib/arkit';
import {
  Project,
  ChatMessage,
  StatusTimelineEvent,
  Framework,
  SandpackAction,
  CodebaseType,
  CodeVersion,
} from '@/types';
import { defaultFiles } from '@/lib/utils';
import { ANON_LUA_TEMPLATE } from '@/constant/templateFiles';
import { uploadToTurbo } from '@/lib/api';
import mime from 'mime-types';

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

// export type DrawerType = 'createProject' | 'projectInfo' | 'githubStatus';
export enum DrawerType {
  CREATE_PROJECT = 'createProject',
  PROJECT_INFO = 'projectInfo',
  GITHUB_STATUS = 'githubStatus',
}


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

export interface SidebarState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export interface GlobalState extends GithubState, ProjectState, SandpackState, ModalState, DrawerState, SidebarState {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  statusBarMessage: string;
  setStatusBarMessage: (message: string) => void;
  refreshGlobalState: () => Promise<void>;
  resetGlobalState: () => void;
  // Console Error tracking
  consoleErrors: ConsoleError[];
  addConsoleError: (error: ConsoleError) => void;
  clearConsoleErrors: () => void;
  hasUnhandledErrors: boolean;
  setHasUnhandledErrors: (hasErrors: boolean) => void;
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

export interface ConsoleError {
  id: string;
  message: string;
  type: 'error' | 'warning';
  timestamp: number;
  stack?: string;
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
  setActiveProject: (project: Project | null) => void;
  statusTimeline: StatusTimelineEvent[];
  // fetchProjects: () => Promise<void>;
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
  setProjects: (projects: Project[]) => void;
  isDeploying: boolean;
  autoDeployProject: (project: Project, codebaserec: CodebaseType, walletAddress: string) => Promise<string | null>;
  setIsDeploying: (isDeploying: boolean) => void;
}

interface SandpackState {
  sandpackAction: SandpackAction;
  setSandpackAction: (action: SandpackAction) => void;
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!backendUrl) {
  throw new Error('NEXT_PUBLIC_BACKEND_URL environment variable is not set');
}

export const fetchCodeVersions = async (projectId: string, address: string) => {
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

export const Initial_ProjectState = {
  projects: [],
  framework: null,
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

const Initial_ConsoleState = {
  consoleErrors: [],
  hasUnhandledErrors: false,
}

export const useGlobalState = create<
  GlobalState & GithubState & ProjectState & SandpackState
>()(
  persist(
    devtools(
      (set, get) => ({
        // ----------------Global States----------------
        setIsDeploying: (isDeploying) => {
          set({ isDeploying })
        },
        error: null,
        setError: (error: string | null) => set({ error }),
        isLoading: false,
        setIsLoading: (isLoading: boolean) => set({ isLoading }),
        statusBarMessage: '',
        setStatusBarMessage: (message: string) => set({ statusBarMessage: message }),
        
        // ----------------Console Error States----------------
        ...Initial_ConsoleState,
        addConsoleError: (error: ConsoleError) => {
          set((state) => ({
            consoleErrors: [...state.consoleErrors, error],
            hasUnhandledErrors: true,
          }));
        },
        clearConsoleErrors: () => {
          set({ consoleErrors: [], hasUnhandledErrors: false });
        },
        setHasUnhandledErrors: (hasErrors: boolean) => {
          set({ hasUnhandledErrors: hasErrors });
        },

        validateWalletConnection: () => {
          if (!useWallet.getState().connected) {
            throw new Error('Wallet connection required to create a project');
          }
        },
        refreshGlobalState: async () => {
          try {
            // const { address } = useWallet.getState();
            // if (!address) {
            //   // throw new Error('No wallet address found');
            // }

            set({ isLoading: true, error: null });
            await useWallet.getState().connect();

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
            consoleErrors: [],
            hasUnhandledErrors: false,
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

        // createRepository: async () => {
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
        // },

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
          if (!octokit || !githubUsername) throw new Error('GitHub not authenticated');
          if (!activeProject) throw new Error('No project selected');

          set({ githubStatus: GITHUB_STATUS.COMMITTING, error: null });
          console.log(`📦 Starting GitHub commit for project: ${activeProject.title}`);
          console.log(`📊 Force push: ${forcePush}, Commit message: ${commitMessage || 'Update via ANON AI'}`);

          try {
            // 1. Ensure repository exists
            console.log(`🔍 Checking if repository exists: ${githubUsername}/${activeProject.title}`);
            const repoExists = await get().checkRepository(activeProject.title);
            console.log(`✅ Repository exists check result: ${repoExists}`);

            if (!repoExists) {
              console.log(`🚀 Repository not found, creating new repository: ${activeProject.title}`);
              const repoCreated = await get().createRepository(activeProject.title);
              console.log(`✅ Repository creation result: ${repoCreated}`);
              if (!repoCreated) throw new Error(get().error || 'Failed to create repo');
              await new Promise((res) => setTimeout(res, 1000));
            }

            // 2. Check if main branch exists (repo might be empty)
            let currentCommitSha: string | undefined;
            let currentTreeSha: string | undefined;

            try {
              console.log(`🌿 Fetching main branch info for: ${githubUsername}/${activeProject.title}`);
              const branch = await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
                owner: githubUsername,
                repo: activeProject.title,
                branch: 'main',
                headers: { 'X-GitHub-Api-Version': '2022-11-28' },
              });

              currentCommitSha = branch.data.commit.sha;
              currentTreeSha = branch.data.commit.commit.tree.sha;
              console.log(`✅ Found existing branch - Commit SHA: ${currentCommitSha}, Tree SHA: ${currentTreeSha}`);
            } catch (error) {
              const err = error as GithubError;
              if (err.status === 404) {
                console.warn('🆕 Repo is empty, initializing with Create File API...');

                const initRes = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
                  owner: githubUsername,
                  repo: activeProject.title,
                  path: 'README.md',
                  message: 'Initial commit',
                  content: Buffer.from('# Initial Commit').toString('base64'),
                  branch: 'main',
                  headers: { 'X-GitHub-Api-Version': '2022-11-28' },
                });
                console.log(`[initRes]`, initRes);
                currentCommitSha = initRes.data.commit.sha;
                console.log(`[currentCommitSha]`, currentCommitSha);
                // @ts-expect-error ignore
                currentTreeSha = initRes.data.commit.tree.sha;
                console.log(`[currentTreeSha]`, currentTreeSha);
                console.log(`✅ Repository initialized - Commit SHA: ${currentCommitSha}, Tree SHA: ${currentTreeSha}`);
              } else {
                console.error('❌ Failed to get branch info:', err);
                throw new Error('Failed to get current branch info');
              }
            }

            // 3. Fetch project files
            console.log(`📁 Fetching project files from backend: ${activeProject.projectId}`);
            const res = await axios.get(
              `${backendUrl}/projects/${activeProject.projectId}?walletAddress=${walletAddress}`
            );

            let codebaseData = res.data.codebase;
            console.log(`📊 Received codebase data with ${Object.keys(codebaseData || {}).length} files`);

            if (!codebaseData) throw new Error('No codebase data returned from server');
            codebaseData = { ...defaultFiles, ...codebaseData };

            if (Object.keys(codebaseData).length === 0) throw new Error('No files to commit');
            console.log(`📝 Total files to commit: ${Object.keys(codebaseData).length}`);

            // 4. Create blobs for each file
            const treeItems: TreeItem[] = [];
            console.log('🔄 Creating blobs for each file...');

            for (const [filePath, content] of Object.entries(codebaseData)) {
              console.log(`📄 Creating blob for file: ${filePath} (${(content as string).length} characters)`);
              const blob = await octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
                owner: githubUsername,
                repo: activeProject.title,
                content: Buffer.from(content as string).toString('base64'),
                encoding: 'base64',
                headers: { 'X-GitHub-Api-Version': '2022-11-28' },
              });

              treeItems.push({
                path: filePath.startsWith('/') ? filePath.slice(1) : filePath,
                mode: '100644',
                type: 'blob',
                sha: blob.data.sha,
              });
              console.log(`✅ Blob created for ${filePath} - SHA: ${blob.data.sha}`);
            }

            // 5. Create a new tree
            console.log(`🌳 Creating new tree with ${treeItems.length} items`);
            const newTree = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
              owner: githubUsername,
              repo: activeProject.title,
              tree: treeItems,
              base_tree: currentTreeSha,
              headers: { 'X-GitHub-Api-Version': '2022-11-28' },
            });
            console.log(`✅ New tree created - SHA: ${newTree.data.sha}`);

            // 6. Create a new commit
            const finalCommitMessage = commitMessage || 'Update via ANON AI';
            console.log(`💾 Creating new commit with message: "${finalCommitMessage}"`);
            const commitRes = await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
              owner: githubUsername,
              repo: activeProject.title,
              message: finalCommitMessage,
              tree: newTree.data.sha,
              parents: [currentCommitSha!],
              headers: { 'X-GitHub-Api-Version': '2022-11-28' },
            });
            console.log(`✅ New commit created - SHA: ${commitRes.data.sha}`);

            // 7. Update the ref to point to the new commit
            console.log(`🔄 Updating main branch reference to new commit (force: ${forcePush})`);
            await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/heads/main', {
              owner: githubUsername,
              repo: activeProject.title,
              sha: commitRes.data.sha,
              force: forcePush,
              headers: { 'X-GitHub-Api-Version': '2022-11-28' },
            });
            console.log(`✅ Branch reference updated successfully`);

            set({ githubStatus: GITHUB_STATUS.REPO_EXISTS });
            console.log(`🎉 GitHub commit completed successfully for project: ${activeProject.title}`);
            toast.success('✅ Code committed to GitHub!');
          } catch (error) {
            const err = error as GithubError
            const msg = err?.response?.data?.message || err.message || 'GitHub commit failed';
            console.error('🚨 GitHub commit failed:', {
              project: activeProject.title,
              error: msg,
              status: err?.status,
              details: err
            });
            set({ error: msg, githubStatus: GITHUB_STATUS.ERROR });
            toast.error('GitHub Error', { description: msg });
            throw err;
          }
        },

        // ----------------Project States----------------
        ...Initial_ProjectState,
        setIsCodeGenerating: (isCodeGenerating: boolean) => set({ isCodeGenerating }),
        setFramework: (framework: Framework) => set({ framework }),
        setDeploymentUrl: (url: string | null) => set({ deploymentUrl: url }),
        setCodebase: (codebase: CodebaseType | null) => set({ codebase }),
        setActiveProject: (project: Project | null) => set({ activeProject: project }),
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
            dependencies: project.externalPackages as Record<string, string>,
          });

          try {
            // Fetch codebase
            console.log('Fetching codebase');
            const codebaseResponse = await axios.get(
              `${backendUrl}/projects/${project.projectId}?walletAddress=${address}`
            );

            console.log('[useGlobalState] codebaseResponse', codebaseResponse.data);
            if (codebaseResponse.data) {
              set({ codebase: codebaseResponse.data.codebase || {} });
              if (codebaseResponse.data.externalPackages && Object.keys(codebaseResponse.data.externalPackages).length > 0) {
                set({ dependencies: codebaseResponse.data.externalPackages as Record<string, string> });
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
        // fetchProjects: async () => {
        //   if (!useWallet.getState().connected || !useWallet.getState().address) {
        //     return;
        //   }

        //   try {
        //     set({ isLoading: true });

        //     const res = await axios.get(
        //       `${backendUrl}/projects?walletAddress=${useWallet.getState().address}`
        //     );

        //     if (!res.data || typeof res.data.projects === 'undefined') {
        //       throw new Error('Invalid response format from server');
        //     }

        //     if (res.data.projects.length > 0) {
        //       await res.data.projects.sort((a: Project, b: Project) => {
        //         return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        //       });
        //       set({ projects: res.data.projects });

        //       const storedProjectDetails = JSON.parse(localStorage.getItem('storedActiveProjects') || '[]');
        //       const isOwner = storedProjectDetails.find((p: { ownerAddress: string }) => p.ownerAddress === useWallet.getState().address);
        //       const storedProjectIdForOwner = storedProjectDetails.find((p: { ownerAddress: string }) => p.ownerAddress === useWallet.getState().address)?.storedProjectId;

        //       if (isOwner && storedProjectIdForOwner) {
        //         const storedProjectFetched = res.data.projects.find(
        //           (p: Project) =>
        //             p.projectId === storedProjectIdForOwner
        //         );
        //         if (storedProjectFetched) {
        //           await get().loadProjectData(
        //             storedProjectFetched,
        //             useWallet.getState().address as string
        //           );
        //         } else {
        //           // await get().loadProjectData(
        //           //   res.data.projects[0],
        //           //   useWallet.getState().address as string
        //           // );
        //         }
        //       } else {
        //         // await get().loadProjectData(
        //         //   res.data.projects[0],
        //         //   useWallet.getState().address as string
        //         // );
        //       }
        //     } else {
        //       set({ ...Initial_ProjectState });
        //     }
        //   } catch (error) {
        //     console.error('Error fetching projects:', error);
        //     const errorMessage =
        //       (error instanceof Error && error.message) ||
        //       'Failed to fetch projects';
        //     set({ error: errorMessage });
        //     toast.error(errorMessage);
        //   } finally {
        //     set({ isLoading: false });
        //   }
        // },
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
              code: ANON_LUA_TEMPLATE,
              tags: [
                {
                  name: 'Description',
                  value: `${projectName} added lsqlite3 and @rakis/DbAdmin support.`,
                },
              ],
            });

            console.log(
              'Successfully added @rakis/DbAdmin support to Lua:',
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

        // Sidebar States
        sidebarOpen: true,
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

        setDependencies: (newDeps: Record<string, string>) => {
          set({ dependencies: newDeps });
        },

        setProjects: (projects: Project[]) => set({ projects }),

        autoDeployProject: async (project: Project, codebase: CodebaseType, walletAddress: string): Promise<string | null> => {
          set({ isDeploying: true });
          try {
            console.log("🚀 Starting deployment...");
            const uploadedMap: Record<string, string> = {};
            const manifestPaths: Record<string, { id: string }> = {};

            // Step 1: Upload all files and store txIds
            for (const [filename, content] of Object.entries(codebase)) {
              const cleanName = filename.replace(/^\//, '');
              const type = mime.lookup(cleanName) || 'application/octet-stream';
              const file = new File([new Blob([content], { type })], cleanName, { type });
              const txId = await uploadToTurbo(file, walletAddress);
              // @ts-expect-error ignore
              uploadedMap[cleanName] = txId;
              // @ts-expect-error ignore
              manifestPaths[cleanName] = { id: txId };
            }

            // Step 2: Construct the AR.IO manifest
            const manifest = {
              manifest: "arweave/paths",
              version: "0.2.0",
              index: { path: "index.html" },
              fallback: manifestPaths["404.html"] ? { id: manifestPaths["404.html"].id } : undefined,
              paths: manifestPaths
            };

            console.log('manifestFile', manifest);

            const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
              type: 'application/x.arweave-manifest+json',
            });
            const manifestFile = new File([manifestBlob], 'manifest.json', {
              type: 'application/x.arweave-manifest+json',
            });

            // Step 3: Upload manifest
            const manifestTxId = await uploadToTurbo(manifestFile, walletAddress, true);
            const deploymentUrl = `https://arweave.net/${manifestTxId}`;

            console.log("✅ Deployment complete via manifest:", deploymentUrl);
            // Step 4: Update deployment URL in backend
            const updateResponse = await axios.patch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${project.projectId}`,
              { deploymentUrl: deploymentUrl },
              { params: { walletAddress: walletAddress } }
            );

            if (updateResponse.data?.project?.deploymentUrl) {
              set({ deploymentUrl: deploymentUrl });
              console.log('✅ Backend DB updated with deployment URL' );
              return deploymentUrl;
            } else {
              throw new Error('Failed to update deployment URL in backend');
            }
          } catch (err) {
            console.error("❌ Deployment failed:", err);
            return null;
          } finally {
            set({ isDeploying: false });
          }
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