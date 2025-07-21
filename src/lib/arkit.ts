// arlocal-dev
// export const HOST_NAME = 'localhost';
// export const PORT_NUM = 1984;
// export const PROTOCOL_TYPE = 'http';
// export const CU_URL = `${'http'}://${'localhost'}:6363`;

import axios from 'axios';
import Arweave from 'arweave';
import type { JWKInterface } from 'arweave/node/lib/wallet';
import { toast } from 'sonner';
import type { Project } from '@/types';

// config constants
export const PROTOCOL_TYPE = 'https';
export const HOST_NAME = 'arweave.net';
export const PORT_NUM = 443;
export const CU_URL = 'https://cu.arnode.asia';
export const MODE = 'legacy';


export const GATEWAY_URL = `${PROTOCOL_TYPE}://${HOST_NAME}:${PORT_NUM}`;
export const GRAPHQL_URL = `${'https'}://${'arweave.net'}:${443}/graphql`;

// export const AOModule = 'Do_Uc2Sju_ffp6Ev0AnLVdPtot15rvMjP-a9VVaA5fM'; //regular-module on arweave
export const AOModule = '33d-3X8mpv6xYBlVB-eXMrPfH5Kzf6Hiwhcv0UA10sw'; // sqlite-module on arweave
export const AOScheduler = '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA';

// Types
export interface DispatchResult {
  id: string;
  type?: 'BASE' | 'BUNDLED';
}

export interface Tag {
  name: string;
  value: string;
}

export interface WalletDetails {
  walletAddress: string;
  balance?: number;
}

interface GraphQLEdge {
  cursor: string;
  node: {
    id: string;
    recipient: string;
    block?: {
      timestamp: number;
      height: number;
    };
    tags: { name: string; value: string }[];
    data: { size: string; type?: string };
    owner: { address: string };
  };
}

interface MessageResponse {
  id: string;
  recipient: string;
  tags: { name: string; value: string }[];
  // @ts-expect-error ignore
  data;
  owner: string;
}

// Common tags used across the application
export const CommonTags: Tag[] = [
  { name: 'Name', value: 'Anon' },
  { name: 'Version', value: '2.0.0' },
  { name: 'Authority', value: 'fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY' },
  { name: 'Scheduler', value: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA' },
];

// GraphQL base query
const baseData = {
  query: "query ($entityId: String!, $limit: Int!, $sortOrder: SortOrder!, $cursor: String) { transactions(sort: $sortOrder first: $limit after: $cursor recipients: [$entityId] ingested_at: {min: 1696107600}) { count edges { cursor node { id recipient block { timestamp height } tags { name value } data { size } owner { address } } } } }",
  variables: {
    cursor: '',
    entityId: '',
    limit: 25,
    sortOrder: 'HEIGHT_DESC',
  },
};

// GraphQL operations
export const fetchGraphQL = async ({
  query,
  variables,
}: {
  query: string;
  variables: {
    cursor: string;
    entityId: string;
    limit: number;
    sortOrder: string;
  };
}) => {
  try {
    console.log('Fetching GraphQL data...');
    const response = await axios.post(GRAPHQL_URL, { query, variables });
    return response.data;
  } catch (error) {
    console.error('GraphQL fetch error:', error);
    throw error;
  }
};

// Message operations
export const fetchMessagesAR = async ({
  process,
}: {
  process: string;
}): Promise<MessageResponse[]> => {
  try {
    console.log('Fetching messages for process:', process);
    baseData.variables.entityId = process;

    const res = await fetchGraphQL({
      query: baseData.query,
      variables: baseData.variables,
    });

    const messages = res.data.transactions.edges.map((m: GraphQLEdge) => ({
      id: m.node.id,
      recipient: m.node.recipient,
      tags: m.node.tags,
      data: m.node.data,
      owner: m.node.owner.address,
    }));

    const detailed = await Promise.all(
      messages.map(async (m: MessageResponse) => {
        try {
          const res = await axios.get(`${GATEWAY_URL}/${m.id}`);
          return { ...m, data: res.data };
        } catch (error) {
          console.error(`Failed to fetch message ${m.id}:`, error);
          return null;
        }
      })
    );

    return detailed.filter((item): item is MessageResponse => item !== null);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    throw error;
  }
};

export const messageAR = async ({
  tags = [],
  data = '',
  process,
}: {
  tags?: Tag[];
  data?: string;
  process: string;
}): Promise<string> => {
  if (typeof window === 'undefined') {
    throw new Error('Cannot send message in non-browser environment');
  }
  // Dynamically import aoconnect functions
  const { connect, createSigner } = await import('@permaweb/aoconnect');

  const ao = connect({
    GATEWAY_URL,
    GRAPHQL_URL,
    MODE,
    CU_URL,
  });
  try {
    console.log('Sending message to process:', process);
    if (!process) throw new Error('Process ID is required.');

    const allTags = [...CommonTags, ...tags];
    const messageId = await ao.message({
      data,
      process,
      tags: allTags,
      signer: createSigner(window.arweaveWallet),
    });

    console.log('Message sent successfully:', messageId);
    return messageId;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Process operations
export const spawnProcess = async (
  name: string,
  tags: Tag[] = [],
  data?: string
): Promise<string> => {
  if (typeof window === 'undefined') {
    throw new Error('Cannot spawn process in non-browser environment');
  }
  // Dynamically import aoconnect functions
  const { connect, createSigner } = await import('@permaweb/aoconnect');
  const ao = connect({
    GATEWAY_URL,
    GRAPHQL_URL,
    MODE,
    CU_URL,

  });
  console.log('Spawning new process...');
  const allTags = [...CommonTags, ...tags];
  if (name) allTags.push({ name: 'Name', value: name });

  try {
    const processId = await ao.spawn({
      module: AOModule,
      scheduler: AOScheduler,
      signer: createSigner(window.arweaveWallet),
      tags: allTags,
      data: data
    });
    console.log('processId', processId);

    console.log('Process spawned successfully:', processId);
    return processId;
  } catch (error) {
    console.error('Spawn process error:', error);
    throw error;
  }
};

// Transaction operations
export const transactionAR = async ({
  data,
}: {
  data: string;
}): Promise<DispatchResult> => {
  if (typeof window === 'undefined' || !window.arweaveWallet) {
    throw new Error('Wallet connection required in browser environment');
  }
  const arweave = Arweave.init({
    host: HOST_NAME,
    port: PORT_NUM,
    protocol: PROTOCOL_TYPE,
  });

  try {
    console.log('Creating transaction...');
    // connectWallet should ideally be called beforehand via useAuth().login()

    const transaction = await arweave.createTransaction({ data });
    // Assuming dispatch is available after connection
    const signed: DispatchResult =
      await window.arweaveWallet.dispatch(transaction);
    console.log('Transaction signed and dispatched:', signed);
    return signed;
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
};

// Lua operations
export async function runLua({
  code,
  process,
  tags = [],
}: {
  code: string;
  process: string;
  tags?: Tag[];
}): Promise<Record<string, unknown> & { id: string }> {
  if (typeof window === 'undefined') {
    throw new Error('Cannot run Lua in non-browser environment');
  }
  // Dynamically import aoconnect functions
  const { connect, createSigner } = await import('@permaweb/aoconnect');
  const ao = connect({
    GATEWAY_URL,
    GRAPHQL_URL,
    MODE,
    CU_URL,

  });
  try {
    console.log('Running Lua code...');
    const finalTags = [
      ...CommonTags,
      ...tags,
      { name: 'Action', value: 'Eval' },
    ];

    const messageId: string = await ao.message({
      process,
      data: code,
      signer: createSigner(window.arweaveWallet),
      tags: finalTags,
    });

    // const messageResult: {
    //   // @ts-expect-error ignore
    //   Output
    //   // @ts-expect-error ignore
    //   Messages
    //   // @ts-expect-error ignore
    //   Spawns
    //   // @ts-expect-error ignore
    //   Error
    // } = await ao.result({
    //   process,
    //   message: messageId,
    // });

    const finalResult = { id: messageId };
    // console.log('messageResult', messageResult);
    console.log('Lua execution completed:', finalResult);
    return finalResult;
  } catch (error) {
    console.error('Lua execution error:', error);
    throw error;
  }
}

// Handler operations
export async function readHandler({
  process,
  action,
  tags = [],
  data,
}: {
  process: string;
  action: string;
  tags?: Tag[];
  data?: Record<string, unknown>;
}): Promise<Record<string, unknown> | null> {
  // Dynamically import aoconnect connect
  const { connect } = await import('@permaweb/aoconnect');
  const ao = connect({
    GATEWAY_URL,
    GRAPHQL_URL,
    MODE,
    CU_URL,

  })
  try {
    console.log('Reading handler using legacy dryrun...');
    const allTags = [{ name: 'Action', value: action }, ...tags];
    const newData = JSON.stringify(data || {});

    const response = await ao.dryrun({
      process,
      data: newData,
      tags: allTags,
    });

    const message = response.Messages?.[0];
    if (message?.Data) {
      try {
        return JSON.parse(message.Data);
      } catch (parseError) {
        console.error('Error parsing message data:', parseError);
        return { rawData: message.Data };
      }
    }
    if (message?.Tags) {
      return message.Tags.reduce(
        (acc: Record<string, string>, { name, value }: Tag) => {
          acc[name] = value;
          return acc;
        },
        {}
      );
    }
    console.warn('Read handler dryrun returned no data or tags:', response);
    return null;
  } catch (error) {
    console.error('Read handler error:', error);
    throw error;
  }
}

// Wallet operations
export const useQuickWallet = async (): Promise<{
  key: JWKInterface;
  address: string;
}> => {
  // This function seems okay as Arweave.init might be safe server-side
  const arweave = Arweave.init({
    host: HOST_NAME,
    port: PORT_NUM,
    protocol: PROTOCOL_TYPE,
  });
  try {
    console.log('Generating quick wallet...');
    const key: JWKInterface = await arweave.wallets.generate();
    const address = await arweave.wallets.jwkToAddress(key);
    console.log('Quick wallet generated:', address);
    return { key, address };
  } catch (error) {
    console.error('Quick wallet error:', error);
    throw error;
  }
};

/*
export async function connectWallet(): Promise<string | undefined> {
  if (typeof window === 'undefined' || !window.arweaveWallet) {
    console.error(
      'Cannot connect wallet in non-browser environment or wallet not found'
    );
    return;
  }
  try {
    console.log('Connecting wallet...');
    // No need for explicit check again, done above

    await window.arweaveWallet.connect(
      [
        'ENCRYPT',
        'DECRYPT',
        'DISPATCH',
        'SIGNATURE',
        'ACCESS_TOKENS',
        'ACCESS_ADDRESS',
        'SIGN_TRANSACTION',
        'ACCESS_PUBLIC_KEY',
        'ACCESS_ALL_ADDRESSES',
        'ACCESS_ARWEAVE_CONFIG',
      ],
      {
        name: 'Anon',
        logo: 'https://arweave.net/pYIMnXpJRFUwTzogx_z5HCOPRRjCbSPYIlUqOjJ9Srs',
      },
      {
        host: HOST_NAME,
        port: PORT_NUM,
        protocol: PROTOCOL_TYPE,
      }
    );

    console.log('Wallet connected successfully');
    return 'connected wallet successfully';
  } catch (error) {
    if (error === 'User cancelled the AuthRequest') {
      // console.log('User cancelled the AuthRequest');
      return 'User cancelled the AuthRequest';
    }
    console.error('Connect wallet error:', error);
    throw error;
  }
}
*/


export const WalletConnectionResult = {
  ERROR: 'error',
  CONNECTED: 'connected',
  USER_CANCELLED: 'cancelled',
  WALLET_NOT_FOUND: 'wallet not found'
} as const;

export type WalletConnectionResult = typeof WalletConnectionResult[keyof typeof WalletConnectionResult];

export interface WalletConnectionResponse {
  status: WalletConnectionResult;
  message: string;
  error?: Error;
}


export async function connectWallet(): Promise<WalletConnectionResponse> {
  if (typeof window === 'undefined') {
    return {
      status: WalletConnectionResult.ERROR,
      message: 'Cannot connect wallet in non-browser environment'
    };
  }
  if (!window.arweaveWallet) {
    return {
      status: WalletConnectionResult.WALLET_NOT_FOUND,
      message: 'Arweave Wallet not found'
    };
  }

  try {
    console.log('Connecting wallet...');

    await window.arweaveWallet.connect(
      [
        'ENCRYPT',
        'DECRYPT',
        'DISPATCH',
        'SIGNATURE',
        // 'ACCESS_TOKENS',
        'ACCESS_ADDRESS',
        'SIGN_TRANSACTION',
        'ACCESS_PUBLIC_KEY',
        'ACCESS_ALL_ADDRESSES',
        'ACCESS_ARWEAVE_CONFIG',
      ],
      {
        name: 'Anon',
        logo: 'https://arweave.net/pYIMnXpJRFUwTzogx_z5HCOPRRjCbSPYIlUqOjJ9Srs',
      },
      {
        host: HOST_NAME,
        port: PORT_NUM,
        protocol: PROTOCOL_TYPE,
      }
    );

    console.log('Wallet connected successfully');
    return {
      status: WalletConnectionResult.CONNECTED,
      message: 'Connected wallet successfully'
    };

  } catch (error) {
    // More robust check for user cancellation
    console.log('[arkit.ts] errorMessage', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.toLowerCase().includes('cancel') ||
      errorMessage.toLowerCase().includes('rejected') ||
      errorMessage.toLowerCase().includes('denied')) {
      console.log('User cancelled the wallet connection request');
      return {
        status: WalletConnectionResult.USER_CANCELLED,
        message: 'User cancelled the connection request'
      };
    }

    console.error('Connect wallet error:', error);
    return {
      status: WalletConnectionResult.ERROR,
      message: 'Failed to connect wallet',
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

export async function disconnectWallet(): Promise<void> {
  if (typeof window === 'undefined' || !window.arweaveWallet) {
    console.error(
      'Cannot disconnect wallet in non-browser environment or wallet not found'
    );
    return;
  }
  try {
    console.log('Disconnecting wallet...');
    await window.arweaveWallet.disconnect();
    console.log('Wallet disconnected successfully');
  } catch (error) {
    console.error('Disconnect wallet error:', error);
    throw error;
  }
}

export async function getWalletDetails(): Promise<WalletDetails> {
  if (typeof window === 'undefined' || !window.arweaveWallet) {
    throw new Error(
      'Cannot get wallet details in non-browser environment or wallet not found'
    );
  }
  try {
    // const arweave = Arweave.init({
    //   host: HOST_NAME,
    //   port: PORT_NUM,
    //   protocol: PROTOCOL_TYPE,
    // });
    const walletAddress = await window.arweaveWallet.getActiveAddress();
    // const balance = await arweave.wallets
    //   .getBalance(walletAddress)
    //   .then((balanceRaw) => {
    //     const balance = arweave.ar.winstonToAr(balanceRaw);
    //     return Number(balance);
    //   });
    return { walletAddress };
  } catch (error) {
    console.error('Get wallet details error:', error);
    throw error;
  }
}

export const handleRunLua = async ({
  project,
  luaCodeToBeEval,
}: {
  project: Project;
  luaCodeToBeEval: string;
}) => {
  // let luaCodeToBeEval = '';
  // if (!codebase) {
  //   toast.error('No codebase found in the project.');
  //   return;
  // }
  // luaCodeToBeEval = codebase['/src/lua/index.lua'] as string;
  if (!luaCodeToBeEval) {
    toast.error('No Lua code found in the project.');
    return;
  }
  console.log('lua code found');

  if (typeof window === 'undefined' || !window.arweaveWallet) {
    toast.error(
      "Arweave wallet not available. Please ensure it's installed and connected."
    );
    return;
  }

  if (!project?.projectId) {
    toast.error('No valid process ID found for this project.');
    return;
  }

  try {
    const { connect } = await import('@permaweb/aoconnect');
    const ao = connect({
      MODE: 'legacy',
      CU_URL: 'https://cu.arnode.asia',
      GATEWAY_URL: 'https://arweave.net',
      GRAPHQL_URL: 'https://arweave.net/graphql',
    });

    const luaResult = await runLua({
      process: project.projectId,
      code: luaCodeToBeEval,
      tags: [
        {
          name: 'Description',
          value: `${project.title || 'project title'}`,
        },
      ],
    });

    console.log('Message ID:', luaResult.id);

    const result = await ao.result({
      process: project?.projectId || '',
      message: luaResult.id,
    });
    console.log('[Codeview.ts] Lua result:', result);

    // toast.success('Lua code executed successfully');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    toast.error('Error executing Lua code: ' + errorMessage);
    console.error('Lua execution error:', error);
  }
};



// -------------- WALLET CONNECTION TYPES ---------------

// switch (strategy) {
//   case ConnectionStrategies.JWK: {
//       const state = get();
//       if (state.wanderInstance) {
//           state.wanderInstance.destroy();
//           set({ wanderInstance: null, connectionStrategy: null });
//       }
//       const jwk = JSON.parse(getLocalStorageValue("anon-jwk") || "{}");
//       const requiredKeys = ["kty", "e", "n", "d", "p", "q", "dp", "dq", "qi"];
//       const allKeysPresent = requiredKeys.every(key => jwk[key]);
//       if (!allKeysPresent) {
//           throw new Error("Missing required keys");
//       }
//       const ar = new Arweave({});
//       const addr = await ar.wallets.getAddress(jwk);
//       if (addr) {
//           console.log("connecting to", addr);
//           const d = {
//               address: addr,
//               shortAddress: addr.slice(0, 5) + "..." + addr.slice(-5),
//               connected: true,
//               connectionStrategy: ConnectionStrategies.JWK,
//               jwk: jwk
//           }
//           set(d)
//           setLocalStorageValue("anon-conn-strategy", JSON.stringify(ConnectionStrategies.JWK));
//           return d as State;
//       }
//       else {
//           throw new Error("Failed to get address");
//       }
//   };
//   case ConnectionStrategies.ArWallet: {
//       const state = get();
//       if (state.wanderInstance) {
//           state.wanderInstance.destroy();
//           set({ wanderInstance: null, connectionStrategy: null });
//       }
//       console.log("Connecting to Arweave wallet");
//       await window.arweaveWallet.connect(["SIGN_TRANSACTION", "ACCESS_ADDRESS", "ACCESS_PUBLIC_KEY"]);
//       const address = await window.arweaveWallet.getActiveAddress();
//       const shortAddress = address.slice(0, 5) + "..." + address.slice(-5);
//       window.addEventListener("walletSwitch", (e) => {
//           const addr = e.detail.address;
//           const shortAddr = addr.slice(0, 5) + "..." + addr.slice(-5);
//           set({
//               address: addr,
//               shortAddress: shortAddr,
//               connected: true,
//               connectionStrategy: ConnectionStrategies.ArWallet
//           });
//       })
//       set({
//           address,
//           shortAddress: shortAddress,
//           connected: true,
//           connectionStrategy: ConnectionStrategies.ArWallet
//       });
//       setLocalStorageValue("anon-conn-strategy", JSON.stringify(ConnectionStrategies.ArWallet));
//       return { address, shortAddress, connected: true, connectionStrategy: ConnectionStrategies.ArWallet } as State;
//   };
//   case ConnectionStrategies.WanderConnect: {
//       // todo
//       const state = get();
//       if (state.wanderInstance) {
//           state.wanderInstance.open()
//       }
//       else {
//           const wander = new WanderConnect({
//               clientId: "FREE_TRIAL",
//               button: {
//                   position: "static",
//                   theme: "dark"
//               },

//               onAuth: async (userDetails) => {
//                   console.log(userDetails)
//                   if (!!userDetails) {
//                       try {
//                           await window.arweaveWallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION", "ACCESS_PUBLIC_KEY"]);
//                           const addy = await window.arweaveWallet.getActiveAddress();
//                           const shortAddr = addy.slice(0, 5) + "..." + addy.slice(-5);
//                           const d = {
//                               address: addy,
//                               shortAddress: shortAddr,
//                               connected: true,
//                               connectionStrategy: ConnectionStrategies.WanderConnect
//                           }
//                           set(d);
//                           setLocalStorageValue("anon-conn-strategy", JSON.stringify(ConnectionStrategies.WanderConnect));
//                           return Promise.resolve(d);
//                       } catch (e) {
//                           console.error("Error", e);
//                       }
//                   }
//               }
//           })
//           set({ wanderInstance: wander, connectionStrategy: ConnectionStrategies.WanderConnect });
//           wander.open();
//       }
//       break;
//   }
// }

// -------------- WALLET DISCONNECTION TYPES ---------------

// switch (state.connectionStrategy) {
//   case ConnectionStrategies.JWK: {
//       removeLocalStorageValue("anon-jwk");
//       break;
//   }
//   case ConnectionStrategies.ArWallet: {
//       await window.arweaveWallet.disconnect();
//       set({ address: null, shortAddress: null, connected: false, connectionStrategy: null });
//       window.removeEventListener("walletSwitch", () => { });
//       break;
//   }
//   case ConnectionStrategies.WanderConnect: {
//       if (state.wanderInstance) {
//           state.wanderInstance.destroy();
//       }
//       set({ wanderInstance: null, connectionStrategy: null });
//       break;
//   }
// }
// setLocalStorageValue("anon-conn-strategy", JSON.stringify(null));
// window.location.reload();