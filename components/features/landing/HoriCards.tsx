import React from 'react';

const HoriCards = ({
  mainText,
  subtext,
}: {
  mainText: string;
  subtext: string;
}) => {
  return (
    <div className="w-[25%] text-[#323a38] flex items-center justify-center flex-col  uppercase text-center h-[70%] rounded-xl border-[1px] border-black">
      <h1 className="f18 text-[3rem]">{mainText}</h1>
      <p className="f17">{subtext}</p>
    </div>
  );
};

export default HoriCards;
