# ADR-030: 영양 모듈 아키텍처 (N-1)

## 상태

`accepted`

## 날짜

2026-01-19

## 맥락 (Context)

이룸은 AI 기반 영양 추적 및 식단 관리 기능이 필요합니다. 피부(S-1), 체형(C-1), 운동(W-1) 모듈과 통합되어 전체적인 웰니스 관리를 제공해야 합니다.

### 요구사항

1. **AI 음식 인식**: 사진 촬영으로 음식/영양소 자동 분석
2. **바코드 스캐닝**: 가공식품 영양정보 자동 입력
3. **BMR/TDEE 계산**: 개인별 권장 섭취량 산출
4. **크로스 모듈 통합**: 피부/운동 모듈과 영양 연계 인사이트
5. **단식 추적**: 간헐적 단식 스케줄 관리

## P1: 궁극의 형태 (Ultimate Form)

> 원리 참조: [00-first-principles.md](../../.claude/rules/00-first-principles.md) P1

### 이상적 최종 상태

**제약이 없다면**:
- 사진 촬영만으로 100% 정확한 영양 정보 분석
- 실시간 바이오마커 연동 (혈당, 케톤 등)
- 개인 유전체 기반 완전 맞춤 영양 추천
- 식사 전후 자동 기록 (웨어러블 연동)
- 모든 식당/레시피 DB 완벽 커버리지

### 물리적 한계

| 제약 | 현실 | 완화 |
|------|------|------|
| AI 음식 인식 정확도 | 현재 기술 ~85% | Mock Fallback + 수동 수정 |
| 바코드 DB 커버리지 | 한국 식품 ~70% | 다중 소스 (식품안전나라 + OpenFoodFacts) |
| 실시간 바이오마커 | 웨어러블 미통합 | Phase 2 이후 |
| 유전체 분석 | 규제 및 비용 | 범위 외 |

### 100점 기준

| 항목 | 100점 기준 | 현재 목표 |
|------|-----------|----------|
| 음식 인식 정확도 | 98%+ | 85% |
| 바코드 인식률 | 95%+ | 80% |
| 칼로리 오차 | ±5% 이내 | ±15% |
| 크로스 모듈 인사이트 | 5개 모듈 연동 | S-1, W-1 연동 |
| 사용자 만족도 | NPS 70+ | NPS 40+ |

### 현재 목표

**Phase 1: 65%** (기본 기능 구현)
- AI 음식 인식 + 바코드 스캔
- BMR/TDEE 계산
- 트래픽 라이트 시스템
- S-1, W-1 크로스 모듈 연동

### 의도적 제외

| 제외 항목 | 사유 | 재검토 시점 |
|----------|------|------------|
| 유전체 기반 추천 | 규제 복잡성, MVP 범위 초과 | Series A 이후 |
| 웨어러블 연동 | 하드웨어 의존성 | MAU 50K+ |
| 실시간 바이오마커 | 기술 성숙도 부족 | 2027년 이후 |
| 영양사 검증 시스템 | 비용, MVP 범위 초과 | 유료 전환 시점 |

---

## 결정 (Decision)

**하이브리드 영양 분석 시스템** 아키텍처 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                   영양 모듈 아키텍처 (N-1)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  입력 채널                                                    │
│  ├── 사진 분석 (Gemini Vision API)                          │
│  │   └── 3초 타임아웃 + 2회 재시도 → Mock 폴백              │
│  ├── 바코드 스캔 (OpenFoodFacts + FoodSafetyKorea)          │
│  │   └── 글로벌 → 한국 DB 순차 조회                         │
│  └── 수동 입력                                               │
│                                                              │
│  핵심 계산 엔진                                               │
│  ├── BMR (Harris-Benedict 공식)                             │
│  │   └── 성별, 나이, 키, 체중 기반                          │
│  ├── TDEE (활동 계수 × BMR)                                 │
│  │   └── 1.2(좌식) ~ 1.9(매우 활동적)                       │
│  └── 트래픽 라이트 시스템 (Green/Yellow/Red)                │
│       └── 당/나트륨/지방 기준 3단계 분류                    │
│                                                              │
│  크로스 모듈 인사이트                                        │
│  ├── S-1 연동: 피부 건강을 위한 영양 추천                   │
│  ├── W-1 연동: 운동 전후 영양 타이밍                        │
│  └── C-1 연동: 체형 목표별 칼로리 조절                      │
│                                                              │
│  데이터 저장 (Supabase)                                      │
│  ├── nutrition_settings: 사용자 설정, BMR/TDEE              │
│  ├── meal_records: 개별 식사 기록                           │
│  ├── water_records: 수분 섭취 추적                          │
│  └── daily_nutrition_summary: 일일 집계                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### BMR/TDEE 계산 공식

```typescript
// Harris-Benedict 공식
function calculateBMR(
  gender: 'male' | 'female',
  weight: number, // kg
  height: number, // cm
  age: number
): number {
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  }
  return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
}

// 활동 계수
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // 좌식 생활
  light: 1.375,        // 가벼운 활동
  moderate: 1.55,      // 중간 활동
  active: 1.725,       // 활발한 활동
  veryActive: 1.9,     // 매우 활발
};

// TDEE = BMR × 활동 계수
```

### 트래픽 라이트 시스템

```typescript
interface TrafficLightCriteria {
  // Green: 건강한 선택
  green: {
    sugar: { max: 5 },      // g per serving
    sodium: { max: 400 },   // mg per serving
    saturatedFat: { max: 3 } // g per serving
  };
  // Yellow: 적당히 섭취
  yellow: {
    sugar: { max: 15 },
    sodium: { max: 800 },
    saturatedFat: { max: 7 }
  };
  // Red: 제한 필요
  red: {
    sugar: { min: 15 },
    sodium: { min: 800 },
    saturatedFat: { min: 7 }
  };
}
```

### 바코드 조회 전략

```typescript
// 멀티 소스 바코드 조회 (순차 폴백)
async function lookupBarcode(barcode: string): Promise<FoodData | null> {
  // 1. 한국 식품안전나라 (국내 제품 우선)
  const koreaResult = await searchFoodSafetyKorea(barcode);
  if (koreaResult) return koreaResult;

  // 2. OpenFoodFacts (글로벌 폴백)
  const globalResult = await searchOpenFoodFacts(barcode);
  if (globalResult) return globalResult;

  // 3. 수동 입력 안내
  return null;
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| Mifflin-St Jeor 공식 | 현대인에 더 정확 | 한국인 데이터 부족 | `LOW_DATA` - 검증 부족 |
| 영양사 검증 시스템 | 전문가 정확도 | 비용, 속도 | `HIGH_COST` - MVP 범위 초과 |
| 단일 바코드 DB | 단순 구현 | 커버리지 제한 | `LOW_COVERAGE` - 한국 제품 누락 |
| 포인트 기반 (Weight Watchers) | 단순화 | 교육적 가치 낮음 | `LOW_ROI` - 이룸 철학 불일치 |

## 결과 (Consequences)

### 긍정적 결과

- **빠른 기록**: 사진 촬영만으로 영양 분석
- **한국 최적화**: 국내 식품 DB 우선 조회
- **통합 인사이트**: 피부/운동과 연계된 추천
- **동기 부여**: 트래픽 라이트로 직관적 피드백

### 부정적 결과

- **AI 정확도 한계**: 음식 인식 오류 가능
- **DB 의존성**: 바코드 DB 커버리지 제한

### 리스크 완화

- AI 분석 실패 → **Mock 데이터 폴백 + 수동 수정 UI**
- 바코드 미검색 → **수동 입력 + 커뮤니티 기여 시스템 (향후)**

## 구현 가이드

### 파일 구조

```
app/api/nutrition/
├── foods/
│   ├── analyze/route.ts       # Gemini 음식 인식
│   ├── search/route.ts        # 음식 검색
│   └── barcode/route.ts       # 바코드 조회
├── meals/[id]/route.ts        # 식사 CRUD
├── summary/daily/route.ts     # 일일 집계
├── history/route.ts           # 기록 조회
├── favorites/route.ts         # 즐겨찾기
├── fasting/route.ts           # 단식 추적
├── settings/route.ts          # 설정
└── suggest/route.ts           # AI 추천

lib/nutrition/
├── calculateBMR.ts            # BMR/TDEE 계산
├── barcodeService.ts          # 바코드 통합 서비스
├── foodsafetykorea.ts         # 한국 식품 DB
├── openfoodfacts.ts           # 글로벌 식품 DB
├── bodyInsight.ts             # C-1 연동 인사이트
├── skinInsight.ts             # S-1 연동 인사이트
├── workoutInsight.ts          # W-1 연동 인사이트
├── supplementInsight.ts       # 보충제 추천
├── streak.ts                  # 연속 기록 추적
└── recipe-matcher.ts          # 레시피 매칭

components/nutrition/
├── dashboard/                 # 대시보드 컴포넌트
├── recording/                 # 기록 입력 컴포넌트
├── insight/                   # 인사이트 카드
└── common/                    # 공통 컴포넌트
```

### 매크로 비율 기본값

```typescript
const DEFAULT_MACRO_RATIOS = {
  protein: 0.30,    // 30%
  carbs: 0.40,      // 40%
  fat: 0.30,        // 30%
};

// 목표별 조정
const GOAL_ADJUSTMENTS = {
  weightLoss: { protein: 0.35, carbs: 0.30, fat: 0.35 },
  muscleGain: { protein: 0.35, carbs: 0.45, fat: 0.20 },
  maintenance: { protein: 0.30, carbs: 0.40, fat: 0.30 },
};
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 영양학](../principles/nutrition-science.md) - BMR, 매크로 균형, 영양 생화학

### 관련 ADR/스펙
- [ADR-011: Cross-Module Data Flow](./ADR-011-cross-module-data-flow.md) - 모듈 간 데이터 흐름
- [ADR-003: AI 모델 선택](./ADR-003-ai-model-selection.md) - Gemini 타임아웃/폴백
- [ADR-031: Workout 모듈](./ADR-031-workout-module.md) - N-1 ↔ W-1 통합

## 구현 스펙

이 ADR을 구현하는 스펙 문서:

| 스펙 | 상태 | 설명 |
|------|------|------|
| [SDD-N1-NUTRITION](../specs/SDD-N1-NUTRITION.md) | ✅ 구현됨 | 영양 추적, BMR/TDEE, 바코드, 크로스모듈 |

### 핵심 구현 파일

```
app/api/nutrition/
├── foods/analyze/route.ts    # AI 음식 인식
├── foods/barcode/route.ts    # 바코드 조회
├── meals/[id]/route.ts       # 식사 CRUD
└── summary/daily/route.ts    # 일일 집계

lib/nutrition/
├── calculateBMR.ts           # Harris-Benedict 공식
├── barcodeService.ts         # 바코드 통합
├── skinInsight.ts            # S-1 연동
└── workoutInsight.ts         # W-1 연동

components/nutrition/
├── dashboard/                # 대시보드
└── recording/                # 기록 입력
```

---

**Author**: Claude Code
**Reviewed by**: -
