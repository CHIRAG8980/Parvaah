'use client';

import React from 'react';
import { Activity } from 'lucide-react';

export const HeaderSection: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
          AI-Based Early Warning & Landslide Risk Monitoring System (NER)
        </h1>
        <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
          Real-time intelligence for safer communities across North East India
        </p>
      </div>

      <div className="flex items-center gap-2 self-start md:self-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981] text-xs font-semibold shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
          </span>
          <Activity className="w-3.5 h-3.5" />
          <span>Live Telemetry Active</span>
        </div>
      </div>
    </div>
  );
};
