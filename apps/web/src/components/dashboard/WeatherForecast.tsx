'use client';

import React from 'react';
import Link from 'next/link';
import {
  CloudRain,
  CloudSun,
  Sun,
  CloudLightning,
  Droplets,
  ArrowRight,
  Cloud,
} from 'lucide-react';
import { useWeather } from '../../hooks/useWeather';

function getWeatherIcon(condition: string) {
  const lower = condition.toLowerCase();
  if (lower.includes('thunder') || lower.includes('storm')) {
    return { icon: CloudLightning, color: 'text-[#8B5CF6]' };
  }
  if (lower.includes('heavy rain') || lower.includes('torrential')) {
    return { icon: CloudRain, color: 'text-[#DC2626]' };
  }
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) {
    return { icon: CloudRain, color: 'text-[#1769D2]' };
  }
  if (lower.includes('cloud') || lower.includes('overcast')) {
    return { icon: Cloud, color: 'text-[#64748B]' };
  }
  if (lower.includes('sun') || lower.includes('clear')) {
    return { icon: Sun, color: 'text-[#F59E0B]' };
  }
  return { icon: CloudSun, color: 'text-[#0284C7]' };
}

export const WeatherForecast: React.FC = () => {
  const { data, isLoading, isError } = useWeather();

  const days = data?.forecast_days?.slice(0, 5) || [];

  return (
    <div className="bg-white rounded-xl border border-[#DCE6F2] shadow-xs flex flex-col p-5 motion-card">
      <div className="flex items-center justify-between pb-3.5 border-b border-[#EBF1F8]">
        <div>
          <h3 className="text-[16px] font-bold text-[#0F1F3D]">
            Weather Forecast (Next 5 Days)
          </h3>
          {data?.imd_radar_station && (
            <span className="text-[11px] text-[#758CA8] font-medium">
              Radar: {data.imd_radar_station}
            </span>
          )}
        </div>
        <Link
          href="/forecast"
          className="text-[12px] font-semibold text-[#1769D2] hover:text-[#1257B2] flex items-center gap-1 transition-colors duration-150 group"
        >
          <span>View Full Forecast</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150 ease-premium" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-5 gap-2 pt-4">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="flex flex-col items-center p-2 rounded-lg animate-pulse space-y-2">
              <div className="w-8 h-3 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-full bg-slate-100" />
              <div className="w-10 h-3 bg-slate-200 rounded" />
              <div className="w-12 h-2.5 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="py-6 text-center text-xs text-[#DC2626]">
          Unable to load meteorological forecast
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2 pt-4">
          {days.map((f, idx) => {
            const { icon: WeatherIcon, color: iconColor } = getWeatherIcon(f.weather_condition);

            return (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-[#F8FAFC] transition-all duration-150 ease-premium hover:-translate-y-0.5 cursor-pointer group"
              >
                <span className="text-[13px] font-bold text-[#0F1F3D] leading-tight">
                  {f.day_label}
                </span>
                <span className="text-[11px] text-[#758CA8] font-normal mb-2 leading-none">
                  {f.date_str}
                </span>

                <div className="w-8 h-8 flex items-center justify-center mb-2 transition-transform duration-150 group-hover:scale-110">
                  <WeatherIcon className={`w-7 h-7 ${iconColor}`} />
                </div>

                <span className="text-[12px] font-bold text-[#0F1F3D] whitespace-nowrap mb-0.5">
                  {Math.round(f.temp_c)}°C
                </span>

                <span className="text-[10.5px] font-medium text-[#536B8F] leading-tight mb-1 line-clamp-1">
                  {f.weather_condition}
                </span>

                <div className="flex items-center gap-0.5 text-[10.5px] font-semibold text-[#1769D2]">
                  <Droplets className="w-3 h-3 text-[#1769D2]" />
                  <span>{f.projected_rainfall_mm} mm</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
