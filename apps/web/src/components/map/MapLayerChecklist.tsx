'use client';

import React from 'react';

export interface ActiveMapLayers {
  landslideRisk: boolean;
  weather: boolean;
  roadNetwork: boolean;
  districtBoundary: boolean;
}

interface MapLayerChecklistProps {
  activeLayers: ActiveMapLayers;
  onToggleLayer: (key: keyof ActiveMapLayers) => void;
}

export const MapLayerChecklist: React.FC<MapLayerChecklistProps> = ({
  activeLayers,
  onToggleLayer,
}) => {
  return (
    <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-xs border border-[#DCE6F2] rounded-lg shadow-md p-3 w-48 text-[12px] pointer-events-auto">
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer select-none text-[#0F1F3D] font-medium hover:text-[#1769D2]">
          <input
            type="checkbox"
            checked={activeLayers.landslideRisk}
            onChange={() => onToggleLayer('landslideRisk')}
            className="w-3.5 h-3.5 text-[#1769D2] rounded border-[#CBD5E1] focus:ring-0 focus:ring-offset-0"
          />
          <span>Landslide Risk</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none text-[#0F1F3D] font-medium hover:text-[#1769D2]">
          <input
            type="checkbox"
            checked={activeLayers.weather}
            onChange={() => onToggleLayer('weather')}
            className="w-3.5 h-3.5 text-[#1769D2] rounded border-[#CBD5E1] focus:ring-0 focus:ring-offset-0"
          />
          <span>Landslide Heatmap</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none text-[#0F1F3D] font-medium hover:text-[#1769D2]">
          <input
            type="checkbox"
            checked={activeLayers.roadNetwork}
            onChange={() => onToggleLayer('roadNetwork')}
            className="w-3.5 h-3.5 text-[#1769D2] rounded border-[#CBD5E1] focus:ring-0 focus:ring-offset-0"
          />
          <span>Road Network</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none text-[#0F1F3D] font-medium hover:text-[#1769D2]">
          <input
            type="checkbox"
            checked={activeLayers.districtBoundary}
            onChange={() => onToggleLayer('districtBoundary')}
            className="w-3.5 h-3.5 text-[#1769D2] rounded border-[#CBD5E1] focus:ring-0 focus:ring-offset-0"
          />
          <span>District Boundary</span>
        </label>
      </div>
    </div>
  );
};
