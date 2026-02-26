/**
 * 모바일 날씨 서비스
 * OpenWeatherMap API + 메모리 캐시 + Mock Fallback
 *
 * API 키 없으면 자동 mock 데이터 반환 (개발/데모 모드)
 */

import type {
  KoreaRegion,
  WeatherData,
  HourlyForecast,
} from './types';
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

    const hourly: HourlyForecast[] = forecastData.list.slice(0, 6).map((item: Record<string, unknown>) => {
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
      expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
    };

    weatherCache.set(region, weatherData);
    return weatherData;
  } catch {
    // 만료된 캐시라도 반환 (fallback)
    if (cached) return cached;
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
    const dist = Math.sqrt(
      Math.pow(lat - coords.lat, 2) + Math.pow(lon - coords.lon, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = region as KoreaRegion;
    }
  }

  return nearest;
}

/**
 * Mock 날씨 데이터 (API 키 없거나 실패 시)
 */
export function generateMockWeather(region: KoreaRegion): WeatherData {
  const coords = REGION_INFO[region] || REGION_INFO.seoul;
  const month = new Date().getMonth() + 1;

  let baseTemp: number;
  let description: string;

  if (month >= 3 && month <= 5) {
    baseTemp = 15;
    description = '맑음';
  } else if (month >= 6 && month <= 8) {
    baseTemp = 28;
    description = '구름 조금';
  } else if (month >= 9 && month <= 11) {
    baseTemp = 18;
    description = '맑음';
  } else {
    baseTemp = 2;
    description = '흐림';
  }

  const now = new Date();
  const forecast: HourlyForecast[] = [];
  for (let i = 1; i <= 6; i++) {
    const hour = (now.getHours() + i * 3) % 24;
    forecast.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      temp: baseTemp + Math.floor(Math.random() * 4) - 2,
      feelsLike: baseTemp + Math.floor(Math.random() * 4) - 3,
      precipitation: Math.floor(Math.random() * 30),
      description,
      icon: '01d',
    });
  }

  return {
    region,
    location: coords.nameKr,
    current: {
      temp: baseTemp,
      feelsLike: baseTemp - 2,
      humidity: 60,
      windSpeed: 2.5,
      uvi: estimateUVI(),
      description,
      icon: '01d',
      precipitation: 10,
    },
    forecast,
    cachedAt: new Date().toISOString(),
  };
}

/**
 * 캐시 초기화
 */
export function clearWeatherCache(): void {
  weatherCache.clear();
}
