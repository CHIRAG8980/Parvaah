'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DistrictRiskData {
  district: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

const rawData: DistrictRiskData[] = [
  {
    district: 'Kameng',
    low: 5,
    medium: 9,
    high: 8,
    critical: 5,
  },
  {
    district: 'East Khasi\nHills',
    low: 8,
    medium: 7,
    high: 9,
    critical: 4,
  },
  {
    district: 'Dima Hasao',
    low: 11,
    medium: 9,
    high: 7,
    critical: 6,
  },
  {
    district: 'Ukhrul',
    low: 6,
    medium: 8,
    high: 6,
    critical: 7,
  },
  {
    district: 'Aizawl',
    low: 4,
    medium: 5,
    high: 5,
    critical: 2,
  },
  {
    district: 'Kohima',
    low: 7,
    medium: 6,
    high: 4,
    critical: 3,
  },
];

export const DistrictRiskChart: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData =
    selectedDistrict === 'All Districts'
      ? rawData
      : rawData.filter((d) => d.district.replace('\n', ' ').includes(selectedDistrict));

  return (
    <div className="bg-white rounded-xl border border-[#DCE6F2] shadow-xs flex flex-col p-5 h-full motion-card">
      {/* Header with Dropdown */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#EBF1F8]">
        <h3 className="text-[16px] font-bold text-[#0F1F3D]">
          Risk Distribution by District
        </h3>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#0F1F3D] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#DCE6F2] rounded-lg transition-all duration-150 ease-premium motion-btn cursor-pointer"
          >
            <span>{selectedDistrict}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#536B8F] motion-rotate-180 ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white border border-[#DCE6F2] rounded-xl shadow-xl py-1 z-30 text-xs motion-dropdown motion-dropdown-right">
              {['All Districts', 'Kameng', 'East Khasi Hills', 'Dima Hasao', 'Ukhrul', 'Aizawl', 'Kohima'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setSelectedDistrict(d);
                    setShowDropdown(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left transition-colors duration-150 ${
                    selectedDistrict === d ? 'text-[#1769D2] font-semibold bg-[#EAF3FF]' : 'text-[#0F1F3D] hover:bg-[#F4F8FC]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Area */}
      <div className="w-full h-[220px] pt-4">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              barSize={28}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="district"
                tick={{ fontSize: 11, fill: '#536B8F' }}
                interval={0}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 40]}
                ticks={[0, 10, 20, 30, 40]}
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
              />
              {/* Stacked Bars with Semantic Risk Colors */}
              <Bar dataKey="low" stackId="risk" fill="#10B981" radius={[0, 0, 0, 0]} name="Low Risk" animationDuration={400} animationEasing="ease-out" />
              <Bar dataKey="medium" stackId="risk" fill="#F59E0B" name="Medium Risk" animationDuration={400} animationEasing="ease-out" />
              <Bar dataKey="high" stackId="risk" fill="#F97316" name="High Risk" animationDuration={400} animationEasing="ease-out" />
              <Bar dataKey="critical" stackId="risk" fill="#EF4444" radius={[3, 3, 0, 0]} name="Critical Risk" animationDuration={400} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[#8497B0]">
            Loading risk analytics...
          </div>
        )}
      </div>
    </div>
  );
};
