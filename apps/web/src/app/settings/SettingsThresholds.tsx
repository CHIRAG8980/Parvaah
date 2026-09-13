'use client';

import React from 'react';
import { Sliders } from 'lucide-react';

interface SettingsThresholdsProps {
  rainfallWarning: number;
  setRainfallWarning: (v: number) => void;
  rainfallCritical: number;
  setRainfallCritical: (v: number) => void;
  insarVelocity: number;
  setInsarVelocity: (v: number) => void;
  soilSaturation: number;
  setSoilSaturation: (v: number) => void;
  seismicThreshold: number;
  setSeismicThreshold: (v: number) => void;
}

export const SettingsThresholds: React.FC<SettingsThresholdsProps> = ({
  rainfallWarning,
  setRainfallWarning,
  rainfallCritical,
  setRainfallCritical,
  insarVelocity,
  setInsarVelocity,
  soilSaturation,
  setSoilSaturation,
  seismicThreshold,
  setSeismicThreshold,
}) => {
  return (
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
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-[#0F1F3D]">24-Hour Rainfall Warning Level</span>
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
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-[#0F1F3D]">24-Hour Rainfall Red Alert Trigger</span>
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
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-[#0F1F3D]">InSAR Slope Creep Velocity Trigger</span>
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
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-[#0F1F3D]">Volumetric Soil Saturation Index</span>
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
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-[#0F1F3D]">Micro-seismic Ground Acceleration</span>
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
        </div>
      </div>
    </div>
  );
};
