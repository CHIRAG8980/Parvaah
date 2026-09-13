'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AuthFormCard: React.FC = () => {
  const router = useRouter();
  const { login, isLoggingIn, loginError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username.trim()) {
      setLocalError('Please enter your official username or email.');
      return;
    }

    try {
      await login({ username: username.trim(), password });
      router.push('/');
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed.');
    }
  };

  const displayedError = localError || loginError?.message;

  return (
    <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end">
      <div className="w-full max-w-[410px] xl:max-w-[430px] bg-white/[0.96] backdrop-blur-md rounded-[18px] border border-white/80 shadow-[0_20px_50px_rgba(5,24,45,0.3)] p-5 sm:p-6 xl:p-7 flex flex-col motion-card motion-page-enter">
        <div className="text-left pb-3">
          <h2 className="text-[24px] sm:text-[26px] font-bold text-[#0F2346] tracking-tight leading-tight">
            Welcome Back
          </h2>
          <p className="text-[13px] text-[#607494] mt-0.5 font-normal">
            Sign in to access the NER control room
          </p>
        </div>

        {displayedError && (
          <div className="mb-2.5 p-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2 text-[#DC2626] text-xs font-medium motion-shake">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{displayedError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label htmlFor="username" className="block text-[12.5px] font-semibold text-[#0F2346] mb-0.5">
              Username / Official Email
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
                placeholder="Enter official username or email"
                required
                className="w-full h-[42px] pl-10 pr-3 text-[13.5px] bg-white border border-[#D7E2EF] rounded-[8px] text-[#0F2346] focus:outline-none focus:ring-2 focus:ring-[#1769D2]/25 focus:border-[#1769D2] motion-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[12.5px] font-semibold text-[#0F2346] mb-0.5">
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
                placeholder="Enter password"
                required
                className="w-full h-[42px] pl-10 pr-10 text-[13.5px] bg-white border border-[#D7E2EF] rounded-[8px] text-[#0F2346] focus:outline-none focus:ring-2 focus:ring-[#1769D2]/25 focus:border-[#1769D2] motion-input"
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

          <div className="flex items-center justify-between text-[12px] pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[#607494]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 text-[#1769D2] rounded border-[#CBD5E1]"
              />
              <span>Remember session</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full h-[44px] bg-[#1769D2] hover:bg-[#1257B2] active:bg-[#0F448C] text-white font-semibold text-[14px] rounded-[8px] shadow-xs motion-btn group flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer mt-1"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating with Control Room...</span>
              </>
            ) : (
              <>
                <span>Sign In to Control Room</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-180 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-2.5 pt-2 border-t border-[#F1F5F9] text-center">
          <p className="text-[10px] text-[#607494] leading-tight font-medium">
            AI-Based Early Warning & Landslide Risk Monitoring System (NER)
          </p>
        </div>
      </div>
    </div>
  );
};
