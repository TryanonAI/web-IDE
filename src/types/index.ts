export interface CurrentProject {
  codebase: Record<string, string>;
  externalPackages: { packageName: string; packageVersion: string }[];
  projectId: string;
}

export interface FileData {
  code?: string;
  filePath?: string;
}

export interface NestedFileObject {
  [key: string]: FileData;
}

export interface CodeFile {
  filePath?: string;
  code?: string;
  [key: string]: unknown;
}

export interface StatusTimelineEvent {
  id: string;
  message: string;
  timestamp: number;
}

export interface RequestAccessResponse {
  success: boolean;
  message: string;
  user?: {
    userId: string;
    walletAddress: string;
    trialStatus: TrialStatus;
    username: string;
    email?: string;
  };
}

export interface RequestAccessForm {
  name: string;
  email: string;
  walletAddress: string;
}

export interface User {
  id: string;
  userId: string; // wallet address
  username: string;
  email?: string;
  avatarUrl?: string;
  walletAddress: string;
  trialStatus: TrialStatus;
  plan: Plan;
  tokens: number;
  projects: Project[];
  createdAt: string;
  updatedAt: string;
}

export type Project = {
  id: number;
  title: string;
  processId: string;
  projectId: string;
  messages: ChatMessage[];
  favorite: boolean;
  privacy: Privacy;
  creatorId: string;
  creator?: User; // optional if not populated
  deploymentUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  framework: Framework;
  versions: number;
  externalPackages: Record<string, string>;
  codebase: CodebaseType;
}

export type ChatMessage = {
  id: number;
  messageId: string;
  role: Role;
  content: string;
  projectId: string;
  project: Project;
  createdAt: string;
  updatedAt: string;
  isLoading?: boolean;
  isStreaming?: boolean;
}

export type Commit = {
  id: string;
  hash: string;
  date: string;
  url?: string;
  author: string;
  message: string;
};

export type CodeVersion = {
  id: number;
  timestamp: string;
  description: string;
};

export type CodebaseType = Record<string, string | FileData> | FileData[] | FileData | string;


export const Role = {
  system: 'system',
  user: 'user',
  model: 'model',
} as const;

export type Role = typeof Role[keyof typeof Role];

export const Plan = {
  Free: 'free',
  Pro: 'pro',
  Enterprise: 'enterprise',
} as const;

export type Plan = typeof Plan[keyof typeof Plan];

export const Privacy = {
  Public: 'public',
  Private: 'private',
} as const;

export type Privacy = typeof Privacy[keyof typeof Privacy];

export const Framework = {
  React: 'React',
  Html: 'Html',
} as const;

export type Framework = typeof Framework[keyof typeof Framework];

export const WalletStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
} as const;

export type WalletStatus = typeof WalletStatus[keyof typeof WalletStatus];

export const ConnectionStrategies = {
  ArWallet: 'ar_wallet',
  WanderConnect: 'wander_connect',
  JWK: 'jwk',
} as const;

export type ConnectionStrategies = typeof ConnectionStrategies[keyof typeof ConnectionStrategies];

export const SandpackAction = {
  PREVIEW: 'preview',
  DEPLOY: 'deploy',
  EXPORT: 'export',
} as const;

export type SandpackAction = typeof SandpackAction[keyof typeof SandpackAction];

export const TrialStatus = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  APPROVED: 'approved'
} as const;

export type TrialStatus = typeof TrialStatus[keyof typeof TrialStatus];

// Common Types
export interface BaseResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// API Types
export interface ApiConfig {
  baseURL: string;
  headers?: Record<string, string>;
}

// Component Props Types
export interface LayoutProps {
  children: React.ReactNode;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};