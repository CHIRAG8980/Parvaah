'use client';

import React, { useState, useEffect } from 'react';

export const HeaderClock: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);
    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = now
        .toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
        .toUpperCase();

      setCurrentDate(dateStr);
      setCurrentTime(timeStr);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden sm:flex flex-col text-right border-r border-[#E2E8F0] pr-5 leading-tight select-none">
      <span className="text-[12px] text-[#536B8F] font-medium">
        {isMounted && currentDate ? currentDate : '--'}
      </span>
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[13.5px] font-bold text-[#0F1F3D] font-mono tracking-tight">
          {isMounted && currentTime ? currentTime : '--:--:-- --'}
        </span>
        <span className="text-[10px] font-bold text-[#1769D2] bg-[#EAF3FF] px-1 rounded">
          IST
        </span>
      </div>
    </div>
  );
};
