'use client';
import { StarsBackground } from '@/components/animate-ui/backgrounds/stars';

import React, { useEffect } from 'react';
import {
  Zap,
  // Shield,
  Github,
  Twitter,
  ArrowRight,
  // Loader2,
} from 'lucide-react';
import Logo from '@/public/logo_white.png';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
// import { getWalletDetails } from '@/lib/arkit';

export default function AnonLanding() {
  // const [wallet, setWallet] = useState('');
  // const [setIsLoading] = useState(false);
  // const [isConnecting, setIsConnecting] = useState(false);
  // const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    // const checkWalletStatus = async () => {
    //   try {
    //     // setIsLoading(true);
    //     console.log('Checking wallet connection status...');
    //     const { walletAddress } = await getWalletDetails();
    //     setWallet(walletAddress);
    //     console.log(
    //       'Wallet status checked:',
    //       walletAddress ? 'Connected' : 'Not connected'
    //     );
    //   } catch (error) {
    //     console.error('Error checking wallet status:', error);
    //     setWallet('');
    //   } finally {
    //     // setIsLoading(false);
    //   }
    // };
    // checkWalletStatus();
  }, []);

  // const handleConnectWallet = async () => {
  //   try {
  //     setIsConnecting(true);
  //     console.log('Initiating wallet connection...');
  //     await connectWallet();

  //     // Add a small delay to ensure the wallet connection is processed
  //     await new Promise((resolve) => setTimeout(resolve, 500));

  //     const { walletAddress } = await getWalletDetails();
  //     setWallet(walletAddress);
  //     console.log('Wallet connected successfully:', walletAddress);
  //   } catch (error) {
  //     console.error('Error connecting wallet:', error);
  //     // You could add a toast notification here for better UX
  //   } finally {
  //     setIsConnecting(false);
  //   }
  // };

  // const handleDisconnectWallet = async () => {
  //   try {
  //     setIsDisconnecting(true);
  //     console.log('Initiating wallet disconnection...');
  //     await disconnectWallet();
  //     setWallet('');
  //     console.log('Wallet disconnected successfully');
  //   } catch (error) {
  //     console.error('Error disconnecting wallet:', error);
  //     // You could add a toast notification here for better UX
  //   } finally {
  //     setIsDisconnecting(false);
  //   }
  // };

  const router = useRouter();

  const handleGetStarted = () => {
    // if (!wallet) {
    //   console.log('User not connected, prompting to connect wallet first');
    //   // You could add a toast notification here to prompt user to connect wallet
    //   return;
    // }
    // console.log('Navigating to dashboard...');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#1a1a1a] text-white">
      {/* <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-[#00FFD1]/10 to-[#7C3AED]/5 blur-[150px]" />
        <div className="absolute bottom-[-200px] right-1/4 w-[500px] h-[500px] bg-gradient-to-l from-[#FF6B6B]/8 to-[#4ECDC4]/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div> */}

      <header className="relative z-10 border-b border-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 md:gap-0">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src={Logo}
              alt="Anon"
              width={160}
              height={40}
              className="ml-2"
              style={{
                minWidth: 105,
                minHeight: 32,
                height: 40,
                width: 'auto',
              }}
              priority
            />
          </div>

          {/* Right Side: socials (always) + wallet (desktop only) */}
          <div className="flex items-center gap-4">
            {/* Social icons — always visible */}
            <div className="flex items-center gap-3">
              <a
                href="https://x.com/tryanonai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#00FFD1] hover:border-[#00FFD1]/50 transition-all duration-300"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="http://github.com/tryanonAI"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#00FFD1] hover:border-[#00FFD1]/50 transition-all duration-300"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>

            {/* Wallet connect — desktop only */}
            {/* <div className="hidden md:block">
              {isLoading ? (
                <div className="h-10 px-4 py-2 border border-white/10 text-white/60 bg-white/5 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : wallet ? (
                <button
                  onClick={handleDisconnectWallet}
                  disabled={isDisconnecting}
                  className="h-10 px-4 py-2 border border-[#00FFD1]/50 text-[#00FFD1] bg-[#00FFD1]/10 hover:bg-[#00FFD1]/20 transition-all duration-300 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  {isDisconnecting
                    ? 'Disconnecting...'
                    : `${wallet.slice(0, 6)}...${wallet.slice(-4)}`}
                </button>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="h-10 px-4 py-2 border border-[#00FFD1]/50 text-[#00FFD1] bg-[#00FFD1]/10 hover:bg-[#00FFD1]/20 transition-all duration-300 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div> */}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl my-auto mx-auto px-8 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00FFD1]/20 to-[#7C3AED]/20 border border-[#00FFD1]/30 backdrop-blur-sm mb-8">
            <Zap className="h-4 w-4 text-[#00FFD1]" />
            <span className="tracking-wider font-mono text-sm font-medium text-white/90">
              AI dApp Builder
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold leading-tight mb-7">
            Build your{' '}
            <span className="bg-gradient-to-r from-white via-[#00FFD1] to-[#7C3AED] bg-clip-text text-transparent">
              {'<'}dApp{'>'}
            </span>
          </h1>

          <p className="text-xl text-white/70 mb-16 max-w-2xl mx-auto leading-relaxed">
            Vibe code your Web3 ideas into production-ready dApps
          </p>

          {/* Get Started button — only visible on md+ */}
          <div className="hidden md:flex max-w-3xl mx-auto mb-20 items-center justify-center">
            <button
              onClick={handleGetStarted}
              // disabled={!wallet}
              className="px-16 py-4 bg-gradient-to-r from-[#00FFD1] to-[#4ECDC4] text-black font-bold text-lg hover:from-[#00FFD1]/90 hover:to-[#4ECDC4]/90 transition-all duration-300 hover:shadow-lg hover:shadow-[#00FFD1]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Get Started
              {/* {wallet ? 'Get Started' : 'Connect Wallet to Continue'} */}
              <ArrowRight className="h-5 w-5" />
            </button>
            {/* Mobile-only message */}
          </div>
          <div className="flex md:hidden max-w-md mx-auto mt-10 px-4 text-center text-white/70 text-sm">
            <p>
              This dApp is currently only available on desktop devices. Please
              switch to a larger screen to continue.
            </p>
          </div>
        </div>
      </section>
      <StarsBackground className="absolute inset-0 flex items-center justify-center rounded-x" />
    </div>
  );
}
