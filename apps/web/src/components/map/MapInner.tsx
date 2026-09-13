'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface MapInnerProps {
  activeLayers: {
    landslideRisk: boolean;
    weather: boolean;
    roadNetwork: boolean;
    districtBoundary: boolean;
  };
  mapMode: 'satellite' | 'terrain' | 'streets';
  onToggleMapMode: () => void;
  onMapReady?: (map: L.Map) => void;
  isFullscreen?: boolean;
  initialCenter?: [number, number];
  initialZoom?: number;
}

interface RiskLocation {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  rainfall24h: number;
  soilMoisture: number;
  slope: number;
  status: string;
}

const locations: RiskLocation[] = [];

const roadCorridors: { name: string; status: string; points: [number, number][] }[] = [];

export const MapInner: React.FC<MapInnerProps> = ({
  activeLayers,
  mapMode,
  onToggleMapMode,
  onMapReady,
  isFullscreen = false,
  initialCenter,
  initialZoom,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const roadsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const weatherLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const onMapReadyRef = useRef(onMapReady);
  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  // Helper to cleanly swap basemap tile layers
  const updateTiles = (map: L.Map, mode: 'satellite' | 'terrain' | 'streets') => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (labelLayerRef.current) {
      map.removeLayer(labelLayerRef.current);
      labelLayerRef.current = null;
    }

    if (mode === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);

      labelLayerRef.current = L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);
    } else if (mode === 'terrain') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19 }
      ).addTo(map);
    }
  };

  // Initialize Map - ONCE on mount (empty dependency array prevents destruction)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered on North East India or passed initial coordinates
    const map = L.map(mapContainerRef.current, {
      center: initialCenter || [25.75, 92.9],
      zoom: initialZoom || 7,
      zoomControl: false,
      attributionControl: false,
      minZoom: 6,
      maxZoom: 14,
    });

    mapInstanceRef.current = map;

    if (typeof window !== 'undefined') {
      (window as unknown as { _leafletMap?: L.Map })._leafletMap = map;
    }
    if (onMapReadyRef.current) {
      onMapReadyRef.current(map);
    }

    // Layer Groups
    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    roadsLayerGroupRef.current = L.layerGroup().addTo(map);
    weatherLayerGroupRef.current = L.layerGroup().addTo(map);
    boundaryLayerGroupRef.current = L.layerGroup().addTo(map);

    // Initial tile layer setup
    updateTiles(map, mapMode);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      if (typeof window !== 'undefined') {
        delete (window as unknown as { _leafletMap?: L.Map })._leafletMap;
      }
    };
  }, []);

  // Update Basemap Tiles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    if (labelLayerRef.current) {
      map.removeLayer(labelLayerRef.current);
    }

    if (mapMode === 'satellite') {
      // Real high-res Esri World Imagery Satellite
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);

      // CartoDB / Esri high-contrast reference labels for places & borders
      labelLayerRef.current = L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);
    } else if (mapMode === 'terrain') {
      // OpenTopoMap / World Topo Map
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);
    } else {
      // Clean CartoDB Positron / OSM
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19 }
      ).addTo(map);
    }
  }, [mapMode]);

  // Update Markers
  useEffect(() => {
    const layerGroup = markersLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    if (!activeLayers.landslideRisk) return;

    locations.forEach((loc) => {
      let pinColor = '#10B981';
      let pinBg = '#ECFDF5';
      let pulseClass = '';
      let badgeLabel = 'LOW';

      if (loc.level === 'CRITICAL') {
        pinColor = '#EF4444';
        pinBg = '#FEF2F2';
        pulseClass = 'marker-pulse-critical';
        badgeLabel = 'CRITICAL';
      } else if (loc.level === 'HIGH') {
        pinColor = '#F97316';
        pinBg = '#FFF7ED';
        pulseClass = 'marker-pulse-high';
        badgeLabel = 'HIGH';
      } else if (loc.level === 'MEDIUM') {
        pinColor = '#F59E0B';
        pinBg = '#FFFBEB';
        badgeLabel = 'MEDIUM';
      }

      // Professional icon symbol matching reference image
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white ${pulseClass}" style="background-color: ${pinColor}">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <!-- Hover label preview -->
          <div class="absolute -top-7 whitespace-nowrap px-2 py-0.5 rounded text-[11px] font-bold bg-[#0F2346] text-white shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            ${loc.name} (${loc.score})
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-map-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const popupHtml = `
        <div style="min-width: 220px; font-family: Inter, system-ui, sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 8px;">
            <div>
              <h4 style="font-size: 14px; font-weight: 700; color: #0F1F3D; margin: 0;">${loc.name}</h4>
              <span style="font-size: 11px; color: #536B8F;">${loc.state}</span>
            </div>
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; background: ${pinBg}; color: ${pinColor}; border: 1px solid ${pinColor};">
              ${badgeLabel} (${loc.score})
            </span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; text-align: center;">
            <div style="background: #F8FAFC; padding: 4px; border-radius: 6px; border: 1px solid #E2E8F0;">
              <span style="font-size: 10px; color: #64748B; display: block;">24h Rain</span>
              <strong style="font-size: 12px; color: #0F1F3D;">${loc.rainfall24h} mm</strong>
            </div>
            <div style="background: #F8FAFC; padding: 4px; border-radius: 6px; border: 1px solid #E2E8F0;">
              <span style="font-size: 10px; color: #64748B; display: block;">Soil Mst.</span>
              <strong style="font-size: 12px; color: #0F1F3D;">${loc.soilMoisture}%</strong>
            </div>
            <div style="background: #F8FAFC; padding: 4px; border-radius: 6px; border: 1px solid #E2E8F0;">
              <span style="font-size: 10px; color: #64748B; display: block;">Slope</span>
              <strong style="font-size: 12px; color: #0F1F3D;">${loc.slope}°</strong>
            </div>
          </div>

          <div style="font-size: 11px; color: #334155; background: #FEF9C3; padding: 6px 8px; border-radius: 6px; border-left: 3px solid ${pinColor}; line-height: 1.35;">
            ${loc.status}
          </div>
        </div>
      `;

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });
      marker.bindPopup(popupHtml);
      layerGroup.addLayer(marker);
    });
  }, [activeLayers.landslideRisk]);

  // Update Road Network
  useEffect(() => {
    const layerGroup = roadsLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    if (!activeLayers.roadNetwork) return;

    roadCorridors.forEach((road) => {
      let strokeColor = '#3B82F6';
      let dashArray: string | undefined = undefined;

      if (road.status === 'blocked') {
        strokeColor = '#EF4444';
        dashArray = '6, 6';
      } else if (road.status === 'partially_blocked') {
        strokeColor = '#F59E0B';
        dashArray = '8, 4';
      }

      const polyline = L.polyline(road.points, {
        color: strokeColor,
        weight: 4,
        opacity: 0.85,
        dashArray,
      });

      polyline.bindTooltip(`<b>${road.name}</b><br/>Status: ${road.status.replace('_', ' ').toUpperCase()}`, {
        sticky: true,
      });

      layerGroup.addLayer(polyline);
    });
  }, [activeLayers.roadNetwork]);

  // Update Weather Heat / Rainfall Zones
  useEffect(() => {
    const layerGroup = weatherLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    if (!activeLayers.weather) return;

    const rainCenters: { lat: number; lng: number; radius: number; label: string }[] = [];

    rainCenters.forEach((zone) => {
      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius,
        color: '#0284C7',
        fillColor: '#38BDF8',
        fillOpacity: 0.22,
        weight: 1.5,
        dashArray: '4, 4',
      });

      circle.bindTooltip(`🌧️ <b>${zone.label}</b>`, { sticky: true });
      layerGroup.addLayer(circle);
    });
  }, [activeLayers.weather]);

  // Update District Boundaries
  useEffect(() => {
    const layerGroup = boundaryLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    if (!activeLayers.districtBoundary) return;

    const districtPolys: [number, number][][] = [];

    districtPolys.forEach((poly) => {
      const polygon = L.polygon(poly, {
        color: '#FFFFFF',
        fillColor: '#FFFFFF',
        fillOpacity: 0.04,
        weight: 1.5,
        opacity: 0.65,
        dashArray: '3, 4',
      });
      layerGroup.addLayer(polygon);
    });
  }, [activeLayers.districtBoundary]);

  // Invalidate map size on fullscreen toggle and container resize
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 50);
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 250);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={`relative w-full overflow-hidden transition-all duration-200 ${isFullscreen
          ? 'h-full flex-1 rounded-none [&_.leaflet-container]:rounded-none'
          : 'h-[460px] sm:h-[500px] rounded-b-xl'
        }`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
