'use client';

import React from 'react';
import { Bell, Radio, Send, ShieldCheck, AlertTriangle, Zap, Layers } from 'lucide-react';

export interface ChannelSettings {
  ndmaCap: boolean;
  whatsappSdma: boolean;
  smsDisasterRelay: boolean;
  broRadioPush: boolean;
  sirenCivilDefense: boolean;
  emailBulletin: boolean;
}

interface SettingsBroadcastChannelsProps {
  channels: ChannelSettings;
  setChannels: React.Dispatch<React.SetStateAction<ChannelSettings>>;
  onTriggerTestAlert: () => void;
  isSimulating?: boolean;
}

interface ChannelItem {
  key: keyof ChannelSettings;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  activeColor: string;
}

const BROADCAST_CHANNELS: ChannelItem[] = [
  {
    key: 'ndmaCap',
    title: 'NDMA CAP Integrated Gateway',
    subtitle: 'Pan-India Common Alerting Protocol',
    icon: Radio,
    iconColor: 'text-[#1769D2]',
    activeColor: 'bg-[#1769D2]',
  },
  {
    key: 'whatsappSdma',
    title: 'SDMA Officer WhatsApp Group',
    subtitle: 'Instant incident briefing to IAS/IPS',
    icon: Send,
    iconColor: 'text-[#10B981]',
    activeColor: 'bg-[#10B981]',
  },
  {
    key: 'smsDisasterRelay',
    title: 'Cell Broadcast Mass SMS',
    subtitle: 'Geo-fenced SMS to towers in affected radius',
    icon: Radio,
    iconColor: 'text-[#F59E0B]',
    activeColor: 'bg-[#1769D2]',
  },
  {
    key: 'broRadioPush',
    title: 'BRO Highway Clearance Dispatch',
    subtitle: 'Automatic tasking to Project Vartak/Brahmank',
    icon: ShieldCheck,
    iconColor: 'text-[#0F1F3D]',
    activeColor: 'bg-[#1769D2]',
  },
  {
    key: 'sirenCivilDefense',
    title: 'Physical Siren Relays (Urban)',
    subtitle: 'Requires two-factor DM confirmation',
    icon: AlertTriangle,
    iconColor: 'text-[#EF4444]',
    activeColor: 'bg-[#EF4444]',
  },
];

export const SettingsBroadcastChannels: React.FC<SettingsBroadcastChannelsProps> = ({
  channels,
  setChannels,
  onTriggerTestAlert,
  isSimulating = false,
}) => {
  const toggleChannel = (key: keyof ChannelSettings) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs motion-card">
        <div className="flex items-center justify-between pb-4 border-b border-[#EBF1F8] mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#EAF3FF] rounded-lg text-[#1769D2]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F1F3D]">Broadcast Channels</h2>
              <p className="text-xs text-[#536B8F]">Multi-agency emergency dispatch relays</p>
            </div>
          </div>
        </div>

        <div className="space-y-3.5">
          {BROADCAST_CHANNELS.map((ch) => {
            const Icon = ch.icon;
            const isEnabled = channels[ch.key];
            return (
              <div key={ch.key} className="flex items-center justify-between p-3 rounded-lg border border-[#DCE6F2] hover:bg-[#F8FAFC] motion-row">
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${ch.iconColor}`} />
                  <div>
                    <span className="text-xs font-bold text-[#0F1F3D] block">{ch.title}</span>
                    <span className="text-[11px] text-[#536B8F]">{ch.subtitle}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleChannel(ch.key)}
                  aria-label={`Toggle ${ch.title}`}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                    isEnabled ? ch.activeColor : 'bg-[#CBD5E1]'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-premium ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-[#EBF1F8]">
          <button
            type="button"
            onClick={onTriggerTestAlert}
            disabled={isSimulating}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#F4F8FC] border border-[#CBD5E1] text-[#0F1F3D] rounded-lg text-xs font-bold hover:bg-[#EAF3FF] hover:border-[#1769D2] hover:text-[#1769D2] motion-btn cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-[#1769D2]" />
            {isSimulating ? 'Simulating Broadcast...' : 'Simulate Sandbox Warning Broadcast'}
          </button>
          <span className="block text-[11px] text-[#758CA8] text-center mt-1.5">
            Sends diagnostic sandbox payload without triggering live emergency sirens
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE6F2] p-5 shadow-xs motion-card">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EBF1F8] mb-4">
          <Layers className="w-4 h-4 text-[#1769D2]" />
          <h3 className="text-sm font-bold text-[#0F1F3D]">Inter-Agency Exchange Feeds</h3>
        </div>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
            <span className="text-[#536B8F]">GSI Geo-database</span>
            <span className="font-mono text-[#10B981] font-semibold">Active (TLS 1.3)</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
            <span className="text-[#536B8F]">NESAC ISRO Portal</span>
            <span className="font-mono text-[#10B981] font-semibold">Synced (5m ago)</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
            <span className="text-[#536B8F]">IMD Doppler Radars</span>
            <span className="font-mono text-[#10B981] font-semibold">Online (Guwahati/Sohra)</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[#536B8F]">CWC River Gauges</span>
            <span className="font-mono text-[#10B981] font-semibold">Telemetry Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
