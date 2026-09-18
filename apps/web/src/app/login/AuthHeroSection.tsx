'use client';

import React from 'react';
import { Shield, BarChart3, Users, Leaf } from 'lucide-react';

export const AuthHeroSection: React.FC = () => {
  return (
    <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center text-white space-y-5 xl:space-y-7 text-left max-w-[680px]">
      <div>
        <div className="text-[11px] sm:text-[12px] font-bold tracking-[0.24em] uppercase text-slate-300/90 mb-2.5">
          EARLY WARNING &nbsp;•&nbsp; SMARTER DECISIONS &nbsp;•&nbsp; SAFER COMMUNITIES
        </div>
        <h1 className="text-[40px] sm:text-[50px] lg:text-[56px] xl:text-[64px] font-bold leading-[1.06] tracking-tight">
          <span className="text-white block">Safer Communities</span>
          <span className="text-[#34D399] sm:text-[#4ADE80] block mt-1">Stronger North East</span>
        </h1>
        <p className="text-[15.5px] sm:text-[17px] text-slate-100/90 font-normal leading-relaxed mt-3.5 max-w-[560px]">
          AI-powered early warning and landslide risk monitoring for a resilient tomorrow.
        </p>
      </div>

      {/* Feature metric pills with frosted circular badges */}
      <div className="flex items-center gap-3.5 sm:gap-6 pt-1 flex-wrap sm:nowrap">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full border border-white/25 bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-white shadow-xs">
            <Shield className="w-4 h-4 text-[#34D399]" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[12.5px] font-bold text-white">Monitor</span>
            <span className="text-[11px] font-medium text-slate-200">Risks</span>
          </div>
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/20" />

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full border border-white/25 bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-white shadow-xs">
            <BarChart3 className="w-4 h-4 text-[#34D399]" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[12.5px] font-bold text-white">Real-time</span>
            <span className="text-[11px] font-medium text-slate-200">Insights</span>
          </div>
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/20" />

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full border border-white/25 bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-white shadow-xs">
            <Users className="w-4 h-4 text-[#34D399]" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[12.5px] font-bold text-white">Better</span>
            <span className="text-[11px] font-medium text-slate-200">Coordination</span>
          </div>
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/20" />

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full border border-white/25 bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-white shadow-xs">
            <Leaf className="w-4 h-4 text-[#34D399]" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[12.5px] font-bold text-white">Safer</span>
            <span className="text-[11px] font-medium text-slate-200">Communities</span>
          </div>
        </div>
      </div>

      {/* Quote Banner with Emerald Accent Pill */}
      <div className="w-full max-w-[580px] xl:max-w-[620px] bg-[#05182D]/70 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3.5">
          <span className="w-1.5 h-7 bg-[#22C55E] rounded-full flex-shrink-0" />
          <div className="text-[13px] sm:text-[14px] italic text-white font-medium leading-snug">
            &ldquo;Prepared Today.
            <br />
            A Safer North East Tomorrow.&rdquo;
          </div>
        </div>
        <div className="text-[10px] sm:text-[10.5px] font-bold tracking-widest text-slate-300 uppercase whitespace-nowrap pl-4">
          — DISASTER RESILIENT INDIA
        </div>
      </div>
    </div>
  );
};
