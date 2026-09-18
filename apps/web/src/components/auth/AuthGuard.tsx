'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, ShieldAlert } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'state_officer' | 'district_officer';
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, isAdmin, isStateOfficer } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F4F8FC] text-[#0F1F3D]">
        <div className="flex flex-col items-center gap-3 p-8 bg-white/90 rounded-2xl border border-[#DCE6F2] shadow-sm">
          <Loader2 className="w-8 h-8 text-[#1769D2] animate-spin" />
          <span className="text-sm font-semibold tracking-tight">Verifying Official Credentials...</span>
          <span className="text-xs text-[#536B8F]">Government of India • Disaster Control Portal</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check role authorization if specified
  if (requiredRole) {
    const isAuthorized =
      requiredRole === 'admin'
        ? isAdmin
        : requiredRole === 'state_officer'
        ? isStateOfficer
        : true;

    if (!isAuthorized) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626] mb-4 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#0F1F3D] tracking-tight">Access Restricted</h2>
          <p className="text-xs text-[#536B8F] max-w-md mt-2 leading-relaxed">
            Your clearance level as <strong>{user?.role}</strong> does not permit administrative modifications in this section.
            Contact your State Disaster Management Director or National Control Admin.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 px-4 py-2 bg-[#1769D2] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-[#1257B2]"
          >
            Return to Operations Dashboard
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
};
