'use client';

import React from 'react';
import { Plus, Minus, Crosshair, Layers } from 'lucide-react';

interface MapFloatingControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCenter: () => void;
  onToggleMapMode: () => void;
  mapMode: 'satellite' | 'terrain' | 'streets';
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetCenter,
  onToggleMapMode,
  mapMode,
}) => {
  return (
    <div className="absolute top-4 left-4 z-[400] flex flex-col gap-1.5 pointer-events-auto">
      <div className="flex flex-col bg-white/95 backdrop-blur-xs border border-[#DCE6F2] rounded-lg shadow-md overflow-hidden">
        <button
          type="button"
          onClick={onZoomIn}
          className="w-8 h-8 flex items-center justify-center text-[#0F1F3D] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] border-b border-[#E2E8F0] font-bold cursor-pointer transition-colors duration-150 motion-btn"
          aria-label="Zoom in"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className="w-8 h-8 flex items-center justify-center text-[#0F1F3D] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] font-bold cursor-pointer transition-colors duration-150 motion-btn"
          aria-label="Zoom out"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onResetCenter}
        className="w-8 h-8 bg-white/95 backdrop-blur-xs border border-[#DCE6F2] rounded-lg shadow-md flex items-center justify-center text-[#536B8F] hover:text-[#0F1F3D] hover:bg-[#F1F5F9] cursor-pointer transition-all duration-150 motion-btn"
        title="Reset North East Center"
        aria-label="Center view"
      >
        <Crosshair className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onToggleMapMode}
        className="w-8 h-8 bg-white/95 backdrop-blur-xs border border-[#DCE6F2] rounded-lg shadow-md flex items-center justify-center text-[#536B8F] hover:text-[#0F1F3D] hover:bg-[#F1F5F9] transition-all duration-150 motion-btn"
        title={`Current Basemap: ${mapMode.toUpperCase()}`}
        aria-label="Toggle basemap"
      >
        <Layers className="w-4 h-4" />
      </button>
    </div>
  );
};
