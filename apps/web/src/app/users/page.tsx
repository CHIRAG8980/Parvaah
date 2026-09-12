'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import {
  Users,
  UserCheck,
  Shield,
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  Building,
  Key,
} from 'lucide-react';

interface Officer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Disaster Management Officer' | 'District Magistrate' | 'SDRF Commander' | 'Geotechnical Lead';
  jurisdiction: string;
  clearanceLevel: 'Level 4 (Executive)' | 'Level 3 (Command)' | 'Level 2 (Field Dispatch)';
  status: 'Active' | 'On Duty' | 'Standby';
  avatarInitials: string;
}

const officers: Officer[] = [
  {
    id: 'USR-SDMA-01',
    name: 'Ananya Das',
    email: 'admin@ner.gov.in',
    phone: '+91 94361 28901',
    role: 'Disaster Management Officer',
    jurisdiction: 'NER Regional Operations (HQ Shillong)',
    clearanceLevel: 'Level 4 (Executive)',
    status: 'Active',
    avatarInitials: 'AD',
  },
  {
    id: 'USR-DM-04',
    name: 'Tashi Namgyal, IAS',
    email: 'dm.westkameng@arunachal.gov.in',
    phone: '+91 94360 41234',
    role: 'District Magistrate',
    jurisdiction: 'West Kameng District, Arunachal Pradesh',
    clearanceLevel: 'Level 3 (Command)',
    status: 'On Duty',
    avatarInitials: 'TN',
  },
  {
    id: 'USR-DM-02',
    name: 'D. M. Khongwir, MCS',
    email: 'dc.ekh@meghalaya.gov.in',
    phone: '+91 94361 99821',
    role: 'District Magistrate',
    jurisdiction: 'East Khasi Hills District, Meghalaya',
    clearanceLevel: 'Level 3 (Command)',
    status: 'Active',
    avatarInitials: 'DK',
  },
  {
    id: 'USR-SDRF-08',
    name: 'Maj. Vikramjit Singh',
    email: 'sdrf.kameng@disaster.gov.in',
    phone: '+91 98620 55123',
    role: 'SDRF Commander',
    jurisdiction: '1st Battalion SDRF, Bhalukpong Taskforce',
    clearanceLevel: 'Level 2 (Field Dispatch)',
    status: 'On Duty',
    avatarInitials: 'VS',
  },
  {
    id: 'USR-GEO-03',
    name: 'Dr. Debojit Barman',
    email: 'debojit.b@gsi.gov.in',
    phone: '+91 94350 11982',
    role: 'Geotechnical Lead',
    jurisdiction: 'GSI North Eastern Regional Centre, Shillong',
    clearanceLevel: 'Level 3 (Command)',
    status: 'Active',
    avatarInitials: 'DB',
  },
  {
    id: 'USR-DM-07',
    name: 'V. L. Hminga, IAS',
    email: 'dc.aizawl@mizoram.gov.in',
    phone: '+91 94361 44520',
    role: 'District Magistrate',
    jurisdiction: 'Aizawl District, Mizoram',
    clearanceLevel: 'Level 3 (Command)',
    status: 'Standby',
    avatarInitials: 'VH',
  },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');

  const filteredOfficers = officers.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'All' || o.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
            Authority Personnel & Emergency Access Directory
          </h1>
          <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
            State disaster management authorities, district magistrates, and quick response team liaisons
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Add Officer Protocol: Government email OTP validation required to grant access.')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1769D2] hover:bg-[#1257B2] text-white text-xs font-semibold rounded-lg shadow-sm motion-btn cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Authorize Official</span>
        </button>
      </div>

      {/* Role Breakdown KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card motion-card-hover group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">State Authorities</span>
            <Shield className="w-4 h-4 text-[#1769D2] transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">4</div>
          <span className="text-[11px] text-[#1769D2] font-medium">Executive Tier</span>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card motion-card-hover group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">District Magistrates</span>
            <Building className="w-4 h-4 text-[#F59E0B] transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">16</div>
          <span className="text-[11px] text-[#D97706] font-medium">Incident Command</span>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card motion-card-hover group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">QRT / SDRF Teams</span>
            <Users className="w-4 h-4 text-[#EF4444] transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">8</div>
          <span className="text-[11px] text-[#DC2626] font-medium">Field Dispatch</span>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card motion-card-hover group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">Geotechnical Leads</span>
            <Key className="w-4 h-4 text-[#10B981] transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">12</div>
          <span className="text-[11px] text-[#16A34A] font-medium">Scientific Analysts</span>
        </div>
      </div>

      {/* Directory Filter Bar */}
      <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs motion-card">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#758CA8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search officer by name, district, or email..."
              className="w-full text-xs bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg pl-9 pr-3 py-2 text-[#0F1F3D] focus:outline-none motion-input"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-2 text-[#0F1F3D] focus:outline-none font-medium motion-input cursor-pointer"
          >
            <option value="All">All Official Roles</option>
            <option value="Disaster Management Officer">Disaster Management Officer</option>
            <option value="District Magistrate">District Magistrate</option>
            <option value="SDRF Commander">SDRF Commander</option>
            <option value="Geotechnical Lead">Geotechnical Lead</option>
          </select>
        </div>
      </div>

      {/* Officers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOfficers.map((officer) => (
          <div
            key={officer.id}
            className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs hover:border-[#1769D2]/40 motion-card motion-card-hover group flex flex-col justify-between"
          >
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
                    <span className="text-xs text-[#1769D2] font-semibold">
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
                <div>
                  <strong className="text-[#0F1F3D]">Clearance: </strong>
                  <span className="font-mono text-[#1769D2]">{officer.clearanceLevel}</span>
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
              <span className="font-mono text-[11px] text-[#758CA8]">{officer.id}</span>
              <button
                type="button"
                onClick={() => alert(`Direct dispatch call initiated to ${officer.name}`)}
                className="text-[#1769D2] font-semibold hover:underline motion-btn inline-flex items-center gap-1 group/btn"
              >
                <span>Secure Dispatch Call</span>
                <span className="transition-transform duration-180 group-hover/btn:translate-x-0.5">→</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
