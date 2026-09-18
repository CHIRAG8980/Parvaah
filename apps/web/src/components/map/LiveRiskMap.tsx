'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { MapHeaderControls } from './MapHeaderControls';
import { MapFloatingControls } from './MapFloatingControls';
import { MapLayerChecklist, ActiveMapLayers } from './MapLayerChecklist';
import { MapLegendCard } from './MapLegendCard';
import { useZones } from '../../hooks/useZones';
import { useAuth } from '../../hooks/useAuth';
import { ZoneSummaryResponse } from '../../lib/api/types';

const MapInner = dynamic(() => import('./MapInner').then((mod) => mod.MapInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] sm:h-[500px] bg-[#0A172E] flex flex-col items-center justify-center text-slate-300 rounded-b-xl gap-3">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs tracking-wider uppercase font-semibold text-slate-400">
        Loading High-Resolution Satellite GIS Layer...
      </span>
    </div>
  ),
});

interface LiveRiskMapProps {
  filteredZones?: ZoneSummaryResponse[];
  selectedState?: string;
  selectedRisk?: string;
  selectedDistrict?: string;
  onSelectDistrict?: (district: string) => void;
}

export const LiveRiskMap: React.FC<LiveRiskMapProps> = ({
  filteredZones,
  selectedDistrict: controlledDistrict,
  onSelectDistrict: controlledOnSelectDistrict,
}) => {
  const [mounted, setMounted] = useState(false);
  const { assignedDistrict, isScopedToDistrict } = useAuth();

  const [activeLayers, setActiveLayers] = useState<ActiveMapLayers>({
    landslideRisk: true,
    weather: true,
    roadNetwork: true,
    districtBoundary: true,
  });

  const [mapMode, setMapMode] = useState<'satellite' | 'terrain' | 'streets'>('satellite');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last 24 hours');
  const [internalDistrict, setInternalDistrict] = useState('All Districts');

  // If officer is district-scoped (DMO), lock selectedDistrict to their assigned district
  const selectedDistrict = isScopedToDistrict && assignedDistrict
    ? assignedDistrict
    : controlledDistrict !== undefined
      ? controlledDistrict
      : internalDistrict;

  const [isFullscreen, setIsFullscreen] = useState(false);

  const baseMapRef = useRef<L.Map | null>(null);
  const { zones: allZones } = useZones();
  const zonesToDisplay = filteredZones || allZones;
  const availableDistricts = Array.from(new Set(allZones.map((z) => z.district)));

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLayer = (layerKey: keyof ActiveMapLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleNextMapMode = () => {
    setMapMode((prev) => (prev === 'satellite' ? 'terrain' : prev === 'terrain' ? 'streets' : 'satellite'));
  };

  const handleSelectDistrict = (district: string) => {
    if (controlledOnSelectDistrict) {
      controlledOnSelectDistrict(district);
    } else {
      setInternalDistrict(district);
    }
    if (district === 'All Districts') {
      baseMapRef.current?.setView([25.75, 92.9], 7);
      return;
    }
    const targetZone = allZones.find((z) => z.district.toLowerCase() === district.toLowerCase());
    if (targetZone && baseMapRef.current) {
      baseMapRef.current.setView([targetZone.latitude, targetZone.longitude], 10);
    }
  };

  // Keep map viewport in sync if selectedDistrict changes (or when DMO assignedDistrict loads)
  useEffect(() => {
    if (!baseMapRef.current || !allZones.length) return;

    if (selectedDistrict === 'All Districts') {
      baseMapRef.current.setView([25.75, 92.9], 7);
    } else {
      const targetZone = allZones.find((z) => z.district.toLowerCase() === selectedDistrict.toLowerCase());
      if (targetZone) {
        baseMapRef.current.setView([targetZone.latitude, targetZone.longitude], 10);
      }
    }
  }, [selectedDistrict, allZones]);

  const handleZoomIn = () => baseMapRef.current?.zoomIn();
  const handleZoomOut = () => baseMapRef.current?.zoomOut();
  const handleResetCenter = () => baseMapRef.current?.setView([25.75, 92.9], 7);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    document.body.style.overflow = !isFullscreen ? 'hidden' : '';
  };

  const mapContent = (inFullscreen: boolean) => (
    <>
      <MapHeaderControls
        inFullscreen={inFullscreen}
        activeLayers={activeLayers}
        onToggleLayer={toggleLayer}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={handleSelectDistrict}
        selectedTimeRange={selectedTimeRange}
        onSelectTimeRange={setSelectedTimeRange}
        onToggleFullscreen={toggleFullscreen}
        availableDistricts={availableDistricts}
        isDistrictLocked={isScopedToDistrict}
      />
      <div className={`relative z-0 w-full overflow-hidden ${inFullscreen ? 'flex-1 h-full min-h-0' : 'rounded-b-xl'}`}>
        <MapInner
          activeLayers={activeLayers}
          mapMode={mapMode}
          onToggleMapMode={handleNextMapMode}
          onMapReady={(map) => {
            baseMapRef.current = map;
          }}
          isFullscreen={inFullscreen}
          filteredZones={zonesToDisplay}
          selectedDistrict={selectedDistrict}
        />
        <MapFloatingControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetCenter={handleResetCenter}
          onToggleMapMode={handleNextMapMode}
          mapMode={mapMode}
        />
        <MapLayerChecklist activeLayers={activeLayers} onToggleLayer={toggleLayer} />
        <MapLegendCard />
      </div>
    </>
  );

  return (
    <>
      <div className="bg-white shadow-xs flex flex-col relative isolate z-0 rounded-xl border border-[#DCE6F2]">
        {mapContent(false)}
      </div>

      {mounted && isFullscreen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex flex-col bg-white text-[#0F1F3D] overflow-hidden select-none"
          style={{ width: '100vw', height: '100vh', zIndex: 9999999 }}
        >
          {mapContent(true)}
        </div>,
        document.body
      )}
    </>
  );
};
