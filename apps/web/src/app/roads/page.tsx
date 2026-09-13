'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { RoadInfrastructureChart } from '../../components/dashboard/RoadInfrastructureChart';
import {
  Split,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  Compass,
  Search,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface HighwayItem {
  code: string;
  name: string;
  states: string;
  status: 'Operational' | 'Partially Blocked' | 'Blocked';
  affectedKm: string;
  cause: string;
  clearanceTeam: string;
  eta: string;
  detourAdvice: string;
}

const highways: HighwayItem[] = [];

export default function RoadsPage() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHighways = highways.filter((h) => {
    const matchesSearch =
      h.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.states.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || h.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardShell>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
            Road & Strategic Transport Corridor Status
          </h1>
          <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
            Real-time highway vulnerability, landslide blockages, and Border Roads Organisation (BRO) clearance progress
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981] text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{highways.length > 0 ? `${((highways.filter(h => h.status === 'Operational').length / highways.length) * 100).toFixed(1)}% Arterial Roads Operational` : 'No Road Data Available'}</span>
        </div>
      </div>

      {/* Analytics & Clearance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Road Donut Breakdown Chart */}
        <div className="lg:col-span-6 xl:col-span-5">
          <RoadInfrastructureChart />
        </div>

        {/* Right: BRO Clearance & Emergency Detour Overview */}
        <div className="lg:col-span-6 xl:col-span-7 bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs flex flex-col justify-between motion-card">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EBF1F8]">
              <h3 className="text-[16px] font-bold text-[#0F1F3D]">
                Active BRO & PWD Heavy Clearance Detachments
              </h3>
              <span className="text-xs font-semibold text-[#1769D2]">
                {highways.filter(h => h.status !== 'Operational').length} Heavy Taskforces Engaged
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {highways.filter(h => h.status === 'Blocked').slice(0, 2).map((h) => (
                <div key={h.code} className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3.5 transition-all duration-200 hover:border-[#F87171] hover:shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#DC2626]">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{h.code} ({h.states}) Critical Blockage</span>
                  </div>
                  <p className="text-[11.5px] text-[#7F1D1D] mt-1.5 leading-snug">
                    {h.cause}. Est. clearance: {h.eta}.
                  </p>
                </div>
              ))}
              {highways.filter(h => h.status === 'Partially Blocked').slice(0, 2).map((h) => (
                <div key={h.code} className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-3.5 transition-all duration-200 hover:border-[#FBBF24] hover:shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#D97706]">
                    <Truck className="w-4 h-4" />
                    <span>{h.code} ({h.states}) Partial Blockage</span>
                  </div>
                  <p className="text-[11.5px] text-[#78350F] mt-1.5 leading-snug">
                    {h.cause}. Est. clearance: {h.eta}.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#536B8F]">
            <span>Automated corridor scans refresh every 5 minutes.</span>
            <button
              type="button"
              onClick={() => alert('Exporting live road condition bulletin to SDMA dispatch network')}
              className="text-[#1769D2] font-semibold hover:underline motion-btn inline-flex items-center gap-1 group"
            >
              <span>Export Traffic Advisory PDF</span>
              <span className="transition-transform duration-180 group-hover:translate-x-0.5">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Highway Corridors Table & Filters */}
      <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs space-y-4 motion-card">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EBF1F8]">
          <div className="flex items-center gap-3">
            <h3 className="text-[16px] font-bold text-[#0F1F3D]">
              Highway Corridors Monitoring Registry
            </h3>
            <span className="text-xs bg-[#F1F5F9] text-[#536B8F] px-2 py-0.5 rounded font-mono">
              {filteredHighways.length} Corridors
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#758CA8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search highway code, state..."
                className="text-xs bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg pl-8 pr-3 py-1.5 text-[#0F1F3D] focus:outline-none motion-input"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-medium bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-1.5 text-[#0F1F3D] focus:outline-none motion-input cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Operational">Operational</option>
              <option value="Partially Blocked">Partially Blocked</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Cards / Table List */}
        <div className="divide-y divide-[#F1F5F9]">
          {filteredHighways.map((h) => {
            let statusBadge = 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]';
            if (h.status === 'Blocked') {
              statusBadge = 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';
            } else if (h.status === 'Partially Blocked') {
              statusBadge = 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
            }

            return (
              <div
                key={h.code}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F8FAFC] -mx-2 px-2 rounded-lg motion-row cursor-default"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-[#1769D2] text-sm bg-[#EAF3FF] px-2 py-0.5 rounded transition-transform duration-180 group-hover:scale-[1.02]">
                      {h.code}
                    </span>
                    <h4 className="font-bold text-[#0F1F3D] text-[14px]">
                      {h.name}
                    </h4>
                    <span className={`text-[10.5px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusBadge}`}>
                      {h.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#536B8F] flex items-center gap-4 pt-1">
                    <span><strong>Sector:</strong> {h.affectedKm}</span>
                    <span><strong>State:</strong> {h.states}</span>
                    <span><strong>Incident:</strong> {h.cause}</span>
                  </div>

                  <div className="text-xs text-[#334155] pt-0.5">
                    <span className="text-[#DC2626] font-semibold">Detour Advisory: </span>
                    {h.detourAdvice}
                  </div>
                </div>

                <div className="flex flex-col md:items-end text-xs text-[#536B8F] flex-shrink-0">
                  <div className="font-bold text-[#0F1F3D]">
                    {h.clearanceTeam}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[#1769D2] font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Est. Clearance: {h.eta}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
