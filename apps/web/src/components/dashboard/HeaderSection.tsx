'use client';

import React from 'react';

export const HeaderSection: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
          AI-Based Early Warning & Landslide Risk Monitoring System (NER)
        </h1>
        <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
          Real-time intelligence for safer communities across North East India
        </p>
      </div>

      {/* Operational Status Pill Badge */}
      <div className="flex items-center self-start md:self-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] text-[12.5px] font-semibold shadow-2xs transition-all duration-180 ease-premium hover:shadow-xs motion-btn select-none">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16A34A]" />
          </span>
          <span>System Operational</span>
        </div>
      </div>
    </div>
  );
};
