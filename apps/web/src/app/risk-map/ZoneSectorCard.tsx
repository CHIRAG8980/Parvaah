'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, ArrowUpRight } from 'lucide-react';
import { ZoneSummaryResponse } from '../../lib/api/types';

interface ZoneSectorCardProps {
  zone: ZoneSummaryResponse;
}

export const ZoneSectorCard: React.FC<ZoneSectorCardProps> = ({ zone }) => {
  const isCritical = zone.risk_level === 'CRITICAL';

  return (
    <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs hover:border-[#1769D2]/50 motion-card flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-mono font-semibold text-[#536B8F] bg-[#F1F5F9] px-2 py-0.5 rounded">
            {zone.zone_id}
          </span>
          <span
            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
              isCritical
                ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                : 'bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]'
            }`}
          >
            {zone.risk_level} ({zone.risk_score !== null && zone.risk_score !== undefined ? Math.round(zone.risk_score) : 'N/A'})
          </span>
        </div>

        <h3 className="text-[14.5px] font-bold text-[#0F1F3D] leading-tight group-hover:text-[#1769D2] transition-colors duration-150">
          {zone.name}
        </h3>
        <p className="text-[12px] text-[#536B8F] mt-0.5">
          {zone.district}, {zone.state}
        </p>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#F1F5F9] text-xs">
          <div className="bg-[#F8FAFC] p-2 rounded-lg">
            <span className="text-[10.5px] text-[#64748B] block">Slope Angle</span>
            <span className="font-bold text-[#0F1F3D]">{zone.avg_slope_deg}°</span>
          </div>
          <div className="bg-[#F8FAFC] p-2 rounded-lg">
            <span className="text-[10.5px] text-[#64748B] block">Elevation</span>
            <span className="font-bold text-[#0F1F3D]">{Math.round(zone.avg_elevation_m)} m</span>
          </div>
          <div className="bg-[#F8FAFC] p-2 rounded-lg">
            <span className="text-[10.5px] text-[#64748B] block">Confidence</span>
            <span className="font-bold text-[#10B981]">{zone.confidence}</span>
          </div>
          <div className="bg-[#F8FAFC] p-2 rounded-lg">
            <span className="text-[10.5px] text-[#64748B] block">Pre-Event Profile</span>
            <span className={`font-bold ${
              (zone.historical_condition_window || zone.time_to_failure_window)
                ? (zone.risk_level === 'HIGH' || zone.risk_level === 'CRITICAL' ? 'text-[#DC2626]' : 'text-[#D97706]')
                : 'text-[#10B981]'
            }`}>
              {zone.historical_condition_window || zone.time_to_failure_window || 'Baseline Regime'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[#10B981] font-semibold text-[11.5px]">
          <Activity className="w-3.5 h-3.5" />
          <span>Telemetry Verified</span>
        </div>
        <Link
          href="/data-sources"
          className="text-[#1769D2] font-semibold hover:underline flex items-center gap-0.5 text-[11.5px] cursor-pointer"
        >
          <span>View Telemetry</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
