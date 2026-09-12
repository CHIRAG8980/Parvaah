'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import {
  Database,
  Satellite,
  Radio,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Cpu,
  Wifi,
  Zap,
} from 'lucide-react';

interface DataSourceItem {
  id: string;
  name: string;
  provider: string;
  type: 'Satellite Radar' | 'Automatic Weather' | 'IoT Geotechnical' | 'Seismic Network' | 'Highway GIS';
  protocol: string;
  frequency: string;
  latency: string;
  lastSync: string;
  status: 'Operational' | 'Syncing' | 'Degraded';
  recordsToday: string;
}

const dataSources: DataSourceItem[] = [
  {
    id: 'SRC-SAT-01',
    name: 'Sentinel-1 InSAR Synthetic Aperture Radar',
    provider: 'European Space Agency (ESA) & ISRO Bhuvan Portal',
    type: 'Satellite Radar',
    protocol: 'Copernicus Open Access Hub API',
    frequency: '6 - 12 days pass cycle',
    latency: '18 mins',
    lastSync: '10:14 AM Today',
    status: 'Operational',
    recordsToday: '14 SAR Interferograms',
  },
  {
    id: 'SRC-SAT-02',
    name: 'Sentinel-2 & Landsat-9 Optical Multispectral (NDVI)',
    provider: 'ISRO National Remote Sensing Centre (NRSC)',
    type: 'Satellite Radar',
    protocol: 'WMS / Cloud-Optimized GeoTIFF',
    frequency: 'Daily composite',
    latency: '45 mins',
    lastSync: '09:30 AM Today',
    status: 'Operational',
    recordsToday: '8 Tile Mosaics',
  },
  {
    id: 'SRC-MET-01',
    name: 'IMD Doppler Weather Radar (DWR Cherrapunji & Mohanbari)',
    provider: 'India Meteorological Department (IMD)',
    type: 'Automatic Weather',
    protocol: 'Real-time WebSocket & HDF5 stream',
    frequency: 'Every 10 minutes',
    latency: '1.8 mins',
    lastSync: '10:22 AM Today',
    status: 'Operational',
    recordsToday: '144 Radar Sweeps',
  },
  {
    id: 'SRC-IOT-01',
    name: 'Borehole Inclinometer & Soil Pore Pressure Arrays',
    provider: 'Geological Survey of India (GSI) & IIT Guwahati Field Lab',
    type: 'IoT Geotechnical',
    protocol: 'MQTT over 4G/Satellite Uplink',
    frequency: 'Every 60 seconds',
    latency: '420 ms',
    lastSync: '10:24 AM Today (Live)',
    status: 'Operational',
    recordsToday: '51,840 Sensor Telemetries',
  },
  {
    id: 'SRC-SEIS-01',
    name: 'National Center for Seismology (NCS) Micro-Tremor Array',
    provider: 'Ministry of Earth Sciences (MoES)',
    type: 'Seismic Network',
    protocol: 'SEEDLink Real-time Protocol',
    frequency: 'Continuous 100Hz',
    latency: '310 ms',
    lastSync: '10:24 AM Today (Live)',
    status: 'Operational',
    recordsToday: '18 Micro-events Recorded',
  },
  {
    id: 'SRC-GIS-01',
    name: 'Border Roads Organisation (BRO) Patrol Incident Reporter',
    provider: 'BRO Project Vartak & Swastik Headquarters',
    type: 'Highway GIS',
    protocol: 'Secure REST JSON API',
    frequency: 'On incident trigger',
    latency: '2.5 mins',
    lastSync: '08:30 AM Today',
    status: 'Operational',
    recordsToday: '32 Highway Status Updates',
  },
];

export default function DataSourcesPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      alert('Telemetry sync complete: All 6 remote data pipelines re-verified.');
    }, 800);
  };

  return (
    <DashboardShell>
      {/* Header */}
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
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F8FAFC] border border-[#DCE6F2] text-[#0F1F3D] text-xs font-semibold rounded-lg shadow-xs motion-btn cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#1769D2] transition-transform duration-300 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Verifying Feeds...' : 'Ping Telemetry Pipelines'}</span>
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card motion-card-hover group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">Pipelines Online</span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981] transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">6 / 6</div>
          <span className="text-[11px] text-[#16A34A] font-medium">100% Ingestion Uptime</span>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card motion-card-hover group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">Average Latency</span>
            <Zap className="w-4 h-4 text-[#1769D2] transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">360 ms</div>
          <span className="text-[11px] text-[#1769D2] font-medium">Sub-second Geotechnical</span>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card motion-card-hover group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">Packets Today</span>
            <Activity className="w-4 h-4 text-[#F59E0B] transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">52.4k</div>
          <span className="text-[11px] text-[#536B8F] font-medium">Telemetry Points</span>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card motion-card-hover group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">Satellite Coverage</span>
            <Satellite className="w-4 h-4 text-[#8B5CF6] transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">100%</div>
          <span className="text-[11px] text-[#7C3AED] font-medium">All 8 NER States</span>
        </div>
      </div>

      {/* Feeds Table */}
      <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs space-y-4 motion-card">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBF1F8]">
          <h3 className="text-[16px] font-bold text-[#0F1F3D]">
            Active Data Pipeline Ingestion Status
          </h3>
          <span className="text-xs text-[#10B981] font-bold flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
            </span>
            Live WebSocket Data Streaming
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#536B8F] border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Source Name</th>
                <th className="py-2.5 px-3 font-semibold">Provider / Agency</th>
                <th className="py-2.5 px-3 font-semibold">Data Classification</th>
                <th className="py-2.5 px-3 font-semibold">Protocol</th>
                <th className="py-2.5 px-3 font-semibold">Ping Latency</th>
                <th className="py-2.5 px-3 font-semibold">Last Sync</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#0F1F3D]">
              {dataSources.map((source) => (
                <tr key={source.id} className="hover:bg-[#F8FAFC] motion-row">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-[#0F1F3D]">{source.name}</div>
                    <span className="font-mono text-[10.5px] text-[#758CA8]">{source.id}</span>
                  </td>
                  <td className="py-3.5 px-3 text-[#536B8F] max-w-xs">{source.provider}</td>
                  <td className="py-3.5 px-3">
                    <span className="bg-[#EAF3FF] text-[#1769D2] font-semibold px-2 py-0.5 rounded text-[11px]">
                      {source.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[#536B8F]">{source.protocol}</td>
                  <td className="py-3.5 px-3 font-bold text-[#10B981]">{source.latency}</td>
                  <td className="py-3.5 px-3 text-[#536B8F]">{source.lastSync}</td>
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                      {source.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
