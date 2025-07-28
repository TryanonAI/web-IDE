import React from "react";
import type { Tag } from "./arkit";
import { Framework } from "@/types";
import {
  Code2,
  Palette,
  Workflow,
  Folder,
  FileText,
  Images,
} from "lucide-react";

// config constants
export const PROTOCOL_TYPE = "https";
export const HOST_NAME = "arweave.net";
export const PORT_NUM = 443;
export const CU_URL = "https://cu.arnode.asia";
export const MODE = "legacy";

export const GOLD_SKY_GQL = "https://arweave-search.goldsky.com/graphql";

export const GATEWAY_URL = `${PROTOCOL_TYPE}://${HOST_NAME}:${PORT_NUM}`;
export const GRAPHQL_URL = `${"https"}://${"arweave.net"}:${443}/graphql`;

// export const AOModule = 'Do_Uc2Sju_ffp6Ev0AnLVdPtot15rvMjP-a9VVaA5fM'; //regular-module on arweave
export const AOModule = "33d-3X8mpv6xYBlVB-eXMrPfH5Kzf6Hiwhcv0UA10sw"; // sqlite-module on arweave
export const AOScheduler = "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA";

export const APM_ID = "DKF8oXtPvh3q8s0fJFIeHFyHNM6oKrwMCUrPxEMroak";
export const APM_INSTALLER =
  "https://raw.githubusercontent.com/betteridea-dev/ao-package-manager/refs/heads/main/installer.lua";

// Common tags used across the application
export const CommonTags: Tag[] = [
  {
    name: "Name",
    value: import.meta.env.NODE_ENV === "development" ? "Anon-Dev" : "Anon",
  },
  { name: "Version", value: "2.0.0" },
  { name: "Authority", value: "fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY" },
  { name: "Scheduler", value: "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA" },
];

export const CommonActions = {
  Info: "Info",
  "Credit-Notice": "Credit-Notice",
  "Debit-Notice": "Debit-Notice",
  Balance: "Balance",
};

export const navigationTabs = [
  {
    label: "Projects",
    path: "/projects",
    icon: <Folder size={18} />,
  },
  {
    label: "Community",
    path: "/community",
    icon: <Images size={18} />,
  },
  {
    label: "Templates",
    path: "/templates",
    icon: <FileText size={18} />,
  },
];

export const API_CONFIG = {
  TIMEOUT: 30000,
  // BASE_URL: import.meta.env.VITE_BASE_URL,
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
};

export interface FrameworkOption {
  value: Framework;
  label: string;
  icon: React.ReactNode;
}

export const frameworks: FrameworkOption[] = [
  {
    value: Framework.React,
    label: "Dev (React)",
    icon: <Code2 className="h-4 w-4" />,
  },
  {
    value: Framework.Html,
    label: "No-Code (HTML)",
    icon: <Palette className="h-4 w-4" />,
  },
  {
    value: Framework.Canvas,
    label: "Agents (Canvas)",
    icon: <Workflow className="h-4 w-4" />,
  },
];

export const templateSrcDoc = `
<html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-gray-800 p-4">
            <div id="wallet_address" class="mb-4 p-2 bg-white rounded">Not connected</div>
            <button id="connectBtn" class="mr-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Connect Wallet</button>
            <button id="getAddress" class="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Get Address</button>
            <button id="disconnect" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Disconnect</button>
            
            <script>
              // function waitForWallet() {
              //   return new Promise((resolve) => {
              //     if (window.arweaveWallet) {
              //       resolve();
              //       return;
              //     }
                  
              //     const checkWallet = () => {
              //       if (window.arweaveWallet) {
              //         resolve();
              //       } else {
              //         setTimeout(checkWallet, 100);
              //       }
              //     };
              //     checkWallet();
              //   });
              // }

              document.getElementById('connectBtn').addEventListener('click', async () => {
                try {
                  // await waitForWallet();
                  console.log('🟢 Connecting wallet...');
                  document.getElementById('wallet_address').innerText = 'Connecting...';
                  
                  await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION']);
                  console.log('✅ Wallet connected successfully');
                  document.getElementById('wallet_address').innerText = 'Wallet connected! Click "Get Address" to see address.';
                } catch (error) {
                  console.error('❌ Connection failed:', error);
                  document.getElementById('wallet_address').innerText = 'Connection failed: ' + error.message;
                }
              });

              document.getElementById('getAddress').addEventListener('click', async () => {
                try {
                  // await waitForWallet();
                  document.getElementById('wallet_address').innerText = 'Fetching address...';
                  
                  const address = await window.arweaveWallet.getActiveAddress();
                  console.log('✅ Got address:', address);
                  document.getElementById('wallet_address').innerText = 'Address: ' + address;
                } catch (error) {
                  console.error('❌ Failed to get address:', error);
                  document.getElementById('wallet_address').innerText = 'Failed to get address: ' + error.message;
                }
              });

              document.getElementById('disconnect').addEventListener('click', async () => {
                try {
                  // await waitForWallet();
                  if (window.arweaveWallet.disconnect) {
                    await window.arweaveWallet.disconnect();
                    console.log('✅ Wallet disconnected');
                    document.getElementById('wallet_address').innerText = 'Wallet disconnected';
                  } else {
                    document.getElementById('wallet_address').innerText = 'Disconnect not supported';
                  }
                } catch (error) {
                  console.error('❌ Disconnect failed:', error);
                  document.getElementById('wallet_address').innerText = 'Disconnect failed: ' + error.message;
                }
              });

              // Check if wallet is already available
              // waitForWallet().then(() => {
              //   console.log('🔵 Wallet is available in iframe');
              // });
            </script>
          </body>
        </html>
`;