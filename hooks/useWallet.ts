import axios from "axios";
import { create } from "zustand";
import { ConnectionStrategies, TrialStatus, User, WalletStatus } from "@/types";
import { connectWallet, disconnectWallet, getWalletDetails, WalletConnectionResponse, WalletConnectionResult } from "@/lib/arkit";
import { toast } from "sonner";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { useGlobalState } from "./useGlobalState";
import { notifyNoWallet } from "./use-mobile";
const fetchOrCreateUser = async (walletAddress: string) => {
    try {
        const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/create`,
            { walletAddress }
        );
        console.log("[use-wallet]fetched response:", data);

        if (!data.success) {
            throw new Error(data.message);
        }

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
                    useGlobalState.getState().setIsLoading(true);
                    // get().resetWalletState();
                    const connectionResult: WalletConnectionResponse = await connectWallet();
                    console.log('[useWallet] connectionResult:', connectionResult);
                    switch (connectionResult.status) {
                        case WalletConnectionResult.CONNECTED:
                            const details: { walletAddress: string; } = await getWalletDetails();
                            set({ shortAddress: details.walletAddress.slice(0, 5) + "..." + details.walletAddress.slice(-5) })

                            try {
                                const userData: User = await fetchOrCreateUser(
                                    details.walletAddress
                                );

                                console.log("[useWallet] userData:", userData)
                                if (!userData) {
                                    throw new Error('Failed to fetch or create user');
                                }
                                console.log('Setting user data in state:', userData);

                                set({ address: details.walletAddress, walletStatus: WalletStatus.CONNECTED, user: userData, trialStatus: userData.trialStatus, connected: true })

                                useGlobalState.getState().setIsLoading(false);
                                return true;
                            } catch (error) {
                                console.error('[useWallet] Error creating/fetching user:', error);
                                if (axios.isAxiosError(error) && error.response?.status === 400) {
                                    toast.error(error.response?.data.message);
                                    useGlobalState.getState().setIsLoading(false);
                                    return false;
                                }
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
                    console.log("[useWallet] state before disconnecting wallet:\n", state);
                    await disconnectWallet();
                    await state.clearPersistedState();
                    state.resetWalletState();
                    console.log("[useWallet] state after disconnecting wallet:\n", get());
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

