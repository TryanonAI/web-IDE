'use client';

import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { Loader2Icon, RefreshCw } from 'lucide-react';
import { Input } from '../ui/input';
import { Framework, ChatMessage, Role, Project } from '@/types';
import { useWallet } from '@/hooks/use-wallet';
import { useGlobalState } from '@/hooks/global-state';
import LLMRenderer from './chatview/LLMRenderer';

const Chatview = () => {
  const [userInput, setUserInput] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);

  const { user } = useWallet();
  const setCodebase = useGlobalState((state) => state.setCodebase);
  const chatMessages = useGlobalState((state) => state.chatMessages); // From global state
  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages);
  const activeProject = useGlobalState((state) => state.activeProject);
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
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }

    const messageToSend = failedMessage || userInput;
    if (!messageToSend.trim()) return;

    const currentlyRetrying = !!failedMessage && !userInput.trim();
    if (currentlyRetrying) {
      setIsRetrying(true);
    }

    setIsCodeGenerating(true);
    const previousDeploymentUrl = deploymentUrl;

    // Add user message to local state if not retrying
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

    setUserInput('');
    setFailedMessage(null);

    // Create placeholder for AI response
    const tempSystemMessageId = Math.random();
    const systemMessagePlaceholder: ChatMessage = {
      id: tempSystemMessageId,
      content: '',
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
        prompt: { role: 'user', content: messageToSend },
        projectId: activeProject?.projectId as string,
      };

      const handleStreamEvents = (
        eventSource: EventSource,
        isHtmlStream: boolean = false
      ) => {
        let accumulatedText = '';
        let lastProcessedLength = 0;

        eventSource.onmessage = (ev) => {
          try {
            const { text } = JSON.parse(ev.data);

            // Only process new content
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
                      streamedContent: newContent, // Add new content for animation
                    }
                  : msg
              )
            );

            if (isHtmlStream) {
              // For HTML streams, we'll update the codebase at the end
              // to avoid partial updates
            }
            scrollToBottom();
          } catch (error) {
            console.error('Error processing stream chunk:', error);
          }
        };

        eventSource.addEventListener('end', () => {
          console.log('✅ Stream ended');
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempSystemMessageId
                ? {
                    ...msg,
                    content: accumulatedText,
                    isStreaming: false,
                    streamedContent: undefined, // Clear streamed content marker
                  }
                : msg
            )
          );
          // setCodebase('');
          
          if (previousDeploymentUrl) {
            toast.info('Code updated.', {
              duration: 5000,
              description: 'You can redeploy to see changes on permaweb',
            });
          }
        });
        toast.info('Updating codebase...');
        eventSource.addEventListener('complete', (ev) => {
          console.log('✅ Stream complete', ev);
          const { codebase } = JSON.parse(ev.data);
          setCodebase(codebase);
          toast.success('Codebase updated.');
          setIsCodeGenerating(false);
          eventSource.close();
        });

        eventSource.addEventListener('error', (err) => {
          console.error('❌ Stream error', err);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempSystemMessageId
                ? {
                    ...msg,
                    content: 'Error: AI response failed.',
                    isLoading: false,
                    isStreaming: false,
                  }
                : msg
            )
          );
          eventSource.close();
          setIsCodeGenerating(false);
          setFailedMessage(messageToSend);
          toast.error('AI response failed. Try again.');
        });
      };

      if (activeProject?.framework === Framework.React) {
        console.log('Generating React code...');
        const eventSource = new EventSource(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/stream?projectId=${requestBody.projectId}&prompt=${encodeURIComponent(requestBody.prompt.content)}`
        );
        handleStreamEvents(eventSource);
      } else if (activeProject?.framework === Framework.Html) {
        console.log('Generating HTML code...');
        const eventSource = new EventSource(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/html/stream?projectId=${requestBody.projectId}&prompt=${encodeURIComponent(requestBody.prompt.content)}`
        );
        handleStreamEvents(eventSource, true);
      }
      setTimeout(scrollToBottom, 2000);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempSystemMessageId));
      setFailedMessage(messageToSend);
      toast.error('Failed to send message. Please try again.');
      setIsCodeGenerating(false);
    } finally {
      if (currentlyRetrying) {
        setIsRetrying(false);
      }
    }
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.role === 'model') {
      if (message.isLoading) {
        return (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Loader2Icon className="w-4 h-4 animate-spin" />
            <span>Generating...</span>
          </div>
        );
      }
      return <LLMRenderer llmResponse={message.content} />;
    }
    return <LLMRenderer llmResponse={message.content} />;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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
    // Consider if user.tokens check is still relevant or if backend handles this
    return !user /*|| user.tokens === 0 */ || isCodeGenerating || isRetrying;
  };

  return (
    <div className="h-full flex flex-col bg-background relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages &&
          messages.length > 0 &&
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              } animate-in fade-in-0 slide-in-from-bottom-4`}
            >
              <div
                className={`max-w-[85%] md:max-w-3xl rounded-lg p-5 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground dark:text-primary-foreground/80 ml-12'
                    : 'bg-muted/50 dark:bg-gray-800/90 text-foreground mr-12 border border-border/50'
                }`}
              >
                {renderMessage(message)}
              </div>
            </div>
          ))}
        {failedMessage && !isCodeGenerating && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                setIsRetrying(true);
                handleSubmit();
              }}
              className="px-4 py-2 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md flex items-center gap-2 shadow-sm transition-colors"
            >
              <RefreshCw size={14} className="animate-spin" />
              Retry last failed message
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="shrink-0 bg-background border-t border-border p-4">
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
                placeholder={
                  failedMessage
                    ? 'AI response failed. Retry or type new prompt.'
                    : 'Type your prompt...'
                }
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50 flex items-center justify-center"
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
};

export default Chatview;
