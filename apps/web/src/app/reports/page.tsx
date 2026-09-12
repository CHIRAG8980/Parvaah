'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  FileCheck,
  Share2,
  BarChart,
} from 'lucide-react';

interface ReportItem {
  id: string;
  title: string;
  category: 'Daily SITREP' | 'Geotechnical Audit' | 'Infrastructure' | 'Seasonal Assessment';
  date: string;
  agency: string;
  fileSize: string;
  format: 'PDF' | 'CSV' | 'GeoJSON';
  status: 'Published' | 'Verified' | 'Archived';
  description: string;
}

const reports: ReportItem[] = [
  {
    id: 'REP-2025-0911-01',
    title: 'Daily Situation Report (SITREP) – North East Region Operations',
    category: 'Daily SITREP',
    date: '11 Sep 2025',
    agency: 'State Disaster Management Authority (SDMA) Inter-Agency Cell',
    fileSize: '4.2 MB',
    format: 'PDF',
    status: 'Published',
    description: 'Consolidated overview of 23 active alerts, 12 impacted highway sectors, rainfall anomalies, and SDRF taskings.',
  },
  {
    id: 'REP-2025-0910-04',
    title: 'InSAR Satellite Deformation & Slope Instability Audit: Kameng Corridor',
    category: 'Geotechnical Audit',
    date: '10 Sep 2025',
    agency: 'Geological Survey of India (GSI) & ISRO Remote Sensing Wing',
    fileSize: '12.8 MB',
    format: 'PDF',
    status: 'Verified',
    description: 'Interferometric synthetic aperture radar (Sentinel-1) ground displacement velocity time-series analysis for NH-13.',
  },
  {
    id: 'REP-2025-0909-02',
    title: 'Strategic Highway Infrastructure Vulnerability & Clearance Registry',
    category: 'Infrastructure',
    date: '09 Sep 2025',
    agency: 'Border Roads Organisation (BRO) Taskforce 89',
    fileSize: '2.1 MB',
    format: 'CSV',
    status: 'Verified',
    description: 'Blockage and clearance log covering 482 monitored roads, detour routes, and heavy excavator deployment logs.',
  },
  {
    id: 'REP-2025-0908-01',
    title: 'Monsoon 2025 Rainfall Runoff & Hydrological Saturation Index Bulletin',
    category: 'Seasonal Assessment',
    date: '08 Sep 2025',
    agency: 'India Meteorological Department (IMD) Regional Met Centre Guwahati',
    fileSize: '6.5 MB',
    format: 'PDF',
    status: 'Published',
    description: 'Cumulative 72-hour rainfall analysis, AWS station telemetry, and cloudburst probability forecasts across 8 states.',
  },
  {
    id: 'REP-2025-0905-03',
    title: 'GIS Landslide Hazard Zonation Map Vectors (1:10,000 Scale)',
    category: 'Geotechnical Audit',
    date: '05 Sep 2025',
    agency: 'North Eastern Space Applications Centre (NESAC)',
    fileSize: '34.5 MB',
    format: 'GeoJSON',
    status: 'Verified',
    description: 'High-precision spatial boundary polygons, slope gradient classifications, and lithological susceptibility zones.',
  },
];

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (title: string, format: string) => {
    alert(`Downloading ${title} (${format}). Preparing secure government authenticated export...`);
  };

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
            Disaster Management Bulletins & Analytics Reports
          </h1>
          <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
            Automated SDMA daily situation reports, geotechnical incident logs, and vulnerability audits
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Compiling automated SITREP for the last 24 hours across all 8 states...')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1769D2] hover:bg-[#1257B2] text-white text-xs font-semibold rounded-lg shadow-sm motion-btn cursor-pointer"
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Generate SITREP Bulletin</span>
        </button>
      </div>

      {/* Reports Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs motion-card">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#758CA8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title, agency, or ID..."
              className="w-full text-xs bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg pl-9 pr-3 py-2 text-[#0F1F3D] focus:outline-none motion-input"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-2 text-[#0F1F3D] focus:outline-none font-medium motion-input cursor-pointer"
          >
            <option value="All">All Report Categories</option>
            <option value="Daily SITREP">Daily SITREP</option>
            <option value="Geotechnical Audit">Geotechnical Audit</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Seasonal Assessment">Seasonal Assessment</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3.5">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs hover:border-[#1769D2]/40 motion-card motion-card-hover group flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5 flex-1">
              <div className="p-3 bg-[#EAF3FF] rounded-xl text-[#1769D2] flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105">
                <FileText className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-[#536B8F] bg-[#F1F5F9] px-2 py-0.5 rounded">
                    {report.id}
                  </span>
                  <span className="text-[11px] font-bold text-[#1769D2] bg-[#EAF3FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                    {report.category}
                  </span>
                  <span className="text-[11px] font-semibold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                    ✓ {report.status}
                  </span>
                </div>

                <h3 className="text-[15px] font-bold text-[#0F1F3D]">
                  {report.title}
                </h3>
                <p className="text-xs text-[#536B8F] leading-relaxed">
                  {report.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-[#758CA8] pt-1">
                  <span><strong>Agency:</strong> {report.agency}</span>
                  <span>•</span>
                  <span><strong>Date:</strong> {report.date}</span>
                  <span>•</span>
                  <span><strong>Size:</strong> {report.fileSize} ({report.format})</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleDownload(report.title, report.format)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1769D2] hover:bg-[#1257B2] text-white text-xs font-semibold rounded-lg shadow-2xs motion-btn cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {report.format}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
