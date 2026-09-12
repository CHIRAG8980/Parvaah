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

const locations: RiskLocation[] = [
  {
    id: 'kameng',
    name: 'Kameng Sector',
    state: 'Arunachal Pradesh',
    lat: 27.2645,
    lng: 92.4159,
    level: 'CRITICAL',
    score: 92,
    rainfall24h: 178,
    soilMoisture: 89,
    slope: 38,
    status: 'Slope instability detected near NH-13. Immediate patrol dispatched.',
  },
  {
    id: 'ukhrul',
    name: 'Ukhrul Central',
    state: 'Manipur',
    lat: 25.1167,
    lng: 94.3667,
    level: 'CRITICAL',
    score: 88,
    rainfall24h: 164,
    soilMoisture: 84,
    slope: 41,
    status: 'Multiple debris flows reported. Section barricaded.',
  },
  {
    id: 'east-khasi-hills',
    name: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.5788,
    lng: 91.8933,
    level: 'HIGH',
    score: 76,
    rainfall24h: 142,
    soilMoisture: 78,
    slope: 34,
    status: 'Excessive pore pressure recorded by sensor cluster S-04.',
  },
  {
    id: 'dima-hasao',
    name: 'Dima Hasao (Haflong)',
    state: 'Assam',
    lat: 25.1762,
    lng: 93.0234,
    level: 'HIGH',
    score: 72,
    rainfall24h: 138,
    soilMoisture: 76,
    slope: 32,
    status: 'Rail-road corridor monitored. High runoff rate.',
  },
  {
    id: 'churachandpur',
    name: 'Churachandpur Ridge',
    state: 'Manipur',
    lat: 24.3333,
    lng: 93.6833,
    level: 'HIGH',
    score: 68,
    rainfall24h: 112,
    soilMoisture: 71,
    slope: 35,
    status: 'Moderate surface creep observed on steep road cut.',
  },
  {
    id: 'kohima',
    name: 'Kohima Bypass',
    state: 'Nagaland',
    lat: 25.6701,
    lng: 94.1077,
    level: 'MEDIUM',
    score: 54,
    rainfall24h: 76,
    soilMoisture: 58,
    slope: 29,
    status: 'Soil saturation moderate. Early warning standby.',
  },
  {
    id: 'aizawl',
    name: 'Aizawl North Slopes',
    state: 'Mizoram',
    lat: 23.7271,
    lng: 92.7176,
    level: 'MEDIUM',
    score: 48,
    rainfall24h: 68,
    soilMoisture: 52,
    slope: 31,
    status: 'Intermittent seepage detected at retaining wall.',
  },
  {
    id: 'tawang',
    name: 'Tawang Pass Corridor',
    state: 'Arunachal Pradesh',
    lat: 27.5861,
    lng: 91.8594,
    level: 'MEDIUM',
    score: 44,
    rainfall24h: 52,
    soilMoisture: 46,
    slope: 36,
    status: 'Freeze-thaw fracture checks ongoing.',
  },
  {
    id: 'lower-subansiri',
    name: 'Lower Subansiri',
    state: 'Arunachal Pradesh',
    lat: 27.65,
    lng: 93.83,
    level: 'LOW',
    score: 24,
    rainfall24h: 22,
    soilMoisture: 33,
    slope: 28,
    status: 'Normal baseline readings across all geophones.',
  },
  {
    id: 'kamrup',
    name: 'Kamrup Metro',
    state: 'Assam',
    lat: 26.1445,
    lng: 91.7362,
    level: 'LOW',
    score: 18,
    rainfall24h: 16,
    soilMoisture: 28,
    slope: 15,
    status: 'Drainage network clear. River levels steady.',
  },
  {
    id: 'unakoti',
    name: 'Unakoti Hill Tracts',
    state: 'Tripura',
    lat: 24.3,
    lng: 92.0,
    level: 'LOW',
    score: 22,
    rainfall24h: 28,
    soilMoisture: 36,
    slope: 22,
    status: 'Vegetation canopy stable. Low vulnerability.',
  },
];

// Major North East India Road Corridors
const roadCorridors = [
  // NH-27 Guwahati to Nagaon & Dimapur
  {
    name: 'NH-27 / NH-29 Gateway Corridor',
    status: 'operational',
    points: [
      [26.1445, 91.7362],
      [26.35, 92.68],
      [25.9, 93.7],
      [25.6701, 94.1077],
    ] as [number, number][],
  },
  // NH-2 Dimapur to Kohima to Imphal
  {
    name: 'NH-2 Dimapur - Imphal Highway',
    status: 'partially_blocked',
    points: [
      [25.9, 93.73],
      [25.67, 94.1],
      [25.15, 94.0],
      [24.81, 93.94],
    ] as [number, number][],
  },
  // NH-6 Shillong - Jowai - Silchar
  {
    name: 'NH-6 Meghalaya-Barak Valley Link',
    status: 'operational',
    points: [
      [26.14, 91.74],
      [25.5788, 91.8933],
      [25.44, 92.21],
      [24.83, 92.79],
    ] as [number, number][],
  },
  // NH-13 Trans-Arunachal Highway (Kameng section affected)
  {
    name: 'NH-13 Trans-Arunachal Highway',
    status: 'blocked',
    points: [
      [27.0, 92.2],
      [27.2645, 92.4159],
      [27.5861, 91.8594],
    ] as [number, number][],
  },
];

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

    // High rainfall buffer circles representing radar rainfall plumes
    const rainCenters = [
      { lat: 25.3, lng: 91.7, radius: 45000, label: 'Cherrapunji Intense Cloudburst (198mm)' },
      { lat: 27.25, lng: 92.4, radius: 50000, label: 'Kameng Heavy Monsoon Plume (178mm)' },
      { lat: 25.17, lng: 93.02, radius: 38000, label: 'Barail Range Precipitation (138mm)' },
      { lat: 25.11, lng: 94.36, radius: 40000, label: 'Manipur Hills Squall Line (164mm)' },
    ];

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

    // Representative District Polyline Boundaries across NER
    const districtPolys: [number, number][][] = [
      // Meghalaya - East Khasi Hills boundary
      [
        [25.8, 91.5],
        [25.85, 92.1],
        [25.2, 92.2],
        [25.1, 91.6],
        [25.8, 91.5],
      ],
      // Arunachal Pradesh - West Kameng
      [
        [27.6, 92.1],
        [27.8, 92.6],
        [27.0, 92.8],
        [26.9, 92.2],
        [27.6, 92.1],
      ],
      // Assam - Dima Hasao
      [
        [25.6, 92.7],
        [25.7, 93.3],
        [25.0, 93.4],
        [24.9, 92.8],
        [25.6, 92.7],
      ],
      // Manipur - Ukhrul
      [
        [25.4, 94.1],
        [25.5, 94.7],
        [24.8, 94.6],
        [24.7, 94.2],
        [25.4, 94.1],
      ],
    ];

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
