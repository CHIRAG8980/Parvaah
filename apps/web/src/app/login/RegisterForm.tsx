'use client';

import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Building2, FileBadge2, Phone, ArrowRight, Loader2 } from 'lucide-react';
import type { RegisterDMORequest, TokenResponse } from '@/lib/api/types';

const DISTRICTS = [
  'East Khasi Hills', 'West Khasi Hills', 'Ri-Bhoi',
  'South West Khasi Hills', 'West Jaintia Hills', 'East Jaintia Hills',
] as const;

interface RegisterFormProps {
  onRegister: (payload: RegisterDMORequest) => Promise<TokenResponse>;
  isLoading: boolean;
  onSwitchMode: (mode: 'login') => void;
  onError: (errorMessage: string | null) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegister,
  isLoading,
  onSwitchMode,
  onError,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    district: DISTRICTS[0] as string,
    contactNumber: '',
    governmentId: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onError(null);

    const { fullName, username, district, contactNumber, governmentId, password } = formData;
    if (!fullName.trim() || !username.trim() || !district.trim()) {
      onError('Please fill in all required official registration fields.');
      return;
    }
    if (!password || password.length < 6) {
      onError('Password must be at least 6 characters.');
      return;
    }

    try {
      await onRegister({
        username: username.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        role: 'district_officer',
        district: district.trim(),
        state: 'Meghalaya',
        contact_number: contactNumber.trim() || undefined,
        government_id: governmentId.trim() || undefined,
      });
      window.location.href = '/';
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Registration failed. Please contact state authority.');
    }
  };

  const inputClass =
    'w-full h-[38px] text-[13px] bg-slate-50/75 hover:bg-white focus:bg-white border border-slate-200/90 rounded-[10px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 transition-all duration-200';

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 mt-3.5 text-left">
      <div>
        <label className="block text-[11.5px] font-semibold text-slate-800 mb-1">Full Name &amp; Designation</label>
        <div className="relative">
          <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            placeholder="e.g. Dr. Bahunlang Nongbri"
            required
            className={`${inputClass} pl-9 pr-3`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11.5px] font-semibold text-slate-800 mb-1">Assigned District</label>
          <div className="relative">
            <Building2 className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <select
              value={formData.district}
              onChange={(e) => updateField('district', e.target.value)}
              className={`${inputClass} pl-9 pr-2 text-[12px] cursor-pointer`}
            >
              {DISTRICTS.map((dist) => (<option key={dist} value={dist}>{dist}</option>))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11.5px] font-semibold text-slate-800 mb-1">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => updateField('username', e.target.value)}
            placeholder="e.g. dmo_ekh"
            required
            className={`${inputClass} px-3`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11.5px] font-semibold text-slate-800 mb-1">Government ID</label>
          <div className="relative">
            <FileBadge2 className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={formData.governmentId}
              onChange={(e) => updateField('governmentId', e.target.value)}
              placeholder="GOV-NER-XXXX"
              className={`${inputClass} pl-9 pr-2`}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11.5px] font-semibold text-slate-800 mb-1">Contact Number</label>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={formData.contactNumber}
              onChange={(e) => updateField('contactNumber', e.target.value)}
              placeholder="+91-XXXXX-XXXXX"
              className={`${inputClass} pl-9 pr-2`}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[11.5px] font-semibold text-slate-800 mb-1">Access Password</label>
        <div className="relative">
          <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => updateField('password', e.target.value)}
            placeholder="Min 6 characters"
            required
            className={`${inputClass} pl-9 pr-9`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-[42px] bg-gradient-to-r from-[#1765D8] to-[#1451B8] hover:from-[#1451B8] hover:to-[#0F3C8C] active:from-[#0E357B] text-white font-semibold text-[13px] rounded-[10px] shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer transition-all duration-200 mt-2"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Register as DMO</span>}
        {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
      </button>

      <div className="pt-1.5 text-center">
        <button
          type="button"
          onClick={() => {
            onError(null);
            onSwitchMode('login');
          }}
          className="text-[12px] font-semibold text-[#1D4ED8] hover:text-[#1E40AF] hover:underline cursor-pointer transition-colors"
        >
          Already have an account? Sign In
        </button>
      </div>
    </form>
  );
};
