'use client';

import React from 'react';
import Link from 'next/link';
import {
  CloudRain,
  CloudSun,
  CloudDrizzle,
  Sun,
  Droplets,
  ArrowRight,
} from 'lucide-react';

interface DayForecast {
  day: string;
  date: string;
  icon: React.ElementType;
  iconColor: string;
  temp: string;
  condition: string;
  precipitation: string;
}

const forecastDays: DayForecast[] = [
  {
    day: 'Thu',
    date: '11 Sep',
    icon: CloudRain,
    iconColor: 'text-[#1769D2]',
    temp: '18° / 24°',
    condition: 'Heavy Rain',
    precipitation: '85%',
  },
  {
    day: 'Fri',
    date: '12 Sep',
    icon: CloudSun,
    iconColor: 'text-[#F59E0B]',
    temp: '17° / 23°',
    condition: 'Moderate',
    precipitation: '60%',
  },
  {
    day: 'Sat',
    date: '13 Sep',
    icon: CloudDrizzle,
    iconColor: 'text-[#0284C7]',
    temp: '18° / 25°',
    condition: 'Light Rain',
    precipitation: '40%',
  },
  {
    day: 'Sun',
    date: '14 Sep',
    icon: CloudSun,
    iconColor: 'text-[#F59E0B]',
    temp: '19° / 26°',
    condition: 'Partly Cloudy',
    precipitation: '20%',
  },
  {
    day: 'Mon',
    date: '15 Sep',
    icon: Sun,
    iconColor: 'text-[#EAB308]',
    temp: '20° / 27°',
    condition: 'Clear',
    precipitation: '10%',
  },
];

export const WeatherForecast: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-[#DCE6F2] shadow-xs flex flex-col p-5 motion-card">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#EBF1F8]">
        <h3 className="text-[16px] font-bold text-[#0F1F3D]">
          Weather Forecast (Next 5 Days)
        </h3>
        <Link
          href="/forecast"
          className="text-[12px] font-semibold text-[#1769D2] hover:text-[#1257B2] flex items-center gap-1 transition-colors duration-150 group"
        >
          <span>View Full Forecast</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150 ease-premium" />
        </Link>
      </div>

      {/* 5 Daily Columns */}
      <div className="grid grid-cols-5 gap-2 pt-4">
        {forecastDays.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-[#F8FAFC] transition-all duration-150 ease-premium hover:-translate-y-0.5 cursor-pointer group"
            >
              {/* Day & Date */}
              <span className="text-[13px] font-bold text-[#0F1F3D] leading-tight">
                {f.day}
              </span>
              <span className="text-[11px] text-[#758CA8] font-normal mb-2 leading-none">
                {f.date}
              </span>

              {/* Weather Icon */}
              <div className="w-8 h-8 flex items-center justify-center mb-2 transition-transform duration-150 group-hover:scale-110">
                <Icon className={`w-7 h-7 ${f.iconColor}`} />
              </div>

              {/* Temperature */}
              <span className="text-[12px] font-bold text-[#0F1F3D] whitespace-nowrap mb-0.5">
                {f.temp}
              </span>

              {/* Condition */}
              <span className="text-[10.5px] font-medium text-[#536B8F] leading-tight mb-1 line-clamp-1">
                {f.condition}
              </span>

              {/* Precipitation */}
              <div className="flex items-center gap-0.5 text-[10.5px] font-semibold text-[#1769D2]">
                <Droplets className="w-3 h-3 text-[#1769D2]" />
                <span>{f.precipitation}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
