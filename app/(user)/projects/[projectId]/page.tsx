'use client';

import { use, useEffect, useState, useRef, Suspense } from 'react';
import { useGlobalState } from '@/hooks';
import { useWallet } from '@/hooks';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import Codeview from '@/components/pages/dashboard/codeview/Codeview';
import Chatview from '@/components/pages/dashboard/chatview/Chatview';
import ProjectLoadingSkeleton from '@/components/pages/dashboard/ProjectLoadingSkeleton';

interface DashboardProps {
  params: Promise<{
    projectId: string;
  }>;
}

const DashboardContent = ({ projectId }: { projectId: string }) => {
  const { address } = useWallet();
  const router = useRouter();
  const isLoading = useGlobalState((state) => state.isLoading);
  const projects = useGlobalState((state) => state.projects);
  const loadProjectData = useGlobalState((state) => state.loadProjectData);
  const setIsLoading = useGlobalState((state) => state.setIsLoading);
  const setProjects = useGlobalState((state) => state.setProjects);
  const activeProject = useGlobalState((state) => state.activeProject);

  const [projectNotFound, setProjectNotFound] = useState(false);
  const [hasCheckedProject, setHasCheckedProject] = useState(false);
  const [isProjectLoading, setIsProjectLoading] = useState(false);

  const chatRef = useRef<{ sendMessage: (message: string) => void } | null>(
    null
  );

  const handleSendErrorToChat = (errorMessage: string) => {
    if (chatRef.current) {
      chatRef.current.sendMessage(errorMessage);
    } else {
      console.warn('Chat is not available to receive error message');
      toast.error('Unable to send error to chat. Please try again.');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!address || !projectId) {
        return;
      }

      setIsLoading(true);
      setIsProjectLoading(true);
      setProjectNotFound(false);
      setHasCheckedProject(false);

      let currentProjects = projects;

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
          setIsProjectLoading(false);
          setHasCheckedProject(true);
          return;
        }
      }

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
      setIsProjectLoading(false);
    };

    loadData();
  }, [projectId, address, loadProjectData, setIsLoading, setProjects]);

  if (isLoading || !hasCheckedProject || isProjectLoading) {
    return <ProjectLoadingSkeleton />;
  }

  if (projectNotFound) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background h-screen">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="flex justify-center">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Project Not Found
            </h1>
            <p className="text-muted-foreground">
              The project with ID &quot;{projectId}&quot; could not be found or
              you don&apos;t have access to it.
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
              onClick={() => router.push('/projects')}
              className="flex items-center gap-2"
            >
              View All Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeProject || activeProject.projectId !== projectId) {
    return <ProjectLoadingSkeleton />;
  }

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={43} minSize={43}>
        <Suspense fallback={<ProjectLoadingSkeleton />}>
          <Chatview ref={chatRef} />
        </Suspense>
      </ResizablePanel>
      {/* <ResizableHandle /> */}
      <ResizablePanel defaultSize={57} minSize={57}>
        <Suspense fallback={<ProjectLoadingSkeleton />}>
          <Codeview onSendErrorToChat={handleSendErrorToChat} />
        </Suspense>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

const Dashboard = ({ params }: DashboardProps) => {
  const { projectId } = use(params);

  return (
    <Suspense fallback={<ProjectLoadingSkeleton />}>
      <DashboardContent projectId={projectId} />
    </Suspense>
  );
};

export default Dashboard;
