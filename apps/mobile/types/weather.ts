/**
 * 날씨 연동 코디 추천 타입 정의
 * Phase I-1: 날씨 API + 기온 기반 추천 (Option B)
 */

// 한국 주요 지역 코드
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

// 지역별 좌표
export interface RegionCoordinates {
  lat: number;
  lon: number;
  nameKr: string;
  nameEn: string;
}

// 지역 좌표 매핑
export const KOREA_REGIONS: Record<KoreaRegion, RegionCoordinates> = {
  seoul: { lat: 37.5665, lon: 126.978, nameKr: '서울', nameEn: 'Seoul' },
  busan: { lat: 35.1796, lon: 129.0756, nameKr: '부산', nameEn: 'Busan' },
  daegu: { lat: 35.8714, lon: 128.6014, nameKr: '대구', nameEn: 'Daegu' },
  incheon: { lat: 37.4563, lon: 126.7052, nameKr: '인천', nameEn: 'Incheon' },
  gwangju: { lat: 35.1595, lon: 126.8526, nameKr: '광주', nameEn: 'Gwangju' },
  daejeon: { lat: 36.3504, lon: 127.3845, nameKr: '대전', nameEn: 'Daejeon' },
  ulsan: { lat: 35.5384, lon: 129.3114, nameKr: '울산', nameEn: 'Ulsan' },
  sejong: { lat: 36.48, lon: 127.289, nameKr: '세종', nameEn: 'Sejong' },
  gyeonggi: { lat: 37.4138, lon: 127.5183, nameKr: '경기', nameEn: 'Gyeonggi' },
  gangwon: { lat: 37.8228, lon: 128.1555, nameKr: '강원', nameEn: 'Gangwon' },
  chungbuk: { lat: 36.6357, lon: 127.4914, nameKr: '충북', nameEn: 'Chungbuk' },
  chungnam: { lat: 36.6588, lon: 126.6728, nameKr: '충남', nameEn: 'Chungnam' },
  jeonbuk: { lat: 35.8203, lon: 127.1089, nameKr: '전북', nameEn: 'Jeonbuk' },
  jeonnam: { lat: 34.8161, lon: 126.4629, nameKr: '전남', nameEn: 'Jeonnam' },
  gyeongbuk: { lat: 36.576, lon: 128.5056, nameKr: '경북', nameEn: 'Gyeongbuk' },
  gyeongnam: { lat: 35.4606, lon: 128.2132, nameKr: '경남', nameEn: 'Gyeongnam' },
  jeju: { lat: 33.4996, lon: 126.5312, nameKr: '제주', nameEn: 'Jeju' },
};

// 현재 날씨 데이터
export interface CurrentWeather {
  temp: number; // 섭씨
  feelsLike: number; // 체감온도
  humidity: number; // 습도 (%)
  windSpeed: number; // 풍속 (m/s)
  uvi: number; // UV 지수 (0-11+)
  description: string; // "맑음", "흐림" 등
  icon: string; // 아이콘 코드
  precipitation: number; // 강수 확률 (%)
}

// 시간별 예보
export interface HourlyForecast {
  time: string; // "12:00" 형식
  temp: number;
  feelsLike: number;
  precipitation: number;
  description: string;
  icon: string;
}

// 날씨 데이터 응답
export interface WeatherData {
  region: KoreaRegion;
  location: string; // 지역명 (한글)
  current: CurrentWeather;
  forecast: HourlyForecast[]; // 6시간 예보
  cachedAt: string; // ISO 형식
}

// 캐시된 날씨 데이터
export interface CachedWeatherData extends WeatherData {
  expiresAt: number; // timestamp
}

// 레이어 아이템
export interface LayerItem {
  type: 'outer' | 'top' | 'bottom' | 'shoes';
  name: string;
  reason: string;
  imageUrl?: string;
  productLink?: string; // 제품 추천 연동
}

// 코디 추천 응답
export interface OutfitRecommendation {
  layers: LayerItem[];
  accessories: string[];
  colors: string[];
  materials: string[];
  tips: string[];
  weatherSummary: string;
}

// 온도 구간별 레이어링 정보
export interface TempLayerInfo {
  min: number;
  max: number;
  layers: number; // 레이어 개수 (0 = 민소매, 4 = 패딩+니트+내의)
  description: string;
}

// 체감온도 기준 레이어링 (7단계)
export const TEMP_LAYERS: Record<string, TempLayerInfo> = {
  extreme_cold: {
    min: -Infinity,
    max: -5,
    layers: 4,
    description: '패딩+니트+내의',
  },
  very_cold: {
    min: -5,
    max: 5,
    layers: 3,
    description: '코트+맨투맨+셔츠',
  },
  cold: {
    min: 5,
    max: 12,
    layers: 2,
    description: '가디건+셔츠',
  },
  cool: {
    min: 12,
    max: 18,
    layers: 1.5,
    description: '가벼운 아우터',
  },
  mild: {
    min: 18,
    max: 23,
    layers: 1,
    description: '긴팔 또는 반팔',
  },
  warm: {
    min: 23,
    max: 28,
    layers: 0.5,
    description: '반팔+반바지',
  },
  hot: {
    min: 28,
    max: Infinity,
    layers: 0,
    description: '민소매/린넨',
  },
};

// 체형별 스타일 조정
export interface BodyTypeAdjustment {
  focus: string;
  avoid: string;
}

export const BODY_TYPE_ADJUSTMENTS: Record<string, BodyTypeAdjustment> = {
  S: { focus: 'straight_lines', avoid: 'volume_on_shoulders' },
  W: { focus: 'fitted_waist', avoid: 'boxy_silhouette' },
  N: { focus: 'relaxed_fit', avoid: 'too_tight' },
};

// 코디 추천 요청
export interface OutfitRecommendRequest {
  weather: WeatherData;
  bodyType: string;
  personalColor: string;
  occasion?: 'casual' | 'formal' | 'workout' | 'date';
}

// API 에러 응답
export interface WeatherApiError {
  error: string;
  code?: string;
}

// 캐시 설정
export const WEATHER_CACHE_TTL_MS = 60 * 60 * 1000; // 1시간 (밀리초)
