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
          ${zone.name} (${Math.round(zone.risk_score)})
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
            ${zone.risk_level} (${Math.round(zone.risk_score)})
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
          ${zone.time_to_failure_window ? `Time to Failure Window: <b>${zone.time_to_failure_window}</b>` : 'Monitoring telemetry stable'}
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

export function renderWeatherHeat(layerGroup: L.LayerGroup, zones: ZoneSummaryResponse[]): void {
  layerGroup.clearLayers();

  zones.forEach((zone) => {
    const isCritical = zone.risk_level === 'CRITICAL';
    const circle = L.circle([zone.latitude, zone.longitude], {
      radius: isCritical ? 25000 : 15000,
      color: isCritical ? '#DC2626' : '#0284C7',
      fillColor: isCritical ? '#EF4444' : '#38BDF8',
      fillOpacity: 0.18,
      weight: 1.5,
      dashArray: '4, 4',
    });

    circle.bindTooltip(`🌧️ <b>${zone.name} Rainfall Sector</b>`, { sticky: true });
    layerGroup.addLayer(circle);
  });
}
