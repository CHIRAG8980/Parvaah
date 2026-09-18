'use client';

import React, { useState } from 'react';
import { User, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSwitchMode: (mode: 'login') => void;
  onError: (errorMessage: string | null) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSwitchMode,
  onError,
}) => {
  const [username, setUsername] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim()) {
      onError('Please specify your official username or government email.');
      return;
    }
    onError(null);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mt-5 p-5 bg-emerald-50/80 border border-emerald-200/80 rounded-[14px] text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        <h4 className="text-[14px] font-bold text-emerald-950">Request Submitted to SDMA</h4>
        <p className="text-[12px] text-emerald-800 leading-relaxed">
          Your password reset request for <strong className="font-semibold text-emerald-900">{username}</strong> has been forwarded to the State Disaster Management Authority IT administrator.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            onError(null);
            onSwitchMode('login');
          }}
          className="mt-3 text-[12.5px] font-semibold text-[#1D4ED8] hover:text-[#1E40AF] hover:underline transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-left">
      <div>
        <label htmlFor="forgot-user" className="block text-[12.5px] font-semibold text-slate-800 mb-1.5">
          Official Username or Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            id="forgot-user"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. dmo_east_khasi or official gov email"
            required
            className="w-full h-[46px] pl-10 pr-3.5 text-[13.5px] bg-slate-50/75 hover:bg-white focus:bg-white border border-slate-200/90 rounded-[12px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 transition-all duration-200"
          />
        </div>
      </div>

      <div className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-[10px] text-[12px] text-slate-600 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-[#1D4ED8] flex-shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          State protocol mandates verification through your SDMA coordinator. A temporary access key will be dispatched to your registered credentials.
        </span>
      </div>

      <button
        type="submit"
        className="w-full h-[46px] bg-gradient-to-r from-[#1765D8] to-[#1451B8] hover:from-[#1451B8] hover:to-[#0F3C8C] active:from-[#0E357B] active:to-[#0A275C] text-white font-semibold text-[13.5px] rounded-[12px] shadow-sm hover:shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 pt-0.5"
      >
        <span>Submit Reset Request</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => {
            onError(null);
            onSwitchMode('login');
          }}
          className="text-[12.5px] font-semibold text-[#1D4ED8] hover:text-[#1E40AF] hover:underline cursor-pointer transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
        >
          Back to Sign In
        </button>
      </div>
    </form>
  );
};
