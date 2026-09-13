'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { AlertsKpiStrip } from './AlertsKpiStrip';
import { AlertItemCard } from './AlertItemCard';
import { useAlertQueue } from '../../hooks/useAlerts';
import { Search, Radio, CheckCircle2 } from 'lucide-react';

export default function AlertsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const { alerts, isLoading, isError, approve, reject, isApproving, isRejecting } = useAlertQueue();

  const criticalCount = alerts.filter((a) => a.severity === 'Critical').length;
  const highCount = alerts.filter((a) => a.severity === 'High').length;
  const approvedCount = alerts.filter((a) => a.status === 'approved').length;

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.alert_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = selectedSeverity === 'All' || alert.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'All' || alert.status === selectedStatus.toLowerCase();
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleApprove = async (id: string) => {
    try {
      const alert = alerts.find((a) => a.alert_id === id);
      await approve(id, {
        officer_id: 'usr-officer-01',
        final_message: alert?.draft_message || 'Emergency landslide advisory dispatched.',
        selected_channels: ['sms', 'app_push', 'cap_sachet'],
      });
      setActionNotice(`Alert ${id} successfully approved and dispatched.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      setActionNotice(`Failed to approve: ${err instanceof Error ? err.message : 'Error'}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await reject(id, {
        officer_id: 'usr-officer-01',
        reason_code: 'false_positive_rain_threshold',
        notes: 'Officer field verification determined no immediate ground movement.',
      });
      setActionNotice(`Alert ${id} rejected and logged to model audit trail.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      setActionNotice(`Failed to reject: ${err instanceof Error ? err.message : 'Error'}`);
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
            Disaster Alerts & Control Room Review Queue
          </h1>
          <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
            Real-time early warnings, countdown timers, and emergency response coordination
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (filteredAlerts.length > 0) {
              handleApprove(filteredAlerts[0].alert_id);
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-lg shadow-sm motion-btn cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Quick Dispatch Critical Alert</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs font-semibold text-[#065F46] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{actionNotice}</span>
        </div>
      )}

      <AlertsKpiStrip
        criticalCount={criticalCount}
        highCount={highCount}
        activeCount={alerts.length}
        approvedCount={approvedCount}
      />

      <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#758CA8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alert by district, highway, or ID..."
              className="w-full text-xs bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg pl-9 pr-3 py-2 text-[#0F1F3D] focus:outline-none focus:border-[#1769D2]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-2 text-[#0F1F3D]"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-2 text-[#0F1F3D]"
          >
            <option value="All">All Statuses</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="space-y-3.5">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-[#DCE6F2]">
            Loading alert review queue from server...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-[#DC2626] bg-white rounded-xl border border-[#DCE6F2]">
            Unable to connect to alert queue service.
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#536B8F] bg-white rounded-xl border border-[#DCE6F2]">
            No alerts matching current filters
          </div>
        ) : (
          filteredAlerts.map((item) => (
            <AlertItemCard
              key={item.alert_id}
              alert={item}
              onApprove={handleApprove}
              onReject={handleReject}
              isApproving={isApproving}
              isRejecting={isRejecting}
            />
          ))
        )}
      </div>
    </DashboardShell>
  );
}
