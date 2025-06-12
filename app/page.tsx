'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import LandingNavbar from '@/components/features/landing/LandingNavbar';

// Preload images with proper dimensions
const images = {
  L1: { src: '/landing/L1.png', width: 290, height: 290 },
  L2: { src: '/landing/L2.png', width: 260, height: 260 },
  R1: { src: '/landing/R1.png', width: 300, height: 300 },
  R2: { src: '/landing/R2.png', width: 210, height: 210 },
};

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    isClient && (
      <div className="bg-[#FFFFFA] min-h-screen w-full">
        <LandingNavbar />
        <main className="w-full h-[93vh] flex items-end justify-center relative">
          <section className="w-[94%] pt-6 h-[87%] bg-[#F2F2E8] rounded-[20px] flex flex-col items-center justify-center relative">
            {/* Main heading */}
            <h1 className="w-full f19 text-[2rem] sm:text-[3rem] md:text-[4.5rem] lg:text-[5.5rem] xl:text-[6.2rem] text-[#213130] leading-[2.2rem] sm:leading-[3.2rem] md:leading-[4.8rem] lg:leading-[5.8rem] xl:leading-[6.8rem] text-center transition-all duration-300">
              <span className="block mb-2 sm:mb-3">Vibe code,</span>
              <span className="block">everywhere</span>
            </h1>

            {/* Description and CTA */}
            <div className="f18 w-full text-center mt-4 sm:mt-6 md:mt-8 lg:mt-10">
              <p className="text-sm sm:text-base md:text-lg max-w-[280px] sm:max-w-[400px] md:max-w-[500px] mx-auto px-4 sm:px-0 leading-relaxed text-[#515E5B]/90">
                Plan, create, and build products with the most flexible Arweave
                toolkit.
              </p>

              <div className="flex mt-10 mb-8 items-center justify-center w-full">
                <Link
                  href="/dashboard"
                  className="px-3 sm:px-4 md:px-5 w-full sm:w-[50%] md:w-[30%] lg:w-[20%] xl:w-[15%] bg-[#B0EC9C] text-[#213130] flex items-center gap-2 justify-center py-[12px] sm:py-[14px] md:py-[16px] rounded-full text-base sm:text-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                  aria-label="Get started now"
                >
                  <span className="whitespace-nowrap flex items-center gap-2">
                    {'Get started now'}
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Decorative images */}
            {Object.entries({
              'top-[19%] -left-[1%] w-[150px] sm:w-[200px] md:w-[240px] lg:w-[290px]':
                images.L1,
              'top-[27%] right-[1%] w-[130px] sm:w-[180px] md:w-[220px] lg:w-[260px]':
                images.L2,
              'top-[58%] left-[1%] w-[160px] sm:w-[200px] md:w-[250px] lg:w-[300px]':
                images.R1,
              'bottom-[0%] right-[6%] w-[110px] sm:w-[150px] md:w-[180px] lg:w-[210px]':
                images.R2,
            }).map(([position, img], index) => (
              <div
                key={index}
                className={`absolute ${position} transition-all duration-300 hidden sm:block`}
              >
                <Image
                  src={img.src}
                  alt="Decorative illustration"
                  width={img.width}
                  height={img.height}
                  className="w-full h-auto object-contain"
                  priority={index < 2}
                />
              </div>
            ))}
          </section>
        </main>
      </div>
    )
  );
}
