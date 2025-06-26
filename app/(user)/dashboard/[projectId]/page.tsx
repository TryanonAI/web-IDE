'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useGlobalState } from '@/hooks';
import { useWallet } from '@/hooks';
import { Loading_Gif } from '@/app/loading';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import Codeview from '@/components/pages/dashboard/codeview/Codeview';
import Chatview from '@/components/pages/dashboard/chatview/Chatview';

interface DashboardProps {
  params: Promise<{
    projectId: string;
  }>;
}

const Dashboard = ({ params }: DashboardProps) => {
  // Properly unwrap the params promise
  const { projectId } = use(params);
  const { address } = useWallet();
  const router = useRouter();
  const isLoading = useGlobalState((state) => state.isLoading);
  const projects = useGlobalState((state) => state.projects);
  const loadProjectData = useGlobalState((state) => state.loadProjectData);
  const setIsLoading = useGlobalState((state) => state.setIsLoading);
  const setProjects = useGlobalState((state) => state.setProjects);
  const activeProject = useGlobalState((state) => state.activeProject);
  
  // State to track if project was found
  const [projectNotFound, setProjectNotFound] = useState(false);
  const [hasCheckedProject, setHasCheckedProject] = useState(false);
  
  // Ref to access chat functionality
  const chatRef = useRef<{ sendMessage: (message: string) => void } | null>(null);
  
  // Function to send error messages to chat
  const handleSendErrorToChat = (errorMessage: string) => {
    if (chatRef.current) {
      chatRef.current.sendMessage(errorMessage);
    } else {
      console.warn('Chat is not available to receive error message');
      toast.error('Unable to send error to chat. Please try again.');
    }
  };

  // Load project data when component mounts or projectId changes
  useEffect(() => {
    const loadData = async () => {
      if (!address || !projectId) {
        return;
      }

      setIsLoading(true);
      setProjectNotFound(false);
      setHasCheckedProject(false);

      let currentProjects = projects;

      // If projects are not loaded, fetch them
      if (currentProjects.length === 0) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects?walletAddress=${address}`
          );
          if (response.data && response.data.projects) {
            currentProjects = response.data.projects;
            setProjects(currentProjects);
          } else {
            setProjects([]);
          }
        } catch (error) {
          console.error('Error fetching user projects:', error);
          toast.error('Failed to fetch your projects');
          setProjects([]);
          setIsLoading(false);
          setHasCheckedProject(true);
          return;
        }
      }

      // Now find and load the specific project
      const project = currentProjects.find((p) => p.projectId === projectId);
      if (project) {
        await loadProjectData(project, address);
        setProjectNotFound(false);
      } else {
        toast.error('Project not found or you do not have access.');
        setProjectNotFound(true);
      }
      
      setHasCheckedProject(true);
      setIsLoading(false);
    };

    loadData();
  }, [projectId, address, loadProjectData, setIsLoading, setProjects]);

  // Show loading while checking
  if (isLoading || !hasCheckedProject) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Loading_Gif count={3} />
      </div>
    );
  }

  // Show error page if project not found
  if (projectNotFound || !activeProject || activeProject.projectId !== projectId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="flex justify-center">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Project Not Found</h1>
                         <p className="text-muted-foreground">
               The project with ID &quot;{projectId}&quot; could not be found or you don&apos;t have access to it.
             </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              View All Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={50} minSize={40}>
        <Codeview onSendErrorToChat={handleSendErrorToChat} />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50} minSize={20}>
        <Chatview ref={chatRef} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Dashboard;
