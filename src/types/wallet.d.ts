interface Window {
    ethereum?: {
        request: (args: { method: string; params?: [] }) => Promise<>;
        on?: (event: string, handler: (...args: []) => void) => void;
        removeListener?: (event: string, handler: (...args: []) => void) => void;
        isMetaMask?: boolean;
    };
    arweaveWallet?: {
        connect: (permissions: string[]) => Promise<void>;
        disconnect: () => Promise<void>;
        getActiveAddress: () => Promise<string>;
        getPermissions: () => Promise<string[]>;
        sign: (transaction) => Promise<>;
        getPublicKey: () => Promise<string>;
    };
}
