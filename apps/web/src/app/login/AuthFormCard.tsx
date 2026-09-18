'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AuthCardHeader } from './AuthCardHeader';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { AuthCardSecurityBadge } from './AuthCardSecurityBadge';

export const AuthFormCard: React.FC = () => {
  const { login, isLoggingIn, loginError, registerDMO, isRegisteringDMO, registerError } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [localError, setLocalError] = useState<string | null>(null);

  const activeError =
    localError ||
    (authMode === 'login' ? loginError?.message : authMode === 'register' ? registerError?.message : null);

  return (
    <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end w-full">
      <div className="w-full max-w-[430px] xl:max-w-[460px] bg-white/95 backdrop-blur-xl rounded-[24px] sm:rounded-[28px] border border-white/80 shadow-[0_24px_54px_rgba(3,18,34,0.38)] p-7 sm:p-8 xl:p-9 flex flex-col transition-all duration-200">
        {/* Card Header & Badge */}
        <AuthCardHeader authMode={authMode} />

        {/* Dynamic Error Notification */}
        {activeError && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-2.5 text-red-700 text-[12.5px] font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
            <span className="leading-snug text-left">{activeError}</span>
          </div>
        )}

        {/* Dynamic Form Content */}
        {authMode === 'login' && (
          <LoginForm
            onLogin={login}
            isLoading={isLoggingIn}
            onSwitchMode={(mode) => setAuthMode(mode)}
            onError={(msg) => setLocalError(msg)}
          />
        )}

        {authMode === 'register' && (
          <RegisterForm
            onRegister={registerDMO}
            isLoading={isRegisteringDMO}
            onSwitchMode={() => setAuthMode('login')}
            onError={(msg) => setLocalError(msg)}
          />
        )}

        {authMode === 'forgot' && (
          <ForgotPasswordForm
            onSwitchMode={() => setAuthMode('login')}
            onError={(msg) => setLocalError(msg)}
          />
        )}

        {/* Security Compliance Footer Badge */}
        <AuthCardSecurityBadge />
      </div>
    </div>
  );
};
