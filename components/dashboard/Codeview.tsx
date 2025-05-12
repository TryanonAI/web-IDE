'use client';

import {
  RunIcon,
  useSandpack,
  SandpackLayout,
  SandpackProvider,
  SandpackCodeEditor,
  SandpackFileExplorer,
} from '@codesandbox/sandpack-react';

import JSZip from 'jszip';
import axios from 'axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useContext, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionContext } from '@/context/ActionContext';
import SandPackPreviewClient from './SandPackPreviewClient';
import { DEPENDENCIES, defaultFiles_3 } from '@/constant/defaultFiles';
import {
  Loader2Icon,
  CodeIcon,
  EyeIcon,
  History,
  ChevronDown,
  Download,
} from 'lucide-react';
import { CurrentProjectType, ActiveProjectType } from '@/types/types';
import { useProject } from '@/context/ProjectContext';
import { CU_URL, GATEWAY_URL, GRAPHQL_URL, MODE, runLua } from '@/lib/arkit';

const SandpackDownloader = ({
  onDownload,
  disabled,
}: {
  onDownload: (arg: string) => void;
  disabled: boolean;
}) => {
  const { sandpack } = useSandpack();
  const { files: sandpackFiles } = sandpack;
  const { activeProject } = useProject();

  const downloadFiles = async () => {
    if (disabled) return;

    try {
      const zip = new JSZip();
      Object.entries(sandpackFiles).forEach(([filePath, fileObj]) => {
        const fileContent = fileObj.code || '';
        const relativePath = filePath.startsWith('/')
          ? filePath.slice(1)
          : filePath;
        zip.file(relativePath, fileContent);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);

      try {
        const link = document.createElement('a');
        link.href = url;
        link.download =
          activeProject?.name || `tryanon_${activeProject?.projectId}`;
        document.body.appendChild(link);
        link.click();
        toast.success('Files downloaded successfully');
      } catch (err) {
        toast.error('Download failed');
        console.error(err);
      } finally {
        // to open the codebase in the codesandbox
        // document.body.removeChild(link);
        // URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error generating ZIP:', err);
      toast.error('Failed to prepare files for download');
    }
  };

  return (
    <button
      onClick={() => {
        downloadFiles();
        onDownload('export');
      }}
      disabled={disabled}
      className={cn(
        'h-5 px-2 rounded flex items-center gap-1.5 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      title="Export"
    >
      <Download size={12} />
      Download
    </button>
  );
};

const validateNpmPackage = async (packageName: string) => {
  try {
    const response = await axios.get(
      `https://registry.npmjs.org/${packageName}`
    );

    if (response?.status === 200) {
      return {
        status: true,
        name: response.data.name,
        latestVersion: response.data['dist-tags'].latest,
      };
    } else if (response?.status === 404) {
      console.warn(
        `Package validation failed for ${packageName}:`,
        response.status
      );
      return { status: false };
    }
  } catch (error) {
    console.error(`Error validating package ${packageName}:`, error as Error);
    return { status: false };
  }
};

type CodebaseType = Record<string, string>;

interface CodeviewProps {
  activeProject: ActiveProjectType;
  isSaving?: boolean;
  isGenerating: boolean;
  onCommit: (commitMessage?: string) => void;
  codebase: CodebaseType | null;
}

const Codeview = ({
  activeProject,
  isSaving,
  isGenerating,
  onCommit,
  codebase,
}: CodeviewProps) => {
  const [activeView, setActiveView] = useState('code');
  const [loading, setLoading] = useState(false);
  // @ts-expect-error ignore
  const { action, setAction } = useContext(ActionContext);
  const [currentProject, setCurrentProject] =
    useState<CurrentProjectType | null>(null);
  const [validatedDependencies, setValidatedDependencies] = useState({});
  const [codeVersions, setCodeVersions] = useState<
    { id: number; timestamp: string; description: string }[]
  >([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const versionDropdownRef = useRef<HTMLDivElement>(null);

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
      setLoading(true);
      toast.info('Loading code version...');

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${activeProject.projectId}/versions/${versionId}?walletAddress=${activeProject.walletAddress}`
      );

      console.log('Version codebase response:', response.data);

      if (response.data) {
        setCurrentProject({
          ...response.data,
        } as CurrentProjectType);

        // Update the selected version
        setSelectedVersion(versionId);
        toast.success('Loaded code version successfully');
      }
    } catch (error) {
      console.error('Error loading code version:', error);
      toast.error('Failed to load code version');
    } finally {
      setLoading(false);
    }
  };

  const isEditorDisabled = () => {
    return isSaving || isGenerating || loading || action === 'deploy';
  };

  const onAction = async (actionType: string) => {
    setAction({
      Action: actionType,
      timeStamp: Date.now(),
    });

    if (actionType === 'runlua') {
      toast.info('Running Lua code...');
      console.log('currentProject', currentProject);

      // Get Lua code from the codebase, handling different possible structures
      let luaCodeToBeEval = '';

      if (currentProject?.codebase) {
        const codebase = currentProject.codebase;

        const luaPath = '/src/lib/index.lua';
        if (codebase) {
          const luaFile = codebase[luaPath];
          if (luaFile) {
            if (typeof luaFile === 'string') {
              luaCodeToBeEval = luaFile;
            } else if (typeof luaFile === 'object' && 'code' in luaFile) {
              // @ts-expect-error ignore type error
              luaCodeToBeEval = luaFile.code;
            }
          }
        }
      }

      if (!luaCodeToBeEval) {
        toast.error('No Lua code found in the project.');
        return;
      }

      if (typeof window === 'undefined' || !window.arweaveWallet) {
        toast.error(
          `Arweave wallet not available. Please ensure it's installed and connected.`
        );
        return;
      }

      if (!activeProject?.projectId) {
        toast.error('No valid process ID found for this project.');
        return;
      }

      try {
        const { connect } = await import('@permaweb/aoconnect');
        const ao = connect({
          MODE: MODE,
          CU_URL: CU_URL,
          GATEWAY_URL: GATEWAY_URL,
          GRAPHQL_URL: GRAPHQL_URL,
        });
        console.log('activeProject', activeProject);

        const luaResult = await runLua({
          process: activeProject.projectId,
          code: luaCodeToBeEval,
          tags: [
            {
              name: 'Description',
              value: `${currentProject?.description || 'project description'}`,
            },
          ],
        });
        console.log('Message ID:', luaResult.id);

        const result = await ao.result({
          process: activeProject?.projectId || '',
          message: luaResult.id,
        });
        // console.log('Result:', result);

        // result.id = messageId;
        toast.success('Lua code executed successfully');
        // @ts-expect-error ignore type error
        setCurrentProject({ ...currentProject, latestMessage: result });
      } catch (error) {
        // @ts-expect-error ignore type error
        toast.error('Error executing Lua code: ' + error.message);
        console.error('Lua execution error:', error);
      }
    } else if (actionType === 'deploy') {
      toast.info('Deploying project...');
    } else if (actionType === 'commit') {
      if (!onCommit) {
        toast.error('Commit functionality not available');
        return;
      }
      try {
        await onCommit();
        toast.success('Project committed successfully');
      } catch (error) {
        toast.error('Commit failed');
        console.error('Commit failed:', error);
      }
    }
  };

  // Generate visible files list based on the format of codebase
  let visibleFiles: string[] = [];

  // Fall back to default if no files were found
  if (visibleFiles.length === 0) {
    visibleFiles = ['/src/App.tsx'];
  }

  const sandpackFiles = {
    ...defaultFiles_3,
    ...currentProject?.codebase,
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

  // Update currentProject when codebase changes
  useEffect(() => {
    if (codebase && activeProject) {
      // Create a proper CurrentProjectType by adding required properties
      const processedProject: CurrentProjectType = {
        codebase: codebase as CodebaseType,
        description: activeProject.name || 'Project',
        projectId: activeProject.projectId,
        externalPackages: [],
      };
      setCurrentProject(processedProject);
      setSelectedVersion(null);
    }
  }, [codebase, activeProject]);

  useEffect(() => {
    const fetchCodeVersions = async (projectId: string) => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${projectId}/versions?walletAddress=${activeProject?.walletAddress}`
        );
        console.log('Code versions response:', response.data);

        if (response.data.versions && Array.isArray(response.data.versions)) {
          setCodeVersions(response.data.versions);
        }
      } catch (error) {
        console.error('Error fetching code versions:', error);
        toast.error('Failed to load code versions');
      }
    };

    if (activeProject?.projectId) {
      fetchCodeVersions(activeProject.projectId);
    }
  }, [activeProject]);

  useEffect(() => {
    const validateDependencies = async (
      packages: { packageName: string }[]
    ): Promise<{ [key: string]: string }> => {
      const validatedPackages: { [key: string]: string } = {};
      for (const pkg of packages) {
        // @ts-expect-error ignore type error
        const isValid: {
          status: boolean;
          name?: string;
          latestVersion?: string;
        } = await validateNpmPackage(pkg.packageName);
        if (isValid.status) {
          // @ts-expect-error ignore type error
          validatedPackages[isValid.name] = isValid.latestVersion;
        } else {
          console.warn(`Package validation failed for ${pkg.packageName}:`);
          toast.error(`Package ${pkg.packageName} not found in npm registry`);
        }
      }
      return validatedPackages;
    };
    const updateDependencies = async () => {
      const externalPackages = currentProject?.externalPackages;
      if (externalPackages) {
        const validPackages = await validateDependencies(externalPackages);
        setValidatedDependencies(validPackages);
      }
    };
    updateDependencies();
  }, [currentProject]);

  return (
    <SandpackProvider
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
          ...DEPENDENCIES.dependencies,
          ...validatedDependencies,
        },
        devDependencies: {
          ...DEPENDENCIES.devDependencies,
        },
      }}
      files={sandpackFiles}
      options={{
        visibleFiles,
        activeFile: visibleFiles.find(
          (file) => file.endsWith('.lua') || file.endsWith('App.tsx')
        ),
        externalResources: [
          'https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css',
        ],
        classes: {
          'sp-wrapper': 'h-full min-h-0',
          'sp-layout': 'h-full min-h-0 border-none',
          'sp-file-explorer':
            'min-w-[200px] max-w-[300px] w-1/4 h-full overflow-auto border-r border-border',
          'sp-code-editor': 'h-full flex-1',
          'sp-tabs': 'bg-background border-b border-border',
          'sp-preview-container': 'h-full bg-background',
          'sp-preview-iframe': 'h-full bg-black',
        },
        recompileMode: 'immediate',
        recompileDelay: 300,
      }}
    >
      <div className="flex flex-col bg-background h-full min-h-0">
        <div className="h-10 px-2 flex items-center justify-between border-b border-border shrink-0">
          <div className="inline-flex h-7 gap-1 bg-muted rounded-md p-1">
            {views.map((view) => (
              <motion.button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                disabled={isEditorDisabled()}
                className={cn(
                  'h-5 px-2 rounded flex items-center gap-1 text-xs font-medium transition-all duration-300',
                  view.className,
                  activeView === view.id
                    ? 'bg-background text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                  isEditorDisabled() && 'opacity-50 cursor-not-allowed'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <view.icon size={12} />
                {view.label}
              </motion.button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {/* Version indicator for historical codebase */}
            {selectedVersion && (
              <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-md text-xs font-medium border border-yellow-500/30 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <History size={12} />
                  <span>
                    Viewing historical version from {formatTimestamp(
                      codeVersions.find((v) => v.id === selectedVersion)?.timestamp || ''
                    )}
                  </span>
                  <button
                    onClick={() => {
                      if (activeProject?.projectId) {
                        setSelectedVersion(null);
                        // Reset to current version using the codebase prop
                        if (codebase) {
                          const latestProject: CurrentProjectType = {
                            codebase: codebase as CodebaseType,
                            description: activeProject.name || 'Project',
                            projectId: activeProject.projectId,
                            externalPackages: [],
                          };
                          setCurrentProject(latestProject);
                          console.log('Switched to latest codebase version');
                          toast.success('Loaded latest code version');
                        }
                      }
                    }}
                    className="ml-1 underline hover:no-underline"
                  >
                    Return to latest
                  </button>
                </div>
              </div>
            )}
            {/* Version control dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
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
                  className={
                    isVersionDropdownOpen
                      ? 'rotate-180 transition-transform'
                      : 'transition-transform'
                  }
                />
              </button>

              {isVersionDropdownOpen && codeVersions.length > 0 && (
                <div
                  className="absolute right-0 top-7 z-20 w-56 rounded-md border border-border bg-background shadow-lg"
                  ref={versionDropdownRef}
                >
                  <div className="px-2 py-1.5 border-b border-border">
                    <p className="text-xs text-muted-foreground">
                      {codeVersions.length === 1 
                        ? "Only one version available"
                        : `${codeVersions.length} versions, newest first`}
                    </p>
                  </div>
                  <div className="max-h-48 overflow-y-auto py-1 px-1">
                    <button
                      onClick={() => {
                        if (activeProject?.projectId) {
                          setSelectedVersion(null);
                          // Reset to current version using the codebase prop
                          if (codebase) {
                            const latestProject: CurrentProjectType = {
                              codebase: codebase as CodebaseType,
                              description: activeProject.name || 'Project',
                              projectId: activeProject.projectId,
                              externalPackages: [],
                            };
                            setCurrentProject(latestProject);
                            console.log('Switched to latest codebase version');
                            toast.success('Loaded latest code version');
                          }
                          setIsVersionDropdownOpen(false);
                        }
                      }}
                      className={cn(
                        'w-full text-left px-2 py-1.5 text-xs rounded-sm hover:bg-muted flex items-center gap-1',
                        !selectedVersion &&
                          'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      <span className="font-medium">Current (Latest Version)</span>
                    </button>

                    {/* Skip the most recent version since it's already represented by "Current" */}
                    {codeVersions.length > 1 && codeVersions.slice(1).map((version) => (
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
                        <span className="truncate">{version.description}</span>
                        <span className="text-muted-foreground shrink-0 ml-1">
                          {formatTimestamp(version.timestamp)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => onAction('runlua')}
              disabled={isEditorDisabled()}
              className={cn(
                'h-5 px-2 rounded flex items-center gap-1 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground',
                isEditorDisabled() && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RunIcon /> Run Lua
            </button>
            <SandpackDownloader
              onDownload={onAction}
              disabled={isEditorDisabled()}
            />
          </div>
        </div>

        <div className="h-full relative">
          {(isSaving || isGenerating || loading || action === 'deploy') && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-xs z-50 flex items-center justify-center">
              <div className="bg-card px-6 py-3 rounded-lg text-foreground flex items-center gap-3">
                <Loader2Icon className="animate-spin text-primary" />
                <p>
                  {loading
                    ? 'Loading code...'
                    : isSaving
                      ? 'Saving changes...'
                      : isGenerating
                        ? 'Generating code...'
                        : action === 'deploy'
                          ? 'Deploying...'
                          : 'Processing...'}
                </p>
              </div>
            </div>
          )}

          <div
            className={`h-full absolute inset-0 ${
              activeView === 'preview' ? 'invisible' : 'visible'
            }`}
          >
            <SandpackLayout className="h-full min-h-0">
              <SandpackFileExplorer />
              <div className="flex-1 min-w-0 h-full flex flex-col">
                <SandpackCodeEditor
                  showTabs={true}
                  showLineNumbers={true}
                  showInlineErrors={true}
                  wrapContent={false}
                  closableTabs={true}
                  readOnly={false}
                  showRunButton={true}
                  style={{ height: '100%', minHeight: '0', flex: '1' }}
                  extensions={[]}
                />
              </div>
            </SandpackLayout>
          </div>

          <AnimatePresence mode="wait">
            {activeView === 'preview' && (
              <motion.div
                key="preview-view"
                initial={{ transform: 'translateX(100%)' }}
                animate={{ transform: 'translateX(0%)' }}
                exit={{ transform: 'translateX(100%)' }}
                transition={{
                  duration: 0.3,
                  ease: [0.32, 0.72, 0, 1],
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                className="h-full bg-background"
              >
                <SandpackLayout className="h-full min-h-0">
                  <SandPackPreviewClient />
                </SandpackLayout>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SandpackProvider>
  );
};

export default Codeview;

const views = [
  {
    id: 'code',
    icon: CodeIcon,
    label: 'Code',
    className: 'origin-left transition-transform duration-200',
  },
  {
    id: 'preview',
    icon: EyeIcon,
    label: 'Preview',
    className: 'origin-right transition-transform duration-200',
  },
];
