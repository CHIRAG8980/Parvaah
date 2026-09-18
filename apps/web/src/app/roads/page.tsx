'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { RoadInfrastructureChart } from '../../components/dashboard/RoadInfrastructureChart';
import { RoadClearanceOverview } from './RoadClearanceOverview';
import { RoadItemRow } from './RoadItemRow';
import { Search, ShieldCheck } from 'lucide-react';
import { useRoads } from '../../hooks/useRoads';

export default function RoadsPage() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { roads, isLoading } = useRoads();

  const filteredRoads = roads.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.road_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.zone_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const operationalPct = roads.length > 0
    ? ((roads.filter((r) => r.status === 'operational').length / roads.length) * 100).toFixed(0)
    : '0';

  return (
    <DashboardShell>
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
          <span>{operationalPct}% Arterial Corridors Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 xl:col-span-5">
          <RoadInfrastructureChart />
        </div>
        <div className="lg:col-span-6 xl:col-span-7">
          <RoadClearanceOverview roads={roads} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs space-y-4 motion-card">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EBF1F8]">
          <div className="flex items-center gap-3">
            <h3 className="text-[16px] font-bold text-[#0F1F3D]">
              Highway Corridors Monitoring Registry
            </h3>
            <span className="text-xs bg-[#F1F5F9] text-[#536B8F] px-2 py-0.5 rounded font-mono">
              {filteredRoads.length} Corridors
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#758CA8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search highway name, code..."
                className="text-xs bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg pl-8 pr-3 py-1.5 text-[#0F1F3D] focus:outline-none"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-medium bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-1.5 text-[#0F1F3D] cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="operational">Operational</option>
              <option value="at_risk">At Risk</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading highway networks...</div>
        ) : filteredRoads.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#536B8F]">No roads matching filter criteria</div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {filteredRoads.map((road) => (
              <RoadItemRow key={road.road_id} road={road} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
