import React from 'react';
import type { ZoneRisk } from '@landslide/types';
import { RiskBadge, ConfidenceIndicator } from '@landslide/ui';
import { APP_CONFIG } from '@landslide/config';
import { AlertTriangle, ShieldCheck, Activity, Satellite, CloudRain, Mountain } from 'lucide-react';

const mockZones: ZoneRisk[] = [
  {
    zoneId: 'NER-MEG-001',
    zoneName: 'Sohra (Cherrapunji) Sector A',
    state: 'Meghalaya',
    coordinates: { latitude: 25.2986, longitude: 91.7086, elevation: 1430 },
    riskScore: 0.91,
    riskLevel: 'CRITICAL',
    confidence: 'HIGH',
    factors: {
      rainfall24hMm: 198.4,
      rainfall72hCumulativeMm: 342.1,
      soilMoisturePercentage: 88.5,
      slopeDegrees: 38.2,
      insarDeformationMmPerYear: -24.6,
      ndviVegetationIndex: 0.38,
      geologyType: 'Shale & Weathered Sandstone',
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    zoneId: 'NER-SKM-014',
    zoneName: 'Dikchu - Singtam Faultline',
    state: 'Sikkim',
    coordinates: { latitude: 27.3389, longitude: 88.6065, elevation: 1650 },
    riskScore: 0.76,
    riskLevel: 'HIGH',
    confidence: 'HIGH',
    factors: {
      rainfall24hMm: 88.2,
      rainfall72hCumulativeMm: 164.0,
      soilMoisturePercentage: 74.0,
      slopeDegrees: 42.0,
      insarDeformationMmPerYear: -18.2,
      ndviVegetationIndex: 0.44,
      geologyType: 'Mica Schist',
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    zoneId: 'NER-ASM-008',
    zoneName: 'Haflong Hill Cut corridor',
    state: 'Assam',
    coordinates: { latitude: 25.1762, longitude: 93.0234, elevation: 968 },
    riskScore: 0.54,
    riskLevel: 'MEDIUM',
    confidence: 'MEDIUM',
    factors: {
      rainfall24hMm: 46.0,
      rainfall72hCumulativeMm: 82.5,
      soilMoisturePercentage: 58.2,
      slopeDegrees: 29.5,
      insarDeformationMmPerYear: -6.4,
      ndviVegetationIndex: 0.62,
      geologyType: 'Alluvial Sediments',
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    zoneId: 'NER-ARU-003',
    zoneName: 'Tawang Pass Escarpment',
    state: 'Arunachal Pradesh',
    coordinates: { latitude: 27.5861, longitude: 91.8594, elevation: 3048 },
    riskScore: 0.22,
    riskLevel: 'LOW',
    confidence: 'HIGH',
    factors: {
      rainfall24hMm: 12.0,
      rainfall72hCumulativeMm: 24.0,
      soilMoisturePercentage: 32.0,
      slopeDegrees: 34.0,
      insarDeformationMmPerYear: -1.2,
      ndviVegetationIndex: 0.78,
      geologyType: 'Granitic Gneiss',
    },
    lastUpdated: new Date().toISOString(),
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2 bg-red-950/60 border border-red-800 rounded-lg text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {APP_CONFIG.appName}
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            {APP_CONFIG.region} • Disaster Authority Real-Time Monitoring Console
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-800/80 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            FastAPI Backend Synced
          </span>
        </div>
      </header>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monitored Zones</span>
            <Mountain className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white">4 Active Sectors</div>
          <p className="text-xs text-slate-500 mt-1">Sikkim, Meghalaya, Assam, Arunachal</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical Trigger</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">1 Critical Zone</div>
          <p className="text-xs text-red-400/80 mt-1">Sohra (Meghalaya) 24h Rain: 198mm</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">InSAR Deformation</span>
            <Satellite className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300">-24.6 mm/yr</div>
          <p className="text-xs text-slate-500 mt-1">Sentinel-1 Persistent Scatterer</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Rainfall Anomaly</span>
            <CloudRain className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-300">+48% vs Baseline</div>
          <p className="text-xs text-slate-500 mt-1">IMD Auto Weather Station stream</p>
        </div>
      </section>

      {/* Main Risk Table */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl mb-8">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Landslide Susceptibility & Early Warning Matrix</h2>
            <p className="text-xs text-slate-400">Fused predictions from ML Engine (RF + InSAR + Rainfall Trigger Model)</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3">Zone & State</th>
                <th className="px-6 py-3">Risk Level</th>
                <th className="px-6 py-3">Risk Score</th>
                <th className="px-6 py-3">Confidence</th>
                <th className="px-6 py-3">24h Rain</th>
                <th className="px-6 py-3">InSAR Velocity</th>
                <th className="px-6 py-3">Slope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {mockZones.map((zone) => (
                <tr key={zone.zoneId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{zone.zoneName}</div>
                    <div className="text-xs text-slate-400">{zone.state} • <span className="font-mono">{zone.zoneId}</span></div>
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge level={zone.riskLevel} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${zone.riskScore > 0.8
                              ? 'bg-red-500'
                              : zone.riskScore > 0.6
                                ? 'bg-orange-500'
                                : zone.riskScore > 0.3
                                  ? 'bg-yellow-500'
                                  : 'bg-emerald-500'
                            }`}
                          style={{ width: `${zone.riskScore * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {(zone.riskScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <ConfidenceIndicator confidence={zone.confidence} />
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-300">
                    {zone.factors.rainfall24hMm} mm
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-300">
                    {zone.factors.insarDeformationMmPerYear ? `${zone.factors.insarDeformationMmPerYear} mm/yr` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-300">
                    {zone.factors.slopeDegrees}°
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer info */}
      <footer className="text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-slate-900 pt-4">
        <span>Monorepo Architecture: pnpm workspace (`@landslide/web`, `@landslide/types`, `@landslide/ui`)</span>
        <span>Target: North Eastern Region Landslide Hazard Early Warning</span>
      </footer>
    </main>
  );
}
