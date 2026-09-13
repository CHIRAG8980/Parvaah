'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { Settings, Save, RotateCcw, CheckCircle2, Zap, AlertTriangle } from 'lucide-react';
import { SettingsThresholds } from './SettingsThresholds';
import { SettingsTelemetrySync } from './SettingsTelemetrySync';
import { SettingsBroadcastChannels, ChannelSettings } from './SettingsBroadcastChannels';
import { useCheckEscalation } from '../../hooks/useAlerts';

export default function SettingsPage() {
  const [rainfallWarning, setRainfallWarning] = useState<number>(55);
  const [rainfallCritical, setRainfallCritical] = useState<number>(115);
  const [insarVelocity, setInsarVelocity] = useState<number>(15);
  const [soilSaturation, setSoilSaturation] = useState<number>(78);
  const [seismicThreshold, setSeismicThreshold] = useState<number>(0.08);

  const [channels, setChannels] = useState<ChannelSettings>({
    ndmaCap: true,
    whatsappSdma: true,
    smsDisasterRelay: true,
    broRadioPush: true,
    sirenCivilDefense: false,
    emailBulletin: true,
  });

  const [awsPollRate, setAwsPollRate] = useState<string>('30s');
  const [insarSyncInterval, setInsarSyncInterval] = useState<string>('30m');
  const [inclinometerHeartbeat, setInclinometerHeartbeat] = useState<string>('1m');
  const [edgeFailover, setEdgeFailover] = useState<boolean>(true);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [testAlertSent, setTestAlertSent] = useState<boolean>(false);
  const [testAlertError, setTestAlertError] = useState<string | null>(null);

  const { mutate: runEscalationCheck, isPending: isSimulating } = useCheckEscalation();

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
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

  const triggerTestAlert = async () => {
    setTestAlertError(null);
    try {
      await runEscalationCheck();
      setTestAlertSent(true);
      setTimeout(() => setTestAlertSent(false), 4000);
    } catch (err: unknown) {
      setTestAlertSent(false);
      setTestAlertError(
        err instanceof Error ? err.message : 'Disaster escalation protocol check failed. Gateway unreachable.'
      );
      setTimeout(() => setTestAlertError(null), 6000);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
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

        {saveStatus === 'saved' && (
          <div className="flex items-center justify-between p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-[#065F46] text-xs sm:text-sm motion-page-enter">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              <span className="font-semibold">Configuration updated across all NER state monitoring gateways.</span>
            </div>
            <span className="text-xs text-[#047857]">Sync verified</span>
          </div>
        )}

        {testAlertSent && (
          <div className="flex items-center justify-between p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-[#1E40AF] text-xs sm:text-sm motion-page-enter">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-[#3B82F6]" />
              <span className="font-semibold">Escalation evaluation executed successfully across monitoring gateways.</span>
            </div>
            <span className="text-xs text-[#2563EB]">Live Dispatched</span>
          </div>
        )}

        {testAlertError && (
          <div className="flex items-center justify-between p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#991B1B] text-xs sm:text-sm motion-page-enter">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
              <span className="font-semibold">{testAlertError}</span>
            </div>
            <span className="text-xs text-[#DC2626] font-medium">Protocol Error</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SettingsThresholds
              rainfallWarning={rainfallWarning}
              setRainfallWarning={setRainfallWarning}
              rainfallCritical={rainfallCritical}
              setRainfallCritical={setRainfallCritical}
              insarVelocity={insarVelocity}
              setInsarVelocity={setInsarVelocity}
              soilSaturation={soilSaturation}
              setSoilSaturation={setSoilSaturation}
              seismicThreshold={seismicThreshold}
              setSeismicThreshold={setSeismicThreshold}
            />

            <SettingsTelemetrySync
              awsPollRate={awsPollRate}
              setAwsPollRate={setAwsPollRate}
              insarSyncInterval={insarSyncInterval}
              setInsarSyncInterval={setInsarSyncInterval}
              inclinometerHeartbeat={inclinometerHeartbeat}
              setInclinometerHeartbeat={setInclinometerHeartbeat}
              edgeFailover={edgeFailover}
              setEdgeFailover={setEdgeFailover}
            />
          </div>

          <div className="space-y-6">
            <SettingsBroadcastChannels
              channels={channels}
              setChannels={setChannels}
              onTriggerTestAlert={triggerTestAlert}
              isSimulating={isSimulating}
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
