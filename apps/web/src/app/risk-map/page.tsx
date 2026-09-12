'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { LiveRiskMap } from '../../components/map/LiveRiskMap';
import {
  ShieldAlert,
  Radio,
  Satellite,
  Layers,
  Filter,
  ArrowUpRight,
  TrendingDown,
  Activity,
  Compass,
} from 'lucide-react';

interface ZoneDetail {
  id: string;
  name: string;
  state: string;
  district: string;
  riskScore: number;
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  insarDeformation: string;
  ndviLoss: string;
  soilMoisture: string;
  rainfall24h: string;
  slope: string;
  sensorsOnline: number;
  totalSensors: number;
}

const zoneDetails: ZoneDetail[] = [
  {
    id: 'NER-ARU-001',
    name: 'West Kameng - Bhalukpong Ridge',
    state: 'Arunachal Pradesh',
    district: 'West Kameng',
    riskScore: 92,
    level: 'CRITICAL',
    insarDeformation: '-24.6 mm/yr',
    ndviLoss: '-18.4%',
    soilMoisture: '89.2%',
    rainfall24h: '178 mm',
    slope: '38.5°',
    sensorsOnline: 8,
    totalSensors: 8,
  },
  {
    id: 'NER-MAN-003',
    name: 'Ukhrul Central Escarpment',
    state: 'Manipur',
    district: 'Ukhrul',
    riskScore: 88,
    level: 'CRITICAL',
    insarDeformation: '-19.2 mm/yr',
    ndviLoss: '-14.1%',
    soilMoisture: '84.0%',
    rainfall24h: '164 mm',
    slope: '41.2°',
    sensorsOnline: 6,
    totalSensors: 6,
  },
  {
    id: 'NER-MEG-002',
    name: 'East Khasi Hills - Sohra Canyon',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    riskScore: 76,
    level: 'HIGH',
    insarDeformation: '-12.8 mm/yr',
    ndviLoss: '-9.6%',
    soilMoisture: '78.5%',
    rainfall24h: '142 mm',
    slope: '34.0°',
    sensorsOnline: 12,
    totalSensors: 12,
  },
  {
    id: 'NER-ASM-004',
    name: 'Dima Hasao - Haflong Hill Cut',
    state: 'Assam',
    district: 'Dima Hasao',
    riskScore: 72,
    level: 'HIGH',
    insarDeformation: '-11.4 mm/yr',
    ndviLoss: '-11.2%',
    soilMoisture: '76.1%',
    rainfall24h: '138 mm',
    slope: '32.8°',
    sensorsOnline: 9,
    totalSensors: 10,
  },
];

export default function RiskMapPage() {
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedRisk, setSelectedRisk] = useState('All Risks');

  const filteredZones = zoneDetails.filter((zone) => {
    const matchesState = selectedState === 'All States' || zone.state === selectedState;
    const matchesRisk = selectedRisk === 'All Risks' || zone.level === selectedRisk;
    return matchesState && matchesRisk;
  });

  return (
    <DashboardShell>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
            GIS Risk Map & Satellite Surveillance
          </h1>
          <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
            Multi-modal landslide susceptibility, InSAR satellite deformation, and IoT sensor telemetry across North East India
          </p>
        </div>

        {/* Live Satellite Status */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF3FF] border border-[#BFDBFE] text-[#1769D2] text-[12px] font-semibold">
            <Satellite className="w-3.5 h-3.5 animate-pulse" />
            <span>Sentinel-1 & NISAR Feeds Active</span>
          </div>
        </div>
      </div>

      {/* Filter and Telemetry Strip */}
      <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs motion-card">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#536B8F]">
            <Filter className="w-3.5 h-3.5 text-[#1769D2]" />
            <span>Filters:</span>
          </div>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="text-xs font-medium bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-1.5 text-[#0F1F3D] focus:outline-none focus:ring-2 focus:ring-[#1769D2]/20 motion-input cursor-pointer"
          >
            <option value="All States">All North East States</option>
            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
            <option value="Assam">Assam</option>
            <option value="Meghalaya">Meghalaya</option>
            <option value="Manipur">Manipur</option>
            <option value="Nagaland">Nagaland</option>
            <option value="Mizoram">Mizoram</option>
            <option value="Sikkim">Sikkim</option>
            <option value="Tripura">Tripura</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="text-xs font-medium bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-1.5 text-[#0F1F3D] focus:outline-none focus:ring-2 focus:ring-[#1769D2]/20 motion-input cursor-pointer"
          >
            <option value="All Risks">All Risk Levels</option>
            <option value="CRITICAL">Critical (81 - 100)</option>
            <option value="HIGH">High (61 - 80)</option>
            <option value="MEDIUM">Medium (31 - 60)</option>
            <option value="LOW">Low (0 - 30)</option>
          </select>
        </div>

        {/* Quick Telemetry Indicators */}
        <div className="flex items-center gap-4 text-xs font-medium text-[#536B8F]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span className="text-[#0F1F3D] font-bold">2</span> Critical Zones
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F97316]" />
            <span className="text-[#0F1F3D] font-bold">4</span> High Susceptibility
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-[#0F1F3D] font-bold">35/36</span> IoT Sensors Online
          </div>
        </div>
      </div>

      {/* Main Large Map Area */}
      <div className="w-full">
        <LiveRiskMap />
      </div>

      {/* District Slope Telemetry Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-[#0F1F3D]">
            Monitored High-Vulnerability Sectors
          </h2>
          <span className="text-xs text-[#536B8F] font-medium">
            Showing {filteredZones.length} of {zoneDetails.length} Priority Sectors
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredZones.map((zone) => {
            const isCritical = zone.level === 'CRITICAL';
            return (
              <div
                key={zone.id}
                className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs hover:border-[#1769D2]/50 motion-card motion-card-hover flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono font-semibold text-[#536B8F] bg-[#F1F5F9] px-2 py-0.5 rounded">
                      {zone.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full transition-transform duration-150 group-hover:scale-[1.03] ${
                        isCritical
                          ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                          : 'bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]'
                      }`}
                    >
                      {zone.level} ({zone.riskScore})
                    </span>
                  </div>

                  <h3 className="text-[14.5px] font-bold text-[#0F1F3D] leading-tight group-hover:text-[#1769D2] transition-colors duration-150">
                    {zone.name}
                  </h3>
                  <p className="text-[12px] text-[#536B8F] mt-0.5">
                    {zone.district}, {zone.state}
                  </p>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#F1F5F9] text-xs">
                    <div className="bg-[#F8FAFC] p-2 rounded-lg transition-colors duration-150 group-hover:bg-[#F1F5F9]/60">
                      <span className="text-[10.5px] text-[#64748B] block">InSAR Velocity</span>
                      <span className="font-bold text-[#DC2626]">{zone.insarDeformation}</span>
                    </div>
                    <div className="bg-[#F8FAFC] p-2 rounded-lg transition-colors duration-150 group-hover:bg-[#F1F5F9]/60">
                      <span className="text-[10.5px] text-[#64748B] block">Soil Moisture</span>
                      <span className="font-bold text-[#0F1F3D]">{zone.soilMoisture}</span>
                    </div>
                    <div className="bg-[#F8FAFC] p-2 rounded-lg transition-colors duration-150 group-hover:bg-[#F1F5F9]/60">
                      <span className="text-[10.5px] text-[#64748B] block">24h Rainfall</span>
                      <span className="font-bold text-[#1769D2]">{zone.rainfall24h}</span>
                    </div>
                    <div className="bg-[#F8FAFC] p-2 rounded-lg transition-colors duration-150 group-hover:bg-[#F1F5F9]/60">
                      <span className="text-[10.5px] text-[#64748B] block">Slope Angle</span>
                      <span className="font-bold text-[#0F1F3D]">{zone.slope}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#10B981] font-semibold text-[11.5px]">
                    <Activity className="w-3.5 h-3.5" />
                    <span>{zone.sensorsOnline}/{zone.totalSensors} Sensors OK</span>
                  </div>
                  <button
                    type="button"
                    className="text-[#1769D2] font-semibold hover:underline flex items-center gap-0.5 text-[11.5px] motion-btn cursor-pointer"
                  >
                    <span>View Telemetry</span>
                    <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150 ease-premium" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
