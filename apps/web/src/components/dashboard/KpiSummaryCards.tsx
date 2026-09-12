'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, Split, CloudRain } from 'lucide-react';

interface KpiItem {
  id: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  trend: string;
  trendType: 'increase-danger' | 'neutral' | 'decrease-good';
  comparison: string;
}

const kpiData: KpiItem[] = [
  {
    id: 'active-alerts',
    icon: ShieldAlert,
    iconBg: 'bg-[#EAF3FF]',
    iconColor: 'text-[#1769D2]',
    value: '23',
    label: 'Active Alerts',
    trend: '↑ 5',
    trendType: 'increase-danger',
    comparison: 'vs. last 24h',
  },
  {
    id: 'high-risk-districts',
    icon: ShieldCheck,
    iconBg: 'bg-[#ECFDF5]',
    iconColor: 'text-[#10B981]',
    value: '8',
    label: 'High Risk Districts',
    trend: '↑ 2',
    trendType: 'increase-danger',
    comparison: 'vs. last 24h',
  },
  {
    id: 'roads-affected',
    icon: Split,
    iconBg: 'bg-[#EAF3FF]',
    iconColor: 'text-[#1769D2]',
    value: '12',
    label: 'Roads Affected',
    trend: '↑ 4',
    trendType: 'increase-danger',
    comparison: 'vs. last 24h',
  },
  {
    id: 'avg-rainfall',
    icon: CloudRain,
    iconBg: 'bg-[#EAF3FF]',
    iconColor: 'text-[#1769D2]',
    value: '154 mm',
    label: 'Avg. Rainfall (24h)',
    trend: '↑ 28%',
    trendType: 'increase-danger',
    comparison: 'vs. previous day',
  },
];

export const KpiSummaryCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpiData.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className="group bg-white rounded-xl border border-[#DCE6F2] p-4 flex items-center justify-between shadow-xs hover:border-[#CBD5E1] motion-card motion-card-hover select-none"
          >
            <div className="flex items-center gap-3.5">
              {/* Icon Container */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-180 ease-premium group-hover:scale-105 ${item.iconBg} ${item.iconColor}`}
              >
                <Icon className="w-6 h-6" />
              </div>

              {/* Metric & Label */}
              <div>
                <div className="text-[26px] font-bold text-[#0F1F3D] leading-none tracking-tight">
                  {item.value}
                </div>
                <div className="text-[13px] font-medium text-[#536B8F] mt-1">
                  {item.label}
                </div>
              </div>
            </div>

            {/* Trend & Comparison */}
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
