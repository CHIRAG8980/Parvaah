'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { WeatherForecast } from '../../components/dashboard/WeatherForecast';
import { RecentRainfallChart } from '../../components/dashboard/RecentRainfallChart';
import {
  CloudRain,
  CloudLightning,
  Droplets,
  Wind,
  Compass,
  AlertTriangle,
  ChevronDown,
  Thermometer,
  ShieldAlert,
} from 'lucide-react';

interface StationForecast {
  district: string;
  state: string;
  elevation: string;
  currentTemp: string;
  rainTodayMm: number;
  rain72hProjectedMm: number;
  saturationIndex: number;
  cloudburstRisk: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
  windSpeed: string;
  status: string;
}

const stations: StationForecast[] = [
  {
    district: 'Sohra (Cherrapunji)',
    state: 'Meghalaya',
    elevation: '1,430 m',
    currentTemp: '16°C',
    rainTodayMm: 198,
    rain72hProjectedMm: 342,
    saturationIndex: 89,
    cloudburstRisk: 'VERY HIGH',
    windSpeed: '28 km/h SW',
    status: 'Extreme Runoff & Waterlogging',
  },
  {
    district: 'West Kameng (Bhalukpong)',
    state: 'Arunachal Pradesh',
    elevation: '2,130 m',
    currentTemp: '14°C',
    rainTodayMm: 178,
    rain72hProjectedMm: 290,
    saturationIndex: 86,
    cloudburstRisk: 'VERY HIGH',
    windSpeed: '18 km/h S',
    status: 'High Slope Pore Pressure',
  },
  {
    district: 'Ukhrul Central',
    state: 'Manipur',
    elevation: '1,660 m',
    currentTemp: '17°C',
    rainTodayMm: 164,
    rain72hProjectedMm: 245,
    saturationIndex: 84,
    cloudburstRisk: 'HIGH',
    windSpeed: '15 km/h E',
    status: 'Debris Flow Conditions',
  },
  {
    district: 'Dima Hasao (Haflong)',
    state: 'Assam',
    elevation: '968 m',
    currentTemp: '22°C',
    rainTodayMm: 138,
    rain72hProjectedMm: 210,
    saturationIndex: 76,
    cloudburstRisk: 'HIGH',
    windSpeed: '12 km/h S',
    status: 'High Surcharge on Hill Slopes',
  },
  {
    district: 'Shillong Metro',
    state: 'Meghalaya',
    elevation: '1,525 m',
    currentTemp: '18°C',
    rainTodayMm: 92,
    rain72hProjectedMm: 148,
    saturationIndex: 71,
    cloudburstRisk: 'MODERATE',
    windSpeed: '14 km/h SW',
    status: 'Moderate Runoff',
  },
  {
    district: 'Kohima Valley',
    state: 'Nagaland',
    elevation: '1,444 m',
    currentTemp: '19°C',
    rainTodayMm: 76,
    rain72hProjectedMm: 115,
    saturationIndex: 58,
    cloudburstRisk: 'MODERATE',
    windSpeed: '10 km/h W',
    status: 'Normal Drainage Rates',
  },
  {
    district: 'Aizawl Slopes',
    state: 'Mizoram',
    elevation: '1,132 m',
    currentTemp: '20°C',
    rainTodayMm: 68,
    rain72hProjectedMm: 98,
    saturationIndex: 52,
    cloudburstRisk: 'LOW',
    windSpeed: '8 km/h S',
    status: 'Stable Readings',
  },
  {
    district: 'Gangtok - Dikchu',
    state: 'Sikkim',
    elevation: '1,650 m',
    currentTemp: '15°C',
    rainTodayMm: 88,
    rain72hProjectedMm: 160,
    saturationIndex: 74,
    cloudburstRisk: 'HIGH',
    windSpeed: '22 km/h NE',
    status: 'Precautionary Standby',
  },
];

export default function ForecastPage() {
  const [selectedStation, setSelectedStation] = useState('All');

  const filteredStations = stations.filter(
    (s) => selectedStation === 'All' || s.state === selectedStation
  );

  return (
    <DashboardShell>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
            Meteorological Forecasting & Precipitation Radar
          </h1>
          <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
            IMD radar feeds, satellite precipitation estimates, and 72-hour landslide triggering rainfall thresholds
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF3FF] border border-[#BFDBFE] text-[#1769D2] text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1769D2] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1769D2]" />
          </span>
          <CloudLightning className="w-3.5 h-3.5 text-[#1769D2]" />
          <span>Doppler Weather Radar (Cherrapunji & Mohanbari) Online</span>
        </div>
      </div>

      {/* 2-Column Overview: 5-Day Forecast & Recent Rainfall Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 xl:col-span-6">
          <WeatherForecast />
        </div>
        <div className="lg:col-span-6 xl:col-span-6">
          <RecentRainfallChart />
        </div>
      </div>

      {/* District Meteorological Table */}
      <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs space-y-4 motion-card">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EBF1F8]">
          <div className="flex items-center gap-3">
            <h3 className="text-[16px] font-bold text-[#0F1F3D]">
              Automatic Weather Stations (AWS) Precipitation Telemetry
            </h3>
            <span className="text-xs bg-[#F1F5F9] text-[#536B8F] px-2 py-0.5 rounded font-mono">
              {filteredStations.length} Stations
            </span>
          </div>

          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="text-xs font-medium bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-1.5 text-[#0F1F3D] focus:outline-none motion-input cursor-pointer"
          >
            <option value="All">All States</option>
            <option value="Meghalaya">Meghalaya</option>
            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
            <option value="Assam">Assam</option>
            <option value="Manipur">Manipur</option>
            <option value="Nagaland">Nagaland</option>
            <option value="Mizoram">Mizoram</option>
            <option value="Sikkim">Sikkim</option>
          </select>
        </div>

        {/* Stations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#536B8F] border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Station / District</th>
                <th className="py-2.5 px-3 font-semibold">State & Elev.</th>
                <th className="py-2.5 px-3 font-semibold">Current Temp</th>
                <th className="py-2.5 px-3 font-semibold">24h Rainfall</th>
                <th className="py-2.5 px-3 font-semibold">72h Projected</th>
                <th className="py-2.5 px-3 font-semibold">Soil Saturation</th>
                <th className="py-2.5 px-3 font-semibold">Cloudburst Risk</th>
                <th className="py-2.5 px-3 font-semibold">Hydrological Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#0F1F3D]">
              {filteredStations.map((s) => {
                let riskBadge = 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]';
                if (s.cloudburstRisk === 'VERY HIGH') {
                  riskBadge = 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';
                } else if (s.cloudburstRisk === 'HIGH') {
                  riskBadge = 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]';
                } else if (s.cloudburstRisk === 'MODERATE') {
                  riskBadge = 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
                }

                return (
                  <tr key={s.district} className="hover:bg-[#F8FAFC] motion-row">
                    <td className="py-3 px-3 font-bold">{s.district}</td>
                    <td className="py-3 px-3 text-[#536B8F]">{s.state} ({s.elevation})</td>
                    <td className="py-3 px-3 font-semibold">{s.currentTemp}</td>
                    <td className="py-3 px-3 font-bold text-[#1769D2]">{s.rainTodayMm} mm</td>
                    <td className="py-3 px-3 font-semibold text-[#DC2626]">{s.rain72hProjectedMm} mm</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ease-out ${s.saturationIndex > 80 ? 'bg-[#EF4444]' : 'bg-[#1769D2]'}`}
                            style={{ width: `${s.saturationIndex}%` }}
                          />
                        </div>
                        <span className="font-bold">{s.saturationIndex}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${riskBadge}`}>
                        {s.cloudburstRisk}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#536B8F] font-medium">{s.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
