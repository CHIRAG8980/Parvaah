import { useApiQuery } from './useApiQuery';
import { apiClient } from '../lib/api/client';
import { WeatherForecastResponse } from '../lib/api/types';

export function useWeather(zoneId: string = 'ZONE-EAST-KHASI-HILLS') {
  return useApiQuery<WeatherForecastResponse>(
    async (signal) => {
      return apiClient.get<WeatherForecastResponse>('/weather/forecast', {
        params: { zone_id: zoneId },
        signal,
      });
    },
    [zoneId],
    { refetchIntervalMs: 60000 }
  );
}
