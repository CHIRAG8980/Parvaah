'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, Split, CloudRain, RotateCcw } from 'lucide-react';
import { useKpis } from '../../hooks/useKpis';

const ICON_MAP: Record<string, { icon: React.ElementType; iconBg: string; iconColor: string }> = {
  'active-alerts': { icon: ShieldAlert, iconBg: 'bg-[#FEF2F2]', iconColor: 'text-[#DC2626]' },
  'high-risk-districts': { icon: ShieldCheck, iconBg: 'bg-[#FFF7ED]', iconColor: 'text-[#EA580C]' },
  'roads-affected': { icon: Split, iconBg: 'bg-[#EAF3FF]', iconColor: 'text-[#1769D2]' },
  'avg-rainfall': { icon: CloudRain, iconBg: 'bg-[#ECFDF5]', iconColor: 'text-[#10B981]' },
};

export const KpiSummaryCards: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useKpis();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-[#DCE6F2] p-4 flex items-center justify-between shadow-xs animate-pulse"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-100" />
              <div className="space-y-2">
                <div className="w-16 h-6 bg-slate-200 rounded" />
                <div className="w-24 h-3 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="space-y-2 flex flex-col items-end">
              <div className="w-12 h-4 bg-slate-100 rounded-full" />
              <div className="w-16 h-3 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 flex items-center justify-between text-xs text-[#DC2626]">
        <span>Failed to load live KPIs: {error?.message || 'Server error'}</span>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1 font-semibold text-[#DC2626] hover:underline cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((item) => {
        const visual = ICON_MAP[item.id] || {
          icon: ShieldAlert,
          iconBg: 'bg-[#EAF3FF]',
          iconColor: 'text-[#1769D2]',
        };
        const Icon = visual.icon;

        return (
          <div
            key={item.id}
            className="group bg-white rounded-xl border border-[#DCE6F2] p-4 flex items-center justify-between shadow-xs hover:border-[#CBD5E1] motion-card motion-card-hover select-none"
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-180 ease-premium group-hover:scale-105 ${visual.iconBg} ${visual.iconColor}`}
              >
                <Icon className="w-6 h-6" />
              </div>

              <div>
                <div className="text-[26px] font-bold text-[#0F1F3D] leading-none tracking-tight">
                  {item.value}
                </div>
                <div className="text-[13px] font-medium text-[#536B8F] mt-1">
                  {item.label}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end text-right">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] transition-transform duration-150 group-hover:scale-[1.02]">
                {item.trend}
              </span>
              <span className="text-[11px] text-[#8497B0] font-normal mt-1 whitespace-nowrap">
                {item.comparison}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
