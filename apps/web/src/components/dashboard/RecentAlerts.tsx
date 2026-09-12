'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
} from 'lucide-react';

interface AlertItem {
  id: string;
  title: string;
  location: string;
  time: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Info';
}

const alertsData: AlertItem[] = [
  {
    id: 'alert-1',
    title: 'High landslide risk predicted',
    location: 'Kameng, Arunachal Pradesh',
    time: '10:12 AM',
    severity: 'Critical',
  },
  {
    id: 'alert-2',
    title: 'Increased soil moisture detected',
    location: 'East Khasi Hills, Meghalaya',
    time: '09:48 AM',
    severity: 'High',
  },
  {
    id: 'alert-3',
    title: 'Multiple slope failures reported',
    location: 'Ukhrul, Manipur',
    time: '09:20 AM',
    severity: 'Critical',
  },
  {
    id: 'alert-4',
    title: 'Heavy rainfall expected (24h)',
    location: 'Dima Hasao, Assam',
    time: '08:55 AM',
    severity: 'Medium',
  },
  {
    id: 'alert-5',
    title: 'Road clearance completed',
    location: 'NH-2, Dimapur',
    time: '08:30 AM',
    severity: 'Info',
  },
];

export const RecentAlerts: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-[#DCE6F2] shadow-xs flex flex-col p-5 motion-card">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#EBF1F8]">
        <h3 className="text-[16px] font-bold text-[#0F1F3D]">
          Recent Alerts
        </h3>
        <Link
          href="/alerts"
          className="text-[12px] font-semibold text-[#1769D2] hover:text-[#1257B2] flex items-center gap-1 transition-colors duration-150 group"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150 ease-premium" />
        </Link>
      </div>

      {/* Alert List matching reference image */}
      <div className="divide-y divide-[#F1F5F9] -mb-1">
        {alertsData.map((alert) => {
          let icon = <AlertTriangle className="w-4 h-4 text-[#EF4444]" />;
          let iconBg = 'bg-[#FEF2F2] border-[#FECACA]';
          let badgeStyle = 'bg-[#EF4444] text-white';

          if (alert.severity === 'High') {
            icon = <AlertCircle className="w-4 h-4 text-[#F97316]" />;
            iconBg = 'bg-[#FFF7ED] border-[#FED7AA]';
            badgeStyle = 'bg-[#F97316] text-white';
          } else if (alert.severity === 'Medium') {
            icon = <AlertCircle className="w-4 h-4 text-[#F59E0B]" />;
            iconBg = 'bg-[#FFFBEB] border-[#FDE68A]';
            badgeStyle = 'bg-[#F59E0B] text-white';
          } else if (alert.severity === 'Info') {
            icon = <Info className="w-4 h-4 text-[#3B82F6]" />;
            iconBg = 'bg-[#EFF6FF] border-[#BFDBFE]';
            badgeStyle = 'bg-[#3B82F6] text-white';
          }

          return (
            <div
              key={alert.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-[#F8FAFC] -mx-2 px-2 rounded-lg transition-all duration-150 ease-premium motion-row cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                {/* Severity Icon Container */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border transition-transform duration-150 group-hover:scale-105 ${iconBg}`}
                >
                  {icon}
                </div>

                {/* Title and Location */}
                <div>
                  <h4 className="text-[13px] font-semibold text-[#0F1F3D] leading-tight group-hover:text-[#1769D2] transition-colors duration-150">
                    {alert.title}
                  </h4>
                  <p className="text-[11.5px] text-[#536B8F] mt-0.5">
                    {alert.location}
                  </p>
                </div>
              </div>

              {/* Time and Badge */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] font-medium text-[#758CA8] whitespace-nowrap">
                  {alert.time}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight uppercase shadow-2xs transition-transform duration-150 group-hover:scale-[1.03] ${badgeStyle}`}
                >
                  {alert.severity}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
