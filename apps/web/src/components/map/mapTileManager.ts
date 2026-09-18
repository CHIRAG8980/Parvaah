import L from 'leaflet';

export function updateBasemapTiles(
  map: L.Map,
  mode: 'satellite' | 'terrain' | 'streets',
  currentTileLayer: L.TileLayer | null,
  currentLabelLayer: L.TileLayer | null
): { tileLayer: L.TileLayer; labelLayer: L.TileLayer | null } {
  if (currentTileLayer) {
    map.removeLayer(currentTileLayer);
  }
  if (currentLabelLayer) {
    map.removeLayer(currentLabelLayer);
  }

  if (mode === 'satellite') {
    const tileLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18 }
    ).addTo(map);

    const labelLayer = L.tileLayer(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18 }
    ).addTo(map);

    return { tileLayer, labelLayer };
  }

  if (mode === 'terrain') {
    const tileLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18 }
    ).addTo(map);

    return { tileLayer, labelLayer: null };
  }

  const tileLayer = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    { maxZoom: 19 }
  ).addTo(map);

  return { tileLayer, labelLayer: null };
}
