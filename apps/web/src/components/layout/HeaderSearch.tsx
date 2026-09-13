'use client';

import React from 'react';
import { Search } from 'lucide-react';

export const HeaderSearch: React.FC = () => {
  return (
    <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#758CA8]">
        <Search className="w-4 h-4 transition-colors duration-150" />
      </div>
      <input
        type="text"
        placeholder="Search location, district, road, or alert..."
        className="w-full h-10 pl-10 pr-12 text-[13.5px] bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg placeholder:text-[#8497B0] text-[#0F1F3D] focus:outline-none focus:ring-2 focus:ring-[#1769D2]/20 focus:border-[#1769D2] focus:bg-white motion-input"
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <kbd className="px-1.5 py-0.5 text-[11px] font-semibold text-[#64748B] bg-white border border-[#CBD5E1] rounded shadow-2xs">
          ⌘K
        </kbd>
      </div>
    </div>
  );
};
