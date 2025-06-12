import React from 'react';

const VerticalExpand = ({
  heading,
  mainHeading,
  para,
  img,
}: {
  heading: string;
  mainHeading: string;
  para: string;
  img: string;
}) => {
  return (
    <>
      <div className="w-full h-[50%] pt-16 px-20">
        <h1 className="text-lg tracking-wider text-[#303D38] f18 uppercase">
          {heading}
        </h1>
        <p className="text-3xl w-[80%] mt-2 mb-5 text-[#213130] opacity-90 f19">
          {mainHeading}
        </p>
        <p className="w-[98%] f17 text-[#213130] text-[18px]">{para}</p>
        <div className="w-[28%] text-white f18 mt-5 bg-[#304B47] px-6 py-2 rounded-full flex items-center justify-center">
          <h1>Learn more</h1>
        </div>
      </div>
      <div className="w-full h-[50%] flex items-end    justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className=" scale-105 object-cover" src={img} alt="not showing" />
      </div>
    </>

    // okay so what i am doing today let's see what am i doing this adi will be a good
  );
};

export default VerticalExpand;
