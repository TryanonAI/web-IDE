import LLMRenderer from "@/components/dashboard/chatview/LLMRenderer";
import { API_CONFIG } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Framework } from "@/types";
import { handleRunLua } from "@/lib/arkit";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useGlobalState, useWallet } from "@/hooks";
import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Loader2Icon,
  RefreshCw,
  User,
  Maximize2,
  Minimize2,
  Zap,
  Layout,
} from "lucide-react";
import {
  type ChatMessage,
  Role,
  type Project,
  // type CodebaseType,
} from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { generateSrcDocFromCodebase } from "@/lib/utils";

const MessageRenderer = ({ message }: { message: ChatMessage }) => {
  // const [isExpanded, setIsExpanded] = useState(false);
  // const MAX_LENGTH = 500; // Maximum characters before truncation
  // const shouldTruncate = message.content.length > MAX_LENGTH;

  const displayContent =
    // shouldTruncate && !isExpanded
    //   ? message.content.slice(0, MAX_LENGTH) + '...':
    message.content;

  if (message.role === "model") {
    if (message.isLoading) {
      return (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Loader2Icon className="w-4 h-4 animate-spin" />
          <span>Generating...</span>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div>
          <LLMRenderer llmResponse={displayContent} isUserMessage={false} />
        </div>
        {/* {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-accent/50"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={12} />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown size={12} />
                <span>View complete</span>
              </>
            )}
          </button>
        )} */}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <LLMRenderer
        llmResponse={displayContent}
        isUserMessage={message.role === "user"}
      />
      {/* {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-accent/50"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={12} />
              <span>Show less</span>
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              <span>
                View complete ({message.content.length - MAX_LENGTH} more
                characters)
              </span>
            </>
          )}
        </button>
      )} */}
    </div>
  );
};

export interface ChatviewRef {
  sendMessage: (message: string) => void;
}

const Chatview = forwardRef<ChatviewRef>((_props, ref) => {
  const user = useWallet((state) => state.user);
  const setCodebase = useGlobalState((state) => state.setCodebase);
  const {
    chatMessages,
    activeProject,
    setDependencies,
    isCodeGenerating,
    setIsCodeGenerating,
    setSrcDocCode,
  } = useGlobalState();

  const [userInput, setUserInput] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  const [mode, setMode] = useState<"UI" | "All">("UI");
  const [isInputMaximized, setIsInputMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleModeChange = (newMode: "UI" | "All") => {
    setMode(newMode);
  };

  useImperativeHandle(ref, () => ({
    sendMessage: (message: string) => {
      handleSubmitWithMessage(message);
    },
  }));

  const handleSubmitWithMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    await submitMessage(messageText, false);
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }

    const messageToSend = failedMessage || userInput;
    if (!messageToSend.trim()) return;

    await submitMessage(messageToSend, !!failedMessage);
  };

  const submitMessage = async (
    messageToSend: string,
    currentlyRetrying: boolean
  ) => {
    if (currentlyRetrying) {
      setIsRetrying(true);
    }

    setIsCodeGenerating(true);

    if (!currentlyRetrying) {
      const userMessageId = Date.now();
      const userMessage: ChatMessage = {
        id: userMessageId,
        content: messageToSend,
        role: Role.user,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageId: userMessageId.toString(),
        projectId: activeProject?.projectId as string,
        project: activeProject as Project,
      };
      setMessages((prev) =>
        prev?.length > 0 ? [...prev, userMessage] : [userMessage]
      );
    }

    if (!currentlyRetrying) {
      setUserInput("");
    }
    setFailedMessage(null);

    const tempSystemMessageId = Math.random();
    const systemMessagePlaceholder: ChatMessage = {
      id: tempSystemMessageId,
      content: "",
      role: Role.model,
      isLoading: true,
      isStreaming: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageId: tempSystemMessageId.toString(),
      projectId: activeProject?.projectId as string,
      project: activeProject as Project,
    };
    setMessages((prev) => [...prev, systemMessagePlaceholder]);

    setTimeout(scrollToBottom, 2000);

    try {
      const requestBody = {
        framework: activeProject?.framework,
        prompt: {
          role: "user",
          content: messageToSend,
        },
        projectId: activeProject?.projectId as string,
        mode: activeProject?.framework === Framework.Html ? mode : undefined,
      };

      const handleStreamEvents = (eventSource: EventSource) => {
        let accumulatedText = "";
        let lastProcessedLength = 0;

        eventSource.onmessage = (ev) => {
          try {
            const { text } = JSON.parse(ev.data);
            const newContent = text.slice(lastProcessedLength);
            accumulatedText += text;
            lastProcessedLength = text.length;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempSystemMessageId
                  ? {
                      ...msg,
                      content: accumulatedText,
                      isLoading: false,
                      isStreaming: true,
                      streamedContent: newContent,
                    }
                  : msg
              )
            );
            scrollToBottom();
          } catch (error) {
            console.error("Error processing stream chunk:", error);
          }
        };

        eventSource.addEventListener("error", (error) => {
          console.error("❌ Stream error occurred:", error);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempSystemMessageId
                ? {
                    ...msg,
                    content:
                      "❌ An error occurred while processing your request. Please try again.",
                    isLoading: false,
                    isStreaming: false,
                    isError: true,
                  }
                : msg
            )
          );

          eventSource.close();

          setIsCodeGenerating(false);

          toast.error("Request failed", {
            duration: 5000,
            description:
              "An error occurred while processing your request. Please try again.",
          });
          scrollToBottom();
        });

        eventSource.addEventListener("end", () => {
          console.log("✅ Stream ended");
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempSystemMessageId
                ? {
                    ...msg,
                    content: accumulatedText,
                    isStreaming: false,
                    streamedContent: undefined,
                  }
                : msg
            )
          );
        });

        eventSource.addEventListener("complete", async (ev) => {
          console.log("✅ Stream Complete");
          eventSource.close();
          const { codebase: codebaserec, externalPackages } = JSON.parse(
            ev.data
          );

          // Update codebase and dependencies in a single batch
          Promise.all([
            setCodebase(codebaserec),
            setDependencies(externalPackages),
          ]).then(async () => {
            console.log("running lua");
            await handleRunLua({
              project: activeProject as Project,
              luaCodeToBeEval: (codebaserec["/src/lua/index.lua"] || // for Code-Mode
                codebaserec["/index.lua"]) as string, // for Vibe-Mode
            });
            console.log("running lua done");
            toast.info("Code updated.", {
              duration: 3000,
            });
            const srcDoc = generateSrcDocFromCodebase(codebaserec);
            setSrcDocCode(srcDoc);
            setIsCodeGenerating(false);
          });
        });
      };

      if (activeProject?.framework === Framework.React) {
        console.log("Generating React code...");
        const eventSource = new EventSource(
          `${API_CONFIG.BACKEND_URL}/chat/stream?projectId=${
            requestBody.projectId
          }&prompt=${encodeURIComponent(requestBody.prompt.content)}`
        );
        handleStreamEvents(eventSource);
      } else if (activeProject?.framework === Framework.Html) {
        console.log("Generating HTML code...");
        const eventSource = new EventSource(
          `${API_CONFIG.BACKEND_URL}/chat/html/stream?projectId=${
            requestBody.projectId
          }&prompt=${encodeURIComponent(
            requestBody.prompt.content
          )}&mode=${mode}`
        );
        handleStreamEvents(eventSource);
      }
      setTimeout(scrollToBottom, 2000);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempSystemMessageId));
      setFailedMessage(messageToSend);
      toast.error("Failed to send message. Please try again.");
      setIsCodeGenerating(false);
    } finally {
      if (currentlyRetrying) {
        setIsRetrying(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (isInputMaximized) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleSubmit();
        }
      } else {
        if (!e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      }
    }
  };

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
        <p>Select a project to start chatting</p>
      </div>
    );
  }

  const disableChatInput = () => {
    return !user /*|| user.tokens === 0 */ || isCodeGenerating || isRetrying;
  };

  return (
    <div className="h-full flex flex-col bg-background relative border-r-1">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages &&
          messages.length > 0 &&
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === "user" ? "flex-row" : "flex-row"
              } animate-in fade-in-0 slide-in-from-bottom-2`}
            >
              {message.role === "user" ? (
                <Avatar>
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback>
                    <User size={12} />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Avatar>
                  <AvatarImage
                    src={
                      "https://arweave.net/pYIMnXpJRFUwTzogx_z5HCOPRRjCbSPYIlUqOjJ9Srs"
                    }
                    className="bg-none"
                  />
                </Avatar>
              )}
              <div
                className={`max-w-[85%] rounded-xl max-w-2xl ${
                  message.role === "user"
                    ? "bg-sidebar-accent text-black dark:text-black shadow-lg transition-colors"
                    : "bg-card dark:bg-card/90 text-card-foreground shadow-sm border border-border/10 hover:border-border/20 transition-all"
                } p-4 backdrop-blur-sm`}
              >
                <MessageRenderer message={message} />
              </div>
            </div>
          ))}
        {failedMessage && !isCodeGenerating && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => {
                setIsRetrying(true);
                handleSubmit();
              }}
              className="px-4 py-2 text-sm bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-lg flex items-center gap-2 shadow-md transition-all duration-200"
            >
              <RefreshCw size={14} className="animate-spin" />
              <span>Retry last message</span>
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="shrink-0 bg-background border-t border-border p-4">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className={`w-full outline-none focus-visible:ring-0 resize-none transition-all duration-200 ${
                  isInputMaximized
                    ? `min-h-[120px] ${
                        activeProject?.framework === Framework.Html
                          ? "pt-8 pl-3"
                          : "pt-3 pl-3"
                      }`
                    : `min-h-[40px] max-h-[40px] ${
                        activeProject?.framework === Framework.Html
                          ? "pt-2 pl-3.5"
                          : "pt-2 pl-3"
                      }`
                }`}
                disabled={disableChatInput()}
                placeholder={
                  failedMessage
                    ? "AI response failed. Retry or type new prompt."
                    : isInputMaximized
                    ? `Type your prompt... (Ctrl+Enter to send)`
                    : `Type your prompt...`
                }
                rows={isInputMaximized ? 5 : 1}
              />
              {/* {activeProject?.framework === Framework.Html && (
                <div
                  className={`absolute ${
                    isInputMaximized ? "top-2 left-2" : "top-2 left-2"
                  } px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${
                    mode === "UI"
                      ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                  }`}
                >
                  {mode === "UI" ? "UI" : "All"}
                </div>
              )} */}
              <button
                type="button"
                onClick={() => setIsInputMaximized(!isInputMaximized)}
                className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-sm hover:bg-accent"
                disabled={disableChatInput()}
              >
                {isInputMaximized ? (
                  <Minimize2 size={14} />
                ) : (
                  <Maximize2 size={14} />
                )}
              </button>
            </div>
            {activeProject?.framework === Framework.Html && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() =>
                      handleModeChange(mode === "UI" ? "All" : "UI")
                    }
                    className={`h-10 px-3 text-xs tracking-wider font-medium rounded-md border transition-all duration-200 flex items-center gap-1.5 ${
                      mode === "UI"
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/15"
                        : "bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500/15"
                    }`}
                  >
                    {mode === "UI" ? "UI" : "All"}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-sm p-0 bg-neutral-900 border-neutral-700"
                >
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {mode === "UI" ? (
                        <Layout className="h-4 w-4 text-blue-400" />
                      ) : (
                        <Zap className="h-4 w-4 text-orange-400" />
                      )}
                      <span className="font-semibold text-white text-sm">
                        {mode === "UI" ? "UI Mode" : "All Code Mode"}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-300 leading-relaxed mb-3">
                      {mode === "UI"
                        ? "Focuses on visual elements: styling, layouts, components, and user interface modifications"
                        : "Full codebase access: logic, functions, data handling, structure, and all file modifications"}
                    </div>

                    <div className="border-t border-neutral-700 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">
                          Click to switch to:
                        </span>
                        <div className="flex items-center gap-1 text-neutral-200 font-medium">
                          {mode === "UI" ? (
                            <>
                              <Zap className="h-3 w-3 text-orange-400" />
                              All Mode
                            </>
                          ) : (
                            <>
                              <Layout className="h-3 w-3 text-blue-400" />
                              UI Mode
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50 flex items-center justify-center h-10"
              disabled={
                (!userInput.trim() && !failedMessage) || // Disable if no input and no failed message to retry
                isCodeGenerating || // Disable during generation
                disableChatInput() // General disable conditions
              }
            >
              {isCodeGenerating ? (
                <Loader2Icon className="animate-spin" size={16} />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

Chatview.displayName = "Chatview";

export default Chatview;
