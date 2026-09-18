'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface SettingsTelemetrySyncProps {
  awsPollRate: string;
  setAwsPollRate: (v: string) => void;
  insarSyncInterval: string;
  setInsarSyncInterval: (v: string) => void;
  inclinometerHeartbeat: string;
  setInclinometerHeartbeat: (v: string) => void;
  edgeFailover: boolean;
  setEdgeFailover: (v: boolean) => void;
}

export const SettingsTelemetrySync: React.FC<SettingsTelemetrySyncProps> = ({
  awsPollRate,
  setAwsPollRate,
  insarSyncInterval,
  setInsarSyncInterval,
  inclinometerHeartbeat,
  setInclinometerHeartbeat,
  edgeFailover,
  setEdgeFailover,
}) => {
  return (
    <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs motion-card">
      <div className="flex items-center gap-2.5 pb-4 border-b border-[#EBF1F8] mb-5">
        <div className="p-2 bg-[#EAF3FF] rounded-lg text-[#1769D2]">
          <RefreshCw className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#0F1F3D]">
            Telemetry Ingestion & Sync Intervals
          </h2>
          <p className="text-xs text-[#536B8F]">
            Frequency of edge radar sweeps, IMD weather feeds, and borehole telemetry pulls
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3.5 rounded-lg border border-[#DCE6F2] bg-[#F8FAFC]">
          <label className="block text-xs font-semibold text-[#0F1F3D] mb-1.5">
            IMD / AWS Station Poll
          </label>
          <select
            value={awsPollRate}
            onChange={(e) => setAwsPollRate(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-[#CBD5E1] rounded-md px-2.5 py-2 text-[#0F1F3D]"
          >
            <option value="15s">Every 15s (Real-time)</option>
            <option value="30s">Every 30s (Standard)</option>
            <option value="60s">Every 60s (Conserve)</option>
          </select>
        </div>

        <div className="p-3.5 rounded-lg border border-[#DCE6F2] bg-[#F8FAFC]">
          <label className="block text-xs font-semibold text-[#0F1F3D] mb-1.5">
            Satellite InSAR Sync
          </label>
          <select
            value={insarSyncInterval}
            onChange={(e) => setInsarSyncInterval(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-[#CBD5E1] rounded-md px-2.5 py-2 text-[#0F1F3D]"
          >
            <option value="15m">Every 15m</option>
            <option value="30m">Every 30m (Standard)</option>
            <option value="1h">Every 1h</option>
          </select>
        </div>

        <div className="p-3.5 rounded-lg border border-[#DCE6F2] bg-[#F8FAFC]">
          <label className="block text-xs font-semibold text-[#0F1F3D] mb-1.5">
            Inclinometer Heartbeat
          </label>
          <select
            value={inclinometerHeartbeat}
            onChange={(e) => setInclinometerHeartbeat(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-[#CBD5E1] rounded-md px-2.5 py-2 text-[#0F1F3D]"
          >
            <option value="30s">Every 30s</option>
            <option value="1m">Every 1m (Standard)</option>
            <option value="5m">Every 5m</option>
          </select>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#EBF1F8] flex items-center justify-between">
        <div>
          <span className="text-xs sm:text-sm font-semibold text-[#0F1F3D]">
            Edge Gateway Offline Caching & Automatic Failover
          </span>
          <p className="text-xs text-[#536B8F]">
            Retain telemetry locally during optical fiber severance
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEdgeFailover(!edgeFailover)}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
            edgeFailover ? 'bg-[#10B981]' : 'bg-[#CBD5E1]'
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
              edgeFailover ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
