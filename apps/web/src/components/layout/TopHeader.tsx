'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { HeaderSearch } from './HeaderSearch';
import { HeaderLocationMenu, LocationOption, OPERATIONAL_LOCATIONS } from './HeaderLocationMenu';
import { HeaderWeather } from './HeaderWeather';
import { HeaderClock } from './HeaderClock';
import { HeaderNotifications } from './HeaderNotifications';
import { HeaderUserProfile } from './HeaderUserProfile';

interface TopHeaderProps {
  onMenuClick?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationOption>(OPERATIONAL_LOCATIONS[0]);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);

  const detectGpsLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
            { headers: { Accept: 'application/json' } }
          );
          if (!res.ok) throw new Error('Geocoding error');
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.state_district || 'Field Hub';
          const state = addr.state || 'NER India';

          const gpsLoc: LocationOption = {
            city,
            state,
            code: 'LIVE GPS',
            lat: latitude,
            lon: longitude,
            isGps: true,
          };
          setCurrentLocation(gpsLoc);
          setGpsLocked(true);
        } catch {
          setCurrentLocation({
            city: `Lat ${latitude.toFixed(2)}°`,
            state: `Lon ${longitude.toFixed(2)}°`,
            code: 'GPS FIX',
            lat: latitude,
            lon: longitude,
            isGps: true,
          });
          setGpsLocked(true);
        } finally {
          setIsDetectingGps(false);
        }
      },
      () => {
        setIsDetectingGps(false);
      },
      { timeout: 8000 }
    );
  }, []);

  return (
    <header className="sticky top-0 z-[1200] h-[64px] bg-white border-b border-[#DCE6F2] px-4 sm:px-6 flex items-center justify-between gap-4 lg:gap-6">
      <HeaderSearch />

      <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 flex-shrink-0">
        <HeaderLocationMenu
          currentLocation={currentLocation}
          onSelectLocation={(loc) => {
            setCurrentLocation(loc);
            setGpsLocked(false);
          }}
          gpsLocked={gpsLocked}
          onDetectGps={detectGpsLocation}
          isDetectingGps={isDetectingGps}
        />

        <HeaderWeather
          lat={currentLocation.lat}
          lon={currentLocation.lon}
          city={currentLocation.city}
        />

        <HeaderClock />
        <HeaderNotifications />
        <HeaderUserProfile />
      </div>
    </header>
  );
};
