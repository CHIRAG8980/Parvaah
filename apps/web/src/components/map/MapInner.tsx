import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { updateBasemapTiles } from './mapTileManager';
import { renderZoneMarkers, renderRoadCorridors, renderWeatherHeat, renderDistrictBoundaries } from './mapLayers';
import { useZones, useLandslideHeatmap } from '../../hooks/useZones';
import { useRoads } from '../../hooks/useRoads';
import { ZoneSummaryResponse } from '../../lib/api/types';

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
  filteredZones?: ZoneSummaryResponse[];
  selectedDistrict?: string;
}

export const MapInner: React.FC<MapInnerProps> = ({
  activeLayers,
  mapMode,
  onMapReady,
  isFullscreen = false,
  initialCenter,
  initialZoom,
  filteredZones,
  selectedDistrict,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const roadsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const weatherLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const { zones: allZones } = useZones();
  const zonesToDisplay = filteredZones || allZones;
  const { roads } = useRoads();
  const { data: heatmapData } = useLandslideHeatmap(selectedDistrict);

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
    boundaryLayerGroupRef.current = L.layerGroup().addTo(map);

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
      renderZoneMarkers(markersLayerGroupRef.current, zonesToDisplay);
    } else {
      markersLayerGroupRef.current.clearLayers();
    }
  }, [zonesToDisplay, activeLayers.landslideRisk]);

  // Update Road Corridors
  useEffect(() => {
    if (!roadsLayerGroupRef.current) return;
    if (activeLayers.roadNetwork) {
      renderRoadCorridors(roadsLayerGroupRef.current, roads);
    } else {
      roadsLayerGroupRef.current.clearLayers();
    }
  }, [roads, activeLayers.roadNetwork]);

  // Update Continuous Landslide Heatmap & Telemetry
  useEffect(() => {
    if (!weatherLayerGroupRef.current) return;
    if (activeLayers.weather) {
      renderWeatherHeat(weatherLayerGroupRef.current, zonesToDisplay, heatmapData?.points, selectedDistrict);
    } else {
      weatherLayerGroupRef.current.clearLayers();
    }
  }, [zonesToDisplay, activeLayers.weather, heatmapData, selectedDistrict]);

  // Update District Boundary Polygons
  useEffect(() => {
    if (!boundaryLayerGroupRef.current) return;
    if (activeLayers.districtBoundary) {
      renderDistrictBoundaries(boundaryLayerGroupRef.current, zonesToDisplay, selectedDistrict);
    } else {
      boundaryLayerGroupRef.current.clearLayers();
    }
  }, [zonesToDisplay, activeLayers.districtBoundary, selectedDistrict]);

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
