# User Preferences 시스템 연동 완료 보고서

> 기존 모듈(N-1, W-1, Beauty)을 통합 User Preferences 시스템과 연동

**작성일**: 2026-01-05
**버전**: 1.0
**상태**: ✅ 완료

---

## 📋 목차

1. [개요](#개요)
2. [구현 내용](#구현-내용)
3. [파일 변경 사항](#파일-변경-사항)
4. [테스트 결과](#테스트-결과)
5. [사용 가이드](#사용-가이드)
6. [Backward Compatibility](#backward-compatibility)
7. [향후 계획](#향후-계획)

---

## 개요

### 목적

기존 모듈(영양, 운동, 뷰티)에서 개별적으로 관리하던 사용자 선호/기피 데이터를 통합 `user_preferences` 시스템으로 마이그레이션하여 일관성과 확장성을 확보합니다.

### 연동 대상

| 모듈         | 기존 필드                        | 새 시스템                              |
| ------------ | -------------------------------- | -------------------------------------- |
| **N-1 영양** | `allergies[]`, `dislikedFoods[]` | `user_preferences` (domain: nutrition) |
| **W-1 운동** | `injuries[]`                     | `user_preferences` (domain: workout)   |
| **Beauty**   | 로컬 상태 (`FavoriteItem[]`)     | `user_preferences` (domain: beauty)    |

---

## 구현 내용

### 1. 변환 헬퍼 함수 (Converters)

**파일**: `lib/preferences/converters.ts`

#### 기능

- 기존 데이터 → UserPreference 변환
- UserPreference → 기존 데이터 역변환 (호환성)

#### 주요 함수

```typescript
// 알레르기 → UserPreference 배열
allergiesToPreferences(allergies: AllergyType[], userId: string)

// 기피 음식 → UserPreference 배열
dislikedFoodsToPreferences(dislikedFoods: string[], userId: string)

// 부상 → UserPreference 배열
injuriesToPreferences(injuries: string[], userId: string)

// 역변환 (호환성용)
preferencesToAllergies(preferences: UserPreference[]): AllergyType[]
preferencesToDislikedFoods(preferences: UserPreference[]): string[]
preferencesToInjuries(preferences: UserPreference[]): string[]
```

#### 매핑 규칙

| 기존 타입     | Domain    | ItemType      | AvoidLevel | AvoidReason | Priority |
| ------------- | --------- | ------------- | ---------- | ----------- | -------- |
| Allergy       | nutrition | food_category | cannot     | allergy     | 5 (최고) |
| Disliked Food | nutrition | food          | avoid      | taste       | 3        |
| Injury        | workout   | body_part     | avoid      | injury      | 4 (높음) |

---

### 2. N-1 영양 온보딩 연동

**파일**: `app/api/nutrition/settings/route.ts`

#### 변경 사항

- POST 엔드포인트에 **Dual Write** 패턴 적용
- 기존 `nutrition_settings` 테이블 저장 후 `user_preferences`에도 저장
- 실패 시에도 기존 로직 정상 동작 (non-critical)

#### 코드 흐름

```typescript
// 1. 기존 테이블 저장 (필수)
await supabase.from('nutrition_settings').upsert({ ... })

// 2. user_preferences 저장 (선택적)
try {
  const preferences = [
    ...allergiesToPreferences(allergies, userId),
    ...dislikedFoodsToPreferences(dislikedFoods, userId),
  ];
  await upsertPreferences(supabase, preferences);
} catch (error) {
  // 에러 로그만, 메인 로직에 영향 없음
}
```

---

### 3. W-1 운동 온보딩 연동

**파일**: `app/(main)/workout/actions.ts`

#### 변경 사항

- `saveWorkoutAnalysisAction` 서버 액션에 **Dual Write** 적용
- `workout_analyses` 저장 후 `user_preferences`에도 저장

#### 코드 흐름

```typescript
// 1. 기존 테이블 저장
await supabase.from('workout_analyses').insert({ ... })

// 2. user_preferences 저장 (선택적)
try {
  const preferences = injuriesToPreferences(injuries, clerkUserId);
  await upsertPreferences(supabase, preferences);
} catch (error) {
  // 에러 로그만
}
```

---

### 4. Beauty 성분 필터 V2

**파일**: `components/beauty/IngredientFavoriteFilterV2.tsx`

#### 변경 사항

- 새로운 V2 컴포넌트 생성 (기존 V1 유지)
- `useUserPreferences` 훅 사용
- 실시간 서버 동기화

#### 주요 기능

```typescript
const { preferences, isLoading, addPreference, removePreference } = useUserPreferences({
  domain: 'beauty',
});

// 성분 추가
await addPreference({
  domain: 'beauty',
  itemType: 'ingredient',
  itemName: '히알루론산',
  itemNameEn: 'Hyaluronic Acid',
  isFavorite: true,
  source: 'user',
});
```

#### Dynamic Export

```typescript
// components/beauty/dynamic.tsx
export const IngredientFavoriteFilterV2Dynamic = dynamic(
  () => import('./IngredientFavoriteFilterV2'),
  { ssr: false }
);
```

---

## 파일 변경 사항

### 신규 파일

| 파일                                               | 용도                    |
| -------------------------------------------------- | ----------------------- |
| `lib/preferences/converters.ts`                    | 변환 헬퍼 함수          |
| `components/beauty/IngredientFavoriteFilterV2.tsx` | 새 성분 필터 컴포넌트   |
| `tests/lib/preferences/converters.test.ts`         | 변환 함수 테스트 (11개) |

### 수정 파일

| 파일                                     | 변경 내용                             |
| ---------------------------------------- | ------------------------------------- |
| `lib/preferences/index.ts`               | Converters export 추가                |
| `app/api/nutrition/settings/route.ts`    | Dual Write 추가                       |
| `app/(main)/workout/actions.ts`          | Dual Write 추가                       |
| `components/beauty/dynamic.tsx`          | V2 export 추가                        |
| `hooks/useUserPreferences.ts`            | 타입 시그니처 수정 (clerkUserId 제외) |
| `tests/hooks/useUserPreferences.test.ts` | 테스트 수정                           |

---

## 테스트 결과

### 1. Type Check

```bash
✅ All packages passed (web, mobile, shared)
```

### 2. Unit Tests

```bash
✅ useUserPreferences.test.ts (10 tests) - PASSED
✅ converters.test.ts (11 tests) - PASSED
```

### 3. 테스트 커버리지

| 모듈                  | 테스트 수 | 커버리지 |
| --------------------- | --------- | -------- |
| converters.ts         | 11        | 100%     |
| useUserPreferences.ts | 10        | 95%+     |

---

## 사용 가이드

### 영양 온보딩에서 알레르기 저장 시

**자동 처리** - 기존 코드 수정 불필요

```typescript
// 기존 코드 (nutrition/result/page.tsx)
await fetch('/api/nutrition/settings', {
  method: 'POST',
  body: JSON.stringify({
    allergies: ['dairy', 'nuts'],
    dislikedFoods: ['브로콜리'],
    // ...
  }),
});

// ✅ user_preferences에 자동 저장됨
// - allergies → cannot/allergy
// - dislikedFoods → avoid/taste
```

### 운동 온보딩에서 부상 저장 시

**자동 처리** - 기존 코드 수정 불필요

```typescript
// 기존 코드 (workout/result/page.tsx)
await saveWorkoutAnalysisAction(userId, {
  injuries: ['knee', 'back'],
  // ...
});

// ✅ user_preferences에 자동 저장됨
// - injuries → avoid/injury
```

### Beauty 페이지에서 성분 필터 사용

**V2 컴포넌트 사용**

```tsx
import { IngredientFavoriteFilterV2Dynamic } from '@/components/beauty/dynamic';

<IngredientFavoriteFilterV2Dynamic />;
// ✅ 실시간 서버 동기화
// ✅ 자동 CRUD
```

---

## Backward Compatibility

### 원칙

1. **기존 필드 유지** - `allergies`, `injuries`, `dislikedFoods` 필드는 그대로 유지
2. **Dual Write** - 기존 테이블 + user_preferences 동시 저장
3. **에러 격리** - user_preferences 저장 실패 시에도 기존 로직 정상 동작
4. **점진적 마이그레이션** - 새 기능부터 V2 사용, 기존 기능은 점진적 전환

### 마이그레이션 전략

| 단계    | 내용                                   | 상태    |
| ------- | -------------------------------------- | ------- |
| Phase 1 | Dual Write 구현                        | ✅ 완료 |
| Phase 2 | 기존 데이터 마이그레이션 스크립트      | 🔄 예정 |
| Phase 3 | 읽기 로직 전환 (user_preferences 우선) | 🔄 예정 |
| Phase 4 | 기존 필드 deprecated                   | 🔄 예정 |

---

## 향후 계획

### 1. 데이터 마이그레이션

```sql
-- 기존 nutrition_settings의 allergies를 user_preferences로 이동
-- 기존 workout_analyses의 injuries를 user_preferences로 이동
```

### 2. 읽기 로직 전환

현재: 기존 필드에서 읽기
변경: `user_preferences`에서 읽기 (Converters로 역변환)

### 3. 확장 기능

- **Style 도메인**: 소재/패턴 선호 추가
- **Color 도메인**: 퍼스널 컬러 기반 색상 선호 추가
- **추천 알고리즘**: user_preferences 기반 제품 필터링

### 4. 분석 기능

```typescript
// 사용자별 기피 패턴 분석
const summary = await getPreferenceSummary(supabase, userId);
// { beauty: { favorites: 5, avoids: 2 }, nutrition: { ... }, ... }
```

---

## 참고 문서

- [SDD-USER-PREFERENCES.md](./SDD-USER-PREFERENCES.md) - 통합 Preference 시스템 설계
- [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) - user_preferences 테이블 스키마
- [CODING-STANDARDS.md](../.claude/rules/coding-standards.md) - 코딩 규칙

---

## 변경 이력

| 날짜       | 버전 | 변경 내용                         |
| ---------- | ---- | --------------------------------- |
| 2026-01-05 | 1.0  | 초기 연동 완료 (N-1, W-1, Beauty) |

---

**작성자**: Claude Code
**검토자**: -
**승인자**: -
