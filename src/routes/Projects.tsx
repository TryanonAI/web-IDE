import React, { useEffect, useState, Suspense } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search, FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalState, useWallet } from "@/hooks";
import ProjectGrid from "@/components/projects/ProjectGrid";
import { fetchProjectsForWallet } from "@/lib/api";

export default function Projects() {
  const navigate = useNavigate();
  const { projects, setProjects, loadProjectData, activeProject } =
    useGlobalState();
  const { address } = useWallet();

  const [searchQuery, setSearchQuery] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingProjectId, setNavigatingProjectId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    const fetchProjects = async () => {
      try {
        const projects = await fetchProjectsForWallet(address);
        setProjects(projects);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch your projects");
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
      navigate(`/projects/${projectId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to open project");
    } finally {
      setIsNavigating(false);
      setNavigatingProjectId(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="relative w-full sm:w-96 mb-8">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2"
          size={18}
        />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : filtered.length > 0 ? (
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <ProjectGrid
            projects={filtered}
            isNavigating={isNavigating}
            navigatingProjectId={navigatingProjectId}
            activeProjectId={activeProject?.projectId}
            onSelect={handleProjectSelect}
          />
        </Suspense>
      ) : (
        <EmptyState
          icon={
            <FolderOpen
              size={48}
              className="mx-auto text-muted-foreground/30 mb-4"
            />
          }
          title="No Projects Found"
          description={
            searchQuery
              ? "No projects match your search criteria."
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
  description?: string;
}) {
  return (
    <div className="text-center py-16">
      {icon}
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-3">{description}</p>
    </div>
  );
}
