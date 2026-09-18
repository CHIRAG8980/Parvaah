'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AuthCardHeaderProps {
  authMode: 'login' | 'register' | 'forgot';
}

export const AuthCardHeader: React.FC<AuthCardHeaderProps> = ({ authMode }) => {
  return (
    <div className="relative pb-5 border-b border-slate-100/90 overflow-hidden">
      {/* Delicate topographic mountain waves seamlessly faded into background */}
      <div
        className="absolute -top-4 -right-4 w-44 h-28 pointer-events-none opacity-25 select-none"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 200 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            d="M20 70C60 40 100 85 140 50C170 25 190 45 200 55V130H20V70Z"
            fill="url(#hill-grad-1)"
          />
          <path
            d="M0 90C50 65 90 100 135 75C170 55 190 70 200 80V130H0V90Z"
            fill="url(#hill-grad-2)"
          />
          <path
            d="M10 68C55 38 98 82 138 48C168 23 188 43 200 53"
            stroke="#10B981"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            opacity="0.6"
          />
          <path
            d="M0 88C48 63 88 98 133 73C168 53 188 68 200 78"
            stroke="#0284C7"
            strokeWidth="1"
            opacity="0.5"
          />
          <defs>
            <linearGradient id="hill-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="hill-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 text-left">
        {/* Official Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 border border-blue-200/70 text-[#1D4ED8] text-[10.5px] font-bold uppercase tracking-wider mb-3 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />
          <span>Secure Government Access</span>
        </div>

        <h2 className="text-[26px] sm:text-[28px] xl:text-[30px] font-bold text-[#0B1E3B] tracking-tight leading-tight">
          {authMode === 'login' && 'NER Control Room'}
          {authMode === 'register' && 'DMO Registration'}
          {authMode === 'forgot' && 'Password Assistance'}
        </h2>

        <p className="text-[13px] sm:text-[13.5px] text-slate-500 mt-1.5 font-normal leading-relaxed">
          {authMode === 'login' && 'Authorized Disaster Management Officer access only.'}
          {authMode === 'register' && 'Official registration for designated District Disaster Management Officers.'}
          {authMode === 'forgot' && 'Secure reset through State Disaster Management Authority verification.'}
        </p>
      </div>
    </div>
  );
};
