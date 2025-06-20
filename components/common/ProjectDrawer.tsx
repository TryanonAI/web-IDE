import { FolderOpen, Folder, PlusIcon } from 'lucide-react';
import { useGlobalState } from '@/hooks';
import { useWallet } from '@/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { DrawerType } from '@/hooks/useGlobalState';
import { useEffect, useRef } from 'react';

export function ProjectDrawer() {
  const router = useRouter();
  const {
    projects,
    activeProject,
    activeDrawer,
    closeDrawer,
    openModal,
    setIsLoading,
    loadProjectData
  } = useGlobalState();
  const { address } = useWallet();

  const activeProjectRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active project when drawer opens
  useEffect(() => {
    if (activeDrawer === DrawerType.CREATE_PROJECT && activeProject) {
      // Longer delay to ensure the drawer is fully opened and rendered
      const timer = setTimeout(() => {
        if (activeProjectRef.current && scrollContainerRef.current) {
          // Get the scroll container and active project positions
          const container = scrollContainerRef.current;
          const activeElement = activeProjectRef.current;
          
          // Calculate the scroll position to center the active project
          const containerRect = container.getBoundingClientRect();
          const elementRect = activeElement.getBoundingClientRect();
          
          const scrollTop = container.scrollTop + (elementRect.top - containerRect.top) - (containerRect.height / 2) + (elementRect.height / 2);
          
          // Smooth scroll to the calculated position
          container.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
        }
      }, 400); // Increased delay for better reliability
      
      return () => clearTimeout(timer);
    }
  }, [activeDrawer, activeProject]);

  const handleProjectSelect = async (projectId: string) => {
    setIsLoading(true);

    const selectedProject = projects.find((p) => p.projectId === projectId);
    if (selectedProject && address) {
      closeDrawer();
      // Update the URL with the selected project ID
      router.push(`/dashboard/${projectId}`);
      await loadProjectData(selectedProject, address);
    } else {
      console.error('Project not found with ID:', projectId);
    }
    setIsLoading(false);
  };

  const handleOpenCreateProjectDialog = () => {
    closeDrawer();
    openModal('createProject');
  };

  return (
    <Drawer
      direction="left"
      open={activeDrawer === DrawerType.CREATE_PROJECT}
      onOpenChange={() => closeDrawer()}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <FolderOpen size={18} className="text-primary" />
            Projects
          </DrawerTitle>
        </DrawerHeader>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
          {Array.isArray(projects) && projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.projectId}
                  ref={activeProject?.projectId === project.projectId ? activeProjectRef : null}
                  onClick={() => handleProjectSelect(project.projectId)}
                  className={`p-3 border rounded-md cursor-pointer transition-all hover:shadow-sm ${
                    activeProject?.projectId === project.projectId
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-card hover:bg-card/80 border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Folder
                        size={16}
                        className={
                          activeProject?.projectId === project.projectId
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {project.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <div>
                          {'Created: '}
                          {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                        <Badge className="text-[10px] bg-primary/80 tracking-wider">
                          {project.framework === 'React'
                            ? 'Code Mode'
                            : 'Vibe Mode'}
                        </Badge>
                      </div>
                    </div>
                    {activeProject?.projectId === project.projectId && (
                      <div className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded">
                        Active
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <FolderOpen size={48} className="text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-2">No projects found</p>
              <Button
                onClick={handleOpenCreateProjectDialog}
                variant="outline"
                className="mt-2"
              >
                <PlusIcon size={16} className="mr-1" />
                Create New Project
              </Button>
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button onClick={handleOpenCreateProjectDialog} className="w-full">
            <PlusIcon size={16} className="mr-1" />
            New Project
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
