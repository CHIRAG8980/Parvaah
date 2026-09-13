'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  CloudFog,
  Bell,
  ChevronDown,
  Navigation,
  Loader2,
  Check,
  AlertTriangle,
  Split,
  CheckCircle2,
} from 'lucide-react';

interface TopHeaderProps {
  onMenuClick?: () => void;
}

interface LocationOption {
  city: string;
  state: string;
  code: string;
  lat: number;
  lon: number;
  isGps?: boolean;
}

const operationalLocations: LocationOption[] = [
  { city: 'Shillong', state: 'Meghalaya', code: 'NER HQ', lat: 25.5788, lon: 91.8933 },
  { city: 'Guwahati', state: 'Assam', code: 'EOC', lat: 26.1445, lon: 91.7362 },
  { city: 'Itanagar', state: 'Arunachal Pradesh', code: 'W-CMD', lat: 27.0844, lon: 93.6053 },
  { city: 'Gangtok', state: 'Sikkim', code: 'N-CMD', lat: 27.3389, lon: 88.6065 },
  { city: 'Kohima', state: 'Nagaland', code: 'E-CMD', lat: 25.6751, lon: 94.1086 },
  { city: 'Aizawl', state: 'Mizoram', code: 'S-CMD', lat: 23.7271, lon: 92.7176 },
  { city: 'Imphal', state: 'Manipur', code: 'SE-CMD', lat: 24.8170, lon: 93.9368 },
  { city: 'Agartala', state: 'Tripura', code: 'SW-CMD', lat: 23.8315, lon: 91.2868 },
];

function getWeatherDetails(code: number) {
  if (code === 0) return { label: 'Clear Sky', icon: Sun };
  if (code >= 1 && code <= 3) return { label: code === 3 ? 'Overcast' : 'Partly Cloudy', icon: Cloud };
  if (code === 45 || code === 48) return { label: 'Fog / Mist', icon: CloudFog };
  if (code >= 51 && code <= 55) return { label: 'Light Drizzle', icon: CloudRain };
  if (code >= 61 && code <= 65) return { label: code === 65 ? 'Heavy Rain' : 'Moderate Rain', icon: CloudRain };
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', icon: CloudRain };
  if (code >= 95) return { label: 'Thunderstorm', icon: CloudLightning };
  return { label: 'Light Rain', icon: CloudRain };
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onMenuClick }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<LocationOption>(operationalLocations[0]);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);

  // Live Clock State
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  // Live Weather State
  const [weatherTemp, setWeatherTemp] = useState<string>('');
  const [weatherCondition, setWeatherCondition] = useState<string>('');
  const [weatherCode, setWeatherCode] = useState<number>(0);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);

  // High-accuracy GPS detector with Nominatim reverse geocoding
  const detectGpsLocation = useCallback((silent = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (!silent) alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Accurate reverse geocoding via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
            { headers: { 'Accept': 'application/json' } }
          );

          if (!res.ok) throw new Error('Geocoding response failed');
          const data = await res.json();
          const addr = data.address || {};

          // Extract best descriptive location name
          const detectedCity =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.suburb ||
            addr.state_district ||
            addr.county ||
            'Field Station';

          const detectedState = addr.state || addr.country || 'India';

          const gpsLoc: LocationOption = {
            city: detectedCity,
            state: detectedState,
            code: 'LIVE GPS',
            lat: latitude,
            lon: longitude,
            isGps: true,
          };

          setCurrentLocation(gpsLoc);
          setGpsLocked(true);
          try {
            localStorage.setItem('parvaah_live_location', JSON.stringify(gpsLoc));
          } catch {
            // ignore storage errors
          }
        } catch {
          // Fallback if reverse geocoding network fails
          const fallbackLoc: LocationOption = {
            city: `Lat ${latitude.toFixed(2)}°`,
            state: `Lon ${longitude.toFixed(2)}°`,
            code: 'GPS FIX',
            lat: latitude,
            lon: longitude,
            isGps: true,
          };
          setCurrentLocation(fallbackLoc);
          setGpsLocked(true);
        } finally {
          setIsDetectingGps(false);
          setLocationMenuOpen(false);
        }
      },
      (error) => {
        setIsDetectingGps(false);
        setGpsLocked(false);
        if (!silent) {
          console.warn('Geolocation error:', error.message);
          alert('GPS permission not granted or timeout. You can select your operational command hub from the list.');
        }
      },
      geoOptions
    );
  }, []);

  // 1. Live Clock Timer (ticks every second in IST) & Initial Auto-GPS
  useEffect(() => {
    setIsMounted(true);

    const updateClock = () => {
      const now = new Date();

      const dateStr = now.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const timeStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).toUpperCase();

      setCurrentDate(dateStr);
      setCurrentTime(timeStr);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    // Attempt restoring cached location or auto-detecting live GPS silently
    try {
      const saved = localStorage.getItem('parvaah_live_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lon) {
          setCurrentLocation(parsed);
          setGpsLocked(true);
        }
      } else {
        // Auto-detect on first load
        detectGpsLocation(true);
      }
    } catch {
      detectGpsLocation(true);
    }

    return () => clearInterval(interval);
  }, [detectGpsLocation]);

  // 2. Fetch Live Real-Time Weather from Open-Meteo for selected lat/lon
  useEffect(() => {
    let isCancelled = false;

    async function fetchLiveWeather() {
      setWeatherLoading(true);
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${currentLocation.lat}&longitude=${currentLocation.lon}&current=temperature_2m,weather_code,precipitation`
        );
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();

        if (!isCancelled && data.current) {
          const tempVal = Math.round(data.current.temperature_2m);
          const code = data.current.weather_code ?? 0;
          const { label } = getWeatherDetails(code);

          setWeatherTemp(`${tempVal}°C`);
          setWeatherCondition(label);
          setWeatherCode(code);
        }
      } catch (err) {
        console.warn('Unable to fetch live weather from Open-Meteo, using station cache', err);
      } finally {
        if (!isCancelled) setWeatherLoading(false);
      }
    }

    fetchLiveWeather();
    const weatherInterval = setInterval(fetchLiveWeather, 180000);
    return () => {
      isCancelled = true;
      clearInterval(weatherInterval);
    };
  }, [currentLocation]);

  const WeatherIconComponent = getWeatherDetails(weatherCode).icon;

  return (
    <header className="sticky top-0 z-[1200] h-[64px] bg-white border-b border-[#DCE6F2] px-4 sm:px-6 flex items-center justify-between gap-4 lg:gap-6">
      {/* Left: Search Bar */}
      <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#758CA8]">
          <Search className="w-4 h-4 transition-colors duration-150" />
        </div>
        <input
          type="text"
          placeholder="Search location, district, road, or alert..."
          className="w-full h-10 pl-10 pr-12 text-[13.5px] bg-[#F8FAFC] border border-[#DCE6F2] rounded-lg placeholder:text-[#8497B0] text-[#0F1F3D] focus:outline-none focus:ring-2 focus:ring-[#1769D2]/20 focus:border-[#1769D2] focus:bg-white motion-input"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="px-1.5 py-0.5 text-[11px] font-semibold text-[#64748B] bg-white border border-[#CBD5E1] rounded shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Live GPS Location, Live Weather, Live Date/Time, Notifications, User */}
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 flex-shrink-0">
        {/* 1. Live GPS Location Widget */}
        <div className="relative">
          <div className="hidden xl:flex items-center border-r border-[#E2E8F0] pr-5">
            <button
              type="button"
              onClick={() => {
                setLocationMenuOpen(!locationMenuOpen);
                setUserMenuOpen(false);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 text-[13px] text-left cursor-pointer group motion-btn"
              title="Click to view locations or re-detect GPS"
            >
              <div className="relative p-1.5 bg-[#EAF3FF] rounded-lg text-[#1769D2] group-hover:bg-[#dbeafe] transition-colors duration-150">
                {isDetectingGps ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#1769D2]" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#94A3B8]" />
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="font-semibold text-[#0F1F3D] max-w-[120px] truncate">
                    {isDetectingGps ? 'Locating...' : currentLocation.city}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors duration-150 ${
                      gpsLocked
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : 'bg-[#EAF3FF] text-[#1769D2]'
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
              <ChevronDown className={`w-3.5 h-3.5 text-[#758CA8] ml-0.5 group-hover:text-[#1769D2] motion-rotate-180 ${locationMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Location Selector Dropdown */}
          {locationMenuOpen && (
            <div className="absolute left-0 mt-2 w-[268px] bg-white border border-[#DCE6F2] rounded-xl shadow-2xl p-2 z-[1300] text-xs motion-dropdown motion-dropdown-left">
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#F1F5F9]">
                <span className="text-[10.5px] font-bold text-[#758CA8] uppercase tracking-wider whitespace-nowrap">
                  Location & Telemetry
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#536B8F] whitespace-nowrap">
                  {gpsLocked ? 'GPS Locked' : 'Manual Selection'}
                </span>
              </div>

              {/* GPS Auto-Detect Button */}
              <div className="p-1 border-b border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => detectGpsLocation(false)}
                  disabled={isDetectingGps}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#1769D2] hover:bg-[#1256B0] shadow-2xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {isDetectingGps ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                  <span className="whitespace-nowrap">{isDetectingGps ? 'Detecting Live Location...' : 'Detect My Live Location'}</span>
                </button>
              </div>

              {/* List of North Eastern Command Hubs */}
              <div className="py-1 space-y-0.5 max-h-56 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-bold text-[#94A3B8] uppercase">
                  Regional Command Stations
                </div>
                {operationalLocations.map((loc) => (
                  <button
                    key={loc.city}
                    type="button"
                    onClick={() => {
                      setCurrentLocation(loc);
                      setGpsLocked(false);
                      setLocationMenuOpen(false);
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

        {/* 2. Live Weather Widget (Real-time Open-Meteo telemetry) */}
        <div className="hidden md:flex items-center gap-2 text-[13px] border-r border-[#E2E8F0] pr-5">
          <div className="relative p-1.5 bg-[#EAF3FF] rounded-lg text-[#1769D2]">
            {weatherLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#1769D2]" />
            ) : (
              <WeatherIconComponent className="w-4 h-4" />
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-semibold text-[#0F1F3D] max-w-[90px] truncate">
                {currentLocation.city}
              </span>
              <span className="font-bold text-[#1769D2]">
                {weatherTemp}
              </span>
            </div>
            <div className="flex items-center gap-1 leading-tight">
              <span className="text-[11.5px] text-[#536B8F] truncate max-w-[100px]">
                {weatherCondition}
              </span>
              <span className="text-[9px] font-bold text-[#10B981] bg-[#ECFDF5] px-1 py-0.2 rounded">
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* 3. Live Date & Time Widget (Real-time ticking clock in IST) */}
        <div className="hidden sm:flex flex-col text-right border-r border-[#E2E8F0] pr-5 leading-tight">
          <span className="text-[12px] text-[#536B8F] font-medium">
            {isMounted && currentDate ? currentDate : '--'}
          </span>
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[13.5px] font-bold text-[#0F1F3D] font-mono tracking-tight">
              {isMounted && currentTime ? currentTime : '--:--:-- --'}
            </span>
            <span className="text-[10px] font-bold text-[#1769D2] bg-[#EAF3FF] px-1 rounded">
              IST
            </span>
          </div>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserMenuOpen(false);
              setLocationMenuOpen(false);
            }}
            className="relative p-2 text-[#536B8F] hover:text-[#0F1F3D] hover:bg-[#F4F8FC] rounded-lg transition-all duration-150 ease-premium motion-btn cursor-pointer"
            aria-label="Notifications"
            title="Operational Alerts & Dispatches"
          >
            <Bell className="w-5 h-5 transition-transform duration-150" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white motion-beacon" />
            )}
          </button>

          {/* Notification Popover Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 sm:-right-8 mt-2 w-80 sm:w-96 bg-white border border-[#DCE6F2] rounded-xl shadow-2xl z-[1300] text-xs motion-dropdown motion-dropdown-right overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0F1F3D] text-[13px]">
                    Incident Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setUnreadCount(0)}
                    className="text-[11px] font-semibold text-[#1769D2] hover:underline cursor-pointer transition-colors duration-150"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification Items */}
              <div className="divide-y divide-[#F1F5F9] max-h-80 overflow-y-auto">
                {unreadCount === 0 && (
                  <div className="p-6 text-center text-xs text-[#758CA8]">
                    No new notifications
                  </div>
                )}
              </div>

              {/* Footer Link */}
              <div className="p-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] text-center">
                <Link
                  href="/alerts"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[12px] font-bold text-[#1769D2] hover:text-[#1257B2] transition-colors duration-150 inline-flex items-center gap-1 group"
                >
                  <span>View All Alerts in Incident Console</span>
                  <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <div
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setLocationMenuOpen(false);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2.5 pl-1 cursor-pointer select-none motion-btn"
          >
            <div className="w-9 h-9 rounded-full bg-[#163B70] text-white flex items-center justify-center font-bold text-xs shadow-xs transition-transform duration-150 group-hover:scale-105">
              --
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-[13.5px] font-semibold text-[#0F1F3D]">
                --
              </span>
              <span className="text-[11.5px] text-[#536B8F]">
                --
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#758CA8] motion-rotate-180 ${userMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#DCE6F2] rounded-xl shadow-2xl p-2 z-[1300] text-xs motion-dropdown motion-dropdown-right">
              <div className="px-3 py-2 border-b border-[#F1F5F9]">
                <p className="font-semibold text-[#0F1F3D]">--</p>
                <p className="text-[11px] text-[#536B8F]">--</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3FF] text-[#1769D2]">
                  --
                </span>
              </div>
              <div className="py-1">
                <a
                  href="/login"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] transition-colors duration-150 font-medium motion-btn"
                >
                  <span>Sign Out / Switch Account</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
