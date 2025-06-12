'use client';

import { PlusCircle } from 'lucide-react';
import { useGlobalState } from '@/hooks';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks';
import { Loading_Gif } from '@/app/loading';
import { useEffect } from 'react';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import Codeview from '@/components/features/dashboard/Codeview';
import Chatview from '@/components/features/dashboard/Chatview';

const Dashboard = () => {
  const connected = useWallet((state) => state.connected);
  const openModal = useGlobalState((state) => state.openModal);
  const isLoading = useGlobalState((state) => state.isLoading);
  const fetchProjects = useGlobalState((state) => state.fetchProjects);
  const activeProject = useGlobalState((state) => state.activeProject);

  useEffect(() => {
    if (connected) {
      fetchProjects();
    }
  }, [connected, fetchProjects]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Loading_Gif count={3} />
      </div>
    );
  }

  return activeProject ? (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={50} minSize={30}>
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
