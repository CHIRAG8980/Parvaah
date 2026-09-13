'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AuthFormCard: React.FC = () => {
  const router = useRouter();
  const { login, isLoggingIn, loginError } = useAuth();

  const [username, setUsername] = useState('dmo_east_khasi');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username.trim()) {
      setLocalError('Please enter your official username.');
      return;
    }

    try {
      await login({ username: username.trim(), password });
      router.push('/');
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed.');
    }
  };

  const handleQuickSelect = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setLocalError(null);
  };

  const displayedError = localError || loginError?.message;

  return (
    <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end">
      <div className="w-full max-w-[420px] xl:max-w-[440px] bg-white/[0.96] backdrop-blur-md rounded-[18px] border border-white/80 shadow-[0_20px_50px_rgba(5,24,45,0.3)] p-5 sm:p-6 xl:p-7 flex flex-col motion-card motion-page-enter">
        <div className="text-left pb-3">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#1769D2] text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3 h-3" />
            <span>Official Access Only</span>
          </div>
          <h2 className="text-[24px] sm:text-[26px] font-bold text-[#0F2346] tracking-tight leading-tight">
            NER Control Room
          </h2>
          <p className="text-[12.5px] text-[#607494] mt-0.5 font-normal">
            Sign in with authorized government disaster management credentials
          </p>
        </div>

        {displayedError && (
          <div className="mb-2.5 p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2 text-[#DC2626] text-xs font-medium motion-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{displayedError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label htmlFor="username" className="block text-[12px] font-semibold text-[#0F2346] mb-0.5">
              Official Username / ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#607494]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. dmo_east_khasi, sdma_director, admin"
                required
                className="w-full h-[40px] pl-10 pr-3 text-[13px] bg-white border border-[#D7E2EF] rounded-[8px] text-[#0F2346] focus:outline-none focus:ring-2 focus:ring-[#1769D2]/25 focus:border-[#1769D2] motion-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[12px] font-semibold text-[#0F2346] mb-0.5">
              Access Password
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
                placeholder="Enter password"
                required
                className="w-full h-[40px] pl-10 pr-10 text-[13px] bg-white border border-[#D7E2EF] rounded-[8px] text-[#0F2346] focus:outline-none focus:ring-2 focus:ring-[#1769D2]/25 focus:border-[#1769D2] motion-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#607494] hover:text-[#0F2346] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Officer Selection for Demo Testing */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] text-[#607494] mb-1 font-medium">
              <span>Quick Demo Roles:</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10.5px]">
              <button
                type="button"
                onClick={() => handleQuickSelect('dmo_east_khasi', 'password123')}
                className={`py-1 px-1.5 rounded-md border text-center font-medium transition-colors ${
                  username === 'dmo_east_khasi'
                    ? 'bg-[#EAF3FF] border-[#1769D2] text-[#1769D2] font-semibold'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-slate-100'
                }`}
              >
                District DMO
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('sdma_director', 'password123')}
                className={`py-1 px-1.5 rounded-md border text-center font-medium transition-colors ${
                  username === 'sdma_director'
                    ? 'bg-[#EAF3FF] border-[#1769D2] text-[#1769D2] font-semibold'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-slate-100'
                }`}
              >
                State SDMA
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('admin', 'password123')}
                className={`py-1 px-1.5 rounded-md border text-center font-medium transition-colors ${
                  username === 'admin'
                    ? 'bg-[#EAF3FF] border-[#1769D2] text-[#1769D2] font-semibold'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-slate-100'
                }`}
              >
                Admin (HQ)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full h-[42px] bg-[#1769D2] hover:bg-[#1257B2] active:bg-[#0F448C] text-white font-semibold text-[13.5px] rounded-[8px] shadow-xs motion-btn group flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer mt-2"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Session...</span>
              </>
            ) : (
              <>
                <span>Secure Sign In</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-180 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] text-center">
          <p className="text-[10px] text-[#607494] leading-tight font-medium">
            Protected under Government of India Disaster Management Act • HttpOnly Cookie Secured
          </p>
        </div>
      </div>
    </div>
  );
};
