import { type Project } from "@/types";

import { cn } from "@/lib/utils";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const OpenWithIDE = ({
  disabled = false,
  activeProject,
  className,
}: {
  disabled: boolean;
  activeProject: Project;
  className?: string;
}) => {
  const handleOpenWithIDE = async (ide: "cursor" | "vscode") => {
    const url = `${ide}://aykansal.tryanon/openProject?projectId=${activeProject?.projectId}`;
    window.open(url);
  };

  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            aria-disabled={disabled}
            title="Choose IDE"
            aria-label="Choose IDE"
            className={cn(
              "h-5 px-1 rounded-r flex gap-2 items-center text-xs font-medium transition-colors text-muted-foreground hover:text-foreground cursor-pointer",
              disabled && "opacity-70 cursor-not-allowed"
            )}
          >
            <AnimatedGradientText className="hidden md:block">
              Open in IDE
            </AnimatedGradientText>
            <ChevronDown size={12} />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem
            onClick={() => {
              if (!disabled) handleOpenWithIDE("cursor");
            }}
            className="flex items-center gap-2 text-[13px]"
          >
            <img src="/cursor_logo.webp" height={12} width={12} alt="logo" />
            Cursor
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (!disabled) handleOpenWithIDE("vscode");
            }}
            className="flex items-center gap-2 text-[13px]"
          >
            <img
              src={
                "https://code.visualstudio.com/assets/images/code-stable.png"
              }
              height={12}
              width={12}
              alt="logo"
            />
            VS Code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default OpenWithIDE;
