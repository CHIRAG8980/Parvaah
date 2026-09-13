'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useWeather } from '../../hooks/useWeather';

export const RecentRainfallChart: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { data, isLoading } = useWeather();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = (data?.hourly_trend || []).map((point) => ({
    time: point.hour_label,
    observed: !point.is_projected ? point.rainfall_mm : undefined,
    forecast: point.is_projected ? point.rainfall_mm : undefined,
  }));

  const latestReading = data?.rainfall_24h_mm ?? 0;

  return (
    <div className="bg-white rounded-xl border border-[#DCE6F2] shadow-xs flex flex-col p-5 h-full relative motion-card">
      <div className="flex items-center justify-between pb-3.5 border-b border-[#EBF1F8]">
        <h3 className="text-[16px] font-bold text-[#0F1F3D]">
          Recent Rainfall (mm)
        </h3>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-[#1769D2] rounded" />
            <span className="text-[#0F1F3D]">Observed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t border-dashed border-[#38BDF8]" />
            <span className="text-[#536B8F]">Forecast</span>
          </div>
        </div>
      </div>

      <div className="absolute top-[68px] right-8 z-10 bg-white/95 backdrop-blur-xs border border-[#DCE6F2] shadow-sm rounded-lg px-2.5 py-1 text-right pointer-events-none transition-transform duration-180 hover:scale-105">
        <div className="text-[14px] font-bold text-[#1769D2] leading-none">
          {latestReading.toFixed(0)} mm
        </div>
        <div className="text-[10px] text-[#758CA8] leading-none mt-0.5">
          24h Cumulative
        </div>
      </div>

      <div className="w-full h-[220px] pt-4">
        {isMounted && !isLoading ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 15, left: -20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="rainfallGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1769D2" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#1769D2" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10.5, fill: '#536B8F' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 150]}
                ticks={[0, 30, 60, 90, 120, 150]}
                tick={{ fontSize: 11, fill: '#536B8F' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #DCE6F2',
                  boxShadow: '0 4px 12px rgba(15, 35, 70, 0.08)',
                  fontSize: '12px',
                }}
                formatter={(value: unknown) => [`${Number(value || 0).toFixed(1)} mm`, 'Precipitation']}
              />
              <Area
                type="monotone"
                dataKey="observed"
                stroke="#1769D2"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#rainfallGradient)"
                name="Observed"
                animationDuration={400}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#38BDF8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                name="Forecast"
                animationDuration={400}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[#8497B0]">
            Loading rainfall telemetry...
          </div>
        )}
      </div>
    </div>
  );
};
