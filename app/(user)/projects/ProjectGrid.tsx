// app/(user)/projects/ProjectGrid.tsx
'use client';
import { motion } from 'framer-motion';
import { Folder, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { frameworks } from '../layout';
import { Project } from '@/types';

export default function ProjectGrid({
  projects,
  isNavigating,
  navigatingProjectId,
  activeProjectId,
  onSelect,
}: {
  projects: Project[];
  isNavigating: boolean;
  navigatingProjectId: string | null;
  activeProjectId: string;
  onSelect: (projectId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const navigating = navigatingProjectId === project.projectId;
        const disabled = isNavigating;
        const selected = activeProjectId === project.projectId;

        return (
          <motion.div
            key={project.projectId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => !disabled && onSelect(project.projectId)}
            className={cn(
              'p-4 border rounded-lg transition-all cursor-pointer',
              disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg',
              selected
                ? 'bg-primary/5 border-primary/20'
                : 'bg-card/50 border-border',
              navigating && 'ring-2 ring-primary/20'
            )}
          >
            <div className="flex items-start gap-3">
              <Folder
                size={20}
                className={selected ? 'text-primary' : 'text-muted-foreground'}
              />
              <div className="flex-1">
                <div className='flex justify-between items-center' >
                  <h3 className="font-medium truncate">{project.title}</h3>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {
                      frameworks.find((f) => f.value === project.framework)
                        ?.label
                    }
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </div>

                {navigating && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                    <Loader2 size={12} className="animate-spin" />
                    Opening...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
