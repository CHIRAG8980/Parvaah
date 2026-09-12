'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import {
  Layers,
  ChevronDown,
  Maximize2,
  Minimize2,
  X,
  Plus,
  Minus,
  Crosshair,
  Check,
} from 'lucide-react';

// Dynamic import with SSR disabled for Leaflet map
const MapInner = dynamic(
  () => import('./MapInner').then((mod) => mod.MapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[460px] sm:h-[500px] bg-[#0A172E] flex flex-col items-center justify-center text-slate-300 rounded-b-xl gap-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs tracking-wider uppercase font-semibold text-slate-400">
          Loading High-Resolution Satellite GIS Layer...
        </span>
      </div>
    ),
  }
);

const districtCoords: Record<string, [number, number]> = {
  'All Districts': [25.75, 92.9],
  'Kameng (Arunachal)': [27.2645, 92.4159],
  'East Khasi Hills (Meghalaya)': [25.5788, 91.8933],
  'Dima Hasao (Assam)': [25.1762, 93.0234],
  'Ukhrul (Manipur)': [25.1167, 94.3667],
  'Aizawl (Mizoram)': [23.7271, 92.7176],
  'Kohima (Nagaland)': [25.6701, 94.1077],
};

export const LiveRiskMap: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    landslideRisk: true,
    weather: true,
    roadNetwork: true,
    districtBoundary: true,
  });

  const [mapMode, setMapMode] = useState<'satellite' | 'terrain' | 'streets'>('satellite');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last 24 hours');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [showDistrictsDropdown, setShowDistrictsDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenHint, setShowFullscreenHint] = useState(false);
  const [fullscreenCoords, setFullscreenCoords] = useState<{ center: [number, number]; zoom: number }>({
    center: [25.75, 92.9],
    zoom: 7,
  });

  const baseMapRef = useRef<any>(null);
  const fullscreenMapRef = useRef<any>(null);
  const scrollPosRef = useRef<number>(0);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  const handleNextMapMode = () => {
    if (mapMode === 'satellite') setMapMode('terrain');
    else if (mapMode === 'terrain') setMapMode('streets');
    else setMapMode('satellite');
  };

  const handleSelectDistrict = (d: string) => {
    setSelectedDistrict(d);
    setShowDistrictsDropdown(false);
    const coords = districtCoords[d];
    if (coords) {
      const targetMap = isFullscreen ? fullscreenMapRef.current : baseMapRef.current;
      if (targetMap && typeof targetMap.setView === 'function') {
        targetMap.setView(coords, d === 'All Districts' ? 7 : 10);
      }
    }
  };

  const handleZoomIn = () => {
    const map = isFullscreen ? fullscreenMapRef.current : baseMapRef.current;
    if (map && typeof map.zoomIn === 'function') {
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    const map = isFullscreen ? fullscreenMapRef.current : baseMapRef.current;
    if (map && typeof map.zoomOut === 'function') {
      map.zoomOut();
    }
  };

  const handleResetCenter = () => {
    const map = isFullscreen ? fullscreenMapRef.current : baseMapRef.current;
    if (map && typeof map.setView === 'function') {
      map.setView([25.75, 92.9], 7);
    }
  };

  const enterFullscreen = () => {
    scrollPosRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    if (baseMapRef.current && typeof baseMapRef.current.getCenter === 'function') {
      try {
        const c = baseMapRef.current.getCenter();
        const z = baseMapRef.current.getZoom();
        setFullscreenCoords({ center: [c.lat, c.lng], zoom: z });
      } catch {}
    }

    setIsFullscreen(true);
    setShowFullscreenHint(true);
    document.body.style.overflow = 'hidden';

    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = setTimeout(() => {
      setShowFullscreenHint(false);
    }, 3500);
  };

  const exitFullscreen = () => {
    if (fullscreenMapRef.current && baseMapRef.current && typeof fullscreenMapRef.current.getCenter === 'function') {
      try {
        const c = fullscreenMapRef.current.getCenter();
        const z = fullscreenMapRef.current.getZoom();
        baseMapRef.current.setView([c.lat, c.lng], z);
      } catch {}
    }

    setIsFullscreen(false);
    setShowFullscreenHint(false);
    document.body.style.overflow = '';
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);

    setTimeout(() => {
      baseMapRef.current?.invalidateSize();
      window.scrollTo({
        top: scrollPosRef.current,
        behavior: 'instant',
      });
    }, 50);

    setTimeout(() => {
      baseMapRef.current?.invalidateSize();
      window.scrollTo({
        top: scrollPosRef.current,
        behavior: 'instant',
      });
    }, 200);
  };

  // Keyboard shortcut listener for Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        exitFullscreen();
      }
    };

    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  // Shared Dropdowns and Controls Header Component
  const renderHeader = (inFullscreen: boolean) => (
    <div className={`px-5 py-3.5 border-b border-[#DCE6F2] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white relative z-30 ${inFullscreen ? 'rounded-none flex-shrink-0' : 'rounded-t-xl'}`}>
      <div>
        <h2 className="text-[17px] font-bold text-[#0F1F3D] leading-tight">
          Live Risk Map
        </h2>
        <p className="text-[12px] text-[#536B8F] mt-0.5">
          Landslide risk, weather and infrastructure status across North East Region
        </p>
      </div>

      {/* Header Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Layers Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowLayersDropdown(!showLayersDropdown);
              setShowDistrictsDropdown(false);
              setShowTimeDropdown(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F1F3D] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#DCE6F2] rounded-lg transition-all duration-150 ease-premium motion-btn cursor-pointer"
          >
            <span>Layers</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#536B8F] motion-rotate-180 ${showLayersDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showLayersDropdown && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#DCE6F2] rounded-xl shadow-2xl py-1.5 z-50 text-xs motion-dropdown motion-dropdown-right">
              <button
                type="button"
                onClick={() => toggleLayer('landslideRisk')}
                className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#F4F8FC] text-[#0F1F3D] transition-colors duration-150"
              >
                <span>Landslide Risk</span>
                {activeLayers.landslideRisk && <Check className="w-3.5 h-3.5 text-[#1769D2]" />}
              </button>
              <button
                type="button"
                onClick={() => toggleLayer('weather')}
                className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#F4F8FC] text-[#0F1F3D] transition-colors duration-150"
              >
                <span>Weather (Rainfall)</span>
                {activeLayers.weather && <Check className="w-3.5 h-3.5 text-[#1769D2]" />}
              </button>
              <button
                type="button"
                onClick={() => toggleLayer('roadNetwork')}
                className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#F4F8FC] text-[#0F1F3D] transition-colors duration-150"
              >
                <span>Road Network</span>
                {activeLayers.roadNetwork && <Check className="w-3.5 h-3.5 text-[#1769D2]" />}
              </button>
              <button
                type="button"
                onClick={() => toggleLayer('districtBoundary')}
                className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#F4F8FC] text-[#0F1F3D] transition-colors duration-150"
              >
                <span>District Boundary</span>
                {activeLayers.districtBoundary && <Check className="w-3.5 h-3.5 text-[#1769D2]" />}
              </button>
            </div>
          )}
        </div>

        {/* Districts Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowDistrictsDropdown(!showDistrictsDropdown);
              setShowLayersDropdown(false);
              setShowTimeDropdown(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F1F3D] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#DCE6F2] rounded-lg transition-all duration-150 ease-premium motion-btn cursor-pointer"
          >
            <span>{selectedDistrict}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#536B8F] motion-rotate-180 ${showDistrictsDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDistrictsDropdown && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#DCE6F2] rounded-xl shadow-2xl py-1 z-50 text-xs motion-dropdown motion-dropdown-right max-h-60 overflow-y-auto">
              {Object.keys(districtCoords).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectDistrict(d)}
                  className={`w-full px-3 py-1.5 text-left transition-colors duration-150 ${
                    selectedDistrict === d ? 'text-[#1769D2] font-semibold bg-[#EAF3FF]' : 'text-[#0F1F3D] hover:bg-[#F4F8FC]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time Range Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowTimeDropdown(!showTimeDropdown);
              setShowDistrictsDropdown(false);
              setShowLayersDropdown(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F1F3D] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#DCE6F2] rounded-lg transition-all duration-150 ease-premium motion-btn cursor-pointer"
          >
            <span>{selectedTimeRange}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#536B8F] motion-rotate-180 ${showTimeDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showTimeDropdown && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white border border-[#DCE6F2] rounded-xl shadow-2xl py-1 z-50 text-xs motion-dropdown motion-dropdown-right">
              {['Last 6 hours', 'Last 12 hours', 'Last 24 hours', 'Last 48 hours', 'Last 7 days'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedTimeRange(t);
                    setShowTimeDropdown(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left transition-colors duration-150 ${
                    selectedTimeRange === t ? 'text-[#1769D2] font-semibold bg-[#EAF3FF]' : 'text-[#0F1F3D] hover:bg-[#F4F8FC]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen / Minimize Button */}
        <button
          type="button"
          onClick={inFullscreen ? exitFullscreen : enterFullscreen}
          className={`p-1.5 border rounded-lg transition-all duration-150 ease-premium motion-btn cursor-pointer ${
            inFullscreen
              ? 'text-[#1769D2] bg-[#EAF3FF] border-[#BFDBFE] hover:bg-[#DBEAFE]'
              : 'text-[#536B8F] hover:text-[#0F1F3D] hover:bg-[#F1F5F9] border-[#DCE6F2]'
          }`}
          aria-label={inFullscreen ? "Exit full screen" : "Maximize map"}
          title={inFullscreen ? "Exit Full Screen (Esc)" : "Full Screen"}
        >
          {inFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  // Floating Controls (Zoom in/out, center, basemap)
  const renderFloatingControls = () => (
    <div className="absolute top-4 left-4 z-[400] flex flex-col gap-1.5 pointer-events-auto">
      <div className="flex flex-col bg-white/95 backdrop-blur-xs border border-[#DCE6F2] rounded-lg shadow-md overflow-hidden">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center text-[#0F1F3D] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] border-b border-[#E2E8F0] font-bold cursor-pointer transition-colors duration-150 motion-btn"
          aria-label="Zoom in"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center text-[#0F1F3D] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] font-bold cursor-pointer transition-colors duration-150 motion-btn"
          aria-label="Zoom out"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={handleResetCenter}
        className="w-8 h-8 bg-white/95 backdrop-blur-xs border border-[#DCE6F2] rounded-lg shadow-md flex items-center justify-center text-[#536B8F] hover:text-[#0F1F3D] hover:bg-[#F1F5F9] cursor-pointer transition-all duration-150 motion-btn"
        title="Reset North East Center"
        aria-label="Center view"
      >
        <Crosshair className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleNextMapMode}
        className="w-8 h-8 bg-white/95 backdrop-blur-xs border border-[#DCE6F2] rounded-lg shadow-md flex items-center justify-center text-[#536B8F] hover:text-[#0F1F3D] hover:bg-[#F1F5F9] transition-all duration-150 motion-btn"
        title={`Current Basemap: ${mapMode.toUpperCase()}`}
        aria-label="Toggle basemap"
      >
        <Layers className="w-4 h-4" />
      </button>
    </div>
  );

  // Floating Layers Checklist Card
  const renderLayerChecklist = () => (
    <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-xs border border-[#DCE6F2] rounded-lg shadow-md p-3 w-48 text-[12px] pointer-events-auto">
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer select-none text-[#0F1F3D] font-medium hover:text-[#1769D2]">
          <input
            type="checkbox"
            checked={activeLayers.landslideRisk}
            onChange={() => toggleLayer('landslideRisk')}
            className="w-3.5 h-3.5 text-[#1769D2] rounded border-[#CBD5E1] focus:ring-0 focus:ring-offset-0"
          />
          <span>Landslide Risk</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none text-[#0F1F3D] font-medium hover:text-[#1769D2]">
          <input
            type="checkbox"
            checked={activeLayers.weather}
            onChange={() => toggleLayer('weather')}
            className="w-3.5 h-3.5 text-[#1769D2] rounded border-[#CBD5E1] focus:ring-0 focus:ring-offset-0"
          />
          <span>Weather (Rainfall)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none text-[#0F1F3D] font-medium hover:text-[#1769D2]">
          <input
            type="checkbox"
            checked={activeLayers.roadNetwork}
            onChange={() => toggleLayer('roadNetwork')}
            className="w-3.5 h-3.5 text-[#1769D2] rounded border-[#CBD5E1] focus:ring-0 focus:ring-offset-0"
          />
          <span>Road Network</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none text-[#0F1F3D] font-medium hover:text-[#1769D2]">
          <input
            type="checkbox"
            checked={activeLayers.districtBoundary}
            onChange={() => toggleLayer('districtBoundary')}
            className="w-3.5 h-3.5 text-[#1769D2] rounded border-[#CBD5E1] focus:ring-0 focus:ring-offset-0"
          />
          <span>District Boundary</span>
        </label>
      </div>
    </div>
  );

  // Floating Legend Card
  const renderLegend = () => (
    <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-xs border border-[#DCE6F2] rounded-lg shadow-md p-3 text-[11.5px] pointer-events-auto">
      <div className="font-bold text-[#0F1F3D] mb-1.5 text-[12px]">
        Landslide Risk Level
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[#334155]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] flex-shrink-0" />
          <span>Low (0 - 30)</span>
        </div>
        <div className="flex items-center gap-2 text-[#334155]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] flex-shrink-0" />
          <span>Medium (31 - 60)</span>
        </div>
        <div className="flex items-center gap-2 text-[#334155]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] flex-shrink-0" />
          <span>High (61 - 80)</span>
        </div>
        <div className="flex items-center gap-2 text-[#334155]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] flex-shrink-0" />
          <span>Critical (81 - 100)</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Normal Dashboard Card (Always active in dashboard layout) */}
      <div className="bg-white shadow-xs flex flex-col relative isolate z-0 rounded-xl border border-[#DCE6F2]">
        {renderHeader(false)}

        {/* Map Body with Floating Overlays */}
        <div className="relative z-0 w-full overflow-hidden rounded-b-xl">
          <MapInner
            activeLayers={activeLayers}
            mapMode={mapMode}
            onToggleMapMode={handleNextMapMode}
            onMapReady={(map) => {
              baseMapRef.current = map;
            }}
            isFullscreen={false}
            initialCenter={fullscreenCoords.center}
            initialZoom={fullscreenCoords.zoom}
          />

          {renderFloatingControls()}
          {renderLayerChecklist()}
          {renderLegend()}
        </div>
      </div>

      {/* 2. Full Screen Overlay Portal (Mounted to document.body, covering 100% of the screen) */}
      {mounted && isFullscreen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex flex-col bg-white text-[#0F1F3D] overflow-hidden select-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999999,
          }}
        >
          {/* In-app Temporary Exit Notification Banner */}
          {showFullscreenHint && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[10000000] px-4 py-2 bg-[#0F2346]/95 backdrop-blur-md text-white text-xs font-medium rounded-full shadow-2xl border border-white/20 flex items-center gap-2.5 motion-dropdown pointer-events-auto">
              <span className="flex items-center gap-1.5">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 text-[11px] font-bold bg-white/20 border border-white/30 rounded text-white font-mono shadow-2xs">
                  Esc
                </kbd>
                <span>button to exit full screen</span>
              </span>
              <button
                type="button"
                onClick={() => setShowFullscreenHint(false)}
                className="text-white/70 hover:text-white p-0.5 ml-1 transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {renderHeader(true)}

          {/* Full Screen Map Body - 100% height and width */}
          <div className="relative z-0 w-full flex-1 h-full min-h-0 overflow-hidden">
            <MapInner
              activeLayers={activeLayers}
              mapMode={mapMode}
              onToggleMapMode={handleNextMapMode}
              onMapReady={(map) => {
                fullscreenMapRef.current = map;
                setTimeout(() => map.invalidateSize(), 50);
                setTimeout(() => map.invalidateSize(), 150);
                setTimeout(() => map.invalidateSize(), 300);
              }}
              isFullscreen={true}
              initialCenter={fullscreenCoords.center}
              initialZoom={fullscreenCoords.zoom}
            />

            {renderFloatingControls()}
            {renderLayerChecklist()}
            {renderLegend()}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
