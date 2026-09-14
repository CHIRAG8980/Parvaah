'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudFog, CloudRain, CloudLightning, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/api/client';
import { WeatherForecastResponse } from '../../lib/api/types';

function getWeatherDetails(conditionStr: string) {
  const lower = conditionStr.toLowerCase();
  if (lower.includes('clear')) return { label: 'Clear Sky', icon: Sun };
  if (lower.includes('partly')) return { label: 'Partly Cloudy', icon: Cloud };
  if (lower.includes('fog') || lower.includes('mist')) return { label: 'Fog / Mist', icon: CloudFog };
  if (lower.includes('drizzle')) return { label: 'Light Drizzle', icon: CloudRain };
  if (lower.includes('heavy') || lower.includes('violent')) return { label: 'Heavy Rain', icon: CloudRain };
  if (lower.includes('thunder')) return { label: 'Thunderstorm', icon: CloudLightning };
  if (lower.includes('rain')) return { label: 'Moderate Rain', icon: CloudRain };
  return { label: conditionStr || 'IMD Telemetry', icon: Cloud };
}

interface HeaderWeatherProps {
  lat: number;
  lon: number;
  city: string;
}

export const HeaderWeather: React.FC<HeaderWeatherProps> = ({ city }) => {
  const [rainfall24h, setRainfall24h] = useState<string>('--');
  const [condition, setCondition] = useState<string>('IMD Telemetry');
  const [loading, setLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    async function fetchImdWeather() {
      setLoading(true);
      try {
        const data = await apiClient.get<WeatherForecastResponse>(
          `/weather/forecast?district=${encodeURIComponent(city)}`
        );
        if (active && data) {
          const rain = data.rainfall_24h_mm ?? 0.0;
          setRainfall24h(`${rain.toFixed(1)} mm`);
          setCondition(data.imd_radar_station || 'IMD Radar Active');
          setHasError(false);
        }
      } catch {
        if (active) setHasError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchImdWeather();
    const interval = setInterval(fetchImdWeather, 180000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [city]);

  const WeatherIcon = getWeatherDetails(condition).icon;

  if (hasError) {
    return (
      <div className="hidden md:flex items-center gap-2 text-[13px] border-r border-[#E2E8F0] pr-5 select-none text-[#DC2626]">
        <div className="p-1.5 bg-[#FEF2F2] rounded-lg text-[#DC2626]">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-[#0F1F3D] max-w-[90px] truncate">{city}</span>
          <span className="text-[11px] text-[#DC2626] font-medium">IMD Feed Offline</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-2 text-[13px] border-r border-[#E2E8F0] pr-5 select-none">
      <div className="relative p-1.5 bg-[#EAF3FF] rounded-lg text-[#1769D2]">
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#1769D2]" /> : <WeatherIcon className="w-4 h-4" />}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-tight">
          <span className="font-semibold text-[#0F1F3D] max-w-[90px] truncate">{city}</span>
          <span className="font-bold text-[#1769D2]">{rainfall24h}</span>
        </div>
        <div className="flex items-center gap-1 leading-tight">
          <span className="text-[11.5px] text-[#536B8F] truncate max-w-[100px]">{condition}</span>
          <span className="text-[9px] font-bold text-[#10B981] bg-[#ECFDF5] px-1 rounded">IMD</span>
        </div>
      </div>
    </div>
  );
};
