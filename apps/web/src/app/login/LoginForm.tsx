'use client';

import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import type { LoginRequest, TokenResponse } from '@/lib/api/types';

interface LoginFormProps {
  onLogin: (credentials: LoginRequest) => Promise<TokenResponse>;
  isLoading: boolean;
  onSwitchMode: (mode: 'register' | 'forgot') => void;
  onError: (errorMessage: string | null) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  isLoading,
  onSwitchMode,
  onError,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      onError('Please enter your official username / ID.');
      return;
    }
    if (!password) {
      onError('Please enter your access password.');
      return;
    }

    try {
      await onLogin({ username: trimmedUsername, password });
      window.location.href = '/';
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-5">
      <div>
        <label htmlFor="login-username" className="block text-[12.5px] font-semibold text-slate-800 mb-1.5 text-left">
          Official Username / ID
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your government ID"
            required
            autoComplete="username"
            className="w-full h-[46px] pl-10 pr-3.5 text-[13.5px] bg-slate-50/75 hover:bg-white focus:bg-white border border-slate-200/90 rounded-[12px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 transition-all duration-200"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="login-password" className="text-[12.5px] font-semibold text-slate-800 text-left">
            Access Password
          </label>
          <button
            type="button"
            onClick={() => {
              onError(null);
              onSwitchMode('forgot');
            }}
            className="text-[11.5px] font-semibold text-[#1D4ED8] hover:text-[#1E40AF] hover:underline cursor-pointer transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
          >
            Forgot Password?
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your secure password"
            required
            autoComplete="current-password"
            className="w-full h-[46px] pl-10 pr-10 text-[13.5px] bg-slate-50/75 hover:bg-white focus:bg-white border border-slate-200/90 rounded-[12px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-[48px] bg-gradient-to-r from-[#1765D8] to-[#1451B8] hover:from-[#1451B8] hover:to-[#0F3C8C] active:from-[#0E357B] active:to-[#0A275C] text-white font-semibold text-[14px] rounded-[12px] shadow-sm hover:shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 pt-0.5"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying Credentials...</span>
          </>
        ) : (
          <>
            <span>Secure Sign In</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 hover:translate-x-0.5" />
          </>
        )}
      </button>

      <div className="pt-2 text-center">
        <p className="text-[12.5px] text-slate-500">
          New DMO?{' '}
          <button
            type="button"
            onClick={() => {
              onError(null);
              onSwitchMode('register');
            }}
            className="font-semibold text-[#1D4ED8] hover:text-[#1E40AF] hover:underline cursor-pointer transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
          >
            Register for access
          </button>
        </p>
      </div>
    </form>
  );
};
