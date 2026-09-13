'use client';

import React from 'react';

export const MapLegendCard: React.FC = () => {
  return (
    <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-xs border border-[#DCE6F2] rounded-lg shadow-md p-3 text-[11.5px] pointer-events-auto">
      <div className="font-bold text-[#0F1F3D] mb-1.5 text-[12px]">
        Landslide Risk Level
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[#334155]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] flex-shrink-0" />
          <span>Low (0 - 30)</span>
        </div>
        <div className="flex items-center gap-2 text-[#334155]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] flex-shrink-0" />
          <span>Medium (31 - 60)</span>
        </div>
        <div className="flex items-center gap-2 text-[#334155]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] flex-shrink-0" />
          <span>High (61 - 80)</span>
        </div>
        <div className="flex items-center gap-2 text-[#334155]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] flex-shrink-0" />
          <span>Critical (81 - 100)</span>
        </div>
      </div>
    </div>
  );
};
