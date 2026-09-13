'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const HeaderUserProfile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const name = user?.full_name || 'Shri S. K. Roy';
  const role = user?.role || 'Disaster Management Officer';
  const district = user?.district || 'East Khasi Hills';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DM';

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 pl-1 cursor-pointer select-none motion-btn"
      >
        <div className="w-9 h-9 rounded-full bg-[#163B70] text-white flex items-center justify-center font-bold text-xs shadow-xs transition-transform duration-150 group-hover:scale-105">
          {initials}
        </div>
        <div className="hidden lg:flex flex-col text-left leading-tight">
          <span className="text-[13.5px] font-semibold text-[#0F1F3D] max-w-[130px] truncate">
            {name}
          </span>
          <span className="text-[11.5px] text-[#536B8F] max-w-[130px] truncate">
            {district}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#758CA8] ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-[#DCE6F2] rounded-xl shadow-2xl p-2 z-[1300] text-xs motion-dropdown motion-dropdown-right">
          <div className="px-3 py-2 border-b border-[#F1F5F9]">
            <p className="font-semibold text-[#0F1F3D]">{name}</p>
            <p className="text-[11px] text-[#536B8F]">{role}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3FF] text-[#1769D2]">
              {district} Command
            </span>
          </div>
          <div className="py-1">
            <Link
              href="/login"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out / Switch Officer</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
