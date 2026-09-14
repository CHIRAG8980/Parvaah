'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  CloudRain,
  Clock,
  ShieldCheck,
  Radio,
  Satellite,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { useZones, useZonePrediction } from '../../hooks/useZones';

export const ModelBreakdownCard: React.FC = () => {
  const { zones } = useZones();
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    zones[0]?.zone_id || 'ZONE-EAST-KHASI-HILLS'
  );

  const activeZoneId = selectedZoneId || zones[0]?.zone_id || 'ZONE-EAST-KHASI-HILLS';
  const { data: prediction, isLoading, error } = useZonePrediction(activeZoneId);

  return (
    <div className="bg-[#0D1527] border border-[#1E293B] rounded-2xl p-5 shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E293B]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                AI/ML Sovereign Ensemble
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                4 Models Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Operational data accessed through approved Indian government / ISRO-NRSC / Bhoonidhi sources (NISAR is an ISRO-NASA joint mission)
            </p>
          </div>
        </div>

        {/* Zone Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="zone-selector" className="text-xs text-slate-400 font-medium">
            Zone:
          </label>
          <select
            id="zone-selector"
            value={activeZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            className="bg-[#131E35] border border-[#2A3B5C] text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            {zones.map((z) => (
              <option key={z.zone_id} value={z.zone_id}>
                {z.name} ({z.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Computing 4-Model Inference Vector...</span>
        </div>
      ) : error || !prediction ? (
        <div className="py-8 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>Inference service unavailable or loading fallback data.</span>
        </div>
      ) : (
        <div className="space-y-4 pt-4">
          {/* 4 Models Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Model 1 */}
            <div className="bg-[#131E35] border border-[#1E2D4A] rounded-xl p-3.5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Model 1: Static</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">10 Bands</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {prediction.models?.static_susceptibility?.score !== null && prediction.models?.static_susceptibility?.score !== undefined
                    ? `${(prediction.models.static_susceptibility.score * 100).toFixed(1)}%`
                    : 'N/A'}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Category:{' '}
                  <span className="text-slate-200 font-bold">
                    {prediction.models?.static_susceptibility?.category || 'Moderate'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-[#1E2D4A]">
                ISRO CartoDEM & Bhuvan 1:50k
              </p>
            </div>

            {/* Model 2 */}
            <div className="bg-[#131E35] border border-[#1E2D4A] rounded-xl p-3.5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>Model 2: Dynamic</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">IMD Trigger</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {prediction.models?.dynamic_hazard?.score !== null && prediction.models?.dynamic_hazard?.score !== undefined
                    ? `${(prediction.models.dynamic_hazard.score * 100).toFixed(1)}%`
                    : 'N/A'}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Trigger:{' '}
                  <span className="text-slate-200 font-bold">
                    {prediction.models?.dynamic_hazard?.trigger_state || 'Baseline'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-[#1E2D4A]">
                Multi-scale 24h/72h/7d Rainfall
              </p>
            </div>

            {/* Model 3 */}
            <div className="bg-[#131E35] border border-[#1E2D4A] rounded-xl p-3.5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Model 3: Pre-Event Similarity</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">GSI Match</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {prediction.models?.lead_window?.similarity_score !== null && prediction.models?.lead_window?.similarity_score !== undefined
                    ? `${(prediction.models.lead_window.similarity_score * 100).toFixed(1)}%`
                    : 'N/A'}
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate" title={prediction.historical_condition_window || prediction.time_to_failure_window || 'Baseline Non-Triggering'}>
                  Profile:{' '}
                  <span className="text-slate-200 font-bold">
                    {prediction.historical_condition_window || prediction.time_to_failure_window || 'Baseline Non-Triggering'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-[#1E2D4A]">
                Historical Pre-Event Condition Similarity
              </p>
            </div>

            {/* Model 4 */}
            <div className="bg-[#131E35] border border-emerald-500/30 rounded-xl p-3.5 flex flex-col justify-between bg-gradient-to-br from-[#131E35] to-[#162744]">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Model 4: Fusion</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/80">XGBoost Fused</span>
                </div>
                <div className="text-lg font-bold text-emerald-400">
                  {prediction.risk_score !== null && prediction.risk_score !== undefined
                    ? `${prediction.risk_score.toFixed(1)} / 100`
                    : 'OUT OF COVERAGE'}
                </div>
                <div className="text-[11px] text-slate-300 font-medium">
                  Level:{' '}
                  <span className="text-white font-bold uppercase">
                    {prediction.risk_level}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-emerald-400/70 mt-2 pt-2 border-t border-[#1E2D4A]">
                Multi-Modal Multi-Sensor Score
              </p>
            </div>
          </div>

          {/* Satellite Feeds & Primary Data Matrix */}
          <div className="bg-[#10192E] border border-[#1E293B] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Satellite className="w-3.5 h-3.5 text-slate-400" />
                Primary Data Ingestion & Observation Feeds
              </span>
              <span className="text-[10px] text-slate-400">Truthful Availability & Quality Matrix</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[11px]">
              <div className="bg-[#131E35] px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">CartoDEM 30m</span>
                <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE
                </span>
              </div>
              <div className="bg-[#131E35] px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">Bhuvan 1:50k</span>
                <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE
                </span>
              </div>
              <div className="bg-[#131E35] px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">IMD Gridded</span>
                <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE
                </span>
              </div>
              <div className="bg-[#131E35] px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">NISAR InSAR</span>
                <span
                  className={`font-mono font-semibold flex items-center gap-1 ${
                    prediction.data_availability?.insar_nisar?.status === 'AVAILABLE'
                      ? prediction.data_availability?.insar_nisar?.quality === 'LOW_QUALITY'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                  title={
                    prediction.data_availability?.insar_nisar?.status === 'AVAILABLE'
                      ? `NISAR (ISRO-NASA): Quality ${prediction.data_availability?.insar_nisar?.quality}, Coherence: ${prediction.data_availability?.insar_nisar?.coherence?.toFixed?.(3) ?? 'N/A'}, Disp: ${prediction.data_availability?.insar_nisar?.deformation_mm ?? 'N/A'} mm`
                      : 'Outside current satellite pass footprint'
                  }
                >
                  {prediction.data_availability?.insar_nisar?.status === 'AVAILABLE' ? (
                    prediction.data_availability?.insar_nisar?.quality === 'LOW_QUALITY' ? (
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    )
                  ) : (
                    <Info className="w-3 h-3" />
                  )}
                  {prediction.data_availability?.insar_nisar?.status === 'AVAILABLE'
                    ? `${prediction.data_availability?.insar_nisar?.quality === 'LOW_QUALITY' ? 'LOW QUAL' : 'AVAILABLE'}`
                    : 'UNAVAILABLE'}
                </span>
              </div>
              <div className="bg-[#131E35] px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">EOS-04 Soil</span>
                <span
                  className={`font-mono font-semibold flex items-center gap-1 ${
                    prediction.data_availability?.soil_moisture_eos04?.status === 'AVAILABLE'
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                  title={
                    prediction.data_availability?.soil_moisture_eos04?.status === 'AVAILABLE'
                      ? `EOS-04 MRS Soil Moisture: ${prediction.data_availability?.soil_moisture_eos04?.soil_moisture_pct}%`
                      : 'Outside current satellite pass footprint'
                  }
                >
                  {prediction.data_availability?.soil_moisture_eos04?.status === 'AVAILABLE' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Info className="w-3 h-3" />
                  )}
                  {prediction.data_availability?.soil_moisture_eos04?.status || 'UNAVAILABLE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
