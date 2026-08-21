/**
 * 모바일 날씨 thin client.
 *
 * OpenWeather 키와 폴백 판정은 웹 `/api/weather`가 정본이다. 모바일은 인증 토큰을
 * 전달하고, 서버가 돌려준 단위·위치 출처·폴백 표식을 그대로 소비한다.
 */

import { getApiBaseUrl } from '@/lib/api/base-url';

import type { HourlyForecast, KoreaRegion, WeatherData, WeatherLocationSource } from './types';
import { REGION_INFO, WEATHER_CACHE_TTL_MS } from './types';

type WeatherRequestLocationSource = Exclude<WeatherLocationSource, 'geolocation'>;
type CachedWeatherData = WeatherData & { expiresAt: number };

// 요청 출처까지 키에 포함해 같은 서울 데이터의 default/region 출처가 서로 섞이지 않게 한다.
const weatherCache = new Map<string, CachedWeatherData>();

function cacheKey(region: KoreaRegion, locationSource: WeatherRequestLocationSource): string {
  return `${locationSource}:${region}`;
}

function isWeatherData(value: unknown): value is WeatherData {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<WeatherData>;
  return (
    typeof candidate.region === 'string' &&
    typeof candidate.location === 'string' &&
    typeof candidate.current === 'object' &&
    candidate.current !== null &&
    Array.isArray(candidate.forecast) &&
    typeof candidate.cachedAt === 'string' &&
    typeof candidate.usedFallback === 'boolean' &&
    (candidate.locationSource === 'default' ||
      candidate.locationSource === 'region' ||
      candidate.locationSource === 'geolocation')
  );
}

/**
 * 지역 기반 날씨 조회.
 *
 * `default`는 사용자 위치가 아닌 서울 기본값이며 쿼리를 보내지 않아 웹 API가 그 출처를
 * 확정한다. `region`은 사용자가 명시적으로 고른 지역이다.
 */
export async function getWeatherByRegion(
  region: KoreaRegion,
  clerkToken: string,
  locationSource: WeatherRequestLocationSource = 'region'
): Promise<WeatherData> {
  const key = cacheKey(region, locationSource);
  const cached = weatherCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached;
  }

  const endpoint =
    locationSource === 'default'
      ? `${getApiBaseUrl()}/api/weather`
      : `${getApiBaseUrl()}/api/weather?region=${encodeURIComponent(region)}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${clerkToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!isWeatherData(data)) {
      throw new Error('Invalid weather API response');
    }

    if (!data.usedFallback) {
      weatherCache.set(key, {
        ...data,
        expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
      });
    }

    return data;
  } catch {
    // 만료 캐시는 실시간 관측값이 아니므로 추천 근거로 쓰이지 않도록 폴백 표식을 올린다.
    if (cached) return { ...cached, usedFallback: true };
    return generateMockWeather(region, locationSource);
  }
}

/** 위도/경도에 가장 가까운 지원 지역을 찾는다. 좌표 기반 API 요청의 지역 라벨용 공개 헬퍼다. */
export function findNearestRegion(lat: number, lon: number): KoreaRegion {
  let nearest: KoreaRegion = 'seoul';
  let minDistance = Infinity;

  for (const [region, coords] of Object.entries(REGION_INFO)) {
    const distance = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lon - coords.lon, 2));
    if (distance < minDistance) {
      minDistance = distance;
      nearest = region as KoreaRegion;
    }
  }

  return nearest;
}

/**
 * 웹 API 호출이 불가능할 때 반환하는 비관측 placeholder.
 * 수치는 UI나 추천 근거로 쓰지 않고 usedFallback 계약으로 차단한다.
 */
export function generateMockWeather(
  region: KoreaRegion,
  locationSource: WeatherRequestLocationSource = 'default'
): WeatherData {
  const coords = REGION_INFO[region] || REGION_INFO.seoul;
  const forecast: HourlyForecast[] = ['09:00', '12:00', '15:00', '18:00', '21:00', '00:00'].map(
    (time) => ({
      time,
      temp: 0,
      feelsLike: 0,
      precipitation: 0,
      description: '날씨 정보 없음',
      icon: '',
    })
  );

  return {
    region,
    location: coords.nameKr,
    current: {
      temp: 0,
      feelsLike: 0,
      humidity: 0,
      windSpeed: 0,
      uvi: 0,
      description: '날씨 정보 없음',
      icon: '',
      precipitation: 0,
    },
    forecast,
    cachedAt: '',
    usedFallback: true,
    locationSource,
  };
}

/** 캐시 초기화 (테스트용) */
export function clearWeatherCache(): void {
  weatherCache.clear();
}
