'use client';

import { useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalState } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Loading_Gif } from '@/app/loading';

const Dashboard = () => {
  const router = useRouter();
  const openModal = useGlobalState((state) => state.openModal);
  const isLoading = useGlobalState((state) => state.isLoading);
  const projects = useGlobalState((state) => state.projects);

  // Redirect to most recent project if available
  useEffect(() => {
    if (projects.length > 0 && !isLoading) {
      // Sort projects by creation date and get the most recent one
      const mostRecentProject = [...projects].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      router.replace(`/dashboard/${mostRecentProject.projectId}`);
    }
  }, [projects, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Loading_Gif count={3} />
      </div>
    );
  }

  return (
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
