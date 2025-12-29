# SPEC-WEATHER-OUTFIT.md

> 날씨 연동 AI 코디 추천 기능

## 개요

| 항목 | 내용 |
|------|------|
| 모듈 | C-1 (체형), Style (스타일 추천) |
| 우선순위 | 높음 (Phase I-1) |
| 예상 기간 | 3-4일 |
| 의존성 | OpenWeatherMap API |

## 목표

실시간 날씨 데이터를 기반으로 체형에 맞는 코디를 추천.
단순 계절 분류가 아닌 기온/강수/자외선 기반 동적 추천.

## 구현 수준: 중급 (Option B)

### 선택 이유

| 옵션 | 내용 | 선택 |
|------|------|------|
| A (기본) | 정적 계절 4분류 | ❌ |
| B (중급) | 날씨 API + 기온 기반 추천 | ✅ |
| C (고급) | AI 실시간 최적화 | 추후 |

Option B로 시작하여 사용자 피드백 후 C로 확장.

## 기능 요구사항

### 핵심 기능 (Must Have)

1. **날씨 데이터 수집**
   - 사용자 위치 기반 현재 날씨
   - 시간대별 예보 (6시간)
   - 캐싱 (15분)

2. **기온 기반 레이어링**
   - 체감온도 기준 의류 레이어 추천
   - 아우터/상의/하의 조합
   - 소재 권장 (면, 울, 폴리에스터 등)

3. **강수 대응**
   - 비/눈 예보 시 방수 아이템 추천
   - 우산/장화 알림

4. **자외선 지수**
   - UV 지수 높을 때 선글라스/모자 추천
   - 밝은 색상 의류 제안

### 부가 기능 (Nice to Have)

5. **주간 코디 플래너**
   - 일주일 날씨 예보 기반
   - 날짜별 코디 미리 계획

6. **알림**
   - 아침 코디 추천 푸시
   - 갑작스러운 날씨 변화 알림

## 기술 설계

### 날씨 API

```typescript
// OpenWeatherMap API (무료 플랜: 1,000 calls/day)
const OPENWEATHER_API = 'https://api.openweathermap.org/data/2.5';

// 현재 날씨
GET /weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric&lang=kr

// 시간별 예보
GET /forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric&lang=kr
```

### 파일 구조

```
apps/web/
├── app/
│   ├── (main)/style/
│   │   ├── page.tsx              # 스타일 메인 페이지
│   │   └── weather/
│   │       └── page.tsx          # 날씨 코디 페이지
│   └── api/
│       ├── weather/
│       │   └── route.ts          # 날씨 프록시 API
│       └── style/
│           └── recommend/
│               └── route.ts      # 코디 추천 API
├── components/style/
│   ├── WeatherCard.tsx           # 날씨 정보 카드
│   ├── OutfitRecommendation.tsx  # 코디 추천 카드
│   ├── LayeringGuide.tsx         # 레이어링 가이드
│   └── WeeklyPlanner.tsx         # 주간 플래너
├── lib/style/
│   ├── weatherService.ts         # 날씨 서비스
│   └── outfitRecommender.ts      # 코디 추천 로직
└── types/
    └── weather.ts                # 날씨 타입
```

### 타입 정의

```typescript
// types/weather.ts

export interface WeatherData {
  location: string;
  current: {
    temp: number;           // 섭씨
    feelsLike: number;      // 체감온도
    humidity: number;       // 습도 (%)
    windSpeed: number;      // 풍속 (m/s)
    uvi: number;            // UV 지수 (0-11+)
    description: string;    // "맑음", "흐림" 등
    icon: string;           // 아이콘 코드
    precipitation: number;  // 강수 확률 (%)
  };
  forecast: HourlyForecast[];
}

export interface HourlyForecast {
  time: string;
  temp: number;
  feelsLike: number;
  precipitation: number;
  description: string;
  icon: string;
}

export interface OutfitRecommendation {
  layers: LayerItem[];
  accessories: string[];
  colors: string[];
  materials: string[];
  tips: string[];
  weatherSummary: string;
}

export interface LayerItem {
  type: 'outer' | 'top' | 'bottom' | 'shoes';
  name: string;
  reason: string;
  imageUrl?: string;
  productLink?: string;  // 제품 추천 연동
}
```

### 코디 추천 로직

```typescript
// lib/style/outfitRecommender.ts

// 체감온도 기준 레이어링
const TEMP_LAYERS = {
  extreme_cold: { min: -Infinity, max: -5, layers: 4 },  // 패딩+니트+내의
  very_cold: { min: -5, max: 5, layers: 3 },             // 코트+맨투맨+셔츠
  cold: { min: 5, max: 12, layers: 2 },                  // 가디건+셔츠
  cool: { min: 12, max: 18, layers: 1.5 },               // 가벼운 아우터
  mild: { min: 18, max: 23, layers: 1 },                 // 긴팔 or 반팔
  warm: { min: 23, max: 28, layers: 0.5 },               // 반팔+반바지
  hot: { min: 28, max: Infinity, layers: 0 },            // 민소매/린넨
};

// 체형별 추천 조정
const BODY_TYPE_ADJUSTMENTS = {
  S: { focus: 'straight_lines', avoid: 'volume_on_shoulders' },
  W: { focus: 'fitted_waist', avoid: 'boxy_silhouette' },
  N: { focus: 'relaxed_fit', avoid: 'too_tight' },
};

export function recommendOutfit(
  weather: WeatherData,
  bodyType: string,
  personalColor: string
): OutfitRecommendation {
  const feelsLike = weather.current.feelsLike;
  const precipitation = weather.current.precipitation;
  const uvi = weather.current.uvi;

  // 기온 기반 레이어 결정
  const layerInfo = determineLayer(feelsLike);

  // 강수 대응
  const rainItems = precipitation > 50
    ? ['우산', '방수 아우터', '레인부츠']
    : [];

  // UV 대응
  const sunItems = uvi > 5
    ? ['선글라스', '모자', '자외선 차단 카디건']
    : [];

  // 체형별 조정
  const bodyAdjust = BODY_TYPE_ADJUSTMENTS[bodyType];

  // 퍼스널컬러 적용
  const colorPalette = getSeasonalColors(personalColor, feelsLike);

  return {
    layers: generateLayers(layerInfo, bodyAdjust),
    accessories: [...rainItems, ...sunItems],
    colors: colorPalette,
    materials: selectMaterials(feelsLike, precipitation),
    tips: generateTips(weather, bodyAdjust),
    weatherSummary: `${weather.current.description}, ${feelsLike}°C 체감`,
  };
}
```

### API 설계

#### GET /api/weather

**Request:**
```
GET /api/weather?lat=37.5665&lon=126.9780
```

**Response:**
```json
{
  "location": "서울특별시 중구",
  "current": {
    "temp": 12,
    "feelsLike": 10,
    "humidity": 65,
    "windSpeed": 3.5,
    "uvi": 4,
    "description": "맑음",
    "icon": "01d",
    "precipitation": 0
  },
  "forecast": [
    { "time": "12:00", "temp": 14, "feelsLike": 12, "precipitation": 0, "description": "맑음" },
    { "time": "15:00", "temp": 15, "feelsLike": 13, "precipitation": 10, "description": "구름 조금" }
  ],
  "cachedAt": "2025-01-15T10:30:00Z"
}
```

#### POST /api/style/recommend

**Request:**
```json
{
  "weather": { /* WeatherData */ },
  "bodyType": "S",
  "personalColor": "spring_warm",
  "occasion": "casual"
}
```

**Response:**
```json
{
  "layers": [
    {
      "type": "outer",
      "name": "트렌치코트",
      "reason": "10°C 체감온도에 적합한 아우터",
      "productLink": "/products/coat-123"
    },
    {
      "type": "top",
      "name": "니트 스웨터",
      "reason": "레이어링하기 좋은 중간 두께"
    },
    {
      "type": "bottom",
      "name": "슬랙스",
      "reason": "스트레이트 체형에 어울리는 직선 핏"
    }
  ],
  "accessories": ["선글라스"],
  "colors": ["아이보리", "베이지", "카멜"],
  "materials": ["울 블렌드", "면"],
  "tips": [
    "오후에 기온이 올라갈 예정이에요. 레이어드하면 편해요!",
    "UV 지수가 높으니 선글라스 챙기세요"
  ],
  "weatherSummary": "맑음, 10°C 체감"
}
```

## UI/UX 설계

### 화면 구성

1. **스타일 메인** (`/style`)
   - 상단: 현재 날씨 카드 (온도, 아이콘, 설명)
   - 중앙: 오늘의 코디 추천
   - 하단: 시간대별 날씨 + 복장 팁

2. **날씨 코디 상세** (`/style/weather`)
   - 레이어링 가이드 (아우터→상의→하의)
   - 액세서리 체크리스트
   - 추천 색상 팔레트
   - 제품 추천 연동

3. **주간 플래너**
   - 7일 날씨 요약
   - 날짜별 핵심 아이템
   - 캘린더 뷰

### 컴포넌트 구조

```tsx
// 날씨 카드
<WeatherCard
  location="서울"
  temp={12}
  feelsLike={10}
  description="맑음"
  icon="01d"
  precipitation={0}
/>

// 코디 추천
<OutfitRecommendation
  layers={layers}
  accessories={accessories}
  colors={colors}
  tips={tips}
  onProductClick={handleProductClick}
/>

// 레이어링 가이드
<LayeringGuide
  feelsLike={10}
  bodyType="S"
  layers={[
    { type: 'outer', item: '트렌치코트' },
    { type: 'top', item: '니트' },
    { type: 'bottom', item: '슬랙스' },
  ]}
/>
```

## 환경변수

```bash
# .env.local
OPENWEATHER_API_KEY=your_api_key_here

# 캐시 TTL (분)
WEATHER_CACHE_TTL=15
```

## 테스트 계획

### 테스트 케이스

1. **weatherService**
   - 위치 기반 날씨 조회
   - API 에러 시 fallback
   - 캐싱 동작 확인

2. **outfitRecommender**
   - 각 온도 구간별 레이어링
   - 강수 시 방수 아이템 추가
   - UV 높을 때 선글라스 추천
   - 체형별 조정 적용

3. **컴포넌트**
   - WeatherCard 렌더링
   - OutfitRecommendation 제품 링크
   - 위치 권한 거부 처리

## 성공 지표

| 지표 | 목표 |
|------|------|
| 날씨 코디 조회율 | DAU의 30% |
| 제품 클릭률 | 코디 조회의 15% |
| 사용자 만족도 | 4.2/5.0 |
| 재사용률 | 주 3회 이상 |

## 일정

| 날짜 | 작업 |
|------|------|
| Day 1 | 날씨 API 연동, 타입 정의 |
| Day 2 | 코디 추천 로직 구현 |
| Day 3 | UI 컴포넌트 구현 |
| Day 4 | 통합, 테스트, 버그 수정 |

---

**문서 버전**: 1.0
**작성일**: 2025-12-28
**작성자**: Claude Code
