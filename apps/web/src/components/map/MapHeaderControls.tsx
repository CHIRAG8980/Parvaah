'use client';

import React, { useState } from 'react';
import { ChevronDown, Maximize2, Minimize2, Check } from 'lucide-react';
import { ActiveMapLayers } from './MapLayerChecklist';

interface MapHeaderControlsProps {
  inFullscreen: boolean;
  activeLayers: ActiveMapLayers;
  onToggleLayer: (key: keyof ActiveMapLayers) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  selectedTimeRange: string;
  onSelectTimeRange: (range: string) => void;
  onToggleFullscreen: () => void;
  availableDistricts: string[];
  isDistrictLocked?: boolean;
}

export const MapHeaderControls: React.FC<MapHeaderControlsProps> = ({
  inFullscreen,
  activeLayers,
  onToggleLayer,
  selectedDistrict,
  onSelectDistrict,
  selectedTimeRange,
  onSelectTimeRange,
  onToggleFullscreen,
  availableDistricts,
  isDistrictLocked = false,
}) => {
  const [showLayers, setShowLayers] = useState(false);
  const [showDistricts, setShowDistricts] = useState(false);
  const [showTime, setShowTime] = useState(false);

  return (
    <div
      className={`px-5 py-3.5 border-b border-[#DCE6F2] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white relative z-30 ${
        inFullscreen ? 'rounded-none flex-shrink-0' : 'rounded-t-xl'
      }`}
    >
      <div>
        <h2 className="text-[17px] font-bold text-[#0F1F3D] leading-tight">
          Live Risk Map
        </h2>
        <p className="text-[12px] text-[#536B8F] mt-0.5">
          Landslide risk, weather and infrastructure status across North East Region
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Layers Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowLayers(!showLayers);
              setShowDistricts(false);
              setShowTime(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F1F3D] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#DCE6F2] rounded-lg motion-btn cursor-pointer"
          >
            <span>Layers</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#536B8F] motion-rotate-180 ${showLayers ? 'rotate-180' : ''}`} />
          </button>

          {showLayers && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#DCE6F2] rounded-xl shadow-2xl py-1.5 z-50 text-xs motion-dropdown motion-dropdown-right">
              {(['landslideRisk', 'weather', 'roadNetwork', 'districtBoundary'] as const).map((key) => {
                const labelMap: Record<string, string> = {
                  landslideRisk: 'Landslide Risk Markers',
                  weather: 'Landslide Heatmap (GSI)',
                  roadNetwork: 'Highway Network',
                  districtBoundary: 'District Boundaries',
                };
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onToggleLayer(key)}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#F4F8FC] text-[#0F1F3D]"
                  >
                    <span>{labelMap[key] || key}</span>
                    {activeLayers[key] && <Check className="w-3.5 h-3.5 text-[#1769D2]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Districts Selector / Locked Jurisdiction Indicator */}
        {isDistrictLocked ? (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E40AF] bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg shadow-2xs select-none"
            title="Your account is assigned to this district jurisdiction"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span>{selectedDistrict}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6] bg-[#DBEAFE] px-1.5 py-0.5 rounded">
              Assigned
            </span>
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowDistricts(!showDistricts);
                setShowLayers(false);
                setShowTime(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F1F3D] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#DCE6F2] rounded-lg motion-btn cursor-pointer"
            >
              <span>{selectedDistrict}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#536B8F] motion-rotate-180 ${showDistricts ? 'rotate-180' : ''}`} />
            </button>

            {showDistricts && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#DCE6F2] rounded-xl shadow-2xl py-1 z-50 text-xs motion-dropdown motion-dropdown-right max-h-60 overflow-y-auto">
                {['All Districts', ...availableDistricts].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      onSelectDistrict(d);
                      setShowDistricts(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left ${
                      selectedDistrict === d ? 'text-[#1769D2] font-semibold bg-[#EAF3FF]' : 'text-[#0F1F3D] hover:bg-[#F4F8FC]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Time Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowTime(!showTime);
              setShowDistricts(false);
              setShowLayers(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F1F3D] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#DCE6F2] rounded-lg motion-btn cursor-pointer"
          >
            <span>{selectedTimeRange}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#536B8F] motion-rotate-180 ${showTime ? 'rotate-180' : ''}`} />
          </button>

          {showTime && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white border border-[#DCE6F2] rounded-xl shadow-2xl py-1 z-50 text-xs motion-dropdown motion-dropdown-right">
              {['Last 6 hours', 'Last 12 hours', 'Last 24 hours', 'Last 48 hours', 'Last 7 days'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    onSelectTimeRange(t);
                    setShowTime(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left ${
                    selectedTimeRange === t ? 'text-[#1769D2] font-semibold bg-[#EAF3FF]' : 'text-[#0F1F3D] hover:bg-[#F4F8FC]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className={`p-1.5 border rounded-lg motion-btn cursor-pointer ${
            inFullscreen
              ? 'text-[#1769D2] bg-[#EAF3FF] border-[#BFDBFE] hover:bg-[#DBEAFE]'
              : 'text-[#536B8F] hover:text-[#0F1F3D] hover:bg-[#F1F5F9] border-[#DCE6F2]'
          }`}
          aria-label={inFullscreen ? 'Exit full screen' : 'Maximize map'}
        >
          {inFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
