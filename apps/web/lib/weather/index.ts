/**
 * 날씨 API 클라이언트 (Open-Meteo)
 *
 * @description 무료 API, 키 불필요
 * @see https://open-meteo.com/
 */

// 기본 위치: 서울 (사용자 위치가 아님 — locationSource='default'로 표시해 UI가 "서울 기준"을 고지한다)
const DEFAULT_COORDS = {
  latitude: 37.5665,
  longitude: 126.978,
};

/**
 * 강수 판정 임계 (mm).
 * Open-Meteo `current.precipitation`은 **직전 1시간 강수량(mm)**이다(확률 %가 아님).
 * 0.1mm 미만은 관측 노이즈로 보고 "비가 온다"고 말하지 않는다.
 */
export const RAIN_THRESHOLD_MM = 0.1;

/** 강한 비 임계 (mm/h) — 우산에 더해 방수 아우터까지 권고하는 기준 */
export const HEAVY_RAIN_THRESHOLD_MM = 2.5;

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    precipitation: number;
    weather_code: number;
    uv_index?: number;
    relative_humidity_2m?: number;
  };
}

/** 좌표 출처 — 'default'는 서울 기본 좌표(사용자 위치 아님). UI는 이 값으로 "서울 기준"을 고지한다 */
export type WeatherLocationSource = 'geolocation' | 'default';

export interface WeatherData {
  temp: number;
  /** 강수량 (mm) — 직전 1시간 관측값. **확률(%)이 아니다** */
  precipitationMm: number;
  /**
   * @deprecated `precipitationMm`과 동일한 mm 값(이름만 남은 하위호환 필드).
   * 과거 이 필드는 `mm * 100`을 "%"로 사칭했으나 그 변환은 폐지됐다.
   * 마지막 소비처(app/(main)/closet/recommend/page.tsx의 `weather.precipitation > 0` 3곳)를
   * `precipitationMm`으로 옮기면 제거한다.
   */
  precipitation: number;
  condition: string;
  /** UV 지수 (0-11+) */
  uvIndex: number;
  /** 상대 습도 (%) */
  humidity: number;
  /** 이 데이터가 어느 좌표에서 왔는지 — 위치 고지(정직성)용 */
  locationSource: WeatherLocationSource;
}

/** 환경 기반 웰니스 조언 */
export interface EnvironmentAdvice {
  skin: string[];
  fashion: string[];
  nutrition: string[];
  exercise: string[];
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
 * @param locationSource 좌표 출처 — 사용자 위치로 조회할 때만 'geolocation'(기본은 'default')
 */
export async function getCurrentWeather(
  latitude = DEFAULT_COORDS.latitude,
  longitude = DEFAULT_COORDS.longitude,
  locationSource: WeatherLocationSource = 'default'
): Promise<WeatherData | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set(
      'current',
      'temperature_2m,precipitation,weather_code,uv_index,relative_humidity_2m'
    );
    url.searchParams.set('timezone', 'Asia/Seoul');

    const response = await fetch(url.toString(), {
      // 서버(라우트 핸들러) 호출에만 적용되는 30분 재검증 — 클라이언트 호출에서는 무시된다
      // (홈 브리핑·환경 카드는 sessionStorage 30분 캐시로 별도 방어)
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      console.error('[Weather] API error:', response.status);
      return null;
    }

    const data: OpenMeteoResponse = await response.json();

    // 강수량은 mm 그대로 유지(소수 1자리) — 과거의 mm×100 "%" 사칭은 폐지
    const precipitationMm = Math.round(data.current.precipitation * 10) / 10;

    return {
      temp: Math.round(data.current.temperature_2m),
      precipitationMm,
      precipitation: precipitationMm, // @deprecated 하위호환(같은 mm 값)
      condition: WEATHER_CONDITIONS[data.current.weather_code] || '알 수 없음',
      uvIndex: Math.round((data.current.uv_index ?? 0) * 10) / 10,
      humidity: Math.round(data.current.relative_humidity_2m ?? 50),
      locationSource,
    };
  } catch (error) {
    console.error('[Weather] Fetch error:', error);
    return null;
  }
}

/**
 * 패션 조언 우선순위 — 낮을수록 앞. 소비처(홈 브리핑·모바일 브리핑)는 `fashion[0]` 한 줄만
 * 노출하므로 push 순서가 곧 "무엇을 보여줄지"의 결정이다. 몸이 젖는 문제가 먼저다.
 */
const FASHION_PRIORITY = {
  /** 강수 — 지금 젖는다(최우선) */
  precipitation: 0,
  /** 기온 — 한파·무더위 */
  temperature: 1,
  /** UV — 차단 소품 */
  uv: 2,
} as const;

/**
 * 강수 패션 조언 문구 — 관측 시제("지금 …")로만 말한다.
 * 강수량(mm)에는 눈(수상당량)도 포함되므로, 조건이 눈이면 "비"라고 하지 않는다.
 */
function precipitationFashionTip(weather: WeatherData): string {
  if (weather.condition.includes('눈')) {
    return '지금 눈이 내리고 있어요 — 방수 아우터와 미끄럼 방지 신발을 챙기세요';
  }
  return weather.precipitationMm >= HEAVY_RAIN_THRESHOLD_MM
    ? '지금 비가 내리고 있어요 — 우산과 방수 아우터를 챙기세요'
    : '지금 비가 내리고 있어요 — 우산을 챙기세요';
}

/**
 * 환경 데이터 기반 웰니스 조언 생성
 *
 * 날씨/UV/습도 → 피부/패션/영양/운동 크로스 조언
 * 근거: docs/TODO.md 섹션 7 "환경 적응형"
 *
 * 문구 계약: `WeatherData`는 **현재 관측값**이므로 조언도 관측 시제로 말한다("지금 …").
 * 예보가 아니므로 "예보"라고 단언하지 않는다(정직성).
 */
export function generateEnvironmentAdvice(weather: WeatherData): EnvironmentAdvice {
  const skin: string[] = [];
  const nutrition: string[] = [];
  const exercise: string[] = [];
  // 패션 조언은 우선순위와 함께 모아 마지막에 정렬한다(push 순서 ≠ 중요도)
  const fashionEntries: Array<{ priority: number; text: string }> = [];
  const pushFashion = (priority: number, text: string): void => {
    fashionEntries.push({ priority, text });
  };

  // UV 지수 기반 (피부 + 영양)
  if (weather.uvIndex >= 8) {
    skin.push('자외선 매우 강함 — SPF50+ PA++++ 필수, 2시간마다 덧바르기');
    skin.push('외출 후 진정 케어 (알로에/센텔라) 권장');
    nutrition.push('비타민C 섭취 강화 (자외선 손상 복구)');
    pushFashion(FASHION_PRIORITY.uv, '챙 넓은 모자 + 선글라스 필수');
  } else if (weather.uvIndex >= 5) {
    skin.push('자외선 강함 — SPF50 선크림 필수');
    nutrition.push('항산화 식품 (베리류, 녹차) 추천');
  } else if (weather.uvIndex >= 3) {
    skin.push('SPF30 이상 선크림 권장');
  }

  // 습도 기반 (피부)
  if (weather.humidity < 30) {
    skin.push('습도 매우 낮음 — 수분 크림 더블 레이어, 미스트 수시로');
    skin.push('입술/눈가 건조 주의 — 보습 립밤, 아이크림 필수');
    nutrition.push('수분 섭취 2L+ 권장 (피부 건조 방지)');
  } else if (weather.humidity < 50) {
    skin.push('습도 낮음 — 보습 강화 필요');
  } else if (weather.humidity > 80) {
    skin.push('습도 높음 — 가벼운 수분 제형, 유분 조절 필요');
    skin.push('T존 유분 관리 강화 (매트 프라이머 추천)');
  }

  // 기온 기반 (패션 + 운동)
  if (weather.temp < 0) {
    pushFashion(FASHION_PRIORITY.temperature, '한파 — 보온 레이어링 (내피+중간층+외피)');
    exercise.push('실외 운동 시 워밍업 10분+ 필수 (근육 부상 방지)');
    skin.push('찬바람 — 피부 장벽 보호 크림 필수');
  } else if (weather.temp < 10) {
    pushFashion(FASHION_PRIORITY.temperature, '쌀쌀 — 가벼운 아우터 + 목도리');
  } else if (weather.temp > 30) {
    pushFashion(FASHION_PRIORITY.temperature, '무더위 — 통풍 좋은 린넨/면 소재');
    exercise.push('탈수 주의 — 운동 전후 수분 500ml+');
    skin.push('땀 배출 후 즉시 세안 (모공 막힘 방지)');
    nutrition.push('전해질 보충 (스포츠 드링크 또는 소금물)');
  }

  // 강수 기반 — mm 관측값. "예보"가 아니라 "지금 내리는 중"으로 말한다
  if (weather.precipitationMm >= RAIN_THRESHOLD_MM) {
    pushFashion(FASHION_PRIORITY.precipitation, precipitationFashionTip(weather));
    exercise.push('실외 운동 대신 실내 운동 추천');
  }

  // 우선순위 정렬(강수 > 기온 > UV). Array.prototype.sort는 안정 정렬이라 동순위는 push 순서 유지
  const fashion = fashionEntries.sort((a, b) => a.priority - b.priority).map((entry) => entry.text);

  // 기본 조언이 없으면 추가
  if (skin.length === 0) skin.push('오늘은 기본 스킨케어 루틴으로 충분해요');
  if (fashion.length === 0) fashion.push('쾌적한 날씨 — 자유로운 스타일링 가능');

  return { skin, fashion, nutrition, exercise };
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
      // eslint-disable-next-line sonarjs/no-intrusive-permissions -- 날씨 기반 코디 추천에 위치 정보 필수
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
        maximumAge: 600000, // 10분 캐시
      });
    });

    return getCurrentWeather(position.coords.latitude, position.coords.longitude, 'geolocation');
  } catch {
    // 위치 권한 거부 시 서울 기본값 — locationSource='default'로 남아 UI가 "서울 기준"을 고지한다
    return getCurrentWeather();
  }
}
