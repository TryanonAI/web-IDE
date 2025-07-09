# Anon
Turn your Web3 ideas into production-ready Arweave dApps via plain text DMs.

## 🤔 What is Anon?

Anon is like having a coding buddy who never gets tired and knows everything about building apps. Instead of spending weeks learning complex programming languages, you can simply chat with Anon in plain English about what you want to build, and it creates the code for you.

Think of it as ChatGPT, but specifically designed for building web applications that live forever on the blockchain. Whether you want to create a simple website, a complex web app, or even a decentralized application (dApp), Anon makes it possible without needing to be a professional developer.

### 🧑🏻‍🍳 How It Works

1. **Start a Conversation**: Tell Anon what you want to build in normal language
   - "Create a todo app with a dark theme"
   - "Build a portfolio website with my projects"
   - "Make a simple game where users can collect points"

2. **Watch the Magic**: Anon understands your request and writes the code automatically
   - It creates all the necessary files
   - Designs a beautiful user interface
   - Adds functionality that actually works

3. **See It Live**: Your app appears instantly in a live preview
   - No setup required - everything runs in your browser
   - Make changes by talking to Anon
   - Test your app immediately

4. **Deploy Forever**: When you're happy, publish your app to Arweave
   - Your app becomes permanently accessible on the internet
   - No monthly hosting fees
   - Truly decentralized and censorship-resistant

You don't need to know React, HTML, CSS, or any programming language. Just describe what you want, and Anon builds it for you. It's like having a full development team in your pocket.

## 🚀 Features

### Core Functionality
- **AI-Based Code Generation**: Chat-based interface for generating React and HTML applications
- **Real-time Code Editor**: Monaco Editor integration with live preview using Sandpack
- **Dual Development Modes**:
  - **Dev Mode**: Full React development environment with component-based architecture
  - **Vibe Mode**: HTML/CSS/JS for rapid prototyping and creative development
- **Arweave Integration**: Deploy directly to the Arweave permaweb
- **Project Management**: Create, save, and manage multiple projects
- **Version Control**: Track code changes and revert to previous versions

## 🏗️ Architecture Patterns

### State Management
- **Zustand**: Lightweight state management for global app state
- **Local State**: React hooks for component-specific state
- **Persistent Storage**: Wallet connection and user preferences

### API Integration
- **Axios**: HTTP client for backend communication
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Loading States**: Visual feedback for all async operations

### UI/UX Patterns
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Dark Theme**: Default dark theme with system preference detection
- **Accessible Components**: Radix UI primitives for accessibility
- **Animation**: Subtle animations for enhanced user experience


## 📚 Technical Stack

### Framework & Core
- `next`: React framework with App Router
- `react` & `react-dom`: UI library
- `typescript`: Type safety

### UI & Styling
- `@radix-ui/*`: Accessible UI primitives
- `tailwindcss`: Utility-first CSS
- `framer-motion`: Animation library
- `lucide-react`: Icon library

### Development Tools
- `@codesandbox/sandpack-react`: In-browser code execution
- `@monaco-editor/react`: Code editor
- `zustand`: State management

### Blockchain & AI
- `@ardrive/turbo-sdk`: Arweave integration
- `arweave`: Arweave blockchain client

## 📝 Notes

- The application uses Next.js App Router with nested layouts
- Sandpack provides the in-browser development environment
- AI chat integration supports multiple providers for redundancy
- Wallet integration is essential for user authentication and deployment
- The codebase follows modern React patterns with hooks and functional components