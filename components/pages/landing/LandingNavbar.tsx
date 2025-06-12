import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import Logo from '@/public/bgRemoveLogoAnon.png';
const LandingNavbar = () => {
  return (
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 justify-between z-[100] items-center bg-[#FFFFFA] flex h-[8vh] sm:h-[9vh] md:h-[10.2vh] fixed rounded-b-xl sm:rounded-b-2xl shadowsm">
      {/*  this is the logo section */}
      <div className="w-[25%] sm:w-[15%] md:w-[12%] lg:w-[10%] xl:w-[9.5%] max-w-[120px]">
        <Image
          className="w-full h-full object-contain"
          src={Logo}
          alt="Logo"
          width={290}
          height={290}
          priority
        />
      </div>

      {/* <div className="flex gap-2 text-[#596463] tracking-wide items-center">
        <div className=" cursor-not-allowed flex f18 text-[17.5px] capitalize hover:bg-[#F2F2E8] transition-all px-3 py-1 rounded-full gap-[10px] duration-300 items-center">
          <h1>Features</h1>
          <svg width="23" height="23" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M5.293 8.293a1 1 0 0 1 1.414 0L12 13.586l5.293-5.293a1 1 0 1 1 1.414 1.414l-6 6a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 0-1.414Z"
            ></path>
          </svg>
        </div>
        <div className=" cursor-not-allowed f18 flex text-[17.5px] capitalize hover:bg-[#F2F2E8] transition-all px-3 py-1 rounded-full gap-[10px]  duration-300 items-center">
          <h1>channels</h1>
          <svg width="23" height="23" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M5.293 8.293a1 1 0 0 1 1.414 0L12 13.586l5.293-5.293a1 1 0 1 1 1.414 1.414l-6 6a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 0-1.414Z"
            ></path>
          </svg>
        </div>
        <div className=" cursor-not-allowed  f18 text-[17.5px] capitalize hover:bg-[#F2F2E8] transition-all px-3 py-1 rounded-full gap-1  duration-300 ">
          <h1>pricing</h1>
        </div>
        <div className=" cursor-not-allowed  f18 text-[17.5px] capitalize hover:bg-[#F2F2E8] transition-all px-3 py-1 rounded-full gap-1  duration-300 ">
          <h1>blog</h1>
        </div>
      </div> */}

      <div className="w-full sm:w-[40%] md:w-[30%] lg:w-[25%] xl:w-[22%] text-[#596463] h-full flex tracking-wide items-center justify-end gap-3">
        <div className="bg-black rounded-full w-fit mr-10">
          <Link href="https://x.com/a0_anon" target="_blank">
            <div className="px-3 sm:px-4 md:px-5 bg-[#B0EC9C] hover:-translate-y-1 duration-200 transition-all f18 py-1.5 sm:py-2 rounded-full border-[1px] text-base sm:text-lg border-black">
              <span className="whitespace-nowrap">About Us</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingNavbar;
