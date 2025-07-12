'use client';

import { use, useEffect, useState, useRef, Suspense } from 'react';
import { useGlobalState } from '@/hooks';
import { useWallet } from '@/hooks';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import Codeview from '@/components/pages/dashboard/codeview/Codeview';
import Chatview from '@/components/pages/dashboard/chatview/Chatview';
import ProjectLoadingSkeleton from '@/components/pages/dashboard/ProjectLoadingSkeleton';
import Image from 'next/image';

interface DashboardProps {
  params: Promise<{
    projectId: string;
  }>;
}

const DashboardContent = ({ projectId }: { projectId: string }) => {
  const { address } = useWallet();
  const router = useRouter();
  const projects = useGlobalState((state) => state.projects);
  const loadProjectData = useGlobalState((state) => state.loadProjectData);
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

      // Check if we already have the correct project loaded
      if (activeProject?.projectId === projectId) {
        setHasCheckedProject(true);
        setIsProjectLoading(false);
        return;
      }

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
          setIsProjectLoading(false);
          setHasCheckedProject(true);
          return;
        }
      }

      const project = currentProjects.find((p) => p.projectId === projectId);
      if (project) {
        try {
          await loadProjectData(project, address);
          setProjectNotFound(false);
        } catch (err) {
          console.error('Error loading project data:', err);
          toast.error('Failed to load project data');
          setProjectNotFound(true);
        }
      } else {
        setProjectNotFound(true);
      }

      setHasCheckedProject(true);
      setIsProjectLoading(false);
    };

    loadData();
  }, [
    projectId,
    address,
    projects,
    activeProject?.projectId, // Only depend on the project ID, not the entire object
    loadProjectData,
    setProjects,
  ]);

  if (!hasCheckedProject || isProjectLoading) {
    return <ProjectLoadingSkeleton />;
  }

  if (projectNotFound) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background h-screen">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="flex justify-center">
            <Image
              src="/not-found.gif"
              alt="project Not Found"
              width={200}
              height={200}
              priority
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Project Not Found
            </h1>
            <p className="text-muted-foreground max-w-2xs">
              This project no longer exists or you don&apos;t have access to it.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push('/projects')}
              className="flex items-center gap-2"
            >
              View Projects
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
