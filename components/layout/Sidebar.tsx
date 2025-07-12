'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGlobalState, useWallet } from '@/hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  PlusIcon,
  Folder,
  FolderOpen,
  Code2,
  Palette,
  // Globe,
  FileText,
} from 'lucide-react';

const sidebarButtonClass =
  'w-full flex items-center px-3 py-2 text-sm tracking-wide font-medium transition-colors rounded-md';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { projects, activeProject, openModal } = useGlobalState();
  const { connected, address } = useWallet();

  const navigationTabs = [
    {
      label: 'Projects',
      path: '/projects',
      icon: <Folder size={18} />,
    },
    {
      label: 'Templates',
      path: '/templates',
      icon: <FileText size={18} />,
    },
    // {
    //   label: 'ARNS',
    //   path: '/arns',
    //   icon: <Globe size={18} />,
    // },
  ];

  const handleCreateProject = () => {
    openModal('createProject');
  };

  const handleProjectClick = async (projectId: string) => {
    const selectedProject = projects.find((p) => p.projectId === projectId);
    if (selectedProject && address) {
      // Only navigate if not already on this project
      if (activeProject?.projectId !== projectId) {
        router.push(`/projects/${projectId}`);
      }
    }
  };

  const getFrameworkIcon = (framework: string, isActive: boolean) => {
    switch (framework?.toLowerCase()) {
      case 'react':
        return (
          <Code2
            size={14}
            className={`${isActive ? 'text-gray-100' : 'text-gray-500/50 group-hover:text-gray-100'}`}
          />
        );
      case 'html':
        return (
          <Palette
            size={14}
            className={`${isActive ? 'text-orange-500' : 'text-orange-500/50 group-hover:text-orange-500'}`}
          />
        );
      default:
        return (
          <Code2
            size={14}
            className={`${isActive ? 'text-gray-500' : 'text-gray-500/50 group-hover:text-gray-500'}`}
          />
        );
    }
  };

  const sortedProjects = React.useMemo(() => {
    if (!projects) return [];
    return [...projects].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [projects]);

  return (
    <div className="w-64 bg-background flex flex-col h-full overflow-hidden border-r-[1px]">
      <div className="border-b border-border">
        <nav className="p-2 space-y-1">
          <Button
            onClick={handleCreateProject}
            className="w-full rounded-md mb-2"
            disabled={!connected}
          >
            <PlusIcon size={16} className="mr-2" />
            New Project
          </Button>

          {navigationTabs.map((tab) => {
            const isActive = pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => router.push(tab.path)}
                className={cn(
                  sidebarButtonClass,
                  'gap-3',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-primary/20'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-5 py-2 ">
          <div className="text-sm font-medium text-muted-foreground tracking-wider">
            Recent Projects
          </div>
        </div>

        {/* Scrollable Projects List with Fade */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 overflow-y-auto p-2 pb-8">
            {!connected ? (
              <div className="px-3 py-8 text-center">
              </div>
            ) : sortedProjects.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <FolderOpen
                  size={32}
                  className="mx-auto text-muted-foreground/30 mb-2"
                />
                <p className="text-xs text-muted-foreground">No projects yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedProjects.map((project) => {
                  const isActive =
                    activeProject?.projectId === project.projectId;
                  // const isCurrentPath = pathname === `/projects/${project.projectId}`;

                  return (
                    <button
                      key={project.projectId}
                      onClick={() => handleProjectClick(project.projectId)}
                      className={cn(
                        sidebarButtonClass,
                        'gap-3 text-left group',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-primary/20'
                      )}
                    >
                      <div className="shrink-0">
                        {getFrameworkIcon(project.framework, isActive)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">
                          {project.title}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Fade Effect */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
