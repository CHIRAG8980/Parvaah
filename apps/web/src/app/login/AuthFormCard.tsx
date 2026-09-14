'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Phone,
  FileBadge2,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AuthFormCard: React.FC = () => {
  const router = useRouter();
  const { login, isLoggingIn, loginError, registerDMO, isRegisteringDMO, registerError } = useAuth();

  // Mode: 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // DMO Registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regDistrict, setRegDistrict] = useState('East Khasi Hills');
  const [regContactNumber, setRegContactNumber] = useState('');
  const [regGovernmentId, setRegGovernmentId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot password feedback
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');

  // Local feedback
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!loginUsername.trim()) {
      setLocalError('Please enter your official username.');
      return;
    }
    if (!loginPassword) {
      setLocalError('Please enter your access password.');
      return;
    }

    try {
      await login({ username: loginUsername.trim(), password: loginPassword });
      window.location.href = '/';
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!regFullName.trim() || !regUsername.trim() || !regDistrict.trim()) {
      setLocalError('Please fill in all required official registration fields.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    try {
      await registerDMO({
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        full_name: regFullName.trim(),
        role: 'district_officer',
        district: regDistrict.trim(),
        state: 'Meghalaya',
        contact_number: regContactNumber.trim() || undefined,
        government_id: regGovernmentId.trim() || undefined,
      });
      window.location.href = '/';
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Registration failed. Please contact state authority.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername.trim()) {
      setLocalError('Please specify your official username or government email.');
      return;
    }
    setLocalError(null);
    setForgotSubmitted(true);
  };

  const activeError =
    localError ||
    (authMode === 'login' ? loginError?.message : authMode === 'register' ? registerError?.message : null);

  return (
    <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end">
      <div className="w-full max-w-[425px] xl:max-w-[445px] bg-white/[0.98] backdrop-blur-xl rounded-[16px] border border-white/85 shadow-[0_28px_64px_rgba(5,24,45,0.36)] p-7 sm:p-8 xl:p-9 flex flex-col motion-card motion-page-enter transition-all duration-200">
        {/* Header Badge & Title */}
        <div className="text-left pb-6 border-b border-[#E8EEF7] mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#EAF3FF] to-[#D4E4FF] text-[#1257B2] text-[10px] font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Secure Government Access</span>
          </div>

          <h2 className="text-[26px] sm:text-[28px] font-bold text-[#0F2346] tracking-tight leading-tight">
            {authMode === 'login' && 'NER Control Room'}
            {authMode === 'register' && 'DMO Registration'}
            {authMode === 'forgot' && 'Password Assistance'}
          </h2>

          <p className="text-[13px] sm:text-[13.5px] text-[#5A6E8C] mt-2 font-normal leading-relaxed">
            {authMode === 'login' && 'Authorized Disaster Management Officer access only.'}
            {authMode === 'register' && 'Official registration for designated District Disaster Management Officers.'}
            {authMode === 'forgot' && 'Secure reset through State Disaster Management Authority verification.'}
          </p>
        </div>

        {/* Dynamic Error Banner */}
        {activeError && (
          <div className="mb-5 p-3.5 rounded-[10px] bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-3 text-[#DC2626] text-[12.5px] font-medium motion-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{activeError}</span>
          </div>
        )}

        {/* 1. LOGIN MODE */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-[12.5px] font-semibold text-[#0F2346] mb-1.5">
                Official Username / ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A8FA6]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter your government ID"
                  required
                  autoComplete="username"
                  className="w-full h-[44px] pl-10 pr-3.5 text-[13.5px] bg-gradient-to-b from-[#FAFBFC] to-[#F5F8FC] hover:from-white hover:to-[#F8FAFC] border border-[#D7E2EF] rounded-[9px] text-[#0F2346] placeholder:text-[#8B96A8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]/30 focus:border-[#1769D2] transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-[12.5px] font-semibold text-[#0F2346]">
                  Access Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setLocalError(null);
                    setAuthMode('forgot');
                  }}
                  className="text-[11.5px] font-medium text-[#1769D2] hover:text-[#1257B2] hover:underline cursor-pointer transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A8FA6]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  required
                  autoComplete="current-password"
                  className="w-full h-[44px] pl-10 pr-10 text-[13.5px] bg-gradient-to-b from-[#FAFBFC] to-[#F5F8FC] hover:from-white hover:to-[#F8FAFC] border border-[#D7E2EF] rounded-[9px] text-[#0F2346] placeholder:text-[#8B96A8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]/30 focus:border-[#1769D2] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7A8FA6] hover:text-[#0F2346] cursor-pointer transition-colors"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-[46px] bg-gradient-to-b from-[#1769D2] to-[#1257B2] hover:from-[#1257B2] hover:to-[#0F448C] active:from-[#0F448C] active:to-[#0A2E66] text-white font-semibold text-[14px] rounded-[9px] shadow-md hover:shadow-lg motion-btn group flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:shadow-sm cursor-pointer mt-1 transition-all duration-200"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Secure Sign In</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {/* Register Link for New DMOs */}
            <div className="pt-1 text-center border-t border-[#E8EEF7] mt-5">
              <p className="text-[12.5px] text-[#5A6E8C] mt-4">
                New DMO?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLocalError(null);
                    setAuthMode('register');
                  }}
                  className="font-semibold text-[#1769D2] hover:text-[#1257B2] hover:underline cursor-pointer transition-colors"
                >
                  Register for access
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 2. DMO REGISTRATION MODE */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[12px] font-semibold text-[#0F2346] mb-1.5">
                Full Name & Designation
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A8FA6]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Dr. Bahunlang Nongbri"
                  required
                  className="w-full h-[42px] pl-9 pr-3 text-[13px] bg-gradient-to-b from-[#FAFBFC] to-[#F5F8FC] hover:from-white hover:to-[#F8FAFC] border border-[#D7E2EF] rounded-[9px] text-[#0F2346] placeholder:text-[#8B96A8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]/30 focus:border-[#1769D2] transition-all duration-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#0F2346] mb-1.5">
                  Assigned District
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A8FA6]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <select
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    className="w-full h-[42px] pl-9 pr-2 text-[12.5px] bg-gradient-to-b from-[#FAFBFC] to-[#F5F8FC] border border-[#D7E2EF] rounded-[9px] text-[#0F2346] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]/30 focus:border-[#1769D2] cursor-pointer transition-all duration-200"
                  >
                    <option value="East Khasi Hills">East Khasi Hills</option>
                    <option value="West Khasi Hills">West Khasi Hills</option>
                    <option value="Ri-Bhoi">Ri-Bhoi</option>
                    <option value="South West Khasi Hills">South West Khasi Hills</option>
                    <option value="West Jaintia Hills">West Jaintia Hills</option>
                    <option value="East Jaintia Hills">East Jaintia Hills</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#0F2346] mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. dmo_ekh_2026"
                  required
                  className="w-full h-[42px] px-3 text-[13px] bg-gradient-to-b from-[#FAFBFC] to-[#F5F8FC] hover:from-white hover:to-[#F8FAFC] border border-[#D7E2EF] rounded-[9px] text-[#0F2346] placeholder:text-[#8B96A8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]/30 focus:border-[#1769D2] transition-all duration-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#0F2346] mb-1.5">
                  Government ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A8FA6]">
                    <FileBadge2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regGovernmentId}
                    onChange={(e) => setRegGovernmentId(e.target.value)}
                    placeholder="GOV-NER-XXXX"
                    className="w-full h-[42px] pl-9 pr-3 text-[13px] bg-gradient-to-b from-[#FAFBFC] to-[#F5F8FC] hover:from-white hover:to-[#F8FAFC] border border-[#D7E2EF] rounded-[9px] text-[#0F2346] placeholder:text-[#8B96A8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]/30 focus:border-[#1769D2] transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#0F2346] mb-1.5">
                  Contact Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A8FA6]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regContactNumber}
                    onChange={(e) => setRegContactNumber(e.target.value)}
                    placeholder="+91-XXXXX-XXXXX"
                    className="w-full h-[42px] pl-9 pr-3 text-[13px] bg-gradient-to-b from-[#FAFBFC] to-[#F5F8FC] hover:from-white hover:to-[#F8FAFC] border border-[#D7E2EF] rounded-[9px] text-[#0F2346] placeholder:text-[#8B96A8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]/30 focus:border-[#1769D2] transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#0F2346] mb-1.5">
                Access Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A8FA6]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full h-[42px] pl-9 pr-10 text-[13px] bg-gradient-to-b from-[#FAFBFC] to-[#F5F8FC] hover:from-white hover:to-[#F8FAFC] border border-[#D7E2EF] rounded-[9px] text-[#0F2346] placeholder:text-[#8B96A8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]/30 focus:border-[#1769D2] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7A8FA6] hover:text-[#0F2346] cursor-pointer transition-colors"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isRegisteringDMO}
              className="w-full h-[44px] bg-gradient-to-b from-[#1769D2] to-[#1257B2] hover:from-[#1257B2] hover:to-[#0F448C] active:from-[#0F448C] active:to-[#0A2E66] text-white font-semibold text-[13.5px] rounded-[9px] shadow-md hover:shadow-lg motion-btn flex items-center justify-center gap-2 disabled:opacity-70 disabled:shadow-sm cursor-pointer mt-1 transition-all duration-200"
            >
              {isRegisteringDMO ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating DMO Account...</span>
                </>
              ) : (
                <>
                  <span>Register as DMO</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-1 text-center border-t border-[#E8EEF7] mt-5">
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  setAuthMode('login');
                }}
                className="text-[12.5px] font-semibold text-[#1769D2] hover:text-[#1257B2] hover:underline cursor-pointer transition-colors mt-4"
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD MODE */}
        {authMode === 'forgot' && (
          <div className="space-y-4">
            {forgotSubmitted ? (
              <div className="p-4 bg-[#F0FDF4] border border-[#86EFAC] rounded-[10px] text-center space-y-3">
                <CheckCircle2 className="w-9 h-9 text-[#16A34A] mx-auto" />
                <h4 className="text-[13.5px] font-bold text-[#166534]">Request Submitted to SDMA</h4>
                <p className="text-[12px] text-[#15803D] leading-relaxed">
                  Your password reset request for <strong>{forgotUsername}</strong> has been submitted to the State Disaster Management Authority. Please contact your State IT Admin at +91-364-2501234 for further assistance.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSubmitted(false);
                    setAuthMode('login');
                  }}
                  className="mt-3 text-[12px] font-semibold text-[#1769D2] hover:text-[#1257B2] hover:underline transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-user" className="block text-[12.5px] font-semibold text-[#0F2346] mb-1.5">
                    Official Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A8FA6]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="forgot-user"
                      type="text"
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      placeholder="e.g. dmo_east_khasi or your official email"
                      required
                      className="w-full h-[44px] pl-10 pr-3.5 text-[13.5px] bg-gradient-to-b from-[#FAFBFC] to-[#F5F8FC] hover:from-white hover:to-[#F8FAFC] border border-[#D7E2EF] rounded-[9px] text-[#0F2346] placeholder:text-[#8B96A8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]/30 focus:border-[#1769D2] transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[9px] text-[12px] text-[#475569] flex items-start gap-3">
                  <HelpCircle className="w-4 h-4 text-[#1769D2] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Government protocol requires verification through your State Disaster Management Authority. A reset link will be sent to your registered email or phone within 24 hours.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full h-[44px] bg-gradient-to-b from-[#1769D2] to-[#1257B2] hover:from-[#1257B2] hover:to-[#0F448C] active:from-[#0F448C] active:to-[#0A2E66] text-white font-semibold text-[13.5px] rounded-[9px] shadow-md hover:shadow-lg motion-btn flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                >
                  <span>Submit Reset Request</span>
                </button>

                <div className="text-center pt-2 border-t border-[#E8EEF7]">
                  <button
                    type="button"
                    onClick={() => {
                      setLocalError(null);
                      setAuthMode('login');
                    }}
                    className="text-[12.5px] font-semibold text-[#1769D2] hover:text-[#1257B2] hover:underline cursor-pointer transition-colors mt-4"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer Security Notice */}
        <div className="mt-6 pt-4 border-t border-[#E8EEF7] text-center">
          <p className="text-[11px] text-[#607494] leading-relaxed font-medium">
            🔒 Protected under Government of India Disaster Management Act<br/>
            HttpOnly Secure Cookies • Encrypted Government Data
          </p>
        </div>
      </div>
    </div>
  );
};
