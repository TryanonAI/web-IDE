import { Project } from '@/types';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text';
import CursorLogo from '@/public/cursor_logo.webp';

// Open Active-Project with CursorIDE
const OpenWithCursor = ({
  disabled = false,
  activeProject,
  className,
}: {
  disabled: boolean;
  activeProject: Project;
  className?: string;
}) => {
  const handleOpenWithCursor = async () => {
    window.open(
      `cursor://aykansal.tryanon/openProject?projectId=${activeProject?.projectId}`
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      title="Open with Cursor IDE"
      aria-label="Open with Cursor IDE"
      onClick={!disabled ? handleOpenWithCursor : undefined}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleOpenWithCursor();
        }
      }}
      className={cn(
        'h-5 px-2 rounded flex items-center gap-1.5 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground cursor-pointer',
        disabled && 'opacity-70 cursor-not-allowed',
        className
      )}
    >
      <Image
        src={CursorLogo}
        height={12}
        width={12}
        alt="cursor-brand-logo"
      />
      <AnimatedGradientText className='hidden md:block'>Open with Cursor</AnimatedGradientText>
    </div>
  );
};

export default OpenWithCursor;
