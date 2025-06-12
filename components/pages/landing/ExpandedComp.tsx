import Image from 'next/image';
import React from 'react';

const ExpandedComp = ({
  // @ts-expect-error irnore
  img,
  // @ts-expect-error irnore
  mainText,
  // @ts-expect-error irnore
  heading,
  // @ts-expect-error irnore
  mainPara,
  // @ts-expect-error irnore
  para1,
  // @ts-expect-error irnore
  para2,
  // @ts-expect-error irnore
  para3,
  // @ts-expect-error irnore
  alignment,
  // @ts-expect-error irnore
  bgColor,
}) => {
  return (
    <div className="w-full h-[77vh] flex items-start justify-center">
      <div
        style={{ backgroundColor: bgColor }}
        className={`w-[94%] h-[98%] rounded-[20px] overflow-hidden  flex ${
          alignment ? 'flex-row-reverse' : ''
        }`}
      >
        <div className="w-1/2 h-full flex items-center justify-center pt-6">
          <Image className="object-cover w-[95%]" src={img} alt="Not showing" />
        </div>
        <div
          className={`w-1/2 text-[#213130] h-full  flex flex-col items-start  ${
            alignment ? 'p-20' : ''
          }   justify-center`}
        >
          <div className={`${alignment ? 'w-[90%]' : 'w-[70%]'} `}>
            <p className="uppercase f17">{heading}</p>
            <h1 className="f18 text-4xl mt-3 mb-5">{mainText}</h1>
            <p className="f18 opacity-90">{mainPara}</p>
          </div>
          <div className="mt-5">
            <div className="px-7 my-5 text-[17px] f17 rounded-full text-white w-fit py-2 bg-[#283E3B] flex items-center justify-center">
              Learn more
            </div>
            <div className="flex flex-col gap-3 mt-5">
              <p className="flex items-center gap-2">
                <span>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M20.65 12.361v7.253a2.072 2.072 0 0 1-2.072 2.072H4.072A2.072 2.072 0 0 1 2 19.614V5.108a2.072 2.072 0 0 1 2.072-2.072h7.253m4.145 2.072h6.216M18.578 2v6.217m2.072 7.253-3.197-3.198a2.072 2.072 0 0 0-2.93 0l-9.415 9.414M10.29 9.253a2.072 2.072 0 1 1-4.145 0 2.072 2.072 0 0 1 4.145 0Z"></path>
                  </svg>
                </span>
                {para1}
              </p>
              <p className="flex items-center gap-2">
                <span>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="m14.432 7.18 3.109 3.11M5.107 6.144v4.144m14.506 4.145v4.144M10.288 2v2.072M7.179 8.217H3.035m18.65 8.289h-4.144m-6.217-13.47H9.252m13.096.663-1.326-1.326a1.254 1.254 0 0 0-1.782 0L2.372 19.241a1.254 1.254 0 0 0 0 1.782l1.326 1.327a1.244 1.244 0 0 0 1.782 0L22.348 5.48a1.243 1.243 0 0 0 0-1.782Z"></path>
                  </svg>
                </span>
                {para2}
              </p>
              <p className="flex items-center gap-2">
                <span>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M9.643 13.519H5.767a.775.775 0 0 0-.775.775v3.876c0 .428.347.775.775.775h3.876a.775.775 0 0 0 .775-.775v-3.876a.775.775 0 0 0-.775-.775ZM9.643 4.992H5.767a.775.775 0 0 0-.775.775v3.876c0 .428.347.775.775.775h3.876a.775.775 0 0 0 .775-.775V5.767a.775.775 0 0 0-.775-.775ZM18.17 13.519h-3.876a.775.775 0 0 0-.775.775v3.876c0 .428.347.775.775.775h3.876a.775.775 0 0 0 .775-.775v-3.876a.775.775 0 0 0-.775-.775ZM15.656 4.804l-2.349 2.35c-.26.259-.26.68 0 .939l2.35 2.349c.259.26.68.26.939 0l2.349-2.35c.26-.259.26-.68 0-.939l-2.35-2.349a.664.664 0 0 0-.939 0Z"></path>
                  </svg>
                </span>
                {para3}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandedComp;
