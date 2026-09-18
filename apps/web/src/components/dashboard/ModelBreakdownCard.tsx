'use client';

import React, { useState } from 'react';
import { Cpu, AlertCircle } from 'lucide-react';
import { useZones, useZonePrediction } from '../../hooks/useZones';
import { ModelBreakdownGrid } from './ModelBreakdownGrid';
import { ModelSatelliteMatrix } from './ModelSatelliteMatrix';

export const ModelBreakdownCard: React.FC = () => {
  const { zones } = useZones();
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    zones[0]?.zone_id || 'ZONE-EAST-KHASI-HILLS'
  );

  const activeZoneId = selectedZoneId || zones[0]?.zone_id || 'ZONE-EAST-KHASI-HILLS';
  const { data: prediction, isLoading, error, refetch } = useZonePrediction(activeZoneId);

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
            className="bg-[#131E35] border border-[#2A3B5C] text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
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
          <span>Inference service calculating or temporarily unavailable.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-1 px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Retry Inference
          </button>
        </div>
      ) : (
        <div className="space-y-4 pt-4">
          <ModelBreakdownGrid prediction={prediction} />
          <ModelSatelliteMatrix prediction={prediction} />
        </div>
      )}
    </div>
  );
};
