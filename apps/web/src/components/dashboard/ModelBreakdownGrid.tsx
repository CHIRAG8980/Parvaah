'use client';

import React from 'react';
import { Layers, CloudRain, Clock, ShieldCheck } from 'lucide-react';
import type { UnifiedRiskPredictionResponse } from '../../lib/api/types';

interface ModelBreakdownGridProps {
  prediction: UnifiedRiskPredictionResponse;
}

export const ModelBreakdownGrid: React.FC<ModelBreakdownGridProps> = ({ prediction }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Model 1: Static Susceptibility */}
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
            {prediction.models?.static_susceptibility?.score !== null &&
            prediction.models?.static_susceptibility?.score !== undefined
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
          ISRO CartoDEM &amp; Bhuvan 1:50k
        </p>
      </div>

      {/* Model 2: Dynamic Hazard */}
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
            {prediction.models?.dynamic_hazard?.score !== null &&
            prediction.models?.dynamic_hazard?.score !== undefined
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

      {/* Model 3: Pre-Event Similarity */}
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
            {prediction.models?.lead_window?.similarity_score !== null &&
            prediction.models?.lead_window?.similarity_score !== undefined
              ? `${(prediction.models.lead_window.similarity_score * 100).toFixed(1)}%`
              : 'N/A'}
          </div>
          <div
            className="text-[11px] text-slate-400 font-medium truncate"
            title={prediction.historical_condition_window || prediction.time_to_failure_window || 'Baseline Non-Triggering'}
          >
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

      {/* Model 4: Fusion Model */}
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
  );
};
