'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { FileText, Download, Search, FileCheck } from 'lucide-react';
import { useApiQuery } from '../../hooks/useApiQuery';
import { apiClient } from '../../lib/api/client';
import { API_CONFIG } from '../../lib/api/config';
import { AuditLogItem } from '../../lib/api/types';

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');

  const { data: logs = [], isLoading } = useApiQuery<AuditLogItem[]>(
    async (signal) => {
      return apiClient.get<AuditLogItem[]>('/audit-log', {
        params: { limit: 100 },
        signal,
      });
    },
    []
  );

  const filteredLogs = (logs || []).filter((log) => {
    const matchesSearch =
      log.log_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = selectedAction === 'All' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const handleDownloadCsv = () => {
    window.open(`${API_CONFIG.baseUrl}/audit-log/export`, '_blank');
  };

  return (
    <DashboardShell>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
            Disaster Management Bulletins & Audit Trail
          </h1>
          <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
            Automated SDMA daily situation reports, immutable audit logs, and compliance records
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1769D2] hover:bg-[#1257B2] text-white text-xs font-semibold rounded-lg shadow-sm motion-btn cursor-pointer"
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Export Compliance Audit CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#758CA8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail by ID, entity, actor..."
              className="w-full text-xs bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg pl-9 pr-3 py-2 text-[#0F1F3D] focus:outline-none focus:border-[#1769D2]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-2 text-[#0F1F3D]"
          >
            <option value="All">All Audit Actions</option>
            <option value="alert_approved">Alert Approved</option>
            <option value="alert_rejected">Alert Rejected</option>
            <option value="auto_escalated">Auto Escalated</option>
            <option value="device_registered">Device Registered</option>
            <option value="outcome_verified">Outcome Verified</option>
          </select>
        </div>
      </div>

      <div className="space-y-3.5">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-[#DCE6F2]">
            Loading compliance audit trail...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#536B8F] bg-white rounded-xl border border-[#DCE6F2]">
            No audit records matching current search
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.log_id}
              className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs hover:border-[#1769D2]/40 motion-card flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1">
                <div className="p-3 bg-[#EAF3FF] rounded-xl text-[#1769D2] flex-shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-[#536B8F] bg-[#F1F5F9] px-2 py-0.5 rounded">
                      {log.log_id}
                    </span>
                    <span className="text-[11px] font-bold text-[#1769D2] bg-[#EAF3FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                      {log.entity_type}
                    </span>
                    <span className="text-[11px] font-semibold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                      ✓ {log.action}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-bold text-[#0F1F3D]">
                    Action: {log.action.replace('_', ' ').toUpperCase()} on {log.entity_id}
                  </h3>
                  <p className="text-xs text-[#536B8F]">
                    {log.details ? JSON.stringify(log.details) : 'Audit compliance verification snapshot recorded.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[#758CA8] pt-1">
                    <span><strong>Actor:</strong> {log.actor}</span>
                    <span>•</span>
                    <span><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1769D2] hover:bg-[#1257B2] text-white text-xs font-semibold rounded-lg shadow-2xs motion-btn cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
