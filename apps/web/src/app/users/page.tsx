'use client';

import React, { useState, useMemo } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { Search, UserPlus, AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { OfficerCard, OfficerItem } from './OfficerCard';
import { OfficerStats } from './OfficerStats';
import { AuthorizeOfficerModal } from './AuthorizeOfficerModal';
import { useOfficers } from '../../hooks/useAuth';

export default function UsersPage() {
  const { officers: apiOfficers, isLoading, error, refetch } = useOfficers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const officerList: OfficerItem[] = useMemo(() => {
    return apiOfficers.map((u) => ({
      id: u.user_id,
      name: u.full_name,
      email: `${u.username}@disaster.gov.in`,
      phone: u.contact_number || '+91 94360 00000',
      role: u.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      jurisdiction: u.district ? `${u.district} District` : 'North East Regional Command',
      clearanceLevel: Number(u.escalation_level) >= 2 ? 'Level 4 (Executive)' : 'Level 3 (Command)',
      status: 'On Duty' as const,
      avatarInitials: u.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
    }));
  }, [apiOfficers]);

  const filteredOfficers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return officerList.filter((o) => {
      const matchesSearch =
        query === '' ||
        o.name.toLowerCase().includes(query) ||
        o.jurisdiction.toLowerCase().includes(query) ||
        o.email.toLowerCase().includes(query);
      const matchesRole = selectedRole === 'All' || o.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [officerList, searchQuery, selectedRole]);

  return (
    <DashboardShell>
      <div className="space-y-6">
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1769D2] hover:bg-[#1257B2] text-white text-xs font-semibold rounded-lg shadow-sm motion-btn cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Authorize Official</span>
          </button>
        </div>

        <OfficerStats officers={officerList} />

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

        {error && (
          <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center justify-between text-xs text-[#DC2626]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Failed to fetch officers: {error.message}</span>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1 font-semibold text-[#DC2626] hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-slate-100 rounded-xl animate-pulse border border-[#E2E8F0]" />
            ))}
          </div>
        ) : filteredOfficers.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#DCE6F2] p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#1769D2]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0F1F3D]">No Emergency Authority Personnel Registered</p>
              <p className="text-xs text-[#536B8F] mt-1 max-w-sm">
                Authorize district magistrates, SDRF quick response commanders, or geotechnical leads to populate the access directory.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1769D2] hover:bg-[#1257B2] text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Authorize First Official</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOfficers.map((officer) => (
              <OfficerCard
                key={officer.id}
                officer={officer}
                onDispatchCall={(target) => alert(`Direct dispatch call initiated to ${target.name}`)}
              />
            ))}
          </div>
        )}

        <AuthorizeOfficerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => refetch()}
        />
      </div>
    </DashboardShell>
  );
}
