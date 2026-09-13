'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle } from 'lucide-react';
import { useActiveAlerts } from '../../hooks/useAlerts';

export const HeaderNotifications: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: alerts = [], isLoading } = useActiveAlerts();

  const count = alerts?.length ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#536B8F] hover:text-[#0F1F3D] hover:bg-[#F4F8FC] rounded-lg transition-all duration-150 ease-premium motion-btn cursor-pointer"
        aria-label="Notifications"
        title="Operational Alerts & Dispatches"
      >
        <Bell className="w-5 h-5 transition-transform duration-150" />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white motion-beacon" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:-right-8 mt-2 w-80 sm:w-96 bg-white border border-[#DCE6F2] rounded-xl shadow-2xl z-[1300] text-xs motion-dropdown motion-dropdown-right overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0F1F3D] text-[13px]">
                Incident Notifications
              </span>
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold">
                  {count} Active
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-[#F1F5F9] max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-slate-400">Checking alert feed...</div>
            ) : count === 0 ? (
              <div className="p-6 text-center text-xs text-[#758CA8]">
                No active critical incidents
              </div>
            ) : (
              alerts?.slice(0, 5).map((item) => (
                <div key={item.alert_id} className="p-3 hover:bg-[#F8FAFC] flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#FEF2F2] text-[#DC2626] flex-shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#0F1F3D] truncate">{item.headline}</p>
                    <p className="text-[11px] text-[#536B8F] line-clamp-1">{item.body_text}</p>
                    <span className="text-[10px] text-[#758CA8]">{item.district}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] text-center">
            <Link
              href="/alerts"
              onClick={() => setIsOpen(false)}
              className="text-[12px] font-bold text-[#1769D2] hover:text-[#1257B2] inline-flex items-center gap-1"
            >
              <span>View All Alerts in Incident Console</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
