/**
 * 날씨 훅
 * 지역 기반 날씨 데이터 조회 + 자동 새로고침
 */

import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';

import type { KoreaRegion, WeatherData, WeatherLocationSource } from './types';
import { getWeatherByRegion, generateMockWeather } from './weatherService';

interface UseWeatherOptions {
  /** 지역 (기본: seoul) */
  region?: KoreaRegion;
  /** default는 사용자 위치가 아닌 서울 기본값 */
  locationSource?: Exclude<WeatherLocationSource, 'geolocation'>;
  /** 자동 새로고침 여부 (기본: true) */
  autoRefresh?: boolean;
  /** 새로고침 간격 ms (기본: 30분) */
  refreshInterval?: number;
}

interface UseWeatherResult {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** 현재 온도 (편의용) */
  temp: number | null;
  /** 지역 이름 (편의용) */
  locationName: string;
}

export function useWeather(options: UseWeatherOptions = {}): UseWeatherResult {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const region = options.region ?? 'seoul';
  const locationSource =
    options.locationSource ?? (options.region === undefined ? 'default' : 'region');
  const { autoRefresh = true, refreshInterval = 30 * 60 * 1000 } = options;

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!isSignedIn) throw new Error('Authentication required');
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error('Authentication token unavailable');

      const data = await getWeatherByRegion(region, clerkToken, locationSource);
      setWeather(data);
    } catch {
      setError('날씨 정보를 불러올 수 없습니다');
      // 예외 경로도 출처가 표시된 placeholder만 사용한다.
      const mock = generateMockWeather(region, locationSource);
      setWeather(mock);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn, locationSource, region]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchWeather();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchWeather]);

  return {
    weather,
    isLoading,
    error,
    refetch: fetchWeather,
    temp: weather && !weather.usedFallback ? weather.current.temp : null,
    locationName: weather?.location ?? '서울',
  };
}
