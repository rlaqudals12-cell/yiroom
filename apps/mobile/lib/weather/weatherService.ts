/**
 * 모바일 날씨 서비스
 * OpenWeatherMap API + 메모리 캐시 + 정직한 Fallback
 */

import type { KoreaRegion, WeatherData, HourlyForecast } from './types';
import { REGION_INFO, WEATHER_CACHE_TTL_MS } from './types';

// OpenWeatherMap API
const OPENWEATHER_API = 'https://api.openweathermap.org/data/2.5';

// 메모리 캐시
const weatherCache = new Map<KoreaRegion, WeatherData & { expiresAt: number }>();

// 날씨 설명 한글 매핑
const WEATHER_DESCRIPTIONS: Record<string, string> = {
  'clear sky': '맑음',
  'few clouds': '구름 조금',
  'scattered clouds': '구름 많음',
  'broken clouds': '흐림',
  'overcast clouds': '흐림',
  'shower rain': '소나기',
  rain: '비',
  'light rain': '가벼운 비',
  'moderate rain': '비',
  'heavy intensity rain': '폭우',
  thunderstorm: '뇌우',
  snow: '눈',
  'light snow': '가벼운 눈',
  mist: '안개',
  fog: '안개',
  haze: '연무',
};

function translateDescription(desc: string): string {
  return WEATHER_DESCRIPTIONS[desc.toLowerCase()] || desc;
}

// UV 지수 추정 (시간대 기반)
function estimateUVI(): number {
  const hour = new Date().getHours();
  if (hour < 6 || hour > 19) return 0;
  if (hour < 9 || hour > 17) return 2;
  if (hour < 11 || hour > 15) return 4;
  return 6;
}

/**
 * 지역 기반 날씨 조회 (캐싱 적용)
 */
export async function getWeatherByRegion(region: KoreaRegion): Promise<WeatherData> {
  // 캐시 확인
  const cached = weatherCache.get(region);
  if (cached && Date.now() < cached.expiresAt) {
    return cached;
  }

  const coords = REGION_INFO[region];
  if (!coords) {
    return generateMockWeather(region);
  }

  // API 키 확인 (없으면 mock)
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) {
    return generateMockWeather(region);
  }

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `${OPENWEATHER_API}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=kr`
      ),
      fetch(
        `${OPENWEATHER_API}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=kr&cnt=6`
      ),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      throw new Error(`Weather API error: ${currentRes.status}`);
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    const hourly: HourlyForecast[] = forecastData.list
      .slice(0, 6)
      .map((item: Record<string, unknown>) => {
        const main = item.main as Record<string, number>;
        const weather = (item.weather as Record<string, string>[])[0];
        const date = new Date((item.dt as number) * 1000);
        return {
          time: `${date.getHours().toString().padStart(2, '0')}:00`,
          temp: Math.round(main.temp),
          feelsLike: Math.round(main.feels_like),
          precipitation: Math.round(((item.pop as number) || 0) * 100),
          description: translateDescription(weather.description),
          icon: weather.icon,
        };
      });

    const weatherData: WeatherData & { expiresAt: number } = {
      region,
      location: coords.nameKr,
      current: {
        temp: Math.round(currentData.main.temp),
        feelsLike: Math.round(currentData.main.feels_like),
        humidity: currentData.main.humidity,
        windSpeed: currentData.wind.speed,
        uvi: estimateUVI(),
        description: translateDescription(currentData.weather[0].description),
        icon: currentData.weather[0].icon,
        precipitation: Math.max(...hourly.map((h) => h.precipitation)),
      },
      forecast: hourly,
      cachedAt: new Date().toISOString(),
      usedFallback: false,
      expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
    };

    weatherCache.set(region, weatherData);
    return weatherData;
  } catch {
    // 만료된 관측값은 추천 근거로 재사용하지 않도록 폴백 출처를 명시한다.
    if (cached) return { ...cached, usedFallback: true };
    return generateMockWeather(region);
  }
}

/**
 * 위도/경도로 가장 가까운 지역 찾기
 */
export function findNearestRegion(lat: number, lon: number): KoreaRegion {
  let nearest: KoreaRegion = 'seoul';
  let minDist = Infinity;

  for (const [region, coords] of Object.entries(REGION_INFO)) {
    const dist = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lon - coords.lon, 2));
    if (dist < minDist) {
      minDist = dist;
      nearest = region as KoreaRegion;
    }
  }

  return nearest;
}

/**
 * API 키가 없거나 호출에 실패했을 때 반환하는 비관측 placeholder.
 * 수치는 UI나 추천 근거로 쓰지 않고 usedFallback 계약으로 차단한다.
 */
export function generateMockWeather(region: KoreaRegion): WeatherData {
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
  };
}

/**
 * 캐시 초기화
 */
export function clearWeatherCache(): void {
  weatherCache.clear();
}
