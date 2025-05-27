'use client';

import axios from 'axios';
import { toast } from 'sonner';
import Markdown from 'react-markdown';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader2Icon, RefreshCw } from 'lucide-react';
import { Input } from '../ui/input';
import { Framework, ChatMessage } from '@/types';
import { useWallet } from '@/hooks/use-wallet';
import { useGlobalState } from '@/hooks/global-state';

// interface FileReference {
//   id: string;
//   code: string;
// }

interface ChatviewProps {
  onGenerateStart?: () => void;
  onGenerateEnd?: () => void;
  showLuaToggle?: boolean;
  chatMessages: ChatMessage[];
}

// Add interface for API response
interface ChatApiResponse {
  code: string;
  response: string;
  id: string;
}

const Chatview = ({
  onGenerateStart,
  onGenerateEnd,
  showLuaToggle = true,
  chatMessages = [],
}: ChatviewProps) => {
  const [userInput, setUserInput] = useState('');
  const [message, setMessage] = useState<ChatMessage[]>([]);
  // const [mentionedFiles] = useState<FileReference[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [luaEnabled, setLuaEnabled] = useState(true);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  // const [isInputExpanded, setIsInputExpanded] = useState(false);
  const setCodebase = useGlobalState((state) => state.setCodebase);

  const { user } = useWallet();
  const addChatMessage = useGlobalState((state) => state.addChatMessage);
  const activeProject = useGlobalState((state) => state.activeProject);
  const framework = useGlobalState((state) => state.framework);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [message]);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }

    if (!userInput.trim() && !failedMessage) return;

    const messageToSend = failedMessage || userInput;

    // Reset failed message if we're retrying
    if (failedMessage) {
      setFailedMessage(null);
      setIsRetrying(true);
    }

    // Clear input unless we're retrying
    if (!isRetrying) {
      setUserInput('');
    }

    // Add the user message to the local messages immediately
    const tempUserMessageId = Math.random();
    const userMessage: ChatMessage = {
      id: tempUserMessageId,
      content: messageToSend,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageId: tempUserMessageId.toString(),
      projectId: activeProject?.projectId as string,
    };

    // Only add user message to UI if we're not retrying
    if (!isRetrying) {
      setMessage((prev) => [...prev, userMessage]);
    }

    try {
      if (onGenerateStart) {
        onGenerateStart();
      }

      // Add a temporary loading message
      const tempSystemMessageId = `temp-${Date.now() + 1}`;

      setMessage((prev) => [
        ...prev.filter(
          (m) => !isRetrying || m.id !== Number(tempSystemMessageId)
        ),
        {
          id: Number(tempSystemMessageId),
          content: 'Generating...',
          role: 'model',
          isLoading: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageId: tempSystemMessageId,
          projectId: activeProject?.projectId as string,
        },
      ]);

      // Scroll to bottom after adding messages
      setTimeout(scrollToBottom, 100);

      // Make API call
      const requestBody = {
        framework,
        luaEnabled,
        prompt: { role: 'user', content: messageToSend },
        projectId: activeProject?.projectId as string,
        // fileContext: mentionedFiles.reduce(
        //   (acc, file) => {
        //     acc[file.id] = file.code;
        //     return acc;
        //   },
        //   {} as Record<string, string>
        // ),
      };

      if (framework === Framework.React) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/`,
          requestBody
        );
        const responseContent = response.data.content;

        setMessage((prevMessages) => {
          const messagesWithoutLoading = prevMessages.filter(
            (m) => m.id !== Number(tempSystemMessageId)
          );

          // Add the new assistant message from the response
          const finalMessages = [
            ...messagesWithoutLoading,
            {
              id: response.data.id || `msg-${Date.now()}`,
              content: response.data.content,
              role: 'model' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              messageId: response.data.id,
              projectId: activeProject?.projectId as string,
            },
          ];

          console.log('Updated messages after API response:', finalMessages); // Debug log

          return finalMessages;
        });

        // --- ADD onNewCodebase call here, after setMessage ---
        try {
          if (
            typeof responseContent === 'object' &&
            responseContent?.codebase
          ) {
            console.log('New codebase received, updating codebase state');
            setCodebase(responseContent.codebase);
          } else if (typeof responseContent === 'string') {
            const parsedContent = JSON.parse(responseContent);
            if (parsedContent?.codebase) {
              console.log(
                'New codebase received (parsed from string), updating codebase state'
              );
              setCodebase(parsedContent.codebase);
            }
          }
        } catch (parseError) {
          console.warn(
            'Could not parse response content or find codebase:',
            parseError
          );
        }
      } else if (framework === Framework.Html) {
        const response = await axios.post<ChatApiResponse>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/html/generate`,
          requestBody
        );

        const responseContent = response.data.code;
        const responseId = response.data.id;

        handleNewMessage(responseId, responseContent);
        setCodebase(responseContent);
      }

      // Reset retry state if we were retrying
      if (isRetrying) {
        setIsRetrying(false);
      }

      // Scroll to bottom after receiving response
      setTimeout(scrollToBottom, 100);

      if (onGenerateEnd) {
        onGenerateEnd();
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      // Remove the loading indicator
      setMessage((prev) => prev.filter((m) => !m.isLoading));

      // Store the failed message for retry
      setFailedMessage(messageToSend);

      // Reset retry state
      setIsRetrying(false);

      // Show error toast
      toast.error('Failed to send message. Please try again.');

      if (onGenerateEnd) {
        onGenerateEnd();
      }
    }
  };

  // Function to handle retry
  const handleRetry = () => {
    if (failedMessage) {
      handleSubmit();
    }
  };

  // Add a new function to handle key press events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (chatMessages) {
      setMessage(
        chatMessages.map((msg) => ({
          ...msg,
          // @ts-expect-error ignore this error
          content: msg.role === 'user' ? msg.content : msg.content.description,
        }))
      );
    }
  }, [chatMessages]);

  // Replace the setMessage function with this optimized version
  const handleNewMessage = useCallback(
    (responseId: string, responseContent: string) => {
      const newMessage = {
        id: responseId,
        content: responseContent,
        role: 'model' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageId: responseId,
        projectId: activeProject?.projectId as string,
      };

      addChatMessage(newMessage);
    },
    [activeProject?.projectId, addChatMessage]
  );

  // Add message list memoization
  const memoizedMessages = useMemo(() => {
    return chatMessages.map((message) => (
      <div
        key={message.id}
        className={`flex ${
          message.role === 'user' ? 'justify-end' : 'justify-start'
        }`}
      >
        <div
          className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-lg break-words ${
            message.role === 'user'
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-foreground'
          }`}
        >
          {message.isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2Icon
                className="animate-spin text-muted-foreground"
                size={18}
              />
            </div>
          ) : (
            <Markdown>{message.content as string}</Markdown>
          )}
        </div>
      </div>
    ));
  }, [chatMessages]);

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
        <p>Select a project to start chatting</p>
      </div>
    );
  }

  const disableChatInput = () => {
    return !user || user.tokens === 0 || isRetrying;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="h-full p-4 space-y-4">
          {message && Array.isArray(message) && message.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memoizedMessages}

              {/* Retry button for failed messages */}
              {failedMessage && (
                <div className="flex items-center justify-center mt-2">
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="flex items-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive py-1.5 px-3 rounded-md text-sm font-medium transition-colors"
                  >
                    {isRetrying ? (
                      <Loader2Icon className="animate-spin" size={14} />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    Try again
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0 bg-background border-t border-border p-4">
        <div className="flex items-center gap-2 mb-2 hidden">
          {showLuaToggle && (
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-xs font-medium text-gray-200">Lua</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={luaEnabled}
                  onChange={() => setLuaEnabled(!luaEnabled)}
                  className="sr-only"
                />
                <div className="w-7 h-3 bg-gray-800 rounded-full shadow-inner transition-colors duration-200 ease-in-out" />
                <div
                  className={`absolute top-[1px] left-[1px] w-2.5 h-2.5 rounded-full transition-all duration-200 ease-in-out ${
                    luaEnabled
                      ? 'translate-x-4 bg-[#39FF14] shadow-[0_0_6px_#39FF14]'
                      : 'translate-x-0 bg-gray-500 shadow-none'
                  }`}
                />
              </div>
            </label>
          )}
        </div>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex gap-1.5 items-center">
            <div className="bg-background/50 border border-border/40 rounded-sm px-1.5 flex items-center gap-1 h-8">
              <span className="text-[11px] font-medium text-muted-foreground/70">
                Models
              </span>
              <span className="text-[9px] font-medium bg-primary/5 text-primary/70 px-1 rounded-sm">
                Soon
              </span>
            </div>
            {/* <select
              value={selectedFramework}
              onChange={(e) =>
                setSelectedFramework(e.target.value as Framework)
              }
              className="bg-background border border-border rounded-md px-2 py-1 text-foreground h-[39px] shrink-0"
            >
              <option value="React">React</option>
            </select> */}
            <div className="flex-1 relative">
              {/* <button
                type="button"
                onClick={()=>setIsInputExpanded(!isInputExpanded)}
                className="expand-button"
                aria-label={
                  isInputExpanded ? 'Minimize input' : 'Maximize input'
                }
              >
                {isInputExpanded ? (
                  <Minimize2 size={16} />
                ) : (
                  <Maximize2 size={16} />
                )}
              </button> */}

              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full outline-none focus-visible:ring-0"
                disabled={disableChatInput()}
                placeholder="Type your prompt..."
              />

              {/* <MentionsInput
                value={userInput}
                onChange={(e) => setuserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                style={mentionsInputStyle}
                placeholder="Use @ to mention files (Press Enter to send, Shift+Enter for new line)"
                disabled={loading}
                forceSuggestionsAboveCursor
                singleLine={false}
                allowSuggestionsAboveCursor
                a11ySuggestionsListLabel="Suggested files"
                className={`mentions-input ${isInputExpanded ? 'expanded' : ''}`}
                // markup="@[__display__](__id__)"
                autoComplete="off"
              >
                <Mention
                  trigger="@"
                  data={getFileSuggestions}
                  onAdd={handleFileMention}
                  appendSpaceOnAdd
                  displayTransform={(id) => id}
                  renderSuggestion={(suggestion) => (
                    <div
                      className={`suggestion-item ${suggestion.isFolder ? 'folder' : 'file'}`}
                      onClick={() =>
                        suggestion.isFolder && handleFolderClick(suggestion.id)
                      }
                    >
                      {suggestion.isFolder ? (
                        <div className="flex items-center gap-2">
                          <FolderInput className="w-4 h-4" />{' '}
                          {suggestion.display}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileInput className="w-4 h-4" /> {suggestion.display}
                        </div>
                      )}
                    </div>
                  )}
                />
              </MentionsInput> */}
            </div>
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50 flex items-center justify-center"
              disabled={
                (!userInput.trim() && !failedMessage) ||
                isRetrying ||
                disableChatInput()
              }
            >
              {isRetrying ? (
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
};

export default Chatview;

// Add a style tag for custom CSS
// const CustomStyles = () => (
//   <style jsx global>{`
//     .mentions-input {
//       width: 100%;
//       position: relative;
//     }

//     .mentions-input__control {
//       width: 100%;
//       min-height: 44px;
//       max-height: 120px;
//       overflow-y: auto;
//       border-radius: 6px;
//       border: 1px solid hsl(var(--border));
//       background-color: hsl(var(--background));
//       transition: max-height 0.2s ease-in-out;
//     }

//     .mentions-input.expanded .mentions-input__control {
//       max-height: calc(100vh - 250px);
//       min-height: 200px;
//     }

//     .mentions-input__highlighter {
//       padding: 9px 12px;
//       padding-right: 40px;
//       white-space: pre-wrap;
//       word-wrap: break-word;
//       word-break: break-word;
//       overflow-wrap: break-word;
//     }

//     .mentions-input__input {
//       padding: 9px 12px !important;
//       padding-right: 40px !important;
//       min-height: 44px;
//       white-space: pre-wrap !important;
//       word-wrap: break-word !important;
//       word-break: break-word !important;
//       overflow-wrap: break-word !important;
//       overflow: auto !important;
//       line-height: 1.5 !important;
//       color: hsl(var(--foreground)) !important;
//       font-size: 14px !important;
//     }

//     .mentions-input.expanded .mentions-input__input {
//       max-height: 100%;
//       min-height: 200px;
//     }

//     .mentions-input__suggestions__list {
//       background-color: hsl(var(--background));
//       border: 1px solid hsl(var(--border));
//       border-radius: 6px;
//       max-height: 200px;
//       overflow-y: auto;
//       z-index: 10;
//     }

//     .mentions-input__suggestions__item {
//       padding: 6px 10px;
//       border-bottom: 1px solid hsl(var(--border));
//       color: hsl(var(--muted-foreground));
//     }

//     .mentions-input__suggestions__item--focused {
//       background-color: hsl(var(--secondary));
//       color: hsl(var(--foreground));
//     }

//     /* Fix for the textarea to properly wrap text */
//     .mentions-input textarea {
//       white-space: pre-wrap !important;
//       word-wrap: break-word !important;
//       overflow-wrap: break-word !important;
//     }

//     .expand-button {
//       position: absolute;
//       right: 10px;
//       top: 10px;
//       background: transparent;
//       border: none;
//       color: hsl(var(--muted-foreground));
//       cursor: pointer;
//       z-index: 5;
//       padding: 4px;
//       border-radius: 4px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       transition: background-color 0.2s ease;
//     }

//     .expand-button:hover {
//       background-color: hsl(var(--secondary));
//       color: hsl(var(--foreground));
//     }
//   `}</style>
// );
