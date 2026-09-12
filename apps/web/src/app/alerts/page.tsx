'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldCheck,
  Search,
  Filter,
  Radio,
  Send,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Clock,
  Car,
} from 'lucide-react';

interface AlertItem {
  id: string;
  title: string;
  location: string;
  state: string;
  time: string;
  date: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Info';
  status: 'Active' | 'Investigating' | 'Resolved';
  triggerReason: string;
  rainfall24h: string;
  actionRequired: string;
  affectedInfrastructure: string;
}

const initialAlerts: AlertItem[] = [
  {
    id: 'ALT-NER-0941',
    title: 'High landslide risk predicted – Multiple Slope Cracks',
    location: 'Kameng Sector, West Kameng',
    state: 'Arunachal Pradesh',
    time: '10:12 AM',
    date: '11 Sep 2025',
    severity: 'Critical',
    status: 'Active',
    triggerReason: 'Rainfall exceeded 178mm in 24h; InSAR surface displacement -24.6mm/yr',
    rainfall24h: '178 mm',
    actionRequired: 'Immediate evacuation of downhill settlements & vehicular halt on NH-13',
    affectedInfrastructure: 'NH-13 Trans-Arunachal Highway (km 42-48)',
  },
  {
    id: 'ALT-NER-0940',
    title: 'Increased soil moisture & pore water pressure',
    location: 'Sohra Canyon, East Khasi Hills',
    state: 'Meghalaya',
    time: '09:48 AM',
    date: '11 Sep 2025',
    severity: 'High',
    status: 'Active',
    triggerReason: 'Soil moisture saturation reached 89%; continuous heavy rainfall',
    rainfall24h: '142 mm',
    actionRequired: 'District emergency operations center alerted; SDRF units on 15-min standby',
    affectedInfrastructure: 'Shillong-Sohra Scenic Link (Sector 4)',
  },
  {
    id: 'ALT-NER-0939',
    title: 'Multiple active debris flows reported on slope cut',
    location: 'Ukhrul Central Escarpment',
    state: 'Manipur',
    time: '09:20 AM',
    date: '11 Sep 2025',
    severity: 'Critical',
    status: 'Active',
    triggerReason: 'Mudslides triggered by 164mm precipitation; structural retaining wall compromised',
    rainfall24h: '164 mm',
    actionRequired: 'Section cordoned off; heavy earth-moving equipment mobilized',
    affectedInfrastructure: 'State Highway 3 (Ukhrul - Jessami)',
  },
  {
    id: 'ALT-NER-0938',
    title: 'Heavy rainfall warning & runoff surcharge expected (24h)',
    location: 'Haflong Hill Cut corridor, Dima Hasao',
    state: 'Assam',
    time: '08:55 AM',
    date: '11 Sep 2025',
    severity: 'Medium',
    status: 'Investigating',
    triggerReason: 'Continuous cloudburst plume over Barail Range with 138mm accumulation',
    rainfall24h: '138 mm',
    actionRequired: 'Preemptive ditch clearance; visual patrol on Lumding-Badarpur rail corridor',
    affectedInfrastructure: 'Hill section railway track & NH-54 link',
  },
  {
    id: 'ALT-NER-0937',
    title: 'Surface creep detected on highway cut slope',
    location: 'Churachandpur Ridge',
    state: 'Manipur',
    time: '08:42 AM',
    date: '11 Sep 2025',
    severity: 'High',
    status: 'Investigating',
    triggerReason: 'Inclinometer sensor cluster S-08 recorded 4.2mm lateral displacement',
    rainfall24h: '112 mm',
    actionRequired: 'Geotechnical inspection team dispatched from Imphal HQ',
    affectedInfrastructure: 'Tiddim Road (NH-102B)',
  },
  {
    id: 'ALT-NER-0936',
    title: 'Road clearance completed – Controlled traffic resumed',
    location: 'NH-2, Dimapur - Kohima Corridor',
    state: 'Nagaland',
    time: '08:30 AM',
    date: '11 Sep 2025',
    severity: 'Info',
    status: 'Resolved',
    triggerReason: 'Minor rockfall cleared by Border Roads Organisation (BRO) Taskforce 89',
    rainfall24h: '76 mm',
    actionRequired: 'All-clear broadcast issued; speed limit restricted to 25 km/h',
    affectedInfrastructure: 'NH-2 (km 118)',
  },
  {
    id: 'ALT-NER-0935',
    title: 'Slope retaining gabion wall inspection required',
    location: 'Aizawl North Slopes',
    state: 'Mizoram',
    time: '07:15 AM',
    date: '11 Sep 2025',
    severity: 'Medium',
    status: 'Active',
    triggerReason: 'Seepage lines visible after 68mm overnight rainfall',
    rainfall24h: '68 mm',
    actionRequired: 'PWD engineers requested to verify drainage weep holes',
    affectedInfrastructure: 'Aizawl Ring Road',
  },
  {
    id: 'ALT-NER-0934',
    title: 'Precautionary travel advisory issued for high passes',
    location: 'Tawang Pass Escarpment',
    state: 'Arunachal Pradesh',
    time: '06:30 AM',
    date: '11 Sep 2025',
    severity: 'Medium',
    status: 'Active',
    triggerReason: 'Combined light rainfall and freeze-thaw rock loosening',
    rainfall24h: '52 mm',
    actionRequired: 'Border Roads Organisation advisory posted on state travel portal',
    affectedInfrastructure: 'Balipara-Charduar-Tawang Road',
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = selectedSeverity === 'All' || alert.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'All' || alert.status === selectedStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleResolveAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Resolved' } : a))
    );
  };

  return (
    <DashboardShell>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0F1F3D] tracking-tight leading-tight">
            Disaster Alerts & Incident Command Log
          </h1>
          <p className="text-[13.5px] text-[#536B8F] mt-1 font-normal">
            Real-time early warnings, geotechnical triggers, and emergency response coordination
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => alert('Emergency Broadcast System: SMS and WhatsApp alerts dispatched to registered District Magistrates.')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-lg shadow-sm transition-all duration-150 ease-premium motion-btn cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Broadcast Warning</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card motion-card-hover select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">Critical Alerts</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">2</div>
          <span className="text-[11px] text-[#DC2626] font-medium">Immediate Evacuation</span>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card motion-card-hover select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">High Risk Alerts</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">2</div>
          <span className="text-[11px] text-[#EA580C] font-medium">SDRF Standby</span>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card motion-card-hover select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">Roads Under Advisory</span>
            <Car className="w-4 h-4 text-[#1769D2]" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">12</div>
          <span className="text-[11px] text-[#536B8F] font-medium">Corridors Monitored</span>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 shadow-xs motion-card motion-card-hover select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#536B8F]">Resolved Today</span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-[24px] font-bold text-[#0F1F3D] mt-1">1</div>
          <span className="text-[11px] text-[#16A34A] font-medium">NH-2 Cleared</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#DCE6F2] p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs motion-card">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#758CA8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alert by district, highway, or ID..."
              className="w-full text-xs bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg pl-9 pr-3 py-2 text-[#0F1F3D] focus:outline-none focus:ring-2 focus:ring-[#1769D2]/20 focus:border-[#1769D2] focus:bg-white motion-input"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-2 text-[#0F1F3D] focus:outline-none font-medium motion-input cursor-pointer"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
            <option value="Info">Info Only</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg px-3 py-2 text-[#0F1F3D] focus:outline-none font-medium motion-input cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alert Feed Items */}
      <div className="space-y-3.5">
        {filteredAlerts.map((item) => {
          let severityBadge = 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';
          let icon = <AlertTriangle className="w-5 h-5 text-[#EF4444]" />;

          if (item.severity === 'High') {
            severityBadge = 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]';
            icon = <AlertCircle className="w-5 h-5 text-[#F97316]" />;
          } else if (item.severity === 'Medium') {
            severityBadge = 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
            icon = <AlertCircle className="w-5 h-5 text-[#F59E0B]" />;
          } else if (item.severity === 'Info') {
            severityBadge = 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';
            icon = <Info className="w-5 h-5 text-[#3B82F6]" />;
          }

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs hover:border-[#1769D2]/40 motion-card motion-card-hover flex flex-col md:flex-row md:items-start justify-between gap-5 group"
            >
              <div className="flex items-start gap-4 flex-1">
                {/* Severity Icon Container */}
                <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex-shrink-0 mt-0.5 transition-transform duration-150 group-hover:scale-105">
                  {icon}
                </div>

                {/* Content */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-[#536B8F] bg-[#F1F5F9] px-2 py-0.5 rounded">
                      {item.id}
                    </span>
                    <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${severityBadge}`}>
                      {item.severity}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-150 ${
                        item.status === 'Active'
                          ? 'bg-[#FEF2F2] text-[#DC2626]'
                          : item.status === 'Investigating'
                          ? 'bg-[#FFFBEB] text-[#D97706]'
                          : 'bg-[#DCFCE7] text-[#166534]'
                      }`}
                    >
                      ● {item.status}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-bold text-[#0F1F3D] group-hover:text-[#1769D2] transition-colors duration-150">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-[#536B8F] flex-wrap">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#1769D2]" />
                      <span>{item.location}, {item.state}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#758CA8]" />
                      <span>{item.time} ({item.date})</span>
                    </div>
                  </div>

                  {/* Trigger Detail Box */}
                  <div className="mt-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-xs space-y-1">
                    <div>
                      <strong className="text-[#0F1F3D]">Geotechnical Trigger: </strong>
                      <span className="text-[#334155]">{item.triggerReason}</span>
                    </div>
                    <div>
                      <strong className="text-[#0F1F3D]">Recommended Response: </strong>
                      <span className="text-[#1769D2] font-medium">{item.actionRequired}</span>
                    </div>
                    <div>
                      <strong className="text-[#0F1F3D]">Impacted Route: </strong>
                      <span className="text-[#536B8F]">{item.affectedInfrastructure}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex md:flex-col items-center md:items-end gap-2 flex-shrink-0 self-end md:self-auto">
                {item.status !== 'Resolved' ? (
                  <button
                    type="button"
                    onClick={() => handleResolveAlert(item.id)}
                    className="px-3.5 py-1.5 bg-[#1769D2] hover:bg-[#1257B2] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all duration-150 ease-premium motion-btn cursor-pointer"
                  >
                    Resolve Incident
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-[#16A34A] flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Resolved
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => alert(`Connecting to State Disaster Command Channel for ${item.location}`)}
                  className="px-3 py-1.5 border border-[#DCE6F2] hover:bg-[#F8FAFC] text-[#0F1F3D] text-xs font-semibold rounded-lg transition-all duration-150 ease-premium motion-btn cursor-pointer"
                >
                  Dispatch SDRF
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
