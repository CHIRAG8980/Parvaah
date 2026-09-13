'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { updateBasemapTiles } from './mapTileManager';
import { renderZoneMarkers, renderRoadCorridors, renderWeatherHeat } from './mapLayers';
import { useZones } from '../../hooks/useZones';
import { useRoads } from '../../hooks/useRoads';

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

export const MapInner: React.FC<MapInnerProps> = ({
  activeLayers,
  mapMode,
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

  const { zones } = useZones();
  const { roads } = useRoads();

  const onMapReadyRef = useRef(onMapReady);
  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter || [25.75, 92.9],
      zoom: initialZoom || 7,
      zoomControl: false,
      attributionControl: false,
      minZoom: 6,
      maxZoom: 14,
    });

    mapInstanceRef.current = map;
    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    roadsLayerGroupRef.current = L.layerGroup().addTo(map);
    weatherLayerGroupRef.current = L.layerGroup().addTo(map);

    const { tileLayer, labelLayer } = updateBasemapTiles(map, mapMode, null, null);
    tileLayerRef.current = tileLayer;
    labelLayerRef.current = labelLayer;

    if (onMapReadyRef.current) {
      onMapReadyRef.current(map);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Update Basemap Tiles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const { tileLayer, labelLayer } = updateBasemapTiles(
      map,
      mapMode,
      tileLayerRef.current,
      labelLayerRef.current
    );
    tileLayerRef.current = tileLayer;
    labelLayerRef.current = labelLayer;
  }, [mapMode]);

  // Update Markers when zones or activeLayer changes
  useEffect(() => {
    if (!markersLayerGroupRef.current) return;
    if (activeLayers.landslideRisk) {
      renderZoneMarkers(markersLayerGroupRef.current, zones);
    } else {
      markersLayerGroupRef.current.clearLayers();
    }
  }, [zones, activeLayers.landslideRisk]);

  // Update Road Corridors
  useEffect(() => {
    if (!roadsLayerGroupRef.current) return;
    if (activeLayers.roadNetwork) {
      renderRoadCorridors(roadsLayerGroupRef.current, roads);
    } else {
      roadsLayerGroupRef.current.clearLayers();
    }
  }, [roads, activeLayers.roadNetwork]);

  // Update Weather Circles
  useEffect(() => {
    if (!weatherLayerGroupRef.current) return;
    if (activeLayers.weather) {
      renderWeatherHeat(weatherLayerGroupRef.current, zones);
    } else {
      weatherLayerGroupRef.current.clearLayers();
    }
  }, [zones, activeLayers.weather]);

  // Invalidate map on resize/fullscreen
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);

  return (
    <div
      className={`relative w-full overflow-hidden transition-all duration-200 ${
        isFullscreen
          ? 'h-full flex-1 rounded-none [&_.leaflet-container]:rounded-none'
          : 'h-[460px] sm:h-[500px] rounded-b-xl'
      }`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
