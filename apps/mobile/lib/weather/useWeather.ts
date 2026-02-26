/**
 * 날씨 훅
 * 지역 기반 날씨 데이터 조회 + 자동 새로고침
 */

import { useCallback, useEffect, useState } from 'react';

import type { KoreaRegion, WeatherData } from './types';
import { getWeatherByRegion, generateMockWeather } from './weatherService';

interface UseWeatherOptions {
  /** 지역 (기본: seoul) */
  region?: KoreaRegion;
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
  temp: number;
  /** 지역 이름 (편의용) */
  locationName: string;
}

export function useWeather(options: UseWeatherOptions = {}): UseWeatherResult {
  const {
    region = 'seoul',
    autoRefresh = true,
    refreshInterval = 30 * 60 * 1000,
  } = options;

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getWeatherByRegion(region);
      setWeather(data);
    } catch {
      setError('날씨 정보를 불러올 수 없습니다');
      // mock fallback
      const mock = generateMockWeather(region);
      setWeather(mock);
    } finally {
      setIsLoading(false);
    }
  }, [region]);

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
    temp: weather?.current.temp ?? 15,
    locationName: weather?.location ?? '서울',
  };
}
