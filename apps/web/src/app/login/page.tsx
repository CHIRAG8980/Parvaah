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
    <div className="fixed inset-0 h-screen w-screen max-h-screen max-w-screen overflow-y-auto lg:overflow-hidden flex flex-col justify-between selection:bg-[#EAF3FF] selection:text-[#1765D8]">
      {/* Background Scenic Mountain Imagery & Environmental Sunbeam */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: 'url(/images/auth-mountain-bg.jpg)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#05182D]/90 via-[#05182D]/55 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#05182D]/95 via-transparent to-[#05182D]/35 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_25%,rgba(255,255,255,0.22),transparent_50%)] pointer-events-none" />

      {/* Centered Constrained Container to Eliminate Excess Dead Space */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto h-full max-h-screen flex flex-col justify-between p-4 sm:p-6 lg:px-8 xl:px-12 lg:py-6 box-border">
        {/* Top Header Branding (Strictly No Center Navbar) */}
        <header className="flex items-start justify-between flex-shrink-0 w-full">
          <div className="flex items-center gap-3 select-none">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-white/30 bg-black/25 backdrop-blur-xs">
              <Image
                src="/images/logo.png"
                alt="NER Landslide Watch"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                priority
              />
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[19px] sm:text-[21px] font-bold text-white tracking-tight leading-tight">
                NER Landslide Watch
              </span>
              <span className="text-[11.5px] sm:text-[12.5px] font-medium text-slate-200 tracking-tight leading-none mt-0.5">
                AI Early Warning &amp; Risk Monitoring
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

        {/* Center Content: Hero & Auth Card with Balanced Grid Gap */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-center flex-1 min-h-0 my-auto py-3">
          <AuthHeroSection />
          <AuthFormCard />
        </main>

        {/* Bottom Ticker & Operational Motto */}
        <footer className="flex items-center justify-between flex-shrink-0 w-full pt-2 pb-0.5 text-slate-300/85 select-none">
          <div className="flex items-center gap-5 sm:gap-7 text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase">
            <div className="flex flex-col">
              <span className="text-white">SEE FARTHER</span>
              <span className="h-[2px] w-full bg-[#22C55E] mt-0.5 rounded-full" />
            </div>
            <span className="hover:text-white transition-colors cursor-default">ACT SOONER</span>
            <span className="hover:text-white transition-colors cursor-default">TOGETHER, SAFER</span>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-slate-300/80">
            <span>A RESILIENT TODAY</span>
            <span className="text-slate-500">•</span>
            <span>A SAFER TOMORROW</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
