'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useRoads } from '../../hooks/useRoads';

export const RoadInfrastructureChart: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { roads, isLoading } = useRoads();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalRoads = roads.length;
  const operationalCount = roads.filter((r) => r.status === 'operational' || r.status === 'open').length;
  const atRiskCount = roads.filter((r) => r.status === 'at_risk').length;
  const blockedCount = roads.filter((r) => r.status === 'blocked').length;

  const operationalPct = totalRoads > 0 ? Math.round((operationalCount / totalRoads) * 100) : 0;
  const atRiskPct = totalRoads > 0 ? Math.round((atRiskCount / totalRoads) * 100) : 0;
  const blockedPct = totalRoads > 0 ? Math.round((blockedCount / totalRoads) * 100) : 0;

  const pieData = [
    { name: 'Operational', value: operationalCount, color: '#10B981' },
    { name: 'Partially Blocked', value: atRiskCount, color: '#F59E0B' },
    { name: 'Blocked', value: blockedCount, color: '#EF4444' },
  ];

  const roadData = [
    {
      name: 'Operational',
      count: operationalCount,
      percentage: `${operationalPct}%`,
      dotColor: 'bg-[#10B981]',
    },
    {
      name: 'Partially Blocked',
      count: atRiskCount,
      percentage: `${atRiskPct}%`,
      dotColor: 'bg-[#F59E0B]',
    },
    {
      name: 'Blocked',
      count: blockedCount,
      percentage: `${blockedPct}%`,
      dotColor: 'bg-[#EF4444]',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#DCE6F2] shadow-xs flex flex-col p-5 h-full motion-card">
      <div className="flex items-center justify-between pb-3.5 border-b border-[#EBF1F8]">
        <h3 className="text-[16px] font-bold text-[#0F1F3D]">
          Road & Infrastructure Status
        </h3>
        <Link
          href="/roads"
          className="text-[12px] font-semibold text-[#1769D2] hover:text-[#1257B2] flex items-center gap-1 transition-colors duration-150 group"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150 ease-premium" />
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 flex-1">
        <div className="relative w-[150px] h-[150px] flex-shrink-0 flex items-center justify-center">
          {isMounted && !isLoading ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                  animationDuration={400}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-[136px] h-[136px] rounded-full border-8 border-slate-200 animate-pulse" />
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[24px] font-bold text-[#0F1F3D] leading-none">
              {totalRoads}
            </span>
            <span className="text-[11px] font-medium text-[#758CA8] mt-0.5">
              Total Corridors
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1 w-full pl-2">
          {roadData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-[12.5px] p-1.5 rounded-lg hover:bg-[#F8FAFC] transition-colors duration-150 motion-row cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${item.dotColor} flex-shrink-0`} />
                <span className="font-semibold text-[#0F1F3D]">{item.count}</span>
                <span className="text-[#536B8F] font-normal">{item.name}</span>
              </div>
              <span className="font-semibold text-[#536B8F] text-[12px]">
                {item.percentage}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
