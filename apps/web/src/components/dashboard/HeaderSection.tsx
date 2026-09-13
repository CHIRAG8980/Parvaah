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
    </div>
  );
};
