# SDD: AI 코치 컨텍스트 강화

> 버전: 1.0
> 작성일: 2026-01-02
> 상태: 구현 완료

---

## 1. 개요

### 1.1 목적

AI 웰니스 코치가 사용자에게 더 맞춤화된 조언을 제공하기 위해 주간 활동 요약 데이터를 컨텍스트에 추가.

### 1.2 핵심 가치

- **개인화 강화**: 사용자의 최근 활동 패턴 기반 조언
- **부담 없는 인사이트**: 압박감 없이 자연스러운 피드백
- **맥락 인식**: "이번 주 3회 운동했네요" 같은 자연스러운 언급

---

## 2. 기능 요구사항

### 2.1 주간 요약 데이터

| 데이터         | 설명                   | 용도                             |
| -------------- | ---------------------- | -------------------------------- |
| `workoutCount` | 최근 7일 운동 횟수     | "이번 주 3회 운동하셨네요"       |
| `avgCalories`  | 평균 섭취 칼로리       | "평균 1,800kcal 드시고 계시네요" |
| `avgProtein`   | 평균 단백질 섭취 (g)   | "단백질 섭취가 좋아요"           |
| `avgCarbs`     | 평균 탄수화물 섭취 (g) | 영양 균형 조언                   |
| `avgFat`       | 평균 지방 섭취 (g)     | 영양 균형 조언                   |

### 2.2 기존 컨텍스트 확장

```typescript
interface UserContext {
  // 기존 필드 유지
  personalColor?: { ... };
  skinAnalysis?: { ... };
  bodyAnalysis?: { ... };
  workout?: { ... };
  nutrition?: { ... };
  recentActivity?: { ... };

  // 신규: 주간 요약
  weeklySummary?: {
    workoutCount?: number;
    avgCalories?: number;
    avgProtein?: number;
    avgCarbs?: number;
    avgFat?: number;
  };
}
```

---

## 3. 데이터 수집

### 3.1 Supabase 쿼리

#### 주간 운동 횟수

```typescript
supabase
  .from('workout_logs')
  .select('id', { count: 'exact', head: true })
  .eq('clerk_user_id', clerkUserId)
  .gte('workout_date', weekAgoStr)
  .lte('workout_date', todayStr);
```

#### 주간 영양 평균

```typescript
supabase
  .from('daily_nutrition_summary')
  .select('total_calories, protein_g, carbs_g, fat_g')
  .eq('clerk_user_id', clerkUserId)
  .gte('date', weekAgoStr)
  .lte('date', todayStr);
```

### 3.2 평균 계산 로직

```typescript
const weeklyNutritionData = weeklyNutritionResult.data;

if (weeklyNutritionData && weeklyNutritionData.length > 0) {
  const count = weeklyNutritionData.length;
  const totals = weeklyNutritionData.reduce(
    (acc, day) => ({
      calories: acc.calories + (day.total_calories || 0),
      protein: acc.protein + (day.protein_g || 0),
      carbs: acc.carbs + (day.carbs_g || 0),
      fat: acc.fat + (day.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  context.weeklySummary = {
    workoutCount: weeklyWorkoutCount,
    avgCalories: Math.round(totals.calories / count),
    avgProtein: Math.round(totals.protein / count),
    avgCarbs: Math.round(totals.carbs / count),
    avgFat: Math.round(totals.fat / count),
  };
}
```

---

## 4. AI 프롬프트 활용

### 4.1 시스템 프롬프트 예시

```text
사용자 주간 활동:
- 이번 주 운동: {workoutCount}회
- 평균 칼로리: {avgCalories}kcal
- 평균 단백질: {avgProtein}g

이 정보를 바탕으로 자연스럽게 대화에 녹여서 조언해주세요.
압박감을 주지 않고, 긍정적인 피드백을 우선하세요.
```

### 4.2 톤앤매너 가이드

| 상황        | 좋은 예                            | 나쁜 예                      |
| ----------- | ---------------------------------- | ---------------------------- |
| 운동 3회    | "이번 주도 꾸준히 하고 계시네요!"  | "목표까지 2회 남았어요"      |
| 운동 0회    | (언급 안 함)                       | "이번 주 운동을 안 하셨네요" |
| 단백질 부족 | "단백질을 조금 더 챙기면 좋겠어요" | "단백질이 부족해요"          |

---

## 5. 성능 최적화

### 5.1 병렬 쿼리

모든 데이터를 `Promise.all`로 병렬 조회:

```typescript
const [
  personalColorResult,
  skinResult,
  bodyResult,
  workoutAnalysisResult,
  workoutStreakResult,
  nutritionSettingsResult,
  nutritionStreakResult,
  todayWorkoutResult,
  todayNutritionResult,
  weeklyWorkoutResult,      // 신규
  weeklyNutritionResult,    // 신규
] = await Promise.all([...]);
```

### 5.2 조건부 포함

데이터가 없으면 필드 자체를 포함하지 않음:

```typescript
if (weeklyWorkoutCount > 0 || weeklyNutritionData.length > 0) {
  context.weeklySummary = { ... };
}
```

---

## 6. 구현 파일

| 파일                   | 변경 내용                     |
| ---------------------- | ----------------------------- |
| `lib/coach/types.ts`   | `weeklySummary` 타입 추가     |
| `lib/coach/context.ts` | 주간 데이터 쿼리 및 계산 로직 |

---

## 7. 테스트 체크리스트

- [x] 주간 운동 0회: weeklySummary.workoutCount 미포함 또는 0
- [x] 주간 영양 기록 없음: weeklySummary 미포함
- [x] 정상 데이터: 모든 평균값 정수로 반올림
- [x] 병렬 쿼리: 성능 저하 없이 데이터 수집

---

## 8. 향후 개선

- [ ] 주간 트렌드 (증가/감소) 계산
- [ ] 월간 요약 추가
- [ ] 사용자 목표 대비 달성률

---

## 9. 참고

- 기존 스펙: [SPEC-AI-CHAT.md](./SPEC-AI-CHAT.md)
- 리서치: [APP-ENHANCEMENT-RESEARCH-2026.md](./APP-ENHANCEMENT-RESEARCH-2026.md)
