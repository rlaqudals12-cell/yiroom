/**
 * 날씨 서비스 타입
 * 17개 한국 지역 + 현재/시간별 날씨 데이터
 */

export type KoreaRegion =
  | 'seoul'
  | 'busan'
  | 'daegu'
  | 'incheon'
  | 'gwangju'
  | 'daejeon'
  | 'ulsan'
  | 'sejong'
  | 'gyeonggi'
  | 'gangwon'
  | 'chungbuk'
  | 'chungnam'
  | 'jeonbuk'
  | 'jeonnam'
  | 'gyeongbuk'
  | 'gyeongnam'
  | 'jeju';

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  uvi: number;
  description: string;
  icon: string;
  precipitation: number;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  feelsLike: number;
  precipitation: number;
  description: string;
  icon: string;
}

export interface WeatherData {
  region: KoreaRegion;
  location: string;
  current: CurrentWeather;
  forecast: HourlyForecast[];
  cachedAt: string;
}

export const REGION_INFO: Record<KoreaRegion, { lat: number; lon: number; nameKr: string }> = {
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

// 캐시 TTL: 1시간
export const WEATHER_CACHE_TTL_MS = 60 * 60 * 1000;
