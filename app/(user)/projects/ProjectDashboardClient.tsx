'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useGlobalState, useWallet } from '@/hooks';
import ProjectGrid from './ProjectGrid';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Search, FolderOpen } from 'lucide-react';
import axios from 'axios';

export default function ProjectDashboardClient() {
  const router = useRouter();
  const { projects, setProjects, loadProjectData, activeProject } = useGlobalState();
  const { connected, address } = useWallet();

  const [searchQuery, setSearchQuery] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingProjectId, setNavigatingProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    const fetchProjects = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects?walletAddress=${address}`
        );
        setProjects(res.data.projects || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch your projects');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [address, setProjects]);

  const filtered = (projects || []).filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProjectSelect = async (projectId: string) => {
    if (isNavigating) return;

    const selected = projects.find((p) => p.projectId === projectId);
    if (!selected || !address) return;

    setIsNavigating(true);
    setNavigatingProjectId(projectId);

    try {
      await loadProjectData(selected, address);
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to open project');
    } finally {
      setIsNavigating(false);
      setNavigatingProjectId(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="relative w-full sm:w-96 mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {!connected ? (
        <EmptyState
          icon={<FolderOpen size={48} className="mx-auto text-muted-foreground/30 mb-6" />}
          title="Connect Wallet to View Your Projects"
          description="Connect your wallet to view and manage your projects."
        />
      ) : loading ? (
        <SkeletonGrid count={6} />
      ) : filtered.length > 0 ? (
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <ProjectGrid
            projects={filtered}
            isNavigating={isNavigating}
            navigatingProjectId={navigatingProjectId}
            // @ts-expect-error activeProject may be undefined
            activeProjectId={activeProject?.projectId}
            onSelect={handleProjectSelect}
          />
        </Suspense>
      ) : (
        <EmptyState
          icon={<FolderOpen size={48} className="mx-auto text-muted-foreground/30 mb-4" />}
          title="No Projects Found"
          description={
            searchQuery
              ? 'No projects match your search criteria.'
              : "You haven't created any projects yet."
          }
        />
      )}
    </div>
  );
}

function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg bg-card/50">
          <Skeleton className="h-5 w-5 mb-2" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-16">
      {icon}
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
