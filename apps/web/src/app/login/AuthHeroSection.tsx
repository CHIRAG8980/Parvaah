'use client';

import React from 'react';
import { Shield, BarChart3, Users, Leaf } from 'lucide-react';

export const AuthHeroSection: React.FC = () => {
  return (
    <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center text-white space-y-3 xl:space-y-4">
      <div>
        <div className="text-[10.5px] sm:text-[11.5px] font-bold tracking-[0.22em] uppercase text-slate-300 mb-1.5 drop-shadow-sm">
          EARLY WARNING &nbsp;•&nbsp; SMARTER DECISIONS &nbsp;•&nbsp; SAFER COMMUNITIES
        </div>
        <h1 className="text-[34px] sm:text-[40px] xl:text-[46px] font-bold leading-[1.08] tracking-tight drop-shadow-xl">
          <span className="text-white block">Safer Communities</span>
          <span className="text-[#8FC8FF] block">Stronger North East</span>
        </h1>
        <p className="text-[14px] sm:text-[15px] text-slate-100 font-normal leading-relaxed mt-2 max-w-[480px] drop-shadow-md">
          AI-powered early warning and landslide risk monitoring for a resilient tomorrow.
        </p>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4 pt-0.5 flex-wrap sm:nowrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-[#8FC8FF]">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11.5px] font-bold text-white">Monitor</span>
            <span className="text-[10.5px] font-medium text-slate-200">Risks</span>
          </div>
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/15" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-[#8FC8FF]">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11.5px] font-bold text-white">Real-time</span>
            <span className="text-[10.5px] font-medium text-slate-200">Insights</span>
          </div>
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/15" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-[#8FC8FF]">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11.5px] font-bold text-white">Better</span>
            <span className="text-[10.5px] font-medium text-slate-200">Coordination</span>
          </div>
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/15" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-[#8FC8FF]">
            <Leaf className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11.5px] font-bold text-white">Safer</span>
            <span className="text-[10.5px] font-medium text-slate-200">Communities</span>
          </div>
        </div>
      </div>

      <div className="max-w-[530px] w-full bg-[#05182D]/70 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="w-1 h-5 bg-[#1769D2] rounded-full flex-shrink-0" />
          <div className="text-[12px] sm:text-[12.5px] italic text-white font-medium leading-snug">
            &ldquo;Prepared Today.
            <br />
            A Safer North East Tomorrow.&rdquo;
          </div>
        </div>
        <div className="text-[9.5px] font-bold tracking-widest text-slate-300 uppercase whitespace-nowrap pl-3">
          — DISASTER RESILIENT INDIA
        </div>
      </div>
    </div>
  );
};
