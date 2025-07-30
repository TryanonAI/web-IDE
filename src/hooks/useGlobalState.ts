import axios from 'axios';
import mime from 'mime-types';
import { create } from 'zustand';
import { defaultFiles, generateSrcDocFromCodebase } from '@/lib/utils';
import { API_CONFIG, templateSrcDoc } from '@/lib/constants';
import { persist } from 'zustand/middleware';
import { fetchCodeVersions, fetchProjectData, uploadToTurbo, checkBalanceForDeployment, InsufficientBalanceError } from '@/lib';
import { toast } from 'sonner';
import { useWallet } from './useWallet';
import { Octokit } from '@octokit/core';
import { runLua, spawnProcess } from '@/lib/arkit';
import {
  type Project,
  type ChatMessage,
  type StatusTimelineEvent,
  Framework,
  SandpackAction,
  type CodebaseType,
  type CodeVersion,
} from '@/types';
import { ANON_LUA_TEMPLATE } from '@/constant/templateFiles';
// import type { ImperativePanelHandle } from 'react-resizable-panels';
// import type { TNodeType } from '@/react-flow/nodes/index/type';
// import { type Node } from '@/react-flow/nodes/index';

export type AOMessage = {
  id: string;
  // @ts-expect-error ignore
  Output;
  // @ts-expect-error ignore
  Messages;
  // @ts-expect-error ignore
  Spawns;
  // @ts-expect-error ignore
  Error?;
}

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

export type OutputType = { type: "output" | "error" | "success" | "info" | "warning", message: string, preMessage?: string, aoMessage?: AOMessage };

export interface TreeItem {
  path: string;
  mode: '100644' | '100755' | '040000' | '160000' | '120000';
  type: 'blob' | 'tree' | 'commit';
  sha: string;
}

const GITHUB_STATUS = {
  DISCONNECTED: 'disconnected',
  AUTHENTICATED: 'authenticated',
  CHECKING_REPO: 'checking_repo',
  REPO_EXISTS: 'repo_exists',
  CREATING_REPO: 'creating_repo',
  COMMITTING: 'committing',
  ERROR: 'error',
};

export type GITHUB_STATUS = typeof GITHUB_STATUS[keyof typeof GITHUB_STATUS];

export type GitHubStatus =
  | 'disconnected'
  | 'authenticated'
  | 'checking_repo'
  | 'error';

// export type DrawerType = 'createProject' | 'projectInfo' | 'githubStatus';
const DrawerType = {
  CREATE_PROJECT: 'createProject',
  PROJECT_INFO: 'projectInfo',
  GITHUB_STATUS: 'githubStatus',
}

export type DrawerType = typeof DrawerType[keyof typeof DrawerType];

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

// export interface CanvasState {
//   historyIndex?: number;
//   historyLength?: number;
//   isFlowRunning?: boolean;
//   selectedNode?: { id: string; type: string } | null;
//   isNodeDropdownOpen?: boolean;

//   consoleRef: React.RefObject<ImperativePanelHandle> | null;
//   sidebarRef: React.RefObject<ImperativePanelHandle> | null;
//   setConsoleRef: (ref: React.RefObject<ImperativePanelHandle>) => void;
//   setSidebarRef: (ref: React.RefObject<ImperativePanelHandle>) => void;
//   toggleRightSidebar: (open: boolean) => void;
//   outputs: OutputType[];
//   addOutput: (output: OutputType) => void;
//   clearOutputs: () => void;
//   attach: string | undefined;
//   setAttach: (attach: string | undefined) => void;
//   availableNodes: TNodeType[];
//   setAvailableNodes: (nodes: TNodeType[]) => void;
//   order: { [id: string]: number };
//   setOrder: (order: { [id: string]: number }) => void;

//   activeNode: Node | undefined;
//   setActiveNode: (node: Node | undefined) => void;

//   flowIsRunning: boolean;
//   setFlowIsRunning: (running: boolean) => void;
//   runningNodes: Node[];
//   addRunningNode: (node: Node) => void;
//   successNodes: Node[];
//   addSuccessNode: (node: Node) => void;
//   errorNodes: Node[];
//   addErrorNode: (node: Node) => void;
//   resetNodes: () => void;

//   resetNode: (id: string) => void;

//   // AI Copilot platform selection
//   selectedPlatforms: string[];
//   setSelectedPlatforms: (platforms: string[]) => void;
//   togglePlatform: (platform: string) => void;
//   setIsNodeDropdownOpen: (open: boolean) => void;
// };

export interface GlobalState extends GithubState, ProjectState, SandpackState, ModalState, DrawerState, SidebarState {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  statusBarMessage: string;
  setStatusBarMessage: (message: string) => void;
  refreshGlobalState: () => Promise<void>;
  resetGlobalState: () => void;
  srcDocCode: string;
  setSrcDocCode: (srcDocCode: string) => void;

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
  octokit: Octokit | null;
  setOctokit: (octokit: Octokit | null) => void;
  githubToken: string | null;
  setGithubToken: (githubToken: string | null) => void;
  githubUsername: string | null;
  setGithubUsername: (githubUsername: string | null) => void;
  isLoadingCommits: boolean;
  setIsLoadingCommits: (isLoading: boolean) => void;

  checkRepository: (projectName: string) => Promise<boolean>;
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
  framework: Framework | null;
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
  isDeploying: false
}

const Initial_ConsoleState = {
  consoleErrors: [],
  hasUnhandledErrors: false,
}

export const useGlobalState = create<
  GlobalState & GithubState & ProjectState & SandpackState 
  // & CanvasState
>()(
  persist(
    (set, get) => ({
      srcDocCode: templateSrcDoc,
      setSrcDocCode: (srcDocCode: string) => set({ srcDocCode }),
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
            throw new Error('Create/Connect Repo before committing');
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
          const res = await fetchProjectData(activeProject.projectId, walletAddress);

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
          const codebaseResponse = await fetchProjectData(project.projectId, address);
          console.log('[useGlobalState] codebaseResponse', codebaseResponse);
          if (codebaseResponse) {
            set({ codebase: codebaseResponse.codebase || {} });
            set({ srcDocCode: generateSrcDocFromCodebase(codebaseResponse.codebase || {}) });
            if (codebaseResponse.externalPackages && Object.keys(codebaseResponse.externalPackages).length > 0) {
              set({ dependencies: codebaseResponse.externalPackages as Record<string, string> });
            }
            if (codebaseResponse.messages && codebaseResponse.messages.length > 0) {
              set({ chatMessages: codebaseResponse.messages as ChatMessage[] });
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
          const res = await axios.post(`${API_CONFIG.BACKEND_URL}/projects`, {
            processId,
            framework,
            title: projectName,
            walletAddress: useWallet.getState().address
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

          // toast.success('Project created successfully');
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


      // ----------------Canvas States----------------
/*
      consoleRef: null,
      setConsoleRef: (ref: React.RefObject<ImperativePanelHandle>) => set({ consoleRef: ref }),

      sidebarRef: null,
      setSidebarRef: (ref: React.RefObject<ImperativePanelHandle>) => set({ sidebarRef: ref }),

      toggleRightSidebar: (open: boolean) => {
        const sidebarRef = get().sidebarRef;
        const ref = sidebarRef?.current;
        console.log('toggleRightSidebar called:', { open, hasRef: !!ref, hasSidebarRef: !!sidebarRef });
        if (ref) {
          if (open) {
            ref.expand?.();
            ref.resize?.(40);
          } else {
            ref.collapse?.();
          }
        } else {
          console.warn('Sidebar ref not available, retrying in 100ms...');
          setTimeout(() => {
            const retryRef = get().sidebarRef?.current;
            if (retryRef) {
              if (open) {
                retryRef.expand?.();
                retryRef.resize?.(40);
              } else {
                retryRef.collapse?.();
              }
            }
          }, 100);
        }
      },

      outputs: [],
      addOutput: (output: OutputType) =>
        set((state) => ({ outputs: [...state.outputs, output] })),
      clearOutputs: () => set({ outputs: [] }),

      attach: undefined,
      setAttach: (attach: string | undefined) => set({ attach }),

      availableNodes: [],
      setAvailableNodes: (nodes: TNodeType[]) => set({ availableNodes: nodes }),

      order: {},
      setOrder: (order: { [id: string]: number }) => set({ order }),

      historyIndex: 0,
      historyLength: 0,
      isFlowRunning: false,
      selectedNode: null,
      isNodeDropdownOpen: false,
      setIsNodeDropdownOpen: (open: boolean) => set({ isNodeDropdownOpen: open }),

      activeNode: undefined,
      setActiveNode: (node: Node | undefined) => set({ activeNode: node }),

      flowIsRunning: false,
      setFlowIsRunning: (running: boolean) => set({ flowIsRunning: running }),

      runningNodes: [],
      addRunningNode: (node: Node) =>
        set((state) => ({ runningNodes: [...state.runningNodes, node] })),

      successNodes: [],
      addSuccessNode: (node: Node) =>
        set((state) => ({ successNodes: [...state.successNodes, node] })),

      errorNodes: [],
      addErrorNode: (node: Node) =>
        set((state) => ({ errorNodes: [...state.errorNodes, node] })),

      resetNodes: () => set(() => ({ runningNodes: [], successNodes: [], errorNodes: [] })),
      resetNode: (id: string) => set((state) => ({ runningNodes: state.runningNodes.filter((node) => node.id !== id), successNodes: state.successNodes.filter((node) => node.id !== id), errorNodes: state.errorNodes.filter((node) => node.id !== id) })),

      selectedPlatforms: [],
      setSelectedPlatforms: (platforms: string[]) => set({ selectedPlatforms: platforms }),
      togglePlatform: (platform: string) =>
        set((state) => {
          const selected = state.selectedPlatforms.includes(platform);
          return {
            selectedPlatforms: selected
              ? state.selectedPlatforms.filter((p) => p !== platform)
              : [...state.selectedPlatforms, platform],
          };
        }),

*/
      setDependencies: (newDeps: Record<string, string>) => {
        set({ dependencies: newDeps });
      },

      setProjects: (projects: Project[]) => set({ projects }),

      autoDeployProject: async (project: Project, codebase: CodebaseType, walletAddress: string): Promise<string | null> => {
        set({ isDeploying: true });
        try {
          console.log("🚀 Starting deployment...");
          
          // Calculate total size of all files to check balance upfront
          let totalSize = 0;
          const files: File[] = [];
          
          for (const [filename, content] of Object.entries(codebase)) {
            const cleanName = filename.replace(/^\//, '');
            const type = mime.lookup(cleanName) || 'application/octet-stream';
            const blob = new Blob([content], { type });
            const file = new File([blob], cleanName, { type });
            files.push(file);
            totalSize += file.size;
          }
          
          // Add manifest file size (approximate)
          const manifestSize = 1024; // 1KB estimate for manifest
          totalSize += manifestSize;
          
          console.log(`Total deployment size: ${totalSize} bytes`);
          
          // Check balance for total deployment
          const balanceCheck = await checkBalanceForDeployment(totalSize, walletAddress);
          
          if (!balanceCheck.sufficient) {
            if (balanceCheck.error) {
              toast.error("Balance check failed", {
                description: balanceCheck.error,
              });
              return null;
            }
            
            const deficit = balanceCheck.required - balanceCheck.current;
            toast.error("Insufficient AR balance for deployment", {
              description: `You need ${balanceCheck.required.toFixed(4)} AR but only have ${balanceCheck.current.toFixed(4)} AR. Please add ${deficit.toFixed(4)} AR to your wallet and try again.`,
              duration: 10000,
            });
            return null;
          }

          const uploadedMap: Record<string, string> = {};
          const manifestPaths: Record<string, { id: string }> = {};

          // Step 1: Upload all files and store txIds
          for (const file of files) {
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
            `${API_CONFIG.BACKEND_URL}/projects/${project.projectId}`,
            { deploymentUrl: deploymentUrl },
            { params: { walletAddress: walletAddress } }
          );

          if (updateResponse.data?.project?.deploymentUrl) {
            set({ deploymentUrl: deploymentUrl });
            console.log('✅ Backend DB updated with deployment URL');
            return deploymentUrl;
          } else {
            throw new Error('Failed to update deployment URL in backend');
          }
        } catch (err) {
          console.error("❌ Deployment failed:", err);
          
          if (err instanceof InsufficientBalanceError) {
            toast.error("Insufficient AR balance", {
              description: err.message,
              duration: 10000,
            });
          } else if (err instanceof Error) {
            toast.error("Deployment failed", {
              description: err.message,
            });
          } else {
            toast.error("Deployment failed", {
              description: "An unknown error occurred during deployment",
            });
          }
          
          return null;
        } finally {
          set({ isDeploying: false });
        }
      },
    }),
    {
      name: 'global-github-state',
      partialize: (state) => ({
        githubToken: state.githubToken,
      }),
    }
  )
);

// Additional exports
export { GITHUB_STATUS, DrawerType, Initial_GithubState, Initial_ConsoleState };