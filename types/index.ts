export interface CurrentProject {
  codebase: Record<string, string>;
  description: string;
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
  projects: ActiveProject[];
  createdAt: string;
  updatedAt: string;
}

export type ActiveProject = {
  id: number;
  title: string;
  processId: string;
  projectId: string;
  messages: Message[];
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
}

export type Message = {
  id: number;
  messageId: string;
  role: Role;
  content: string;
  projectId: string;
  project?: ActiveProject; // optional if not populated
  createdAt: string;
  updatedAt: string;
}

export type ChatMessage = {
  id: string | number;
  messageId: string;
  projectId: string;
  createdAt: string; // ISO format
  updatedAt: string; // ISO format
  role: 'user' | 'model';
  content: string | {
    description: string;
    codebase: Record<string, string>;
    externalPackages: { packageName: string; packageVersion: string }[];
  };
  isLoading?: boolean;
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


export enum Role {
  System = 'system',
  User = 'user',
  Model = 'model',
}

export enum Plan {
  Free = 'free',
  Pro = 'pro',
  Enterprise = 'enterprise',
}

export enum Privacy {
  Public = 'public',
  Private = 'private',
}

export enum Framework {
  React = 'React',
  Html = 'Html',
}

export enum WalletStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

export enum ConnectionStrategies {
  ArWallet = 'ar_wallet',
  WanderConnect = 'wander_connect',
  JWK = 'jwk',
}

export enum SandpackAction {
  PREVIEW = 'preview',
  DEPLOY = 'deploy',
  EXPORT = 'export',
}

export enum TrialStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  APPROVED = 'approved'
}