'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, Info, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { AlertQueueItem } from '../../lib/api/types';

interface AlertItemCardProps {
  alert: AlertQueueItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

export const AlertItemCard: React.FC<AlertItemCardProps> = ({
  alert,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}) => {
  const isResolved = alert.status === 'resolved' || alert.status === 'approved';
  const minutesLeft = Math.max(0, Math.floor(alert.seconds_until_escalation / 60));

  let icon = <AlertTriangle className="w-5 h-5 text-[#EF4444]" />;
  let severityBadge = 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';

  if (alert.severity === 'High') {
    icon = <AlertCircle className="w-5 h-5 text-[#F97316]" />;
    severityBadge = 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]';
  } else if (alert.severity === 'Medium') {
    icon = <AlertCircle className="w-5 h-5 text-[#F59E0B]" />;
    severityBadge = 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
  } else if (alert.severity === 'Info') {
    icon = <Info className="w-5 h-5 text-[#3B82F6]" />;
    severityBadge = 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';
  }

  return (
    <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs hover:border-[#1769D2]/40 motion-card motion-card-hover flex flex-col md:flex-row md:items-start justify-between gap-5 group">
      <div className="flex items-start gap-4 flex-1">
        <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex-shrink-0 mt-0.5">
          {icon}
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-semibold text-[#536B8F] bg-[#F1F5F9] px-2 py-0.5 rounded">
              {alert.alert_id}
            </span>
            <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${severityBadge}`}>
              {alert.severity}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626]">
              ● {alert.status.replace('_', ' ').toUpperCase()} ({minutesLeft}m left)
            </span>
          </div>

          <h3 className="text-[15px] font-bold text-[#0F1F3D] group-hover:text-[#1769D2] transition-colors duration-150">
            {alert.title}
          </h3>

          <div className="flex items-center gap-4 text-xs text-[#536B8F] flex-wrap">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#1769D2]" />
              <span>{alert.district}, {alert.state} ({alert.zone_name})</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#758CA8]" />
              <span>Escalation: {alert.escalation_level}</span>
            </div>
          </div>

          <div className="mt-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-xs space-y-1">
            <div>
              <strong className="text-[#0F1F3D]">Official Draft Alert: </strong>
              <span className="text-[#334155]">{alert.draft_message}</span>
            </div>
            {alert.factors?.top_factors?.length > 0 && (
              <div>
                <strong className="text-[#0F1F3D]">Top Geotechnical Triggers: </strong>
                <span className="text-[#1769D2] font-medium">{alert.factors.top_factors.join(' • ')}</span>
              </div>
            )}
            {alert.suggested_actions?.length > 0 && (
              <div>
                <strong className="text-[#0F1F3D]">SDRF Suggested Action: </strong>
                <span className="text-[#059669] font-medium">{alert.suggested_actions.join('; ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex md:flex-col items-center md:items-end gap-2 flex-shrink-0 self-end md:self-auto">
        {!isResolved ? (
          <>
            <button
              type="button"
              disabled={isApproving}
              onClick={() => onApprove(alert.alert_id)}
              className="px-3.5 py-1.5 bg-[#1769D2] hover:bg-[#1257B2] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-2xs motion-btn cursor-pointer"
            >
              {isApproving ? 'Approving...' : 'Approve & Dispatch'}
            </button>
            <button
              type="button"
              disabled={isRejecting}
              onClick={() => onReject(alert.alert_id)}
              className="px-3 py-1.5 border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold rounded-lg motion-btn cursor-pointer"
            >
              {isRejecting ? 'Rejecting...' : 'Reject / False Alarm'}
            </button>
          </>
        ) : (
          <span className="text-xs font-semibold text-[#16A34A] flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Dispatched & Logged
          </span>
        )}
      </div>
    </div>
  );
};
