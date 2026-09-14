'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { LiveRiskMap } from '../../components/map/LiveRiskMap';
import { ZoneSectorCard } from './ZoneSectorCard';
import { Satellite, Filter, Radio, ShieldCheck } from 'lucide-react';
import { useZones } from '../../hooks/useZones';
import { useAuth } from '../../hooks/useAuth';

export default function RiskMapPage() {
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedRisk, setSelectedRisk] = useState('All Risks');

  const { isScopedToDistrict, assignedDistrict } = useAuth();
  const { zones, isLoading } = useZones();

  const filteredZones = zones.filter((zone) => {
    // If DMO, restrict exclusively to their assigned district
    if (isScopedToDistrict && assignedDistrict) {
      if (zone.district.toLowerCase() !== assignedDistrict.toLowerCase()) {
        return false;
      }
    }
    const matchesState = selectedState === 'All States' || zone.state === selectedState;
    const matchesRisk = selectedRisk === 'All Risks' || zone.risk_level === selectedRisk;
    return matchesState && matchesRisk;
  });

  const criticalCount = filteredZones.filter((z) => z.risk_level === 'CRITICAL').length;
  const highCount = filteredZones.filter((z) => z.risk_level === 'HIGH').length;

  const pageTitle = isScopedToDistrict && assignedDistrict
    ? `${assignedDistrict} GIS Risk Map & Surveillance`
    : 'GIS Risk Map & Satellite Surveillance';

  const pageSubtitle = isScopedToDistrict && assignedDistrict
    ? `Dedicated district surveillance, localized susceptibility markers, and IoT sensor telemetry for ${assignedDistrict}`
    : 'Multi-modal landslide susceptibility, InSAR satellite deformation, and IoT sensor telemetry across North East India';

  return (
    <DashboardShell>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
              {pageTitle}
            </h1>
            {isScopedToDistrict && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Assigned DMO Scope</span>
              </span>
            )}
          </div>
          <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
            {pageSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF3FF] border border-[#BFDBFE] text-[#1769D2] text-[12px] font-semibold">
            <Satellite className="w-3.5 h-3.5" />
            <span>Satellite InSAR Feed Active</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#536B8F]">
            <Filter className="w-3.5 h-3.5 text-[#1769D2]" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="text-xs font-medium bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-1.5 text-[#0F1F3D] cursor-pointer"
          >
            <option value="All States">All North East States</option>
            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
            <option value="Assam">Assam</option>
            <option value="Meghalaya">Meghalaya</option>
            <option value="Manipur">Manipur</option>
            <option value="Nagaland">Nagaland</option>
            <option value="Mizoram">Mizoram</option>
            <option value="Sikkim">Sikkim</option>
            <option value="Tripura">Tripura</option>
          </select>

          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="text-xs font-medium bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-1.5 text-[#0F1F3D] cursor-pointer"
          >
            <option value="All Risks">All Risk Levels</option>
            <option value="CRITICAL">Critical (81 - 100)</option>
            <option value="HIGH">High (61 - 80)</option>
            <option value="MEDIUM">Medium (31 - 60)</option>
            <option value="LOW">Low (0 - 30)</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-[#536B8F]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span className="text-[#0F1F3D] font-bold">{criticalCount}</span> Critical Zones
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F97316]" />
            <span className="text-[#0F1F3D] font-bold">{highCount}</span> High Susceptibility
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-[#0F1F3D] font-bold">{zones.length}</span> Active GIS Polygons
          </div>
        </div>
      </div>

      <div className="w-full">
        <LiveRiskMap
          filteredZones={filteredZones}
          selectedState={selectedState}
          selectedRisk={selectedRisk}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-[#0F1F3D]">
            Monitored High-Vulnerability Sectors
          </h2>
          <span className="text-xs text-[#536B8F] font-medium">
            Showing {filteredZones.length} of {zones.length} Priority Sectors
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-[#DCE6F2]">
            Loading monitored sectors...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredZones.map((zone) => (
              <ZoneSectorCard key={zone.zone_id} zone={zone} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
