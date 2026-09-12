'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  BarChart3,
  Users,
  Leaf,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Landmark,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@ner.gov.in');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Strictly lock html & body to 100vh non-scrollable while on login page
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalHtmlHeight = document.documentElement.style.height;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.height = '100vh';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.height = originalBodyHeight;
      document.documentElement.style.height = originalHtmlHeight;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid official email address.');
      return;
    }

    if (!password || password.length < 4) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/');
    }, 500);
  };

  const handleDemoLogin = () => {
    setEmail('admin@ner.gov.in');
    setPassword('DisasterControl#2025');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/');
    }, 350);
  };

  return (
    <div className="fixed inset-0 h-screen w-screen max-h-screen max-w-screen overflow-hidden flex flex-col justify-between selection:bg-[#EAF3FF] selection:text-[#1769D2]">
      {/* Full-Screen Natural Mountain Photography */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: 'url(/images/auth-mountain-bg.jpg)',
        }}
      />

      {/* Atmospheric Overlays: subtle dark navy gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#071B32]/85 via-[#071B32]/45 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#071B32]/90 via-transparent to-[#071B32]/25 pointer-events-none" />

      {/* Main Single-Screen Viewport Container (Guaranteed Non-Scrollable) */}
      <div className="relative z-10 w-full h-full max-h-screen flex flex-col justify-between p-4 sm:p-6 lg:px-12 lg:py-5 box-border overflow-hidden">
        {/* 1. TOP BAR: Brand (Left) + Government Identity with Tricolor (Right) */}
        <header className="flex items-start justify-between flex-shrink-0 w-full">
          {/* Top-Left Brand */}
          <div className="flex items-center gap-3 select-none">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-white/30 bg-black/20 backdrop-blur-xs">
              <img
                src="/images/logo.png"
                alt="NER Landslide Watch"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[19px] sm:text-[21px] font-bold text-white tracking-tight leading-tight drop-shadow-md">
                NER Landslide Watch
              </span>
              <span className="text-[11.5px] sm:text-[12.5px] font-medium text-slate-200 tracking-tight leading-none mt-0.5 drop-shadow-xs">
                AI Early Warning & Risk Monitoring
              </span>
            </div>
          </div>

          {/* Top-Right Government Branding */}
          <div className="flex flex-col items-end select-none text-right">
            <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.25em] text-white/95 drop-shadow-sm">
              GOVERNMENT OF INDIA
            </span>
            <span className="text-[9px] sm:text-[9.5px] font-semibold tracking-wider text-slate-300 uppercase mt-0.5 drop-shadow-xs">
              SAFER COMMUNITIES &nbsp;|&nbsp; RESILIENT NORTH EAST
            </span>
            {/* Tricolor Accent Bar */}
            <div className="flex items-center h-[2.5px] w-10 sm:w-12 rounded-full overflow-hidden mt-1 shadow-xs">
              <span className="w-1/3 h-full bg-[#FF9933]" />
              <span className="w-1/3 h-full bg-[#FFFFFF]" />
              <span className="w-1/3 h-full bg-[#138808]" />
            </div>
          </div>
        </header>

        {/* 2. MAIN SECTION: Left Hero Content & Right Auth Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center flex-1 min-h-0 my-auto">
          {/* LEFT SIDE: Eyebrow + Heading + Subtitle + Capabilities + Quote Panel */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center text-white space-y-3 xl:space-y-4">
            {/* Eyebrow & Hero Heading */}
            <div>
              <div className="text-[10.5px] sm:text-[11.5px] font-bold tracking-[0.22em] uppercase text-slate-300 mb-1.5 drop-shadow-sm">
                EARLY WARNING &nbsp;•&nbsp; SMARTER DECISIONS &nbsp;•&nbsp; SAFER COMMUNITIES
              </div>
              <h1 className="text-[34px] sm:text-[40px] xl:text-[46px] font-bold leading-[1.08] tracking-tight drop-shadow-xl">
                <span className="text-white block">Safer Communities</span>
                <span className="text-[#8FC8FF] block">Stronger North East</span>
              </h1>
              <p className="text-[14px] sm:text-[15px] text-slate-100 font-normal leading-relaxed mt-2 max-w-[480px] drop-shadow-md">
                AI-powered early warning and landslide risk monitoring for a resilient tomorrow.
              </p>
            </div>

            {/* Horizontal Capability Indicators (Row of 4) */}
            <div className="flex items-center gap-2.5 sm:gap-4 pt-0.5 flex-wrap sm:flex-nowrap">
              {/* Item 1: Monitor Risks */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-[#8FC8FF] shadow-xs">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11.5px] font-bold text-white">Monitor</span>
                  <span className="text-[10.5px] font-medium text-slate-200">Risks</span>
                </div>
              </div>

              <div className="hidden sm:block h-6 w-px bg-white/15" />

              {/* Item 2: Real-time Insights */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-[#8FC8FF] shadow-xs">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11.5px] font-bold text-white">Real-time</span>
                  <span className="text-[10.5px] font-medium text-slate-200">Insights</span>
                </div>
              </div>

              <div className="hidden sm:block h-6 w-px bg-white/15" />

              {/* Item 3: Better Coordination */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-[#8FC8FF] shadow-xs">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11.5px] font-bold text-white">Better</span>
                  <span className="text-[10.5px] font-medium text-slate-200">Coordination</span>
                </div>
              </div>

              <div className="hidden sm:block h-6 w-px bg-white/15" />

              {/* Item 4: Safer Communities */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-xs flex items-center justify-center flex-shrink-0 text-[#8FC8FF] shadow-xs">
                  <Leaf className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11.5px] font-bold text-white">Safer</span>
                  <span className="text-[10.5px] font-medium text-slate-200">Communities</span>
                </div>
              </div>
            </div>

            {/* Bottom-Left Quote Panel */}
            <div className="max-w-[530px] w-full bg-[#05182D]/70 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="w-1 h-5 bg-[#1769D2] rounded-full flex-shrink-0" />
                <div className="text-[12px] sm:text-[12.5px] italic text-white font-medium leading-snug">
                  &ldquo;Prepared Today.
                  <br />
                  A Safer North East Tomorrow.&rdquo;
                </div>
              </div>
              <div className="text-[9.5px] font-bold tracking-widest text-slate-300 uppercase whitespace-nowrap pl-3">
                — DISASTER RESILIENT INDIA
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Compact White Authentication Card */}
          <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[410px] xl:max-w-[430px] bg-white/[0.96] backdrop-blur-md rounded-[18px] border border-white/80 shadow-[0_20px_50px_rgba(5,24,45,0.3)] p-5 sm:p-6 xl:p-7 flex flex-col motion-card motion-page-enter">
              {/* Card Header */}
              <div className="text-left pb-3">
                <h2 className="text-[24px] sm:text-[26px] font-bold text-[#0F2346] tracking-tight leading-tight">
                  Welcome Back
                </h2>
                <p className="text-[13px] text-[#607494] mt-0.5 font-normal">
                  Sign in to access the NER control room
                </p>
              </div>

              {/* Error Notice with Shake */}
              {error && (
                <div className="mb-2.5 p-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2 text-[#DC2626] text-xs font-medium motion-shake">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[12.5px] font-semibold text-[#0F2346] mb-0.5"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#607494]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@ner.gov.in"
                      required
                      className="w-full h-[42px] pl-10 pr-3 text-[13.5px] bg-white border border-[#D7E2EF] rounded-[8px] text-[#0F2346] placeholder:text-[#8497B0] focus:outline-none focus:ring-2 focus:ring-[#1769D2]/25 focus:border-[#1769D2] motion-input"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-[12.5px] font-semibold text-[#0F2346] mb-0.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#607494]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full h-[42px] pl-10 pr-10 text-[13.5px] bg-white border border-[#D7E2EF] rounded-[8px] text-[#0F2346] placeholder:text-[#8497B0] focus:outline-none focus:ring-2 focus:ring-[#1769D2]/25 focus:border-[#1769D2] motion-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#607494] hover:text-[#0F2346] focus:outline-none cursor-pointer motion-btn"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember / Forgot row */}
                <div className="flex items-center justify-between text-[12px] pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[#607494] hover:text-[#0F2346]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#1769D2] rounded border-[#CBD5E1] focus:ring-0 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>

                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Please contact the State Disaster Management Authority Administrator to reset credentials.');
                    }}
                    className="font-semibold text-[#1769D2] hover:text-[#1257B2] transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[44px] bg-[#1769D2] hover:bg-[#1257B2] active:bg-[#0F448C] text-white font-semibold text-[14px] rounded-[8px] shadow-xs hover:shadow motion-btn group flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed mt-1 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-180 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-2.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E2E8F0]" />
                </div>
                <div className="relative flex justify-center text-[10.5px] uppercase">
                  <span className="bg-white/95 px-2.5 text-[#607494] font-semibold tracking-wider">
                    OR
                  </span>
                </div>
              </div>

              {/* Secondary Demo Action Button */}
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full h-[40px] bg-white hover:bg-[#F4F8FC] border border-[#1769D2] text-[#1769D2] font-semibold text-[13px] rounded-[8px] motion-btn flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Landmark className="w-3.5 h-3.5 text-[#1769D2]" />
                <span>Continue as Demo</span>
              </button>

              {/* Auth Footer */}
              <div className="mt-2.5 pt-2 border-t border-[#F1F5F9] text-center">
                <p className="text-[10px] text-[#607494] leading-tight font-medium">
                  AI-Based Early Warning & Landslide Risk Monitoring System (NER)
                </p>
                <p className="text-[8.5px] tracking-[0.18em] text-[#607494]/75 font-bold uppercase mt-0.5">
                  MONITOR &nbsp;|&nbsp; ANALYZE &nbsp;|&nbsp; RESPOND &nbsp;|&nbsp; PROTECT
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
