# 캡슐화 원리 (Encapsulation Principle)

> 모듈 경계 정의 및 정보 은닉 규칙
> **제1원칙**: [FIRST-PRINCIPLES.md](../../docs/FIRST-PRINCIPLES.md) 최우선 참조

---

## 핵심 원칙

```
"모듈은 검은 상자(Black Box)여야 한다.
외부는 공개 API만 알고, 내부 구현은 모른다."
```

---

## 1. 모듈 경계 정의

### 1.1 lib/ 구조

```
lib/
├── [domain]/           # 도메인별 모듈
│   ├── index.ts        # 공개 API (Barrel Export)
│   ├── types.ts        # 공개 타입
│   └── internal/       # 내부 구현 (외부 접근 금지)
│       ├── utils.ts
│       └── helpers.ts
```

### 1.2 모듈 분류

| 모듈       | 경로             | 책임                |
| ---------- | ---------------- | ------------------- |
| **분석**   | `lib/analysis/`  | AI 분석 로직        |
| **영양**   | `lib/nutrition/` | BMR/TDEE, 식단      |
| **운동**   | `lib/workout/`   | 운동 추천, MET      |
| **제품**   | `lib/products/`  | 제품 DB 접근        |
| **인증**   | `lib/auth/`      | Clerk 래퍼          |
| **감사**   | `lib/audit/`     | 로깅                |
| **이미지** | `lib/image/`     | 이미지 처리         |
| **AI**     | `lib/gemini/`    | Gemini API          |
| **DB**     | `lib/supabase/`  | Supabase 클라이언트 |

---

## 2. 호출 방향 규칙

### 2.1 계층 구조

```
┌─────────────────────────────────────────────────────────────┐
│                        호출 방향 규칙                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐                                          │
│   │ Presentation │  components/, app/                       │
│   │    (UI)      │  → 사용자 인터페이스                      │
│   └──────┬───────┘                                          │
│          │ 호출 ↓                                            │
│   ┌──────▼───────┐                                          │
│   │   Domain     │  lib/[domain]/                           │
│   │  (비즈니스)   │  → 비즈니스 로직                          │
│   └──────┬───────┘                                          │
│          │ 호출 ↓                                            │
│   ┌──────▼───────┐                                          │
│   │ Repository   │  lib/supabase/, lib/gemini/              │
│   │  (데이터)     │  → 외부 서비스 접근                       │
│   └──────────────┘                                          │
│                                                              │
│   ❌ 역방향 호출 금지: Repository → Domain → Presentation    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 허용/금지 패턴

```typescript
// ✅ 허용: 상위 → 하위 호출
// components/WorkoutCard.tsx
import { calculateCalories } from '@/lib/workout'; // Domain 호출

// lib/workout/index.ts
import { createClient } from '@/lib/supabase'; // Repository 호출

// ❌ 금지: 하위 → 상위 호출
// lib/supabase/client.ts
import { WorkoutCard } from '@/components/workout'; // UI 호출 금지!

// lib/nutrition/index.ts
import { DashboardPage } from '@/app/dashboard'; // Page 호출 금지!
```

---

## 3. Barrel Export 패턴

### 3.1 index.ts 역할

```typescript
// lib/workout/index.ts (공개 API)
export { calculateCalories } from './calorieCalculations';
export { generateWeeklyPlan } from './weeklyPlan';
export { classifyWorkoutType } from './classifyWorkoutType';
export type { WorkoutType, Exercise, WeeklyPlan } from './types';

// 내부 함수는 export하지 않음
// ❌ export { internalHelper } from './internal/helpers';
```

### 3.2 사용 규칙

```typescript
// ✅ 허용: index.ts를 통한 import
import { calculateCalories, WorkoutType } from '@/lib/workout';

// ❌ 금지: 내부 파일 직접 import
import { calculateCalories } from '@/lib/workout/calorieCalculations';
import { internalHelper } from '@/lib/workout/internal/helpers';
```

---

## 4. 순환 의존성 방지

### 4.1 금지 패턴

```typescript
// ❌ 순환 의존성 금지
// lib/nutrition/index.ts
import { getWorkoutPlan } from '@/lib/workout';

// lib/workout/index.ts
import { getMealPlan } from '@/lib/nutrition'; // 순환!
```

### 4.2 해결 패턴

```typescript
// ✅ 공통 모듈 추출
// lib/shared/cross-module.ts
export interface CrossModuleData {
  workoutCalories: number;
  nutritionGoal: number;
}

// lib/nutrition/index.ts
import type { CrossModuleData } from '@/lib/shared/cross-module';

// lib/workout/index.ts
import type { CrossModuleData } from '@/lib/shared/cross-module';
```

### 4.3 의존성 그래프 검증

```bash
# 순환 의존성 검사 (선택적)
npx madge --circular --extensions ts,tsx lib/

# 의존성 그래프 시각화
npx madge --image deps.svg lib/
```

---

## 5. 공개 API vs 내부 구현

### 5.1 공개 API 기준

| 항목       | 공개 (index.ts) | 내부 (internal/) |
| ---------- | --------------- | ---------------- |
| **함수**   | 비즈니스 로직   | 헬퍼, 유틸리티   |
| **타입**   | 도메인 타입     | 내부 상태 타입   |
| **상수**   | 설정값          | 매직 넘버        |
| **클래스** | 서비스 클래스   | 내부 클래스      |

### 5.2 네이밍 규칙

```typescript
// 공개 함수: 동사 + 명사 (명확한 의도)
export function calculateCaloriesBurned(exercise: Exercise): number;
export function generateWeeklyPlan(preferences: UserPreferences): WeeklyPlan;

// 내부 함수: _ 접두사 또는 internal/ 폴더
function _normalizeInput(input: unknown): Input;
// 또는
// lib/workout/internal/normalizeInput.ts
```

---

## 6. 모듈 인터페이스 문서화

### 6.1 필수 JSDoc

```typescript
// lib/workout/index.ts

/**
 * 운동 모듈 공개 API
 *
 * @module lib/workout
 * @description MET 기반 칼로리 계산, 5-Type 운동 분류, 주간 플랜 생성
 *
 * @example
 * import { calculateCalories, WorkoutType } from '@/lib/workout';
 *
 * const calories = calculateCalories({
 *   met: 5.0,
 *   weightKg: 70,
 *   durationMinutes: 30,
 * });
 */

/**
 * MET 기반 칼로리 소모량 계산
 *
 * @param params - 계산 파라미터
 * @param params.met - 운동의 MET 값
 * @param params.weightKg - 사용자 체중 (kg)
 * @param params.durationMinutes - 운동 시간 (분)
 * @returns 소모 칼로리 (kcal)
 *
 * @see {@link ../docs/principles/exercise-physiology.md} MET 공식
 */
export function calculateCalories(params: CalorieParams): number;
```

---

## 7. PR 머지 체크리스트

### 7.1 캡슐화 검증

```markdown
## 캡슐화 체크리스트

- [ ] 새 모듈은 `lib/[domain]/index.ts` 패턴 준수
- [ ] 내부 구현은 `internal/` 폴더 또는 비공개
- [ ] 호출 방향 규칙 준수 (Presentation → Domain → Repository)
- [ ] 순환 의존성 없음
- [ ] index.ts에 공개 API만 export
- [ ] 다른 모듈의 내부 파일 직접 import 없음
- [ ] 공개 함수에 JSDoc 주석
```

### 7.2 ESLint 규칙 (권장)

```javascript
// .eslintrc.js (향후 도입)
module.exports = {
  rules: {
    'import/no-internal-modules': [
      'error',
      {
        allow: ['**/index.ts', '**/types.ts'],
      },
    ],
  },
};
```

---

## 8. 예외 상황

### 8.1 허용되는 예외

| 상황         | 이유                       | 처리                  |
| ------------ | -------------------------- | --------------------- |
| 테스트 코드  | 내부 함수 단위 테스트 필요 | `@internal` 주석 추가 |
| 마이그레이션 | 레거시 코드 점진적 개선    | 기한 명시 TODO        |
| 공유 타입    | 여러 모듈이 사용           | `lib/shared/` 이동    |

### 8.2 예외 문서화

```typescript
/**
 * @internal 테스트 전용 - 직접 import 금지
 */
export function _testOnly_resetState(): void;
```

---

## 9. 모듈별 BOUNDARIES.md

### 9.1 템플릿

```markdown
# [모듈명] 경계 정의

## 공개 API

- `functionName(params): ReturnType` - 설명

## 의존성

- 사용하는 모듈: lib/supabase, lib/gemini
- 사용되는 곳: components/workout/, app/api/workout/

## 금지 사항

- 직접 DB 접근 금지 (lib/supabase 통해서만)
- UI 컴포넌트 import 금지
```

### 9.2 생성 위치

```
lib/
├── workout/
│   ├── BOUNDARIES.md    # 경계 정의
│   ├── index.ts
│   └── ...
├── nutrition/
│   ├── BOUNDARIES.md
│   ├── index.ts
│   └── ...
```

---

## 10. 위반 감지

### 10.1 코드 리뷰 포인트

```
1. import 문 검사
   - 다른 모듈의 내부 파일 import 있는가?
   - index.ts를 통하지 않는 import 있는가?

2. 의존성 방향 검사
   - lib/가 components/를 import하는가?
   - Repository가 Domain을 import하는가?

3. 순환 의존성 검사
   - A → B → A 패턴 있는가?
```

### 10.2 자동 검사 (향후)

```bash
# package.json scripts
"lint:deps": "madge --circular --extensions ts,tsx lib/",
"lint:boundaries": "eslint --rule 'import/no-internal-modules: error' lib/"
```

---

**Version**: 1.0 | **Updated**: 2026-01-19
**관련 규칙**: [00-first-principles.md](./00-first-principles.md)
**관련 문서**: [ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
