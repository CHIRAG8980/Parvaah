'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { RoadSegmentResponse } from '../../lib/api/types';

interface RoadItemRowProps {
  road: RoadSegmentResponse;
}

export const RoadItemRow: React.FC<RoadItemRowProps> = ({ road }) => {
  let statusBadge = 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]';
  if (road.status === 'blocked') {
    statusBadge = 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';
  } else if (road.status === 'at_risk') {
    statusBadge = 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
  }

  return (
    <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F8FAFC] -mx-2 px-2 rounded-lg motion-row">
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-bold text-[#1769D2] text-sm bg-[#EAF3FF] px-2 py-0.5 rounded">
            {road.road_id}
          </span>
          <h4 className="font-bold text-[#0F1F3D] text-[14px]">
            {road.name}
          </h4>
          <span className={`text-[10.5px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusBadge}`}>
            {road.status.replace('_', ' ')}
          </span>
          {road.is_single_access && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
              Sole Lifeline Access
            </span>
          )}
        </div>

        <div className="text-xs text-[#536B8F] flex items-center gap-4 pt-1 flex-wrap">
          <span><strong>Class:</strong> {road.road_class.replace('_', ' ').toUpperCase()}</span>
          <span>•</span>
          <span><strong>Zone:</strong> {road.zone_id}</span>
          {road.start_point && <span>• <strong>Span:</strong> {road.start_point} → {road.end_point}</span>}
        </div>

        {road.blockage_reason && (
          <div className="text-xs text-[#334155] pt-0.5">
            <span className="text-[#DC2626] font-semibold">Incident Advisory: </span>
            {road.blockage_reason}
          </div>
        )}
      </div>

      <div className="flex flex-col md:items-end text-xs text-[#536B8F] flex-shrink-0">
        <div className="font-bold text-[#0F1F3D]">Project Vartak (BRO)</div>
        <div className="flex items-center gap-1 mt-1 text-[#1769D2] font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>Status: {road.status === 'blocked' ? 'Active Clearance' : 'Open Transit'}</span>
        </div>
      </div>
    </div>
  );
};
