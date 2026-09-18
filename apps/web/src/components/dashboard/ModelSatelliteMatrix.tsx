'use client';

import React from 'react';
import { Satellite, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import type { UnifiedRiskPredictionResponse } from '../../lib/api/types';

interface ModelSatelliteMatrixProps {
  prediction: UnifiedRiskPredictionResponse;
}

export const ModelSatelliteMatrix: React.FC<ModelSatelliteMatrixProps> = ({ prediction }) => {
  const isNisarAvail = prediction.data_availability?.insar_nisar?.status === 'AVAILABLE';
  const isNisarLowQual = prediction.data_availability?.insar_nisar?.quality === 'LOW_QUALITY';

  return (
    <div className="bg-[#10192E] border border-[#1E293B] rounded-xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Satellite className="w-3.5 h-3.5 text-slate-400" />
          Primary Data Ingestion &amp; Observation Feeds
        </span>
        <span className="text-[10px] text-slate-400">Truthful Availability &amp; Quality Matrix</span>
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
              isNisarAvail ? (isNisarLowQual ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-400'
            }`}
            title={
              isNisarAvail
                ? `NISAR (ISRO-NASA): Quality ${prediction.data_availability?.insar_nisar?.quality}, Disp: ${prediction.data_availability?.insar_nisar?.deformation_mm ?? 'N/A'} mm`
                : 'Outside current satellite pass footprint'
            }
          >
            {isNisarAvail ? (
              isNisarLowQual ? <AlertCircle className="w-3 h-3 text-amber-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <Info className="w-3 h-3" />
            )}
            {isNisarAvail ? (isNisarLowQual ? 'LOW QUAL' : 'AVAILABLE') : 'UNAVAILABLE'}
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
  );
};
