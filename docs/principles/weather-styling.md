# 날씨 기반 스타일링 원리

> 이 문서는 날씨 연동 코디 추천(Phase I-1)의 기반이 되는 기본 원리를 설명한다.

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"실시간 날씨와 개인 특성을 완벽히 반영한 코디 추천"

- 체감온도, 강수확률, UV 지수를 모두 고려한 레이어링
- 퍼스널컬러, 체형에 맞는 스타일 제안
- 소유 옷장 연동으로 실제 가능한 코디 추천
- 시간대별 날씨 변화 예측 대응
```

### 물리적 한계

| 항목                 | 한계                                                          |
| -------------------- | ------------------------------------------------------------- |
| **날씨 예측 정확도** | 기상청/OpenWeatherMap 예보 정확도 한계 (3시간 이후 오차 증가) |
| **API 무료 할당량**  | OpenWeatherMap 무료 플랜: 1,000 calls/day                     |
| **실시간 변화**      | 날씨 급변 시 캐시된 데이터와 실제 불일치 가능                 |
| **개인 감각 차이**   | 같은 온도에서도 개인별 체감 차이 존재                         |

### 100점 기준

- **날씨 정확도**: 현재 온도 오차 ±2°C 이내
- **추천 적합도**: 사용자 피드백 만족도 85%+
- **응답 속도**: 캐시 히트 시 100ms 이내
- **API 효율성**: 무료 할당량 내 운영 (17개 지역 × 24시간 < 1,000)

### 현재 목표: 70%

- 체감온도 기반 7단계 레이어링 제공
- 17개 광역시/도 지역 지원
- 1시간 캐싱으로 API 효율화
- 퍼스널컬러/체형 기본 연동

### 의도적 제외

| 제외 항목                | 이유                           | 재검토 시점       |
| ------------------------ | ------------------------------ | ----------------- |
| 옷장 연동                | 옷장 모듈(Phase I-4) 별도 개발 | 옷장 모듈 완료 후 |
| 미세먼지 연동            | 별도 API 필요 (한국환경공단)   | Phase 2           |
| 시간대별 상세 추천       | MVP 범위 초과                  | 사용자 피드백 후  |
| One Call API (UV 정확값) | 유료 플랜 필요                 | 수익 모델 확립 후 |

---

## 1. 핵심 개념

### 1.1 체감온도 (Apparent Temperature)

체감온도는 실제 기온에 바람, 습도 등 환경 요소를 반영한 **인체가 느끼는 온도**다.

```
체감온도 = f(기온, 풍속, 습도, 일사량)
```

OpenWeatherMap API는 `feels_like` 필드로 체감온도를 제공한다.

### 1.2 레이어링 (Layering)

의류를 겹쳐 입어 체온을 조절하는 방법. 레이어 수에 따라:

| 레이어    | 구성                 | 온도 범위 |
| --------- | -------------------- | --------- |
| **4층**   | 패딩 + 니트 + 내의   | -5°C 이하 |
| **3층**   | 코트 + 맨투맨 + 셔츠 | -5~5°C    |
| **2층**   | 가디건 + 셔츠        | 5~12°C    |
| **1.5층** | 가벼운 아우터        | 12~18°C   |
| **1층**   | 긴팔 또는 반팔       | 18~23°C   |
| **0.5층** | 반팔 + 반바지        | 23~28°C   |
| **0층**   | 민소매/린넨          | 28°C 이상 |

### 1.3 TPO (Time, Place, Occasion)

날씨 외에 상황(TPO)을 고려한 추천:

- **Time**: 아침/낮/저녁 온도 변화
- **Place**: 실내/야외 활동 비율
- **Occasion**: 캐주얼/포멀/운동/데이트

### 1.4 계절 색상 조화

퍼스널컬러에 따른 계절별 색상 매칭:

| 계절     | 웜톤 추천            | 쿨톤 추천            |
| -------- | -------------------- | -------------------- |
| **봄**   | 코랄, 피치, 아이보리 | 라벤더, 스카이블루   |
| **여름** | 민트, 베이지         | 로즈핑크, 퍼플       |
| **가을** | 버건디, 머스타드     | 올리브, 테라코타     |
| **겨울** | 카멜, 브라운         | 블랙, 네이비, 화이트 |

---

## 2. 수학적 기반

### 2.1 레이어 수 계산 공식

체감온도(T)를 입력으로 레이어 수(L)를 계산:

```
L = max(0, min(4, (18 - T) / 6))

예시:
- T = -10°C → L = (18 - (-10)) / 6 = 4.67 → 4 (최대값)
- T = 6°C → L = (18 - 6) / 6 = 2.0
- T = 24°C → L = (18 - 24) / 6 = -1.0 → 0 (최소값)
```

### 2.2 UV 지수 기반 조정

UV 지수에 따른 추가 권장 사항:

```
UV 조정 = {
  UV ≥ 8: "자외선 차단 필수, 긴 소매 권장"
  UV ≥ 6: "자외선 차단제 필수"
  UV ≥ 3: "자외선 차단제 권장"
  UV < 3: "자외선 위험 낮음"
}
```

### 2.3 강수 확률 기반 조정

```
강수 조정 = {
  강수 ≥ 70%: "우산 필수, 방수 아우터 권장"
  강수 ≥ 40%: "접이식 우산 지참"
  강수 < 40%: "비 대비 불필요"
}
```

### 2.4 캐시 TTL 전략

17개 지역 × 24시간 API 호출 = 408 calls/day (무료 1,000 이내)

```
TTL = 1시간 (3,600,000ms)

캐시 전략:
1. 요청 시 캐시 확인
2. 캐시 유효 → 즉시 반환
3. 캐시 만료 → API 호출 → 캐시 갱신
4. API 실패 → 만료된 캐시 반환 (Stale-While-Error)
5. 캐시 없음 → Mock 데이터 반환 (계절 기반)
```

---

## 3. 구현 도출

### 3.1 원리 → 알고리즘

```
입력: 지역(region), 체형(bodyType), 퍼스널컬러(personalColor), 상황(occasion)
출력: 코디 추천(OutfitRecommendation)

알고리즘:
1. getWeatherByRegion(region) → WeatherData
2. calculateLayers(weather.current.feelsLike) → layerCount
3. selectBaseItems(layerCount, occasion) → LayerItem[]
4. adjustForBodyType(items, bodyType) → LayerItem[]
5. selectColors(personalColor, weather) → colors[]
6. addAccessories(weather) → accessories[]
7. generateTips(weather) → tips[]
```

### 3.2 알고리즘 → 코드

**레이어 계산:**

```typescript
function getLayerInfo(feelsLike: number): TempLayerInfo {
  if (feelsLike < -5) return TEMP_LAYERS.extreme_cold;
  if (feelsLike < 5) return TEMP_LAYERS.very_cold;
  if (feelsLike < 12) return TEMP_LAYERS.cold;
  if (feelsLike < 18) return TEMP_LAYERS.cool;
  if (feelsLike < 23) return TEMP_LAYERS.mild;
  if (feelsLike < 28) return TEMP_LAYERS.warm;
  return TEMP_LAYERS.hot;
}
```

**캐시 유효성 검사:**

```typescript
function isCacheValid(cached: CachedWeatherData | undefined): boolean {
  if (!cached) return false;
  return Date.now() < cached.expiresAt;
}
```

**UV 지수 추정 (무료 플랜):**

```typescript
function estimateUVI(): number {
  const hour = new Date().getHours();

  if (hour < 6 || hour > 19) return 0; // 밤
  if (hour < 9 || hour > 17) return 2; // 이른 아침/저녁
  if (hour < 11 || hour > 15) return 4; // 오전/오후
  return 6; // 한낮 (11-15시)
}
```

### 3.3 체형별 조정

```typescript
const BODY_TYPE_ADJUSTMENTS = {
  S: { focus: 'straight_lines', avoid: 'volume_on_shoulders' },
  W: { focus: 'fitted_waist', avoid: 'boxy_silhouette' },
  N: { focus: 'relaxed_fit', avoid: 'too_tight' },
};
```

| 체형        | 레이어링 조정                 | 이유                |
| ----------- | ----------------------------- | ------------------- |
| **S(직선)** | 직선적 실루엣, 어깨 볼륨 피함 | 곡선 추가 시 밸런스 |
| **W(곡선)** | 허리 강조, 박시 피함          | 곡선미 유지         |
| **N(자연)** | 여유 있는 핏                  | 편안한 실루엣       |

---

## 4. 데이터 흐름

### 4.1 API 연동 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│                        날씨 데이터 흐름                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  사용자 위치 ──┬── 위도/경도 ──┬── findNearestRegion() ──┐      │
│               │              │                          │        │
│               │              │                          ▼        │
│               │              │              ┌───────────────┐    │
│               │              │              │ 17개 지역 코드│    │
│               │              │              │ (KoreaRegion) │    │
│               │              │              └───────┬───────┘    │
│               │              │                      │            │
│               │              │                      ▼            │
│               │              │              ┌───────────────┐    │
│               │              │              │ 메모리 캐시    │    │
│               │              │              │ (Map<Region>)│    │
│               │              │              └───────┬───────┘    │
│               │              │                      │            │
│               │              │        캐시 유효? ───┼─── 예 ──▶ 반환 │
│               │              │                      │            │
│               │              │                      │ 아니오      │
│               │              │                      ▼            │
│               │              │              ┌───────────────┐    │
│               │              │              │ OpenWeatherMap│    │
│               │              │              │ API 호출      │    │
│               │              │              └───────┬───────┘    │
│               │              │                      │            │
│               │              │              캐시 저장 + 반환     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 코디 추천 파이프라인

```
WeatherData ─┬─ 체감온도 ──▶ 레이어 계산 ──▶ 기본 아이템
             │
             ├─ UV 지수 ───▶ 자외선 팁 ──────▶ tips[]
             │
             ├─ 강수확률 ──▶ 우산/방수 ──────▶ accessories[]
             │
             ╰─ 온도 설명 ─▶ 요약 생성 ──────▶ weatherSummary

BodyType ───────▶ 실루엣 조정 ──────────────▶ LayerItem 수정

PersonalColor ──▶ 색상 선택 ───────────────▶ colors[]

Occasion ───────▶ TPO 조정 ────────────────▶ 아이템 필터링
```

---

## 5. 검증 방법

### 5.1 캐시 효율성 검증

```typescript
// 테스트: 캐시 히트율 80% 이상
describe('Weather Cache', () => {
  it('should return cached data within TTL', async () => {
    await getWeatherByRegion('seoul'); // 첫 호출: API
    await getWeatherByRegion('seoul'); // 두 번째: 캐시

    expect(getWeatherCacheStatus().size).toBe(1);
  });
});
```

### 5.2 레이어 계산 검증

```typescript
describe('Layer Calculation', () => {
  it.each([
    [-10, 'extreme_cold', 4],
    [0, 'very_cold', 3],
    [8, 'cold', 2],
    [15, 'cool', 1.5],
    [20, 'mild', 1],
    [25, 'warm', 0.5],
    [30, 'hot', 0],
  ])('feelsLike %d → %s (layers: %d)', (temp, expected, layers) => {
    const result = getLayerInfo(temp);
    expect(result.layers).toBe(layers);
  });
});
```

### 5.3 Fallback 검증

```typescript
describe('Weather Fallback', () => {
  it('should return mock data when API fails', async () => {
    // API 실패 시뮬레이션
    process.env.OPENWEATHER_API_KEY = '';

    const result = await getWeatherByRegion('seoul');

    expect(result).toBeDefined();
    expect(result.region).toBe('seoul');
    expect(result.location).toBe('서울');
  });
});
```

---

## 6. 관련 문서

### 구현 스펙

| 문서                                         | 설명             |
| -------------------------------------------- | ---------------- |
| `apps/web/lib/style/weatherService.ts`       | 날씨 서비스 구현 |
| `apps/web/types/weather.ts`                  | 타입 정의, 상수  |
| `apps/web/app/(main)/style/weather/page.tsx` | UI 컴포넌트      |

### 관련 원리 문서

| 문서                                         | 설명            |
| -------------------------------------------- | --------------- |
| [color-science.md](./color-science.md)       | 퍼스널컬러 연동 |
| [body-mechanics.md](./body-mechanics.md)     | 체형 기반 조정  |
| [fashion-matching.md](./fashion-matching.md) | 패션 매칭 원리  |

### 관련 ADR

| 문서    | 설명                      |
| ------- | ------------------------- |
| ADR-050 | 패션/옷장 크로스모듈 연동 |
| ADR-036 | 스마트 조합 엔진          |

---

## 7. 참고 자료

### 기상학

- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [체감온도 산출 공식 (기상청)](https://www.weather.go.kr)
- [UV Index Scale (WHO)](https://www.who.int/uv/intersunprogramme/activities/uv_index/en/)

### 패션 이론

- "Fashion Forecasting" by Evelyn L. Brannon
- "Weather-Responsive Clothing Systems" (Journal of Fashion Marketing and Management)

---

**Version**: 1.0 | **Created**: 2026-02-04
**관련 코드**: `lib/style/weatherService.ts`, `types/weather.ts`
