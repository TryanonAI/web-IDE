import React, { useState, useEffect } from "react";
import {
  Check,
  ChevronsUpDown,
  GitCommit,
  Loader2,
  MessageSquare,
  X,
} from "lucide-react";
import { useNavigate, Outlet } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { frameworks } from "@/config/frameworks";
import { cn, validateProjectName } from "@/lib/utils";
import GithubDrawer from "../common/GithubDrawer";
import { ProjectInfoDrawer } from "../common/ProjectInfoDrawer";
import TitleBar from "@/components/dashboard/TitleBar";
import Sidebar from "./Sidebar";
import { useGlobalState, useWallet } from "@/hooks";
import { Framework } from "@/types";

interface StatusStep {
  id: string;
  title: string;
  description: string;
  status: "loading" | "success" | "error" | "pending";
  error?: string;
}

const DashLayout: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [nameError, setNameError] = useState<string>("");
  const [mode, setMode] = useState<Framework>(Framework.React);
  const [commitMessage, setCommitMessage] = useState<string>("");
  const [statusSteps, setStatusSteps] = useState<StatusStep[]>([]);
  const [commitInProgress, setCommitInProgress] = useState<boolean>(false);
  const [isCommitDialogOpen, setIsCommitDialogOpen] = useState<boolean>(false);

  const {
    activeModal,
    projectName,
    openModal,
    closeModal,
    setProjectName,
    isCreating,
    setIsLoading,
    setFramework,
    createProject,
    framework,
    activeProject,
    commitToRepository,
    sidebarOpen,
  } = useGlobalState();
  const { connected } = useWallet();

  // Add effect to handle disconnection
  useEffect(() => {
    if (!connected) {
      navigate("/", { replace: true });
    }
  }, [connected, navigate]);

  const handleCreateProject = async (mode: Framework) => {
    if (!projectName.trim()) return;

    setIsLoading(true);
    setFramework(mode);
    setMode(mode);

    try {
      console.log("Creating project from modal:", projectName);
      const newProject = await createProject(projectName.trim(), mode);
      setProjectName("");

      closeModal();

      if (newProject) {
        navigate(`/projects/${newProject.projectId}`);
      }
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setProjectName(name);

    if (name && !validateProjectName(name)) {
      setNameError(
        "Project name can only contain letters, numbers, dots, hyphens, and underscores"
      );
    } else {
      setNameError("");
    }
  };

  const showCommitDialog = () => {
    setIsCommitDialogOpen(true);
  };

  const updateStepStatus = (
    stepId: string,
    status: "loading" | "success" | "error" | "pending",
    error?: string
  ) => {
    setStatusSteps((steps) =>
      steps.map((step) =>
        step.id === stepId ? { ...step, status, error } : step
      )
    );
  };

  const handleCommitToRepo = async () => {
    if (!activeProject || !commitMessage.trim()) return;

    setCommitInProgress(true);
    setIsCommitDialogOpen(false);

    setStatusSteps([
      {
        id: "commit",
        title: "Committing to Repository",
        description: `Committing changes: "${commitMessage}"`,
        status: "loading",
      },
    ]);

    try {
      await commitToRepository(
        activeProject,
        useWallet.getState().address as string,
        true,
        commitMessage
      );

      updateStepStatus("commit", "success");
      setCommitMessage("");
    } catch (error) {
      console.error("Error committing to repository:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      updateStepStatus("commit", "error", errorMessage);
    } finally {
      setCommitInProgress(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {showBanner && (
        <div className="relative bg-primary/5 border-b border-primary/10">
          <div className="max-w-screen-xl mx-auto py-2 px-3 sm:px-6 lg:px-8">
            <div className="pr-3 text-center text-sm font-medium text-primary/80">
              <span>✨ Now you can set your own ARNS Domains!</span>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-1/2 right-2 -translate-y-1/2 p-1 hover:bg-primary/10 rounded-md transition-colors"
            >
              <X size={16} className="text-primary/80" />
            </button>
          </div>
        </div>
      )}

      <div className="shrink-0 border-b border-border">
        <TitleBar />
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden bg-background pb-2">
        {connected && (
          <aside
            className={cn(
              "transition-all duration-300 ease-in-out h-full border-r border-border",
              sidebarOpen
                ? "w-64 translate-x-0"
                : "w-0 -translate-x-full border-r-0"
            )}
          >
            <Sidebar />
          </aside>
        )}
        <div
          id="main-container"
          className="flex-1 transition-all duration-300 ease-in-out overflow-auto"
        >
          {/* Remove the conditional rendering and just show Outlet since we redirect on disconnect */}
          <Outlet />
        </div>
      </div>

      <GithubDrawer
        statusSteps={statusSteps}
        setStatusSteps={setStatusSteps}
        commitInProgress={commitInProgress}
        showCommitDialog={showCommitDialog}
      />
      <ProjectInfoDrawer />

      <Dialog
        open={activeModal === "createProject"}
        onOpenChange={(open) => {
          if (!isCreating) {
            if (open) openModal("createProject");
            else closeModal();
          }
        }}
      >
        <DialogContent
          aria-description="Create New Project"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isCreating ? "Creating Project..." : "Create New Project"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await handleCreateProject(mode);
            }}
            className="space-y-4"
          >
            <div className="flex flex-col justify-center py-2">
              <div className="flex flex-col justify-center gap-2">
                <label htmlFor="projectName" className="text-sm font-medium">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={handleNameChange}
                  className="w-full p-3 rounded-md border border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="project-name"
                  required
                  disabled={isCreating}
                />
                {nameError && (
                  <p className="text-xs text-destructive mt-1">{nameError}</p>
                )}
              </div>
              <div className="flex flex-col justify-center gap-2 mt-4">
                <label className="text-sm font-medium">Project Mode</label>
                <Popover open={open && !isCreating} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                      disabled={isCreating}
                    >
                      {framework
                        ? frameworks.find((fmk) => fmk.value === framework)
                            ?.label
                        : "Select Mode..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          {frameworks.map((fmk) => (
                            <CommandItem
                              key={fmk.value}
                              onSelect={() => {
                                setMode(fmk.value);
                                setFramework(fmk.value);
                                setOpen(false);
                              }}
                              className="flex group items-center gap-2 px-4 py-2 cursor-pointer hover:text-white hover:bg-primary/80"
                            >
                              {fmk.icon}
                              <span className="flex-1 text-sm group-hover:text-black">
                                {fmk.label}
                              </span>
                              <Check
                                className={cn(
                                  "ml-auto",
                                  framework === fmk.value
                                    ? "opacity-100 text-primary"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Select the mode for your project.
                </p>
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => closeModal()}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex items-center gap-2"
                disabled={
                  !projectName.trim() || isCreating || !!nameError || !framework
                }
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCommitDialogOpen} onOpenChange={setIsCommitDialogOpen}>
        <DialogContent aria-description="Commit Changes" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <GitCommit size={18} />
              Commit Changes
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="space-y-2">
              <label
                htmlFor="commitMessage"
                className="text-sm font-medium leading-none flex items-center gap-2"
              >
                <MessageSquare size={14} />
                Commit Message
              </label>
              <Textarea
                id="commitMessage"
                value={commitMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCommitMessage(e.target.value)
                }
                className="w-full min-h-[100px] p-3 rounded-md border border-border bg-background text-foreground resize-none"
                placeholder="Describe your changes..."
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Write a meaningful message describing the changes you&apos;re
                committing.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCommitDialogOpen(false)}
              disabled={commitInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCommitToRepo}
              className="gap-1.5"
              disabled={!commitMessage.trim() || commitInProgress}
            >
              <GitCommit size={16} />
              Commit & Push
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashLayout;
