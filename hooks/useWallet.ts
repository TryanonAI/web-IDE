import axios from "axios";
import { create } from "zustand";
import { ConnectionStrategies, TrialStatus, User, WalletStatus } from "@/types";
import { connectWallet, disconnectWallet, getWalletDetails, WalletConnectionResponse, WalletConnectionResult } from "@/lib/arkit";
import { toast } from "sonner";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { fetchCodeVersions, useGlobalState } from "./useGlobalState";
import { notifyNoWallet } from "./use-mobile";

const fetchOrCreateUser = async (walletAddress: string) => {
    try {
        const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/create`,
            { walletAddress }
        );

        if (!data.success) {
            throw new Error(data.message);
        }
        console.log("[useWallet:fetchOrCreateUser] fetched user data")
        return data.user;
    } catch (error) {
        throw error;
    }
}

interface State {
    user: User | null;
    connected: boolean;
    trialStatus: TrialStatus
    walletStatus: WalletStatus;
    shortAddress: string | null;
    resetWalletState: () => void;
    clearPersistedState: () => Promise<void>;
    connect: (strategy?: ConnectionStrategies) => Promise<boolean>;
    disconnect: () => Promise<void>;

    // Real-time sync methods
    checkWalletStatus: () => Promise<void>;
    syncWithWallet: () => Promise<void>;
    isWalletAvailable: () => boolean;

    // Wander DOM Events
    isWalletLoaded: boolean;
    setWalletLoaded: (loaded: boolean) => void;
    address: string | null;
    updateAddress: (address: string | null) => void;

    // jwk?: JWKInterface
    // wanderInstance: WanderConnect | null;
    // setWanderInstance: (instance: WanderConnect | null) => void
    // connectionStrategy: ConnectionStrategies | null;

    updateUser: (user: User) => void;
}


const Initial_WalletState = {
    user: null,
    address: null,
    connected: false,
    shortAddress: null,
    isWalletLoaded: false,
    trialStatus: TrialStatus.NOT_SUBMITTED,
    walletStatus: WalletStatus.DISCONNECTED,
};

export const useWallet = create<State>()(
    devtools(
        persist(
            (set, get) => ({
                ...Initial_WalletState,
                resetWalletState: () => set(Initial_WalletState),

                isWalletAvailable: () => {
                    return typeof window !== 'undefined' && !!window.arweaveWallet;
                },

                checkWalletStatus: async () => {
                    const state = get();

                    // If wallet extension is not available, disconnect
                    if (!state.isWalletAvailable()) {
                        if (state.connected) {
                            console.log('[useWallet] Wallet extension unavailable, disconnecting');
                            state.resetWalletState();
                        }
                        return;
                    }

                    try {
                        // Check if wallet has permissions
                        const permissions = await window.arweaveWallet.getPermissions();

                        if (permissions.length === 0) {
                            // No permissions means not connected
                            if (state.connected) {
                                console.log('[useWallet] No wallet permissions, disconnecting');
                                state.resetWalletState();
                                useGlobalState.getState().resetGlobalState();
                            }
                            return;
                        }

                        // Check if address changed
                        const currentAddress = await window.arweaveWallet.getActiveAddress();

                        if (currentAddress !== state.address) {
                            console.log('[useWallet] Address changed, updating state');
                            state.updateAddress(currentAddress);
                            return;
                        }

                        // If we have permissions and address matches, ensure connected state is true
                        if (!state.connected && currentAddress) {
                            console.log('[useWallet] Wallet connected externally, syncing state');
                            state.updateAddress(currentAddress);
                        }

                    } catch (error) {
                        console.error('[useWallet] Error checking wallet status:', error);
                        if (state.connected) {
                            console.log('[useWallet] Wallet error, disconnecting');
                            state.resetWalletState();
                            useGlobalState.getState().resetGlobalState();
                        }
                    }
                },

                syncWithWallet: async () => {
                    const state = get();

                    if (!state.isWalletAvailable()) {
                        return;
                    }

                    try {
                        const permissions = await window.arweaveWallet.getPermissions();

                        if (permissions.length > 0) {
                            const address = await window.arweaveWallet.getActiveAddress();
                            if (address && address !== state.address) {
                                state.updateAddress(address);
                            }
                        }
                    } catch (error) {
                        console.error('[useWallet] Error syncing with wallet:', error);
                    }
                },

                setWalletLoaded: (loaded) => set({ isWalletLoaded: loaded }),
                updateAddress: (address: string | null) => {
                    set({
                        address,
                        shortAddress: address ? address.slice(0, 5) + "..." + address.slice(-5) : null,
                    });

                    // If address exists, fetch user data and refresh global state
                    if (address) {
                        (async () => {
                            try {
                                const userData = await fetchOrCreateUser(address);
                                set({
                                    user: userData,
                                    trialStatus: userData.trialStatus,
                                    connected: true,
                                    walletStatus: WalletStatus.CONNECTED
                                });

                                // Refresh global state with new wallet address
                                await useGlobalState.getState().refreshGlobalState();
                            } catch (error) {
                                console.error('[useWallet] Error updating user data after address change:', error);
                                toast.error('Failed to update user data after wallet switch');
                            }
                        })();
                    } else {
                        // Reset states when address is null
                        set({
                            user: null,
                            connected: false,
                            walletStatus: WalletStatus.DISCONNECTED,
                            trialStatus: TrialStatus.NOT_SUBMITTED
                        });

                        // Reset global state
                        useGlobalState.getState().resetGlobalState();
                    }
                },
                clearPersistedState: async () => {
                    useWallet.persist.clearStorage();
                },
                connect: async () => {
                    set({ walletStatus: WalletStatus.CONNECTING })
                    useGlobalState.getState().setIsLoading(true);
                    // get().resetWalletState();
                    const connectionResult: WalletConnectionResponse = await connectWallet();
                    console.log('[useWallet] connectionResult:', connectionResult);
                    switch (connectionResult.status) {
                        case WalletConnectionResult.CONNECTED:
                            const details: { walletAddress: string; } = await getWalletDetails();
                            set({ shortAddress: details.walletAddress.slice(0, 5) + "..." + details.walletAddress.slice(-5) })

                            try {
                                console.log("[useWallet] UserData Checking")
                                const userData: User = await fetchOrCreateUser(
                                    details.walletAddress
                                );
                                if (!userData) {
                                    throw new Error('Failed to fetch or create user');
                                }
                                console.log("[useWallet:connect] fetched user data")
                                set({ address: details.walletAddress, walletStatus: WalletStatus.CONNECTED, user: userData, trialStatus: userData.trialStatus, connected: true })

                                const activeProject = useGlobalState.getState().activeProject;

                                if (activeProject) {
                                    console.log("[useWallet:connect] active project found")
                                    useGlobalState.setState({
                                        projects: userData.projects,
                                        activeProject: activeProject,
                                        codebase: activeProject.codebase,
                                        chatMessages: activeProject.messages,
                                        deploymentUrl: activeProject.deploymentUrl,
                                        dependencies: activeProject.externalPackages as Record<string, string>,
                                        codeVersions: await fetchCodeVersions(activeProject.projectId, details.walletAddress),
                                    })
                                } else {
                                    const newProject = userData.projects.reverse()[0]
                                    useGlobalState.setState({
                                        projects: userData.projects,
                                        activeProject: newProject,
                                        codebase: newProject?.codebase || {},
                                        chatMessages: newProject?.messages || [],
                                        deploymentUrl: newProject?.deploymentUrl || '',
                                        dependencies: newProject?.externalPackages as Record<string, string> || {},
                                        // codeVersions: await fetchCodeVersions(newProject.projectId, details.walletAddress),
                                    })
                                }

                                set({ walletStatus: WalletStatus.CONNECTED })
                                useGlobalState.getState().setIsLoading(false);
                                useGlobalState.setState({ error: null });
                                return true;
                            } catch (error) {
                                console.error('[useWallet] Error creating/fetching user:', error);
                                if (axios.isAxiosError(error) && error.response?.status === 400) {
                                    toast.error(error.response?.data.message);
                                    useGlobalState.getState().setIsLoading(false);
                                    return false;
                                }
                                set({ walletStatus: WalletStatus.DISCONNECTED })
                                useGlobalState.getState().setIsLoading(false);
                                return false;
                            }

                        case WalletConnectionResult.USER_CANCELLED:
                            console.log('[useWallet] User cancelled the wallet connection');
                            toast.error('You declined the wallet connection');
                            get().resetWalletState();
                            useGlobalState.getState().setIsLoading(false);
                            return false;
                        case WalletConnectionResult.WALLET_NOT_FOUND:
                            useGlobalState.getState().setIsLoading(false);
                            notifyNoWallet();
                            return false;
                        case WalletConnectionResult.ERROR:
                            useGlobalState.getState().setIsLoading(false);
                            get().resetWalletState();
                            get().resetWalletState();
                            return false;
                        default:
                            useGlobalState.getState().setIsLoading(false);
                            throw (
                                connectionResult.error ||
                                new Error(
                                    connectionResult.message || 'Unknown wallet connection error'
                                )
                            );
                    }
                },
                disconnect: async () => {
                    const state = get();
                    // console.log("[useWallet] state before disconnecting wallet:\n", state);
                    await disconnectWallet();
                    await state.clearPersistedState();
                    state.resetWalletState();
                    // console.log("[useWallet] state after disconnecting wallet:\n", get());
                },
                // jwk: undefined,
                // wanderInstance: null,
                // connectionStrategy: null,
                // setWanderInstance: (instance: WanderConnect | null) => set({ wanderInstance: instance }),
                updateUser: (user: User) => set({ user }),
            }),
            {
                name: 'wallet-storage',
                storage: createJSONStorage(() => localStorage),
            }
        )
    )
);

// Auto-sync wallet status periodically and on events
if (typeof window !== 'undefined') {
    // Check wallet status every 5 seconds
    // setInterval(() => {
    //     const state = useWallet.getState();
    //     state.checkWalletStatus();
    // }, 5000);

    // Listen to wallet events
    const handleWalletLoaded = () => {
        console.log('[useWallet] Wallet loaded event');
        const state = useWallet.getState();
        state.setWalletLoaded(true);
        setTimeout(() => state.syncWithWallet(), 100);
    };

    const handleWalletSwitch = (event: CustomEvent) => {
        console.log('[useWallet] Wallet switch event', event.detail);
        const state = useWallet.getState();
        const { address } = event.detail;
        console.log(event)
        if (address !== state.address) {
            state.updateAddress(address);
            toast.info(`Wallet switched to ${address?.slice(0, 5)}...${address?.slice(-5)}`);
        }
    };

    const handleVisibilityChange = () => {
        if (!document.hidden) {
            // When tab becomes visible, check wallet status
            setTimeout(() => {
                const state = useWallet.getState();
                state.checkWalletStatus();
            }, 100);
        }
    };

    // Add event listeners
    window.addEventListener('arweaveWalletLoaded', handleWalletLoaded);
    window.addEventListener('walletSwitch', handleWalletSwitch);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial sync when the module loads
    setTimeout(() => {
        const state = useWallet.getState();
        if (state.connected) {
            state.checkWalletStatus();
        }
    }, 1000);
}

