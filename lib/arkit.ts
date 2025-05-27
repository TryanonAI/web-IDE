import axios from 'axios';
import Arweave from 'arweave';
import type { JWKInterface } from 'arweave/node/lib/wallet';

// config constants
export const PROTOCOL_TYPE = 'https';
export const HOST_NAME = 'arweave.net';
export const PORT_NUM = 443;
export const CU_URL = 'https://cu6466.ao-testnet.xyz';
export const MODE = 'legacy';

// arlocal-dev
// export const HOST_NAME = 'localhost';
// export const PORT_NUM = 1984;
// export const PROTOCOL_TYPE = 'http';
// export const CU_URL = `${'http'}://${'localhost'}:6363`;

export const GATEWAY_URL = `${PROTOCOL_TYPE}://${HOST_NAME}:${PORT_NUM}`;
export const GRAPHQL_URL = `${'https'}://${'arnode.asia'}:${443}/graphql`;

// export const AOModule = 'Do_Uc2Sju_ffp6Ev0AnLVdPtot15rvMjP-a9VVaA5fM'; 
// // regular-module on arweave
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

export interface GraphQLEdge {
  node: {
    id: string;
    ingested_at: number;
    recipient: string;
    block: {
      timestamp: number;
      height: number;
    };
    tags: Tag[];
    data: { size: number };
    owner: { address: string };
  };
}

export interface MessageResponse {
  id: string;
  recipient: string;
  tags: Tag[];
  data: string;
  owner: string;
  ingested_at: number;
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
  query: `
    query ($entityId: String!, $limit: Int!, $sortOrder: SortOrder!, $cursor: String) {
      transactions(
        sort: $sortOrder
        first: $limit
        after: $cursor
        recipients: [$entityId]
        ingested_at: {min: 1696107600}
      ) {
        count
        edges {
          cursor
          node {
            id
            ingested_at
            recipient
            block {
              timestamp
              height
            }
            tags {
              name
              value
            }
            data {
              size
            }
            owner {
              address
            }
          }
        }
      }
    }
  `,
  variables: {
    cursor: '',
    entityId: '',
    limit: 25,
    sortOrder: 'INGESTED_AT_DESC',
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
      ingested_at: m.node.ingested_at,
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
  anchor = '',
  process,
}: {
  tags?: Tag[];
  data?: string;
  anchor?: string;
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
      anchor,
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
  tags: Tag[] = []
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

export enum WalletConnectionResult {
  ERROR = 'error',
  CONNECTED = 'connected',
  USER_CANCELLED = 'cancelled',
  WALLET_NOT_FOUND = 'wallet not found'
}

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
    console.log('Getting wallet details...');
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


export const DbAdmin_LUA_CODE: string = `
// // -- ANON package integration code


// // -- ANON package integration code

// // local apm_id = "DKF8oXtPvh3q8s0fJFIeHFyHNM6oKrwMCUrPxEMroak"
// // local apm_version = "2.0.5"

// // json = require("json")
// // base64 = require(".base64")

// // function Set(list)
// //   local set = {}
// //   for _, l in ipairs(list) do set[l] = true end
// //   return set
// // end

// // function Hexencode(str)
// //   return (str:gsub(".", function(char) return string.format("%02x", char:byte()) end))
// // end

// // function Hexdecode(hex)
// //   return (hex:gsub("%x%x", function(digits) return string.char(tonumber(digits, 16)) end))
// // end

// // function IsValidVersion(variant)
// //   -- version string or 43 char message_id
// //   return variant:match("^%d+%.%d+%.%d+$") or (variant:match("^[a-zA-Z0-9%-%_]+$") and #variant == 43)
// // end

// // function IsValidPackageName(name)
// //   return name:match("^[a-zA-Z0-9%-_]+$")
// // end

// // function IsValidVendor(name)
// //   return name and name:match("^@[a-z0-9-]+$")
// // end

// // -- can be @vendor/pkgname or pkgname
// // -- can be @vendor/pkgname@version or pkgname@version
// // -- can be @vendor/pkgname@message_id or pkgname@message_id
// // -- message_id length is 43 chars
// // function SplitPackageName(query)
// //   local vendor, pkgname, version

// //   -- if only vendor is given
// //   if query:find("^@%w+$") then
// //     return query, nil, nil
// //   end

// //   -- check if version is provided
// //   local version_index = query:find("@%d+.%d+.%d+$")
// //   if version_index then
// //     version = query:sub(version_index + 1)
// //     query = query:sub(1, version_index - 1)
// //   else
// //     -- check if length > 43 and last 43 chars are message_id
// //     if #query > 45 then
// //       local message_id = query:sub(-43)
// //       if message_id:match("^[a-zA-Z0-9%-%_]+$") then
// //         version = message_id
// //         query = query:sub(1, -44)
// //       end
// //     end
// //   end

// //   -- check if vendor is provided
// //   vendor, pkgname = query:match("@(%w+)/([%w%-%_]+)")

// //   if not vendor then
// //     pkgname = query
// //   else
// //     vendor = "@" .. vendor
// //   end

// //   return vendor, pkgname, version
// // end

// // -- common error handler
// // function HandleRun(func, msg)
// //   local ok, err = pcall(func, msg)
// //   if not ok then
// //     local clean_err = err:match(":%d+: (.+)") or err
// //     print(msg.Action .. " - " .. err)
// //     -- if not msg.Target == ao.id then
// //     ao.send({
// //       Target = msg.From,
// //       Data = clean_err,
// //       Result = "error"
// //     })
// //     -- end
// //   end
// // end

// // function CheckUpdate(msg)
// //   local latest_client_version = msg.LatestClientVersion
// //   if not latest_client_version then
// //     return
// //   end
// //   if latest_client_version and latest_client_version > apm._version then
// //     print("⚠️ APM update available v:" .. latest_client_version .. " run 'apm.update()'")
// //   end
// // end

// // -------------------------------------------------------------

// // function DownloadResponseHandler(msg)
// //   local from = msg.From
// //   if not from == apm.ID then
// //     print("Attempt to download from illegal source")
// //     return
// //   end

// //   if not msg.Result == "success" then
// //     print("Download failed: " .. msg.Name)
// //     return
// //   end

// //   local source = msg.Data
// //   local name = msg.Name
// //   local version = msg.Version
// //   local warnings = msg.Warnings         -- {ModifiesGlobalState:boolean, Message:boolean}
// //   local dependencies = msg.Dependencies -- {[name:string] = {version:string}}

// //   if source then
// //     source = Hexdecode(source)
// //   end

// //   if warnings and warnings.ModifiesGlobalState then
// //     print("⚠️ Package modifies global state")
// //   end

// //   if warnings and warnings.Message then
// //     print("⚠️ " .. warnings.Message)
// //   end

// //   -- if vendor is @apm remove it and just keep the name
// //   local loaded_name = name:match("^@apm/(.+)$") or name

// //   local func, err = load(string.format([[
// //         local function _load()
// //             %s
// //         end
// //         _G.package.loaded["%s"] = _load()
// //     ]], source, loaded_name))
// //   if not func then
// //     error("Error compiling load function: " .. err)
// //   end
// //   func()

// //   apm.installed[name] = version

// //   if dependencies then
// //     dependencies = json.decode(dependencies) -- "dependencies": {"test-pkg": {"version": "1.0.0"}}
// //   end
// //   -- print(dependencies)

// //   for dep, depi in pairs(dependencies) do
// //     -- print("📦 Checking dependency " .. dep .. "@" .. depi.version)
// //     -- install dependency and make sure there is no circular install
// //     if not (apm.installed[dep] == depi.version) then
// //       print("ℹ️ Installing dependency " .. dep .. "@" .. depi.version)
// //       apm.install(dep)
// //     end
// //   end

// //   print("✅ Downloaded " .. name .. "@" .. version)
// //   CheckUpdate(msg)
// // end

// // Handlers.add(
// //   "APM.DownloadResponse",
// //   Handlers.utils.hasMatchingTag("Action", "APM.DownloadResponse"),
// //   function(msg)
// //     HandleRun(DownloadResponseHandler, msg)
// //   end
// // )

// // -------------------------------------------------------------

// // function SearchResponseHandler(msg)
// //   if msg.From ~= apm.ID then
// //     print("Attempt to search from illegal source")
// //     return
// //   end

// //   local result = msg.Result
// //   if not result == "success" then
// //     print("Search failed: " .. msg.Data)
// //     return
// //   end

// //   local res = json.decode(msg.Data)
// //   if #res == 0 then
// //     print("No packages found")
// //     return
// //   end

// //   local p = ""
// //   for _, pkg in ipairs(res) do
// //     p = p .. pkg.Vendor .. "/" .. pkg.Name .. " | " .. pkg.Description .. ""
// //   end
// //   print(p)

// //   CheckUpdate(msg)
// // end

// // Handlers.add(
// //   "APM.SearchResponse",
// //   Handlers.utils.hasMatchingTag("Action", "APM.SearchResponse"),
// //   function(msg)
// //     HandleRun(SearchResponseHandler, msg)
// //   end
// // )

// // -------------------------------------------------------------

// // function InfoResponseHandler(msg)
// //   if msg.From ~= apm.ID then
// //     print("Attempt to get info from illegal source")
// //     return
// //   end

// //   local result = msg.Result
// //   if not result == "success" then
// //     print("Info failed: " .. msg.Data)
// //     return
// //   end

// //   local res = json.decode(msg.Data)
// //   if not res then
// //     print("No info found")
// //     return
// //   end

// //   print("📦 " .. Colors.green .. res.Vendor .. "/" .. res.Name .. Colors.reset)
// //   print("📄 Description    : " .. Colors.green .. res.Description .. Colors.reset)
// //   print("🔖 Latest Version : " .. Colors.green .. res.Version .. Colors.reset)
// //   print("📥 Installs       : " .. Colors.green .. res.TotalInstalls .. Colors.reset)
// //   print("🔗 APM Url        : " .. Colors.green .. "https://apm.betteridea.dev/pkg?id=" .. res.PkgID .. Colors.reset)
// //   print("🔗 Repository Url : " .. Colors.green .. res.Repository .. Colors.reset)

// //   CheckUpdate(msg)
// // end

// // Handlers.add(
// //   "APM.InfoResponse",
// //   Handlers.utils.hasMatchingTag("Action", "APM.InfoResponse"),
// //   function(msg)
// //     HandleRun(InfoResponseHandler, msg)
// //   end
// // )

// // -------------------------------------------------------------

// // function UpdateResponseHandler(msg)
// //   local from = msg.From
// //   if not from == apm.ID then
// //     print("Attempt to update from illegal source")
// //     return
// //   end

// //   if not msg.Result == "success" then
// //     print("Update failed: " .. msg.Data)
// //     return
// //   end

// //   local source = msg.Data
// //   local version = msg.Version

// //   if source then
// //     source = Hexdecode(source)
// //   end

// //   local func, err = load(string.format([[
// //         local function _load()
// //             %s
// //         end
// //         -- apm = _load()
// //         _load()
// //     ]], source))
// //   if not func then
// //     error("Error compiling load function: " .. err)
// //   end
// //   func()

// //   apm._version = version
// //   print("✅ Updated APM to v:" .. version)
// //   print("Please use 'apm' namespace for all commands")
// // end

// // Handlers.add(
// //   "APM.UpdateResponse",
// //   Handlers.utils.hasMatchingTag("Action", "APM.UpdateResponse"),
// //   function(msg)
// //     HandleRun(UpdateResponseHandler, msg)
// //   end
// // )

// // -------------------------------------------------------------

// // apm = apm or {}
// // apm.ID = apm_id
// // apm._version = apm._version or apm_version
// // apm.installed = apm.installed or {}

// // function apm.install(name)
// //   local vendor, pkgname, version = SplitPackageName(name)
// //   if not vendor then
// //     vendor = "@apm"
// //   end
// //   if not IsValidVendor(vendor) then
// //     return error("Invalid vendor name")
// //   end
// //   if not IsValidPackageName(pkgname) then
// //     return error("Invalid package name")
// //   end
// //   if version and not IsValidVersion(version) then
// //     return error("Invalid version")
// //   end

// //   local pkgnv = vendor .. "/" .. pkgname
// //   local pkg_ver = apm.installed[pkgnv]
// //   if pkg_ver then
// //     -- return error("Package already installed. Use apm.uninstall to remove it")
// //     if version and pkg_ver == version then
// //       return "✅ Package " .. pkgnv .. " already installed"
// //     end
// //   end

// //   if version then
// //     pkgnv = pkgnv .. "@" .. version
// //   end

// //   Send({
// //     Target = apm.ID,
// //     Action = "APM.Download",
// //     Data = pkgnv
// //   })
// //   return "📦 Download requested for " .. pkgnv
// // end

// // function apm.search(query)
// //   if not query then
// //     return error("No search query provided")
// //   end

// //   Send({
// //     Target = apm.ID,
// //     Action = "APM.Search",
// //     Data = query
// //   })
// //   return "🔍 Search requested for " .. query
// // end

// // function apm.update()
// //   Send({
// //     Target = apm.ID,
// //     Action = "APM.Update"
// //   })
// //   return "📦 Update requested"
// // end

// // function apm.info(query)
// //   if not query then
// //     return error("No info query provided")
// //   end

// //   Send({
// //     Target = apm.ID,
// //     Action = "APM.Info",
// //     Data = query
// //   })
// //   return "📦 Info requested for " .. query
// // end

// // function apm.uninstall(name)
// //   local vendor, pkgname, _ = SplitPackageName(name)
// //   if not vendor then
// //     vendor = "@apm"
// //   end
// //   if not IsValidVendor(vendor) then
// //     return error("Invalid vendor name")
// //   end
// //   if not IsValidPackageName(pkgname) then
// //     return error("Invalid package name")
// //   end

// //   local pkgnv = vendor .. "/" .. pkgname
// //   local pkg = apm.installed[pkgnv]

// //   if not pkg then
// //     return error("Package not installed")
// //   end


// //   apm.installed[pkgnv] = nil
// //   if vendor == "@apm" then
// //     _G.package.loaded[name] = nil
// //   else
// //     _G.package.loaded[pkgnv] = nil
// //   end
// //   return "🗑️ Uninstalled " .. pkgnv
// // end

// // print("✅ APM client v" .. apm._version .. " loaded")
// // print("usage: apm.install <package name>")

`;


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