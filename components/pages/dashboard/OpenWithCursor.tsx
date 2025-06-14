import { Project } from '@/types';

import { cn } from '@/lib/utils';

import Image from 'next/image';
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text';

// Open Active-Project with CursorIDE
const OpenWithCursor = ({
  disabled = false,
  activeProject,
}: {
  disabled: boolean;
  activeProject: Project;
}) => {
  const handleOpenWithCursor = async () => {
    window.open(
      `cursor://aykansal.tryanon/openProject?projectId=${activeProject?.projectId}`
    );
  };

  return (
    <button
      disabled={disabled}
      title="Open with Cursor IDE"
      aria-label="Open with Cursor IDE"
      onClick={handleOpenWithCursor}
      className={cn(
        'h-5 px-2 rounded flex items-center gap-1.5 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground',
        disabled && 'opacity-70'
      )}
    >
      <Image
        src={
          'https://www.cursor.com/_next/static/media/placeholder-logo.737626f1.webp'
        }
        height={12}
        width={12}
        alt="cursor-brand-logo"
      />
      <AnimatedGradientText className='hidden md:block' >Open with Cursor</AnimatedGradientText>
    </button>
  );
};

export default OpenWithCursor;
