'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { WeatherForecast } from '../../components/dashboard/WeatherForecast';
import { RecentRainfallChart } from '../../components/dashboard/RecentRainfallChart';
import { CloudLightning } from 'lucide-react';
import { useZones } from '../../hooks/useZones';

export default function ForecastPage() {
  const [selectedState, setSelectedState] = useState('All');
  const { zones, isLoading } = useZones();

  const filteredZones = zones.filter(
    (z) => selectedState === 'All' || z.state === selectedState
  );

  return (
    <DashboardShell>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
            Meteorological Forecasting & Precipitation Radar
          </h1>
          <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
            IMD radar feeds, satellite precipitation estimates, and 72-hour landslide triggering rainfall thresholds
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF3FF] border border-[#BFDBFE] text-[#1769D2] text-xs font-semibold">
          <CloudLightning className="w-3.5 h-3.5 text-[#1769D2]" />
          <span>IMD Doppler Weather Radar & Satellite Estimates</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 xl:col-span-6">
          <WeatherForecast />
        </div>
        <div className="lg:col-span-6 xl:col-span-6">
          <RecentRainfallChart />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs space-y-4 motion-card">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EBF1F8]">
          <div className="flex items-center gap-3">
            <h3 className="text-[16px] font-bold text-[#0F1F3D]">
              Automatic Weather Stations (AWS) Precipitation Telemetry
            </h3>
            <span className="text-xs bg-[#F1F5F9] text-[#536B8F] px-2 py-0.5 rounded font-mono">
              {filteredZones.length} Stations
            </span>
          </div>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="text-xs font-medium bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-1.5 text-[#0F1F3D] motion-input cursor-pointer"
          >
            <option value="All">All States</option>
            <option value="Meghalaya">Meghalaya</option>
            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
            <option value="Assam">Assam</option>
            <option value="Manipur">Manipur</option>
            <option value="Nagaland">Nagaland</option>
            <option value="Mizoram">Mizoram</option>
            <option value="Sikkim">Sikkim</option>
          </select>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading telemetry stations...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#536B8F] border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Station / District</th>
                  <th className="py-2.5 px-3 font-semibold">State & Elev.</th>
                  <th className="py-2.5 px-3 font-semibold">Avg Slope</th>
                  <th className="py-2.5 px-3 font-semibold">Risk Level</th>
                  <th className="py-2.5 px-3 font-semibold">Risk Index</th>
                  <th className="py-2.5 px-3 font-semibold">Pre-Event Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#0F1F3D]">
                {filteredZones.map((z) => {
                  let riskBadge = 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]';
                  if (z.risk_level === 'CRITICAL') {
                    riskBadge = 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';
                  } else if (z.risk_level === 'HIGH') {
                    riskBadge = 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]';
                  } else if (z.risk_level === 'MEDIUM') {
                    riskBadge = 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
                  }

                  return (
                    <tr key={z.zone_id} className="hover:bg-[#F8FAFC] motion-row">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[13px] text-[#0F1F3D] leading-tight">{z.name}</div>
                        <div className="text-[11px] text-[#536B8F] mt-1 font-normal">{z.district}</div>
                      </td>
                      <td className="py-3 px-3 text-[#536B8F]">{z.state} ({Math.round(z.avg_elevation_m)}m)</td>
                      <td className="py-3 px-3 font-bold text-[#1769D2]">{z.avg_slope_deg}°</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${riskBadge}`}>
                          {z.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold">{z.risk_score !== null && z.risk_score !== undefined ? `${Math.round(z.risk_score)} / 100` : 'OUT OF COVERAGE'}</td>
                      <td className="py-3 px-3 text-[#536B8F] font-medium">{z.historical_condition_window || z.time_to_failure_window || 'Baseline Regime'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
