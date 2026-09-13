'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, AlertCircle, Info, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { useAlertQueue } from '../../hooks/useAlerts';
import { AlertSeverity } from '../../lib/api/types';

export const RecentAlerts: React.FC = () => {
  const { alerts, isLoading, isError } = useAlertQueue();

  const displayedAlerts = alerts.slice(0, 4);

  return (
    <div className="bg-white rounded-xl border border-[#DCE6F2] shadow-xs flex flex-col p-5 motion-card">
      <div className="flex items-center justify-between pb-3.5 border-b border-[#EBF1F8]">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-bold text-[#0F1F3D]">Recent Alerts</h3>
          {alerts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626]">
              {alerts.length} Pending
            </span>
          )}
        </div>
        <Link
          href="/alerts"
          className="text-[12px] font-semibold text-[#1769D2] hover:text-[#1257B2] flex items-center gap-1 transition-colors duration-150 group"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150 ease-premium" />
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-[#F1F5F9] -mb-1 pt-2">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-7 h-7 rounded-lg bg-slate-100" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-3/4 h-3.5 bg-slate-200 rounded" />
                  <div className="w-1/2 h-2.5 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="w-14 h-4 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="py-6 text-center text-xs text-[#DC2626]">
          Unable to fetch live alerts from server
        </div>
      ) : displayedAlerts.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center text-[#536B8F] space-y-1.5">
          <div className="w-8 h-8 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#10B981]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-[#0F1F3D]">No Critical Alerts Pending</span>
          <span className="text-[11px] text-[#758CA8]">Monitoring zones reporting normal conditions</span>
        </div>
      ) : (
        <div className="divide-y divide-[#F1F5F9] -mb-1">
          {displayedAlerts.map((alert) => {
            const severity = alert.severity as AlertSeverity;
            let icon = <AlertTriangle className="w-4 h-4 text-[#EF4444]" />;
            let iconBg = 'bg-[#FEF2F2] border-[#FECACA]';
            let badgeStyle = 'bg-[#EF4444] text-white';

            if (severity === 'High') {
              icon = <AlertCircle className="w-4 h-4 text-[#F97316]" />;
              iconBg = 'bg-[#FFF7ED] border-[#FED7AA]';
              badgeStyle = 'bg-[#F97316] text-white';
            } else if (severity === 'Medium') {
              icon = <AlertCircle className="w-4 h-4 text-[#F59E0B]" />;
              iconBg = 'bg-[#FFFBEB] border-[#FDE68A]';
              badgeStyle = 'bg-[#F59E0B] text-white';
            } else if (severity === 'Info') {
              icon = <Info className="w-4 h-4 text-[#3B82F6]" />;
              iconBg = 'bg-[#EFF6FF] border-[#BFDBFE]';
              badgeStyle = 'bg-[#3B82F6] text-white';
            }

            const minutesLeft = Math.max(0, Math.floor(alert.seconds_until_escalation / 60));

            return (
              <div
                key={alert.alert_id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-[#F8FAFC] -mx-2 px-2 rounded-lg transition-all duration-150 ease-premium motion-row cursor-pointer group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border transition-transform duration-150 group-hover:scale-105 ${iconBg}`}
                  >
                    {icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-[13px] font-semibold text-[#0F1F3D] leading-tight group-hover:text-[#1769D2] transition-colors duration-150 truncate">
                      {alert.title}
                    </h4>
                    <p className="text-[11.5px] text-[#536B8F] mt-0.5 truncate">
                      {alert.district}, {alert.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-[11px] font-medium text-[#758CA8] flex items-center gap-1 whitespace-nowrap">
                    <Clock className="w-3 h-3 text-[#DC2626]" />
                    <span>{minutesLeft}m left</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase shadow-2xs transition-transform duration-150 group-hover:scale-[1.03] ${badgeStyle}`}
                  >
                    {alert.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
