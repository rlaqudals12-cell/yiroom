# SDD-SMART-MATCHING-v2: 스마트 사이즈 매칭 엔진

> **Status**: Active | **Version**: 2.0 | **Date**: 2026-03-12
> **ADR**: [ADR-032](../adr/ADR-032-smart-matching.md)
> **Phase**: K-2 (기본) + L-3-2 (강화)

---

## 1. 개요

사용자 체형 데이터 + 구매 이력 + 핏 피드백을 기반으로 최적 사이즈를 추천하는 3-Tier 엔진.

### 궁극의 형태 (P1)

- **100점**: 브랜드별 실측 데이터 + ML 랭킹 + 실시간 재고 연동 + 95%+ 적합률
- **현재 목표**: 80% (3-Tier 추천 + 11체형 조정 + 핏 학습)
- **의도적 제외**: ML 랭킹 (MAU 5K+ 후), 실시간 재고, 지역별 사이즈 보정

---

## 2. 3-Tier 추천 아키텍처

```
Tier 1: History-Based (신뢰도 70-100)
  └─ 동일 브랜드 구매 이력 + 핏 피드백 조정
      ↓ (이력 없으면)
Tier 2: Brand Chart + Measurements (신뢰도 40-80)
  └─ 브랜드 사이즈 차트 × 사용자 실측 × 핏 선호
      ↓ (차트 없으면)
Tier 3: General Inference (신뢰도 20-50)
  └─ 크로스 브랜드 이력 → BMI 추론 → 기본 XS~XL
```

### 신뢰도 라벨

| 범위   | 라벨        | UI 표시            |
| ------ | ----------- | ------------------ |
| 80-100 | `very-high` | "매우 높은 신뢰도" |
| 60-79  | `high`      | "높은 신뢰도"      |
| 40-59  | `medium`    | "보통 신뢰도"      |
| 20-39  | `low`       | "참고용"           |
| 0-19   | `very-low`  | "추가 정보 필요"   |

---

## 3. 11체형 사이즈 조정 규칙

### 3.1 체형 분류

| 코드 | 한국어     | 계열   | 특성                    |
| ---- | ---------- | ------ | ----------------------- |
| S    | 스트레이트 | 3-Type | 직선적 실루엣           |
| W    | 웨이브     | 3-Type | 하체 볼륨               |
| N    | 내추럴     | 3-Type | 넓은 어깨 프레임        |
| X    | 모래시계   | 8-Type | 상하체 균형 + 허리 좁음 |
| A    | 배         | 8-Type | 상체 < 하체             |
| V    | 역삼각형   | 8-Type | 상체 > 하체             |
| H    | 직사각형   | 8-Type | 상하체 동일             |
| O    | 사과       | 8-Type | 중심부 풀 사이즈        |
| I    | 직선       | 8-Type | 전체 얇음               |
| Y    | Y형        | 8-Type | 어깨 강조               |
| 8    | 8자        | 8-Type | X와 유사, 곡선 강조     |

### 3.2 카테고리별 조정값

```
체형 →  상의 조정  하의 조정  아우터 조정
S         0          0          0
W         0         +1          0
N        +1          0         +1
X         0          0          0
A        -1         +1         -1
V        +1         -1         +1
H         0          0          0
O        +1         +1         +1
I         0          0          0
Y        +1          0         +1
8         0          0          0
```

- `+1`: 한 사이즈 업 (예: M → L)
- `-1`: 한 사이즈 다운 (예: M → S)
- `0`: 조정 없음

---

## 4. 측정 데이터

### 4.1 사용자 신체 측정

```typescript
interface UserBodyMeasurements {
  // 기본 (필수)
  height: number; // cm
  weight: number; // kg
  bodyType: string; // 11체형 코드

  // 상세 (선택)
  chest?: number; // cm
  waist?: number; // cm
  hip?: number; // cm
  shoulder?: number; // cm
  armLength?: number; // cm
  inseam?: number; // cm
  footLength?: number; // cm (신발용)

  // 선호
  preferredFit: 'tight' | 'regular' | 'loose';
}
```

### 4.2 제품 실측 데이터

```typescript
interface ProductMeasurement {
  size: string;
  measurements: {
    totalLength?: number;
    shoulderWidth?: number;
    chestWidth?: number;
    sleeveLength?: number;
    waistWidth?: number;
    hipWidth?: number;
    thighWidth?: number;
    rise?: number;
    hemWidth?: number;
  };
  reliabilityScore: number; // 0-1
  source: 'official' | 'musinsa' | 'user_report' | 'ai_extracted';
}
```

---

## 5. 핏 선호 학습 시스템

### 5.1 알고리즘

```
입력: 최근 10건 핏 피드백 (SizeFit: 'small' | 'perfect' | 'large')

분석:
  small ≥ 60% → 선호 업그레이드 (tight→regular, regular→loose)
  large ≥ 60% → 선호 다운그레이드 (loose→regular, regular→tight)
  perfect ≥ 60% → 현재 유지
  혼합 → 현재 유지

조건:
  - 최소 3건 피드백 필요
  - 60% 일관성 임계값
  - 최근 10건만 사용 (최신 데이터 우선)
```

### 5.2 출력

```typescript
interface FitPreferenceSuggestion {
  currentFit: FitPreference;
  suggestedFit: FitPreference;
  confidence: number; // 0-1
  shouldUpdate: boolean;
  reasoning: string; // "최근 피드백의 70%가 '작다'고 응답"
}
```

---

## 6. API 엔드포인트

### 6.1 사이즈 추천

```
POST /api/fashion/size-recommend
Authorization: Bearer {clerk_token}

Request:
{
  brandId: string,
  category: 'top' | 'bottom' | 'outer' | 'shoes' | 'dress',
  productId?: string  // 제품 실측 데이터 활용
}

Response:
{
  recommendedSize: string,   // "M", "95" 등
  confidence: number,        // 0-100
  confidenceLabel: string,   // "높은 신뢰도"
  tier: 1 | 2 | 3,
  adjustments: {
    bodyType: string,        // "+1 (하체 볼륨 고려)"
    fitPreference: string,   // "루즈핏 선호 반영"
  },
  alternatives: [            // 인접 사이즈
    { size: "S", note: "핏이 좋으면 한 사이즈 다운" },
    { size: "L", note: "여유있게 입고 싶다면" }
  ]
}
```

---

## 7. 파일 구조

```
lib/smart-matching/
├── size-recommend.ts           # 3-Tier 추천 엔진 + 11체형 조정
├── size-charts.ts              # 브랜드 사이즈 차트 DB
├── size-history.ts             # 구매 이력 + 핏 피드백
├── fit-preference-learner.ts   # 핏 선호 자동 학습
└── index.ts                    # Barrel export

lib/fashion/
├── size-recommendation.ts      # K-2 기본 추천 (height/weight 기반)
├── wardrobe.ts                 # 아웃핏 조합
└── index.ts

types/smart-matching.ts         # 640+ lines 타입 정의
```

---

## 8. 테스트 전략

| 레벨 | 대상             | 파일                                                        |
| ---- | ---------------- | ----------------------------------------------------------- |
| 단위 | 11체형 조정 로직 | `tests/lib/fashion/size-recommendation.test.ts` (40+ cases) |
| 단위 | 핏 학습 알고리즘 | `tests/lib/smart-matching/fit-preference-learner.test.ts`   |
| 단위 | 브랜드 차트 조회 | `tests/lib/smart-matching/size-charts.test.ts`              |
| API  | 추천 엔드포인트  | `tests/api/fashion/size-recommend.test.ts`                  |

### 핵심 테스트 케이스

- 11체형 × 5카테고리 = 55 조합의 조정값 검증
- Tier 1→2→3 폴백 체인
- 핏 학습: 3건 미만 → 변경 없음
- 핏 학습: 60%+ 일관성 → 선호 변경
- 경계값: 극소/극대 신체 측정

---

## 9. 향후 확장 (의도적 제외)

| 기능               | 게이트      | 사유                      |
| ------------------ | ----------- | ------------------------- |
| ML 랭킹            | MAU ≥ 5,000 | 학습 데이터 부족          |
| 실시간 재고        | 파트너 API  | 비즈니스 계약 필요        |
| 지역별 사이즈 보정 | 글로벌 i18n | 한국 시장 우선            |
| 계절 레이어링      | 캡슐 V2     | 캡슐 에코시스템 안정화 후 |

---

**Version**: 2.0 | **Created**: 2026-03-12
