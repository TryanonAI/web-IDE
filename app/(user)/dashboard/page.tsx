'use client';

import { useEffect, useState } from 'react';
import { useGlobalState, useWallet } from '@/hooks';
import { motion } from 'framer-motion';
import { Folder, FolderOpen, PlusIcon, Search, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { frameworks } from '../layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ARNS from '@/components/pages/dashboard/ARNS';

const TAB_STORAGE_KEY = 'dashboard_active_tab';

export default function Dashboard() {
  const router = useRouter();
  const {
    projects,
    activeProject,
    loadProjectData,
    openModal,
    setProjects,
    setActiveProject,
  } = useGlobalState();
  const { connected, address } = useWallet();
  const [showAllProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingProjectId, setNavigatingProjectId] = useState<string | null>(
    null
  );
  // Persist activeTab in localStorage
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(TAB_STORAGE_KEY);
      return stored || 'projects';
    }
    return 'projects';
  });

  // Keep activeTab in sync with localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TAB_STORAGE_KEY, activeTab);
      console.log('[Dashboard] Persisted activeTab:', activeTab);
    }
  }, [activeTab]);

  // Clear active project when component mounts
  useEffect(() => {
    setActiveProject(null);
  }, [setActiveProject]);

  // Reset navigation state when component unmounts
  useEffect(() => {
    return () => {
      setIsNavigating(false);
      setNavigatingProjectId(null);
    };
  }, []);

  // Fetch user's projects
  useEffect(() => {
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

    fetchUserProjects();
  }, [connected, address, setProjects]);

  // Filter projects based on search query
  const filteredProjects = projects?.filter((project) => {
    return project.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleProjectSelect = async (projectId: string) => {
    // Prevent multiple clicks while navigating
    if (isNavigating) {
      return;
    }

    if (!Array.isArray(projects)) {
      console.error('Projects is not an array');
      return;
    }

    const selectedProject = projects.find((p) => p.projectId === projectId);
    if (selectedProject && address) {
      try {
        setIsNavigating(true);
        setNavigatingProjectId(projectId);

        // First load the project data
        await loadProjectData(selectedProject, address);
        // Then navigate to the dashboard with the project ID
        router.push(`/dashboard/${projectId}`);
      } catch (error) {
        console.error('Error navigating to project:', error);
        toast.error('Failed to open project');
        setIsNavigating(false);
        setNavigatingProjectId(null);
      }
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

  // Handler to persist tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TAB_STORAGE_KEY, tab);
      console.log('[Dashboard] Tab changed and persisted:', tab);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="h-full p-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Tabs
              defaultValue="projects"
              value={activeTab}
              onValueChange={handleTabChange}
            >
              <TabsList>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="arns">ARNS</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="relative w-full sm:w-96">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleOpenCreateProjectDialog} className="shrink-0">
            <PlusIcon size={16} className="mr-2" />
            New Project
          </Button>
        </div>

        {/* Content Sections */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsContent value="projects">
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
                  Connect your wallet to view and manage your projects, or
                  switch to view all projects.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredProjects.map((project) => {
                  const isProjectNavigating =
                    navigatingProjectId === project.projectId;
                  const isDisabled = isNavigating;

                  return (
                    <motion.div
                      key={project.projectId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      onClick={() =>
                        !isDisabled && handleProjectSelect(project.projectId)
                      }
                      className={cn(
                        'p-4 sm:p-5 lg:p-6 border rounded-lg transition-all',
                        isDisabled
                          ? 'cursor-not-allowed opacity-60'
                          : 'cursor-pointer hover:shadow-lg',
                        activeProject?.projectId === project.projectId
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-card/50 hover:bg-card border-border',
                        isProjectNavigating && 'ring-2 ring-primary/20'
                      )}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="mt-0.5 shrink-0">
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
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium truncate text-base sm:text-lg">
                              {project.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              {isProjectNavigating && (
                                <div className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-md whitespace-nowrap">
                                  <Loader2 size={12} className="animate-spin" />
                                  Opening...
                                </div>
                              )}
                              {activeProject?.projectId === project.projectId &&
                                !isProjectNavigating && (
                                  <div className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-md whitespace-nowrap">
                                    Active
                                  </div>
                                )}
                            </div>
                          </div>
                          <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                            <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                              Created:{' '}
                              {new Date(project.createdAt).toLocaleDateString()}
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-primary/5 text-primary hover:bg-primary/10 text-xs whitespace-nowrap"
                            >
                              {
                                frameworks.find(
                                  (f) => f.value === project.framework
                                )?.label
                              }
                            </Badge>
                          </div>
                          <div className="mt-2 sm:mt-3 w-full">
                            <div className="max-w-full overflow-hidden">
                              <Badge
                                variant="outline"
                                className="text-xs truncate max-w-full block"
                                title={project.creator?.walletAddress}
                              >
                                {project.creator?.walletAddress}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderOpen
                  size={48}
                  className="mx-auto text-muted-foreground/30 mb-4"
                />
                <h2 className="text-xl font-semibold mb-2">
                  No Projects Found
                </h2>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'No projects match your search criteria.'
                    : showAllProjects
                      ? 'No projects available on the platform yet.'
                      : "You haven't created any projects yet."}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates">
            <div className="text-center py-16">
              <FolderOpen
                size={48}
                className="mx-auto text-muted-foreground/30 mb-6"
              />
              <h2 className="text-xl font-semibold mb-3">
                Templates Coming Soon
              </h2>
              <p className="text-muted-foreground">
                We&apos;re working on bringing you a collection of cool designs
                to help you get started.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="arns">
            <ARNS />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
