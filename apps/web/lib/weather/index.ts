/**
 * 날씨 API 클라이언트 (Open-Meteo)
 *
 * @description 무료 API, 키 불필요
 * @see https://open-meteo.com/
 */

// 기본 위치: 서울
const DEFAULT_COORDS = {
  latitude: 37.5665,
  longitude: 126.978,
};

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    precipitation: number;
    weather_code: number;
  };
}

export interface WeatherData {
  temp: number;
  precipitation: number;
  condition: string;
}

// WMO 날씨 코드 → 한국어 조건
const WEATHER_CONDITIONS: Record<number, string> = {
  0: '맑음',
  1: '대체로 맑음',
  2: '구름 조금',
  3: '흐림',
  45: '안개',
  48: '짙은 안개',
  51: '가벼운 이슬비',
  53: '이슬비',
  55: '강한 이슬비',
  61: '가벼운 비',
  63: '비',
  65: '강한 비',
  66: '가벼운 진눈깨비',
  67: '진눈깨비',
  71: '가벼운 눈',
  73: '눈',
  75: '강한 눈',
  77: '싸라기눈',
  80: '가벼운 소나기',
  81: '소나기',
  82: '강한 소나기',
  85: '가벼운 눈보라',
  86: '눈보라',
  95: '천둥번개',
  96: '천둥번개 + 우박',
  99: '천둥번개 + 강한 우박',
};

/**
 * 현재 날씨 조회
 *
 * @param latitude 위도 (기본: 서울)
 * @param longitude 경도 (기본: 서울)
 */
export async function getCurrentWeather(
  latitude = DEFAULT_COORDS.latitude,
  longitude = DEFAULT_COORDS.longitude
): Promise<WeatherData | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('current', 'temperature_2m,precipitation,weather_code');
    url.searchParams.set('timezone', 'Asia/Seoul');

    const response = await fetch(url.toString(), {
      next: { revalidate: 1800 }, // 30분 캐시
    });

    if (!response.ok) {
      console.error('[Weather] API error:', response.status);
      return null;
    }

    const data: OpenMeteoResponse = await response.json();

    return {
      temp: Math.round(data.current.temperature_2m),
      precipitation: Math.round(data.current.precipitation * 100), // mm → %로 근사 변환
      condition: WEATHER_CONDITIONS[data.current.weather_code] || '알 수 없음',
    };
  } catch (error) {
    console.error('[Weather] Fetch error:', error);
    return null;
  }
}

/**
 * 클라이언트 컴포넌트용 날씨 조회
 * (브라우저 Geolocation 사용 가능)
 */
export async function getWeatherWithGeolocation(): Promise<WeatherData | null> {
  // 브라우저 환경 확인
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return getCurrentWeather();
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
        maximumAge: 600000, // 10분 캐시
      });
    });

    return getCurrentWeather(position.coords.latitude, position.coords.longitude);
  } catch {
    // 위치 권한 거부 시 서울 기본값
    return getCurrentWeather();
  }
}
