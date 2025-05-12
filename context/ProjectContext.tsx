'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { DbAdmin_LUA_CODE, runLua, spawnProcess } from '@/lib/arkit';
import { useWallet } from './WalletContext';
import { ActiveProjectType, FileData } from '@/types/types';

// Define proper types for our context
type CodebaseType = Record<string, string | FileData> | FileData[] | FileData;
type ChatMessageType = {
  id: string;
  content: string | Record<string, unknown>;
  role: string;
  timestamp: string;
  isLoading?: boolean;
};

// Add a type for timeline status events
type StatusTimelineEvent = {
  id: string;
  message: string;
  timestamp: number;
};

interface ProjectContextType {
  projects: ActiveProjectType[];
  activeProject: ActiveProjectType | null;
  isLoading: boolean;
  isCreating: boolean;
  isLoadingProjectData: boolean;
  codebase: CodebaseType | null;
  chatMessages: ChatMessageType[];
  error: Error | null;
  status: string;
  statusTimeline: StatusTimelineEvent[];
  fetchProjects: () => Promise<void>;
  handleProjectSelect: (project: ActiveProjectType) => Promise<void>;
  createProject: (projectName: string) => Promise<ActiveProjectType | null>;
  refreshProject: () => Promise<void>;
  setCodebase: (codebase: CodebaseType | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ActiveProjectType[]>([]);
  const [activeProject, setActiveProject] = useState<ActiveProjectType | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isLoadingProjectData, setIsLoadingProjectData] =
    useState<boolean>(false);
  const [codebase, setCodebase] = useState<CodebaseType | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(true);
  const [statusTimeline, setStatusTimeline] = useState<StatusTimelineEvent[]>(
    []
  );
  const [explicitProjectSelection, setExplicitProjectSelection] =
    useState<boolean>(false);

  const { walletAddress, walletStatus } = useWallet();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL environment variable is not set');
  }

  // Add status to the timeline
  const addStatusEvent = (message: string) => {
    const newEvent = {
      id: Date.now().toString(),
      message,
      timestamp: Date.now(),
    };

    setStatusTimeline((prev) => [...prev, newEvent]);
    setStatus(message);

    // console.log(`Status update: ${message}`); // For debugging
  };

  const loadProjectData = async (project: ActiveProjectType) => {
    if (!project || !project.projectId || !walletAddress) {
      return;
    }

    setIsLoadingProjectData(true);
    addStatusEvent('Loading project data...');
    setActiveProject(project);
    localStorage.setItem('activeProjectId', project.projectId);

    try {
      // Fetch codebase
      addStatusEvent(`Loading codebase for ${project.name}...`);
      const codebasePromise = axios.get(
        `${backendUrl}/projects/${project.projectId}?walletAddress=${walletAddress}`
      );

      // Fetch chat messages
      addStatusEvent(`Loading chat history for ${project.name}...`);
      const messagesPromise = axios.get(
        `${backendUrl}/chat/history/${project.projectId}`
      );

      // Wait for both to complete
      const [codebaseResponse, messagesResponse] = await Promise.all([
        codebasePromise,
        messagesPromise,
      ]);

      if (codebaseResponse.data) {
        setCodebase(codebaseResponse.data.codebase || {});
      }

      if (messagesResponse.data && messagesResponse.data.messages) {
        interface RawMessage {
          id: string;
          content: string | Record<string, unknown>;
          role: string;
          timestamp: string;
          isLoading?: boolean;
        }

        const formattedMessages = messagesResponse.data.messages.map(
          (msg: RawMessage) => ({
            ...msg,
            content:
              msg.role === 'model'
                ? typeof msg.content === 'string'
                  ? JSON.parse(msg.content)
                  : msg.content
                : msg.content,
          })
        );
        console.log('formattedMessages', formattedMessages);
        setChatMessages(formattedMessages as ChatMessageType[]);
      } else {
        setChatMessages([]);
      }

      // Only show toast for explicit user-triggered project selection
      // This prevents duplicate toasts during initial app load
      if (explicitProjectSelection) {
        toast.success(`Loaded project: ${project.name}`);
        // Reset the flag after showing the toast
        setExplicitProjectSelection(false);
      }

      addStatusEvent(`Project ${project.name} loaded successfully`);
    } catch (error) {
      console.error('Error loading project data:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load project data';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
      addStatusEvent(`Error loading project: ${errorMessage}`);
    } finally {
      setIsLoadingProjectData(false);
      setStatus('');
    }
  };

  const fetchProjects = useCallback(async () => {
    // Don't fetch if not connected
    if (walletStatus !== 'connected' || !walletAddress) {
      return;
    }

    try {
      setIsLoading(true);
      addStatusEvent('Fetching projects...');
      setError(null);

      const res = await axios.get(
        `${backendUrl}/projects?walletAddress=${walletAddress}`
      );

      if (!res.data || typeof res.data.projects === 'undefined') {
        throw new Error('Invalid response format from server');
      }

      addStatusEvent(`Found ${res.data.projects.length} projects`);

      if (res.data.projects.length > 0) {
        setProjects(res.data.projects);
        setIsFirstVisit(false);

        const storedProjectId = localStorage.getItem('activeProjectId');

        if (storedProjectId) {
          addStatusEvent('Restoring previously selected project...');
          const storedProject = res.data.projects.find(
            (p: ActiveProjectType) => p.projectId === storedProjectId
          );

          if (storedProject) {
            await loadProjectData(storedProject);
          } else {
            addStatusEvent(
              'Previously selected project not found, loading first project...'
            );
            await loadProjectData(res.data.projects[0]);
          }
        } else {
          addStatusEvent('No project selected, loading first project...');
          await loadProjectData(res.data.projects[0]);
        }
      } else {
        setProjects([]);
        setActiveProject(null);
        setCodebase(null);
        setChatMessages([]);
        localStorage.removeItem('activeProjectId');

        // Don't show toast for first-time users with no projects
        if (!isFirstVisit) {
          toast.info('No projects found! Create a new project');
        }

        addStatusEvent('No projects found');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      const errorMessage =
        (error instanceof Error && error.message) || 'Failed to fetch projects';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
      addStatusEvent(`Error fetching projects: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  }, [backendUrl, isFirstVisit, walletAddress, walletStatus]);

  const handleProjectSelect = async (project: ActiveProjectType) => {
    try {
      if (!project) {
        setActiveProject(null);
        setCodebase(null);
        setChatMessages([]);
        setError(null);
        localStorage.removeItem('activeProjectId');
        return;
      }

      if (!project.projectId) {
        throw new Error('Invalid project ID');
      }

      // Check if wallet address is available
      if (!walletAddress) {
        throw new Error(
          'Wallet address is required. Please connect your wallet.'
        );
      }

      // Set this flag to indicate this is an explicit user selection
      // rather than an automatic load during initialization
      setExplicitProjectSelection(true);

      // Load project data (codebase and messages)
      await loadProjectData(project);
    } catch (error) {
      console.error('Error selecting project:', error);
      let errorMessage = 'Failed to load project';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(new Error(errorMessage));
      toast.error(errorMessage);
      addStatusEvent(`Error selecting project: ${errorMessage}`);
      setActiveProject(null);
      setCodebase(null);
      setChatMessages([]);
      localStorage.removeItem('activeProjectId');
    }
  };

  const createProject = async (
    projectName: string
  ): Promise<ActiveProjectType | null> => {
    try {
      if (
        !projectName ||
        typeof projectName !== 'string' ||
        projectName.trim() === ''
      ) {
        throw new Error(
          'Project name is required and must be a non-empty string'
        );
      }

      if (walletStatus !== 'connected' || !walletAddress) {
        throw new Error('Wallet connection required to create a project');
      }

      addStatusEvent('Creating Project...');
      setIsCreating(true);
      setError(null);

      // Clear timeline for new project creation
      setStatusTimeline([
        {
          id: Date.now().toString(),
          message: `Creating new project: ${projectName}...`,
          timestamp: Date.now(),
        },
      ]);

      // Spawn a process for the project using arkit.ts
      addStatusEvent('Generating process ID...');
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
      addStatusEvent('Saving project to backend...');
      const res = await axios.post(`${backendUrl}/projects`, {
        processId,
        title: projectName,
        walletAddress: walletAddress,
        framework: 'react',
      });

      if (!res.data?.project) {
        throw new Error('Invalid response from server: missing project data');
      }

      const newProject = res.data.project;
      console.log('Created new project:', newProject);

      // Update state with new project
      setProjects((prevProjects) => [...prevProjects, newProject]);

      // Load the new project data
      addStatusEvent('Loading new project data...');
      await loadProjectData(newProject);

      setIsFirstVisit(false);

      toast.success('Project created successfully');
      addStatusEvent('Project created successfully');
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error creating project';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
      addStatusEvent(`Error creating project: ${errorMessage}`);
      return null;
    } finally {
      setIsCreating(false);
      setStatus('');
    }
  };

  const refreshProject = async () => {
    if (!activeProject) {
      toast.error('No project selected to refresh');
      return;
    }

    addStatusEvent('Refreshing project...');
    await fetchProjects();
    toast.info('Project refreshed');
    setStatus('');
  };

  // Effect to fetch projects when wallet status changes
  useEffect(() => {
    if (walletStatus === 'connected' && walletAddress) {
      // Clear the timeline when starting a new session
      setStatusTimeline([
        {
          id: Date.now().toString(),
          message: 'Initializing project manager...',
          timestamp: Date.now(),
        },
      ]);

      fetchProjects();
    } else {
      // Clear projects when wallet disconnects
      setProjects([]);
      setActiveProject(null);
      setCodebase(null);
      setChatMessages([]);

      // Add disconnection to timeline
      if (walletStatus === 'disconnected') {
        setStatusTimeline([
          {
            id: Date.now().toString(),
            message: 'Wallet disconnected, please reconnect',
            timestamp: Date.now(),
          },
        ]);
      }
    }
  }, [walletStatus, walletAddress, fetchProjects]);

  // Listen for chat message updates from Chatview component
  useEffect(() => {
    const handleChatMessageUpdate = (
      event: CustomEvent<{ messages: ChatMessageType[] }>
    ) => {
      if (event.detail?.messages) {
        setChatMessages(event.detail.messages);
      }
    };

    window.addEventListener(
      'chatMessageUpdate',
      handleChatMessageUpdate as EventListener
    );
    return () => {
      window.removeEventListener(
        'chatMessageUpdate',
        handleChatMessageUpdate as EventListener
      );
    };
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        isLoading,
        isCreating,
        isLoadingProjectData,
        codebase,
        chatMessages,
        error,
        status,
        statusTimeline,
        fetchProjects,
        handleProjectSelect,
        createProject,
        refreshProject,
        setCodebase,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
