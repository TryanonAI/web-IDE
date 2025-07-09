'use client';
import { StarsBackground } from '@/components/animate-ui/backgrounds/stars';

import React, { useEffect, useRef } from 'react';
import { Zap, Github, Twitter, ArrowRight } from 'lucide-react';
import Logo from '@/public/logo_white.png';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const socialLinks = [
  {
    href: 'https://x.com/tryanonai',
    icon: Twitter,
    label: 'Twitter',
  },
  {
    href: 'http://github.com/tryanonAI',
    icon: Github,
    label: 'GitHub',
  },
  // {
  //   href: '#',
  //   icon: MessageCircle,
  //   label: 'Message',
  // },
];

// const featuredProjects = [
//   {
//     title: 'DeFi Yield Aggregator',
//     description:
//       'Maximize your yields across multiple DeFi protocols with automated strategies',
//     tags: ['DeFi', 'Yield', 'Automation'],
//     color: '#00FFD1',
//   },
//   {
//     title: 'NFT Launchpad',
//     description:
//       'Launch your NFT collection with built-in royalties and marketplace integration',
//     tags: ['NFT', 'Launchpad', 'Royalties'],
//     color: '#7C3AED',
//   },
//   {
//     title: 'Cross-Chain Bridge',
//     description:
//       'Seamlessly bridge assets across multiple blockchains with minimal fees',
//     tags: ['Bridge', 'Cross-Chain', 'DeFi'],
//     color: '#FF6B6B',
//   },
// ];

export default function AnonLanding() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  // const [wallet, setWallet] = useState('');
  // const [setIsLoading] = useState(false);
  // const [isConnecting, setIsConnecting] = useState(false);
  // const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    // Setup GSAP ScrollTrigger for video
    if (videoRef.current && videoContainerRef.current) {
      ScrollTrigger.create({
        trigger: videoContainerRef.current,
        start: '35% bottom', // When 35% of video is visible from bottom
        end: 'bottom top', // Until video completely leaves viewport
        onEnter: () => {
          // Play video when scrolling down and 35% visible
          if (videoRef.current) {
            videoRef.current.play().catch(console.log);
          }
        },
        onLeave: () => {
          // Pause video when scrolling past it
          if (videoRef.current) {
            videoRef.current.pause();
          }
        },
        onEnterBack: () => {
          // Resume video when scrolling back up into view
          if (videoRef.current) {
            videoRef.current.play().catch(console.log);
          }
        },
        onLeaveBack: () => {
          // Pause video when scrolling back up past trigger point
          if (videoRef.current) {
            videoRef.current.pause();
          }
        },
      });
    }

    // Cleanup ScrollTrigger on unmount
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
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
    <StarBg>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#1a1a1a] text-white">
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
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#00FFD1] hover:border-[#00FFD1]/50 transition-all duration-300"
                  >
                    <link.icon className="h-4 w-4" />
                  </a>
                ))}
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
        <section className="relative z-10 max-w-7xl myauto mx-auto px-8 pt-20 pb-10">
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
            </div>
          </div>

          {/* Demo Video */}
          <div
            ref={videoContainerRef}
            className="relative max-w-5xl mx-auto aspect-video bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 overflow-hidden group"
          >
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            >
              <source src="/videos/hero_demo_tryanonai.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </section>
        {/* Mobile-only message */}
        <div className="flex md:hidden max-w- mx-auto mt-10 px-4 text-center text-white/70 text-sm">
          <p>
            This dApp is currently only available on desktop devices. Please
            switch to a larger screen to continue.
          </p>
        </div>
        {/* Featured Projects */}
        {/* <section className="relative z-10 max-w-7xl mx-auto px-8 py-24">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-[#00FFD1] bg-clip-text text-transparent">
              Built by Innovators
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Join thousands of builders creating the future of decentralized
              applications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.map((project, index: number) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] overflow-hidden"
              >
                <div
                  className="aspect-video relative flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${project.color}20, ${project.color}10)`,
                  }}
                >
                  <div
                    className="w-16 h-16 opacity-40"
                    style={{
                      background: `radial-gradient(circle, ${project.color}60, transparent)`,
                    }}
                  />
                </div>

                <div className="p-8">
                  <h3
                    className="text-2xl font-bold mb-3"
                    style={{ color: project.color }}
                  >
                    {project.title}
                  </h3>
                  <p className="text-white/60 mb-6 leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag: string, tagIndex: number) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 bg-white/5 border border-white/10 text-xs text-white/70 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    className="text-sm font-medium px-4 py-2 border transition-all duration-300 hover:scale-105"
                    style={{
                      borderColor: `${project.color}50`,
                      color: project.color,
                      background: `${project.color}10`,
                    }}
                  >
                    View Project
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section> */}

        {/* Footer */}
        <footer className="relative z-10 mt-20 border-t border-white/5 bg-gradient-to-t from-black/30 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
                <Image
                  src={Logo}
                  alt="Anon"
                  width={140}
                  height={35}
                  style={{
                    minWidth: 90,
                    minHeight: 28,
                    height: 35,
                    width: 'auto',
                  }}
                  priority
                />
                <div className="hidden md:block w-px h-6 bg-white/10" />
                <span className="text-white/50 text-sm font-medium tracking-wide">
                  Making the Permaweb Beautiful.
                </span>
              </div>

              <div className="flex items-center gap-3">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#00FFD1] hover:border-[#00FFD1]/50 hover:bg-[#00FFD1]/10 transition-all duration-300 hover:scale-105"
                  >
                    <link.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </StarBg>
  );
}

const StarBg = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return <StarsBackground>{children}</StarsBackground>;
};
