'use client';

import React from 'react';
import { Mail, Phone } from 'lucide-react';

export interface OfficerItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  jurisdiction: string;
  clearanceLevel: string;
  status: 'Active' | 'On Duty' | 'Standby';
  avatarInitials: string;
}

interface OfficerCardProps {
  officer: OfficerItem;
  onDispatchCall: (officer: OfficerItem) => void;
}

export const OfficerCard: React.FC<OfficerCardProps> = ({ officer, onDispatchCall }) => {
  return (
    <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs hover:border-[#1769D2]/40 motion-card motion-card-hover group flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#163B70] text-white flex items-center justify-center font-bold text-xs shadow-xs transition-transform duration-200 group-hover:scale-105">
              {officer.avatarInitials}
            </div>
            <div>
              <h3 className="font-bold text-[#0F1F3D] text-[14.5px] leading-tight">
                {officer.name}
              </h3>
              <span
                className={`inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded mt-1 ${
                  officer.role.toLowerCase() === 'admin'
                    ? 'bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]'
                    : officer.role.toLowerCase().includes('district')
                    ? 'bg-[#EFF6FF] text-[#1769D2] border border-[#BFDBFE]'
                    : 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]'
                }`}
              >
                {officer.role}
              </span>
            </div>
          </div>

          <span
            className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
              officer.status === 'On Duty'
                ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                : 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]'
            }`}
          >
            ● {officer.status}
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-[#536B8F] pt-2 border-t border-[#F1F5F9]">
          <div>
            <strong className="text-[#0F1F3D]">Jurisdiction: </strong>
            <span>{officer.jurisdiction}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <strong className="text-[#0F1F3D]">Clearance: </strong>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                officer.clearanceLevel.includes('Executive') || officer.clearanceLevel.includes('Level 4')
                  ? 'bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]'
                  : 'bg-[#EFF6FF] text-[#1769D2] border border-[#BFDBFE]'
              }`}
            >
              {officer.clearanceLevel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-1 text-[#0F1F3D]">
            <Mail className="w-3.5 h-3.5 text-[#758CA8]" />
            <span>{officer.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#0F1F3D]">
            <Phone className="w-3.5 h-3.5 text-[#758CA8]" />
            <span>{officer.phone}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
        <span className="font-mono text-[11px] text-[#536B8F] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
          {officer.id}
        </span>
        <button
          type="button"
          onClick={() => onDispatchCall(officer)}
          className="text-[#1769D2] font-semibold hover:text-[#1257B2] hover:underline motion-btn inline-flex items-center gap-1 group/btn cursor-pointer"
        >
          <span>Secure Dispatch Call</span>
          <span className="transition-transform duration-180 group-hover/btn:translate-x-0.5">→</span>
        </button>
      </div>
    </div>
  );
};
