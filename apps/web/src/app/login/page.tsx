'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { AuthHeroSection } from './AuthHeroSection';
import { AuthFormCard } from './AuthFormCard';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 h-screen w-screen max-h-screen max-w-screen overflow-hidden flex flex-col justify-between selection:bg-[#EAF3FF] selection:text-[#1769D2]">
      {/* Background imagery */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: 'url(/images/auth-mountain-bg.jpg)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#071B32]/85 via-[#071B32]/45 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#071B32]/90 via-transparent to-[#071B32]/25 pointer-events-none" />

      {/* Main Single-Screen Viewport Container */}
      <div className="relative z-10 w-full h-full max-h-screen flex flex-col justify-between p-4 sm:p-6 lg:px-12 lg:py-5 box-border overflow-hidden">
        {/* Header Branding */}
        <header className="flex items-start justify-between flex-shrink-0 w-full">
          <div className="flex items-center gap-3 select-none">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-white/30 bg-black/20 backdrop-blur-xs">
              <Image src="/images/logo.png" alt="Parvaah Logo" width={36} height={36} className="w-full h-full object-cover" priority />
            </div>

            <div className="flex flex-col">
              <span className="text-[19px] sm:text-[21px] font-bold text-white tracking-tight leading-tight drop-shadow-md">
                Parvaah
              </span>
              <span className="text-[11.5px] sm:text-[12.5px] font-medium text-slate-200 tracking-tight leading-none mt-0.5">
                AI Early Warning & Risk Monitoring
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end select-none text-right">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.25em] text-white/95">
              GOVERNMENT OF INDIA
            </span>
            <span className="text-[9px] sm:text-[9.5px] font-semibold tracking-wider text-slate-300 uppercase mt-0.5">
              SAFER COMMUNITIES &nbsp;|&nbsp; RESILIENT NORTH EAST
            </span>
            <div className="flex items-center h-[2.5px] w-10 sm:w-12 rounded-full overflow-hidden mt-1 shadow-xs">
              <span className="w-1/3 h-full bg-[#FF9933]" />
              <span className="w-1/3 h-full bg-[#FFFFFF]" />
              <span className="w-1/3 h-full bg-[#138808]" />
            </div>
          </div>
        </header>

        {/* Content Hero + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center flex-1 min-h-0 my-auto">
          <AuthHeroSection />
          <AuthFormCard />
        </div>
      </div>
    </div>
  );
}
