'use client';

import React from 'react';

interface SidebarLandscapePanelProps {
  isCollapsed: boolean;
}

export const SidebarLandscapePanel: React.FC<SidebarLandscapePanelProps> = ({ isCollapsed }) => {
  return (
    <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-end min-h-[190px]">
      <div
        className="absolute inset-x-0 -top-[52px] bottom-0 bg-cover bg-[position:center_top] bg-no-repeat transition-transform duration-280 ease-premium"
        style={{
          backgroundImage: 'url(/images/sidebar-mountain.jpg)',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#F6FAFE] via-[#F6FAFE]/40 to-transparent pointer-events-none z-1" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#051932]/95 via-[#051932]/60 to-transparent pointer-events-none z-1" />

      <div
        className={`relative z-10 px-4 pb-4 pt-1 text-white mt-auto select-none transition-all duration-200 ease-premium ${
          isCollapsed
            ? 'opacity-0 max-h-0 pointer-events-none overflow-hidden'
            : 'opacity-100 max-h-40'
        }`}
      >
        <div className="w-10 h-[3px] bg-[#1683FF] rounded-full mb-2 shadow-xs" />
        <h4 className="text-[15px] font-bold leading-tight tracking-tight text-white drop-shadow-sm">
          Safer Hills
        </h4>
        <h4 className="text-[15px] font-bold leading-tight tracking-tight text-white mb-1.5 drop-shadow-sm">
          Stronger Communities
        </h4>
        <p className="text-[10.5px] text-[#BFD0E6] leading-snug font-normal drop-shadow-xs">
          Early Warning. Faster Action.
        </p>
        <p className="text-[10.5px] text-[#BFD0E6] leading-snug font-normal drop-shadow-xs">
          A Safer North East.
        </p>
      </div>
    </div>
  );
};
