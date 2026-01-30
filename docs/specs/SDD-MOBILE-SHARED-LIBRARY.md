# SDD-MOBILE-SHARED-LIBRARY: 모바일 공유 라이브러리 확장 스펙

> **Phase**: Phase 0 (INF-4)
> **Priority**: P1
> **ADR**: [ADR-016](../adr/ADR-016-web-mobile-sync.md)
> **Status**: 📝 작성 완료
> **Updated**: 2026-01-28

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"웹과 모바일 간 코드 중복 0%, 타입 안전성 100%, 유지보수 단일 지점 보장하는 공유 라이브러리"

- 모든 공통 로직이 packages/shared에 중앙화
- 타입 정의 100% 공유
- 순수 함수/알고리즘 100% 재사용
- 플랫폼별 코드는 각 앱에만 존재

### 물리적 한계

| 한계 | 이유 | 완화 전략 |
|------|------|----------|
| React 훅 차이 | 웹/RN 훅 API 미세 차이 | 추상화 레이어 |
| 번들 크기 | 공유 패키지 전체 포함 시 | Tree-shaking, Barrel export |
| 플랫폼 API | 스토리지, 네트워크 등 | 인터페이스 추상화 |
| 빌드 복잡도 | 모노레포 설정 | Turborepo 최적화 |

### 100점 기준

| 지표 | 100점 기준 | 현재 목표 |
|------|-----------|----------|
| 코드 중복 제거 | 100% | 90% |
| 타입 공유율 | 100% | 95% |
| 알고리즘 재사용 | 100% | 80% |
| 빌드 시간 | < 30초 | < 60초 |

### 현재 목표: 70%

**종합 달성률**: **70%** (기초 구조 완료, 확장 필요)

| 기능 | 달성률 | 상태 |
|------|--------|------|
| 공통 타입 정의 | 80% | ✅ 기존 |
| 순수 유틸리티 | 70% | ✅ 기존 |
| 분석 알고리즘 | 60% | 📝 확장 |
| Logger 추상화 | 50% | 📝 신규 |
| 상수/설정값 | 65% | 📝 확장 |

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| UI 컴포넌트 공유 | 플랫폼 특화 필요 | 디자인 시스템 V2 |
| Supabase 클라이언트 | 플랫폼별 초기화 다름 | 래퍼 검토 |
| React 훅 | 플랫폼 차이 큼 | 공통 인터페이스 검토 |

---

## 1. 개요

### 1.1 목적

웹(Next.js)과 모바일(Expo)에서 공유되는 코드를 `packages/shared` 패키지로 중앙화하여:
- 코드 중복 90% 제거 (특히 logger)
- 타입 안전성 보장
- 유지보수 비용 감소

### 1.2 범위

| 포함 | 제외 |
|------|------|
| 공통 타입 정의 | UI 컴포넌트 (플랫폼 특화) |
| 순수 유틸리티 함수 | Supabase 클라이언트 (플랫폼별 초기화) |
| 분석 알고리즘 | API 라우트 |
| 상수/설정값 | 플랫폼별 스토리지 |
| Logger 추상화 | React 훅 (대부분) |

### 1.3 현재 상태

```
packages/shared/
├── src/
│   ├── types/
│   │   └── index.ts      # ~300줄 (기존)
│   └── utils/
│       └── index.ts      # ~140줄 (기존)
└── package.json

총 ~440줄, 2개 파일
```

### 1.4 목표 상태

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── index.ts           # Barrel export
│   │   ├── analysis.ts        # 분석 관련 타입
│   │   ├── nutrition.ts       # 영양 관련 타입
│   │   ├── workout.ts         # 운동 관련 타입
│   │   ├── user.ts            # 사용자 관련 타입
│   │   └── api.ts             # API 응답 타입
│   ├── utils/
│   │   ├── index.ts           # Barrel export
│   │   ├── format.ts          # 포맷팅 유틸
│   │   ├── validation.ts      # 검증 유틸
│   │   └── date.ts            # 날짜 유틸
│   ├── algorithms/
│   │   ├── index.ts           # Barrel export
│   │   ├── calorie.ts         # 칼로리 계산
│   │   ├── bmi.ts             # BMI 계산
│   │   └── match-rate.ts      # 매칭률 계산
│   ├── constants/
│   │   ├── index.ts           # Barrel export
│   │   ├── analysis.ts        # 분석 상수
│   │   ├── nutrition.ts       # 영양 상수
│   │   └── workout.ts         # 운동 상수
│   └── logger/
│       ├── index.ts           # Barrel export
│       ├── types.ts           # Logger 타입
│       └── logger.ts          # Logger 구현
├── package.json
└── tsconfig.json

예상 ~1500줄, 20+ 파일
```

### 1.5 의존성

| 의존 대상 | 타입 | 설명 |
|----------|------|------|
| ADR-016 | ADR | 웹-모바일 동기화 전략 |
| Zod | 라이브러리 | 스키마 검증 |
| TypeScript | 도구 | 타입 시스템 |

---

## 2. 아키텍처

### 2.1 패키지 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                    Monorepo 패키지 구조                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  apps/web/           apps/mobile/        packages/shared/       │
│  ├── lib/            ├── lib/            ├── src/              │
│  │   ├── analysis/   │   ├── analysis/   │   ├── types/       │
│  │   ├── nutrition/  │   ├── nutrition/  │   ├── utils/       │
│  │   └── workout/    │   └── workout/    │   ├── algorithms/  │
│  │                   │                    │   ├── constants/   │
│  │   ↓ import        │   ↓ import        │   └── logger/      │
│  │                   │                    │                    │
│  └───────────────────┴────────────────────┘                    │
│           ↓                    ↓                               │
│     @yiroom/shared       @yiroom/shared                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Import 규칙

```typescript
// ✅ 허용: packages/shared에서 import
import { AnalysisResult, formatDate } from '@yiroom/shared';
import { calculateCalories } from '@yiroom/shared/algorithms';
import { WORKOUT_TYPES } from '@yiroom/shared/constants';

// ❌ 금지: 플랫폼 특화 코드 shared에 포함
import { useRouter } from 'next/navigation';  // ❌ 웹 전용
import AsyncStorage from '@react-native-async-storage/async-storage'; // ❌ 모바일 전용
```

### 2.3 플랫폼별 제외 항목

| 항목 | 이유 | 대안 |
|------|------|------|
| Supabase Client | 초기화 방식 상이 | 각 앱에서 래핑 |
| AsyncStorage | 모바일 전용 | 인터페이스만 공유 |
| next/navigation | 웹 전용 | 인터페이스만 공유 |
| expo-constants | 모바일 전용 | 환경변수 추상화 |

---

## 3. ATOM 분해

### ATOM-1: 패키지 설정 및 빌드 구성

**예상 시간**: 1시간
**입력**: 없음
**출력**: package.json, tsconfig.json

```json
// packages/shared/package.json
{
  "name": "@yiroom/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./types": {
      "import": "./dist/types/index.mjs",
      "require": "./dist/types/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils/index.mjs",
      "require": "./dist/utils/index.js",
      "types": "./dist/utils/index.d.ts"
    },
    "./algorithms": {
      "import": "./dist/algorithms/index.mjs",
      "require": "./dist/algorithms/index.js",
      "types": "./dist/algorithms/index.d.ts"
    },
    "./constants": {
      "import": "./dist/constants/index.mjs",
      "require": "./dist/constants/index.js",
      "types": "./dist/constants/index.d.ts"
    },
    "./logger": {
      "import": "./dist/logger/index.mjs",
      "require": "./dist/logger/index.js",
      "types": "./dist/logger/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.0.0"
  }
}
```

```typescript
// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

```typescript
// packages/shared/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/types/index.ts',
    'src/utils/index.ts',
    'src/algorithms/index.ts',
    'src/constants/index.ts',
    'src/logger/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
});
```

**성공 기준**:
- [ ] `npm run build` 성공
- [ ] 각 entry point별 타입 생성
- [ ] apps/web, apps/mobile에서 import 가능

---

### ATOM-2: 타입 정의 통합

**예상 시간**: 2시간
**입력**: 기존 types/index.ts
**출력**: 분리된 타입 모듈

```typescript
// packages/shared/src/types/analysis.ts
import { z } from 'zod';

// 퍼스널컬러 타입
export const SeasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter']);
export type Season = z.infer<typeof SeasonSchema>;

export const SubTypeSchema = z.enum(['light', 'true', 'dark', 'bright', 'muted']);
export type SubType = z.infer<typeof SubTypeSchema>;

export interface PersonalColorResult {
  id: string;
  season: Season;
  subType: SubType;
  confidence: number;
  colorPalette: string[];
  createdAt: string;
}

// 피부 분석 타입
export const SkinTypeSchema = z.enum(['dry', 'oily', 'combination', 'normal', 'sensitive']);
export type SkinType = z.infer<typeof SkinTypeSchema>;

export interface SkinAnalysisResult {
  id: string;
  skinType: SkinType;
  scores: {
    hydration: number;
    oiliness: number;
    sensitivity: number;
    wrinkles: number;
    pores: number;
  };
  recommendations: string[];
  createdAt: string;
}

// 체형 분석 타입
export const BodyTypeSchema = z.enum([
  'inverted_triangle',
  'triangle',
  'rectangle',
  'hourglass',
  'oval',
]);
export type BodyType = z.infer<typeof BodyTypeSchema>;

export interface BodyAnalysisResult {
  id: string;
  bodyType: BodyType;
  measurements?: {
    shoulder: number;
    bust: number;
    waist: number;
    hip: number;
  };
  recommendations: string[];
  createdAt: string;
}

// 통합 분석 결과 타입
export type AnalysisResult =
  | PersonalColorResult
  | SkinAnalysisResult
  | BodyAnalysisResult;

export type AnalysisType = 'personal-color' | 'skin' | 'body' | 'hair' | 'posture';
```

```typescript
// packages/shared/src/types/nutrition.ts
import { z } from 'zod';

export interface NutrientInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
}

export interface MealRecord {
  id: string;
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: FoodItem[];
  totalNutrients: NutrientInfo;
  recordedAt: string;
}

export interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  nutrients: NutrientInfo;
}

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  targetCalories: number;
  macros: {
    protein: { current: number; target: number };
    carbs: { current: number; target: number };
    fat: { current: number; target: number };
  };
  waterIntake: number;
  waterTarget: number;
}
```

```typescript
// packages/shared/src/types/workout.ts
import { z } from 'zod';

export const WorkoutTypeSchema = z.enum([
  'cardio',
  'strength',
  'flexibility',
  'hiit',
  'yoga',
  'swimming',
  'cycling',
  'walking',
  'running',
]);
export type WorkoutType = z.infer<typeof WorkoutTypeSchema>;

export interface WorkoutLog {
  id: string;
  userId: string;
  type: WorkoutType;
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  intensity: 'low' | 'medium' | 'high';
  exercises?: Exercise[];
  notes?: string;
  recordedAt: string;
}

export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
}

export interface WeeklyWorkoutSummary {
  weekStartDate: string;
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  byType: Record<WorkoutType, number>;
}
```

```typescript
// packages/shared/src/types/api.ts
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
  };
}
```

```typescript
// packages/shared/src/types/index.ts
// Barrel export
export * from './analysis';
export * from './nutrition';
export * from './workout';
export * from './user';
export * from './api';
```

**성공 기준**:
- [ ] 모든 타입 import 가능
- [ ] Zod 스키마 동작
- [ ] 기존 앱과 호환

---

### ATOM-3: 유틸리티 함수 통합

**예상 시간**: 1.5시간
**입력**: 기존 utils/index.ts
**출력**: 분리된 유틸 모듈

```typescript
// packages/shared/src/utils/format.ts

/**
 * 숫자를 한국어 형식으로 포맷팅
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('ko-KR', options).format(value);
}

/**
 * 칼로리 포맷팅 (예: 1,234 kcal)
 */
export function formatCalories(value: number): string {
  return `${formatNumber(Math.round(value))} kcal`;
}

/**
 * 퍼센트 포맷팅 (예: 85%)
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 무게 포맷팅 (예: 65.5 kg)
 */
export function formatWeight(kg: number): string {
  return `${kg.toFixed(1)} kg`;
}

/**
 * 시간 포맷팅 (예: 1시간 30분)
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

/**
 * 물 섭취량 포맷팅 (예: 1.5L)
 */
export function formatWaterIntake(ml: number): string {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)}L`;
  }
  return `${ml}ml`;
}
```

```typescript
// packages/shared/src/utils/date.ts

/**
 * 날짜를 한국어 형식으로 포맷팅
 */
export function formatDate(
  date: Date | string | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat('ko-KR', defaultOptions).format(d);
}

/**
 * 상대적 시간 표시 (예: 3분 전, 어제)
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay === 1) return '어제';
  if (diffDay < 7) return `${diffDay}일 전`;

  return formatDate(d);
}

/**
 * 날짜가 오늘인지 확인
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/**
 * 주의 시작일 (월요일) 계산
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 만 나이 계산
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
```

```typescript
// packages/shared/src/utils/validation.ts
import { z } from 'zod';

/**
 * 이메일 검증
 */
export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

/**
 * 14세 이상 확인
 */
export function isAge14OrOlder(birthDate: Date): boolean {
  const today = new Date();
  const age14Date = new Date(
    today.getFullYear() - 14,
    today.getMonth(),
    today.getDate()
  );
  return birthDate <= age14Date;
}

/**
 * 빈 값 확인
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * 숫자 범위 확인
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
```

```typescript
// packages/shared/src/utils/index.ts
export * from './format';
export * from './date';
export * from './validation';
```

**성공 기준**:
- [ ] 모든 유틸 함수 테스트 통과
- [ ] 순수 함수 (사이드 이펙트 없음)
- [ ] 플랫폼 독립적

---

### ATOM-4: 알고리즘 모듈

**예상 시간**: 2시간
**입력**: 기존 lib/nutrition, lib/workout 함수
**출력**: algorithms 모듈

```typescript
// packages/shared/src/algorithms/calorie.ts

/**
 * BMR (기초대사량) 계산 - Mifflin-St Jeor 공식
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female'
): number {
  // BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + s
  // s = +5 for male, -161 for female
  const s = gender === 'male' ? 5 : -161;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + s;
}

/**
 * TDEE (총 일일 에너지 소비량) 계산
 */
export type ActivityLevel =
  | 'sedentary'      // 1.2: 거의 운동 안 함
  | 'light'          // 1.375: 가벼운 운동 (주 1-3일)
  | 'moderate'       // 1.55: 적당한 운동 (주 3-5일)
  | 'active'         // 1.725: 활발한 운동 (주 6-7일)
  | 'very_active';   // 1.9: 매우 활발 (하루 2회 이상)

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * MET 기반 운동 칼로리 소모량 계산
 * 공식: Calories = MET × Weight(kg) × Duration(hours)
 */
export function calculateExerciseCalories(
  met: number,
  weightKg: number,
  durationMinutes: number
): number {
  const durationHours = durationMinutes / 60;
  return Math.round(met * weightKg * durationHours);
}

/**
 * 목표 칼로리 계산 (체중 감량/유지/증량)
 */
export type WeightGoal = 'lose' | 'maintain' | 'gain';

export function calculateTargetCalories(
  tdee: number,
  goal: WeightGoal,
  rate: 'slow' | 'normal' | 'fast' = 'normal'
): number {
  const adjustments: Record<WeightGoal, Record<string, number>> = {
    lose: { slow: -250, normal: -500, fast: -750 },
    maintain: { slow: 0, normal: 0, fast: 0 },
    gain: { slow: 250, normal: 500, fast: 750 },
  };

  return Math.max(1200, tdee + adjustments[goal][rate]);
}

/**
 * 매크로 영양소 비율 계산
 */
export interface MacroRatio {
  protein: number;  // 0-1
  carbs: number;    // 0-1
  fat: number;      // 0-1
}

export interface MacroGrams {
  protein: number;
  carbs: number;
  fat: number;
}

export function calculateMacros(
  targetCalories: number,
  ratio: MacroRatio = { protein: 0.3, carbs: 0.4, fat: 0.3 }
): MacroGrams {
  return {
    protein: Math.round((targetCalories * ratio.protein) / 4),  // 4 kcal/g
    carbs: Math.round((targetCalories * ratio.carbs) / 4),      // 4 kcal/g
    fat: Math.round((targetCalories * ratio.fat) / 9),          // 9 kcal/g
  };
}
```

```typescript
// packages/shared/src/algorithms/bmi.ts

/**
 * BMI 계산
 * 공식: BMI = weight(kg) / height(m)^2
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * BMI 분류
 */
export type BMICategory =
  | 'underweight'    // < 18.5
  | 'normal'         // 18.5 - 24.9
  | 'overweight'     // 25 - 29.9
  | 'obese';         // >= 30

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

/**
 * 이상적 체중 범위 계산 (BMI 18.5-24.9 기준)
 */
export function getIdealWeightRange(heightCm: number): { min: number; max: number } {
  const heightM = heightCm / 100;
  return {
    min: Math.round(18.5 * heightM * heightM * 10) / 10,
    max: Math.round(24.9 * heightM * heightM * 10) / 10,
  };
}
```

```typescript
// packages/shared/src/algorithms/match-rate.ts
import type { Season, SkinType, BodyType } from '../types';

/**
 * 퍼스널컬러 매칭률 계산
 */
export function calculateColorMatchRate(
  userSeason: Season,
  productColorTone: 'warm' | 'cool' | 'neutral'
): number {
  const warmSeasons: Season[] = ['spring', 'autumn'];
  const coolSeasons: Season[] = ['summer', 'winter'];

  const isUserWarm = warmSeasons.includes(userSeason);

  if (productColorTone === 'neutral') return 80;
  if (productColorTone === 'warm' && isUserWarm) return 95;
  if (productColorTone === 'cool' && !isUserWarm) return 95;

  return 40; // 미스매치
}

/**
 * 피부 타입 제품 매칭률 계산
 */
export function calculateSkinProductMatchRate(
  userSkinType: SkinType,
  productTargetSkinTypes: SkinType[]
): number {
  if (productTargetSkinTypes.length === 0) return 70; // 범용

  if (productTargetSkinTypes.includes(userSkinType)) {
    return 90 + Math.random() * 10; // 90-100
  }

  // 부분 매칭 (예: combination과 oily)
  const partialMatch: Record<SkinType, SkinType[]> = {
    combination: ['oily', 'normal'],
    oily: ['combination'],
    dry: ['sensitive'],
    sensitive: ['dry'],
    normal: ['combination'],
  };

  if (partialMatch[userSkinType]?.some(t => productTargetSkinTypes.includes(t))) {
    return 60 + Math.random() * 20; // 60-80
  }

  return 30 + Math.random() * 20; // 30-50
}

/**
 * 종합 매칭률 계산 (가중 평균)
 */
export interface MatchFactors {
  colorMatch?: number;
  skinMatch?: number;
  ingredientMatch?: number;
  priceMatch?: number;
}

export function calculateOverallMatchRate(
  factors: MatchFactors,
  weights: Partial<Record<keyof MatchFactors, number>> = {}
): number {
  const defaultWeights: Record<keyof MatchFactors, number> = {
    colorMatch: 0.3,
    skinMatch: 0.35,
    ingredientMatch: 0.25,
    priceMatch: 0.1,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, value] of Object.entries(factors) as [keyof MatchFactors, number][]) {
    if (value !== undefined) {
      const weight = weights[key] ?? defaultWeights[key];
      weightedSum += value * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}
```

```typescript
// packages/shared/src/algorithms/index.ts
export * from './calorie';
export * from './bmi';
export * from './match-rate';
```

**성공 기준**:
- [ ] 모든 알고리즘 테스트 통과
- [ ] 순수 함수 (플랫폼 독립)
- [ ] 공식 출처 주석 포함

---

### ATOM-5: 상수 모듈

**예상 시간**: 1시간
**입력**: 각 앱의 하드코딩된 상수
**출력**: constants 모듈

```typescript
// packages/shared/src/constants/analysis.ts

export const PERSONAL_COLOR_SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export const PERSONAL_COLOR_SUBTYPES = ['light', 'true', 'dark', 'bright', 'muted'] as const;

export const SKIN_TYPES = ['dry', 'oily', 'combination', 'normal', 'sensitive'] as const;

export const BODY_TYPES = [
  'inverted_triangle',
  'triangle',
  'rectangle',
  'hourglass',
  'oval',
] as const;

export const ANALYSIS_TYPES = [
  'personal-color',
  'skin',
  'body',
  'hair',
  'posture',
  'makeup',
] as const;

// 분석별 타임아웃 (ms)
export const ANALYSIS_TIMEOUTS: Record<string, number> = {
  'personal-color': 3000,
  skin: 5000,
  body: 5000,
  hair: 3000,
  posture: 5000,
  makeup: 5000,
};

// 신뢰도 임계값
export const CONFIDENCE_THRESHOLDS = {
  high: 80,
  medium: 60,
  low: 40,
};
```

```typescript
// packages/shared/src/constants/nutrition.ts

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

// 권장 섭취량 (성인 기준)
export const DAILY_RECOMMENDED = {
  calories: { min: 1500, max: 2500 },
  protein: { min: 50, max: 100 },  // g
  carbs: { min: 225, max: 325 },   // g
  fat: { min: 44, max: 78 },       // g
  fiber: { min: 25, max: 38 },     // g
  sodium: { max: 2300 },           // mg
  water: { min: 2000, max: 3000 }, // ml
};

// 칼로리 계산 상수
export const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
  alcohol: 7,
};

// 물 섭취 단위
export const WATER_UNITS = [
  { value: 200, label: '한 컵 (200ml)' },
  { value: 350, label: '텀블러 (350ml)' },
  { value: 500, label: '물병 (500ml)' },
  { value: 1000, label: '대용량 (1L)' },
];
```

```typescript
// packages/shared/src/constants/workout.ts

export const WORKOUT_TYPES = [
  'cardio',
  'strength',
  'flexibility',
  'hiit',
  'yoga',
  'swimming',
  'cycling',
  'walking',
  'running',
] as const;

export const INTENSITY_LEVELS = ['low', 'medium', 'high'] as const;

// MET 값 테이블 (Compendium of Physical Activities)
export const MET_VALUES: Record<string, number> = {
  // 유산소
  walking_slow: 2.5,
  walking_brisk: 4.0,
  running_5mph: 8.3,
  running_6mph: 9.8,
  cycling_leisure: 4.0,
  cycling_moderate: 6.8,
  swimming_leisure: 6.0,
  swimming_laps: 8.0,

  // 근력
  weight_training_light: 3.5,
  weight_training_moderate: 5.0,
  weight_training_vigorous: 6.0,

  // 유연성
  yoga_hatha: 2.5,
  yoga_power: 4.0,
  stretching: 2.3,

  // HIIT
  hiit_moderate: 8.0,
  hiit_vigorous: 12.0,
};

// 주간 운동 권장량
export const WEEKLY_EXERCISE_GOALS = {
  cardio_minutes: 150,      // 중강도 유산소
  strength_sessions: 2,      // 근력 운동 횟수
  flexibility_sessions: 2,   // 유연성 운동 횟수
};
```

```typescript
// packages/shared/src/constants/index.ts
export * from './analysis';
export * from './nutrition';
export * from './workout';
```

**성공 기준**:
- [ ] 모든 상수 타입 안전
- [ ] as const로 리터럴 타입 유지
- [ ] 출처/근거 주석 포함

---

### ATOM-6: Logger 모듈

**예상 시간**: 1.5시간
**입력**: 웹/모바일의 중복 로거
**출력**: 추상화된 Logger 모듈

```typescript
// packages/shared/src/logger/types.ts

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  module?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
}

export interface LogTransport {
  log(entry: LogEntry): void;
}

export interface LoggerConfig {
  level: LogLevel;
  transports: LogTransport[];
  defaultContext?: LogContext;
}
```

```typescript
// packages/shared/src/logger/logger.ts
import type { LogLevel, LogContext, LogEntry, LogTransport, LoggerConfig } from './types';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * 플랫폼 독립 Logger 클래스
 */
export class Logger {
  private level: LogLevel;
  private transports: LogTransport[];
  private defaultContext: LogContext;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.level = config.level ?? 'info';
    this.transports = config.transports ?? [new ConsoleTransport()];
    this.defaultContext = config.defaultContext ?? {};
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.defaultContext, ...context },
      error,
    };
  }

  private emit(entry: LogEntry): void {
    for (const transport of this.transports) {
      transport.log(entry);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      this.emit(this.createEntry('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      this.emit(this.createEntry('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      this.emit(this.createEntry('warn', message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      this.emit(this.createEntry('error', message, context, error));
    }
  }

  child(context: LogContext): Logger {
    return new Logger({
      level: this.level,
      transports: this.transports,
      defaultContext: { ...this.defaultContext, ...context },
    });
  }
}

/**
 * 기본 Console Transport
 */
export class ConsoleTransport implements LogTransport {
  log(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const module = entry.context?.module ? ` [${entry.context.module}]` : '';

    const args: unknown[] = [`${prefix}${module}`, entry.message];

    if (entry.context && Object.keys(entry.context).length > 1) {
      const { module: _, ...rest } = entry.context;
      if (Object.keys(rest).length > 0) {
        args.push(rest);
      }
    }

    if (entry.error) {
      args.push(entry.error);
    }

    switch (entry.level) {
      case 'debug':
        console.debug(...args);
        break;
      case 'info':
        console.info(...args);
        break;
      case 'warn':
        console.warn(...args);
        break;
      case 'error':
        console.error(...args);
        break;
    }
  }
}

// 기본 Logger 인스턴스
export const logger = new Logger();
```

```typescript
// packages/shared/src/logger/index.ts
export * from './types';
export * from './logger';
```

**사용 예시 (웹)**:
```typescript
// apps/web/lib/logger.ts
import { Logger, ConsoleTransport } from '@yiroom/shared/logger';
import * as Sentry from '@sentry/nextjs';

class SentryTransport {
  log(entry: LogEntry): void {
    if (entry.level === 'error' && entry.error) {
      Sentry.captureException(entry.error, {
        tags: { module: entry.context?.module },
        extra: entry.context,
      });
    }
  }
}

export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  transports: [
    new ConsoleTransport(),
    new SentryTransport(),
  ],
});
```

**성공 기준**:
- [ ] 플랫폼 독립 구현
- [ ] Transport 확장 가능
- [ ] child logger로 컨텍스트 전파

---

### ATOM-7: 메인 Entry Point 및 테스트

**예상 시간**: 1시간
**입력**: 모든 모듈
**출력**: index.ts, 테스트

```typescript
// packages/shared/src/index.ts
// Re-export all modules
export * from './types';
export * from './utils';
export * from './algorithms';
export * from './constants';
export * from './logger';
```

```typescript
// packages/shared/tests/algorithms/calorie.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  calculateExerciseCalories,
  calculateTargetCalories,
} from '../../src/algorithms/calorie';

describe('calculateBMR', () => {
  it('should calculate BMR for male', () => {
    // 70kg, 175cm, 30세 남성
    const bmr = calculateBMR(70, 175, 30, 'male');
    // 10 * 70 + 6.25 * 175 - 5 * 30 + 5 = 1648.75
    expect(bmr).toBeCloseTo(1648.75, 1);
  });

  it('should calculate BMR for female', () => {
    // 60kg, 165cm, 25세 여성
    const bmr = calculateBMR(60, 165, 25, 'female');
    // 10 * 60 + 6.25 * 165 - 5 * 25 - 161 = 1345.25
    expect(bmr).toBeCloseTo(1345.25, 1);
  });
});

describe('calculateTDEE', () => {
  it('should apply activity multipliers correctly', () => {
    const bmr = 1500;

    expect(calculateTDEE(bmr, 'sedentary')).toBe(1800);
    expect(calculateTDEE(bmr, 'moderate')).toBe(2325);
    expect(calculateTDEE(bmr, 'active')).toBe(2588);
  });
});

describe('calculateExerciseCalories', () => {
  it('should calculate calories burned', () => {
    // MET 5.0, 70kg, 30분
    const calories = calculateExerciseCalories(5.0, 70, 30);
    // 5.0 * 70 * 0.5 = 175
    expect(calories).toBe(175);
  });
});

describe('calculateTargetCalories', () => {
  it('should reduce for weight loss', () => {
    const target = calculateTargetCalories(2000, 'lose', 'normal');
    expect(target).toBe(1500);
  });

  it('should not go below 1200', () => {
    const target = calculateTargetCalories(1400, 'lose', 'fast');
    expect(target).toBe(1200);
  });
});
```

```typescript
// packages/shared/tests/utils/date.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDate, formatRelativeTime, isToday, calculateAge } from '../../src/utils/date';

describe('formatDate', () => {
  it('should format date in Korean', () => {
    const date = new Date('2026-01-15');
    expect(formatDate(date)).toContain('2026');
    expect(formatDate(date)).toContain('1월');
    expect(formatDate(date)).toContain('15');
  });

  it('should return dash for null', () => {
    expect(formatDate(null)).toBe('-');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "방금 전" for recent', () => {
    const date = new Date('2026-01-15T11:59:30');
    expect(formatRelativeTime(date)).toBe('방금 전');
  });

  it('should return minutes ago', () => {
    const date = new Date('2026-01-15T11:55:00');
    expect(formatRelativeTime(date)).toBe('5분 전');
  });
});

describe('calculateAge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate correct age', () => {
    expect(calculateAge(new Date('1996-01-15'))).toBe(30);
    expect(calculateAge(new Date('1996-01-16'))).toBe(29); // 생일 전
    expect(calculateAge(new Date('1996-01-14'))).toBe(30); // 생일 후
  });
});
```

**성공 기준**:
- [ ] 모든 테스트 통과
- [ ] 테스트 커버리지 90% 이상
- [ ] apps/web, apps/mobile에서 import 성공

---

### ATOM-8: 앱 통합

**예상 시간**: 2시간
**입력**: packages/shared
**출력**: 앱 수정 및 마이그레이션

```typescript
// apps/web/package.json (수정)
{
  "dependencies": {
    "@yiroom/shared": "workspace:*"
  }
}

// apps/mobile/package.json (수정)
{
  "dependencies": {
    "@yiroom/shared": "workspace:*"
  }
}
```

```typescript
// apps/web/lib/nutrition/calorie-calculator.ts (마이그레이션 예시)
// Before:
// function calculateBMR(...) { ... }

// After:
import { calculateBMR, calculateTDEE } from '@yiroom/shared/algorithms';

export function getUserDailyCalories(user: User): number {
  const bmr = calculateBMR(user.weight, user.height, user.age, user.gender);
  return calculateTDEE(bmr, user.activityLevel);
}
```

```typescript
// apps/mobile/lib/utils/format.ts (마이그레이션 예시)
// Before:
// export function formatCalories(...) { ... }

// After:
export { formatCalories, formatDuration, formatWeight } from '@yiroom/shared/utils';
```

**성공 기준**:
- [ ] 웹 앱 빌드 성공
- [ ] 모바일 앱 빌드 성공
- [ ] 기존 기능 정상 동작
- [ ] 중복 코드 제거

---

## 4. 테스트 케이스

| TC ID | 시나리오 | 입력 | 예상 결과 |
|-------|---------|------|----------|
| TC-1 | BMR 계산 (남성) | 70kg, 175cm, 30세, male | ~1649 kcal |
| TC-2 | BMR 계산 (여성) | 60kg, 165cm, 25세, female | ~1345 kcal |
| TC-3 | TDEE 계산 | BMR 1500, moderate | 2325 kcal |
| TC-4 | BMI 계산 | 70kg, 175cm | ~22.9 |
| TC-5 | 날짜 포맷 | 2026-01-15 | "2026년 1월 15일" |
| TC-6 | 상대 시간 | 5분 전 | "5분 전" |
| TC-7 | 14세 확인 | 2012-01-01 | false |
| TC-8 | 칼로리 포맷 | 1234.5 | "1,235 kcal" |
| TC-9 | Logger 출력 | error, "test" | Console 출력 |
| TC-10 | 매칭률 계산 | spring, warm | 95 |

---

## 5. 마이그레이션 계획

### 5.1 Phase 1: 패키지 설정 (Day 1)

1. packages/shared/ 구조 생성
2. tsup 빌드 설정
3. Turborepo 설정 확인

### 5.2 Phase 2: 모듈 마이그레이션 (Day 2-3)

1. 타입 마이그레이션
2. 유틸 마이그레이션
3. 상수 마이그레이션
4. 알고리즘 마이그레이션

### 5.3 Phase 3: Logger 통합 (Day 4)

1. Logger 모듈 구현
2. 웹 Transport 설정
3. 모바일 Transport 설정

### 5.4 Phase 4: 앱 통합 (Day 5)

1. apps/web 마이그레이션
2. apps/mobile 마이그레이션
3. 중복 코드 제거

---

## 6. 체크리스트

### 6.1 구현 완료 조건

- [ ] ATOM-1: 패키지 설정 및 빌드 구성
- [ ] ATOM-2: 타입 정의 통합
- [ ] ATOM-3: 유틸리티 함수 통합
- [ ] ATOM-4: 알고리즘 모듈
- [ ] ATOM-5: 상수 모듈
- [ ] ATOM-6: Logger 모듈
- [ ] ATOM-7: 메인 Entry Point 및 테스트
- [ ] ATOM-8: 앱 통합

### 6.2 품질 기준

- [ ] TypeScript strict mode 통과
- [ ] 테스트 커버리지 90% 이상
- [ ] 순수 함수 (플랫폼 독립)
- [ ] Tree-shaking 가능

---

## 7. 관련 문서

- [ADR-016](../adr/ADR-016-web-mobile-sync.md) - 웹-모바일 동기화
- [code-style.md](../../.claude/rules/code-style.md) - 코딩 규칙
- [mobile-patterns.md](../../.claude/rules/mobile-patterns.md) - 모바일 패턴

---

**Author**: Claude Code
**Created**: 2026-01-23
**Last Updated**: 2026-01-23
