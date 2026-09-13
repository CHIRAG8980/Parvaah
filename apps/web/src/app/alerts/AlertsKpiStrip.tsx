'use client';

import React from 'react';
import { Car, CheckCircle2 } from 'lucide-react';

interface AlertsKpiStripProps {
  criticalCount: number;
  highCount: number;
  activeCount: number;
  approvedCount: number;
}

export const AlertsKpiStrip: React.FC<AlertsKpiStripProps> = ({
  criticalCount,
  highCount,
  activeCount,
  approvedCount,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#536B8F]">Critical Alerts</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
        </div>
        <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">{criticalCount}</div>
        <span className="text-[11px] text-[#DC2626] font-medium">Immediate Evacuation</span>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#536B8F]">High Risk Alerts</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
        </div>
        <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">{highCount}</div>
        <span className="text-[11px] text-[#EA580C] font-medium">SDRF Standby</span>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#536B8F]">Queue Total</span>
          <Car className="w-4 h-4 text-[#1769D2]" />
        </div>
        <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">{activeCount}</div>
        <span className="text-[11px] text-[#536B8F] font-medium">Pending Authority Action</span>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#536B8F]">Processed</span>
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
        </div>
        <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">{approvedCount}</div>
        <span className="text-[11px] text-[#16A34A] font-medium">Dispatched to Field</span>
      </div>
    </div>
  );
};
