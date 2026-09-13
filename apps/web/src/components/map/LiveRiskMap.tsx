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

export const LiveRiskMap: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [activeLayers, setActiveLayers] = useState<ActiveMapLayers>({
    landslideRisk: true,
    weather: true,
    roadNetwork: true,
    districtBoundary: true,
  });

  const [mapMode, setMapMode] = useState<'satellite' | 'terrain' | 'streets'>('satellite');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last 24 hours');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const baseMapRef = useRef<L.Map | null>(null);
  const { zones } = useZones();
  const availableDistricts = Array.from(new Set(zones.map((z) => z.district)));

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
    setSelectedDistrict(district);
    if (district === 'All Districts') {
      baseMapRef.current?.setView([25.75, 92.9], 7);
      return;
    }
    const targetZone = zones.find((z) => z.district === district);
    if (targetZone && baseMapRef.current) {
      baseMapRef.current.setView([targetZone.latitude, targetZone.longitude], 10);
    }
  };

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
