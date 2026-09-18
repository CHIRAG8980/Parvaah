'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const AuthCardSecurityBadge: React.FC = () => {
  return (
    <div className="mt-5 pt-3.5 border-t border-slate-100">
      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-600 shadow-xs">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[11.5px] font-semibold text-slate-700 leading-tight">
            Protected under Government of India Disaster Management Act
          </span>
          <span className="text-[10.5px] text-slate-500 leading-tight mt-0.5">
            HttpOnly Secure Cookies &nbsp;•&nbsp; Encrypted Government Data
          </span>
        </div>
      </div>
    </div>
  );
};
