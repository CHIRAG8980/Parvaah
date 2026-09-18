'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Split, ShieldAlert, Loader2, X } from 'lucide-react';
import { useZones } from '../../hooks/useZones';
import { useRoads } from '../../hooks/useRoads';
import { useAlertQueue } from '../../hooks/useAlerts';

export const HeaderSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { zones, isLoading: zonesLoading } = useZones();
  const { roads, isLoading: roadsLoading } = useRoads();
  const { alerts, isLoading: alertsLoading } = useAlertQueue();

  const isLoading = zonesLoading || roadsLoading || alertsLoading;

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanQuery = query.toLowerCase().trim();

  const matchingZones = cleanQuery
    ? zones.filter(
        (z) =>
          z.name.toLowerCase().includes(cleanQuery) ||
          z.district.toLowerCase().includes(cleanQuery) ||
          z.zone_id.toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : [];

  const matchingRoads = cleanQuery
    ? roads.filter(
        (r) =>
          r.name.toLowerCase().includes(cleanQuery) ||
          r.road_id.toLowerCase().includes(cleanQuery) ||
          r.zone_id.toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : [];

  const matchingAlerts = cleanQuery
    ? alerts.filter(
        (a) =>
          a.title.toLowerCase().includes(cleanQuery) ||
          a.district.toLowerCase().includes(cleanQuery) ||
          a.alert_id.toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : [];

  const totalResults = matchingZones.length + matchingRoads.length + matchingAlerts.length;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#758CA8]">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#1769D2]" />
        ) : (
          <Search className="w-4 h-4 transition-colors duration-150" />
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        placeholder="Search location, district, road, or alert..."
        className="w-full h-10 pl-10 pr-12 text-[13.5px] bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg placeholder:text-[#8497B0] text-[#0F1F3D] focus:outline-none focus:ring-2 focus:ring-[#1769D2]/20 focus:border-[#1769D2] focus:bg-white motion-input"
      />

      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setIsOpen(false);
          }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#758CA8] hover:text-[#0F1F3D] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      ) : (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="px-1.5 py-0.5 text-[11px] font-semibold text-[#64748B] bg-white border border-[#CBD5E1] rounded shadow-2xs">
            ⌘K
          </kbd>
        </div>
      )}

      {isOpen && cleanQuery.length > 0 && (
        <div className="absolute top-11 left-0 right-0 bg-white border border-[#DCE6F2] rounded-xl shadow-2xl p-2 z-[1400] text-xs max-h-96 overflow-y-auto space-y-2 motion-dropdown motion-dropdown-left">
          {totalResults === 0 ? (
            <div className="p-4 text-center text-[#758CA8]">
              No active monitoring assets matching &quot;{query}&quot;
            </div>
          ) : (
            <>
              {matchingZones.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-bold text-[#758CA8] uppercase tracking-wider">
                    Hazard Zones ({matchingZones.length})
                  </div>
                  {matchingZones.map((z) => (
                    <button
                      key={z.zone_id}
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/risk-map');
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#F4F8FC] text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#1769D2] flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-[#0F1F3D]">{z.name}</p>
                          <p className="text-[11px] text-[#536B8F]">{z.district}, {z.state}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626]">
                        {z.risk_level}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchingRoads.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-bold text-[#758CA8] uppercase tracking-wider border-t border-[#F1F5F9] pt-2">
                    Transport Corridors ({matchingRoads.length})
                  </div>
                  {matchingRoads.map((r) => (
                    <button
                      key={r.road_id}
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/roads');
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#F4F8FC] text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Split className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-[#0F1F3D]">{r.name}</p>
                          <p className="text-[11px] text-[#536B8F]">{r.road_id}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] uppercase">
                        {r.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchingAlerts.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-bold text-[#758CA8] uppercase tracking-wider border-t border-[#F1F5F9] pt-2">
                    Alerts & Bulletins ({matchingAlerts.length})
                  </div>
                  {matchingAlerts.map((a) => (
                    <button
                      key={a.alert_id}
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/alerts');
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#F4F8FC] text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#EF4444] flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-[#0F1F3D]">{a.title}</p>
                          <p className="text-[11px] text-[#536B8F]">{a.district} • {a.alert_id}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1769D2]">
                        {a.severity}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
