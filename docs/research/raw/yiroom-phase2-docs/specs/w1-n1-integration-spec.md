# W-1 ↔ N-1 모듈 연동 스펙

> **버전**: 1.0.0  
> **작성일**: 2025-12-18  
> **목적**: 운동 모듈과 영양 모듈 간 데이터 연동 정의

---

## 1. 연동 개요

### 1.1 핵심 연동 포인트

```
┌─────────────────────────────────────────────────────────┐
│                    통합 홈 대시보드                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   순 칼로리 = 섭취 칼로리 - 운동 소모 칼로리              │
│                                                         │
│   ┌───────────┐         ┌───────────┐                  │
│   │   W-1     │ ──────► │   N-1     │                  │
│   │ 운동 모듈  │ 소모kcal │ 영양 모듈  │                  │
│   └───────────┘         └───────────┘                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 연동 데이터 흐름

| 출발 | 데이터 | 도착 | 용도 |
|------|--------|------|------|
| W-1 | `calories_burned` | N-1 | 잔여 칼로리 계산 |
| W-1 | `workout_completed` | 통합 홈 | 오늘의 요약 |
| N-1 | `calories_consumed` | 통합 홈 | 오늘의 요약 |
| N-1 | `nutrition_logged` | 통합 홈 | 오늘의 요약 |

---

## 2. 데이터베이스 연동

### 2.1 공유 테이블: `daily_wellness_summary`

```sql
-- 일별 통합 웰니스 요약 (새 테이블)
CREATE TABLE daily_wellness_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- 영양 데이터 (N-1에서 업데이트)
  calories_consumed INTEGER DEFAULT 0,
  calories_target INTEGER DEFAULT 0,
  protein_consumed INTEGER DEFAULT 0,
  carbs_consumed INTEGER DEFAULT 0,
  fat_consumed INTEGER DEFAULT 0,
  nutrition_logged BOOLEAN DEFAULT FALSE,
  
  -- 운동 데이터 (W-1에서 업데이트)
  calories_burned INTEGER DEFAULT 0,
  workout_duration INTEGER DEFAULT 0,  -- 분
  workout_completed BOOLEAN DEFAULT FALSE,
  workouts_count INTEGER DEFAULT 0,
  
  -- 계산 필드
  net_calories INTEGER GENERATED ALWAYS AS (calories_consumed - calories_burned) STORED,
  
  -- 스트릭 (통합)
  both_completed BOOLEAN GENERATED ALWAYS AS (nutrition_logged AND workout_completed) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- RLS
ALTER TABLE daily_wellness_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own summary"
  ON daily_wellness_summary
  FOR ALL
  USING (auth.uid()::text = user_id);

-- 인덱스
CREATE INDEX idx_daily_wellness_user_date ON daily_wellness_summary(user_id, date);
```

### 2.2 기존 테이블 연동

```sql
-- daily_nutrition_logs에 burned_calories 컬럼 추가
ALTER TABLE daily_nutrition_logs 
ADD COLUMN burned_calories INTEGER DEFAULT 0;

-- 잔여 칼로리 계산용 뷰
CREATE VIEW v_daily_calorie_balance AS
SELECT 
  user_id,
  date,
  total_calories AS consumed,
  burned_calories AS burned,
  target_calories AS target,
  (target_calories - total_calories + burned_calories) AS remaining
FROM daily_nutrition_logs;
```

---

## 3. API 연동

### 3.1 운동 완료 시 → 영양 모듈 업데이트

```typescript
// app/actions/workout.ts

export async function completeWorkoutSession(
  sessionId: string,
  summary: WorkoutSummary
) {
  const supabase = createClient();
  const { userId } = auth();
  const today = new Date().toISOString().split('T')[0];
  
  // 1. 운동 세션 완료 처리
  await supabase
    .from('workout_sessions')
    .update({
      status: 'completed',
      actual_calories: summary.calories,
      actual_duration: summary.duration,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
  
  // 2. 일별 운동 목표 업데이트
  await supabase
    .from('daily_workout_goals')
    .upsert({
      user_id: userId,
      date: today,
      completed_sets: summary.sets,
      total_calories_burned: summary.calories,
      is_completed: true,
    });
  
  // 3. ⭐ 영양 모듈에 소모 칼로리 반영
  await syncBurnedCaloriesToNutrition(userId, today, summary.calories);
  
  // 4. ⭐ 통합 요약 업데이트
  await updateDailyWellnessSummary(userId, today, {
    calories_burned: summary.calories,
    workout_duration: summary.duration,
    workout_completed: true,
    workouts_count: 1, // increment
  });
  
  // 5. 스트릭 & 포인트
  await updateWorkoutStreak(userId);
  await grantWorkoutRewards(userId, summary);
  
  return { success: true };
}

// 영양 모듈에 소모 칼로리 동기화
async function syncBurnedCaloriesToNutrition(
  userId: string,
  date: string,
  caloriesBurned: number
) {
  const supabase = createClient();
  
  // daily_nutrition_logs의 burned_calories 업데이트
  const { data: existing } = await supabase
    .from('daily_nutrition_logs')
    .select('burned_calories')
    .eq('user_id', userId)
    .eq('date', date)
    .single();
  
  if (existing) {
    // 기존 값에 추가 (여러 운동 가능)
    await supabase
      .from('daily_nutrition_logs')
      .update({
        burned_calories: (existing.burned_calories || 0) + caloriesBurned,
      })
      .eq('user_id', userId)
      .eq('date', date);
  } else {
    // 새로 생성
    await supabase
      .from('daily_nutrition_logs')
      .insert({
        user_id: userId,
        date: date,
        burned_calories: caloriesBurned,
        total_calories: 0,
        target_calories: 1800, // 기본값, 프로필에서 가져오기
      });
  }
}
```

### 3.2 통합 요약 업데이트 함수

```typescript
// app/actions/wellness.ts

interface WellnessUpdate {
  // 영양
  calories_consumed?: number;
  calories_target?: number;
  protein_consumed?: number;
  carbs_consumed?: number;
  fat_consumed?: number;
  nutrition_logged?: boolean;
  
  // 운동
  calories_burned?: number;
  workout_duration?: number;
  workout_completed?: boolean;
  workouts_count?: number;
}

export async function updateDailyWellnessSummary(
  userId: string,
  date: string,
  update: WellnessUpdate
) {
  const supabase = createClient();
  
  // Upsert로 있으면 업데이트, 없으면 생성
  const { error } = await supabase
    .from('daily_wellness_summary')
    .upsert(
      {
        user_id: userId,
        date: date,
        ...update,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,date',
        // 증분 업데이트가 필요한 필드는 별도 처리
      }
    );
  
  if (error) throw error;
}

// 통합 요약 조회
export async function getDailyWellnessSummary(userId: string, date?: string) {
  const supabase = createClient();
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('daily_wellness_summary')
    .select('*')
    .eq('user_id', userId)
    .eq('date', targetDate)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  
  // 기본값 반환
  return data || {
    calories_consumed: 0,
    calories_target: 1800,
    calories_burned: 0,
    net_calories: 0,
    nutrition_logged: false,
    workout_completed: false,
  };
}
```

### 3.3 N-1 식단 기록 시 → 통합 요약 업데이트

```typescript
// app/actions/nutrition.ts

export async function logMeal(input: MealLogInput) {
  // ... 기존 식단 기록 로직 ...
  
  // 일일 합계 계산
  const dailyTotals = await calculateDailyTotals(userId, today);
  
  // ⭐ 통합 요약 업데이트
  await updateDailyWellnessSummary(userId, today, {
    calories_consumed: dailyTotals.calories,
    protein_consumed: dailyTotals.protein,
    carbs_consumed: dailyTotals.carbs,
    fat_consumed: dailyTotals.fat,
    calories_target: userProfile.target_calories,
    nutrition_logged: true,
  });
  
  // ... 스트릭 & 포인트 ...
}
```

---

## 4. 통합 홈 대시보드 연동

### 4.1 데이터 페칭

```typescript
// app/(protected)/home/page.tsx

export default async function IntegratedHomePage() {
  const { userId } = auth();
  const today = new Date().toISOString().split('T')[0];
  
  // 통합 요약 조회
  const summary = await getDailyWellnessSummary(userId, today);
  
  // 개별 모듈 상세 (필요시)
  const [workoutData, nutritionData] = await Promise.all([
    getTodayWorkoutSummary(userId),
    getTodayNutritionSummary(userId),
  ]);
  
  return (
    <IntegratedDashboard
      summary={summary}
      workout={workoutData}
      nutrition={nutritionData}
    />
  );
}
```

### 4.2 UI 표시 로직

```typescript
// 통합 칼로리 표시
interface CalorieDisplayProps {
  consumed: number;    // 섭취
  burned: number;      // 운동 소모
  target: number;      // 목표
}

function CalorieDisplay({ consumed, burned, target }: CalorieDisplayProps) {
  const net = consumed - burned;           // 순 칼로리
  const remaining = target - net;          // 잔여 칼로리
  const progress = (net / target) * 100;   // 진행률
  
  return (
    <div>
      {/* 메인 표시: 잔여 칼로리 */}
      <ProgressRing progress={progress}>
        <span className="text-3xl font-bold">{remaining}</span>
        <span className="text-sm text-gray-500">kcal 남음</span>
      </ProgressRing>
      
      {/* 상세 내역 */}
      <div className="flex justify-between text-sm">
        <span>섭취 {consumed}</span>
        <span>-</span>
        <span>운동 {burned}</span>
        <span>=</span>
        <span>순 {net}</span>
      </div>
    </div>
  );
}
```

---

## 5. 실시간 업데이트 전략

### 5.1 Optimistic Update

```typescript
// stores/wellnessStore.ts (Zustand)

interface WellnessState {
  summary: DailyWellnessSummary | null;
  
  // 운동 완료 시 즉시 반영
  addBurnedCalories: (calories: number) => void;
  
  // 식단 기록 시 즉시 반영
  addConsumedCalories: (calories: number, macros: Macros) => void;
  
  // 서버 동기화
  syncWithServer: () => Promise<void>;
}

export const useWellnessStore = create<WellnessState>((set, get) => ({
  summary: null,
  
  addBurnedCalories: (calories) => {
    set((state) => ({
      summary: state.summary ? {
        ...state.summary,
        calories_burned: state.summary.calories_burned + calories,
      } : null,
    }));
  },
  
  addConsumedCalories: (calories, macros) => {
    set((state) => ({
      summary: state.summary ? {
        ...state.summary,
        calories_consumed: state.summary.calories_consumed + calories,
        protein_consumed: state.summary.protein_consumed + macros.protein,
        carbs_consumed: state.summary.carbs_consumed + macros.carbs,
        fat_consumed: state.summary.fat_consumed + macros.fat,
      } : null,
    }));
  },
  
  syncWithServer: async () => {
    const data = await getDailyWellnessSummary();
    set({ summary: data });
  },
}));
```

### 5.2 Revalidation 전략

```typescript
// 운동 완료 후 홈 리밸리데이션
import { revalidatePath } from 'next/cache';

export async function completeWorkoutSession(...) {
  // ... 완료 처리 ...
  
  // 관련 페이지 캐시 무효화
  revalidatePath('/home');
  revalidatePath('/nutrition');
  revalidatePath('/workout/history');
}

// 식단 기록 후 홈 리밸리데이션
export async function logMeal(...) {
  // ... 기록 처리 ...
  
  revalidatePath('/home');
  revalidatePath('/workout'); // 운동 페이지에서도 순칼로리 표시 가능
}
```

---

## 6. 주간/월간 통합 통계

### 6.1 주간 통합 조회

```typescript
// app/actions/wellness.ts

export async function getWeeklyWellnessSummary(userId: string) {
  const supabase = createClient();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { data, error } = await supabase
    .from('daily_wellness_summary')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });
  
  if (error) throw error;
  
  // 집계
  const summary = {
    totalCaloriesConsumed: 0,
    totalCaloriesBurned: 0,
    avgNetCalories: 0,
    daysWithWorkout: 0,
    daysWithNutrition: 0,
    daysWithBoth: 0,
    dailyData: data,
  };
  
  data.forEach(day => {
    summary.totalCaloriesConsumed += day.calories_consumed;
    summary.totalCaloriesBurned += day.calories_burned;
    if (day.workout_completed) summary.daysWithWorkout++;
    if (day.nutrition_logged) summary.daysWithNutrition++;
    if (day.both_completed) summary.daysWithBoth++;
  });
  
  summary.avgNetCalories = Math.round(
    (summary.totalCaloriesConsumed - summary.totalCaloriesBurned) / data.length
  );
  
  return summary;
}
```

---

## 7. 체크리스트

### 구현 순서

```
1. [ ] daily_wellness_summary 테이블 생성
2. [ ] daily_nutrition_logs에 burned_calories 추가
3. [ ] updateDailyWellnessSummary 함수 구현
4. [ ] completeWorkoutSession에 연동 로직 추가
5. [ ] logMeal에 연동 로직 추가
6. [ ] 통합 홈 대시보드 연동
7. [ ] Zustand store 구현 (선택)
8. [ ] 주간 통계 연동
```

### 테스트 시나리오

```
1. [ ] 운동 완료 → 영양 대시보드 잔여 칼로리 변화 확인
2. [ ] 식단 기록 → 통합 홈 순 칼로리 변화 확인
3. [ ] 여러 운동 완료 → 소모 칼로리 누적 확인
4. [ ] 날짜 변경 → 새 날짜 데이터 초기화 확인
5. [ ] 주간 통계 → 7일 집계 정확성 확인
```

---

## 📎 빠른 참조

### 칼로리 계산 공식

```
잔여 칼로리 = 목표 칼로리 - (섭취 칼로리 - 운동 소모 칼로리)
           = 목표 - 순 칼로리
           = target - (consumed - burned)
```

### 연동 트리거 이벤트

| 이벤트 | 업데이트 대상 |
|--------|--------------|
| 운동 세션 완료 | `daily_wellness_summary.calories_burned` |
| | `daily_nutrition_logs.burned_calories` |
| 식단 기록 | `daily_wellness_summary.calories_consumed` |
| | `daily_wellness_summary.nutrition_logged` |

---

**연동 관련 문의:**
```
W-1/N-1 연동 중 [상황 설명] 문제가 있어.
해결 방법 알려줘.
```
