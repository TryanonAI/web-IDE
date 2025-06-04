import { FolderOpen, Folder, PlusIcon } from 'lucide-react';
import { useGlobalState } from '@/hooks/global-state';
import { useWallet } from '@/hooks/use-wallet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';

export function ProjectDrawer() {
  const {
    projects,
    activeProject,
    activeDrawer,
    closeDrawer,
    loadProjectData,
    openModal,
  } = useGlobalState();
  const { address } = useWallet();

  const handleProjectSelect = async (projectId: string) => {
    if (!Array.isArray(projects)) {
      console.error('Projects is not an array');
      return;
    }
    const selectedProject = projects.find((p) => p.projectId === projectId);
    if (selectedProject && address) {
      await loadProjectData(selectedProject, address);
      closeDrawer();
    } else {
      console.error('Project not found with ID:', projectId);
    }
  };

  const handleOpenCreateProjectDialog = () => {
    closeDrawer();
    openModal('createProject');
  };

  // const handleProjectSelect = async (projectId: string) => {
  //   if (!Array.isArray(projects)) {
  //     console.error('Projects is not an array');
  //     return;
  //   }
  //   const selectedProject = projects.find((p) => p.projectId === projectId);
  //   if (selectedProject) {
  //     setLastCheckedProject(null);
  //     setCommits([]);
  //     setCommitError(null);

  //     if (
  //       githubStatus === GITHUB_STATUS.REPO_EXISTS ||
  //       githubStatus === GITHUB_STATUS.ERROR
  //     ) {
  //       console.log('Resetting Github state for new project check');
  //       resetGithubState();
  //     }
  //     console.log(selectedProject);
  //     await loadProjectData(
  //       selectedProject,
  //       useWallet.getState().address as string
  //     );

  //     setIsProjectDrawerOpen(false);
  //   } else {
  //     console.error('Project not found with ID:', projectId);
  //   }
  // };

  return (
    <Drawer
      direction="right"
      open={activeDrawer === 'project'}
      onOpenChange={() => closeDrawer()}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <FolderOpen size={18} className="text-primary" />
            Projects
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {Array.isArray(projects) && projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.projectId}
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
