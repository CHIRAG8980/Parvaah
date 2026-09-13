'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import {
  Settings,
  Sliders,
  Bell,
  Radio,
  RefreshCw,
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers,
  Send,
} from 'lucide-react';

export default function SettingsPage() {
  // State for Thresholds
  const [rainfallWarning, setRainfallWarning] = useState<number>(55);
  const [rainfallCritical, setRainfallCritical] = useState<number>(115);
  const [insarVelocity, setInsarVelocity] = useState<number>(15);
  const [soilSaturation, setSoilSaturation] = useState<number>(78);
  const [seismicThreshold, setSeismicThreshold] = useState<number>(0.08);

  // State for Notification Channels
  const [channels, setChannels] = useState({
    ndmaCap: true,
    whatsappSdma: true,
    smsDisasterRelay: true,
    broRadioPush: true,
    sirenCivilDefense: false,
    emailBulletin: true,
  });

  // State for Ingestion Polling Rates
  const [awsPollRate, setAwsPollRate] = useState<string>('30s');
  const [insarSyncInterval, setInsarSyncInterval] = useState<string>('30m');
  const [inclinometerHeartbeat, setInclinometerHeartbeat] = useState<string>('1m');
  const [edgeFailover, setEdgeFailover] = useState<boolean>(true);

  // Feedback states
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [testAlertSent, setTestAlertSent] = useState<boolean>(false);

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3500);
    }, 600);
  };

  const handleReset = () => {
    setRainfallWarning(55);
    setRainfallCritical(115);
    setInsarVelocity(15);
    setSoilSaturation(78);
    setSeismicThreshold(0.08);
    setChannels({
      ndmaCap: true,
      whatsappSdma: true,
      smsDisasterRelay: true,
      broRadioPush: true,
      sirenCivilDefense: false,
      emailBulletin: true,
    });
    setAwsPollRate('30s');
    setInsarSyncInterval('30m');
    setInclinometerHeartbeat('1m');
    setEdgeFailover(true);
  };

  const triggerTestAlert = () => {
    setTestAlertSent(true);
    setTimeout(() => setTestAlertSent(false), 4000);
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#DCE6F2] shadow-xs motion-card">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1769D2] uppercase tracking-wider mb-1">
              <Settings className="w-3.5 h-3.5" />
              <span>System Administration & Protocol Configuration</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0F1F3D]">
              Early Warning & Protocol Settings
            </h1>
            <p className="text-xs sm:text-sm text-[#536B8F] mt-0.5">
              Tune AI trigger thresholds, multi-agency broadcast channels, and sensor telemetry sync parameters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-[#536B8F] bg-[#F4F8FC] border border-[#DCE6F2] hover:bg-[#EAF3FF] hover:text-[#0F1F3D] motion-btn cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Baseline
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#1769D2] hover:bg-[#1256B0] shadow-xs motion-btn cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved Successfully' : 'Apply Changes'}
            </button>
          </div>
        </div>

        {/* Save confirmation banner */}
        {saveStatus === 'saved' && (
          <div className="flex items-center justify-between p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-[#065F46] text-xs sm:text-sm motion-page-enter">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              <span className="font-semibold">Configuration updated across all NER state monitoring gateways.</span>
            </div>
            <span className="text-xs text-[#047857]">Sync verified</span>
          </div>
        )}

        {/* Test alert banner */}
        {testAlertSent && (
          <div className="flex items-center justify-between p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-[#1E40AF] text-xs sm:text-sm motion-page-enter">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-[#3B82F6]" />
              <span className="font-semibold">Simulated CAP warning packet transmitted to test sandbox relays.</span>
            </div>
            <span className="text-xs text-[#2563EB]">Latency: --</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLS: Thresholds & Ingestion */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Early Warning AI Risk Thresholds */}
            <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs motion-card">
              <div className="flex items-center justify-between pb-4 border-b border-[#EBF1F8] mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#EAF3FF] rounded-lg text-[#1769D2]">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0F1F3D]">
                      Geotechnical & Hydrological Thresholds
                    </h2>
                    <p className="text-xs text-[#536B8F]">
                      Sensory triggers for automated level-escalation and emergency alert issuance
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-[#F4F8FC] border border-[#DCE6F2] rounded-full text-[11px] font-bold text-[#536B8F]">
                  NDMA Baseline v4.2
                </span>
              </div>

              <div className="space-y-6">
                {/* 24h Rainfall Warning */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-[#0F1F3D]">
                      24-Hour Rainfall Warning Level
                    </span>
                    <span className="font-mono font-bold text-[#1769D2] bg-[#EAF3FF] px-2.5 py-0.5 rounded-md">
                      {rainfallWarning} mm/24h
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={rainfallWarning}
                    onChange={(e) => setRainfallWarning(Number(e.target.value))}
                    className="w-full accent-[#1769D2] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#758CA8]">
                    <span>20 mm (Moderate)</span>
                    <span>Standard: 50–60 mm</span>
                    <span>100 mm (Severe)</span>
                  </div>
                </div>

                {/* 24h Rainfall Red Alert */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-[#0F1F3D]">
                      24-Hour Rainfall Red Alert (Evacuation Trigger)
                    </span>
                    <span className="font-mono font-bold text-[#EF4444] bg-[#FEF2F2] px-2.5 py-0.5 rounded-md">
                      {rainfallCritical} mm/24h
                    </span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="200"
                    value={rainfallCritical}
                    onChange={(e) => setRainfallCritical(Number(e.target.value))}
                    className="w-full accent-[#EF4444] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#758CA8]">
                    <span>80 mm (High)</span>
                    <span>Standard: 110–125 mm</span>
                    <span>200 mm (Extreme Torrential)</span>
                  </div>
                </div>

                {/* InSAR Deformation Velocity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-semibold text-[#0F1F3D]">
                        InSAR Slope Creep Velocity Trigger
                      </span>
                      <span className="block text-[11.5px] text-[#536B8F]">
                        Satellite interferometry line-of-sight displacement
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[#F59E0B] bg-[#FFFBEB] px-2.5 py-0.5 rounded-md">
                      -{insarVelocity.toFixed(1)} mm/yr
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="0.5"
                    value={insarVelocity}
                    onChange={(e) => setInsarVelocity(Number(e.target.value))}
                    className="w-full accent-[#F59E0B] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#758CA8]">
                    <span>-5 mm/yr (Nominal)</span>
                    <span>Standard: -15.0 mm/yr</span>
                    <span>-30 mm/yr (Rapid Collapse Risk)</span>
                  </div>
                </div>

                {/* Soil Saturation Index */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-semibold text-[#0F1F3D]">
                        Volumetric Soil Saturation Index (SSI)
                      </span>
                      <span className="block text-[11.5px] text-[#536B8F]">
                        Pore water pressure threshold before shear strength loss
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[#10B981] bg-[#ECFDF5] px-2.5 py-0.5 rounded-md">
                      {soilSaturation}% VWC
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={soilSaturation}
                    onChange={(e) => setSoilSaturation(Number(e.target.value))}
                    className="w-full accent-[#10B981] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#758CA8]">
                    <span>50%</span>
                    <span>Standard: 75–80%</span>
                    <span>95% (Liquefaction)</span>
                  </div>
                </div>

                {/* Micro-seismic Vane Shear */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-semibold text-[#0F1F3D]">
                        Micro-seismic Ground Acceleration Trigger
                      </span>
                      <span className="block text-[11.5px] text-[#536B8F]">
                        Peak ground acceleration detected by geophones
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[#6366F1] bg-[#EEF2FF] px-2.5 py-0.5 rounded-md">
                      {seismicThreshold.toFixed(2)} g
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.20"
                    step="0.01"
                    value={seismicThreshold}
                    onChange={(e) => setSeismicThreshold(Number(e.target.value))}
                    className="w-full accent-[#6366F1] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#758CA8]">
                    <span>0.02 g (Mild Tremor)</span>
                    <span>Standard: 0.07–0.08 g</span>
                    <span>0.20 g (Severe)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Ingestion & Telemetry Polling */}
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
                {/* AWS Poll */}
                <div className="p-3.5 rounded-lg border border-[#DCE6F2] bg-[#F8FAFC]">
                  <label className="block text-xs font-semibold text-[#0F1F3D] mb-1.5">
                    IMD / AWS Station Poll
                  </label>
                  <select
                    value={awsPollRate}
                    onChange={(e) => setAwsPollRate(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-[#CBD5E1] rounded-md px-2.5 py-2 text-[#0F1F3D] focus:outline-none focus:border-[#1769D2] motion-input cursor-pointer"
                  >
                    <option value="15s">Every 15 seconds (Real-time)</option>
                    <option value="30s">Every 30 seconds (Standard)</option>
                    <option value="60s">Every 60 seconds (Conserve)</option>
                  </select>
                  <span className="block text-[11px] text-[#758CA8] mt-1.5">
                    AWS station network
                  </span>
                </div>

                {/* InSAR Sync */}
                <div className="p-3.5 rounded-lg border border-[#DCE6F2] bg-[#F8FAFC]">
                  <label className="block text-xs font-semibold text-[#0F1F3D] mb-1.5">
                    Satellite InSAR Sync
                  </label>
                  <select
                    value={insarSyncInterval}
                    onChange={(e) => setInsarSyncInterval(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-[#CBD5E1] rounded-md px-2.5 py-2 text-[#0F1F3D] focus:outline-none focus:border-[#1769D2] motion-input cursor-pointer"
                  >
                    <option value="15m">Every 15 minutes</option>
                    <option value="30m">Every 30 minutes (Standard)</option>
                    <option value="1h">Every 1 hour</option>
                  </select>
                  <span className="block text-[11px] text-[#758CA8] mt-1.5">
                    Sentinel-1 & NISAR orbits
                  </span>
                </div>

                {/* Inclinometer */}
                <div className="p-3.5 rounded-lg border border-[#DCE6F2] bg-[#F8FAFC]">
                  <label className="block text-xs font-semibold text-[#0F1F3D] mb-1.5">
                    Inclinometer Heartbeat
                  </label>
                  <select
                    value={inclinometerHeartbeat}
                    onChange={(e) => setInclinometerHeartbeat(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-[#CBD5E1] rounded-md px-2.5 py-2 text-[#0F1F3D] focus:outline-none focus:border-[#1769D2] motion-input cursor-pointer"
                  >
                    <option value="30s">Every 30 seconds</option>
                    <option value="1m">Every 1 minute (Standard)</option>
                    <option value="5m">Every 5 minutes</option>
                  </select>
                  <span className="block text-[11px] text-[#758CA8] mt-1.5">
                    Borehole sensor network
                  </span>
                </div>
              </div>

              {/* Edge Failover Toggle */}
              <div className="mt-4 pt-4 border-t border-[#EBF1F8] flex items-center justify-between">
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-[#0F1F3D]">
                    Edge Gateway Offline Caching & Automatic Failover
                  </span>
                  <p className="text-xs text-[#536B8F]">
                    Retain up to 72 hours of telemetry locally at district EOCs during optical fiber severance
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
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-premium ${
                      edgeFailover ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COL: Notification Channels & Security */}
          <div className="space-y-6">
            {/* Notification Channels */}
            <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs motion-card">
              <div className="flex items-center justify-between pb-4 border-b border-[#EBF1F8] mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#EAF3FF] rounded-lg text-[#1769D2]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0F1F3D]">
                      Broadcast Channels
                    </h2>
                    <p className="text-xs text-[#536B8F]">
                      Multi-agency dispatch relays
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* NDMA CAP */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-[#DCE6F2] hover:bg-[#F8FAFC] motion-row">
                  <div className="flex items-center gap-3">
                    <Radio className="w-4 h-4 text-[#1769D2]" />
                    <div>
                      <span className="text-xs font-bold text-[#0F1F3D] block">
                        NDMA CAP Integrated Gateway
                      </span>
                      <span className="text-[11px] text-[#536B8F]">
                        Pan-India Emergency Alerting Protocol
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChannels({ ...channels, ndmaCap: !channels.ndmaCap })}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                      channels.ndmaCap ? 'bg-[#1769D2]' : 'bg-[#CBD5E1]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-premium ${
                        channels.ndmaCap ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* WhatsApp SDMA */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-[#DCE6F2] hover:bg-[#F8FAFC] motion-row">
                  <div className="flex items-center gap-3">
                    <Send className="w-4 h-4 text-[#10B981]" />
                    <div>
                      <span className="text-xs font-bold text-[#0F1F3D] block">
                        SDMA Officer WhatsApp Group
                      </span>
                      <span className="text-[11px] text-[#536B8F]">
                        Instant incident briefing to IAS/IPS
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChannels({ ...channels, whatsappSdma: !channels.whatsappSdma })}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                      channels.whatsappSdma ? 'bg-[#10B981]' : 'bg-[#CBD5E1]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-premium ${
                        channels.whatsappSdma ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* SMS Disaster Relay */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-[#DCE6F2] hover:bg-[#F8FAFC] motion-row">
                  <div className="flex items-center gap-3">
                    <Radio className="w-4 h-4 text-[#F59E0B]" />
                    <div>
                      <span className="text-xs font-bold text-[#0F1F3D] block">
                        Cell Broadcast Mass SMS
                      </span>
                      <span className="text-[11px] text-[#536B8F]">
                        Geo-fenced SMS to towers in affected radius
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChannels({ ...channels, smsDisasterRelay: !channels.smsDisasterRelay })}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                      channels.smsDisasterRelay ? 'bg-[#1769D2]' : 'bg-[#CBD5E1]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-premium ${
                        channels.smsDisasterRelay ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* BRO Push */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-[#DCE6F2] hover:bg-[#F8FAFC] motion-row">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-[#0F1F3D]" />
                    <div>
                      <span className="text-xs font-bold text-[#0F1F3D] block">
                        BRO Highway Clearance Dispatch
                      </span>
                      <span className="text-[11px] text-[#536B8F]">
                        Automatic tasking to Project Vartak/Brahmank
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChannels({ ...channels, broRadioPush: !channels.broRadioPush })}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                      channels.broRadioPush ? 'bg-[#1769D2]' : 'bg-[#CBD5E1]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-premium ${
                        channels.broRadioPush ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Civil Defense Siren */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-[#DCE6F2] hover:bg-[#F8FAFC] motion-row">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                    <div>
                      <span className="text-xs font-bold text-[#0F1F3D] block">
                        Physical Siren Relays (Urban)
                      </span>
                      <span className="text-[11px] text-[#536B8F]">
                        Requires two-factor DM confirmation
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChannels({ ...channels, sirenCivilDefense: !channels.sirenCivilDefense })}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                      channels.sirenCivilDefense ? 'bg-[#EF4444]' : 'bg-[#CBD5E1]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-premium ${
                        channels.sirenCivilDefense ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Broadcast Test Simulation Button */}
              <div className="mt-5 pt-4 border-t border-[#EBF1F8]">
                <button
                  type="button"
                  onClick={triggerTestAlert}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#F4F8FC] border border-[#CBD5E1] text-[#0F1F3D] rounded-lg text-xs font-bold hover:bg-[#EAF3FF] hover:border-[#1769D2] hover:text-[#1769D2] motion-btn cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[#1769D2]" />
                  Simulate Sandbox Warning Broadcast
                </button>
                <span className="block text-[11px] text-[#758CA8] text-center mt-1.5">
                  Sends diagnostic sandbox payload without triggering live emergency sirens
                </span>
              </div>
            </div>

            {/* Regional Data Exchange Endpoints */}
            <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs motion-card">
              <div className="flex items-center gap-2 pb-3 border-b border-[#EBF1F8] mb-4">
                <Layers className="w-4 h-4 text-[#1769D2]" />
                <h3 className="text-sm font-bold text-[#0F1F3D]">
                  Inter-Agency Exchange Feeds
                </h3>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#536B8F]">GSI Geo-database</span>
                  <span className="font-mono text-[#10B981] font-semibold">Active (TLS 1.3)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#536B8F]">NESAC ISRO Portal</span>
                  <span className="font-mono text-[#10B981] font-semibold">Synced (5m ago)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#536B8F]">IMD Doppler Radars</span>
                  <span className="font-mono text-[#10B981] font-semibold">Online (Guwahati/Sohra)</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#536B8F]">CWC River Gauges</span>
                  <span className="font-mono text-[#10B981] font-semibold">Telemetry Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
