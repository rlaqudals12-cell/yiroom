/**
 * 날씨 서비스 - 지역 기반 캐싱
 *
 * OpenWeatherMap API 연동 + 지역별 1시간 캐싱
 * 17개 지역 × 24시간 = 408 calls/day (무료 1,000/day 내)
 */

import { styleLogger } from '@/lib/utils/logger';
import type { KoreaRegion, WeatherData, HourlyForecast, CachedWeatherData } from '@/types/weather';
import { WEATHER_CACHE_TTL_MS } from '@/types/weather';

// OpenWeatherMap API 기본 URL
const OPENWEATHER_API = 'https://api.openweathermap.org/data/2.5';

// 지역별 날씨 캐시 (메모리 캐시)
const weatherCache = new Map<KoreaRegion, CachedWeatherData>();

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

// 지역 좌표 가져오기 (types에서 import하기 어려우면 여기서 정의)
const REGION_COORDS: Record<KoreaRegion, { lat: number; lon: number; nameKr: string }> = {
  seoul: { lat: 37.5665, lon: 126.978, nameKr: '서울' },
  busan: { lat: 35.1796, lon: 129.0756, nameKr: '부산' },
  daegu: { lat: 35.8714, lon: 128.6014, nameKr: '대구' },
  incheon: { lat: 37.4563, lon: 126.7052, nameKr: '인천' },
  gwangju: { lat: 35.1595, lon: 126.8526, nameKr: '광주' },
  daejeon: { lat: 36.3504, lon: 127.3845, nameKr: '대전' },
  ulsan: { lat: 35.5384, lon: 129.3114, nameKr: '울산' },
  sejong: { lat: 36.48, lon: 127.289, nameKr: '세종' },
  gyeonggi: { lat: 37.4138, lon: 127.5183, nameKr: '경기' },
  gangwon: { lat: 37.8228, lon: 128.1555, nameKr: '강원' },
  chungbuk: { lat: 36.6357, lon: 127.4914, nameKr: '충북' },
  chungnam: { lat: 36.6588, lon: 126.6728, nameKr: '충남' },
  jeonbuk: { lat: 35.8203, lon: 127.1089, nameKr: '전북' },
  jeonnam: { lat: 34.8161, lon: 126.4629, nameKr: '전남' },
  gyeongbuk: { lat: 36.576, lon: 128.5056, nameKr: '경북' },
  gyeongnam: { lat: 35.4606, lon: 128.2132, nameKr: '경남' },
  jeju: { lat: 33.4996, lon: 126.5312, nameKr: '제주' },
};

/**
 * 캐시 유효성 검사
 */
function isCacheValid(cached: CachedWeatherData | undefined): boolean {
  if (!cached) return false;
  return Date.now() < cached.expiresAt;
}

/**
 * 날씨 설명 한글화
 */
function translateDescription(desc: string): string {
  const lower = desc.toLowerCase();
  return WEATHER_DESCRIPTIONS[lower] || desc;
}

/**
 * OpenWeatherMap API에서 현재 날씨 가져오기
 */
async function fetchCurrentWeather(
  lat: number,
  lon: number
): Promise<{
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY not configured');
  }

  const url = `${OPENWEATHER_API}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    description: translateDescription(data.weather[0].description),
    icon: data.weather[0].icon,
  };
}

/**
 * OpenWeatherMap API에서 시간별 예보 가져오기
 */
async function fetchForecast(
  lat: number,
  lon: number
): Promise<{
  hourly: HourlyForecast[];
  uvi: number;
  precipitation: number;
}> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY not configured');
  }

  const url = `${OPENWEATHER_API}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr&cnt=6`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Forecast API error: ${response.status}`);
  }

  const data = await response.json();

  // 6시간 예보 추출
  const hourly: HourlyForecast[] = data.list.slice(0, 6).map((item: any) => {
    const date = new Date(item.dt * 1000);
    return {
      time: `${date.getHours().toString().padStart(2, '0')}:00`,
      temp: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      precipitation: Math.round((item.pop || 0) * 100),
      description: translateDescription(item.weather[0].description),
      icon: item.weather[0].icon,
    };
  });

  // 강수 확률은 가장 높은 값 사용
  const maxPrecipitation = Math.max(...hourly.map((h) => h.precipitation));

  // UV 지수는 forecast API에서 제공되지 않아 기본값 사용 (One Call API 필요)
  // 무료 플랜에서는 UV 지수를 대략적으로 추정
  const uvi = estimateUVI();

  return { hourly, uvi, precipitation: maxPrecipitation };
}

/**
 * UV 지수 추정 (시간대 기반)
 * One Call API는 유료이므로 시간대로 대략적 추정
 */
function estimateUVI(): number {
  const hour = new Date().getHours();

  // 밤/이른 아침/저녁은 UV 낮음
  if (hour < 6 || hour > 19) return 0;
  if (hour < 9 || hour > 17) return 2;
  if (hour < 11 || hour > 15) return 4;

  // 한낮 (11-15시) UV 높음
  return 6;
}

/**
 * 지역 기반 날씨 데이터 조회 (캐싱 적용)
 */
export async function getWeatherByRegion(region: KoreaRegion): Promise<WeatherData> {
  // 캐시 확인
  const cached = weatherCache.get(region);
  if (isCacheValid(cached)) {
    return cached as WeatherData;
  }

  const coords = REGION_COORDS[region];
  if (!coords) {
    throw new Error(`Unknown region: ${region}`);
  }

  try {
    // API 호출 (병렬)
    const [current, forecast] = await Promise.all([
      fetchCurrentWeather(coords.lat, coords.lon),
      fetchForecast(coords.lat, coords.lon),
    ]);

    const weatherData: CachedWeatherData = {
      region,
      location: coords.nameKr,
      current: {
        temp: current.temp,
        feelsLike: current.feelsLike,
        humidity: current.humidity,
        windSpeed: current.windSpeed,
        uvi: forecast.uvi,
        description: current.description,
        icon: current.icon,
        precipitation: forecast.precipitation,
      },
      forecast: forecast.hourly,
      cachedAt: new Date().toISOString(),
      expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
    };

    // 캐시 저장
    weatherCache.set(region, weatherData);

    return weatherData;
  } catch (error) {
    styleLogger.error(`Failed to fetch weather for ${region}:`, error);

    // 캐시된 데이터가 있으면 만료되어도 반환 (fallback)
    if (cached) {
      styleLogger.debug(`Returning stale cache for ${region}`);
      return cached;
    }

    // Mock 데이터 반환
    return generateMockWeather(region);
  }
}

/**
 * 위도/경도로 가장 가까운 지역 찾기
 */
export function findNearestRegion(lat: number, lon: number): KoreaRegion {
  let nearestRegion: KoreaRegion = 'seoul';
  let minDistance = Infinity;

  for (const [region, coords] of Object.entries(REGION_COORDS)) {
    const distance = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lon - coords.lon, 2));
    if (distance < minDistance) {
      minDistance = distance;
      nearestRegion = region as KoreaRegion;
    }
  }

  return nearestRegion;
}

/**
 * 위도/경도 기반 날씨 조회
 */
export async function getWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const region = findNearestRegion(lat, lon);
  return getWeatherByRegion(region);
}

/**
 * Mock 날씨 데이터 생성 (API 실패 시 fallback)
 */
export function generateMockWeather(region: KoreaRegion): WeatherData {
  const coords = REGION_COORDS[region] || REGION_COORDS.seoul;

  // 현재 월 기준 계절 판단
  const month = new Date().getMonth() + 1;
  let baseTemp: number;
  let description: string;

  if (month >= 3 && month <= 5) {
    // 봄
    baseTemp = 15;
    description = '맑음';
  } else if (month >= 6 && month <= 8) {
    // 여름
    baseTemp = 28;
    description = '구름 조금';
  } else if (month >= 9 && month <= 11) {
    // 가을
    baseTemp = 18;
    description = '맑음';
  } else {
    // 겨울
    baseTemp = 2;
    description = '흐림';
  }

  const now = new Date();
  const forecast: HourlyForecast[] = [];

  for (let i = 1; i <= 6; i++) {
    const forecastHour = (now.getHours() + i * 3) % 24;
    forecast.push({
      time: `${forecastHour.toString().padStart(2, '0')}:00`,
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
 * 캐시 초기화 (테스트용)
 */
export function clearWeatherCache(): void {
  weatherCache.clear();
}

/**
 * 캐시 상태 확인 (테스트/디버그용)
 */
export function getWeatherCacheStatus(): {
  size: number;
  regions: KoreaRegion[];
} {
  return {
    size: weatherCache.size,
    regions: Array.from(weatherCache.keys()),
  };
}
