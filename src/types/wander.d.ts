declare global {
  interface Window {
    arweaveWallet: ArweaveWallet;
  }

  interface WindowEventMap {
    arweaveWalletLoaded: Event;
    walletSwitch: WalletSwitchEvent;
  }
}

export interface ArweaveWallet {
  connect: (
    permissions: string[],
    appInfo?: {
      name?: string;
      logo?: string;
    },
    gateway?: {
      host: string;
      port: number;
      protocol: 'http' | 'https';
    }
  ) => Promise<void>;
  disconnect: () => Promise<void>;
  getPermissions: () => Promise<string[]>;
  getActiveAddress: () => Promise<string>;
  walletVersion: string;
  walletName: string;
  events?: {
    on: (event: string, callback: (data: unknown) => void) => () => void;
  };
  userTokens: () => Promise<[]>;
  tokenBalance: (tokenId: string) => Promise<number>;
  dispatch: (
    transaction: Transaction,
    options?: {
      saltLength?: number;
    }
  ) => Promise<DispatchResult>;
}

export interface WalletSwitchEvent extends CustomEvent {
  detail: {
    address: string;
  };
}
