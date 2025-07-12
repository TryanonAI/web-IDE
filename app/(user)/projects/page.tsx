'use client';

import dynamic from 'next/dynamic';

const ProjectDashboardClient = dynamic(() => import('./ProjectDashboardClient'), {
  ssr: false,
});

export default function ProjectsPage() {
  return <ProjectDashboardClient />;
}
