'use client';

import React, { useState } from 'react';
import { X, UserPlus, Shield } from 'lucide-react';
import { apiClient } from '../../lib/api/client';

interface AuthorizeOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthorizeOfficerModal: React.FC<AuthorizeOfficerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [district, setDistrict] = useState('');
  const [role, setRole] = useState('Disaster Management Officer');
  const [contactNumber, setContactNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      setErrorMsg('Full Name and Username are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await apiClient.post('/auth/officers', {
        username: username.trim().toLowerCase(),
        full_name: fullName.trim(),
        role: role.toLowerCase().replace(/ /g, '_'),
        district: district.trim() || null,
        contact_number: contactNumber.trim() || '+91 94360 00000',
        password: 'Gov@Secure2026',
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to authorize official');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#DCE6F2] shadow-xl w-full max-w-md p-6 space-y-4 motion-card">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBF1F8]">
          <div className="flex items-center gap-2 text-[#0F1F3D]">
            <Shield className="w-5 h-5 text-[#1769D2]" />
            <h2 className="text-base font-bold">Authorize Emergency Official</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#536B8F] hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-[#0F1F3D] mb-1">Full Official Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Lt. Col. Rajat Verma"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#0F1F3D] focus:outline-none focus:border-[#1769D2]"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-[#0F1F3D] mb-1">Government ID / Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. rajat_verma_sdrf"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#0F1F3D] focus:outline-none focus:border-[#1769D2]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F1F3D] mb-1">Official Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-2 text-[#0F1F3D]"
              >
                <option value="Disaster Management Officer">DM Officer</option>
                <option value="District Magistrate">District Magistrate</option>
                <option value="SDRF Commander">SDRF Commander</option>
                <option value="Geotechnical Lead">Geotechnical Lead</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0F1F3D] mb-1">District Jurisdiction</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. East Khasi Hills"
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#0F1F3D]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0F1F3D] mb-1">Emergency Contact Number</label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="+91 94360 00000"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#0F1F3D]"
            />
          </div>

          <div className="pt-3 border-t border-[#EBF1F8] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#DCE6F2] text-[#536B8F] hover:bg-[#F1F5F9] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1769D2] hover:bg-[#1257B2] text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Authorizing...' : 'Authorize Official'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
