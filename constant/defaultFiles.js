export const DEPENDENCIES = {
  dependencies: {
    // "react": "^19.1.0",
    // "react-dom": "^19.1.0",
    // "motion": "^12.15.0",
    // "esbuild": "0.25.0",
    // "esbuild-wasm": "0.25.0",
    // "react-router-dom": "7.2.0",
    // "framer-motion": "12.4.10",
    // "axios": "1.8.1",
    // "@permaweb/aoconnect": "0.0.82"
  },
  devDependencies: {
    // "@eslint/js": "^9.25.0",
    // "@types/react": "^19.1.2",
    // "@types/react-dom": "^19.1.2",
    // "@vitejs/plugin-react": "^4.4.1",
    // "eslint": "^9.25.0",
    // "eslint-plugin-react-hooks": "^5.2.0",
    // "eslint-plugin-react-refresh": "^0.4.19",
    // "globals": "^16.0.0",
    // "typescript": "~5.8.3",
    // "typescript-eslint": "^8.30.1",
    // "vite": "^6.3.5"
  },
};

export const defaultFiles = {
  '.gitignore': `
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
  `.trim(),
  'eslint.config.js': `
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
  `.trim(),
  'index.html': `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
  `.trim(),
  'package.json': JSON.stringify(
    {
      name: 'anon',
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc -b && vite build',
        lint: 'eslint .',
        preview: 'vite preview',
      },
      dependencies: {
        "react": "^19.1.0",
        "react-dom": "^19.1.0",

        "motion": "^12.15.0",
        "react-router-dom": "7.2.0",
        "framer-motion": "12.4.10",
        "axios": "1.8.1",
        "@permaweb/aoconnect": "0.0.82"
      },
      devDependencies: {
        "@eslint/js": "^9.25.0",
        "@types/react": "^19.1.2",
        "@types/react-dom": "^19.1.2",
        "@vitejs/plugin-react": "^4.4.1",
        "eslint": "^9.25.0",
        "eslint-plugin-react-hooks": "^5.2.0",
        "eslint-plugin-react-refresh": "^0.4.19",
        "globals": "^16.0.0",
        "typescript": "~5.8.3",
        "typescript-eslint": "^8.30.1",
        "vite": "^6.3.5"
      },
    },
    null,
    2
  ).trim(),
  'src/App.tsx': `
import { useState } from 'react'

function App() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
      <div 
        className="p-8 w-full max-w-md rounded-xl border border-green-800/30 bg-black/50 backdrop-blur-sm transform transition-all duration-300 hover:border-green-600/50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <h1 className="text-4xl font-light text-green-500 mb-2 text-center">
          Vibe Coding on AO
        </h1>
        <h2 className="text-lg text-green-400/80 text-center mb-6">
          {isHovered ? "Ready to create?" : "Waiting for you..."}
        </h2>

        <button
          onClick={async () => {
            try{
              await window.arweaveWallet.connect(
              [
                'ENCRYPT',
                'DECRYPT',
                'DISPATCH',
                'SIGNATURE',
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
                host: 'arweave.net',
                port: 443,
                protocol: 'https',
              }
            );
            } 
            catch(error){
              const errorMessage = error instanceof Error ? error.message : String(error);
               if (errorMessage.toLowerCase().includes('cancel') ||
                errorMessage.toLowerCase().includes('rejected') ||
                errorMessage.toLowerCase().includes('denied')) {
                console.log('User cancelled the wallet connection request');
              }
                else{
                console.log('Error connecting to wallet:', error);
                return;
              }
            }
            }}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          ✅ Connect Wallet
        </button>
      </div>
    </div>
  )
}

export default App;
  `.trim(),
  'src/main.tsx': `
  import App from './App.tsx'
  import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
  <div className="bg-black text-neutral-300">
  <App/>
  </div>
  </StrictMode>,
)
  `.trim(),
  'vite-env.d.ts': `
  /// <reference types="vite/client" />
  `.trim(),
  'tsconfig.app.json': JSON.stringify(
    {
      "compilerOptions": {
        "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": true,

        /* Bundler mode */
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "verbatimModuleSyntax": true,
        "moduleDetection": "force",
        "noEmit": true,
        "jsx": "react-jsx",

        /* Linting */
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "erasableSyntaxOnly": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedSideEffectImports": true
      },
      "include": ["src"]
    },
    null,
    2
  ).trim(),
  'tsconfig.json': JSON.stringify(
    {
      files: [],
      references: [
        { path: './tsconfig.app.json' },
        { path: './tsconfig.node.json' },
      ],
    },
    null,
    2
  ).trim(),
  'tsconfig.node.json': JSON.stringify(
    {
      "compilerOptions": {
        "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
        "target": "ES2022",
        "lib": ["ES2023"],
        "module": "ESNext",
        "skipLibCheck": true,

        /* Bundler mode */
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "verbatimModuleSyntax": true,
        "moduleDetection": "force",
        "noEmit": true,

        /* Linting */
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "erasableSyntaxOnly": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedSideEffectImports": true
      },
      "include": ["vite.config.ts"]
    },
    null,
    2
  ).trim(),
  'vite.config.ts': `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
  `.trim(),
  'Readme.md': `
# Project by Anon
`.trim(),
};

export const templateHtml = `
<!DOCTYPE html>
<html>
<head>
<title>Anon AI</title>
<style>
body {
 background-color: #000;
 color: #fff;
 font-family: 'Courier New', Courier, monospace;
 font-size: 16px;
 line-height: 1.5;
 padding: 20px;
 margin: 0;
 height: 100vh;
 width: 100vw;
 display: flex;
 justify-content: center;
 align-items: center;
 flex-direction: column;
 overflow: hidden;
 box-sizing: border-box;                  
}
</style>
</head>
<body>
<h1>Anon AI</h1>
<p>Vibe Coding LFG!!!</p>
</body>
</html>`