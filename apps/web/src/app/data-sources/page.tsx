'use client';

import React from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import {
  Satellite,
  Activity,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useDataSources } from '../../hooks/useDataSources';

export default function DataSourcesPage() {
  const { data, isLoading, isError, refetch } = useDataSources();

  const sources = data?.sources || [];
  const onlineCount = data?.active_sources ?? 0;
  const totalCount = data?.total_sources ?? sources.length;

  const avgLatency = sources.length > 0
    ? `${Math.round(sources.reduce((sum, s) => sum + s.latency_ms, 0) / sources.length)} ms`
    : '--';

  return (
    <DashboardShell>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
            Telemetry Ingestion & Sensor Network Health
          </h1>
          <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
            Real-time status of satellite radar streams, IMD Doppler radars, and field geotechnical IoT arrays
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F8FAFC] border border-[#DCE6F2] text-[#0F1F3D] text-xs font-semibold rounded-lg shadow-xs motion-btn cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#1769D2] ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Verifying Feeds...' : 'Ping Telemetry Pipelines'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">Pipelines Online</span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">{onlineCount} / {totalCount}</div>
          <span className="text-[11px] text-[#16A34A] font-medium">{data?.overall_status || 'Monitoring Active'}</span>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">Average Latency</span>
            <Zap className="w-4 h-4 text-[#1769D2]" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">{avgLatency}</div>
          <span className="text-[11px] text-[#1769D2] font-medium">Sub-second Geotechnical</span>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">Stale Sources</span>
            <Activity className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">{data?.stale_sources_count ?? 0}</div>
          <span className="text-[11px] text-[#536B8F] font-medium">Under Recalibration</span>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">Live Pipeline Uptime</span>
            <Satellite className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">
            {totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0}%
          </div>
          <span className="text-[11px] text-[#7C3AED] font-medium">Live Telemetry Handshake</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs space-y-4 motion-card">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBF1F8]">
          <h3 className="text-[16px] font-bold text-[#0F1F3D]">Data Pipeline Ingestion Status</h3>
          <span className="text-xs text-[#536B8F] font-bold">Active Real-Time Pings</span>
        </div>


        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading pipeline status...</div>
        ) : isError ? (
          <div className="py-12 text-center text-xs text-[#DC2626]">Failed to connect to data sources endpoint</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#536B8F] border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Source Name</th>
                  <th className="py-2.5 px-3 font-semibold">Operational Status</th>
                  <th className="py-2.5 px-3 font-semibold">Ping Latency</th>
                  <th className="py-2.5 px-3 font-semibold">Usable Records</th>
                  <th className="py-2.5 px-3 font-semibold">Confidence</th>
                  <th className="py-2.5 px-3 font-semibold">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#0F1F3D]">
                {sources.map((source) => {
                  const isDegraded = source.status.toLowerCase().includes('degraded');
                  return (
                    <tr key={source.source_id} className="hover:bg-[#F8FAFC] motion-row">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#0F1F3D]">{source.name}</div>
                        <span className="font-mono text-[10.5px] text-[#758CA8]">{source.remarks}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                            isDegraded
                              ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                              : 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isDegraded ? 'bg-[#D97706]' : 'bg-[#16A34A]'}`} />
                          {source.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-[#10B981]">{source.latency_ms} ms</td>
                      <td className="py-3.5 px-3 font-bold text-[#0F1F3D]">{source.usable_records_pct}%</td>
                      <td className="py-3.5 px-3 font-mono text-[#1769D2]">{(source.confidence_score * 100).toFixed(0)}%</td>
                      <td className="py-3.5 px-3 text-[#536B8F]">{source.last_sync}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
