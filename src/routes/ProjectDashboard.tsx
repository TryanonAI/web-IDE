import Chatview from "@/components/dashboard/chatview/Chatview";
import Codeview from "@/components/dashboard/codeview/Codeview";
import ProjectLoadingSkeleton from "@/components/dashboard/ProjectLoadingSkeleton";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchProjectsForWallet } from "@/lib/api";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useGlobalState, useWallet } from "@/hooks";
import { useParams } from "react-router";

const ProjectDashboard = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const { address } = useWallet();
  const isLoading = useGlobalState((state) => state.isLoading);
  const projects = useGlobalState((state) => state.projects);
  const loadProjectData = useGlobalState((state) => state.loadProjectData);
  const setIsLoading = useGlobalState((state) => state.setIsLoading);
  const setProjects = useGlobalState((state) => state.setProjects);
  const activeProject = useGlobalState((state) => state.activeProject);
  const { openModal } = useGlobalState();

  const [projectNotFound, setProjectNotFound] = useState(false);
  const [hasCheckedProject, setHasCheckedProject] = useState(false);
  const [isProjectLoading, setIsProjectLoading] = useState(false);

  const chatRef = useRef<{ sendMessage: (message: string) => void } | null>(
    null
  );

  const handleSendErrorToChat = (errorMessage: string) => {
    if (chatRef.current) {
      chatRef.current.sendMessage(errorMessage);
    } else {
      console.warn("Chat is not available to receive error message");
      toast.error("Unable to send error to chat. Please try again.");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!address || !projectId) {
        return;
      }

      setIsLoading(true);
      setIsProjectLoading(true);
      setProjectNotFound(false);
      setHasCheckedProject(false);

      let currentProjects = projects;

      if (currentProjects.length === 0) {
        try {
          const projects = await fetchProjectsForWallet(address);
          currentProjects = projects;
          setProjects(currentProjects);
        } catch (error) {
          console.error("Error fetching user projects:", error);
          toast.error("Failed to fetch your projects");
          setProjects([]);
          setIsLoading(false);
          setIsProjectLoading(false);
          setHasCheckedProject(true);
          return;
        }
      }

      const project = currentProjects.find((p) => p.projectId === projectId);
      if (project) {
        await loadProjectData(project, address);
        setProjectNotFound(false);
      } else {
        setProjectNotFound(true);
      }

      setHasCheckedProject(true);
      setIsLoading(false);
      setIsProjectLoading(false);
    };

    loadData();
  }, [projectId, address, loadProjectData, setIsLoading, setProjects]);

  if (projectNotFound) {
    return (
      <div className="h-full flex flex-1 items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="flex justify-center">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Project Not Found
            </h1>
            <p className="text-muted-foreground">
              The project don't exist or you don&apos;t have access to it.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => openModal("createProject")}
              className="flex items-center gap-2"
            >
              Create Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (
    isLoading ||
    !hasCheckedProject ||
    isProjectLoading ||
    !activeProject ||
    activeProject.projectId !== projectId
  ) {
    return <ProjectLoadingSkeleton />;
  }

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={43} minSize={43}>
        <Chatview ref={chatRef} />
      </ResizablePanel>
      {/* <ResizableHandle /> */}
      <ResizablePanel defaultSize={57} minSize={57}>
        <Codeview onSendErrorToChat={handleSendErrorToChat} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ProjectDashboard;