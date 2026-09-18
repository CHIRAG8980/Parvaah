'use client';

import React from 'react';
import { Activity, ShieldCheck, Clock, WifiOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useFreshness } from '../../hooks/useFreshness';

/** Maps data_status → badge appearance */
const STATUS_STYLES = {
  LIVE: {
    container: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#10B981]',
    dot: 'bg-[#10B981]',
    ping: 'bg-[#10B981]',
    label: 'Live',
    icon: Activity,
  },
  NEAR_REAL_TIME: {
    container: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]',
    dot: 'bg-[#D97706]',
    ping: 'bg-[#D97706]',
    label: 'Near-Real-Time',
    icon: Clock,
  },
  STALE: {
    container: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]',
    dot: 'bg-[#DC2626]',
    ping: 'bg-[#DC2626]',
    label: 'Stale Data',
    icon: WifiOff,
  },
  NO_DATA: {
    container: 'bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B]',
    dot: 'bg-[#64748B]',
    ping: 'bg-[#64748B]',
    label: 'No Data',
    icon: WifiOff,
  },
} as const;

function DataStatusBadge() {
  const { data, isLoading } = useFreshness();

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] text-xs font-semibold shadow-2xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Checking…</span>
      </div>
    );
  }

  const status = data?.data_status ?? 'NO_DATA';
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.NO_DATA;
  const Icon = style.icon;

  // Build tooltip-style age text
  let ageText = '';
  if (data?.prediction_age_minutes != null) {
    const mins = data.prediction_age_minutes;
    ageText = mins < 60
      ? `${Math.round(mins)}m ago`
      : `${Math.round(mins / 60)}h ago`;
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-2xs cursor-default ${style.container}`}
      title={
        data
          ? `Last prediction: ${ageText || 'unknown'} | Source: ${data.weather_source} | Model: ${data.model_version}`
          : 'Data status unknown'
      }
    >
      {status === 'LIVE' ? (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.ping} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot}`} />
        </span>
      ) : (
        <span className={`inline-flex rounded-full h-2 w-2 ${style.dot}`} />
      )}
      <Icon className="w-3.5 h-3.5" />
      <span>{style.label}</span>
      {ageText && (
        <span className="opacity-70 font-normal">{ageText}</span>
      )}
    </div>
  );
}

export const HeaderSection: React.FC = () => {
  const { user, isScopedToDistrict, assignedDistrict } = useAuth();

  const title = isScopedToDistrict && assignedDistrict
    ? `${assignedDistrict} District Command Room`
    : 'Parvaah — AI Early Warning & Landslide Risk Monitoring System (NER)';

  const subtitle = isScopedToDistrict && assignedDistrict
    ? `Authorized District Disaster Management Jurisdiction • Monitored by ${user?.full_name || 'Officer'}`
    : 'Real-time intelligence for safer communities across North East India';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
            {title}
          </h1>
          {isScopedToDistrict && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DMO Jurisdiction</span>
            </span>
          )}
        </div>
        <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2 self-start md:self-auto">
        {/* Dynamic status badge — reflects actual data freshness from /analytics/freshness */}
        <DataStatusBadge />
      </div>
    </div>
  );
};
