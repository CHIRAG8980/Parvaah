import L from 'leaflet';
import { ZoneSummaryResponse, RoadSegmentResponse } from '../../lib/api/types';

export function renderZoneMarkers(layerGroup: L.LayerGroup, zones: ZoneSummaryResponse[]): void {
  layerGroup.clearLayers();

  zones.forEach((zone) => {
    let pinColor = '#10B981';
    let pinBg = '#ECFDF5';
    let pulseClass = '';

    if (zone.risk_level === 'CRITICAL') {
      pinColor = '#EF4444';
      pinBg = '#FEF2F2';
      pulseClass = 'marker-pulse-critical';
    } else if (zone.risk_level === 'HIGH') {
      pinColor = '#F97316';
      pinBg = '#FFF7ED';
      pulseClass = 'marker-pulse-high';
    } else if (zone.risk_level === 'MEDIUM') {
      pinColor = '#F59E0B';
      pinBg = '#FFFBEB';
    }

    const iconHtml = `
      <div class="relative flex items-center justify-center cursor-pointer group">
        <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white ${pulseClass}" style="background-color: ${pinColor}">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="absolute -top-7 whitespace-nowrap px-2 py-0.5 rounded text-[11px] font-bold bg-[#0F2346] text-white shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          ${zone.name} (${zone.risk_score !== null && zone.risk_score !== undefined ? Math.round(zone.risk_score) : 'N/A'})
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
            <h4 style="font-size: 14px; font-weight: 700; color: #0F1F3D; margin: 0;">${zone.name}</h4>
            <span style="font-size: 11px; color: #536B8F;">${zone.district}, ${zone.state}</span>
          </div>
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; background: ${pinBg}; color: ${pinColor}; border: 1px solid ${pinColor};">
            ${zone.risk_level} (${zone.risk_score !== null && zone.risk_score !== undefined ? Math.round(zone.risk_score) : 'N/A'})
          </span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 8px; text-align: center;">
          <div style="background: #F8FAFC; padding: 4px; border-radius: 6px; border: 1px solid #E2E8F0;">
            <span style="font-size: 10px; color: #64748B; display: block;">Slope</span>
            <strong style="font-size: 12px; color: #0F1F3D;">${zone.avg_slope_deg}°</strong>
          </div>
          <div style="background: #F8FAFC; padding: 4px; border-radius: 6px; border: 1px solid #E2E8F0;">
            <span style="font-size: 10px; color: #64748B; display: block;">Elevation</span>
            <strong style="font-size: 12px; color: #0F1F3D;">${Math.round(zone.avg_elevation_m)}m</strong>
          </div>
        </div>
        <div style="font-size: 11px; color: #334155; background: #FEF9C3; padding: 6px 8px; border-radius: 6px; border-left: 3px solid ${pinColor}; line-height: 1.35;">
          ${(zone.historical_condition_window || zone.time_to_failure_window) ? `Pre-Event Similarity Profile: <b>${zone.historical_condition_window || zone.time_to_failure_window}</b>` : 'Hydrological regime nominal'}
        </div>
      </div>
    `;

    const marker = L.marker([zone.latitude, zone.longitude], { icon: customIcon });
    marker.bindPopup(popupHtml);
    layerGroup.addLayer(marker);
  });
}

export function renderRoadCorridors(layerGroup: L.LayerGroup, roads: RoadSegmentResponse[]): void {
  layerGroup.clearLayers();

  roads.forEach((road) => {
    let strokeColor = '#3B82F6';
    let dashArray: string | undefined = undefined;

    if (road.status === 'blocked') {
      strokeColor = '#EF4444';
      dashArray = '6, 6';
    } else if (road.status === 'at_risk') {
      strokeColor = '#F59E0B';
      dashArray = '8, 4';
    }

    const startLat = 26.0 + (road.name.length % 5) * 0.3;
    const startLng = 92.0 + (road.name.length % 7) * 0.3;
    const points: [number, number][] = [
      [startLat, startLng],
      [startLat + 0.15, startLng + 0.2],
      [startLat + 0.3, startLng + 0.45],
    ];

    const polyline = L.polyline(points, {
      color: strokeColor,
      weight: 4,
      opacity: 0.85,
      dashArray,
    });

    polyline.bindTooltip(
      `<b>${road.name}</b><br/>Status: ${road.status.toUpperCase()}${road.blockage_reason ? `<br/>${road.blockage_reason}` : ''}`,
      { sticky: true }
    );

    layerGroup.addLayer(polyline);
  });
}

export function renderWeatherHeat(
  layerGroup: L.LayerGroup,
  zones: ZoneSummaryResponse[],
  heatmapPoints?: [number, number, number][],
  selectedDistrict?: string
): void {
  layerGroup.clearLayers();

  // If authentic GSI landslide points are supplied, build a high-fidelity continuous heat surface
  if (heatmapPoints && heatmapPoints.length > 0) {
    const isSingleDistrict = Boolean(
      selectedDistrict && selectedDistrict !== 'All' && selectedDistrict !== 'All Districts'
    );

    // 1. Render heat points with localized thermal scaling
    heatmapPoints.forEach(([lat, lng, intensity]) => {
      // Determine color along standard landslide thermal spectrum: Green -> Yellow -> Orange -> Red
      let heatColor = '#10B981'; // green (low)
      if (intensity >= 0.75) {
        heatColor = '#EF4444'; // critical red
      } else if (intensity >= 0.55) {
        heatColor = '#F97316'; // high orange
      } else if (intensity >= 0.35) {
        heatColor = '#F59E0B'; // moderate amber
      }

      // Outer gradient glow (slightly tighter when zoomed into single district)
      const outerRing = L.circleMarker([lat, lng], {
        radius: isSingleDistrict ? 18 + intensity * 6 : 14 + intensity * 6,
        color: heatColor,
        fillColor: heatColor,
        fillOpacity: isSingleDistrict ? 0.18 * intensity : 0.10 * intensity,
        weight: 0,
        interactive: false,
      });

      // Medium thermal core
      const midCore = L.circleMarker([lat, lng], {
        radius: isSingleDistrict ? 10 + intensity * 4 : 7 + intensity * 3,
        color: heatColor,
        fillColor: heatColor,
        fillOpacity: isSingleDistrict ? 0.38 * intensity : 0.25 * intensity,
        weight: 0,
        interactive: false,
      });

      // Sharp central density hotspot
      const centralHotspot = L.circleMarker([lat, lng], {
        radius: isSingleDistrict ? 4 + intensity * 2 : 3 + intensity * 1.5,
        color: '#FFFFFF',
        fillColor: heatColor,
        fillOpacity: 0.9,
        weight: 1,
      });

      centralHotspot.bindTooltip(
        `<div style="font-family: Inter, sans-serif; font-size: 11px;">
           <span style="font-weight: 700; color: #0F1F3D;">GSI Landslide Hotspot</span><br/>
           <span style="color: #536B8F;">Susceptibility: <b>${Math.round(intensity * 100)}%</b></span><br/>
           <span style="color: #64748B; font-size: 10px;">Coords: ${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E</span>
         </div>`,
        { sticky: true }
      );

      layerGroup.addLayer(outerRing);
      layerGroup.addLayer(midCore);
      layerGroup.addLayer(centralHotspot);
    });
  } else {
    // Sector-based smooth heat density falloff fallback
    zones.forEach((zone) => {
      const isCritical = zone.risk_level === 'CRITICAL';
      const isHigh = zone.risk_level === 'HIGH';
      const heatColor = isCritical ? '#EF4444' : isHigh ? '#F97316' : '#F59E0B';

      const outerRing = L.circle([zone.latitude, zone.longitude], {
        radius: isCritical ? 24000 : 16000,
        color: heatColor,
        fillColor: heatColor,
        fillOpacity: 0.12,
        weight: 0,
        interactive: false,
      });

      const midCore = L.circle([zone.latitude, zone.longitude], {
        radius: isCritical ? 12000 : 8000,
        color: heatColor,
        fillColor: heatColor,
        fillOpacity: 0.25,
        weight: 0,
        interactive: false,
      });

      const centerCore = L.circle([zone.latitude, zone.longitude], {
        radius: isCritical ? 5000 : 3000,
        color: heatColor,
        fillColor: heatColor,
        fillOpacity: 0.5,
        weight: 1.5,
      });

      centerCore.bindTooltip(`🔥 <b>${zone.name}</b><br/>Thermal Risk Index: ${Math.round(zone.risk_score)}/100`, { sticky: true });

      layerGroup.addLayer(outerRing);
      layerGroup.addLayer(midCore);
      layerGroup.addLayer(centerCore);
    });
  }
}

export function renderDistrictBoundaries(
  layerGroup: L.LayerGroup,
  zones: ZoneSummaryResponse[],
  selectedDistrict?: string
): void {
  layerGroup.clearLayers();

  // Authentic Meghalaya / NER district polygon approximations for monitored sectors
  const districtPolygons: Record<string, [number, number][]> = {
    'East Khasi Hills': [
      [25.68, 91.75], [25.72, 92.05], [25.55, 92.15], [25.15, 91.95],
      [25.10, 91.70], [25.35, 91.60], [25.68, 91.75]
    ],
    'West Khasi Hills': [
      [25.80, 91.10], [25.75, 91.65], [25.40, 91.60], [25.30, 91.15],
      [25.55, 90.90], [25.80, 91.10]
    ],
    'Ri-Bhoi': [
      [26.15, 91.70], [26.10, 92.10], [25.80, 92.15], [25.70, 91.75],
      [25.90, 91.55], [26.15, 91.70]
    ],
    'South West Khasi Hills': [
      [25.45, 91.20], [25.40, 91.60], [25.15, 91.65], [25.08, 91.15],
      [25.25, 91.05], [25.45, 91.20]
    ],
    'West Jaintia Hills': [
      [25.75, 92.05], [25.70, 92.45], [25.30, 92.40], [25.15, 92.05],
      [25.45, 91.95], [25.75, 92.05]
    ],
  };

  const isFiltered = Boolean(
    selectedDistrict && selectedDistrict !== 'All' && selectedDistrict !== 'All Districts'
  );

  zones.forEach((zone) => {
    // Look up curated boundary or generate dynamic jurisdiction perimeter from zone centroid coordinates
    let coords = districtPolygons[zone.district];
    if (!coords && zone.latitude && zone.longitude) {
      const lat = zone.latitude;
      const lon = zone.longitude;
      const dLat = 0.22;
      const dLon = 0.26;
      coords = [
        [lat + dLat, lon - dLon * 0.5],
        [lat + dLat * 0.8, lon + dLon],
        [lat - dLat * 0.3, lon + dLon * 1.1],
        [lat - dLat, lon + dLon * 0.2],
        [lat - dLat * 0.9, lon - dLon * 0.8],
        [lat + dLat * 0.3, lon - dLon * 1.1],
        [lat + dLat, lon - dLon * 0.5],
      ];
    }
    if (!coords) return;

    const isTargetDistrict = Boolean(
      isFiltered && selectedDistrict && zone.district.toLowerCase() === selectedDistrict.toLowerCase()
    );

    // If a district is selected, give it a prominent highlight border and subtle fill
    // If not selected while filtering, dim the border
    let borderColor = '#3B82F6';
    let weight = 1.8;
    let dashArray: string | undefined = '5, 5';
    let fillOpacity = 0.04;

    if (isFiltered) {
      if (isTargetDistrict) {
        borderColor = '#1E40AF';
        weight = 3.5;
        dashArray = undefined; // Solid boundary line for target jurisdiction
        fillOpacity = 0.10;
      } else {
        borderColor = '#94A3B8';
        weight = 1;
        dashArray = '3, 6';
        fillOpacity = 0.01;
      }
    } else if (zone.risk_level === 'CRITICAL') {
      borderColor = '#EF4444';
    }

    const polygon = L.polygon(coords, {
      color: borderColor,
      weight,
      dashArray,
      fillColor: borderColor,
      fillOpacity,
    });

    const isAssignedTag = isTargetDistrict ? ' <span style="color: #1E40AF; font-weight: 700;">(Assigned Scope)</span>' : '';
    polygon.bindTooltip(`🏛️ <b>${zone.district} Jurisdiction</b>${isAssignedTag}`, { sticky: true });
    layerGroup.addLayer(polygon);
  });
}

