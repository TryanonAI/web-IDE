'use client';

import {
  CodeIcon,
  EyeIcon,
  History,
  ChevronDown,
  Maximize,
  Minimize,
  RefreshCw,
  Save,
} from 'lucide-react';
import {
  SandpackLayout,
  SandpackProvider,
  SandpackFileExplorer,
  SandpackCodeEditor,
  useSandpack,
} from '@codesandbox/sandpack-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useWallet } from '@/hooks';
import { useEffect, useState, useRef } from 'react';
import { useGlobalState } from '@/hooks';
import { Framework, Project } from '@/types';
import { cn, defaultFiles } from '@/lib/utils';
import { BASE_DEPENDENCIES, DEV_DEPENDENCIES } from '@/constant/dependencies';
import { Loading_Gif } from '@/app/loading';
import Sprv from './Sprv';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import OpenWithCursor from '../OpenWithCursor';

interface CodebaseType {
  [key: string]: string;
}

interface CodeviewProps {
  isSaving?: boolean;
}

// Create a separate component that uses useSandpack hook inside the provider
function CodeviewInner({ isSaving }: CodeviewProps) {
  const address = useWallet((state) => state.address);
  const codebase = useGlobalState((state) => state.codebase);
  const isLoading = useGlobalState((state) => state.isLoading);
  const setIsLoading = useGlobalState((state) => state.setIsLoading);
  const codeVersions = useGlobalState((state) => state.codeVersions);
  const activeProject = useGlobalState((state) => state.activeProject);
  const isCodeGenerating = useGlobalState((state) => state.isCodeGenerating);
  const setCodebase = useGlobalState((state) => state.setCodebase);
  const setDependencies = useGlobalState((state) => state.setDependencies);

  const { sandpack } = useSandpack();

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const versionDropdownRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        versionDropdownRef.current &&
        !versionDropdownRef.current.contains(event.target as Node)
      ) {
        setIsVersionDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Track file changes to detect unsaved changes
  useEffect(() => {
    if (sandpack.files && codebase) {
      const currentFiles = sandpack.files;
      const originalFiles = codebase as CodebaseType;

      const hasChanges = Object.keys(currentFiles).some((filePath) => {
        const currentContent = currentFiles[filePath]?.code || '';
        const originalContent = originalFiles[filePath] || '';
        return currentContent !== originalContent;
      });

      setHasUnsavedChanges(hasChanges);
    }
  }, [sandpack.files, codebase]);

  const saveCurrentFile = async () => {
    if (!activeProject?.projectId || !address || !sandpack.files) {
      toast.error('Unable to save: Missing project information');
      return;
    }

    try {
      setIsSavingFile(true);
      const activeFilePath = sandpack.activeFile; // Only the active file should be saved
      const currentFiles = sandpack.files;
      const originalFiles = codebase as CodebaseType;

      // Determine if the active file has changed
      const currentContent = currentFiles[activeFilePath]?.code || '';
      const originalContent = originalFiles[activeFilePath] || '';

      if (currentContent === originalContent) {
        toast.info('No changes to save');
        setIsSavingFile(false);
        return;
      }

      // Only include the active file in the payload
      const changedFiles: CodebaseType = {
        [activeFilePath]: currentContent,
      };

      // Prepare the full updated codebase for optimistic update
      const updatedCodebase: CodebaseType = {
        ...originalFiles,
        [activeFilePath]: currentContent, // Update only the active file
      };

      // Optimistic update - update frontend immediately
      sandpack.updateCurrentFile(currentContent, true);
      setCodebase(updatedCodebase);
      setHasUnsavedChanges(false);
      toast.success(
        `Saved ${Object.keys(changedFiles).length} file(s) successfully!`
      );

      setTimeout(async () => {
        try {
          const payload = {
            changedFiles, // Send only the changed active file
          };

          console.log('🚀 Sending payload to backend:', {
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${activeProject.projectId}/codebase?walletAddress=${address}`,
            payload: payload,
            payloadSize: JSON.stringify(payload).length + ' bytes',
          });

          await axios.patch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${activeProject.projectId}/codebase?walletAddress=${address}`,
            payload
          );
          console.log('✅ Changed files saved to backend successfully');
        } catch (error) {
          console.error('❌ Error saving to backend:', error);
          // Revert optimistic update if backend fails
          sandpack.updateCurrentFile(originalContent, true);
          setCodebase(originalFiles);
          setHasUnsavedChanges(true);
          toast.error('Failed to save to server. Changes reverted.');
        }
      }, 100);
    } catch (error) {
      console.error('[Codeview] Error saving file:', error);
      toast.error('Failed to save file');
    } finally {
      setIsSavingFile(false);
    }
  };

  const loadCodeVersion = async (versionId: number) => {
    try {
      setIsLoading(true);
      toast.info('Loading code version...');

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${activeProject?.projectId}/versions/${versionId}?walletAddress=${address}`
      );

      console.log('Version codebase response:', response.data);

      if (
        response.data.externalPackages &&
        Object.keys(response.data.externalPackages).length > 0
      ) {
        console.log(
          '📦 Updating dependencies from version:',
          response.data.externalPackages
        );
        setDependencies(
          response.data.externalPackages as Record<string, string>
        );
      }
      console.log(response.data);
      setCodebase(response.data.codebase);
      setSelectedVersion(versionId);
      setHasUnsavedChanges(false);
      toast.success('Loaded code version successfully');
    } catch (error) {
      console.error('[Codeview.ts] Error loadCodeVersion:', error);
      toast.error('[Codeview.ts] Failed loadCodeVersion');
    } finally {
      setIsLoading(false);
    }
  };

  const isEditorDisabled = () => {
    return isSaving || isCodeGenerating || isLoading;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const returnToLatest = () => {
    if (activeProject?.projectId && codebase) {
      setSelectedVersion(null);
      setDependencies(activeProject.externalPackages as Record<string, string>);
      setHasUnsavedChanges(false);
      console.log('Switched to latest codebase version');
      toast.success('Loaded latest code version');
    }
  };

  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 15000);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (hasUnsavedChanges && !isSavingFile && !isEditorDisabled()) {
          saveCurrentFile();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasUnsavedChanges, isSavingFile, isEditorDisabled]);

  if (activeProject?.framework === Framework.Html) {
    console.log(codebase);
    return (
      <iframe
        srcDoc={
          // @ts-expect-error ignore
          codebase['index.html']
        }
        className="w-full h-full"
        aria-label="Code Preview"
        title="Code Preview"
      />
    );
  }

  return (
    <div
      className={`h-full w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}
    >
      {isCodeGenerating ? (
        <div className="flex items-center justify-center h-full bg-[#070707]">
          <Loading_Gif count={2} />
        </div>
      ) : (
        <>
          <div className="bg-background h-10 w-full px-2 flex items-center justify-between border-border border-b p-2">
            <div className="flex items-center justify-center gap-0.5 h-full bg-muted/50 px-1 py-2 rounded-md">
              <button
                onClick={() => setActiveTab('code')}
                className={cn(
                  'py-[1px] px-3 rounded-sm flex justify-center items-center gap-1 text-xs leading-5 font-medium transition-colors',
                  activeTab === 'code'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                  isEditorDisabled() && 'opacity-50 cursor-not-allowed'
                )}
              >
                <CodeIcon size={12} />
                Code
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={cn(
                  'py-[1px] px-3 rounded-sm flex justify-center items-center gap-1 text-xs leading-5 font-medium transition-colors',
                  activeTab === 'preview'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                  isEditorDisabled() && 'opacity-50 cursor-not-allowed'
                )}
              >
                <EyeIcon size={12} />
                {'Preview'}
              </button>
            </div>

            <div className="flex items-center gap-2 h-full">
              {selectedVersion && (
                <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-md text-xs font-medium border border-yellow-500/30 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <History size={12} />
                    <span>
                      Viewing historical version from{' '}
                      {formatTimestamp(
                        codeVersions.find((v) => v.id === selectedVersion)
                          ?.timestamp || ''
                      )}
                    </span>
                    <button
                      onClick={returnToLatest}
                      className="ml-1 underline hover:no-underline"
                    >
                      Return to latest
                    </button>
                  </div>
                </div>
              )}

              {/* Save button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={saveCurrentFile}
                    disabled={
                      !hasUnsavedChanges ||
                      isSavingFile ||
                      isEditorDisabled() ||
                      selectedVersion !== null
                    }
                    className={cn(
                      'h-5 px-2 rounded flex items-center gap-1 text-xs font-medium transition-colors',
                      hasUnsavedChanges && !selectedVersion
                        ? 'text-primary hover:text-primary/80 bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <Save
                      size={14}
                      className={isSavingFile ? 'animate-pulse' : ''}
                    />
                    {isSavingFile
                      ? 'Saving...'
                      : hasUnsavedChanges
                        ? 'Save'
                        : 'Saved'}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {selectedVersion
                      ? 'Cannot save historical version'
                      : hasUnsavedChanges
                        ? 'Save current file (Ctrl+S)'
                        : 'No changes to save'}
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="h-5 px-2 rounded flex items-center gap-1 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {isFullscreen ? (
                      <Minimize size={14} />
                    ) : (
                      <Maximize size={14} />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleRefreshClick}
                    disabled={isRefreshing}
                    className="h-5 px-2 rounded flex items-center gap-1 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    <RefreshCw
                      size={14}
                      className={isRefreshing ? 'animate-spin' : ''}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh preview</p>
                </TooltipContent>
              </Tooltip>

              <div className="relative opacity-80">
                <OpenWithCursor
                  disabled={false}
                  activeProject={activeProject as Project}
                />
              </div>

              {/* Version control dropdown */}
              <div className="relative" ref={versionDropdownRef}>
                <button
                  onClick={() =>
                    setIsVersionDropdownOpen(!isVersionDropdownOpen)
                  }
                  disabled={isEditorDisabled() || codeVersions.length === 0}
                  className={cn(
                    'h-5 px-2 rounded flex items-center gap-1 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground',
                    (isEditorDisabled() || codeVersions.length === 0) &&
                      'opacity-50 cursor-not-allowed'
                  )}
                  title="Code version history"
                >
                  <History size={12} />
                  {selectedVersion
                    ? `Version ${formatTimestamp(
                        codeVersions.find((v) => v.id === selectedVersion)
                          ?.timestamp || ''
                      )}`
                    : 'Current (Latest)'}
                  <ChevronDown
                    size={10}
                    className={cn(
                      'transition-transform',
                      isVersionDropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isVersionDropdownOpen && codeVersions.length > 0 && (
                  <div className="absolute right-0 top-7 z-60 w-56 rounded-md border border-border bg-background shadow-lg">
                    <div className="px-2 py-1.5 border-b border-border">
                      <p className="text-xs text-muted-foreground">
                        {codeVersions.length === 1
                          ? 'Only one version available'
                          : `${codeVersions.length} versions, newest first`}
                      </p>
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1 px-1">
                      <button
                        onClick={() => {
                          returnToLatest();
                          setIsVersionDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full text-left px-2 py-1.5 text-xs rounded-sm hover:bg-muted flex items-center gap-1',
                          !selectedVersion &&
                            'bg-primary/10 text-primary font-medium'
                        )}
                      >
                        <span className="font-medium">
                          Current (Latest Version)
                        </span>
                      </button>

                      {codeVersions.length > 1 &&
                        codeVersions.slice(1).map((version) => (
                          <button
                            key={version.id}
                            onClick={() => {
                              loadCodeVersion(version.id);
                              setIsVersionDropdownOpen(false);
                            }}
                            className={cn(
                              'w-full text-left px-2 py-1.5 text-xs rounded-sm hover:bg-muted flex items-center justify-between',
                              selectedVersion === version.id &&
                                'bg-primary/10 text-primary font-medium'
                            )}
                            title={`Version from ${new Date(
                              version.timestamp
                            ).toLocaleString()} - ID: ${version.id}`}
                          >
                            <span className="truncate">
                              {version.description}
                            </span>
                            <span className="text-muted-foreground shrink-0 ml-1">
                              {formatTimestamp(version.timestamp)}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <SandpackLayout className="h-full min-h- w-full flex relative">
            <div
              className={cn(
                'absolute inset-0 flex',
                activeTab === 'code' ? 'z-50' : 'z-10'
              )}
            >
              <SandpackFileExplorer
                className="min-w-[200px] max-w-[250px]"
                initialCollapsedFolder={['ui']}
              />
              <div className="flex-1 min-w-[35%] h-full flex flex-col">
                <SandpackCodeEditor
                  showTabs={false}
                  showLineNumbers={true}
                  showInlineErrors={true}
                  wrapContent={false}
                  closableTabs={true}
                  readOnly={false}
                  showRunButton={true}
                  style={{ height: '100%', minHeight: '0' }}
                />
              </div>
            </div>
            <div
              className={cn(
                'absolute inset-0',
                activeTab === 'preview' ? 'z-50' : 'z-10'
              )}
            >
              <Sprv
                onRefreshClick={handleRefreshClick}
                isRefreshing={isRefreshing}
              />
            </div>
          </SandpackLayout>
        </>
      )}
    </div>
  );
}

export default function Codeview({ isSaving }: CodeviewProps) {
  const codebase = useGlobalState((state) => state.codebase);
  const dependencies = useGlobalState((state) => state.dependencies);

  const sandpackFiles = {
    ...defaultFiles,
    ...(codebase as CodebaseType),
  };

  // Generate visible files list
  const visibleFiles: string[] = codebase
    ? Object.keys(codebase)
    : ['/src/App.tsx'];

  return (
    <SandpackProvider
      className="w-full h-full"
      theme={{
        colors: {
          surface1: 'hsl(var(--background))',
          surface2: 'hsl(var(--card))',
          surface3: 'hsl(var(--muted))',
          clickable: 'hsl(var(--muted-foreground))',
          base: 'hsl(var(--foreground))',
          disabled: 'hsl(var(--muted-foreground))',
          hover: 'hsl(var(--accent))',
          accent: 'hsl(var(--primary))',
          error: 'hsl(var(--destructive))',
          errorSurface: 'hsl(var(--destructive)/0.1)',
        },
      }}
      customSetup={{
        entry: '/src/main.tsx',
        dependencies: {
          ...BASE_DEPENDENCIES,
          ...dependencies,
        },
        devDependencies: {
          ...DEV_DEPENDENCIES,
        },
      }}
      files={sandpackFiles}
      options={{
        visibleFiles,
        activeFile:
          visibleFiles.find(
            (file) => file.endsWith('.lua') || file.endsWith('App.tsx')
          ) || visibleFiles[0],
        externalResources: [
          'https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css',
        ],
        classes: {
          'sp-tabs': 'background-color:bg-[#fff];',
        },
        recompileMode: 'immediate',
        recompileDelay: 0,
        autorun: true,
        autoReload: true,
      }}
    >
      <CodeviewInner isSaving={isSaving} />
    </SandpackProvider>
  );
}
