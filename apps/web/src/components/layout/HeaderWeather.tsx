'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudFog, CloudRain, CloudLightning, Loader2, AlertCircle } from 'lucide-react';

function getWeatherDetails(code: number) {
  if (code === 0) return { label: 'Clear Sky', icon: Sun };
  if (code >= 1 && code <= 3) return { label: code === 3 ? 'Overcast' : 'Partly Cloudy', icon: Cloud };
  if (code === 45 || code === 48) return { label: 'Fog / Mist', icon: CloudFog };
  if (code >= 51 && code <= 55) return { label: 'Light Drizzle', icon: CloudRain };
  if (code >= 61 && code <= 65) return { label: code === 65 ? 'Heavy Rain' : 'Moderate Rain', icon: CloudRain };
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', icon: CloudRain };
  if (code >= 95) return { label: 'Thunderstorm', icon: CloudLightning };
  return { label: 'Light Rain', icon: CloudRain };
}

interface HeaderWeatherProps {
  lat: number;
  lon: number;
  city: string;
}

export const HeaderWeather: React.FC<HeaderWeatherProps> = ({ lat, lon, city }) => {
  const [temp, setTemp] = useState<string>('--');
  const [condition, setCondition] = useState<string>('Live Feed');
  const [code, setCode] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    async function fetchWeather() {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
        );
        if (!res.ok) {
          if (active) setHasError(true);
          return;
        }
        const json = await res.json();
        if (active && json.current) {
          const currentTemp = Math.round(json.current.temperature_2m);
          const currentCode = json.current.weather_code ?? 0;
          setTemp(`${currentTemp}°C`);
          setCode(currentCode);
          setCondition(getWeatherDetails(currentCode).label);
          setHasError(false);
        }
      } catch {
        if (active) setHasError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, 180000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [lat, lon]);

  const WeatherIcon = getWeatherDetails(code).icon;

  if (hasError) {
    return (
      <div className="hidden md:flex items-center gap-2 text-[13px] border-r border-[#E2E8F0] pr-5 select-none text-[#DC2626]">
        <div className="p-1.5 bg-[#FEF2F2] rounded-lg text-[#DC2626]">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-[#0F1F3D] max-w-[90px] truncate">{city}</span>
          <span className="text-[11px] text-[#DC2626] font-medium">Telemetry Offline</span>
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
          <span className="font-bold text-[#1769D2]">{temp}</span>
        </div>
        <div className="flex items-center gap-1 leading-tight">
          <span className="text-[11.5px] text-[#536B8F] truncate max-w-[100px]">{condition}</span>
          <span className="text-[9px] font-bold text-[#10B981] bg-[#ECFDF5] px-1 rounded">LIVE</span>
        </div>
      </div>
    </div>
  );
};
