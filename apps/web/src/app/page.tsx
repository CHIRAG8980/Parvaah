'use client';

import React from 'react';
import { DashboardShell } from '../components/layout/DashboardShell';
import { HeaderSection } from '../components/dashboard/HeaderSection';
import { KpiSummaryCards } from '../components/dashboard/KpiSummaryCards';
import { LiveRiskMap } from '../components/map/LiveRiskMap';
import { RecentAlerts } from '../components/dashboard/RecentAlerts';
import { WeatherForecast } from '../components/dashboard/WeatherForecast';
import { DistrictRiskChart } from '../components/dashboard/DistrictRiskChart';
import { RecentRainfallChart } from '../components/dashboard/RecentRainfallChart';
import { RoadInfrastructureChart } from '../components/dashboard/RoadInfrastructureChart';
import { ModelBreakdownCard } from '../components/dashboard/ModelBreakdownCard';

export default function DashboardPage() {
  return (
    <DashboardShell>
      {/* Main Title & Live System Status */}
      <HeaderSection />

      {/* 4 KPI Summary Cards */}
      <KpiSummaryCards />

      {/* Main Content Grid: Live Map (Left ~70%) + Alerts & Forecast (Right ~30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Live Risk Map Section */}
        <div className="lg:col-span-8 xl:col-span-8">
          <LiveRiskMap />
        </div>

        {/* Right Information Panels */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-5">
          <RecentAlerts />
          <WeatherForecast />
        </div>
      </div>

      {/* 4-Model AI/ML Sovereign Ensemble Live Breakdown */}
      <ModelBreakdownCard />

      {/* Analytics Section: 3 Comprehensive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <DistrictRiskChart />
        <RecentRainfallChart />
        <RoadInfrastructureChart />
      </div>
    </DashboardShell>
  );
}

