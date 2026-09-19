import React from 'react';

export const BackgroundWaves: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#F4F8FC]">
      {/* Soft gradient ambient backdrops */}
      <div className="absolute top-[-10%] right-[-5%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-blue-100/50 to-blue-50/20 blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-sky-100/40 via-blue-50/20 to-transparent blur-3xl" />
      <div className="absolute top-[35%] left-[20%] w-[450px] h-[450px] rounded-full bg-gradient-to-r from-emerald-50/30 to-blue-50/15 blur-2xl" />

      {/* Subtle Healthcare Flowing Waves SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#EFF6FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="wave-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#BFDBFE" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Dynamic smooth healthcare waves */}
        <path
          d="M0,320 C320,400 420,240 720,290 C1020,340 1140,220 1440,260 L1440,900 L0,900 Z"
          fill="url(#wave-grad-1)"
        />
        <path
          d="M0,500 C360,420 540,580 900,490 C1260,400 1340,530 1440,490 L1440,900 L0,900 Z"
          fill="url(#wave-grad-2)"
        />
      </svg>

      {/* Very Subtle Clinical Line Art Watermarks (hospital desk & patient queue line art, pulse wave, cross) */}
      <div className="absolute bottom-6 inset-x-0 flex justify-center items-end opacity-[0.07] px-12">
        <svg
          className="w-full max-w-5xl h-36"
          viewBox="0 0 1000 120"
          fill="none"
          stroke="#1E3A8A"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Hospital reception silhouette line art */}
          {/* Desk */}
          <line x1="100" y1="100" x2="900" y2="100" />
          <rect x="220" y="70" width="140" height="30" rx="3" />
          <line x1="260" y1="60" x2="260" y2="70" />
          <circle cx="260" cy="50" r="10" />

          {/* Computer monitor */}
          <rect x="300" y="55" width="24" height="15" rx="1" />
          <line x1="312" y1="70" x2="312" y2="73" />
          <line x1="306" y1="73" x2="318" y2="73" />

          {/* Doctor / Attendant */}
          <circle cx="480" cy="45" r="9" />
          <path d="M465 72 C465 58 495 58 495 72" />

          {/* Patient with walking stick / wheelchair outline */}
          <circle cx="680" cy="48" r="8" />
          <path d="M670 75 C670 63 692 63 692 75" />
          <circle cx="680" cy="85" r="14" />
          <line x1="680" y1="75" x2="680" y2="85" />

          {/* ECG Pulse wave snippet */}
          <path
            d="M50,40 L90,40 L98,25 L106,55 L114,35 L120,40 L160,40"
            strokeWidth="1.5"
            stroke="#2563EB"
          />

          {/* Medical Cross Watermarks */}
          <g transform="translate(850, 30)">
            <rect x="12" y="0" width="6" height="30" rx="2" fill="#2563EB" opacity="0.4" />
            <rect x="0" y="12" width="30" height="6" rx="2" fill="#2563EB" opacity="0.4" />
          </g>
          <g transform="translate(40, 55)">
            <rect x="8" y="0" width="4" height="20" rx="1" fill="#10B981" opacity="0.4" />
            <rect x="0" y="8" width="20" height="4" rx="1" fill="#10B981" opacity="0.4" />
          </g>
        </svg>
      </div>
    </div>
  );
};
