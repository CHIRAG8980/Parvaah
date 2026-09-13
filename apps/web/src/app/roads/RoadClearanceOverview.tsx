'use client';

import React from 'react';
import { AlertTriangle, Truck, ShieldCheck } from 'lucide-react';
import { RoadSegmentResponse } from '../../lib/api/types';

interface RoadClearanceOverviewProps {
  roads: RoadSegmentResponse[];
}

export const RoadClearanceOverview: React.FC<RoadClearanceOverviewProps> = ({ roads }) => {
  const nonOperational = roads.filter((r) => r.status !== 'operational');

  return (
    <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs flex flex-col justify-between motion-card">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#EBF1F8]">
          <h3 className="text-[16px] font-bold text-[#0F1F3D]">
            Active BRO & PWD Heavy Clearance Detachments
          </h3>
          <span className="text-xs font-semibold text-[#1769D2]">
            {nonOperational.length} Heavy Taskforces Engaged
          </span>
        </div>

        {nonOperational.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center text-[#536B8F] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#10B981]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0F1F3D]">All Strategic Corridors Fully Operational</p>
              <p className="text-[11px] text-[#758CA8] mt-0.5">
                No active landslide collapses, boulder falls, or heavy debris blockages reported.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {roads
              .filter((r) => r.status === 'blocked')
              .slice(0, 2)
              .map((r) => (
                <div
                  key={r.road_id}
                  className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3.5 transition-all duration-200 hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#DC2626]">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{r.name} Blockage</span>
                  </div>
                  <p className="text-[11.5px] text-[#7F1D1D] mt-1.5 leading-snug line-clamp-2">
                    {r.blockage_reason || 'Slope collapse under clearance'}.
                  </p>
                </div>
              ))}
            {roads
              .filter((r) => r.status === 'at_risk')
              .slice(0, 2)
              .map((r) => (
                <div
                  key={r.road_id}
                  className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-3.5 transition-all duration-200 hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#D97706]">
                    <Truck className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{r.name} At Risk</span>
                  </div>
                  <p className="text-[11.5px] text-[#78350F] mt-1.5 leading-snug line-clamp-2">
                    {r.blockage_reason || 'Pore water pressure high, single lane'}.
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#536B8F]">
        <span>Corridor radar refresh interval: 30s.</span>
        <button
          type="button"
          onClick={() => alert('Exporting live road condition bulletin to SDMA dispatch network')}
          className="text-[#1769D2] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Export Traffic Advisory PDF</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
