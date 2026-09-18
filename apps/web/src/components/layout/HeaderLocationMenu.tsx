'use client';

import React, { useState } from 'react';
import { MapPin, ChevronDown, Navigation, Loader2, Check } from 'lucide-react';

export interface LocationOption {
  city: string;
  state: string;
  code: string;
  lat: number;
  lon: number;
  isGps?: boolean;
}

export const OPERATIONAL_LOCATIONS: LocationOption[] = [
  { city: 'Shillong', state: 'Meghalaya', code: 'NER HQ', lat: 25.5788, lon: 91.8933 },
  { city: 'Guwahati', state: 'Assam', code: 'EOC', lat: 26.1445, lon: 91.7362 },
  { city: 'Itanagar', state: 'Arunachal Pradesh', code: 'W-CMD', lat: 27.0844, lon: 93.6053 },
  { city: 'Gangtok', state: 'Sikkim', code: 'N-CMD', lat: 27.3389, lon: 88.6065 },
  { city: 'Kohima', state: 'Nagaland', code: 'E-CMD', lat: 25.6751, lon: 94.1086 },
  { city: 'Aizawl', state: 'Mizoram', code: 'S-CMD', lat: 23.7271, lon: 92.7176 },
  { city: 'Imphal', state: 'Manipur', code: 'SE-CMD', lat: 24.817, lon: 93.9368 },
  { city: 'Agartala', state: 'Tripura', code: 'SW-CMD', lat: 23.8315, lon: 91.2868 },
];

interface HeaderLocationMenuProps {
  currentLocation: LocationOption;
  onSelectLocation: (loc: LocationOption) => void;
  gpsLocked: boolean;
  onDetectGps: () => void;
  isDetectingGps: boolean;
}

export const HeaderLocationMenu: React.FC<HeaderLocationMenuProps> = ({
  currentLocation,
  onSelectLocation,
  gpsLocked,
  onDetectGps,
  isDetectingGps,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div className="hidden xl:flex items-center border-r border-[#E2E8F0] pr-5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-[13px] text-left cursor-pointer group motion-btn"
          title="Click to view locations or re-detect GPS"
        >
          <div className="relative p-1.5 bg-[#EAF3FF] rounded-lg text-[#1769D2] group-hover:bg-[#dbeafe] transition-colors duration-150">
            {isDetectingGps ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#1769D2]" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-semibold text-[#0F1F3D] max-w-[120px] truncate">
                {isDetectingGps ? 'Locating...' : currentLocation.city}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  gpsLocked ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#EAF3FF] text-[#1769D2]'
                }`}
              >
                {gpsLocked && <Check className="w-2.5 h-2.5" />}
                {currentLocation.code}
              </span>
            </div>
            <span className="text-[11.5px] text-[#536B8F] leading-tight max-w-[135px] truncate">
              {currentLocation.state}
            </span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-[#758CA8] ml-0.5 group-hover:text-[#1769D2] ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-[268px] bg-white border border-[#DCE6F2] rounded-xl shadow-2xl p-2 z-[1300] text-xs motion-dropdown motion-dropdown-left">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#F1F5F9]">
            <span className="text-[10.5px] font-bold text-[#758CA8] uppercase tracking-wider">
              Location & Telemetry
            </span>
            <span className="text-[10px] font-bold text-[#536B8F]">
              {gpsLocked ? 'GPS Locked' : 'Manual Selection'}
            </span>
          </div>

          <div className="p-1 border-b border-[#F1F5F9]">
            <button
              type="button"
              onClick={() => {
                onDetectGps();
                setIsOpen(false);
              }}
              disabled={isDetectingGps}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#1769D2] hover:bg-[#1256B0] cursor-pointer disabled:opacity-50"
            >
              {isDetectingGps ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              <span>{isDetectingGps ? 'Detecting Location...' : 'Detect My Live Location'}</span>
            </button>
          </div>

          <div className="py-1 space-y-0.5 max-h-56 overflow-y-auto">
            {OPERATIONAL_LOCATIONS.map((loc) => (
              <button
                key={loc.city}
                type="button"
                onClick={() => {
                  onSelectLocation(loc);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                  currentLocation.city === loc.city && !gpsLocked
                    ? 'bg-[#EAF3FF] text-[#1769D2] font-semibold'
                    : 'text-[#0F1F3D] hover:bg-[#F4F8FC]'
                }`}
              >
                <div>
                  <p className="font-medium text-[12.5px]">{loc.city}</p>
                  <p className="text-[10.5px] text-[#758CA8]">{loc.state}</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#536B8F]">
                  {loc.code}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
