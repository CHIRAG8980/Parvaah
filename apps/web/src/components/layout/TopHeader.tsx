'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { HeaderSearch } from './HeaderSearch';
import { HeaderLocationMenu, LocationOption, OPERATIONAL_LOCATIONS } from './HeaderLocationMenu';
import { HeaderWeather } from './HeaderWeather';
import { HeaderClock } from './HeaderClock';
import { HeaderNotifications } from './HeaderNotifications';
import { HeaderUserProfile } from './HeaderUserProfile';
import { useAuth } from '../../hooks/useAuth';
import { useZones } from '../../hooks/useZones';

interface TopHeaderProps {
  onMenuClick?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = () => {
  const { assignedDistrict } = useAuth();
  const { zones } = useZones();
  const [currentLocation, setCurrentLocation] = useState<LocationOption>(() => {
    return OPERATIONAL_LOCATIONS[0];
  });
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);

  // Sync to assigned district location on mount/auth if not explicitly locked to GPS
  useEffect(() => {
    if (!gpsLocked && assignedDistrict) {
      const match = OPERATIONAL_LOCATIONS.find(
        (loc) => loc.city.toLowerCase().includes(assignedDistrict.toLowerCase()) ||
                 assignedDistrict.toLowerCase().includes(loc.city.toLowerCase())
      );
      if (match) {
        setCurrentLocation(match);
      } else {
        const matchingZone = zones.find(
          (z) => z.district.toLowerCase() === assignedDistrict.toLowerCase()
        );
        setCurrentLocation({
          city: matchingZone ? matchingZone.district : assignedDistrict,
          state: matchingZone ? matchingZone.state : 'Meghalaya',
          code: 'DMO JURISDICTION',
          lat: matchingZone ? matchingZone.latitude : 25.5788,
          lon: matchingZone ? matchingZone.longitude : 91.8933,
        });
      }
    }
  }, [assignedDistrict, gpsLocked, zones]);

  const detectGpsLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // Match closest official monitored Indian district jurisdiction
        let closestZone = zones[0];
        let minDistanceSq = Number.MAX_VALUE;

        for (const zone of zones) {
          const dLat = zone.latitude - latitude;
          const dLon = zone.longitude - longitude;
          const distSq = dLat * dLat + dLon * dLon;
          if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            closestZone = zone;
          }
        }

        if (closestZone) {
          setCurrentLocation({
            city: closestZone.district,
            state: closestZone.state,
            code: 'OFFICIAL JURISDICTION',
            lat: latitude,
            lon: longitude,
            isGps: true,
          });
        } else {
          setCurrentLocation({
            city: `Lat ${latitude.toFixed(2)}°`,
            state: `Lon ${longitude.toFixed(2)}°`,
            code: 'GPS FIX',
            lat: latitude,
            lon: longitude,
            isGps: true,
          });
        }
        setGpsLocked(true);
        setIsDetectingGps(false);
      },
      () => {
        setIsDetectingGps(false);
      },
      { timeout: 8000 }
    );
  }, [zones]);

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
