# SDD-OH-1: 구강건강 분석 (Oral Health Analysis)

> **Version**: 1.4 | **Created**: 2026-01-21 | **Updated**: 2026-01-24
> **Status**: Complete | **Priority**: Phase 3
> **P3 Score**: 100점 (Complete)
> **관련 ADR**: [ADR-046: OH-1 구강건강 분석 모듈](../adr/ADR-046-oh1-oral-health-analysis.md)
> **Depends On**: PC-1 (퍼스널컬러), CIE-1 (이미지 품질)
> **소스 원리**: [docs/principles/oral-health.md](../principles/oral-health.md)
> **소스 리서치**: OH-1-BUNDLE, OH-1-DAILY-CARE

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"치과의사 수준의 구강건강 종합 분석"

- **VITA 색상 분석**: 16색 셰이드 ΔE < 1.0 (측색계 수준 정밀도)
- **잇몸 염증 탐지**: AUC 95%+ (전문가 일치율)
- **충치/치석 감지**: 조기 발견 93%+ (ICDAS 기준)
- **퍼스널컬러 연계**: 시즌별 최적 미백 목표 자동 제안
- **제품 추천**: 개인화 ML 모델 기반 97%+ 적합도

### 물리적 한계

| 한계 | 설명 |
|------|------|
| 이미지 품질 | 스마트폰 카메라 한계, 구강 내부 조명 불균일 |
| 색상 왜곡 | 치아 표면 반사, 타액에 의한 광택 |
| 임상 진단 불가 | 의료기기 인증 필요 (정보 제공만 허용) |
| 3D 분석 한계 | 2D 이미지로는 치아 교합면 분석 불가 |

### 100점 기준

| 항목 | 100점 기준 | 현재 | 달성률 |
|------|-----------|------|--------|
| VITA 16색 ΔE | < 1.0 | ΔE < 2.7 | 63% |
| 잇몸 염증 AUC | 95% | 87% | 92% |
| 퍼스널컬러 연계 | 12톤 최적화 | 4시즌 기본 | 33% |
| 제품 추천 정확도 | ML 97% | 규칙 기반 75% | 77% |
| 처리 시간 | < 2초 | < 4초 | 50% |

### 현재 목표

**종합 달성률**: **70%** (MVP OH-1 구강건강 분석)

### 의도적 제외 (이번 버전)

- 3D 구강 스캔 기반 정밀 분석
- 실시간 충치 진행도 추적
- 치과 예약 연동
- 개인화 ML 추천 모델 (규칙 기반 사용)

#### 📊 구현 현황

| 기능 | 상태 | 위치 |
|------|------|------|
| 구강 이미지 품질 검증 | 📋 계획 | `lib/oral-health/image-validator.ts` |
| 치아 상태 분석 | 📋 계획 | `lib/oral-health/teeth-analyzer.ts` |
| 잇몸 건강 평가 | 📋 계획 | `lib/oral-health/gum-health.ts` |
| 착색/플라그 검출 | 📋 계획 | `lib/oral-health/stain-detector.ts` |
| 구강 위생 점수 산출 | 📋 계획 | `lib/oral-health/hygiene-score.ts` |
| 칫솔질 가이드 생성 | 📋 계획 | `lib/oral-health/brushing-guide.ts` |
| 치과 방문 권고 로직 | 📋 계획 | `lib/oral-health/dental-advice.ts` |
| 제품 추천 연동 | 📋 계획 | `lib/oral-health/product-recommend.ts` |

---

## 1. 개요

### 1.1 모듈 목적

사용자의 구강 이미지를 분석하여 **치아 상태**, **잇몸 건강**, **구강 위생**을 종합 평가하고 맞춤형 권장 사항을 제공하는 모듈.

| 분석 항목 | 설명 |
|----------|------|
| **치아 상태** | VITA 셰이드 기반 치아 색상 분석, 미백 필요도 평가 |
| **잇몸 건강** | a* 값 기반 염증 탐지, 잇몸 건강 상태 분류 |
| **구강 위생** | 치석/플라크 감지, 충치 위험도 시각적 분석 |

### 1.2 P3 점수: 100점 (Complete)

| 항목 | 배점 | 점수 | 근거 |
|------|------|------|------|
| ATOM ID 부여 | 20점 | 20점 | 모든 ATOM ID 부여 (OH-1.1 ~ OH-1.9) |
| 소요시간 명시 | 20점 | 20점 | 모든 ATOM 시간 명시 (9개, 총 16시간) |
| 입출력 스펙 | 20점 | 20점 | TypeScript 인터페이스 완비 |
| 성공 기준 | 20점 | 20점 | 체크리스트 + 알고리즘 상세 + 테스트 케이스 |
| 의존성 그래프 | 10점 | 10점 | 의존성 명시 및 병렬화 가능 여부 |
| 구현 순서 | 10점 | 10점 | Phase별 구현 순서 정의 |
| **총점** | **100점** | **100점** | - |

### 1.3 궁극의 형태 (P1)

| 항목 | 이상적 최종 상태 | 현재 목표 |
|------|-----------------|----------|
| 치아 색상 분석 | VITA 16색 ΔE<1.0 매칭 | ΔE<2.7 (임상 허용) |
| 잇몸 염증 탐지 | AUC 95%+ | AUC 87% (연구 기준) |
| 퍼스널컬러 연계 | 시즌별 최적 미백 목표 | 4시즌 기본 매핑 |
| 제품 추천 | 개인화 ML 모델 | 규칙 기반 매칭 |
| **현재 구현 목표** | - | **70%** |

### 1.4 P0 요구사항 검증

| 질문 | 답변 |
|------|------|
| 삭제 가능한가? | 불가 - 구강건강은 전신건강과 연결된 핵심 웰니스 영역 |
| 왜 필요한가? | 1) 치아 미백 목표 설정 2) 퍼스널컬러 연계 스마일 심미성 3) 맞춤 제품 추천 |
| 핵심 가치? | 과학적 색상 분석 + 개인화 추천으로 구강건강 개선 유도 |

---

## 2. 기능 요구사항

### 2.1 치아 색상 분석

#### 2.1.1 기능 설명

사용자 치아 이미지에서 Lab 색공간 값을 추출하고 VITA 16색 셰이드와 매칭.

#### 2.1.2 입력/출력

```typescript
// 입력
interface ToothColorInput {
  imageBase64: string;           // 치아 이미지 (RGB)
  referenceCard?: boolean;       // 그레이 카드 포함 여부
  toothRegion?: 'central' | 'lateral' | 'canine';  // 분석 치아 부위
}

// 출력
interface ToothColorResult {
  measuredLab: LabColor;         // 측정된 Lab 값
  matchedShade: VitaShade;       // 매칭된 VITA 셰이드
  deltaE: number;                // 색차 (CIEDE2000)
  confidence: number;            // 신뢰도 (0-100)
  brightnessRank: number;        // 명도 순위 (1-16)
}
```

#### 2.1.3 구현 위치

| 파일 | 역할 |
|------|------|
| `lib/oral-health/index.ts` | 공개 API (Barrel Export) |
| `lib/oral-health/tooth-color-analyzer.ts` | 치아 색상 분석 로직 |
| `lib/oral-health/internal/lab-converter.ts` | RGB→Lab 변환 |
| `lib/oral-health/internal/ciede2000.ts` | CIEDE2000 색차 계산 |
| `lib/oral-health/internal/vita-database.ts` | VITA 셰이드 참조값 DB |

### 2.2 잇몸 건강 평가

#### 2.2.1 기능 설명

잇몸 이미지에서 염증 지표(a* 값 기반 붉은기)를 분석하여 건강 상태 평가.

#### 2.2.2 입력/출력

```typescript
// 입력
interface GumHealthInput {
  imageBase64: string;
  includeTeeth: boolean;         // 치아 포함 이미지 여부
}

// 출력
interface GumHealthResult {
  healthStatus: GumHealthStatus;
  inflammationScore: number;     // 0-100 (높을수록 염증)
  aStarAverage: number;          // a* 평균값 (붉은기)
  recommendations: string[];     // 관리 권장사항
  needsDentalVisit: boolean;     // 치과 방문 필요 여부
}

type GumHealthStatus = 'healthy' | 'mild_gingivitis' | 'moderate_gingivitis' | 'severe_inflammation';
```

#### 2.2.3 구현 위치

| 파일 | 역할 |
|------|------|
| `lib/oral-health/gum-health-analyzer.ts` | 잇몸 건강 분석 |
| `lib/oral-health/internal/inflammation-detector.ts` | 염증 탐지 알고리즘 |
| `lib/oral-health/internal/gum-segmenter.ts` | 잇몸 영역 세그멘테이션 |

### 2.3 퍼스널컬러 연계 미백 목표

#### 2.3.1 기능 설명

PC-1 분석 결과를 기반으로 사용자 퍼스널컬러에 조화로운 미백 목표 셰이드 설정.

#### 2.3.2 입력/출력

```typescript
// 입력
interface WhiteningGoalInput {
  currentShade: VitaShade;
  personalColorSeason: PersonalColorSeason;
  desiredLevel: 'natural' | 'moderate' | 'bright';
}

// 출력
interface WhiteningGoalResult {
  targetShade: VitaShade;
  maxSafeShade: VitaShade;       // 과도한 미백 경고선
  preferredSeries: VitaSeries[]; // 권장 계열 (A, B, C, D)
  shadeStepsNeeded: number;      // 필요한 셰이드 단계
  estimatedMethod: WhiteningMethod[];
  isOverWhitening: boolean;      // 과도한 미백 경고
  seasonHarmony: string;         // 시즌 조화 설명
}

type WhiteningMethod = 'home_strips' | 'home_tray' | 'office_bleaching' | 'laser_whitening';
```

#### 2.3.3 구현 위치

| 파일 | 역할 |
|------|------|
| `lib/oral-health/whitening-goal-calculator.ts` | 미백 목표 계산 |
| `lib/oral-health/internal/season-shade-map.ts` | 시즌별 셰이드 매핑 |
| `lib/oral-health/internal/overwhitening-validator.ts` | 과도한 미백 검증 |

### 2.4 구강관리 제품 추천

#### 2.4.1 기능 설명

사용자의 구강 상태(민감도, 잇몸건강, 충치위험, 치석, 구취)를 기반으로 맞춤 제품 추천.

#### 2.4.2 입력/출력

```typescript
// 입력
interface OralProductInput {
  profile: UserOralProfile;
  currentProducts?: string[];    // 현재 사용 제품
  preferences: ProductPreferences;
}

interface UserOralProfile {
  sensitivity: 'none' | 'mild' | 'severe';
  gumHealth: 'healthy' | 'gingivitis' | 'periodontitis';
  cavityRisk: 'low' | 'medium' | 'high';
  calculus: 'none' | 'mild' | 'heavy';
  halitosis: boolean;
  dentalWork?: DentalWorkType[];
}

interface ProductPreferences {
  budgetLevel: 'budget' | 'mid' | 'premium';
  preferNatural: boolean;
  alcoholFree: boolean;
}

// 출력
interface OralProductRecommendation {
  toothpaste: ProductMatch[];
  mouthwash: ProductMatch[];
  interdental: InterddentalRecommendation;
  accessories: ProductMatch[];
  avoidIngredients: string[];
  keyIngredients: string[];
  careRoutine: CareRoutineStep[];
}

interface ProductMatch {
  productId: string;
  matchScore: number;
  matchReasons: string[];
  keyIngredients: string[];
}
```

#### 2.4.3 구현 위치

| 파일 | 역할 |
|------|------|
| `lib/oral-health/product-recommender.ts` | 제품 추천 엔진 |
| `lib/oral-health/internal/ingredient-matcher.ts` | 성분 매칭 |
| `lib/oral-health/internal/product-scorer.ts` | 제품 점수 계산 |
| `lib/oral-health/internal/care-routine-generator.ts` | 케어 루틴 생성 |

### 2.5 N-1 영양 모듈 연동

#### 2.5.1 기능 설명

OH-1 구강건강 분석 결과를 N-1 영양 모듈로 전달하여 구강건강 개선에 도움이 되는 영양 보충 권장사항 생성.

#### 2.5.2 연동 인터페이스

**참조**: `apps/web/lib/shared/integration-types.ts`

```typescript
// OH-1 → N-1 전달 데이터
import { OH1ToN1IntegrationData, N1OralNutritionRecommendation } from '@/lib/shared/integration-types';

// 예시 사용
const integrationData: OH1ToN1IntegrationData = {
  gumHealth: {
    status: 'mild_gingivitis',
    inflammationScore: 45,
    aStarAverage: 12.5,
  },
  inflammationScore: 45,
  toothStaining: 'mild',
  cavityRisk: 'medium',
  periodontalStatus: 'gingivitis',
  confidence: 85,
};
```

#### 2.5.3 연동 매핑 규칙

| OH-1 상태 | N-1 권장 영양소 | 근거 |
|----------|---------------|------|
| `gumHealth.status = 'mild_gingivitis'` | 비타민 C 500mg/일 | 콜라겐 합성, 잇몸 치유 |
| `gumHealth.status = 'moderate_gingivitis'` | 비타민 C 1000mg/일 + CoQ10 | 항산화, 조직 재생 |
| `inflammationScore > 50` | 오메가-3 1g/일 | 항염증 작용 |
| `cavityRisk = 'high'` | 칼슘 + 비타민 D | 치아 재광화 |
| `toothStaining = 'severe'` | 비타민 K2 | 칼슘 분배 최적화 |

#### 2.5.4 구현 위치

| 파일 | 역할 |
|------|------|
| `lib/oral-health/nutrition-integrator.ts` | N-1 연동 로직 |
| `lib/oral-health/internal/nutrition-mapper.ts` | 상태→영양소 매핑 |

#### 2.5.5 API 엔드포인트

```
POST /api/oral-health/nutrition
```

```typescript
// 요청
interface OralNutritionRequest {
  assessmentId: string;  // OH-1 분석 ID
}

// 응답
interface OralNutritionResponse {
  success: boolean;
  recommendations: N1OralNutritionRecommendation[];
  integrationData: OH1ToN1IntegrationData;
}
```

---

## 3. 타입 정의

### 3.1 위치

`apps/web/types/oral-health.ts`

### 3.2 핵심 타입

```typescript
// =============================================================================
// 색공간 타입
// =============================================================================

export interface LabColor {
  L: number;  // 0-100 (명도)
  a: number;  // -128 to +127 (적-녹)
  b: number;  // -128 to +127 (황-청)
}

export interface RgbColor {
  r: number;  // 0-255
  g: number;  // 0-255
  b: number;  // 0-255
}

// =============================================================================
// VITA 셰이드 시스템
// =============================================================================

export type VitaSeries = 'A' | 'B' | 'C' | 'D';

export type VitaShade =
  | 'A1' | 'A2' | 'A3' | 'A3.5' | 'A4'
  | 'B1' | 'B2' | 'B3' | 'B4'
  | 'C1' | 'C2' | 'C3' | 'C4'
  | 'D2' | 'D3' | 'D4'
  | '0M1' | '0M2' | '0M3';  // Bleached shades

export interface VitaShadeReference {
  shade: VitaShade;
  lab: LabColor;
  series: VitaSeries;
  brightnessRank: number;  // 1 = brightest (B1), 16 = darkest (C4)
}

// VITA Classical 16색 명도순
export const VITA_BRIGHTNESS_ORDER: VitaShade[] = [
  'B1', 'A1', 'B2', 'D2', 'A2', 'C1', 'C2', 'D4',
  'A3', 'D3', 'B3', 'A3.5', 'B4', 'C3', 'A4', 'C4'
];

// =============================================================================
// 잇몸 건강
// =============================================================================

export type GumHealthStatus =
  | 'healthy'           // a* < 10, 정상
  | 'mild_gingivitis'   // a* 10-15, 경미한 염증
  | 'moderate_gingivitis' // a* 15-20, 중등도 염증
  | 'severe_inflammation'; // a* > 20, 심한 염증

export interface GumHealthMetrics {
  aStarMean: number;
  aStarStd: number;
  rednessPercentage: number;  // 붉은 영역 비율
  swellingIndicator: number;  // 부종 지표
}

// =============================================================================
// 구강 프로필
// =============================================================================

export type SensitivityLevel = 'none' | 'mild' | 'severe';
export type GumCondition = 'healthy' | 'gingivitis' | 'periodontitis';
export type CavityRisk = 'low' | 'medium' | 'high';
export type CalculusLevel = 'none' | 'mild' | 'heavy';

export type DentalWorkType =
  | 'braces'       // 교정
  | 'implant'      // 임플란트
  | 'bridge'       // 브릿지
  | 'crown'        // 크라운
  | 'veneer';      // 라미네이트

export interface UserOralProfile {
  sensitivity: SensitivityLevel;
  gumHealth: GumCondition;
  cavityRisk: CavityRisk;
  calculus: CalculusLevel;
  halitosis: boolean;
  dentalWork: DentalWorkType[];
  lastScalingDate?: string;    // ISO date
  dailyBrushingCount: number;
  usesFloss: boolean;
  usesInterdental: boolean;
  usesWaterFlosser: boolean;
}

// =============================================================================
// 제품 추천
// =============================================================================

export type ToothpasteType =
  | 'fluoride'           // 불소 치약
  | 'sensitivity'        // 시린이 치약
  | 'whitening'          // 미백 치약
  | 'gum_care'           // 잇몸 케어
  | 'tartar_control'     // 치석 방지
  | 'natural';           // 천연 치약

export type MouthwashType =
  | 'chx'                // 클로르헥시딘
  | 'cpc'                // 세틸피리디늄
  | 'essential_oil'      // 에센셜 오일 (리스테린)
  | 'fluoride'           // 불소 구강청결제
  | 'alcohol_free';      // 무알코올

export type InterdentalType =
  | 'floss_waxed'        // 왁스 치실
  | 'floss_unwaxed'      // 무왁스 치실
  | 'floss_tape'         // 테이프형
  | 'floss_ptfe'         // PTFE 치실
  | 'superfloss'         // 슈퍼플로스
  | 'interdental_brush'  // 치간칫솔
  | 'water_flosser';     // 워터픽

export interface OralIngredient {
  id: string;
  nameKo: string;
  nameEn: string;
  category: 'remineralization' | 'antibacterial' | 'tartar_control' | 'sensitivity' | 'whitening';
  benefits: string[];
  contraindications: string[];  // 금기 상태
  maxUsagePeriod?: string;      // 최대 사용 기간 (예: "2-4주")
}

// =============================================================================
// 분석 결과 (DB 저장용)
// =============================================================================

export interface OralHealthAssessment {
  id: string;
  clerk_user_id: string;
  createdAt: string;

  // 치아 색상
  toothColor: {
    measuredLab: LabColor;
    matchedShade: VitaShade;
    deltaE: number;
    confidence: number;
  };

  // 잇몸 건강
  gumHealth: {
    status: GumHealthStatus;
    inflammationScore: number;
    needsDentalVisit: boolean;
  };

  // 미백 목표 (퍼스널컬러 연계)
  whiteningGoal?: {
    targetShade: VitaShade;
    personalColorSeason: string;
    shadeStepsNeeded: number;
  };

  // 메타데이터
  usedFallback: boolean;
  imageQualityScore: number;
}
```

---

## 4. 알고리즘 명세

### 4.1 RGB → Lab 변환

**원리 문서**: [docs/principles/oral-health.md#2.3](../principles/oral-health.md)

```typescript
// lib/oral-health/internal/lab-converter.ts

/**
 * sRGB를 CIE Lab으로 변환
 *
 * 변환 과정:
 * 1. sRGB → Linear RGB (감마 보정 제거)
 * 2. Linear RGB → XYZ (D65 기준)
 * 3. XYZ → Lab
 */
export function rgbToLab(rgb: RgbColor): LabColor {
  // Step 1: sRGB → Linear RGB
  const linearR = srgbToLinear(rgb.r / 255);
  const linearG = srgbToLinear(rgb.g / 255);
  const linearB = srgbToLinear(rgb.b / 255);

  // Step 2: Linear RGB → XYZ (D65 illuminant)
  // 행렬 곱셈
  const x = linearR * 0.4124564 + linearG * 0.3575761 + linearB * 0.1804375;
  const y = linearR * 0.2126729 + linearG * 0.7151522 + linearB * 0.0721750;
  const z = linearR * 0.0193339 + linearG * 0.1191920 + linearB * 0.9503041;

  // D65 White point
  const xn = 0.95047;
  const yn = 1.00000;
  const zn = 1.08883;

  // Step 3: XYZ → Lab
  const fx = labF(x / xn);
  const fy = labF(y / yn);
  const fz = labF(z / zn);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { L, a, b };
}

function srgbToLinear(c: number): number {
  return c <= 0.04045
    ? c / 12.92
    : Math.pow((c + 0.055) / 1.055, 2.4);
}

function labF(t: number): number {
  const delta = 6 / 29;
  return t > Math.pow(delta, 3)
    ? Math.pow(t, 1 / 3)
    : t / (3 * delta * delta) + 4 / 29;
}
```

### 4.2 CIEDE2000 색차 계산

**원리 문서**: [docs/principles/oral-health.md#2.3](../principles/oral-health.md)

```typescript
// lib/oral-health/internal/ciede2000.ts

/**
 * CIEDE2000 색차 공식 (ISO/CIE 11664-6:2014)
 *
 * 임상적 의미:
 * - ΔE < 1.0: 인지 불가
 * - ΔE 1.0-2.7: 인지 가능, 허용 범위
 * - ΔE 2.7-3.3: 허용 경계
 * - ΔE > 3.3: 임상적으로 허용 불가
 */
export function calculateCIEDE2000(lab1: LabColor, lab2: LabColor): number {
  const kL = 1, kC = 1, kH = 1;  // 가중치 (치아 색상용 기본값)

  // Step 1: Calculate C' and h'
  const C1 = Math.sqrt(lab1.a ** 2 + lab1.b ** 2);
  const C2 = Math.sqrt(lab2.a ** 2 + lab2.b ** 2);
  const Cavg = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Cavg ** 7 / (Cavg ** 7 + 25 ** 7)));

  const a1p = lab1.a * (1 + G);
  const a2p = lab2.a * (1 + G);

  const C1p = Math.sqrt(a1p ** 2 + lab1.b ** 2);
  const C2p = Math.sqrt(a2p ** 2 + lab2.b ** 2);

  const h1p = hueAngle(a1p, lab1.b);
  const h2p = hueAngle(a2p, lab2.b);

  // Step 2: Calculate differences
  const dLp = lab2.L - lab1.L;
  const dCp = C2p - C1p;
  const dhp = hueDifference(h1p, h2p, C1p, C2p);
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(degToRad(dhp / 2));

  // Step 3: Calculate weighting functions
  const Lbarp = (lab1.L + lab2.L) / 2;
  const Cbarp = (C1p + C2p) / 2;
  const hbarp = hueAverage(h1p, h2p, C1p, C2p);

  const T = 1
    - 0.17 * Math.cos(degToRad(hbarp - 30))
    + 0.24 * Math.cos(degToRad(2 * hbarp))
    + 0.32 * Math.cos(degToRad(3 * hbarp + 6))
    - 0.20 * Math.cos(degToRad(4 * hbarp - 63));

  const SL = 1 + (0.015 * (Lbarp - 50) ** 2) / Math.sqrt(20 + (Lbarp - 50) ** 2);
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;

  const RC = 2 * Math.sqrt(Cbarp ** 7 / (Cbarp ** 7 + 25 ** 7));
  const dTheta = 30 * Math.exp(-((hbarp - 275) / 25) ** 2);
  const RT = -RC * Math.sin(degToRad(2 * dTheta));

  // Step 4: Calculate total color difference
  const deltaE = Math.sqrt(
    (dLp / (kL * SL)) ** 2 +
    (dCp / (kC * SC)) ** 2 +
    (dHp / (kH * SH)) ** 2 +
    RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
  );

  return deltaE;
}

// 헬퍼 함수들 (internal)
function hueAngle(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  let h = radToDeg(Math.atan2(b, a));
  return h >= 0 ? h : h + 360;
}

function degToRad(deg: number): number {
  return deg * Math.PI / 180;
}

function radToDeg(rad: number): number {
  return rad * 180 / Math.PI;
}
```

### 4.3 VITA 셰이드 매칭

```typescript
// lib/oral-health/internal/vita-database.ts

/**
 * VITA Classical 16색 참조값 데이터베이스
 * 출처: VITA Easyshade 측정 데이터
 */
export const VITA_SHADE_DATABASE: VitaShadeReference[] = [
  { shade: 'B1', lab: { L: 71, a: 1.5, b: 15 }, series: 'B', brightnessRank: 1 },
  { shade: 'A1', lab: { L: 70, a: 2, b: 16 }, series: 'A', brightnessRank: 2 },
  { shade: 'B2', lab: { L: 68.5, a: 2, b: 17 }, series: 'B', brightnessRank: 3 },
  { shade: 'D2', lab: { L: 68, a: 1.5, b: 14 }, series: 'D', brightnessRank: 4 },
  { shade: 'A2', lab: { L: 67, a: 2.5, b: 19 }, series: 'A', brightnessRank: 5 },
  { shade: 'C1', lab: { L: 66, a: 0.5, b: 12 }, series: 'C', brightnessRank: 6 },
  { shade: 'C2', lab: { L: 64.5, a: 1, b: 13 }, series: 'C', brightnessRank: 7 },
  { shade: 'D4', lab: { L: 64, a: 2, b: 15 }, series: 'D', brightnessRank: 8 },
  { shade: 'A3', lab: { L: 63.5, a: 3.5, b: 21.5 }, series: 'A', brightnessRank: 9 },
  { shade: 'D3', lab: { L: 62, a: 2.5, b: 16 }, series: 'D', brightnessRank: 10 },
  { shade: 'B3', lab: { L: 61, a: 3, b: 20 }, series: 'B', brightnessRank: 11 },
  { shade: 'A3.5', lab: { L: 59, a: 4, b: 22 }, series: 'A', brightnessRank: 12 },
  { shade: 'B4', lab: { L: 58, a: 4, b: 23 }, series: 'B', brightnessRank: 13 },
  { shade: 'C3', lab: { L: 56, a: 1.5, b: 14 }, series: 'C', brightnessRank: 14 },
  { shade: 'A4', lab: { L: 56.5, a: 5.5, b: 25.5 }, series: 'A', brightnessRank: 15 },
  { shade: 'C4', lab: { L: 48.5, a: 0.5, b: 11 }, series: 'C', brightnessRank: 16 },
  // Bleached shades
  { shade: '0M1', lab: { L: 74, a: 0, b: 10 }, series: 'B', brightnessRank: 0 },
  { shade: '0M2', lab: { L: 72.5, a: 0.5, b: 12 }, series: 'B', brightnessRank: 0 },
  { shade: '0M3', lab: { L: 71.5, a: 1, b: 13 }, series: 'B', brightnessRank: 0 },
];

/**
 * 최근접 VITA 셰이드 매칭
 */
export function findBestShadeMatch(measuredLab: LabColor): {
  shade: VitaShade;
  deltaE: number;
  reference: VitaShadeReference;
} {
  let minDeltaE = Infinity;
  let bestMatch: VitaShadeReference | null = null;

  for (const ref of VITA_SHADE_DATABASE) {
    const deltaE = calculateCIEDE2000(measuredLab, ref.lab);
    if (deltaE < minDeltaE) {
      minDeltaE = deltaE;
      bestMatch = ref;
    }
  }

  if (!bestMatch) {
    throw new Error('VITA shade matching failed');
  }

  return {
    shade: bestMatch.shade,
    deltaE: minDeltaE,
    reference: bestMatch,
  };
}
```

### 4.4 퍼스널컬러 연계 미백 목표

```typescript
// lib/oral-health/internal/season-shade-map.ts

/**
 * 퍼스널컬러 시즌별 추천 셰이드 매핑
 * 원리: 피부 언더톤과 치아 톤의 조화
 */
export const SEASON_SHADE_RECOMMENDATIONS: Record<PersonalColorSeason, {
  recommendedShades: VitaShade[];
  maxBrightShade: VitaShade;    // 과도한 미백 경고선
  preferredSeries: VitaSeries[];
  avoidShades: VitaShade[];
  harmony: string;
}> = {
  spring: {
    recommendedShades: ['A1', 'B1', 'B2'],
    maxBrightShade: '0M2',      // 웜톤은 0M1 피해야
    preferredSeries: ['A', 'B'],
    avoidShades: ['C1', 'C2', 'C3', 'C4'],
    harmony: '밝고 투명한 노란 피부에 따뜻한 아이보리 톤이 조화롭습니다.',
  },
  summer: {
    recommendedShades: ['B1', 'C1', 'A1'],
    maxBrightShade: '0M1',
    preferredSeries: ['B', 'C'],
    avoidShades: ['A3', 'A3.5', 'A4'],
    harmony: '핑크빛 밝은 피부에 블루 언더톤의 쿨 화이트가 어울립니다.',
  },
  autumn: {
    recommendedShades: ['A2', 'B2', 'A3'],
    maxBrightShade: 'A1',       // 가을은 B1까지만
    preferredSeries: ['A', 'B'],
    avoidShades: ['0M1', '0M2', 'C1'],
    harmony: '구릿빛 건강한 피부에 자연스러운 아이보리~옐로 톤이 조화롭습니다.',
  },
  winter: {
    recommendedShades: ['B1', '0M1', 'C1'],
    maxBrightShade: '0M1',
    preferredSeries: ['B', 'C'],
    avoidShades: ['A3', 'A3.5', 'A4', 'B4'],
    harmony: '선명한 핑크 베이스에 순백에 가까운 밝은 화이트가 어울립니다.',
  },
};

/**
 * 과도한 미백 여부 검증
 */
export function isOverWhitening(
  targetShade: VitaShade,
  season: PersonalColorSeason
): { isOver: boolean; reason?: string } {
  const config = SEASON_SHADE_RECOMMENDATIONS[season];

  // Bleached 셰이드 체크
  const bleachedShades: VitaShade[] = ['0M1', '0M2', '0M3'];

  // 웜톤에 0M1 목표
  const warmSeasons: PersonalColorSeason[] = ['spring', 'autumn'];
  if (warmSeasons.includes(season) && targetShade === '0M1') {
    return {
      isOver: true,
      reason: '웜톤 피부에 차가운 블루 화이트는 부자연스러울 수 있습니다.',
    };
  }

  // 가을에 너무 밝은 목표
  if (season === 'autumn' && bleachedShades.includes(targetShade)) {
    return {
      isOver: true,
      reason: '따뜻한 피부톤에 과도한 미백은 부자연스러울 수 있습니다.',
    };
  }

  return { isOver: false };
}
```

### 4.5 제품 추천 알고리즘

```typescript
// lib/oral-health/product-recommender.ts

/**
 * 구강 상태별 제품 추천 엔진
 * 규칙 기반 + 성분 매칭
 */
export function recommendOralProducts(
  profile: UserOralProfile,
  preferences: ProductPreferences
): OralProductRecommendation {
  const result: OralProductRecommendation = {
    toothpaste: [],
    mouthwash: [],
    interdental: { primary: [], alternative: [] },
    accessories: [],
    avoidIngredients: [],
    keyIngredients: [],
    careRoutine: [],
  };

  // 1. 핵심 성분 결정
  const { required, avoid } = determineIngredients(profile);
  result.keyIngredients = required;
  result.avoidIngredients = avoid;

  // 2. 치약 추천
  result.toothpaste = recommendToothpaste(profile, required, avoid, preferences);

  // 3. 구강청결제 추천
  result.mouthwash = recommendMouthwash(profile, required, avoid, preferences);

  // 4. 치간 청소 도구 추천
  result.interdental = recommendInterdental(profile);

  // 5. 케어 루틴 생성
  result.careRoutine = generateCareRoutine(profile, result);

  return result;
}

/**
 * 상태별 필수/금지 성분 결정
 */
function determineIngredients(profile: UserOralProfile): {
  required: string[];
  avoid: string[];
} {
  const required: string[] = [];
  const avoid: string[] = [];

  // 민감도 기반
  if (profile.sensitivity !== 'none') {
    required.push('n-HAp', 'CPP-ACP', 'Potassium Nitrate');
    avoid.push('High H2O2', 'High RDA toothpaste');
  }

  // 잇몸 건강 기반
  if (profile.gumHealth === 'gingivitis') {
    required.push('CPC 0.05%', 'CoQ10', 'Aloe');
  } else if (profile.gumHealth === 'periodontitis') {
    required.push('CHX 0.12% (short-term)', 'CPC');
  }

  // 충치 위험 기반
  if (profile.cavityRisk === 'high') {
    required.push('Fluoride 1450ppm', 'CPP-ACPF', 'Xylitol');
  }

  // 치석 기반
  if (profile.calculus !== 'none') {
    required.push('Sodium Hexametaphosphate', 'Pyrophosphate');
  }

  // 구취 기반
  if (profile.halitosis) {
    required.push('Zinc', 'CPC', 'Tongue cleaner');
  }

  return { required, avoid };
}

/**
 * 치간 청소 도구 추천
 */
function recommendInterdental(profile: UserOralProfile): InterdentalRecommendation {
  const recommendation: InterdentalRecommendation = {
    primary: [],
    alternative: [],
  };

  // 보철물 있는 경우
  if (profile.dentalWork.includes('braces')) {
    recommendation.primary.push({
      type: 'superfloss',
      reason: '교정 장치 주변 청소에 필수',
    });
    recommendation.primary.push({
      type: 'water_flosser',
      reason: '교정 환자 플라크 제거 3배 효과',
    });
  } else if (profile.dentalWork.includes('implant') || profile.dentalWork.includes('bridge')) {
    recommendation.primary.push({
      type: 'water_flosser',
      reason: '임플란트 BOP 감소 81.8%',
    });
    recommendation.primary.push({
      type: 'interdental_brush',
      reason: '보철물 주변 청소 효과적',
    });
  }

  // 일반 사용자
  if (recommendation.primary.length === 0) {
    if (profile.gumHealth === 'periodontitis') {
      // 넓어진 치간 공간
      recommendation.primary.push({
        type: 'interdental_brush',
        reason: '치주질환으로 넓어진 치간 공간에 적합',
      });
    } else {
      recommendation.primary.push({
        type: 'floss_ptfe',
        reason: '좁은 치간 공간 청소에 효과적',
      });
    }
  }

  // 대안
  if (!recommendation.primary.find(p => p.type === 'water_flosser')) {
    recommendation.alternative.push({
      type: 'water_flosser',
      reason: '손 기능 제한 시 또는 추가 청소력 원할 때',
    });
  }

  return recommendation;
}
```

### 4.6 잇몸 염증 탐지

```typescript
// lib/oral-health/internal/inflammation-detector.ts

/**
 * 잇몸 염증 탐지 알고리즘
 * a* 값 기반 붉은기 분석
 *
 * 연구 근거: 치은염 탐지 AUC 87.11%, 민감도 0.92, 특이도 0.94
 */
export function detectGumInflammation(gumPixels: LabColor[]): GumHealthMetrics {
  // a* 값 통계 계산
  const aStarValues = gumPixels.map(p => p.a);
  const aStarMean = mean(aStarValues);
  const aStarStd = standardDeviation(aStarValues);

  // 붉은 영역 비율 (a* > 15)
  const redPixels = aStarValues.filter(a => a > 15);
  const rednessPercentage = (redPixels.length / aStarValues.length) * 100;

  // 부종 지표 (L* 감소 + a* 증가 조합)
  const lStarValues = gumPixels.map(p => p.L);
  const lStarMean = mean(lStarValues);
  const swellingIndicator = (aStarMean - 10) * (70 - lStarMean) / 100;

  return {
    aStarMean,
    aStarStd,
    rednessPercentage,
    swellingIndicator: Math.max(0, swellingIndicator),
  };
}

/**
 * 잇몸 건강 상태 분류
 */
export function classifyGumHealth(metrics: GumHealthMetrics): {
  status: GumHealthStatus;
  inflammationScore: number;
  needsDentalVisit: boolean;
} {
  const { aStarMean, rednessPercentage, swellingIndicator } = metrics;

  // 염증 점수 계산 (0-100)
  let inflammationScore = 0;
  inflammationScore += Math.min(40, aStarMean * 2);           // a* 기여 (최대 40)
  inflammationScore += Math.min(30, rednessPercentage * 0.5); // 붉은 영역 기여 (최대 30)
  inflammationScore += Math.min(30, swellingIndicator * 3);   // 부종 기여 (최대 30)
  inflammationScore = Math.min(100, inflammationScore);

  // 상태 분류
  let status: GumHealthStatus;
  let needsDentalVisit = false;

  if (aStarMean < 10 && inflammationScore < 25) {
    status = 'healthy';
  } else if (aStarMean < 15 && inflammationScore < 50) {
    status = 'mild_gingivitis';
    // 경미한 경우 홈케어로 개선 가능
  } else if (aStarMean < 20 && inflammationScore < 75) {
    status = 'moderate_gingivitis';
    needsDentalVisit = true;
  } else {
    status = 'severe_inflammation';
    needsDentalVisit = true;
  }

  return {
    status,
    inflammationScore,
    needsDentalVisit,
  };
}

// 유틸리티 함수
function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  const avg = mean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}
```

---

## 5. 파일 구조

### 5.1 전체 구조

```
apps/web/
├── lib/
│   └── oral-health/
│       ├── index.ts                      # 공개 API (Barrel Export)
│       ├── types.ts                      # 재export (types/oral-health.ts)
│       ├── tooth-color-analyzer.ts       # 치아 색상 분석
│       ├── gum-health-analyzer.ts        # 잇몸 건강 분석
│       ├── whitening-goal-calculator.ts  # 미백 목표 계산
│       ├── product-recommender.ts        # 제품 추천 엔진
│       └── internal/
│           ├── lab-converter.ts          # RGB→Lab 변환
│           ├── ciede2000.ts              # CIEDE2000 색차
│           ├── vita-database.ts          # VITA 셰이드 DB
│           ├── season-shade-map.ts       # 시즌-셰이드 매핑
│           ├── inflammation-detector.ts  # 염증 탐지
│           ├── gum-segmenter.ts          # 잇몸 세그멘테이션
│           ├── ingredient-matcher.ts     # 성분 매칭
│           ├── product-scorer.ts         # 제품 점수
│           └── care-routine-generator.ts # 케어 루틴
├── types/
│   └── oral-health.ts                    # 타입 정의
├── lib/mock/
│   └── oral-health.ts                    # Mock 데이터
├── app/
│   ├── (main)/
│   │   └── analysis/
│   │       └── oral-health/
│   │           ├── page.tsx              # 분석 메인 페이지
│   │           ├── _components/
│   │           │   ├── ToothColorCard.tsx
│   │           │   ├── GumHealthCard.tsx
│   │           │   ├── WhiteningGoalCard.tsx
│   │           │   └── ProductRecommendationCard.tsx
│   │           └── result/
│   │               └── [id]/
│   │                   └── page.tsx      # 결과 페이지
│   └── api/
│       └── analyze/
│           └── oral-health/
│               └── route.ts              # API 엔드포인트
├── components/
│   └── oral-health/
│       ├── VitaShadeDisplay.tsx          # VITA 셰이드 표시
│       ├── GumHealthIndicator.tsx        # 잇몸 건강 지표
│       ├── WhiteningSimulator.tsx        # 미백 시뮬레이터
│       └── OralCareRoutine.tsx           # 케어 루틴 표시
└── tests/
    └── lib/
        └── oral-health/
            ├── tooth-color-analyzer.test.ts
            ├── ciede2000.test.ts
            ├── gum-health-analyzer.test.ts
            └── product-recommender.test.ts
```

### 5.2 공개 API (index.ts)

```typescript
// lib/oral-health/index.ts

// 주요 분석 함수
export { analyzeToothColor } from './tooth-color-analyzer';
export { analyzeGumHealth } from './gum-health-analyzer';
export { calculateWhiteningGoal } from './whitening-goal-calculator';
export { recommendOralProducts } from './product-recommender';

// 타입 재export
export type {
  LabColor,
  VitaShade,
  VitaSeries,
  GumHealthStatus,
  UserOralProfile,
  OralProductRecommendation,
  OralHealthAssessment,
} from './types';

// 상수
export { VITA_SHADE_DATABASE, VITA_BRIGHTNESS_ORDER } from './internal/vita-database';
export { SEASON_SHADE_RECOMMENDATIONS } from './internal/season-shade-map';
```

---

## 6. API 엔드포인트

### 6.1 구강건강 분석

**경로**: `POST /api/analyze/oral-health`

```typescript
// app/api/analyze/oral-health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  analyzeToothColor,
  analyzeGumHealth,
  calculateWhiteningGoal,
  recommendOralProducts,
} from '@/lib/oral-health';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logAudit } from '@/lib/audit/logger';

const requestSchema = z.object({
  imageBase64: z.string().min(1),
  analysisType: z.enum(['tooth_color', 'gum_health', 'full']),
  personalColorSeason: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
  oralProfile: z.object({
    sensitivity: z.enum(['none', 'mild', 'severe']),
    gumHealth: z.enum(['healthy', 'gingivitis', 'periodontitis']),
    cavityRisk: z.enum(['low', 'medium', 'high']),
    calculus: z.enum(['none', 'mild', 'heavy']),
    halitosis: z.boolean(),
    dentalWork: z.array(z.enum(['braces', 'implant', 'bridge', 'crown', 'veneer'])),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 인증
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    // 2. Rate Limit
    const { success: rateLimitOk } = await checkRateLimit(userId);
    if (!rateLimitOk) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMIT_ERROR', message: '요청 한도를 초과했습니다.' } },
        { status: 429 }
      );
    }

    // 3. 입력 검증
    const body = await request.json();
    const validated = requestSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '입력 정보를 확인해주세요.' } },
        { status: 400 }
      );
    }

    const { imageBase64, analysisType, personalColorSeason, oralProfile } = validated.data;

    // 4. 분석 실행
    const result: Partial<OralHealthAssessment> = {
      clerk_user_id: userId,
      createdAt: new Date().toISOString(),
      usedFallback: false,
    };

    if (analysisType === 'tooth_color' || analysisType === 'full') {
      const toothColorResult = await analyzeToothColor({ imageBase64 });
      result.toothColor = toothColorResult;

      // 퍼스널컬러 연계 미백 목표
      if (personalColorSeason) {
        const whiteningGoal = calculateWhiteningGoal({
          currentShade: toothColorResult.matchedShade,
          personalColorSeason,
          desiredLevel: 'moderate',
        });
        result.whiteningGoal = {
          targetShade: whiteningGoal.targetShade,
          personalColorSeason,
          shadeStepsNeeded: whiteningGoal.shadeStepsNeeded,
        };
      }
    }

    if (analysisType === 'gum_health' || analysisType === 'full') {
      const gumHealthResult = await analyzeGumHealth({ imageBase64, includeTeeth: true });
      result.gumHealth = {
        status: gumHealthResult.healthStatus,
        inflammationScore: gumHealthResult.inflammationScore,
        needsDentalVisit: gumHealthResult.needsDentalVisit,
      };
    }

    // 5. 제품 추천 (프로필 있는 경우)
    let productRecommendations;
    if (oralProfile) {
      productRecommendations = recommendOralProducts(oralProfile, {
        budgetLevel: 'mid',
        preferNatural: false,
        alcoholFree: false,
      });
    }

    // 6. 감사 로그
    await logAudit(userId, 'oral_health_analysis', {
      analysisType,
      hasPersonalColor: !!personalColorSeason,
    });

    // 7. 응답
    return NextResponse.json({
      success: true,
      data: {
        assessment: result,
        productRecommendations,
      },
    });

  } catch (error) {
    console.error('[API] /analyze/oral-health error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'UNKNOWN_ERROR', message: '분석 중 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
```

### 6.2 API 응답 형식

표준 응답 유틸리티 사용: `lib/api/error-response.ts`

#### 성공 응답

```typescript
import { createSuccessResponse } from '@/lib/api/error-response';

return createSuccessResponse({
  assessment: { ... },
  productRecommendations: [...],
  usedFallback: false,
});
```

#### 에러 응답

```typescript
import {
  validationError,
  analysisFailedError,
  rateLimitError,
  dailyLimitError
} from '@/lib/api/error-response';

// 입력 검증 실패
return validationError('이미지 형식이 올바르지 않습니다.');

// 분석 실패
return analysisFailedError('구강건강 분석에 실패했습니다.');

// Rate Limit
return rateLimitError(60);  // 60초 후 재시도

// 일일 한도 초과
return dailyLimitError(86400);  // 24시간 후 재시도
```

#### 응답 타입

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { error: string; code: ApiErrorCode; retryAfter?: number };
```

---

## 7. UI 컴포넌트

### 7.1 VITA 셰이드 표시

```tsx
// components/oral-health/VitaShadeDisplay.tsx
'use client';

import { VitaShade, VITA_SHADE_DATABASE } from '@/lib/oral-health';

interface VitaShadeDisplayProps {
  currentShade: VitaShade;
  targetShade?: VitaShade;
  showComparison?: boolean;
}

export function VitaShadeDisplay({
  currentShade,
  targetShade,
  showComparison = false,
}: VitaShadeDisplayProps) {
  const currentRef = VITA_SHADE_DATABASE.find(s => s.shade === currentShade);
  const targetRef = targetShade
    ? VITA_SHADE_DATABASE.find(s => s.shade === targetShade)
    : null;

  // Lab to CSS color approximation
  const labToHex = (lab: LabColor): string => {
    // 간단한 근사값 (정확한 변환은 별도 라이브러리)
    const l = lab.L;
    const lightness = Math.round((l / 100) * 255);
    const warmth = Math.round(lab.b * 2);
    return `rgb(${lightness + warmth}, ${lightness}, ${lightness - warmth / 2})`;
  };

  return (
    <div className="flex flex-col gap-4" data-testid="vita-shade-display">
      <div className="flex items-center gap-4">
        {/* 현재 셰이드 */}
        <div className="flex flex-col items-center">
          <div
            className="w-16 h-16 rounded-lg border-2 border-gray-200"
            style={{ backgroundColor: currentRef ? labToHex(currentRef.lab) : '#f0f0f0' }}
          />
          <span className="mt-2 text-sm font-medium">{currentShade}</span>
          <span className="text-xs text-muted-foreground">현재</span>
        </div>

        {/* 화살표 */}
        {showComparison && targetShade && (
          <>
            <div className="text-2xl text-muted-foreground">→</div>
            {/* 목표 셰이드 */}
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-lg border-2 border-primary"
                style={{ backgroundColor: targetRef ? labToHex(targetRef.lab) : '#f0f0f0' }}
              />
              <span className="mt-2 text-sm font-medium">{targetShade}</span>
              <span className="text-xs text-primary">목표</span>
            </div>
          </>
        )}
      </div>

      {/* 명도 순위 표시 */}
      {currentRef && (
        <div className="text-sm text-muted-foreground">
          명도 순위: {currentRef.brightnessRank}/16
          ({currentRef.series}계열)
        </div>
      )}
    </div>
  );
}
```

### 7.2 잇몸 건강 지표

```tsx
// components/oral-health/GumHealthIndicator.tsx
'use client';

import { GumHealthStatus } from '@/lib/oral-health';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface GumHealthIndicatorProps {
  status: GumHealthStatus;
  inflammationScore: number;
  needsDentalVisit: boolean;
  recommendations: string[];
}

const STATUS_CONFIG: Record<GumHealthStatus, {
  label: string;
  color: string;
  icon: typeof CheckCircle;
  description: string;
}> = {
  healthy: {
    label: '건강',
    color: 'text-green-600 bg-green-50',
    icon: CheckCircle,
    description: '잇몸이 건강한 상태입니다.',
  },
  mild_gingivitis: {
    label: '경미한 염증',
    color: 'text-yellow-600 bg-yellow-50',
    icon: Info,
    description: '경미한 잇몸 염증이 감지되었습니다.',
  },
  moderate_gingivitis: {
    label: '중등도 염증',
    color: 'text-orange-600 bg-orange-50',
    icon: AlertTriangle,
    description: '치과 검진을 권장합니다.',
  },
  severe_inflammation: {
    label: '심한 염증',
    color: 'text-red-600 bg-red-50',
    icon: AlertTriangle,
    description: '가능한 빠른 시일 내 치과 방문이 필요합니다.',
  },
};

export function GumHealthIndicator({
  status,
  inflammationScore,
  needsDentalVisit,
  recommendations,
}: GumHealthIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className="rounded-xl border p-4" data-testid="gum-health-indicator">
      {/* 상태 뱃지 */}
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.color}`}>
        <Icon size={16} />
        <span className="font-medium">{config.label}</span>
      </div>

      {/* 염증 점수 게이지 */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>염증 지수</span>
          <span>{inflammationScore}/100</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              inflammationScore < 25 ? 'bg-green-500' :
              inflammationScore < 50 ? 'bg-yellow-500' :
              inflammationScore < 75 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${inflammationScore}%` }}
          />
        </div>
      </div>

      {/* 설명 */}
      <p className="mt-4 text-sm text-muted-foreground">
        {config.description}
      </p>

      {/* 치과 방문 알림 */}
      {needsDentalVisit && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800 font-medium">
            치과 방문을 권장합니다
          </p>
        </div>
      )}

      {/* 권장사항 */}
      {recommendations.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">관리 권장사항</h4>
          <ul className="space-y-1">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## 8. 의료 면책 조항

### 8.1 필수 표시 문구

```typescript
// lib/oral-health/internal/disclaimer.ts

export const ORAL_HEALTH_DISCLAIMER = {
  ko: {
    general: '본 서비스는 의료 진단을 대체하지 않습니다. 정확한 진단은 치과 전문의 상담이 필요합니다.',
    toothColor: 'AI 분석 결과는 참고용이며, 정확한 셰이드 측정은 치과에서 분광광도계로 진행됩니다.',
    gumHealth: '잇몸 건강 분석은 스크리닝 목적이며, 치주낭 깊이, 골소실 등 정밀 검사는 치과 방문이 필요합니다.',
    whitening: '미백 시술 전 치과 전문의 상담을 통해 적합성을 확인하세요.',
  },
  en: {
    general: 'This service does not replace medical diagnosis. Accurate diagnosis requires consultation with a dental professional.',
    toothColor: 'AI analysis results are for reference only. Accurate shade measurement requires a spectrophotometer at a dental clinic.',
    gumHealth: 'Gum health analysis is for screening purposes. Detailed examination of periodontal pocket depth and bone loss requires a dental visit.',
    whitening: 'Please consult a dental professional before whitening procedures to confirm suitability.',
  },
};

/**
 * 분석 불가능 영역 명시
 */
export const AI_LIMITATIONS = {
  cannotAnalyze: [
    '치주낭 깊이 (Probing 필요)',
    '골소실 정도 (X-ray 필요)',
    '충치 깊이 (X-ray 필요)',
    '치아 동요도 (촉진 필요)',
  ],
  accuracy: {
    toothColor: 'ΔE 2.7 이내 (임상 허용 범위)',
    gumInflammation: 'AUC 87.11%',
    tartarDetection: '정확도 81.11%',
  },
};
```

### 8.2 컴포넌트 적용

```tsx
// components/oral-health/MedicalDisclaimer.tsx
'use client';

import { Info } from 'lucide-react';
import { ORAL_HEALTH_DISCLAIMER, AI_LIMITATIONS } from '@/lib/oral-health/internal/disclaimer';

interface MedicalDisclaimerProps {
  type: 'general' | 'toothColor' | 'gumHealth' | 'whitening';
  showLimitations?: boolean;
}

export function MedicalDisclaimer({ type, showLimitations = false }: MedicalDisclaimerProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" data-testid="medical-disclaimer">
      <div className="flex items-start gap-3">
        <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm text-blue-800">
            {ORAL_HEALTH_DISCLAIMER.ko[type]}
          </p>

          {showLimitations && (
            <div className="mt-3">
              <p className="text-xs font-medium text-blue-700 mb-1">
                AI 분석 한계 (정밀 검사 필요):
              </p>
              <ul className="text-xs text-blue-600 space-y-0.5">
                {AI_LIMITATIONS.cannotAnalyze.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 9. Mock 데이터 및 Fallback

### 9.1 Mock 데이터 타입 정의

```typescript
// lib/oral-health/mock/types.ts

import {
  LabColor,
  VitaShade,
  GumHealthStatus,
  OralHealthAssessment,
  ToothColorResult,
  GumHealthResult,
  WhiteningGoalResult,
  UserOralProfile,
} from '../types';

/**
 * VITA 16-Shade 스케일
 * 참조: VITA Zahnfabrik Classical Shade Guide
 * 명도순 정렬 (B1이 가장 밝음)
 */
export type VitaShade =
  | 'B1' | 'A1' | 'B2' | 'D2'  // 가장 밝은 그룹
  | 'A2' | 'C1' | 'C2' | 'D4'  // 밝은 그룹
  | 'A3' | 'D3' | 'B3' | 'A3.5'  // 중간 그룹
  | 'B4' | 'C3' | 'A4' | 'C4';   // 어두운 그룹

/**
 * VITA 셰이드 참조값 데이터베이스
 * Lab 값 기준 (CIE L*a*b* 색공간)
 */
export interface VitaShadeReference {
  shade: VitaShade;
  lab: LabColor;
  brightnessRank: number;  // 1-16 (1=B1 가장 밝음)
  series: 'A' | 'B' | 'C' | 'D';
  description: string;
}

/**
 * 구강건강 분석 Mock 데이터 타입
 */
export interface OralHealthMockData {
  input: {
    imageBase64?: string;
    userId: string;
    includeGumAnalysis?: boolean;
    includeWhiteningGoal?: boolean;
  };
  expected: OralHealthAssessment;
}

/**
 * 치아 색상 Mock 데이터 타입
 */
export interface ToothColorMockData {
  input: {
    measuredLab: LabColor;
    referenceCard: boolean;
  };
  expected: ToothColorResult;
}

/**
 * 잇몸 건강 Mock 데이터 타입
 */
export interface GumHealthMockData {
  input: {
    aStarValue: number;  // a* 값 (붉은기)
  };
  expected: GumHealthResult;
}
```

### 9.2 VITA 16-Shade 스케일 Mock 데이터베이스

```typescript
// lib/oral-health/mock/vita-database.ts

/**
 * VITA Classical 16-Shade Lab 참조값
 *
 * 참조: VITA Zahnfabrik shade guide, 문헌 측정값 기반
 * L* (명도): 0(검정)~100(흰색)
 * a* (적-녹): -60(녹색)~+60(적색)
 * b* (황-청): -60(청색)~+60(황색)
 */
export const VITA_SHADE_DATABASE: VitaShadeReference[] = [
  // 가장 밝은 그룹 (Rank 1-4)
  { shade: 'B1', lab: { L: 71.0, a: 1.5, b: 15.0 }, brightnessRank: 1, series: 'B', description: '가장 밝고 자연스러운 미백' },
  { shade: 'A1', lab: { L: 70.0, a: 2.5, b: 17.0 }, brightnessRank: 2, series: 'A', description: '밝고 따뜻한 톤' },
  { shade: 'B2', lab: { L: 68.0, a: 2.0, b: 16.5 }, brightnessRank: 3, series: 'B', description: '자연스러운 밝은 톤' },
  { shade: 'D2', lab: { L: 67.0, a: 3.0, b: 14.0 }, brightnessRank: 4, series: 'D', description: '밝은 적갈색 톤' },

  // 밝은 그룹 (Rank 5-8)
  { shade: 'A2', lab: { L: 66.0, a: 3.0, b: 19.0 }, brightnessRank: 5, series: 'A', description: '가장 보편적인 셰이드' },
  { shade: 'C1', lab: { L: 65.0, a: 1.0, b: 13.0 }, brightnessRank: 6, series: 'C', description: '밝은 회색 톤' },
  { shade: 'C2', lab: { L: 63.5, a: 1.5, b: 15.0 }, brightnessRank: 7, series: 'C', description: '자연스러운 회색 톤' },
  { shade: 'D4', lab: { L: 62.0, a: 4.5, b: 20.0 }, brightnessRank: 8, series: 'D', description: '어두운 적갈색 톤' },

  // 중간 그룹 (Rank 9-12)
  { shade: 'A3', lab: { L: 63.0, a: 3.5, b: 21.0 }, brightnessRank: 9, series: 'A', description: '평균적인 성인 치아' },
  { shade: 'D3', lab: { L: 61.0, a: 3.5, b: 17.0 }, brightnessRank: 10, series: 'D', description: '중간 적갈색 톤' },
  { shade: 'B3', lab: { L: 60.0, a: 3.0, b: 20.5 }, brightnessRank: 11, series: 'B', description: '중간 황색 톤' },
  { shade: 'A3.5', lab: { L: 58.0, a: 4.0, b: 23.0 }, brightnessRank: 12, series: 'A', description: 'A3보다 어두운 톤' },

  // 어두운 그룹 (Rank 13-16)
  { shade: 'B4', lab: { L: 55.0, a: 4.5, b: 24.0 }, brightnessRank: 13, series: 'B', description: '어두운 황색 톤' },
  { shade: 'C3', lab: { L: 54.0, a: 2.0, b: 16.0 }, brightnessRank: 14, series: 'C', description: '어두운 회색 톤' },
  { shade: 'A4', lab: { L: 52.0, a: 5.0, b: 26.0 }, brightnessRank: 15, series: 'A', description: '어두운 적황색 톤' },
  { shade: 'C4', lab: { L: 48.0, a: 0.5, b: 11.0 }, brightnessRank: 16, series: 'C', description: '가장 어두운 회색 톤' },
];

/**
 * 셰이드 시리즈별 특성
 */
export const VITA_SERIES_CHARACTERISTICS = {
  A: { name: '적-갈색 계열', description: '따뜻한 톤, 가장 보편적', count: 5 },
  B: { name: '적-황색 계열', description: '자연스러운 톤, 미백 목표', count: 4 },
  C: { name: '회색 계열', description: '차가운 톤', count: 4 },
  D: { name: '적-회색 계열', description: '중성 톤', count: 3 },
};
```

### 9.3 입력 Mock 데이터

```typescript
// lib/oral-health/mock/input-mocks.ts

/**
 * 표준 입력 Mock - 건강한 치아 + 건강한 잇몸
 */
export const STANDARD_ORAL_INPUT_MOCK: OralHealthMockData['input'] = {
  userId: 'user_oral_standard_123',
  includeGumAnalysis: true,
  includeWhiteningGoal: true,
};

/**
 * 최소 입력 Mock - 치아 색상만
 */
export const MINIMAL_ORAL_INPUT_MOCK: OralHealthMockData['input'] = {
  userId: 'user_oral_minimal_456',
  includeGumAnalysis: false,
  includeWhiteningGoal: false,
};

/**
 * 경계값: 매우 밝은 치아 (B1급)
 */
export const BRIGHT_TOOTH_INPUT_MOCK: ToothColorMockData['input'] = {
  measuredLab: { L: 71, a: 1.5, b: 15 },
  referenceCard: true,
};

/**
 * 경계값: 매우 어두운 치아 (C4급)
 */
export const DARK_TOOTH_INPUT_MOCK: ToothColorMockData['input'] = {
  measuredLab: { L: 48, a: 0.5, b: 11 },
  referenceCard: false,
};

/**
 * 경계값: 건강한 잇몸 (a* 낮음)
 */
export const HEALTHY_GUM_INPUT_MOCK: GumHealthMockData['input'] = {
  aStarValue: 8.0,  // 낮은 a* = 정상 핑크색
};

/**
 * 경계값: 염증 잇몸 (a* 높음)
 */
export const INFLAMED_GUM_INPUT_MOCK: GumHealthMockData['input'] = {
  aStarValue: 28.0,  // 높은 a* = 붉은기 강함
};
```

### 9.4 출력 Mock 데이터

```typescript
// lib/oral-health/mock/output-mocks.ts

/**
 * 표준 구강건강 분석 결과 Mock
 */
export const mockOralResult: OralHealthAssessment = {
  id: 'mock_oral_20260121_abc123',
  clerk_user_id: 'user_oral_standard_123',
  createdAt: new Date().toISOString(),
  toothColor: {
    measuredLab: { L: 66, a: 3.0, b: 19 },
    matchedShade: 'A2',
    deltaE: 1.2,
    confidence: 87,
    brightnessRank: 5,
  },
  gumHealth: {
    healthStatus: 'healthy',
    inflammationScore: 15,
    aStarAverage: 10.5,
    recommendations: [
      '현재 잇몸 상태가 양호합니다.',
      '3-6개월마다 정기 검진을 권장합니다.',
    ],
    needsDentalVisit: false,
  },
  hygieneScore: 82,
  recommendations: [
    '치아 색상이 A2로 자연스러운 상태입니다.',
    '변형 바스법 칫솔질을 유지하세요.',
    '치간 청소를 위해 치실 사용을 권장합니다.',
  ],
  usedFallback: false,
  imageQualityScore: 85,
};

/**
 * 밝은 치아 (B1) 결과 Mock
 */
export const BRIGHT_TOOTH_RESULT_MOCK: ToothColorResult = {
  measuredLab: { L: 71, a: 1.5, b: 15 },
  matchedShade: 'B1',
  deltaE: 0.8,
  confidence: 92,
  brightnessRank: 1,
};

/**
 * 어두운 치아 (C4) 결과 Mock
 */
export const DARK_TOOTH_RESULT_MOCK: ToothColorResult = {
  measuredLab: { L: 48, a: 0.5, b: 11 },
  matchedShade: 'C4',
  deltaE: 1.5,
  confidence: 85,
  brightnessRank: 16,
};

/**
 * 건강한 잇몸 결과 Mock
 */
export const HEALTHY_GUM_RESULT_MOCK: GumHealthResult = {
  healthStatus: 'healthy',
  inflammationScore: 12,
  aStarAverage: 8.0,
  recommendations: [
    '잇몸 상태가 매우 양호합니다.',
    '현재 관리 방법을 유지하세요.',
  ],
  needsDentalVisit: false,
};

/**
 * 경미한 치은염 결과 Mock
 */
export const MILD_GINGIVITIS_RESULT_MOCK: GumHealthResult = {
  healthStatus: 'mild_gingivitis',
  inflammationScore: 45,
  aStarAverage: 18.0,
  recommendations: [
    '경미한 잇몸 염증이 감지되었습니다.',
    '잇몸 전용 치약 사용을 권장합니다.',
    '2주 내 개선되지 않으면 치과 방문을 권장합니다.',
  ],
  needsDentalVisit: false,
};

/**
 * 심각한 염증 결과 Mock
 */
export const SEVERE_INFLAMMATION_RESULT_MOCK: GumHealthResult = {
  healthStatus: 'severe_inflammation',
  inflammationScore: 78,
  aStarAverage: 28.0,
  recommendations: [
    '잇몸에 상당한 염증이 감지되었습니다.',
    '가능한 빨리 치과 전문의 진료를 받으세요.',
    '부드러운 칫솔로 조심스럽게 칫솔질하세요.',
  ],
  needsDentalVisit: true,
};

/**
 * Fallback Mock (AI 타임아웃 시)
 */
export const ORAL_FALLBACK_MOCK: OralHealthAssessment = {
  id: `mock_oral_fallback_${Date.now()}`,
  clerk_user_id: '',
  createdAt: new Date().toISOString(),
  toothColor: {
    measuredLab: { L: 63, a: 3.5, b: 21 },
    matchedShade: 'A3',
    deltaE: 2.0,
    confidence: 50,
    brightnessRank: 9,
  },
  gumHealth: {
    healthStatus: 'healthy',
    inflammationScore: 20,
    aStarAverage: 12.0,
    recommendations: ['분석이 제한적입니다. 참고용으로만 사용하세요.'],
    needsDentalVisit: false,
  },
  hygieneScore: 70,
  recommendations: [
    '이미지 분석이 제한적으로 수행되었습니다.',
    '정확한 진단을 위해 치과 방문을 권장합니다.',
  ],
  usedFallback: true,
  fallbackReason: 'AI analysis timeout or image quality insufficient',
  imageQualityScore: 50,
};
```

### 9.5 Mock 생성 함수

```typescript
// lib/oral-health/mock/generators.ts

import { OralHealthAssessment, VitaShade, GumHealthStatus } from '../types';
import { VITA_SHADE_DATABASE } from './vita-database';

/**
 * 랜덤 VITA 셰이드 선택
 */
function getRandomVitaShade(): VitaShade {
  const shades: VitaShade[] = ['A2', 'A3', 'B2', 'B3', 'C2', 'D3'];
  return shades[Math.floor(Math.random() * shades.length)];
}

/**
 * Mock 구강건강 분석 결과 생성기
 *
 * @param clerk_user_id - 사용자 ID
 * @param options - 생성 옵션
 * @returns Mock 분석 결과
 */
export function generateMockOralHealthAssessment(
  clerk_user_id: string,
  options?: {
    shade?: VitaShade;
    gumStatus?: GumHealthStatus;
    forceHealthy?: boolean;
  }
): OralHealthAssessment {
  const shade = options?.shade ?? getRandomVitaShade();
  const shadeRef = VITA_SHADE_DATABASE.find(s => s.shade === shade)!;

  const statuses: GumHealthStatus[] = options?.forceHealthy
    ? ['healthy']
    : ['healthy', 'mild_gingivitis'];

  const gumStatus = options?.gumStatus ?? statuses[Math.floor(Math.random() * statuses.length)];

  return {
    id: `mock_oral_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    clerk_user_id,
    createdAt: new Date().toISOString(),
    toothColor: {
      measuredLab: {
        L: shadeRef.lab.L + (Math.random() - 0.5) * 2,
        a: shadeRef.lab.a + (Math.random() - 0.5) * 0.5,
        b: shadeRef.lab.b + (Math.random() - 0.5) * 1,
      },
      matchedShade: shade,
      deltaE: 1.0 + Math.random() * 1.5,
      confidence: 75 + Math.random() * 20,
      brightnessRank: shadeRef.brightnessRank,
    },
    gumHealth: {
      healthStatus: gumStatus,
      inflammationScore: gumStatus === 'healthy'
        ? 10 + Math.random() * 20
        : 35 + Math.random() * 25,
      aStarAverage: gumStatus === 'healthy'
        ? 8 + Math.random() * 5
        : 15 + Math.random() * 10,
      recommendations: generateGumRecommendations(gumStatus),
      needsDentalVisit: gumStatus === 'severe_inflammation' || gumStatus === 'moderate_gingivitis',
    },
    hygieneScore: 65 + Math.random() * 30,
    recommendations: generateOverallRecommendations(shade, gumStatus),
    usedFallback: true,
    imageQualityScore: 70 + Math.random() * 25,
  };
}

/**
 * 잇몸 상태별 권장사항 생성
 */
function generateGumRecommendations(status: GumHealthStatus): string[] {
  const recommendations: Record<GumHealthStatus, string[]> = {
    healthy: [
      '잇몸 상태가 양호합니다.',
      '3-6개월마다 정기 검진을 권장합니다.',
    ],
    mild_gingivitis: [
      '경미한 잇몸 염증이 감지되었습니다.',
      '잇몸 전용 치약 사용을 권장합니다.',
      '부드러운 칫솔로 잇몸 마사지를 해주세요.',
    ],
    moderate_gingivitis: [
      '중등도 잇몸 염증이 감지되었습니다.',
      '1-2주 내 치과 방문을 권장합니다.',
      'CPC 성분 구강청결제 사용을 권장합니다.',
    ],
    severe_inflammation: [
      '심각한 잇몸 염증이 감지되었습니다.',
      '가능한 빨리 치과 전문의 진료를 받으세요.',
      '자가 치료를 삼가고 전문 치료를 받으세요.',
    ],
  };
  return recommendations[status];
}

/**
 * 종합 권장사항 생성
 */
function generateOverallRecommendations(shade: VitaShade, gumStatus: GumHealthStatus): string[] {
  const shadeRef = VITA_SHADE_DATABASE.find(s => s.shade === shade);
  const recommendations: string[] = [];

  // 치아 색상 관련
  if (shadeRef && shadeRef.brightnessRank <= 4) {
    recommendations.push(`치아 색상이 ${shade}로 매우 밝은 상태입니다. 현재 상태를 유지하세요.`);
  } else if (shadeRef && shadeRef.brightnessRank <= 8) {
    recommendations.push(`치아 색상이 ${shade}로 자연스러운 상태입니다.`);
  } else {
    recommendations.push(`치아 미백을 원하시면 치과 상담을 권장합니다.`);
  }

  // 잇몸 상태 관련
  if (gumStatus !== 'healthy') {
    recommendations.push('잇몸 건강 개선을 위한 관리가 필요합니다.');
  }

  // 일반 권장사항
  recommendations.push('하루 2회 이상 올바른 칫솔질을 유지하세요.');
  recommendations.push('치실 또는 치간칫솔 사용을 권장합니다.');

  return recommendations;
}
```

### 9.6 제품 추천 Mock

```typescript
// lib/oral-health/mock/product-recommendations.ts

export const MOCK_PRODUCT_RECOMMENDATIONS = {
  toothpaste: [
    {
      productId: 'tp_sensodyne_repair',
      matchScore: 92,
      matchReasons: ['민감성 케어', 'n-HAp 함유'],
      keyIngredients: ['n-HAp', 'Potassium Nitrate'],
    },
  ],
  mouthwash: [
    {
      productId: 'mw_gum_cpc',
      matchScore: 88,
      matchReasons: ['잇몸 케어', '장기 사용 가능'],
      keyIngredients: ['CPC 0.05%'],
    },
  ],
  interdental: {
    primary: [{ type: 'floss_ptfe', reason: '좁은 치간 공간 청소에 효과적' }],
    alternative: [{ type: 'water_flosser', reason: '추가 청소력 원할 때' }],
  },
  accessories: [],
  avoidIngredients: [],
  keyIngredients: ['n-HAp', 'CPC'],
  careRoutine: [
    { step: 1, action: '부드러운 칫솔로 변형 바스법 칫솔질', duration: '2분' },
    { step: 2, action: '치실 또는 치간칫솔 사용', duration: '1분' },
    { step: 3, action: '구강청결제 30초 가글', duration: '30초' },
  ],
};
```

### 9.7 테스트 케이스 테이블

| ID | 시나리오 | 입력 Mock | 기대 출력 | 검증 포인트 |
|----|----------|----------|----------|------------|
| OH1-T-01 | 밝은 치아 (B1) | `BRIGHT_TOOTH_INPUT_MOCK` | shade=B1, rank=1 | ΔE < 1.0 |
| OH1-T-02 | 평균 치아 (A3) | Lab(63, 3.5, 21) | shade=A3 | ΔE < 2.7 (임상 허용) |
| OH1-T-03 | 어두운 치아 (C4) | `DARK_TOOTH_INPUT_MOCK` | shade=C4, rank=16 | 정확한 매칭 |
| OH1-T-04 | CIEDE2000 동일색 | Lab1 = Lab2 | ΔE = 0 | 정확히 0 |
| OH1-T-05 | CIEDE2000 ISO 기준 | ISO 테스트 데이터 | 표준값 일치 | 오차 ±0.003 |
| OH1-T-06 | 건강한 잇몸 | a* = 8.0 | status=healthy | inflammationScore < 25 |
| OH1-T-07 | 경미한 치은염 | a* = 18.0 | status=mild_gingivitis | needsDentalVisit=false |
| OH1-T-08 | 심각한 염증 | a* = 28.0 | status=severe_inflammation | needsDentalVisit=true |
| OH1-T-09 | 과도한 미백 경고 (웜톤) | spring + 0M1 목표 | isOverWhitening=true | 웜톤 경고 메시지 |
| OH1-T-10 | 적절한 미백 (쿨톤) | winter + 0M1 목표 | isOverWhitening=false | 허용 |
| OH1-T-11 | 민감성 제품 추천 | sensitivity=severe | n-HAp 포함 | 고농도 H2O2 제외 |
| OH1-T-12 | 교정 환자 제품 추천 | dentalWork=braces | water_flosser 포함 | 치실 대안 |
| OH1-T-13 | Fallback | 타임아웃 시뮬레이션 | `ORAL_FALLBACK_MOCK` | usedFallback=true |
| OH1-T-14 | 이미지 품질 부족 | imageQuality < 50 | 경고 + fallback | 재촬영 안내 |
| OH1-T-15 | 전체 통합 | 표준 입력 | mockOralResult | 모든 필드 유효 |

---

## 10. P3 원자 분해

> **P3 원칙 준수**: 각 원자는 2시간 이내, 독립 테스트 가능, 명확한 입출력

### 10.1 P3 점수 평가

| 항목 | 배점 | 점수 | 근거 |
|------|------|------|------|
| ATOM ID 부여 | 20점 | 20점 | 모든 ATOM ID 부여 (OH-1.1 ~ OH-1.9) |
| 소요시간 명시 | 20점 | 20점 | 모든 ATOM 시간 명시 (9개, 총 16시간) |
| 입출력 스펙 | 20점 | 20점 | TypeScript 인터페이스 완비 |
| 성공 기준 | 20점 | 20점 | 체크리스트 + 알고리즘 상세 + 테스트 케이스 |
| 의존성 그래프 | 10점 | 10점 | 의존성 명시 및 병렬화 가능 여부 |
| 구현 순서 | 10점 | 10점 | Phase별 구현 순서 정의 |
| **총점** | **100점** | **100점** | - |

### 10.2 원자 요약 테이블

| ID | 원자명 | 소요시간 | 의존성 | 병렬 가능 |
|----|--------|----------|--------|----------|
| **OH-1.1** | 타입/스키마 정의 | 1h | - | 예 |
| **OH-1.2** | RGB→Lab 색상 변환 + CIEDE2000 | 2h | - | 예 |
| **OH-1.3** | VITA 16-shade 매칭 | 1.5h | OH-1.2 | 아니오 |
| **OH-1.4** | 치아 영역 세그멘테이션 | 2h | CIE-1 | 예 |
| **OH-1.5** | 잇몸 Lab 색상 분석 + 염증 점수 | 2h | OH-1.2, OH-1.4 | 아니오 |
| **OH-1.6** | 미백 목표 + PC-1 연동 | 1.5h | OH-1.3, PC-1 | 아니오 |
| **OH-1.7** | N-1 영양 연동 | 1h | OH-1.5 | 예 |
| **OH-1.8** | API 라우트 + Mock Fallback | 2h | OH-1.1~1.7 | 아니오 |
| **OH-1.9** | 테스트 작성 | 3h | OH-1.1~1.8 | 아니오 |

**총 예상 시간**: 16시간 (직렬), 10시간 (병렬 최적화)

### 10.3 의존성 그래프

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OH-1 의존성 그래프 (P3 준수 버전)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Phase 1: 기반 (병렬 가능)                                                │
│  ┌─────────────┐  ┌─────────────────────┐                               │
│  │  OH-1.1     │  │     OH-1.2          │                               │
│  │  타입/스키마  │  │ RGB→Lab + CIEDE2000 │                               │
│  └─────────────┘  └──────────┬──────────┘                               │
│                              │                                           │
│  Phase 2: 색상 분석                                                       │
│                              ▼                                           │
│  CIE-1 ──────▶ ┌─────────────────────┐                                  │
│  (이미지 품질)  │      OH-1.3         │                                  │
│                │ VITA 16-shade 매칭   │                                  │
│                └──────────┬──────────┘                                  │
│                           │                                              │
│  Phase 3: 영역 분석       │                                              │
│  ┌─────────────────────┐  │                                              │
│  │      OH-1.4         │  │                                              │
│  │ 치아 영역 세그멘테이션 │  │                                              │
│  └──────────┬──────────┘  │                                              │
│             │             │                                              │
│             ▼             ▼                                              │
│  ┌─────────────────────────────┐    ┌─────────────────────┐             │
│  │        OH-1.5               │    │      OH-1.6         │             │
│  │ 잇몸 Lab 분석 + 염증 점수    │    │ 미백 목표 + PC-1    │◀── PC-1    │
│  └──────────┬──────────────────┘    └──────────┬──────────┘             │
│             │                                   │                        │
│  Phase 4: 연동                                  │                        │
│  ┌─────────────────────┐                       │                        │
│  │      OH-1.7         │                       │                        │
│  │    N-1 영양 연동     │◀───────────────────────┘                        │
│  └──────────┬──────────┘                                                 │
│             │                                                            │
│  Phase 5: 통합                                                           │
│             ▼                                                            │
│  ┌─────────────────────────────┐                                        │
│  │        OH-1.8               │                                        │
│  │  API 라우트 + Mock Fallback  │                                        │
│  └──────────┬──────────────────┘                                        │
│             │                                                            │
│  Phase 6: 검증                                                           │
│             ▼                                                            │
│  ┌─────────────────────┐                                                │
│  │      OH-1.9         │                                                │
│  │    테스트 작성       │                                                │
│  └─────────────────────┘                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.4 원자 상세 정의

---

#### OH-1.1: 타입/스키마 정의

| 항목 | 값 |
|------|-----|
| 소요시간 | 1h |
| 의존성 | 없음 |
| 병렬 가능 | 예 |
| 파일 위치 | `apps/web/types/oral-health.ts` |

**입력 스펙**:
```typescript
// 없음 - 타입 정의만 수행
```

**출력 스펙**:
```typescript
// types/oral-health.ts

// 색공간 타입
export interface LabColor {
  L: number;  // 0-100 (명도)
  a: number;  // -128 to +127 (적-녹)
  b: number;  // -128 to +127 (황-청)
}

export interface RgbColor {
  r: number;  // 0-255
  g: number;  // 0-255
  b: number;  // 0-255
}

// VITA 셰이드 시스템
export type VitaSeries = 'A' | 'B' | 'C' | 'D';

export type VitaShade =
  | 'A1' | 'A2' | 'A3' | 'A3.5' | 'A4'
  | 'B1' | 'B2' | 'B3' | 'B4'
  | 'C1' | 'C2' | 'C3' | 'C4'
  | 'D2' | 'D3' | 'D4'
  | '0M1' | '0M2' | '0M3';

export interface VitaShadeReference {
  shade: VitaShade;
  lab: LabColor;
  series: VitaSeries;
  brightnessRank: number;  // 1 = brightest (B1), 16 = darkest (C4)
}

// 잇몸 건강
export type GumHealthStatus =
  | 'healthy'
  | 'mild_gingivitis'
  | 'moderate_gingivitis'
  | 'severe_inflammation';

export interface GumHealthMetrics {
  aStarMean: number;
  aStarStd: number;
  rednessPercentage: number;
  swellingIndicator: number;
}

// 사용자 프로필
export interface UserOralProfile {
  sensitivity: 'none' | 'mild' | 'severe';
  gumHealth: 'healthy' | 'gingivitis' | 'periodontitis';
  cavityRisk: 'low' | 'medium' | 'high';
  calculus: 'none' | 'mild' | 'heavy';
  halitosis: boolean;
  dentalWork: DentalWorkType[];
}

export type DentalWorkType = 'braces' | 'implant' | 'bridge' | 'crown' | 'veneer';

// API 요청/응답
export interface OralHealthRequest {
  imageBase64: string;
  analysisType: 'tooth_color' | 'gum_health' | 'full';
  personalColorSeason?: PersonalColorSeason;
  oralProfile?: UserOralProfile;
}

export interface OralHealthResponse {
  success: boolean;
  data: OralHealthAssessment;
  disclaimer: string;
  usedFallback: boolean;
}

export interface OralHealthAssessment {
  id: string;
  clerk_user_id: string;
  toothColor?: ToothColorResult;
  gumHealth?: GumHealthResult;
  whiteningGoal?: WhiteningGoalResult;
  hygieneScore: number;
  recommendations: string[];
  created_at: string;
}
```

**성공 기준**:
- [ ] 모든 타입 `strict` 모드 통과
- [ ] `any` 타입 사용 없음
- [ ] Zod 스키마와 일치
- [ ] `npm run typecheck` 통과

**파일 배치**:
| 파일 경로 | 변경 유형 | 설명 |
|-----------|----------|------|
| `apps/web/types/oral-health.ts` | 신규 | 모든 타입 정의 |

---

#### OH-1.2: RGB→Lab 색상 변환 + CIEDE2000

| 항목 | 값 |
|------|-----|
| 소요시간 | 2h |
| 의존성 | 없음 |
| 병렬 가능 | 예 |
| 파일 위치 | `apps/web/lib/oral-health/internal/lab-converter.ts`, `apps/web/lib/oral-health/internal/ciede2000.ts` |

**입력 스펙**:
```typescript
interface RgbToLabInput {
  rgb: RgbColor;
}

interface Ciede2000Input {
  lab1: LabColor;
  lab2: LabColor;
}
```

**출력 스펙**:
```typescript
interface RgbToLabOutput {
  lab: LabColor;
}

interface Ciede2000Output {
  deltaE: number;  // 색차 값 (0 = 동일, >3.3 = 명확히 다름)
}
```

**알고리즘 개요**:

**1. RGB → XYZ 변환**:
```typescript
// sRGB → Linear RGB
function linearize(c: number): number {
  const c_norm = c / 255;
  return c_norm <= 0.04045
    ? c_norm / 12.92
    : Math.pow((c_norm + 0.055) / 1.055, 2.4);
}

// Linear RGB → XYZ (D65 illuminant)
const M = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.0721750],
  [0.0193339, 0.1191920, 0.9503041],
];
```

**2. XYZ → Lab 변환**:
```typescript
// D65 reference white
const Xn = 95.047, Yn = 100.0, Zn = 108.883;

function f(t: number): number {
  const delta = 6 / 29;
  return t > delta ** 3
    ? Math.cbrt(t)
    : t / (3 * delta ** 2) + 4 / 29;
}

// Lab 계산
const L = 116 * f(Y / Yn) - 16;
const a = 500 * (f(X / Xn) - f(Y / Yn));
const b = 200 * (f(Y / Yn) - f(Z / Zn));
```

**3. CIEDE2000 색차 공식** (ISO/CIE 11664-6:2014):
```typescript
// 간략 구현 - 전체 공식은 ISO 표준 참조
function calculateCIEDE2000(lab1: LabColor, lab2: LabColor): number {
  const kL = 1, kC = 1, kH = 1;  // 가중치

  // 1. C' 계산
  const C1 = Math.sqrt(lab1.a ** 2 + lab1.b ** 2);
  const C2 = Math.sqrt(lab2.a ** 2 + lab2.b ** 2);
  const C_avg = (C1 + C2) / 2;

  // 2. a' 보정
  const G = 0.5 * (1 - Math.sqrt(C_avg ** 7 / (C_avg ** 7 + 25 ** 7)));
  const a1_prime = lab1.a * (1 + G);
  const a2_prime = lab2.a * (1 + G);

  // ... (전체 공식 생략)

  return deltaE00;
}
```

**성공 기준**:
- [ ] RGB(255,255,255) → Lab(100, 0, 0) 변환 정확도 ΔE < 0.01
- [ ] RGB(0,0,0) → Lab(0, 0, 0) 변환 정확도
- [ ] ISO 11664-6:2014 테스트 데이터 5개 이상 통과 (ΔE 오차 < 0.001)
- [ ] 동일 색상 CIEDE2000 = 0
- [ ] typecheck 통과

**테스트 케이스**:
| TC ID | 입력 | 예상 출력 | 설명 |
|-------|------|----------|------|
| OH12-TC1 | RGB(255,255,255) | L=100, a~0, b~0 | 흰색 변환 |
| OH12-TC2 | RGB(0,0,0) | L=0, a=0, b=0 | 검정 변환 |
| OH12-TC3 | Lab1=Lab2 | deltaE=0 | 동일 색상 |
| OH12-TC4 | ISO Test #1 | deltaE=2.0425 | ISO 표준 검증 |
| OH12-TC5 | Lab1{50,2.67,-79.78}, Lab2{50,0,-82.75} | deltaE~2.04 | ISO 표준 검증 |

**파일 배치**:
| 파일 경로 | 변경 유형 | 설명 |
|-----------|----------|------|
| `apps/web/lib/oral-health/internal/lab-converter.ts` | 신규 | RGB↔Lab 변환 |
| `apps/web/lib/oral-health/internal/ciede2000.ts` | 신규 | CIEDE2000 색차 계산 |
| `apps/web/tests/lib/oral-health/ciede2000.test.ts` | 신규 | 색차 테스트 |

---

#### OH-1.3: VITA 16-shade 매칭

| 항목 | 값 |
|------|-----|
| 소요시간 | 1.5h |
| 의존성 | OH-1.2 (CIEDE2000) |
| 병렬 가능 | 아니오 |
| 파일 위치 | `apps/web/lib/oral-health/internal/vita-database.ts` |

**입력 스펙**:
```typescript
interface ShadeMatchInput {
  measuredLab: LabColor;
  options?: {
    maxDeltaE?: number;  // 기본값: 5.0
    topN?: number;       // 반환할 상위 N개 (기본: 1)
  };
}
```

**출력 스펙**:
```typescript
interface ShadeMatchResult {
  shade: VitaShade;
  deltaE: number;
  series: VitaSeries;
  brightnessRank: number;  // 1 (B1, 가장 밝음) ~ 16 (C4, 가장 어두움)
  confidence: number;      // 0-100 (deltaE 기반)
}

interface ShadeMatchOutput {
  primary: ShadeMatchResult;
  alternatives?: ShadeMatchResult[];  // topN > 1 시
}
```

**VITA 셰이드 참조값 데이터베이스**:
```typescript
// 명도순 배열 (밝음 → 어두움)
const VITA_BRIGHTNESS_ORDER: VitaShade[] = [
  'B1', 'A1', 'B2', 'D2', 'A2', 'C1', 'C2', 'D4',
  'A3', 'D3', 'B3', 'A3.5', 'B4', 'C3', 'A4', 'C4'
];

// Lab 참조값
const VITA_SHADE_DATABASE: Record<VitaShade, VitaShadeReference> = {
  'B1': { shade: 'B1', lab: { L: 71, a: 1.5, b: 15 }, series: 'B', brightnessRank: 1 },
  'A1': { shade: 'A1', lab: { L: 70, a: 2, b: 16 }, series: 'A', brightnessRank: 2 },
  'A2': { shade: 'A2', lab: { L: 67, a: 2.5, b: 19 }, series: 'A', brightnessRank: 5 },
  'A3': { shade: 'A3', lab: { L: 63.5, a: 3.5, b: 21.5 }, series: 'A', brightnessRank: 9 },
  'A4': { shade: 'A4', lab: { L: 56.5, a: 5.5, b: 25.5 }, series: 'A', brightnessRank: 15 },
  'C4': { shade: 'C4', lab: { L: 48.5, a: 0.5, b: 11 }, series: 'C', brightnessRank: 16 },
  // ... 전체 16색
};
```

**알고리즘**:
```typescript
function findBestShadeMatch(input: ShadeMatchInput): ShadeMatchOutput {
  const matches: ShadeMatchResult[] = [];

  for (const [shade, ref] of Object.entries(VITA_SHADE_DATABASE)) {
    const deltaE = calculateCIEDE2000(input.measuredLab, ref.lab);

    if (deltaE <= (input.options?.maxDeltaE ?? 5.0)) {
      // 신뢰도: deltaE가 낮을수록 높음
      const confidence = Math.max(0, 100 - deltaE * 30);

      matches.push({
        shade: shade as VitaShade,
        deltaE,
        series: ref.series,
        brightnessRank: ref.brightnessRank,
        confidence: Math.round(confidence),
      });
    }
  }

  // deltaE 오름차순 정렬
  matches.sort((a, b) => a.deltaE - b.deltaE);

  return {
    primary: matches[0],
    alternatives: input.options?.topN && input.options.topN > 1
      ? matches.slice(1, input.options.topN)
      : undefined,
  };
}
```

**성공 기준**:
- [ ] 16개 VITA 셰이드 참조값 완비
- [ ] B1 참조값(L=71, a=1.5, b=15) 입력 시 B1 반환, deltaE < 0.1
- [ ] A3 참조값(L=63.5, a=3.5, b=21.5) 입력 시 A3 반환
- [ ] 임상 허용 범위(ΔE < 2.7) 내 매칭 정확도 95% 이상
- [ ] brightnessRank 1~16 순서 검증

**테스트 케이스**:
| TC ID | 입력 | 예상 출력 | 설명 |
|-------|------|----------|------|
| OH13-TC1 | L=71, a=1.5, b=15 | B1, deltaE<0.1 | 정확히 B1 |
| OH13-TC2 | L=63, a=3.5, b=21 | A3, deltaE<2.7 | 평균 치아 |
| OH13-TC3 | L=48, a=0.5, b=11 | C4 | 가장 어두운 셰이드 |
| OH13-TC4 | L=67.5, a=2.2, b=18 | A2 또는 B2 | 경계값 |
| OH13-TC5 | topN=3 | 3개 결과 | 다중 매칭 |

**파일 배치**:
| 파일 경로 | 변경 유형 | 설명 |
|-----------|----------|------|
| `apps/web/lib/oral-health/internal/vita-database.ts` | 신규 | VITA 셰이드 DB + 매칭 |
| `apps/web/tests/lib/oral-health/vita-database.test.ts` | 신규 | 셰이드 매칭 테스트 |

---

#### OH-1.4: 치아 영역 세그멘테이션

| 항목 | 값 |
|------|-----|
| 소요시간 | 2h |
| 의존성 | CIE-1 (이미지 품질 검증) |
| 병렬 가능 | 예 |
| 파일 위치 | `apps/web/lib/oral-health/internal/tooth-segmenter.ts` |

**입력 스펙**:
```typescript
interface ToothSegmentInput {
  imageBase64: string;
  imageQuality: CIE1QualityResult;  // CIE-1 검증 결과
  options?: {
    minTeethVisible?: number;  // 최소 치아 수 (기본: 6)
    includeGumRegion?: boolean;  // 잇몸 영역도 추출 (기본: true)
  };
}
```

**출력 스펙**:
```typescript
interface ToothSegmentResult {
  toothRegions: BoundingBox[];      // 개별 치아 영역
  toothPixels: PixelData[];         // 치아 픽셀 RGB 배열
  gumRegions?: BoundingBox[];       // 잇몸 영역
  gumPixels?: PixelData[];          // 잇몸 픽셀 RGB 배열
  teethCount: number;               // 감지된 치아 수
  confidence: number;               // 세그멘테이션 신뢰도
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PixelData {
  x: number;
  y: number;
  rgb: RgbColor;
}
```

**알고리즘 개요**:
```
1. CIE-1 품질 검증 통과 확인
2. 색상 기반 마스킹 (치아: 높은 L*, 낮은 a*b*)
3. 형태학적 연산 (erosion/dilation)으로 노이즈 제거
4. 연결 요소 분석으로 개별 치아 분리
5. 잇몸 영역: 치아 하단, 분홍~붉은 영역 감지
```

**간략 구현**:
```typescript
function segmentTeeth(input: ToothSegmentInput): ToothSegmentResult {
  // 1. 품질 검증
  if (input.imageQuality.score < 50) {
    throw new Error('이미지 품질이 너무 낮습니다');
  }

  // 2. RGB → Lab 변환 후 치아 마스크 생성
  const pixels = decodeImage(input.imageBase64);
  const toothMask: boolean[][] = pixels.map(row =>
    row.map(pixel => {
      const lab = rgbToLab(pixel);
      // 치아: 밝고(L>60), 노란기(b>5), 붉은기 낮음(a<10)
      return lab.L > 60 && lab.b > 5 && lab.b < 35 && lab.a < 10;
    })
  );

  // 3. 형태학적 연산으로 정제
  const cleanedMask = morphologicalClose(toothMask, 3);

  // 4. 연결 요소 분석
  const regions = findConnectedComponents(cleanedMask);

  // 5. 잇몸 영역 (치아 마스크 아래, a* > 5)
  const gumMask = pixels.map((row, y) =>
    row.map((pixel, x) => {
      const lab = rgbToLab(pixel);
      return !toothMask[y][x] && lab.a > 5 && lab.a < 25 && lab.L > 40;
    })
  );

  return {
    toothRegions: regions.map(r => r.boundingBox),
    toothPixels: extractPixels(pixels, toothMask),
    gumRegions: findConnectedComponents(gumMask).map(r => r.boundingBox),
    gumPixels: extractPixels(pixels, gumMask),
    teethCount: regions.length,
    confidence: calculateSegmentConfidence(regions),
  };
}
```

**성공 기준**:
- [ ] 최소 6개 치아 감지율 95% 이상
- [ ] 치아/잇몸 분리 정확도 IoU 0.85 이상
- [ ] 품질 낮은 이미지 적절히 거부
- [ ] 처리 시간 < 500ms
- [ ] typecheck 통과

**테스트 케이스**:
| TC ID | 입력 | 예상 출력 | 설명 |
|-------|------|----------|------|
| OH14-TC1 | 표준 구강 이미지 | teethCount >= 6 | 정상 감지 |
| OH14-TC2 | 저품질 이미지 (quality < 50) | Error | 품질 거부 |
| OH14-TC3 | 치아 없는 이미지 | teethCount = 0 | 빈 결과 |
| OH14-TC4 | 닫힌 입 이미지 | teethCount < 6, 경고 | 재촬영 안내 |

**파일 배치**:
| 파일 경로 | 변경 유형 | 설명 |
|-----------|----------|------|
| `apps/web/lib/oral-health/internal/tooth-segmenter.ts` | 신규 | 치아 세그멘테이션 |
| `apps/web/lib/oral-health/internal/gum-segmenter.ts` | 신규 | 잇몸 세그멘테이션 |
| `apps/web/tests/lib/oral-health/tooth-segmenter.test.ts` | 신규 | 세그멘테이션 테스트 |

---

#### OH-1.5: 잇몸 Lab 색상 분석 + 염증 점수

| 항목 | 값 |
|------|-----|
| 소요시간 | 2h |
| 의존성 | OH-1.2 (Lab 변환), OH-1.4 (잇몸 픽셀) |
| 병렬 가능 | 아니오 |
| 파일 위치 | `apps/web/lib/oral-health/gum-health-analyzer.ts` |

**입력 스펙**:
```typescript
interface GumHealthInput {
  gumPixels: PixelData[];           // OH-1.4에서 추출된 잇몸 픽셀
  imageBase64?: string;             // VLM 분석용 (선택)
  useVLM?: boolean;                 // Gemini VLM 사용 여부
}
```

**출력 스펙**:
```typescript
interface GumHealthResult {
  healthStatus: GumHealthStatus;    // 4단계 상태
  inflammationScore: number;        // 0-100 (높을수록 염증)
  metrics: GumHealthMetrics;        // 상세 측정값
  recommendations: string[];        // 권장사항
  needsDentalVisit: boolean;        // 치과 방문 필요 여부
  vlmAssessment?: VLMGumAssessment; // VLM 분석 결과 (선택)
}

interface VLMGumAssessment {
  color: 'pink' | 'red' | 'pale';
  swelling: boolean;
  bleedingSigns: boolean;
  tartarAssessment?: {
    visible: boolean;
    areas: string[];
    severity: 'none' | 'mild' | 'moderate';
  };
  confidence: number;
}
```

**알고리즘**:
```typescript
// a* 값 기반 염증 탐지
// 연구 근거: 치은염 탐지 AUC 87.11%, 민감도 0.92, 특이도 0.94

function analyzeGumHealth(input: GumHealthInput): GumHealthResult {
  // 1. 잇몸 픽셀을 Lab으로 변환
  const labPixels = input.gumPixels.map(p => rgbToLab(p.rgb));

  // 2. a* 값 통계 계산
  const aStarValues = labPixels.map(p => p.a);
  const aStarMean = mean(aStarValues);
  const aStarStd = std(aStarValues);

  // 3. 붉은 영역 비율 (a* > 15)
  const redPixels = aStarValues.filter(a => a > 15);
  const rednessPercentage = (redPixels.length / aStarValues.length) * 100;

  // 4. 염증 점수 계산 (0-100)
  let inflammationScore = 0;
  inflammationScore += Math.min(40, aStarMean * 2);           // a* 기여 (최대 40)
  inflammationScore += Math.min(30, rednessPercentage * 0.5); // 붉은 영역 기여 (최대 30)
  inflammationScore += Math.min(30, aStarStd * 3);            // 불균일 기여 (최대 30)

  // 5. 상태 분류
  const status = classifyStatus(aStarMean, inflammationScore);

  // 6. 치과 방문 권고
  const needsDentalVisit = status === 'moderate_gingivitis' || status === 'severe_inflammation';

  return {
    healthStatus: status,
    inflammationScore: Math.round(inflammationScore),
    metrics: { aStarMean, aStarStd, rednessPercentage, swellingIndicator: 0 },
    recommendations: generateRecommendations(status),
    needsDentalVisit,
  };
}

function classifyStatus(aStarMean: number, score: number): GumHealthStatus {
  if (aStarMean < 10 && score < 25) return 'healthy';
  if (aStarMean < 15 && score < 50) return 'mild_gingivitis';
  if (aStarMean < 20 && score < 75) return 'moderate_gingivitis';
  return 'severe_inflammation';
}
```

**a* 임계값 분류 기준**:
| a* 평균 | 염증 점수 | 상태 | 권장 조치 |
|---------|----------|------|----------|
| < 10 | < 25 | healthy | 현재 관리 유지 |
| 10-15 | 25-50 | mild_gingivitis | 칫솔질 개선, 치실 사용 |
| 15-20 | 50-75 | moderate_gingivitis | 치과 방문 권장 |
| > 20 | > 75 | severe_inflammation | 치과 방문 필수 |

**성공 기준**:
- [ ] a* 값 기반 4단계 분류 정확도 85% 이상
- [ ] 염증 점수 0-100 범위 보장
- [ ] healthy 잇몸(a* < 10)에서 needsDentalVisit = false
- [ ] severe에서 needsDentalVisit = true
- [ ] typecheck 통과

**테스트 케이스**:
| TC ID | 입력 | 예상 출력 | 설명 |
|-------|------|----------|------|
| OH15-TC1 | a* 평균 = 8 | healthy | 정상 잇몸 |
| OH15-TC2 | a* 평균 = 12 | mild_gingivitis | 경미한 염증 |
| OH15-TC3 | a* 평균 = 18 | moderate_gingivitis, needsDentalVisit=true | 중등도 |
| OH15-TC4 | a* 평균 = 22 | severe_inflammation | 심한 염증 |

**파일 배치**:
| 파일 경로 | 변경 유형 | 설명 |
|-----------|----------|------|
| `apps/web/lib/oral-health/gum-health-analyzer.ts` | 신규 | 잇몸 건강 분석 |
| `apps/web/lib/oral-health/internal/inflammation-detector.ts` | 신규 | 염증 탐지 알고리즘 |
| `apps/web/tests/lib/oral-health/gum-health-analyzer.test.ts` | 신규 | 잇몸 분석 테스트 |

---

#### OH-1.6: 미백 목표 + PC-1 연동

| 항목 | 값 |
|------|-----|
| 소요시간 | 1.5h |
| 의존성 | OH-1.3 (VITA 매칭), PC-1 (퍼스널컬러) |
| 병렬 가능 | 아니오 |
| 파일 위치 | `apps/web/lib/oral-health/whitening-goal-calculator.ts` |

**입력 스펙**:
```typescript
interface WhiteningGoalInput {
  currentShade: VitaShade;
  personalColorSeason: PersonalColorSeason;
  desiredLevel: 'natural' | 'moderate' | 'bright';
}

type PersonalColorSeason = 'spring' | 'summer' | 'autumn' | 'winter';
```

**출력 스펙**:
```typescript
interface WhiteningGoalResult {
  targetShade: VitaShade;
  maxSafeShade: VitaShade;          // 과도한 미백 경고선
  preferredSeries: VitaSeries[];    // 권장 계열
  shadeStepsNeeded: number;         // 필요한 셰이드 단계
  estimatedMethod: WhiteningMethod[];
  isOverWhitening: boolean;         // 과도한 미백 경고
  overWhiteningReason?: string;     // 경고 이유
  seasonHarmony: string;            // 시즌 조화 설명
}

type WhiteningMethod = 'home_strips' | 'home_tray' | 'office_bleaching' | 'laser_whitening';
```

**시즌-셰이드 매핑 데이터**:
```typescript
const SEASON_SHADE_RECOMMENDATIONS: Record<PersonalColorSeason, SeasonConfig> = {
  spring: {
    recommendedShades: ['A1', 'B1', 'B2'],
    maxBrightShade: '0M2',       // 웜톤 한계
    preferredSeries: ['A', 'B'],
    avoidShades: ['C1', 'C2', 'C3', 'C4'],
    harmony: '밝고 투명한 노란 피부에 따뜻한 아이보리 톤이 어울립니다.',
  },
  summer: {
    recommendedShades: ['B1', 'C1', 'A1'],
    maxBrightShade: '0M1',       // 쿨톤 허용
    preferredSeries: ['B', 'C'],
    avoidShades: ['A3', 'A3.5', 'A4'],
    harmony: '핑크빛 밝은 피부에 블루 언더톤의 쿨 화이트가 어울립니다.',
  },
  autumn: {
    recommendedShades: ['A2', 'B2', 'A3'],
    maxBrightShade: 'A1',        // 가을은 B1까지만
    preferredSeries: ['A', 'B'],
    avoidShades: ['0M1', '0M2', 'C1'],
    harmony: '구릿빛 건강한 피부에 자연스러운 아이보리~옐로 톤이 조화롭습니다.',
  },
  winter: {
    recommendedShades: ['B1', '0M1', 'C1'],
    maxBrightShade: '0M1',       // 쿨톤 허용
    preferredSeries: ['B', 'C'],
    avoidShades: ['A3', 'A3.5', 'A4', 'B4'],
    harmony: '선명한 핑크 베이스에 순백에 가까운 밝은 화이트가 어울립니다.',
  },
};
```

**알고리즘**:
```typescript
function calculateWhiteningGoal(input: WhiteningGoalInput): WhiteningGoalResult {
  const config = SEASON_SHADE_RECOMMENDATIONS[input.personalColorSeason];

  // 1. 현재 셰이드에서 목표까지 단계 계산
  const currentRank = VITA_SHADE_DATABASE[input.currentShade].brightnessRank;
  const stepsMap = { natural: 2, moderate: 4, bright: 6 };
  const targetRank = Math.max(1, currentRank - stepsMap[input.desiredLevel]);

  // 2. 목표 셰이드 결정 (선호 계열 우선)
  const targetShade = findShadeByRank(targetRank, config.preferredSeries);

  // 3. 과도한 미백 검증
  const isOverWhitening = isOverWhiteningCheck(targetShade, input.personalColorSeason);

  // 4. 미백 방법 추천
  const shadeSteps = currentRank - targetRank;
  const methods = recommendMethods(shadeSteps);

  return {
    targetShade,
    maxSafeShade: config.maxBrightShade as VitaShade,
    preferredSeries: config.preferredSeries,
    shadeStepsNeeded: shadeSteps,
    estimatedMethod: methods,
    isOverWhitening: isOverWhitening.isOver,
    overWhiteningReason: isOverWhitening.reason,
    seasonHarmony: config.harmony,
  };
}

function isOverWhiteningCheck(target: VitaShade, season: PersonalColorSeason): {
  isOver: boolean;
  reason?: string;
} {
  const warmSeasons: PersonalColorSeason[] = ['spring', 'autumn'];

  // 웜톤에 0M1 목표
  if (warmSeasons.includes(season) && target === '0M1') {
    return {
      isOver: true,
      reason: '웜톤 피부에 차가운 블루 화이트는 부자연스러울 수 있습니다.',
    };
  }

  // 가을에 Bleached 셰이드
  if (season === 'autumn' && ['0M1', '0M2', '0M3'].includes(target)) {
    return {
      isOver: true,
      reason: '따뜻한 피부톤에 과도한 미백은 부자연스러울 수 있습니다.',
    };
  }

  return { isOver: false };
}
```

**성공 기준**:
- [ ] 4시즌 모두 적절한 셰이드 추천
- [ ] 웜톤(spring/autumn)에 0M1 목표 시 isOverWhitening = true
- [ ] 쿨톤(summer/winter)에 0M1 허용
- [ ] shadeSteps 계산 정확성
- [ ] typecheck 통과

**테스트 케이스**:
| TC ID | 입력 | 예상 출력 | 설명 |
|-------|------|----------|------|
| OH16-TC1 | A3, spring, moderate | A1 또는 B2, isOver=false | 웜톤 적절 |
| OH16-TC2 | A3, spring, bright→0M1 | isOverWhitening=true | 웜톤 과미백 |
| OH16-TC3 | A3, winter, bright | 0M1 허용, isOver=false | 쿨톤 허용 |
| OH16-TC4 | A3, autumn, bright | isOverWhitening=true | 가을 과미백 |

**파일 배치**:
| 파일 경로 | 변경 유형 | 설명 |
|-----------|----------|------|
| `apps/web/lib/oral-health/whitening-goal-calculator.ts` | 신규 | 미백 목표 계산 |
| `apps/web/lib/oral-health/internal/season-shade-map.ts` | 신규 | 시즌-셰이드 매핑 |
| `apps/web/tests/lib/oral-health/whitening-goal-calculator.test.ts` | 신규 | 미백 테스트 |

---

#### OH-1.7: N-1 영양 연동

| 항목 | 값 |
|------|-----|
| 소요시간 | 1h |
| 의존성 | OH-1.5 (잇몸 건강 결과) |
| 병렬 가능 | 예 |
| 파일 위치 | `apps/web/lib/oral-health/nutrition-integrator.ts` |

**입력 스펙**:
```typescript
interface OralNutritionInput {
  gumHealth: GumHealthResult;
  toothColor?: ToothColorResult;
  oralProfile: UserOralProfile;
}
```

**출력 스펙**:
```typescript
interface N1OralNutritionRecommendation {
  nutrient: string;                // 영양소명
  dailyDose: string;              // 권장 섭취량
  reason: string;                 // 권장 이유
  priority: 'essential' | 'recommended' | 'optional';
  sourceOralCondition: string;    // 연관 구강 상태
}

interface OralNutritionOutput {
  integrationData: OH1ToN1IntegrationData;
  recommendations: N1OralNutritionRecommendation[];
}

interface OH1ToN1IntegrationData {
  gumHealth: {
    status: GumHealthStatus;
    inflammationScore: number;
    aStarAverage: number;
  };
  inflammationScore: number;
  toothStaining: 'none' | 'mild' | 'moderate' | 'severe';
  cavityRisk: 'low' | 'medium' | 'high';
  periodontalStatus: 'healthy' | 'gingivitis' | 'periodontitis';
  confidence: number;
}
```

**매핑 규칙**:
```typescript
const ORAL_NUTRITION_MAPPING = {
  // 잇몸 상태별 영양소
  gumHealth: {
    mild_gingivitis: [
      { nutrient: '비타민 C', dailyDose: '500mg/일', reason: '콜라겐 합성, 잇몸 치유', priority: 'essential' },
    ],
    moderate_gingivitis: [
      { nutrient: '비타민 C', dailyDose: '1000mg/일', reason: '항산화, 조직 재생', priority: 'essential' },
      { nutrient: 'CoQ10', dailyDose: '100mg/일', reason: '잇몸 조직 에너지 대사', priority: 'recommended' },
    ],
    severe_inflammation: [
      { nutrient: '비타민 C', dailyDose: '1000mg/일', priority: 'essential' },
      { nutrient: '오메가-3', dailyDose: '1g/일', reason: '항염증 작용', priority: 'essential' },
      { nutrient: 'CoQ10', dailyDose: '100mg/일', priority: 'essential' },
    ],
  },
  // 염증 점수별
  inflammationScore: {
    high: [  // > 50
      { nutrient: '오메가-3', dailyDose: '1g/일', reason: '항염증 작용', priority: 'essential' },
    ],
  },
  // 충치 위험도별
  cavityRisk: {
    high: [
      { nutrient: '칼슘', dailyDose: '1000mg/일', reason: '치아 재광화', priority: 'essential' },
      { nutrient: '비타민 D', dailyDose: '2000IU/일', reason: '칼슘 흡수 촉진', priority: 'essential' },
    ],
  },
};
```

**성공 기준**:
- [ ] 잇몸 상태별 적절한 영양소 추천
- [ ] 염증 점수 > 50 시 오메가-3 필수 추천
- [ ] 충치 위험 high 시 칼슘+비타민D 필수 추천
- [ ] N-1 통합 데이터 형식 준수
- [ ] typecheck 통과

**테스트 케이스**:
| TC ID | 입력 | 예상 출력 | 설명 |
|-------|------|----------|------|
| OH17-TC1 | mild_gingivitis | 비타민 C 500mg | 경미한 염증 |
| OH17-TC2 | inflammationScore=60 | 오메가-3 포함 | 높은 염증 |
| OH17-TC3 | cavityRisk=high | 칼슘+비타민D | 충치 고위험 |

**파일 배치**:
| 파일 경로 | 변경 유형 | 설명 |
|-----------|----------|------|
| `apps/web/lib/oral-health/nutrition-integrator.ts` | 신규 | N-1 연동 로직 |
| `apps/web/lib/shared/integration-types.ts` | 수정 | OH1-N1 타입 추가 |
| `apps/web/tests/lib/oral-health/nutrition-integrator.test.ts` | 신규 | 연동 테스트 |

---

#### OH-1.8: API 라우트 + Mock Fallback

| 항목 | 값 |
|------|-----|
| 소요시간 | 2h |
| 의존성 | OH-1.1~1.7 전체 |
| 병렬 가능 | 아니오 |
| 파일 위치 | `apps/web/app/api/analyze/oral-health/route.ts`, `apps/web/lib/mock/oral-health.ts` |

**입력 스펙**:
```typescript
// POST /api/analyze/oral-health

const requestSchema = z.object({
  imageBase64: z.string().min(1),
  analysisType: z.enum(['tooth_color', 'gum_health', 'full']),
  personalColorSeason: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
  oralProfile: z.object({
    sensitivity: z.enum(['none', 'mild', 'severe']),
    gumHealth: z.enum(['healthy', 'gingivitis', 'periodontitis']),
    cavityRisk: z.enum(['low', 'medium', 'high']),
    calculus: z.enum(['none', 'mild', 'heavy']),
    halitosis: z.boolean(),
    dentalWork: z.array(z.enum(['braces', 'implant', 'bridge', 'crown', 'veneer'])),
  }).optional(),
});
```

**출력 스펙**:
```typescript
interface OralHealthApiResponse {
  success: boolean;
  data: OralHealthAssessment;
  disclaimer: string;         // 필수 면책 조항
  usedFallback: boolean;     // Mock 사용 여부
  processingTime: number;    // 처리 시간 (ms)
}
```

**Mock Fallback 데이터**:
```typescript
// lib/mock/oral-health.ts
export const ORAL_FALLBACK_MOCK: OralHealthAssessment = {
  id: 'mock_oral_001',
  clerk_user_id: '',
  toothColor: {
    measuredLab: { L: 67, a: 2.5, b: 19 },
    matchedShade: 'A2',
    deltaE: 1.2,
    confidence: 75,
    brightnessRank: 5,
  },
  gumHealth: {
    healthStatus: 'healthy',
    inflammationScore: 20,
    metrics: { aStarMean: 8, aStarStd: 2, rednessPercentage: 10, swellingIndicator: 0 },
    recommendations: ['현재 구강 관리를 유지하세요.'],
    needsDentalVisit: false,
  },
  hygieneScore: 78,
  recommendations: ['하루 2회 이상 칫솔질을 권장합니다.', '치실 사용을 습관화하세요.'],
  created_at: new Date().toISOString(),
};

export function generateMockOralHealthResult(
  input: OralHealthRequest
): OralHealthAssessment {
  return {
    ...ORAL_FALLBACK_MOCK,
    id: `mock_oral_${Date.now()}`,
  };
}
```

**API 라우트 구현**:
```typescript
// app/api/analyze/oral-health/route.ts
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // 2. Rate Limit 확인
    const { success: rateLimitOk } = await checkRateLimit(userId);
    if (!rateLimitOk) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMIT_ERROR', message: '요청 한도 초과' } },
        { status: 429 }
      );
    }

    // 3. 입력 검증
    const body = await request.json();
    const validated = requestSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validated.error.message } },
        { status: 400 }
      );
    }

    // 4. 분석 실행 (with fallback)
    const { result, usedFallback } = await analyzeWithFallback(
      () => analyzeOralHealth(validated.data, userId),
      () => generateMockOralHealthResult(validated.data),
      { timeout: 3000, maxRetries: 2 }
    );

    // 5. 감사 로그
    await logAudit(userId, 'oral_health_analysis', { usedFallback });

    // 6. 성공 응답
    return NextResponse.json({
      success: true,
      data: result,
      disclaimer: MEDICAL_DISCLAIMER.legal.ko,
      usedFallback,
      processingTime: Date.now() - startTime,
    });

  } catch (error) {
    console.error('[API] POST /analyze/oral-health error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

**성공 기준**:
- [ ] 인증 없이 요청 시 401 반환
- [ ] Rate Limit 초과 시 429 반환
- [ ] 유효하지 않은 입력 시 400 반환
- [ ] 타임아웃(3초) 초과 시 Mock 반환, usedFallback=true
- [ ] 정상 요청 시 200 + 결과
- [ ] disclaimer 필드 항상 포함
- [ ] typecheck 통과

**테스트 케이스**:
| TC ID | 입력 | 예상 출력 | 설명 |
|-------|------|----------|------|
| OH18-TC1 | 유효한 요청 | 200 + 결과 | 정상 |
| OH18-TC2 | 인증 없음 | 401 | 인증 필수 |
| OH18-TC3 | Rate Limit 초과 | 429 | 요청 제한 |
| OH18-TC4 | 유효하지 않은 이미지 | 400 | 입력 검증 |
| OH18-TC5 | 타임아웃 시뮬레이션 | usedFallback=true | Mock 전환 |

**파일 배치**:
| 파일 경로 | 변경 유형 | 설명 |
|-----------|----------|------|
| `apps/web/app/api/analyze/oral-health/route.ts` | 신규 | API 라우트 |
| `apps/web/lib/mock/oral-health.ts` | 신규 | Mock 데이터 |
| `apps/web/tests/api/analyze/oral-health.test.ts` | 신규 | API 테스트 |

---

#### OH-1.9: 테스트 작성

| 항목 | 값 |
|------|-----|
| 소요시간 | 3h |
| 의존성 | OH-1.1~1.8 전체 |
| 병렬 가능 | 아니오 |
| 파일 위치 | `apps/web/tests/lib/oral-health/` |

**테스트 파일 목록**:
```
tests/lib/oral-health/
├── ciede2000.test.ts           # OH-1.2 색차 테스트
├── vita-database.test.ts       # OH-1.3 셰이드 매칭 테스트
├── tooth-segmenter.test.ts     # OH-1.4 세그멘테이션 테스트
├── gum-health-analyzer.test.ts # OH-1.5 잇몸 분석 테스트
├── whitening-goal-calculator.test.ts  # OH-1.6 미백 테스트
├── nutrition-integrator.test.ts       # OH-1.7 N-1 연동 테스트
└── integration.test.ts         # 전체 통합 테스트

tests/api/analyze/
└── oral-health.test.ts         # OH-1.8 API 테스트
```

**테스트 커버리지 목표**:
| 영역 | 목표 커버리지 |
|------|-------------|
| lib/oral-health/ | 90% |
| types/oral-health.ts | 100% |
| api/analyze/oral-health | 85% |

**성공 기준**:
- [ ] 모든 단위 테스트 통과
- [ ] 통합 테스트 E2E 플로우 검증
- [ ] 커버리지 목표 달성
- [ ] CI 파이프라인 통과
- [ ] `npm run test` 전체 통과

**파일 배치**:
| 파일 경로 | 변경 유형 | 설명 |
|-----------|----------|------|
| `apps/web/tests/lib/oral-health/*.test.ts` | 신규 | 단위 테스트 |
| `apps/web/tests/api/analyze/oral-health.test.ts` | 신규 | API 테스트 |

---

### 10.5 구현 순서

```
Phase 1: 기반 (병렬, 3h)
├── OH-1.1 타입/스키마 정의 (1h)
└── OH-1.2 RGB→Lab + CIEDE2000 (2h) [병렬 가능]

Phase 2: 색상 분석 (1.5h)
└── OH-1.3 VITA 16-shade 매칭 (1.5h) [OH-1.2 의존]

Phase 3: 영역 분석 (병렬, 4h)
├── OH-1.4 치아 영역 세그멘테이션 (2h)
└── OH-1.5 잇몸 Lab 분석 + 염증 점수 (2h) [OH-1.2, OH-1.4 의존]

Phase 4: 연동 (병렬, 2.5h)
├── OH-1.6 미백 목표 + PC-1 연동 (1.5h) [OH-1.3 의존]
└── OH-1.7 N-1 영양 연동 (1h) [OH-1.5 의존, 병렬 가능]

Phase 5: 통합 (2h)
└── OH-1.8 API 라우트 + Mock Fallback (2h) [OH-1.1~1.7 의존]

Phase 6: 검증 (3h)
└── OH-1.9 테스트 작성 (3h) [전체 의존]

총 소요 시간: 16h (직렬), 10h (병렬 최적화)
```

---

## 11. 테스트 케이스

### 11.1 CIEDE2000 검증

```typescript
// tests/lib/oral-health/ciede2000.test.ts
import { calculateCIEDE2000 } from '@/lib/oral-health/internal/ciede2000';

describe('CIEDE2000', () => {
  it('should return 0 for identical colors', () => {
    const lab = { L: 50, a: 10, b: 20 };
    expect(calculateCIEDE2000(lab, lab)).toBe(0);
  });

  it('should match B1 shade within acceptable range', () => {
    const measured = { L: 71, a: 1.5, b: 15 };
    const reference = { L: 71, a: 1.5, b: 15 };
    const deltaE = calculateCIEDE2000(measured, reference);
    expect(deltaE).toBeLessThan(2.7);  // 임상 허용 범위
  });

  // ISO/CIE 11664-6:2014 테스트 데이터
  it('should match ISO standard test case 1', () => {
    const lab1 = { L: 50.0, a: 2.6772, b: -79.7751 };
    const lab2 = { L: 50.0, a: 0.0, b: -82.7485 };
    const deltaE = calculateCIEDE2000(lab1, lab2);
    expect(deltaE).toBeCloseTo(2.0425, 3);
  });
});
```

### 11.2 셰이드 매칭 테스트

```typescript
// tests/lib/oral-health/tooth-color-analyzer.test.ts
import { findBestShadeMatch } from '@/lib/oral-health/internal/vita-database';

describe('findBestShadeMatch', () => {
  it('should match B1 for bright tooth', () => {
    const measured = { L: 71, a: 1.5, b: 15 };
    const result = findBestShadeMatch(measured);
    expect(result.shade).toBe('B1');
    expect(result.deltaE).toBeLessThan(1.0);
  });

  it('should match A3 for average tooth', () => {
    const measured = { L: 63, a: 3.5, b: 21 };
    const result = findBestShadeMatch(measured);
    expect(result.shade).toBe('A3');
    expect(result.deltaE).toBeLessThan(2.7);
  });

  it('should match dark shade for stained tooth', () => {
    const measured = { L: 48, a: 0.5, b: 11 };
    const result = findBestShadeMatch(measured);
    expect(result.shade).toBe('C4');
  });
});
```

### 11.3 과도한 미백 경고 테스트

```typescript
// tests/lib/oral-health/whitening-goal-calculator.test.ts
import { isOverWhitening } from '@/lib/oral-health/internal/season-shade-map';

describe('isOverWhitening', () => {
  it('should warn for warm season targeting 0M1', () => {
    const result = isOverWhitening('0M1', 'spring');
    expect(result.isOver).toBe(true);
    expect(result.reason).toContain('웜톤');
  });

  it('should warn for autumn targeting bleached shades', () => {
    const result = isOverWhitening('0M2', 'autumn');
    expect(result.isOver).toBe(true);
  });

  it('should allow bright shade for winter', () => {
    const result = isOverWhitening('0M1', 'winter');
    expect(result.isOver).toBe(false);
  });
});
```

### 11.4 제품 추천 테스트

```typescript
// tests/lib/oral-health/product-recommender.test.ts
import { recommendOralProducts } from '@/lib/oral-health/product-recommender';

describe('recommendOralProducts', () => {
  it('should recommend sensitivity products for sensitive users', () => {
    const profile = {
      sensitivity: 'severe' as const,
      gumHealth: 'healthy' as const,
      cavityRisk: 'low' as const,
      calculus: 'none' as const,
      halitosis: false,
      dentalWork: [],
      dailyBrushingCount: 2,
      usesFloss: true,
      usesInterdental: false,
      usesWaterFlosser: false,
    };

    const result = recommendOralProducts(profile, {
      budgetLevel: 'mid',
      preferNatural: false,
      alcoholFree: false,
    });

    expect(result.keyIngredients).toContain('n-HAp');
    expect(result.keyIngredients).toContain('Potassium Nitrate');
    expect(result.avoidIngredients).toContain('High H2O2');
  });

  it('should recommend water flosser for braces', () => {
    const profile = {
      sensitivity: 'none' as const,
      gumHealth: 'healthy' as const,
      cavityRisk: 'medium' as const,
      calculus: 'none' as const,
      halitosis: false,
      dentalWork: ['braces' as const],
      dailyBrushingCount: 2,
      usesFloss: false,
      usesInterdental: false,
      usesWaterFlosser: false,
    };

    const result = recommendOralProducts(profile, {
      budgetLevel: 'mid',
      preferNatural: false,
      alcoholFree: false,
    });

    const hasWaterFlosser = result.interdental.primary.some(
      p => p.type === 'water_flosser'
    );
    expect(hasWaterFlosser).toBe(true);
  });
});
```

### 11.5 원자별 테스트 케이스 테이블

> 각 원자(ATOM)별 정상/경계/에러 케이스 정의

#### OH-1.x 치아 색상 분석

| 원자 ID | 테스트 유형 | 입력 | 기대 결과 | 검증 포인트 |
|---------|-----------|------|----------|------------|
| **OH-1.1** | 정상 | RGB(255,255,255) | L=100, a≈0, b≈0 | 흰색 변환 정확도 |
| OH-1.1 | 정상 | RGB(200,180,160) | L≈75, a>0, b>0 | 치아 색상 변환 |
| OH-1.1 | 경계 | RGB(0,0,0) | L=0 | 검정색 변환 |
| OH-1.1 | 에러 | RGB(-1,0,0) | Error 또는 clamping | 유효하지 않은 값 처리 |
| **OH-1.2** | 정상 | 동일 Lab 두 개 | deltaE=0 | CIEDE2000 기본 검증 |
| OH-1.2 | 정상 | ISO 표준 테스트 데이터 | deltaE≈2.04 | ISO 11664-6 준수 |
| OH-1.2 | 경계 | L=0 vs L=100 | deltaE>90 | 극단값 처리 |
| **OH-1.3** | 정상 | - | 16개 VITA 셰이드 | DB 완전성 |
| OH-1.3 | 정상 | - | 각 셰이드 Lab 존재 | 데이터 무결성 |
| **OH-1.4** | 정상 | L=71, a=1.5, b=15 | B1, deltaE<1.0 | 밝은 치아 매칭 |
| OH-1.4 | 정상 | L=63, a=3.5, b=21 | A3, deltaE<2.7 | 중간 치아 매칭 |
| OH-1.4 | 경계 | L=55, a=2, b=18 | A3 or A3.5 | 경계값 매칭 |
| **OH-1.5** | 정상 | 치아 이미지 | 픽셀 배열 | 영역 추출 |
| OH-1.5 | 에러 | 치아 없는 이미지 | Error 또는 빈 배열 | 감지 실패 처리 |
| **OH-1.6** | 정상 | 표준 이미지 | ToothColorResult 전체 | E2E 검증 |
| OH-1.6 | 에러 | 빈 이미지 | Error | 입력 검증 |

#### OH-2.x 잇몸 건강 분석

| 원자 ID | 테스트 유형 | 입력 | 기대 결과 | 검증 포인트 |
|---------|-----------|------|----------|------------|
| **OH-2.1** | 정상 | 치아+잇몸 이미지 | 잇몸 픽셀 분리 | 세그멘테이션 정확도 |
| OH-2.1 | 에러 | 잇몸 없는 이미지 | 빈 결과 또는 Error | 실패 처리 |
| **OH-2.2** | 정상 | a*<8 픽셀 배열 | healthy | 정상 잇몸 감지 |
| OH-2.2 | 정상 | a*=12-18 픽셀 | moderate_gingivitis | 중등도 염증 감지 |
| OH-2.2 | 경계 | a*=8 (경계값) | healthy 또는 mild | 경계값 분류 |
| **OH-2.3** | 정상 | inflammationScore=20 | healthy | 점수→상태 변환 |
| OH-2.3 | 정상 | inflammationScore=70 | moderate_gingivitis | 중등도 분류 |
| OH-2.3 | 정상 | inflammationScore=90 | severe_inflammation, needsDentalVisit=true | 심각도+치과 권고 |
| **OH-2.4** | 정상 | 표준 잇몸 이미지 | GumHealthResult 전체 | E2E 검증 |

#### OH-3.x 미백 목표 계산

| 원자 ID | 테스트 유형 | 입력 | 기대 결과 | 검증 포인트 |
|---------|-----------|------|----------|------------|
| **OH-3.1** | 정상 | - | 4시즌 매핑 존재 | 데이터 완전성 |
| **OH-3.2** | 정상 | 0M1 + spring | isOver=true | 웜톤 과미백 경고 |
| OH-3.2 | 정상 | 0M1 + winter | isOver=false | 쿨톤 허용 |
| OH-3.2 | 경계 | B1 + summer | 경계 판정 | 경계 셰이드 처리 |
| **OH-3.3** | 정상 | A3 → B1 목표, spring | 타겟+방법 반환 | 전체 플로우 |
| OH-3.3 | 정상 | A3 → 0M1 목표, autumn | isOverWhitening=true | 과미백 경고 |

#### OH-4.x 제품 추천

| 원자 ID | 테스트 유형 | 입력 | 기대 결과 | 검증 포인트 |
|---------|-----------|------|----------|------------|
| **OH-4.1** | 정상 | sensitivity=severe | n-HAp, Potassium Nitrate | 성분 매칭 |
| OH-4.1 | 정상 | gingivitis=true | CPC, Chlorhexidine | 잇몸 성분 매칭 |
| **OH-4.2** | 정상 | 제품+성분 일치 | matchScore>80 | 점수 계산 |
| OH-4.2 | 정상 | 제품+금기 성분 | matchScore<30 | 금기 페널티 |
| **OH-4.3** | 정상 | 민감성 프로필 | 민감성 치약 추천 | 제품 추천 정확도 |
| OH-4.3 | 정상 | 교정기 착용자 | 워터플로서 추천 | 특수 상황 처리 |

#### OH-5.x 통합/UI

| 원자 ID | 테스트 유형 | 입력 | 기대 결과 | 검증 포인트 |
|---------|-----------|------|----------|------------|
| **OH-5.1** | 정상 | 유효한 이미지 | 200 + 결과 | API 성공 |
| OH-5.1 | 에러 | 인증 없음 | 401 | 인증 검증 |
| OH-5.1 | 에러 | Rate limit 초과 | 429 | Rate limit |
| OH-5.1 | 에러 | 유효하지 않은 이미지 | 400 | 입력 검증 |
| **OH-5.2** | 정상 | 분석 결과 | 렌더링 성공 | UI 렌더링 |
| **OH-5.3** | 정상 | 추천 결과 | 제품 카드 표시 | UI 렌더링 |

#### OH-6.x 테스트

| 원자 ID | 테스트 유형 | 입력 | 기대 결과 | 검증 포인트 |
|---------|-----------|------|----------|------------|
| **OH-6.1** | - | OH-1~4 함수들 | 모든 단위 테스트 통과 | 커버리지 >80% |
| **OH-6.2** | - | 전체 플로우 | E2E 테스트 통과 | 통합 검증 |

---

## 12. 검증 체크리스트

### 12.1 P7 워크플로우 준수

- [x] 리서치 완료: OH-1-BUNDLE, OH-1-DAILY-CARE
- [x] 원리 문서화: [docs/principles/oral-health.md](../principles/oral-health.md)
- [x] ADR 작성: [ADR-046-oh1-oral-health-analysis.md](../adr/ADR-046-oh1-oral-health-analysis.md)
- [x] 스펙 작성: 현재 문서

### 12.2 품질 게이트

| Gate | 항목 | 통과 기준 |
|------|------|----------|
| G0 | 필요성 | 구강건강-전신건강 연결, 퍼스널컬러 연계 |
| G1 | 궁극의 형태 | 70% 목표 명시 |
| G2 | 원리 문서 | [oral-health.md](../principles/oral-health.md) 존재 |
| G3 | 원자 분해 | 21개 원자, 각 2시간 이내 |
| G4 | 단순화 | 규칙 기반 추천 (ML 제외) |
| G5 | 테스트 | 단위/통합 테스트 포함 |
| G6 | 워크플로우 | 리서치→원리→스펙 순서 준수 |
| G7 | 모듈 경계 | index.ts Barrel Export |

### 12.3 의료 준수

- [x] 면책 조항 정의
- [x] AI 분석 한계 명시
- [x] 치과 방문 권고 로직 포함
- [x] 진단 대체 불가 명시

---

## 13. 관련 문서

### 13.1 원리 문서 (P2: 원리 우선)

- [oral-health.md](../principles/oral-health.md) - 구강 건강 원리, 치아 색상 분석
- [color-science.md](../principles/color-science.md) - 색채학, CIEDE2000 색차 공식
- [image-processing.md](../principles/image-processing.md) - 이미지 품질 검증

### 13.2 ADR (기술 결정)

- [ADR-046: OH-1 구강건강 분석 모듈](../adr/ADR-046-oh1-oral-health-analysis.md) - **본 모듈 아키텍처 결정**
- [ADR-001: Core Image Engine](../adr/ADR-001-core-image-engine.md) - 이미지 분석 기반
- [ADR-003: AI 모델 선택](../adr/ADR-003-ai-model-selection.md) - Gemini Flash 선택
- [ADR-007: Mock Fallback 전략](../adr/ADR-007-mock-fallback-strategy.md) - AI 실패 시 Mock 전환
- [ADR-010: AI 파이프라인 아키텍처](../adr/ADR-010-ai-pipeline.md) - 프롬프트 분리 패턴
- [ADR-021: 엣지 케이스 및 폴백 전략](../adr/ADR-021-edge-cases-fallback.md) - Mock 데이터 폴백

### 13.4 리서치 번들

- `docs/research/bundles/OH-1-BUNDLE.md`
- `docs/research/claude-ai-research/OH-1-DAILY-CARE.md`

### 13.5 학술 참고

- ISO/CIE 11664-6:2014 (CIEDE2000)
- VITA Zahnfabrik Shade Guide
- Cochrane Database (칫솔질 기법, 미백 효과)

### 13.6 관련 스펙

- [SDD-PC-1](./SDD-PERSONAL-COLOR-v2.md) - 퍼스널컬러 연계
- [SDD-CIE-1](./SDD-PHASE-E-SKIN-ZOOM.md) - 이미지 품질 검증

---

**Version**: 1.5 | **Created**: 2026-01-21 | **Updated**: 2026-01-24 | **Status**: Complete
**Author**: Claude Code
**Reviewers**: (대기 중)
**변경 이력**:
- v1.5 (2026-01-24): **테스트 케이스 상세화**: Section 14-17 추가 - 정밀 테스트 케이스(TC-ID, Input, Expected Value ±tolerance), Tooth/Gum Segmentation 부분 감지 핸들링, Graceful Fallback 전략, 에러 핸들링 확장
- v1.4 (2026-01-24): **P3 원자 분해 완성 (100점)**: H-1 형식에 맞게 9개 ATOM 상세 정의, TypeScript 입출력 스펙, 성공 기준 체크리스트, 알고리즘 상세, 테스트 케이스 완비
- v1.3 (2026-01-23): **100% 완성**: Status: Complete 설정, 검증 완료 체크리스트 확인
- v1.2 (2026-01-23): **필드명 표준화** `clerkUserId` → `clerk_user_id` (snake_case), **원자별 테스트 케이스 테이블** 추가 (21개 원자 각각에 정상/경계/에러 케이스 정의)
- v1.1 (2026-01-23): P3 점수 35점 추가, ADR-046 참조 추가, 핵심 원자 6개 Quick Reference 추가
- v1.0 (2026-01-21): 초기 버전

---

## 14. 상세 테스트 케이스 (Detailed Test Cases)

> P3 원자 분해 기준, 각 ATOM별 TC-ID, 입력, Expected Value (±tolerance) 명시

### 14.1 VITA 셰이드 색차 계산 테스트 (CIEDE2000)

| TC-ID | 테스트 시나리오 | Input Lab (L*, a*, b*) | Reference Shade | Expected ΔE | Tolerance | 판정 |
|-------|----------------|----------------------|-----------------|-------------|-----------|------|
| OH-DE-001 | 완벽 매칭 (A1) | L=78.3, a=-0.8, b=14.2 | A1 | 0.0 | ±0.5 | 정확히 일치 |
| OH-DE-002 | 매우 가까운 매칭 | L=77.5, a=-0.5, b=15.0 | A1 | 1.2 | ±0.3 | 임상 허용 |
| OH-DE-003 | 임상 허용 한계 | L=76.0, a=0.2, b=16.5 | A1 | 2.7 | ±0.5 | 경계 |
| OH-DE-004 | 미스매칭 (눈에 띔) | L=70.0, a=1.5, b=20.0 | A1 | 5.8 | ±0.5 | 불일치 |
| OH-DE-005 | A2 셰이드 매칭 | L=73.6, a=-0.2, b=17.5 | A2 | 0.8 | ±0.3 | 일치 |
| OH-DE-006 | B1 셰이드 (가장 밝음) | L=82.1, a=-1.5, b=12.0 | B1 | 1.0 | ±0.3 | 일치 |
| OH-DE-007 | C4 셰이드 (가장 어두움) | L=58.2, a=3.2, b=28.5 | C4 | 1.5 | ±0.5 | 일치 |
| OH-DE-008 | 계열 간 비교 (A vs B) | L=78.0, a=-0.5, b=14.0 | A1→B1 | 3.5 | ±0.5 | 차이 감지 |

### 14.2 치아 색상 분석 테스트

| TC-ID | 테스트 시나리오 | Input (L*, a*, b*) | Expected Shade | Expected Rank | Confidence | 비고 |
|-------|----------------|-------------------|----------------|---------------|------------|------|
| OH-TC-001 | 밝은 치아 (젊은 성인) | L=78, a=-0.8, b=14 | A1 | 2 | ≥85% | 정상 |
| OH-TC-002 | 중간 밝기 (평균) | L=73, a=0.5, b=18 | A2 | 5 | ≥80% | 정상 |
| OH-TC-003 | 어두운 치아 (착색) | L=62, a=2.0, b=24 | A3.5 | 12 | ≥75% | 착색 |
| OH-TC-004 | 회색 기미 (D계열) | L=70, a=-0.2, b=10 | D2 | 4 | ≥75% | D계열 |
| OH-TC-005 | 노란 기미 (B계열) | L=68, a=0.0, b=22 | B3 | 11 | ≥75% | B계열 |
| OH-TC-006 | 매우 어두운 | L=55, a=4.0, b=30 | C4 | 16 | ≥70% | 최하위 |
| OH-TC-007 | 미백 치아 | L=85, a=-2.0, b=8 | 0M2 | - | ≥80% | Bleached |

### 14.3 잇몸 건강 분석 테스트

#### 14.3.1 a* 값 기반 분류 테스트

| TC-ID | 테스트 시나리오 | Input a* Mean | Input a* Std | Redness % | Expected Status | Expected Score | Tolerance |
|-------|----------------|--------------|--------------|-----------|-----------------|----------------|-----------|
| OH-GH-001 | 건강한 잇몸 | 7.5 | 1.5 | 8% | healthy | 18 | ±5 |
| OH-GH-002 | 경미한 염증 | 12.0 | 2.5 | 20% | mild_gingivitis | 38 | ±5 |
| OH-GH-003 | 중등도 염증 | 17.0 | 3.5 | 40% | moderate_gingivitis | 62 | ±5 |
| OH-GH-004 | 심한 염증 | 23.0 | 5.0 | 65% | severe_inflammation | 85 | ±7 |
| OH-GH-005 | 경계값 (건강/경미) | 10.0 | 2.0 | 15% | mild_gingivitis | 25 | ±3 |
| OH-GH-006 | 경계값 (경미/중등도) | 15.0 | 3.0 | 30% | moderate_gingivitis | 50 | ±3 |
| OH-GH-007 | 경계값 (중등도/심함) | 20.0 | 4.0 | 55% | severe_inflammation | 75 | ±3 |
| OH-GH-008 | 창백한 잇몸 (저 a*) | 4.0 | 1.0 | 2% | healthy (pale) | 10 | ±5 |

#### 14.3.2 치과 방문 권고 테스트

| TC-ID | 입력 상태 | 기대 needsDentalVisit | 비고 |
|-------|----------|---------------------|------|
| OH-GH-D01 | healthy | false | 방문 불필요 |
| OH-GH-D02 | mild_gingivitis | false | 자가 관리 가능 |
| OH-GH-D03 | moderate_gingivitis | true | 방문 권장 |
| OH-GH-D04 | severe_inflammation | true | 방문 필수 |
| OH-GH-D05 | inflammationScore > 60 | true | 점수 기반 |

### 14.4 미백 목표 테스트 (PC-1 연동)

| TC-ID | 테스트 시나리오 | Current Shade | Season | Level | Expected Target | isOverWhitening | 비고 |
|-------|----------------|--------------|--------|-------|-----------------|-----------------|------|
| OH-WG-001 | 봄 웜톤 moderate | A3 | spring | moderate | A1 또는 B2 | false | 적절 |
| OH-WG-002 | 봄 웜톤 bright | A3 | spring | bright | B1 | true (0M1 시도 시) | 과미백 경고 |
| OH-WG-003 | 여름 쿨톤 bright | A3 | summer | bright | 0M1 허용 | false | 쿨톤 허용 |
| OH-WG-004 | 가을 웜톤 bright | A3 | autumn | bright | A1 | true | 가을 제한 |
| OH-WG-005 | 겨울 쿨톤 bright | A3 | winter | bright | 0M1 | false | 쿨톤 허용 |
| OH-WG-006 | 이미 밝은 치아 | B1 | spring | natural | B1 (유지) | false | 미백 불필요 |
| OH-WG-007 | 미백 한계 초과 시도 | A4 | autumn | bright | A2 (제한) | true | 단계 제한 |

### 14.5 N-1 영양 연동 테스트

| TC-ID | 입력 상태 | 기대 영양소 | 기대 용량 | Priority |
|-------|----------|-----------|----------|----------|
| OH-N1-001 | mild_gingivitis | 비타민 C | 500mg/일 | essential |
| OH-N1-002 | moderate_gingivitis | 비타민 C, CoQ10 | 1000mg, 100mg | essential, recommended |
| OH-N1-003 | severe_inflammation | 비타민 C, 오메가-3, CoQ10 | 1000mg, 1g, 100mg | all essential |
| OH-N1-004 | inflammationScore > 50 | 오메가-3 포함 | 1g/일 | essential |
| OH-N1-005 | cavityRisk = high | 칼슘, 비타민 D | 1000mg, 2000IU | essential |
| OH-N1-006 | healthy 상태 | 일반 권장 | - | optional |

### 14.6 Edge Cases 테스트

| TC-ID | 테스트 시나리오 | 입력 | 기대 동작 |
|-------|----------------|------|----------|
| OH-EDGE-001 | 이미지 null | imageBase64=null | INVALID_INPUT 에러 |
| OH-EDGE-002 | 이미지 빈 문자열 | imageBase64='' | INVALID_INPUT 에러 |
| OH-EDGE-003 | 치아 미감지 | teethCount=0 | TEETH_NOT_FOUND 에러 + 재촬영 안내 |
| OH-EDGE-004 | 잇몸 미감지 | gumPixels=[] | 잇몸 분석 Skip, 부분 결과 반환 |
| OH-EDGE-005 | 품질 낮은 이미지 | quality < 50 | IMAGE_QUALITY_POOR 에러 |
| OH-EDGE-006 | 부분 치아만 감지 | teethCount=3 | 부분 분석 + 경고 |
| OH-EDGE-007 | PC-1 없이 미백 목표 | personalColorSeason=null | 기본 추천 (4계절 평균) |
| OH-EDGE-008 | 비정상 Lab 값 | L > 100 또는 L < 0 | 클램핑 후 처리 |

---

## 15. Tooth/Gum 부분 감지 핸들링

> 치아 또는 잇몸이 부분적으로만 감지되는 경우의 처리 전략

### 15.1 감지 요구사항 정의

```typescript
// apps/web/lib/oral-health/detection-validation.ts

export const DETECTION_REQUIREMENTS = {
  toothColor: {
    minTeethVisible: 4,      // 최소 4개 치아 필요
    minVisibilityScore: 0.6, // 최소 visibility
    preferredTeeth: ['central_incisors', 'lateral_incisors'],  // 앞니 우선
  },
  gumHealth: {
    minGumAreaPercent: 10,   // 전체 이미지의 10% 이상 잇몸 영역
    minPixelCount: 1000,     // 최소 1000픽셀
    requiredRegions: ['upper', 'lower'],  // 상/하 잇몸 모두 권장
  },
  fullAnalysis: {
    minTeethVisible: 6,
    minGumAreaPercent: 15,
  },
};

export interface DetectionValidationResult {
  isValid: boolean;
  canAnalyze: {
    toothColor: boolean;
    gumHealth: boolean;
    fullAnalysis: boolean;
  };
  detectedElements: {
    teethCount: number;
    gumAreaPercent: number;
    hasUpperGum: boolean;
    hasLowerGum: boolean;
  };
  confidenceModifier: number;  // 0.5 ~ 1.0
  analysisScope: 'full' | 'partial' | 'insufficient';
  warnings: string[];
}
```

### 15.2 부분 감지 평가 함수

```typescript
// apps/web/lib/oral-health/detection-validation.ts (계속)

export function assessOralDetection(
  segmentResult: ToothSegmentResult
): DetectionValidationResult {
  const { teethCount, gumPixels, gumRegions } = segmentResult;

  // 잇몸 영역 비율 계산
  const totalPixels = segmentResult.imageWidth * segmentResult.imageHeight;
  const gumAreaPercent = (gumPixels?.length || 0) / totalPixels * 100;

  // 상/하 잇몸 감지 여부
  const hasUpperGum = gumRegions?.some(r => r.position === 'upper') ?? false;
  const hasLowerGum = gumRegions?.some(r => r.position === 'lower') ?? false;

  // 분석 가능 여부 판정
  const canToothColor = teethCount >= DETECTION_REQUIREMENTS.toothColor.minTeethVisible;
  const canGumHealth = gumAreaPercent >= DETECTION_REQUIREMENTS.gumHealth.minGumAreaPercent;
  const canFullAnalysis = teethCount >= DETECTION_REQUIREMENTS.fullAnalysis.minTeethVisible
    && gumAreaPercent >= DETECTION_REQUIREMENTS.fullAnalysis.minGumAreaPercent;

  // Confidence Modifier 계산
  let confidenceModifier = 1.0;
  if (teethCount < 6) confidenceModifier *= 0.8;
  if (gumAreaPercent < 15) confidenceModifier *= 0.85;
  if (!hasUpperGum || !hasLowerGum) confidenceModifier *= 0.9;

  // 분석 범위 결정
  let analysisScope: 'full' | 'partial' | 'insufficient' = 'insufficient';
  if (canFullAnalysis) {
    analysisScope = 'full';
  } else if (canToothColor || canGumHealth) {
    analysisScope = 'partial';
  }

  // 경고 메시지 생성
  const warnings: string[] = [];
  if (teethCount < 6) {
    warnings.push(`치아 ${teethCount}개만 감지되었습니다. 앞니가 잘 보이도록 촬영해주세요.`);
  }
  if (!hasUpperGum && !hasLowerGum) {
    warnings.push('잇몸이 감지되지 않았습니다. 입을 더 벌리고 촬영해주세요.');
  }
  if (gumAreaPercent < 10) {
    warnings.push('잇몸 영역이 작습니다. 잇몸 건강 분석이 제한됩니다.');
  }

  return {
    isValid: analysisScope !== 'insufficient',
    canAnalyze: {
      toothColor: canToothColor,
      gumHealth: canGumHealth,
      fullAnalysis: canFullAnalysis,
    },
    detectedElements: {
      teethCount,
      gumAreaPercent,
      hasUpperGum,
      hasLowerGum,
    },
    confidenceModifier,
    analysisScope,
    warnings,
  };
}
```

### 15.3 부분 감지 시나리오별 처리

| 시나리오 | 감지 상태 | 가능한 분석 | 사용자 메시지 |
|----------|----------|------------|--------------|
| 전체 감지 | teeth ≥ 6, gum ≥ 15% | 전체 분석 | - |
| 치아만 감지 | teeth ≥ 4, gum < 10% | 치아 색상만 | "잇몸이 충분히 보이지 않습니다" |
| 잇몸만 감지 | teeth < 4, gum ≥ 10% | 잇몸 건강만 | "치아가 충분히 보이지 않습니다" |
| 닫힌 입 | teeth < 4, gum < 10% | 분석 불가 | "입을 벌리고 다시 촬영해주세요" |
| 부분 치아 | teeth = 3~5 | 치아 색상 (낮은 신뢰도) | "더 많은 치아가 보이면 정확도가 높아집니다" |
| 상/하 잇몸 한쪽만 | 한쪽 잇몸만 | 부분 잇몸 분석 | "전체 잇몸 분석을 위해 상하 모두 보이게 촬영해주세요" |

### 15.4 부분 감지 테스트 케이스

| TC-ID | 시나리오 | 입력 (teeth, gumArea%) | 기대 결과 | confidenceModifier |
|-------|----------|----------------------|----------|-------------------|
| OH-PART-001 | 전체 감지 | teeth=8, gum=20% | analysisScope='full' | 1.0 |
| OH-PART-002 | 치아만 | teeth=6, gum=5% | toothColor=true, gumHealth=false | 0.85 |
| OH-PART-003 | 잇몸만 | teeth=2, gum=18% | toothColor=false, gumHealth=true | 0.80 |
| OH-PART-004 | 부분 치아 | teeth=4, gum=12% | partial 분석 | 0.72 |
| OH-PART-005 | 닫힌 입 | teeth=1, gum=3% | analysisScope='insufficient' | 0.0 |
| OH-PART-006 | 상 잇몸만 | teeth=6, gum=15%, upper only | partial | 0.9 |

---

## 16. Graceful Fallback 전략

### 16.1 실패 유형 정의

```typescript
// apps/web/lib/oral-health/error-types.ts

export type OralAnalysisErrorCode =
  | 'TEETH_NOT_FOUND'             // 치아 미감지
  | 'GUM_NOT_FOUND'               // 잇몸 미감지
  | 'INSUFFICIENT_DETECTION'      // 감지 부족
  | 'IMAGE_QUALITY_POOR'          // 이미지 품질 불량
  | 'INVALID_IMAGE_FORMAT'        // 이미지 형식 오류
  | 'SEGMENTATION_FAILED'         // 세그멘테이션 실패
  | 'LAB_CONVERSION_ERROR'        // Lab 변환 오류
  | 'VITA_MATCHING_ERROR'         // VITA 매칭 오류
  | 'AI_ANALYSIS_TIMEOUT'         // AI 타임아웃
  | 'AI_ANALYSIS_ERROR'           // AI 분석 오류
  | 'PC1_INTEGRATION_ERROR'       // PC-1 연동 오류
  | 'N1_INTEGRATION_ERROR'        // N-1 연동 오류
  | 'RATE_LIMIT_EXCEEDED'         // 요청 한도 초과
  | 'PROCESSING_ERROR';           // 처리 중 오류

export interface OralAnalysisError {
  code: OralAnalysisErrorCode;
  message: string;
  userMessage: string;
  retryable: boolean;
  suggestedAction: 'retry' | 'retake' | 'wait' | 'contact_support';
  partialResultAvailable?: boolean;
}

export const ERROR_DEFINITIONS: Record<OralAnalysisErrorCode, Omit<OralAnalysisError, 'code'>> = {
  TEETH_NOT_FOUND: {
    message: 'No teeth detected in the image',
    userMessage: '치아가 감지되지 않았습니다. 입을 벌리고 앞니가 보이도록 촬영해주세요.',
    retryable: true,
    suggestedAction: 'retake',
  },
  GUM_NOT_FOUND: {
    message: 'No gum tissue detected',
    userMessage: '잇몸이 감지되지 않았습니다. 잇몸이 보이도록 다시 촬영해주세요.',
    retryable: true,
    suggestedAction: 'retake',
    partialResultAvailable: true,  // 치아 분석은 가능
  },
  INSUFFICIENT_DETECTION: {
    message: 'Insufficient oral features detected',
    userMessage: '구강 분석에 필요한 영역이 충분히 감지되지 않았습니다.',
    retryable: true,
    suggestedAction: 'retake',
  },
  IMAGE_QUALITY_POOR: {
    message: 'Image quality too low',
    userMessage: '이미지 품질이 분석에 적합하지 않습니다. 더 밝고 선명하게 촬영해주세요.',
    retryable: true,
    suggestedAction: 'retake',
  },
  AI_ANALYSIS_TIMEOUT: {
    message: 'AI analysis exceeded timeout',
    userMessage: '분석 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
    retryable: true,
    suggestedAction: 'retry',
    partialResultAvailable: true,  // 정량 분석 결과 가능
  },
  RATE_LIMIT_EXCEEDED: {
    message: 'Daily analysis limit exceeded',
    userMessage: '오늘의 분석 횟수를 모두 사용했습니다. 내일 다시 이용해주세요.',
    retryable: false,
    suggestedAction: 'wait',
  },
  // ... 나머지 에러 정의
};
```

### 16.2 3단계 Fallback 전략

```typescript
// apps/web/lib/oral-health/fallback-handler.ts

export const FALLBACK_LEVELS = [
  {
    level: 1,
    name: 'AI Retry',
    description: 'AI 분석 재시도 (최대 2회, 지수 백오프)',
    trigger: 'AI_ANALYSIS_TIMEOUT 또는 AI_ANALYSIS_ERROR',
    maxRetries: 2,
    baseDelay: 1000,
  },
  {
    level: 2,
    name: 'Quantitative Only',
    description: 'AI 없이 Lab 색상 분석만 수행',
    trigger: 'Level 1 실패 후',
    availableFeatures: ['toothColor (Lab)', 'gumHealth (a* based)', 'inflammationScore'],
    unavailableFeatures: ['VLM insights', 'tartar detection', 'advanced recommendations'],
  },
  {
    level: 3,
    name: 'Mock Fallback',
    description: '통계 기반 Mock 데이터 반환',
    trigger: 'Level 2 실패 또는 SEGMENTATION_FAILED',
    userMessage: '정확한 분석이 어려워 예상 결과를 표시합니다.',
  },
];

export async function analyzeOralWithFallback(
  input: OralHealthRequest,
  userId: string
): Promise<OralHealthResultWithMeta> {
  let usedFallback = false;
  let fallbackLevel: number | null = null;

  try {
    // 1. 이미지 세그멘테이션
    const segmentResult = await segmentOralImage(input.imageBase64);
    const validation = assessOralDetection(segmentResult);

    if (!validation.isValid) {
      throw createOralError('INSUFFICIENT_DETECTION', {
        detected: validation.detectedElements,
      });
    }

    // 2. 전체 분석 시도
    const result = await analyzeWithTimeout(
      () => performFullOralAnalysis(segmentResult, input, userId),
      3000
    );

    return {
      ...result,
      meta: {
        usedFallback: false,
        fallbackLevel: null,
        analysisScope: validation.analysisScope,
        confidenceModifier: validation.confidenceModifier,
      },
    };

  } catch (error) {
    const oralError = normalizeOralError(error);

    // Level 1: AI 재시도
    if (isRetryableAIError(oralError)) {
      try {
        const retryResult = await retryWithExponentialBackoff(
          () => performFullOralAnalysis(segmentResult!, input, userId),
          { maxRetries: 2, baseDelay: 1000 }
        );
        return { ...retryResult, meta: { usedFallback: false } };
      } catch {
        usedFallback = true;
        fallbackLevel = 2;
      }
    }

    // Level 2: Quantitative Only
    if (fallbackLevel === 2 && segmentResult) {
      try {
        const quantResult = await analyzeQuantitativeOnly(segmentResult, input);
        return {
          ...quantResult,
          meta: {
            usedFallback: true,
            fallbackLevel: 2,
            fallbackReason: 'AI 분석 실패, 색상 기반 분석만 수행됨',
          },
        };
      } catch {
        fallbackLevel = 3;
      }
    }

    // Level 3: Mock Fallback
    return {
      ...generateMockOralHealthResult(input),
      meta: {
        usedFallback: true,
        fallbackLevel: 3,
        fallbackReason: '분석 실패, 예상 결과 표시',
        userMessage: '정확한 분석이 어려워 예상 결과를 표시합니다. 다시 촬영하면 더 정확한 결과를 얻을 수 있습니다.',
      },
    };
  }
}
```

### 16.3 사용자 선택 흐름 (Fallback 시)

```typescript
export interface FallbackUserChoice {
  showFallbackNotice: boolean;
  options: FallbackOption[];
  defaultAction: 'accept' | 'retry' | 'retake';
}

export const FALLBACK_USER_CHOICES: Record<number, FallbackUserChoice> = {
  // Level 2: Quantitative Only
  2: {
    showFallbackNotice: true,
    options: [
      { id: 'accept', label: '현재 결과 확인', description: '색상 기반 분석 결과를 확인합니다.', action: 'accept_partial' },
      { id: 'retry', label: '다시 분석', description: 'AI 분석을 다시 시도합니다.', action: 'retry_analysis' },
    ],
    defaultAction: 'accept',
  },

  // Level 3: Mock Fallback
  3: {
    showFallbackNotice: true,
    options: [
      { id: 'accept', label: '예상 결과 확인', description: '통계 기반 예상 결과를 확인합니다.', action: 'accept_mock' },
      { id: 'retake', label: '다시 촬영', description: '더 나은 사진으로 정확한 분석을 받습니다.', action: 'retake_photo' },
      { id: 'retry', label: '현재 사진으로 재시도', description: '같은 사진으로 분석을 다시 시도합니다.', action: 'retry_analysis' },
    ],
    defaultAction: 'retake',
  },
};
```

### 16.4 Fallback 테스트 케이스

| TC-ID | 실패 시나리오 | 기대 Fallback Level | 기대 결과 |
|-------|--------------|--------------------| ---------|
| OH-FB-001 | 정상 분석 | - | 전체 결과 |
| OH-FB-002 | AI 타임아웃 1회 | 1 | 재시도 후 성공 |
| OH-FB-003 | AI 타임아웃 3회 | 2 | Quantitative Only |
| OH-FB-004 | 세그멘테이션 성공, AI 실패 | 2 | 색상 기반 결과 |
| OH-FB-005 | 세그멘테이션 부분 성공 | 2 | Partial 분석 |
| OH-FB-006 | 세그멘테이션 실패 | 3 | Mock 결과 |
| OH-FB-007 | 이미지 품질 불량 | 3 | Mock + 재촬영 안내 |
| OH-FB-008 | Rate Limit 초과 | - | 에러 + 대기 안내 |

---

## 17. 에러 핸들링 확장

### 17.1 Partial Failure Handling Table

| 실패 항목 | 영향 범위 | 처리 방식 | 사용자 표시 |
|----------|----------|----------|------------|
| 치아 색상 분석 실패 | VITA 매칭 | 잇몸 분석만 진행 | "치아 색상 분석이 제한됩니다" |
| 잇몸 분석 실패 | 염증 점수 | 치아 분석만 진행 | "잇몸 건강 분석이 제한됩니다" |
| PC-1 연동 실패 | 미백 목표 | 일반 미백 추천 | "개인화 미백 목표 대신 일반 권장" |
| N-1 연동 실패 | 영양 추천 | 일반 영양 정보 제공 | "개인화 영양 추천 생략" |
| VLM 분석 실패 | 치석/충치 감지 | Lab 기반 분석만 | "시각적 분석 없이 색상 분석만" |
| 상 잇몸만 감지 | 전체 잇몸 평가 | 감지된 영역만 분석 | "상측 잇몸만 분석됨" |
| 부분 치아만 감지 | 전체 셰이드 평가 | 감지된 치아만 분석 | "일부 치아만 분석됨" |

### 17.2 Graceful Degradation Levels

```typescript
export interface DegradationLevel {
  level: number;
  name: string;
  availableFeatures: string[];
  unavailableFeatures: string[];
  confidenceRange: [number, number];
  userMessage: string;
}

export const DEGRADATION_LEVELS: DegradationLevel[] = [
  {
    level: 0,
    name: 'Full Analysis',
    availableFeatures: ['toothColor', 'gumHealth', 'whiteningGoal', 'productRec', 'N1-nutrition'],
    unavailableFeatures: [],
    confidenceRange: [80, 100],
    userMessage: '',
  },
  {
    level: 1,
    name: 'AI-Assisted Partial',
    availableFeatures: ['toothColor', 'gumHealth', 'basic recommendations'],
    unavailableFeatures: ['VLM insights', 'tartar detection', 'advanced N1'],
    confidenceRange: [65, 85],
    userMessage: '일부 고급 분석이 제한되었습니다.',
  },
  {
    level: 2,
    name: 'Quantitative Only',
    availableFeatures: ['toothColor (Lab)', 'gumHealth (a* only)', 'basic recommendations'],
    unavailableFeatures: ['VLM', 'PC-1 연동', 'N1 연동'],
    confidenceRange: [50, 70],
    userMessage: 'AI 분석 없이 색상 기반 결과만 표시됩니다.',
  },
  {
    level: 3,
    name: 'Mock Fallback',
    availableFeatures: ['예상 셰이드', '일반 권장사항'],
    unavailableFeatures: ['정확한 분석', '개인화 추천'],
    confidenceRange: [30, 50],
    userMessage: '정확한 분석이 어려워 예상 결과를 표시합니다.',
  },
];
```

### 17.3 에러 핸들링 테스트 케이스

| TC-ID | 에러 시나리오 | 입력 조건 | 기대 HTTP | 기대 동작 | 사용자 메시지 |
|-------|--------------|----------|----------|----------|--------------|
| OH-ERR-001 | 정상 케이스 | 유효한 구강 이미지 | 200 | 분석 결과 반환 | - |
| OH-ERR-002 | 이미지 없음 | imageBase64=null | 400 | INVALID_INPUT | "이미지를 업로드해주세요" |
| OH-ERR-003 | 잘못된 이미지 형식 | imageBase64="not-base64" | 400 | INVALID_IMAGE_FORMAT | "지원하지 않는 이미지 형식입니다" |
| OH-ERR-004 | 인증 실패 | 토큰 없음 | 401 | AUTH_ERROR | "로그인이 필요합니다" |
| OH-ERR-005 | 치아 미감지 | 닫힌 입 이미지 | 200+Fallback | Mock 결과 | "입을 벌리고 촬영해주세요" |
| OH-ERR-006 | 부분 감지 | 치아 3개만 | 200 | Partial 분석 | "일부 치아만 분석됨" |
| OH-ERR-007 | AI 타임아웃 (1회) | 네트워크 지연 | 200 | 재시도 후 성공 | - |
| OH-ERR-008 | AI 타임아웃 (3회) | 지속적 지연 | 200 | Quantitative Only | "색상 기반 분석만 표시" |
| OH-ERR-009 | AI 서비스 에러 | Gemini 500 | 200+Fallback | Quantitative Only | "AI 분석 서비스에 일시적 문제" |
| OH-ERR-010 | Rate Limit | 50회 초과 | 429 | RATE_LIMIT | "오늘의 분석 횟수를 모두 사용했습니다" |
| OH-ERR-011 | 서버 내부 오류 | 예외 발생 | 500 | INTERNAL_ERROR | "일시적인 오류가 발생했습니다" |
| OH-ERR-012 | PC-1 데이터 없음 | season=null | 200 | 기본 미백 추천 | "퍼스널컬러 분석을 먼저 진행하면 개인화 추천이 가능합니다" |

---

## 17.4 참조 기준값 테이블

### VITA Shade Lab 참조값

| Shade | L* | a* | b* | Brightness Rank | Series |
|-------|----|----|----|-----------------| -------|
| B1 | 82.1 | -1.5 | 12.0 | 1 | B |
| A1 | 78.3 | -0.8 | 14.2 | 2 | A |
| B2 | 77.5 | -0.5 | 15.0 | 3 | B |
| D2 | 76.0 | 0.2 | 10.5 | 4 | D |
| A2 | 73.6 | -0.2 | 17.5 | 5 | A |
| C1 | 71.8 | 0.5 | 13.0 | 6 | C |
| C2 | 70.0 | 1.0 | 15.5 | 7 | C |
| D4 | 68.5 | 0.8 | 12.0 | 8 | D |
| A3 | 66.2 | 1.5 | 20.0 | 9 | A |
| D3 | 65.0 | 1.2 | 14.0 | 10 | D |
| B3 | 63.5 | 1.8 | 22.0 | 11 | B |
| A3.5 | 62.0 | 2.0 | 24.0 | 12 | A |
| B4 | 60.5 | 2.5 | 25.0 | 13 | B |
| C3 | 60.0 | 2.2 | 18.5 | 14 | C |
| A4 | 58.5 | 3.0 | 27.0 | 15 | A |
| C4 | 58.2 | 3.2 | 28.5 | 16 | C |

### 잇몸 건강 a* 기준값

| a* 범위 | 염증 점수 범위 | 상태 | 권장 조치 |
|--------|--------------|------|----------|
| < 10 | 0-24 | healthy | 현재 관리 유지 |
| 10-15 | 25-49 | mild_gingivitis | 칫솔질 개선, 치실 |
| 15-20 | 50-74 | moderate_gingivitis | 치과 방문 권장 |
| > 20 | 75-100 | severe_inflammation | 치과 방문 필수 |

---

## 18. 구현 일정 (Implementation Schedule)

### 18.1 일정 개요

| 항목 | 내용 |
|------|------|
| **예상 분기** | 2026 Q3 |
| **우선순위** | P2 (신규 분석 모듈) |
| **예상 기간** | 4-5주 |

### 18.2 선행 조건 (Prerequisites)

| 선행 모듈 | 상태 | 의존성 설명 |
|----------|------|------------|
| **PC-1** (퍼스널컬러) | ✅ Stable | 시즌별 최적 미백 목표 연동 |
| **CIE-1** (이미지 품질) | Complete | 구강 이미지 검증 |
| **CIE-3** (AWB 보정) | Complete | Lab 색상 정확도 보장 |

### 18.3 마일스톤

| Phase | 기간 | 주요 작업 | 산출물 |
|-------|------|----------|--------|
| **Phase 1** | 1주 | VITA 셰이드 DB, Lab 변환 | `lib/oral-health/vita-database.ts` |
| **Phase 2** | 1.5주 | 치아 색상 분석 (CIEDE2000) | `lib/oral-health/tooth-color-analyzer.ts` |
| **Phase 3** | 1주 | 잇몸 건강 평가 (a* 염증) | `lib/oral-health/gum-health-analyzer.ts` |
| **Phase 4** | 1주 | PC-1 연동, 미백 목표 설정 | `lib/oral-health/whitening-goal.ts` |
| **Buffer** | 0.5주 | QA, 테스트 | - |

### 18.4 후행 모듈 (Downstream)

| 모듈 | 사용 필드 | 영향 |
|------|----------|------|
| **제품 추천** | `whiteningGoal` | 미백 제품 매칭 |
| **대시보드** | `oralHealthScore` | 건강 점수 통합 표시 |
| **N-1 연동** | `gumHealth` | 영양소-잇몸 건강 상관 분석 |

### 18.5 위험 요소

| 위험 | 영향도 | 대응 |
|------|--------|------|
| 치아 감지 정확도 | 중간 | 열린 입 이미지 가이드 제공 |
| VITA 셰이드 매칭 오차 | 중간 | ΔE<2.7 임상 허용 범위 적용 |
| 조명 의존성 | 낮음 | CIE-3 AWB 필수 적용 |

---

**Version**: 1.5 | **Updated**: 2026-01-24 | 구현 일정 섹션 추가 (18절) - 2026 Q3, P2 우선순위, PC-1 연동 명시
