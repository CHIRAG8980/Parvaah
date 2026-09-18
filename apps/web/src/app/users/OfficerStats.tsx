'use client';

import React from 'react';
import { Shield, Building, Users, Key } from 'lucide-react';
import { OfficerItem } from './OfficerCard';

interface OfficerStatsProps {
  officers: OfficerItem[];
}

export const OfficerStats: React.FC<OfficerStatsProps> = ({ officers }) => {
  const stateAuthorities = officers.filter(
    (o) =>
      o.clearanceLevel.includes('Level 4') ||
      o.clearanceLevel.includes('Executive') ||
      o.role.toLowerCase() === 'admin' ||
      o.role.toLowerCase().includes('state')
  ).length;

  const districtMagistrates = officers.filter(
    (o) =>
      o.role.toLowerCase().includes('district') ||
      o.role.toLowerCase().includes('dmo') ||
      o.role.toLowerCase().includes('magistrate')
  ).length;

  const sdrfTeams = officers.filter(
    (o) =>
      !o.role.toLowerCase().includes('district') &&
      !o.role.toLowerCase().includes('admin') &&
      (o.role.toLowerCase().includes('dispatch') ||
        o.role.toLowerCase().includes('field') ||
        o.role.toLowerCase().includes('sdrf') ||
        o.role.toLowerCase() === 'officer' ||
        o.role.toLowerCase().includes('qrt'))
  ).length;

  const geoLeads = officers.filter(
    (o) =>
      o.role.toLowerCase().includes('geo') ||
      o.role.toLowerCase().includes('lead') ||
      o.role.toLowerCase().includes('analyst') ||
      o.role.toLowerCase().includes('scientist')
  ).length;

  const stats = [
    { label: 'State Authorities', count: stateAuthorities, sub: 'Executive Tier', icon: Shield, iconColor: 'text-[#1769D2]', subColor: 'text-[#1769D2]' },
    { label: 'District Magistrates', count: districtMagistrates, sub: 'Incident Command', icon: Building, iconColor: 'text-[#F59E0B]', subColor: 'text-[#D97706]' },
    { label: 'QRT / SDRF Teams', count: sdrfTeams, sub: 'Field Dispatch', icon: Users, iconColor: 'text-[#EF4444]', subColor: 'text-[#DC2626]' },
    { label: 'Geotechnical Leads', count: geoLeads, sub: 'Scientific Analysts', icon: Key, iconColor: 'text-[#10B981]', subColor: 'text-[#16A34A]' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card motion-card-hover group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#536B8F]">{s.label}</span>
              <Icon className={`w-4 h-4 ${s.iconColor} transition-transform duration-200 group-hover:scale-110`} />
            </div>
            <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">{s.count}</div>
            <span className={`text-[11px] font-medium ${s.subColor}`}>{s.sub}</span>
          </div>
        );
      })}
    </div>
  );
};
