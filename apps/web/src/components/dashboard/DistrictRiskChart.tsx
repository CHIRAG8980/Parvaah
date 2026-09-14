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
import { useDistricts } from '../../hooks/useDistricts';

interface ChartRow {
  district: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export const DistrictRiskChart: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: districtsData, isLoading } = useDistricts();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData: ChartRow[] = (districtsData || []).map((d) => {
    const isCritical = d.risk_level === 'CRITICAL';
    const isHigh = d.risk_level === 'HIGH';
    const isMedium = d.risk_level === 'MEDIUM';

    const score = d.risk_score !== null && d.risk_score !== undefined ? Math.round(d.risk_score) : 0;
    return {
      district: d.district,
      critical: isCritical ? score : 0,
      high: isHigh ? score : 0,
      medium: isMedium ? score : 0,
      low: !isCritical && !isHigh && !isMedium ? score : 0,
    };
  });

  const filteredData =
    selectedDistrict === 'All Districts'
      ? chartData
      : chartData.filter((d) => d.district === selectedDistrict);

  return (
    <div className="bg-white rounded-xl border border-[#DCE6F2] shadow-xs flex flex-col p-5 h-full motion-card">
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
            <div className="absolute right-0 mt-1.5 w-44 bg-white border border-[#DCE6F2] rounded-xl shadow-xl py-1 z-30 text-xs motion-dropdown motion-dropdown-right max-h-56 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedDistrict('All Districts');
                  setShowDropdown(false);
                }}
                className={`w-full px-3 py-1.5 text-left transition-colors duration-150 ${
                  selectedDistrict === 'All Districts' ? 'text-[#1769D2] font-semibold bg-[#EAF3FF]' : 'text-[#0F1F3D] hover:bg-[#F4F8FC]'
                }`}
              >
                All Districts
              </button>
              {chartData.map((d) => (
                <button
                  key={d.district}
                  type="button"
                  onClick={() => {
                    setSelectedDistrict(d.district);
                    setShowDropdown(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left transition-colors duration-150 ${
                    selectedDistrict === d.district ? 'text-[#1769D2] font-semibold bg-[#EAF3FF]' : 'text-[#0F1F3D] hover:bg-[#F4F8FC]'
                  }`}
                >
                  {d.district}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-[220px] pt-4">
        {isMounted && !isLoading ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              barSize={24}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="district"
                tick={{ fontSize: 10.5, fill: '#536B8F' }}
                interval={0}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
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
              <Bar dataKey="low" stackId="risk" fill="#10B981" name="Low Hazard" animationDuration={400} />
              <Bar dataKey="medium" stackId="risk" fill="#F59E0B" name="Moderate Hazard" animationDuration={400} />
              <Bar dataKey="high" stackId="risk" fill="#F97316" name="High Hazard" animationDuration={400} />
              <Bar dataKey="critical" stackId="risk" fill="#EF4444" radius={[3, 3, 0, 0]} name="Critical Hazard" animationDuration={400} />
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
