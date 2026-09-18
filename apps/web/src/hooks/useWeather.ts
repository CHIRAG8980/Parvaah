import { useApiQuery } from './useApiQuery';
import { apiClient } from '../lib/api/client';
import { WeatherForecastResponse } from '../lib/api/types';
import { useAuth } from './useAuth';

export function useWeather(districtOrZoneId?: string) {
  const { assignedDistrict } = useAuth();
  
  // Resolve target location dynamically: passed district/zone -> officer assigned district -> undefined (backend default)
  const target = districtOrZoneId || assignedDistrict || undefined;
  const isZoneId = target?.startsWith('ZONE-');

  return useApiQuery<WeatherForecastResponse>(
    async (signal) => {
      const params: Record<string, string> = {};
      if (target) {
        if (isZoneId) {
          params.zone_id = target;
        } else {
          params.district = target;
        }
      }
      return apiClient.get<WeatherForecastResponse>('/weather/forecast', {
        params,
        signal,
      });
    },
    [target],
    { refetchIntervalMs: 60000 }
  );
}
