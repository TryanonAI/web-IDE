'use client';

import React, { useRef, useState } from 'react';
import { Zap, Github, Twitter, ArrowRight, Loader2 } from 'lucide-react';
import Logo from '@/public/logo_white.png';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useWallet } from '@/hooks';
import { StarsBackground } from '@/components/animate-ui/backgrounds/stars';

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
];
// import { Pause, Play } from 'lucide-react';
import { AuroraText } from '@/components/magicui/aurora-text';

export default function AnonLanding() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [wallet, setWallet] = useState('');
  const { connect } = useWallet();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleConnectWallet = async () => {
    if (!window.arweaveWallet) {
      toast.error('Please install the Wander Wallet');
      return;
    }
    try {
      setIsLoading(true);
      await connect();
      const address = await window.arweaveWallet.getActiveAddress();
      setWallet(address);
      toast.success('Wallet connected successfully');
    } catch (err) {
      console.error(err);
      toast.error('Error connecting wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    try {
      setIsLoading(true);
      if (!wallet) {
        toast.error('Please connect your wallet first');
        return;
      }
      router.push('/projects');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative z-10 max-w-7xl my-auto mx-auto px-8 pt-20 pb-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-[#00FFD1]/20 to-[#00FFD1]/20 border border-[#00FFD1]/30 backdrop-blur-sm rounded-sm mb-8">
              <Zap className="h-4 w-4 text-[#00FFD1]" />
              <span className="tracking-wider font-mono text-sm font-medium text-white/90">
                AI dApp Builder
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-semibold leading-tight mb-7 text-white/90">
              Build your{' '}
              {/* <span className="bg-gradient-to-r from-white/90 via-[#00FFD1] to-[#7C3AED] bg-clip-text text-transparent"> */}
              <AuroraText colors={['#00FFD1', '#7C3AED']}>
                {'<'}dApp{'>'}
              </AuroraText>
              {/* </span> */}
            </h1>

            <p className="text-xl text-white/70 mb-16 max-w-2xl mx-auto leading-relaxed">
              Vibe code your Web3 ideas into production-ready dApps
            </p>

            <div className="hidden md:flex max-w-3xl mx-auto mb-20 items-center justify-center">
              {wallet ? (
                <button
                  onClick={handleGetStarted}
                  disabled={isLoading}
                  className="px-16 py-4 bg-gradient-to-r from-[#00FFD1] to-[#4ECDC4] text-black font-bold text-lg hover:from-[#00FFD1]/90 hover:to-[#4ECDC4]/90 transition-all duration-300 hover:shadow-lg hover:shadow-[#00FFD1]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Let's Go"
                  )}
                  <ArrowRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  disabled={isLoading}
                  className="px-16 py-4 bg-gradient-to-r from-[#00FFD1] to-[#4ECDC4] text-black font-bold text-lg hover:from-[#00FFD1]/90 hover:to-[#4ECDC4]/90 transition-all duration-300 hover:shadow-lg hover:shadow-[#00FFD1]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center rounded-sm gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Connect Wallet'
                  )}
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Video */}
        <div className=" group relative max-w-[75%] mx-auto aspect-video bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 overflow-hidden group">
          <video
            ref={videoRef}
            muted
            controls
            autoPlay
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          >
            <source src="/videos/hero_demo_tryanonai.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/30 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Unified Center Control Button */}
          {/* <button
            onClick={toggleVideo}
            className={`
      absolute inset-0 flex items-center justify-center
      transition-opacity duration-300
      ${isVideoPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}
    `}
          >
            <span className="bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-full p-3 hover:bg-white/20 transition-all duration-300">
              {isVideoPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </span>
          </button> */}
        </div>

        {/* Mobile-only note */}
        <div className="flex md:hidden max-w- mx-auto mt-10 px-4 text-center text-white/70 text-sm">
          <p>
            This dApp is currently only available on desktop devices. Please
            switch to a larger screen to continue.
          </p>
        </div>

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
