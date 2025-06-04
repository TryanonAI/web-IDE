'use client';

import axios from 'axios';
import { toast } from 'sonner';
import Markdown from 'react-markdown';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2Icon, RefreshCw } from 'lucide-react';
import { Input } from '../ui/input';
import { Framework, ChatMessage } from '@/types';
import { useWallet } from '@/hooks/use-wallet';
import { useGlobalState } from '@/hooks/global-state';
import { Loading_Gif } from '@/app/loading';
const Chatview = () => {
  const [userInput, setUserInput] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<ChatMessage[]>([]);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);

  const { user } = useWallet();
  const { updateDependencies } = useGlobalState();
  const setCodebase = useGlobalState((state) => state.setCodebase);
  const chatMessages = useGlobalState((state) => state.chatMessages);
  const activeProject = useGlobalState((state) => state.activeProject);
  const addChatMessage = useGlobalState((state) => state.addChatMessage);
  const isCodeGenerating = useGlobalState((state) => state.isCodeGenerating);
  const setIsCodeGenerating = useGlobalState(
    (state) => state.setIsCodeGenerating
  );
  const deploymentUrl = useGlobalState((state) => state.deploymentUrl);

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

    setIsCodeGenerating(true);
    const messageToSend = failedMessage || userInput;

    // Store the current deployment URL to check if it changes
    const previousDeploymentUrl = deploymentUrl;

    addChatMessage({
      id: Math.random(),
      content: messageToSend,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageId: Math.random().toString(),
      projectId: activeProject?.projectId as string,
    });

    // Reset failed message if we're retrying
    if (failedMessage) {
      setFailedMessage(null);
      setIsRetrying(true);
    }

    // Clear input unless we're retrying
    if (!isRetrying) {
      setIsRetrying(false);
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
        framework: activeProject?.framework,
        prompt: { role: 'user', content: messageToSend },
        projectId: activeProject?.projectId as string,
      };

      if (activeProject?.framework === Framework.React) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/`,
          requestBody
        );
        const responseContent = response.data.codebase;
        const externalPackagesFromBackend =
          response.data.externalPackages || [];

        // Update dependencies from chat response
        if (externalPackagesFromBackend.length > 0) {
          console.log(
            '📦 Updating dependencies from chat response:',
            externalPackagesFromBackend
          );
          updateDependencies(externalPackagesFromBackend);
        }

        setMessage((prevMessages) => {
          const messagesWithoutLoading = prevMessages.filter(
            (m) => m.id !== Number(tempSystemMessageId)
          );
          const finalMessages = [...messagesWithoutLoading];
          console.log('Updated messages after API response:', finalMessages);
          return finalMessages;
        });

        try {
          // for new prompt
          if (responseContent) {
            setCodebase(responseContent);
            if (previousDeploymentUrl) {
              toast.info('Code updated.', {
                duration: 5000,
                description: 'You can redeploy to see changes on permaweb',
              });
            }
          } else {
            setIsCodeGenerating(false);
            throw new Error('No codebase received');
          }

          // if (
          //   typeof responseContent === 'object' &&
          //   responseContent?.codebase
          // ) {
          //   console.log('New codebase received, updating codebase state');
          //   setCodebase(responseContent.codebase);

          //   // If there was a previous deployment, show redeploy option
          //   if (previousDeploymentUrl) {
          //     toast.info('Code updated.', {
          //       duration: 5000,
          //       description: 'You can redeploy to see changes on permaweb',
          //     });
          //   }
          // } else if (typeof responseContent === 'string') {
          //   const parsedContent = JSON.parse(responseContent);
          //   if (parsedContent?.codebase) {
          //     console.log(
          //       'New codebase received (parsed from string), updating codebase state'
          //     );
          //     setCodebase(parsedContent.codebase);

          //     // If there was a previous deployment, show redeploy option
          //     if (previousDeploymentUrl) {
          //       toast.info('Code updated.', {
          //         duration: 5000,
          //         description: 'You can redeploy to see changes on permaweb',
          //       });
          //     }
          //   }
          // }
        } catch (parseError) {
          console.warn(
            'Could not parse response content or find codebase:',
            parseError
          );
        } finally {
          setIsCodeGenerating(false);
        }
      } else if (activeProject?.framework === Framework.Html) {
        // const response = await axios.post<ChatApiResponse>(
        //   `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/html/generate`,
        //   requestBody
        // );
        // const responseContent = response.data.code;
        // setCodebase(responseContent);

        const eventSource = new EventSource(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/html/stream?projectId=${requestBody.projectId}&prompt=${encodeURIComponent(requestBody.prompt.content)}`
        );

        let finalText = '';

        eventSource.onmessage = (e) => {
          try {
            const { text } = JSON.parse(e.data);
            finalText += text;
            setCodebase(finalText);
          } catch (error) {
            console.error('Error processing stream chunk:', error);
          }
        };

        eventSource.addEventListener('end', () => {
          console.log('✅ Stream ended');
          setCodebase(finalText);
          setIsCodeGenerating(false);
          eventSource.close();

          if (previousDeploymentUrl) {
            toast.info('Code updated.', {
              duration: 5000,
              description: 'You can redeploy to see changes on permaweb',
            });
          }
        });

        eventSource.addEventListener('error', (e) => {
          console.error('❌ Stream error', e);
          eventSource.close();

          setIsCodeGenerating(false);
          toast.error('AI response failed. Try again.');
        });

        // If there was a previous deployment, show redeploy option
        // if (previousDeploymentUrl) {
        //   toast.info('Code updated.', {
        //     duration: 5000,
        //     description: 'You can redeploy to see changes on permaweb',
        //   });
        // }
      }

      // Scroll to bottom after receiving response
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the loading indicator
      setMessage((prev) => prev.filter((m) => !m.isLoading));
      // Store the failed message for retry
      setFailedMessage(messageToSend);
      // Show error toast
      toast.error('Failed to send message. Please try again.');
    } finally {
      // Reset states
      setIsRetrying(false);
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
            <>
              {activeProject?.framework === Framework.React && (
                <Markdown>
                  {message.role === 'user'
                    ? message.content
                    : //@ts-expect-error ignore
                      message.content.description}
                </Markdown>
              )}
              {activeProject?.framework === Framework.Html && (
                //@ts-expect-error ignore
                <Markdown>{message.content}</Markdown>
              )}
            </>
          )}
        </div>
      </div>
    ));
  }, [chatMessages, activeProject]);

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
        <p>Select a project to start chatting</p>
      </div>
    );
  }

  const disableChatInput = () => {
    return !user || user.tokens === 0 || isCodeGenerating;
  };

  return (
    <div className="h-full flex flex-col bg-background relative">
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
                    disabled={isRetrying || isCodeGenerating}
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
        <div className="flex items-center gap-2 mb-2 hidden"></div>
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
            <div className="flex-1 relative">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full outline-none focus-visible:ring-0"
                disabled={disableChatInput()}
                placeholder="Type your prompt..."
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50 flex items-center justify-center"
              disabled={
                (!userInput.trim() && !failedMessage) ||
                isRetrying ||
                isCodeGenerating ||
                disableChatInput()
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

      {/* Blur overlay when code is generating */}
      {isCodeGenerating && (
        <div className=" absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          {/* <div className="flex items-center gap-2">
            <Loader2Icon className="animate-spin" size={16} />
            <p className="text-sm text-muted-foreground">Generating code...</p>
          </div> */}
          <Loading_Gif count={2} />
        </div>
      )}
    </div>
  );
};

export default Chatview;
