'use client';

import { use } from 'react';
import { useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { useGlobalState } from '@/hooks';
import { useWallet } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Loading_Gif } from '@/app/loading';

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
  const openModal = useGlobalState((state) => state.openModal);
  const isLoading = useGlobalState((state) => state.isLoading);
  const activeProject = useGlobalState((state) => state.activeProject);
  const projects = useGlobalState((state) => state.projects);
  const loadProjectData = useGlobalState((state) => state.loadProjectData);
  const setIsLoading = useGlobalState((state) => state.setIsLoading);

  // Load project data when component mounts or projectId changes
  useEffect(() => {
    const loadProject = async () => {
      if (projectId && address && projects.length > 0) {
        setIsLoading(true);
        const project = projects.find(p => p.projectId === projectId);
        if (project) {
          await loadProjectData(project, address);
        }
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId, address, projects, loadProjectData, setIsLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Loading_Gif count={3} />
      </div>
    );
  }

  return activeProject ? (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={50} minSize={40}>
        <Codeview />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50} minSize={20}>
        <Chatview />
      </ResizablePanel>
    </ResizablePanelGroup>
  ) : (
    <div className="flex flex-1 items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center text-center">
        <p className="mb-6 text-xl font-semibold text-foreground">
          Create your first project and start vibe coding with{' '}
          <span className="font-bold">Anon</span>
        </p>
        <Button
          size="lg"
          onClick={() => openModal('createProject')}
          className="flex items-center gap-2 px-4 py-2.5 text-base h-auto cursor-pointer"
        >
          <PlusCircle size={20} />
          <span>Create New Project</span>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard; 