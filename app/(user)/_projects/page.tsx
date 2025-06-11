'use client';

import { useEffect, useState } from 'react';
import { useGlobalState, useWallet } from '@/hooks';
import { motion } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  PlusIcon,
  Search,
  User,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectsPage() {
  const { projects, activeProject, loadProjectData, openModal, setProjects } =
    useGlobalState();
  const { connected, address } = useWallet();
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle toggle change
  const handleToggleChange = (checked: boolean) => {
    if (!checked) {
      // If switching to "My Projects" and not connected, prevent the toggle
      if (!connected) {
        toast.error('Please connect your wallet to view your projects');
        return;
      }
    }
    setShowAllProjects(checked);
  };

  // Fetch all projects
  const fetchAllProjects = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects?allProjects=true`
      );
      if (response.data && response.data.projects) {
        console.log(response.data.projects);
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Error fetching all projects:', error);
      toast.error('Failed to fetch projects');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's projects
  const fetchUserProjects = async () => {
    if (!address) {
      setProjects([]);
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects?walletAddress=${address}`
      );
      if (response.data && response.data.projects) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Error fetching user projects:', error);
      toast.error('Failed to fetch your projects');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch projects based on toggle state
  useEffect(() => {
    const fetchProjects = async () => {
      if (showAllProjects) {
        await fetchAllProjects();
      } else if (connected && address) {
        await fetchUserProjects();
      } else {
        setProjects([]);
      }
    };

    fetchProjects();
  }, [showAllProjects, connected, address]);

  // Filter projects based on search query
  const filteredProjects = projects?.filter((project) => {
    return project.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleProjectSelect = async (projectId: string) => {
    if (!Array.isArray(projects)) {
      console.error('Projects is not an array');
      return;
    }
    const selectedProject = projects.find((p) => p.projectId === projectId);
    if (selectedProject && address) {
      await loadProjectData(selectedProject, address);
    } else {
      console.error('Project not found with ID:', projectId);
    }
  };

  const handleOpenCreateProjectDialog = () => {
    if (!connected) {
      toast.error('Please connect your wallet to create a project');
      return;
    }
    openModal('createProject');
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="h-full p-8">
        {/* Header Section */}
        <div className="flex flex-col gap-8 mb-10">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <Button onClick={handleOpenCreateProjectDialog}>
              <PlusIcon size={16} className="mr-2" />
              New Project
            </Button>
          </div>

          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Label htmlFor="project-view" className="flex items-center gap-2">
                <User size={16} />
                My Projects
              </Label>
              <Switch
                id="project-view"
                checked={showAllProjects}
                onCheckedChange={handleToggleChange}
              />
              <Label htmlFor="project-view" className="flex items-center gap-2">
                <Users size={16} />
                All Projects
              </Label>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {!connected && !showAllProjects ? (
          <div className="text-center py-16">
            <FolderOpen
              size={48}
              className="mx-auto text-muted-foreground/30 mb-6"
            />
            <h2 className="text-xl font-semibold mb-3">
              Connect Wallet to View Your Projects
            </h2>
            <p className="text-muted-foreground">
              Connect your wallet to view and manage your projects, or switch to
              view all projects.
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="p-6 border rounded-lg bg-card/50">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-5 w-5 mt-0.5 bg-gray-200/50" />
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-6 w-3/4 bg-gray-200/50" />
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-1/2 bg-gray-200/50" />
                      <Skeleton className="h-5 w-24 bg-gray-200/50" />
                    </div>
                    <Skeleton className="h-5 w-[200px] bg-gray-200/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects && filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.projectId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => handleProjectSelect(project.projectId)}
                className={cn(
                  'p-6 border rounded-lg cursor-pointer transition-all hover:shadow-lg',
                  activeProject?.projectId === project.projectId
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-card/50 hover:bg-card border-border'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    <Folder
                      size={20}
                      className={
                        activeProject?.projectId === project.projectId
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-lg">{project.title}</div>
                    <div className="text-sm text-muted-foreground mt-3 flex items-center gap-3">
                      <div>
                        Created:{' '}
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-primary/5 text-primary hover:bg-primary/10"
                      >
                        {project.framework === 'React'
                          ? 'Code Mode'
                          : 'Vibe Mode'}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <Badge variant="outline" className="text-xs">
                        {project.creator?.walletAddress}
                      </Badge>
                    </div>
                  </div>
                  {activeProject?.projectId === project.projectId && (
                    <div className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-md">
                      Active
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderOpen
              size={48}
              className="mx-auto text-muted-foreground/30 mb-4"
            />
            <h2 className="text-xl font-semibold mb-2">No Projects Found</h2>
            <p className="text-muted-foreground">
              {searchQuery
                ? 'No projects match your search criteria.'
                : showAllProjects
                  ? 'No projects available on the platform yet.'
                  : "You haven't created any projects yet."}
            </p>
            {connected && !showAllProjects && (
              <Button
                onClick={handleOpenCreateProjectDialog}
                variant="outline"
                className="mt-4"
              >
                <PlusIcon size={16} className="mr-2" />
                Create New Project
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
