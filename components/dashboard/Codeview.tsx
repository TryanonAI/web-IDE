'use client';

import { CodeIcon, EyeIcon, History, ChevronDown } from 'lucide-react';
import {
  SandpackLayout,
  SandpackProvider,
  SandpackCodeEditor,
  SandpackFileExplorer,
  SandpackPreview,
} from '@codesandbox/sandpack-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useWallet } from '@/hooks';
import { useEffect, useState, useRef } from 'react';
import { useGlobalState } from '@/hooks';
import { CurrentProject, Framework } from '@/types';
import { Tabs, TabsList } from '@/components/ui/tabs';
import { defaultFiles } from '@/lib/filesUtils';
import { cn, validateNpmPackage } from '@/lib/utils';
import { HTML_TEMPLATE_FILES } from '@/constant/templateFiles';
import { BASE_DEPENDENCIES, DEV_DEPENDENCIES } from '@/constant/dependencies';
interface CodebaseType {
  [key: string]: string;
}

interface ApiResponse {
  codebase: CodebaseType;
  externalPackages?: string[];
  description?: string;
  projectId?: string;
  [key: string]: string | string[] | CodebaseType | undefined;
}

interface CodeviewProps {
  isSaving?: boolean;
}

const extractHtmlFromMarkdown = (content: string): string => {
  const htmlMatch = content.match(/```html\s*([\s\S]*?)```/);
  return htmlMatch ? htmlMatch[1].trim() : '';
};

export default function Codeview({ isSaving }: CodeviewProps) {
  const address = useWallet((state) => state.address);
  const codebase = useGlobalState((state) => state.codebase);
  const isLoading = useGlobalState((state) => state.isLoading);
  const setIsLoading = useGlobalState((state) => state.setIsLoading);
  const codeVersions = useGlobalState((state) => state.codeVersions);
  const activeProject = useGlobalState((state) => state.activeProject);
  const isCodeGenerating = useGlobalState((state) => state.isCodeGenerating);
  const updateDependencies = useGlobalState(
    (state) => state.updateDependencies
  );

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const versionDropdownRef = useRef<HTMLDivElement>(null);
  const [validatedDependencies, setValidatedDependencies] = useState<
    Record<string, string>
  >({});
  const [currentProject, setCurrentProject] = useState<CurrentProject | null>(
    null
  );

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

  const loadCodeVersion = async (versionId: number) => {
    try {
      setIsLoading(true);
      toast.info('Loading code version...');

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${activeProject?.projectId}/versions/${versionId}?walletAddress=${address}`
      );

      console.log('Version codebase response:', response.data);

      if (response.data) {
        // Update dependencies from version data
        if (
          response.data.externalPackages &&
          response.data.externalPackages.length > 0
        ) {
          console.log(
            '📦 Updating dependencies from version:',
            response.data.externalPackages
          );
          updateDependencies(response.data.externalPackages);
        }

        setCurrentProject({
          ...response.data,
        } as CurrentProject);

        setSelectedVersion(versionId);
        toast.success('Loaded code version successfully');
      }
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

  const sandpackFiles = {
    ...defaultFiles,
    ...currentProject?.codebase,
  };

  // Generate visible files list
  const visibleFiles: string[] = currentProject?.codebase
    ? Object.keys(currentProject.codebase)
    : ['/src/App.tsx'];

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
      const latestProject: CurrentProject = {
        codebase: codebase as CodebaseType,
        description: activeProject.title || 'cooked with Tryanon.ai',
        projectId: activeProject.projectId,
        externalPackages: [],
      };
      setCurrentProject(latestProject);
      console.log('Switched to latest codebase version');
      toast.success('Loaded latest code version');
    }
  };

  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  // Update currentProject when codebase changes
  useEffect(() => {
    if (codebase && activeProject) {
      const processedProject: CurrentProject = {
        codebase: codebase as CodebaseType,
        description: activeProject.title || 'Made by TryAnon-AI',
        projectId: activeProject.projectId,
        externalPackages: [],
      };
      setCurrentProject(processedProject);
      setSelectedVersion(null);

      // Update dependencies when codebase changes
      if (typeof codebase === 'object') {
        const response = codebase as unknown as ApiResponse;
        if (response.externalPackages && response.externalPackages.length > 0) {
          console.log(
            '📦 Updating dependencies from codebase:',
            response.externalPackages
          );
          updateDependencies(response.externalPackages);
        }
      }
    }
  }, [codebase, activeProject, updateDependencies]);

  // Validate dependencies
  useEffect(() => {
    const validateDependencies = async (
      packages: { packageName: string }[]
    ): Promise<Record<string, string>> => {
      const validatedPackages: Record<string, string> = {};

      for (const pkg of packages) {
        const isValid = await validateNpmPackage(pkg.packageName);
        if (isValid.status && isValid.name && isValid.latestVersion) {
          validatedPackages[isValid.name] = isValid.latestVersion;
        } else {
          console.warn(`Package validation failed for ${pkg.packageName}`);
          toast.error(`Package ${pkg.packageName} not found in npm registry`);
        }
      }
      return validatedPackages;
    };

    const updateDependencies = async (packages: { packageName: string }[]) => {
      const validPackages = await validateDependencies(packages);
      setValidatedDependencies(validPackages);
    };

    updateDependencies(currentProject?.externalPackages || []);
  }, [currentProject]);

  if (activeProject?.framework === Framework.Html) {
    let htmlContent = '';
    if (isCodeGenerating) {
      htmlContent =
        typeof codebase === 'object' ? HTML_TEMPLATE_FILES : codebase || '';
    } else {
      htmlContent =
        typeof codebase === 'object' ? HTML_TEMPLATE_FILES : codebase || '';
    }
    console.log(htmlContent);
    // Extract HTML from markdown code block
    if (htmlContent.startsWith('<!DOCTYPE html>')) {
      htmlContent = htmlContent;
    } else {
      htmlContent = extractHtmlFromMarkdown(htmlContent);
    }

    return (
      <>
        <iframe
          srcDoc={htmlContent}
          className="w-full h-full"
          aria-label="Code Preview"
          title="Code Preview"
        />
      </>
    );
  }

  return (
    <SandpackProvider
      className="w-full h-full"
      // key={`sandpack-${activeProject?.projectId}`}
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
          ...validatedDependencies,
        },
        devDependencies: {
          ...DEV_DEPENDENCIES,
        },
      }}
      files={sandpackFiles}
      options={{
        // bundlerURL: 'https://sandpack-bundler.codesandbox.io',
        visibleFiles,
        activeFile:
          visibleFiles.find(
            (file) => file.endsWith('.lua') || file.endsWith('App.tsx')
          ) || visibleFiles[0],
        externalResources: [
          // 'https://unpkg.com/@permaweb/aoconnect/dist/browser.js',
          // 'https://unpkg.com/@ardrive/turbo-sdk/bundles/web.bundle.min.js',
          'https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css',
        ],
        classes: {
          // 'sp-wrapper': 'h-full min-h-0',
          // 'sp-layout': 'h-full min-h-0 border-none',
          // 'sp-file-explorer':
          //   'min-w-[200px] max-w-[300px] w-1/4 h-full overflow-auto border-r border-border',
          // 'sp-code-editor': 'h-full flex-1',
          // 'sp-tabs': 'bg-background border-b border-border',
          // 'sp-preview-container': 'h-full bg-background',
          // 'sp-preview-iframe': 'h-full bg-black',
        },
        recompileMode: 'immediate',
        recompileDelay: 0,
        autorun: true,
        autoReload: true,
      }}
    >
      <div className="flex bg-background h-full w-full">
        <Tabs className="h-full w-full">
          <TabsList className="h-10 w-full px-2 flex items-center justify-between border-border border-b p-2">
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

              {activeProject &&
                currentProject?.codebase !== undefined &&
                Object.keys(currentProject?.codebase).length > 0 && (
                  <>
                    {/* <OpenWithCursor
                     disabled={false}
                     activeProject={activeProject}
                   /> */}
                  </>
                )}

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

              {/* TODO: RunLua is automated on every LLM call, so we don't need to run it manually */}
              {/* <button
                onClick={handleRunLua}
                disabled={isEditorDisabled()}
                className={cn(
                  'h-5 px-2 rounded flex items-center gap-1 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground',
                  isEditorDisabled() && 'opacity-50 cursor-not-allowed'
                )}
              >
                <RunIcon /> Run Lua
              </button> */}

              {/* TODO: Download Disabled for now */}
              {/* <SandpackDownloader
                disabled={isEditorDisabled()}
                activeProject={activeProject}
              /> */}
            </div>
          </TabsList>

          <SandpackLayout className="h-full min-h-0 w-full flex relative">
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
              <div className="flex-1 min-w-[60%] h-full flex flex-col">
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
              <SandpackPreview
                showNavigator={true}
                style={{ height: '100%' }}
                showRefreshButton={true}
                showOpenInCodeSandbox={true}
                showSandpackErrorOverlay={false}
              />
            </div>
          </SandpackLayout>
        </Tabs>
      </div>
    </SandpackProvider>
  );
}

// const handleRunLua = async () => {
//   let luaCodeToBeEval = '';
//   if (currentProject?.codebase) {
//     const codebase = currentProject.codebase;
//     const luaPath = '/src/lib/index.lua';

//     if (codebase && codebase[luaPath]) {
//       const luaFile = codebase[luaPath];
//       if (typeof luaFile === 'string') {
//         luaCodeToBeEval = luaFile;
//       } else if (typeof luaFile === 'object' && 'code' in luaFile) {
//         luaCodeToBeEval = (luaFile as { code: string }).code;
//       }
//     }
//   }

//   if (!luaCodeToBeEval) {
//     toast.error('No Lua code found in the project.');
//     return;
//   }

//   if (typeof window === 'undefined' || !window.arweaveWallet) {
//     toast.error(
//       "Arweave wallet not available. Please ensure it's installed and connected."
//     );
//     return;
//   }

//   if (!activeProject?.projectId) {
//     toast.error('No valid process ID found for this project.');
//     return;
//   }

//   try {
//     const { connect } = await import('@permaweb/aoconnect');
//     const ao = connect({
//       MODE: MODE,
//       CU_URL: CU_URL,
//       GATEWAY_URL: GATEWAY_URL,
//       GRAPHQL_URL: GRAPHQL_URL,
//     });

//     const luaResult = await runLua({
//       process: activeProject.projectId,
//       code: luaCodeToBeEval,
//       tags: [
//         {
//           name: 'Description',
//           value: `${currentProject?.description || 'project description'}`,
//         },
//       ],
//     });

//     console.log('Message ID:', luaResult.id);

//     const result = await ao.result({
//       process: activeProject?.projectId || '',
//       message: luaResult.id,
//     });

//     toast.success('Lua code executed successfully');
//     setCurrentProject((prev) =>
//       prev ? { ...prev, latestMessage: result } : null
//     );
//   } catch (error) {
//     const errorMessage =
//       error instanceof Error ? error.message : 'Unknown error';
//     toast.error('Error executing Lua code: ' + errorMessage);
//     console.error('Lua execution error:', error);
//   }
// };
