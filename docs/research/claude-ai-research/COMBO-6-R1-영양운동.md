# 영양×운동 조합 분석

> **ID**: COMBO-6
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/analysis/

---

## 1. 개요

### 1.1 영양-운동 시너지

```
운동 전 영양:
├── 탄수화물 → 에너지원
├── 단백질 → 근손실 방지
└── 수분 → 퍼포먼스 유지

운동 후 영양:
├── 단백질 → 근단백질 합성
├── 탄수화물 → 글리코겐 회복
└── 항산화 → 염증 감소
```

### 1.2 핵심 연구 결과

```
ISSN (International Society of Sports Nutrition) 입장:

1. "Anabolic Window" 재정의
   - 기존: 운동 후 30-60분
   - 현재: 글리코겐 회복 4-6시간
           근단백질 합성 24-48시간

2. 운동 + 영양 타이밍
   - 전후 영양 최적화 시:
     - 퍼포먼스 15-30% 향상
     - 회복 시간 24시간 단축
```

---

## 2. 운동 유형별 영양 전략

### 2.1 영양 매핑

```typescript
// lib/analysis/exercise-nutrition-mapping.ts
export interface ExerciseNutrition {
  exerciseType: ExerciseType;
  preWorkout: NutritionPlan;
  duringWorkout: NutritionPlan;
  postWorkout: NutritionPlan;
  dailyRequirements: DailyRequirements;
  hydration: HydrationPlan;
}

export const EXERCISE_NUTRITION_MAP: Record<ExerciseType, ExerciseNutrition> = {
  strength: {
    exerciseType: 'strength',
    preWorkout: {
      timing: '2-3시간 전',
      macros: {
        carbs: { amount: '1-1.5g/kg', sources: ['현미', '고구마', '오트밀'] },
        protein: { amount: '0.3-0.5g/kg', sources: ['닭가슴살', '계란', '그릭요거트'] },
        fat: { amount: '최소화', sources: [] },
      },
      examples: [
        '고구마 200g + 닭가슴살 100g',
        '오트밀 + 프로틴 파우더 + 바나나',
      ],
      notes: '섬유질과 지방 최소화하여 소화 부담 줄이기',
    },
    duringWorkout: {
      timing: '60분 이상 훈련 시',
      macros: {
        carbs: { amount: '30-60g/시간', sources: ['스포츠 음료', '젤'] },
      },
      examples: ['BCAA 음료', '스포츠 드링크'],
      notes: '60분 이하 훈련 시 물로 충분',
    },
    postWorkout: {
      timing: '운동 후 2시간 이내',
      macros: {
        protein: { amount: '0.4-0.5g/kg', sources: ['유청 단백질', '닭가슴살', '연어'] },
        carbs: { amount: '0.8-1.2g/kg', sources: ['흰쌀밥', '감자', '바나나'] },
      },
      examples: [
        '프로틴 쉐이크 + 바나나',
        '연어 + 밥 + 채소',
      ],
      notes: '단백질:탄수화물 = 1:3 비율 권장',
    },
    dailyRequirements: {
      calories: '유지 칼로리 + 200-500',
      protein: '1.6-2.2g/kg',
      carbs: '4-7g/kg',
      fat: '0.5-1.5g/kg',
    },
    hydration: {
      before: '운동 2-3시간 전 500-600ml',
      during: '15-20분마다 150-200ml',
      after: '손실 체중 1kg당 1.5L',
    },
  },

  cardio: {
    exerciseType: 'cardio',
    preWorkout: {
      timing: '1-2시간 전',
      macros: {
        carbs: { amount: '1-2g/kg', sources: ['바나나', '토스트', '에너지바'] },
        protein: { amount: '소량', sources: [] },
      },
      examples: [
        '바나나 + 아몬드 버터',
        '통밀 토스트 + 꿀',
      ],
      notes: '빠른 에너지 공급을 위한 단순 탄수화물',
    },
    duringWorkout: {
      timing: '60분 이상 또는 고강도',
      macros: {
        carbs: { amount: '30-60g/시간', sources: ['젤', '스포츠 음료'] },
      },
      examples: ['에너지 젤', '스포츠 드링크', '건조 과일'],
      notes: '전해질 보충 중요',
    },
    postWorkout: {
      timing: '운동 후 30분-2시간',
      macros: {
        carbs: { amount: '1-1.5g/kg', sources: ['과일', '주스', '감자'] },
        protein: { amount: '0.3g/kg', sources: ['프로틴', '요거트'] },
      },
      examples: [
        '초코우유',
        '과일 스무디 + 프로틴',
      ],
      notes: '글리코겐 빠른 회복이 목표',
    },
    dailyRequirements: {
      calories: '활동량에 따라 조절',
      protein: '1.2-1.6g/kg',
      carbs: '5-10g/kg',
      fat: '0.5-1g/kg',
    },
    hydration: {
      before: '2시간 전 500ml',
      during: '매 15분 150-200ml + 전해질',
      after: '손실량의 150%',
    },
  },

  hiit: {
    exerciseType: 'hiit',
    preWorkout: {
      timing: '1-2시간 전',
      macros: {
        carbs: { amount: '0.5-1g/kg', sources: ['바나나', '오트밀'] },
        protein: { amount: '0.2g/kg', sources: ['요거트', '계란흰자'] },
      },
      examples: [
        '바나나 + 그릭요거트',
        '오트밀 소량 + 베리',
      ],
      notes: '너무 많이 먹으면 구역질 유발',
    },
    duringWorkout: {
      timing: '보통 필요 없음 (30분 이하)',
      macros: {},
      examples: ['물'],
      notes: '짧은 운동이므로 추가 영양 불필요',
    },
    postWorkout: {
      timing: '운동 후 1시간 이내',
      macros: {
        protein: { amount: '0.3-0.4g/kg', sources: ['프로틴', '닭가슴살'] },
        carbs: { amount: '0.5-1g/kg', sources: ['과일', '밥'] },
      },
      examples: [
        '프로틴 쉐이크 + 바나나',
        '계란 스크램블 + 토스트',
      ],
      notes: '회복이 빠르게 필요한 경우 중요',
    },
    dailyRequirements: {
      calories: '목표에 따라',
      protein: '1.4-1.8g/kg',
      carbs: '3-5g/kg',
      fat: '0.5-1g/kg',
    },
    hydration: {
      before: '1시간 전 300-500ml',
      during: '가능하면 물',
      after: '500ml 이상',
    },
  },

  yoga: {
    exerciseType: 'yoga',
    preWorkout: {
      timing: '2-3시간 전 (빈속 권장)',
      macros: {
        carbs: { amount: '가벼운 양', sources: ['과일', '견과류'] },
      },
      examples: [
        '바나나 반 개',
        '견과류 소량',
        '공복 (선호)',
      ],
      notes: '역전 자세 시 불편함 방지',
    },
    duringWorkout: {
      timing: '필요 없음',
      macros: {},
      examples: ['물 소량'],
      notes: '수업 중 음식 섭취 권장하지 않음',
    },
    postWorkout: {
      timing: '운동 후 30분-1시간',
      macros: {
        protein: { amount: '적당량', sources: ['스무디', '샐러드'] },
        carbs: { amount: '적당량', sources: ['과일', '채소'] },
      },
      examples: [
        '그린 스무디',
        '아보카도 토스트',
      ],
      notes: '가볍고 영양가 있는 음식',
    },
    dailyRequirements: {
      calories: '유지 칼로리',
      protein: '0.8-1.2g/kg',
      carbs: '3-5g/kg',
      fat: '적당량',
    },
    hydration: {
      before: '충분히',
      during: '핫요가 시 주의',
      after: '충분히',
    },
  },
};
```

### 2.2 목표별 영양 조정

```typescript
// lib/analysis/goal-nutrition-adjustment.ts
export interface GoalNutritionAdjustment {
  goal: FitnessGoal;
  calorieAdjustment: string;
  macroRatio: MacroRatio;
  mealTiming: string[];
  supplements: Supplement[];
}

export const GOAL_NUTRITION_ADJUSTMENTS: Record<FitnessGoal, GoalNutritionAdjustment> = {
  muscle_gain: {
    goal: 'muscle_gain',
    calorieAdjustment: '+300~500 kcal (약간의 칼로리 잉여)',
    macroRatio: {
      protein: '25-30%',
      carbs: '45-55%',
      fat: '20-25%',
    },
    mealTiming: [
      '하루 4-6끼 (3시간 간격)',
      '운동 전 2-3시간 식사',
      '운동 후 2시간 이내 단백질 식사',
      '취침 전 카제인 (선택)',
    ],
    supplements: [
      { name: '크레아틴', dosage: '5g/일', timing: '언제든지', evidence: '높음' },
      { name: '유청 단백질', dosage: '20-40g', timing: '운동 후', evidence: '높음' },
      { name: 'BCAA', dosage: '5-10g', timing: '운동 중', evidence: '중간' },
    ],
  },

  fat_loss: {
    goal: 'fat_loss',
    calorieAdjustment: '-300~500 kcal (적당한 칼로리 적자)',
    macroRatio: {
      protein: '30-35%',
      carbs: '35-45%',
      fat: '25-30%',
    },
    mealTiming: [
      '하루 3-4끼',
      '단백질 매 끼니 포함',
      '운동 전 가벼운 탄수화물',
      '저녁 탄수화물 줄이기 (선택)',
    ],
    supplements: [
      { name: '유청 단백질', dosage: '20-40g', timing: '식사 대용/간식', evidence: '높음' },
      { name: '카페인', dosage: '3-6mg/kg', timing: '운동 전 30분', evidence: '높음' },
      { name: '오메가-3', dosage: '2-3g', timing: '식사와 함께', evidence: '중간' },
    ],
  },

  endurance: {
    goal: 'endurance',
    calorieAdjustment: '훈련량에 비례하여 조절',
    macroRatio: {
      protein: '15-20%',
      carbs: '55-65%',
      fat: '20-25%',
    },
    mealTiming: [
      '레이스 전 카보로딩 (3일 전부터)',
      '훈련 2-3시간 전 고탄수화물 식사',
      '긴 훈련 중 30-60g/시간 탄수화물',
      '운동 후 즉시 탄수화물 + 단백질',
    ],
    supplements: [
      { name: '전해질', dosage: '훈련 중', timing: '장시간 운동', evidence: '높음' },
      { name: '베타알라닌', dosage: '3-6g/일', timing: '나눠서', evidence: '중간' },
      { name: '비트루트', dosage: '300-500mg 질산염', timing: '운동 전', evidence: '중간' },
    ],
  },

  maintenance: {
    goal: 'maintenance',
    calorieAdjustment: '유지 칼로리',
    macroRatio: {
      protein: '20-25%',
      carbs: '45-55%',
      fat: '25-30%',
    },
    mealTiming: [
      '규칙적인 식사 시간',
      '운동 전후 적당한 영양',
      '균형 잡힌 식단',
    ],
    supplements: [
      { name: '종합비타민', dosage: '1정/일', timing: '식사와 함께', evidence: '중간' },
      { name: '비타민D', dosage: '1000-2000IU', timing: '아침', evidence: '높음' },
    ],
  },
};
```

---

## 3. 통합 분석 시스템

### 3.1 영양-운동 크로스 분석

```typescript
// lib/analysis/nutrition-exercise-cross.ts
export interface NutritionExerciseCrossAnalysis {
  exerciseAnalysis: ExerciseAnalysis;
  nutritionAnalysis: NutritionAnalysis;
  synergies: Synergy[];
  gaps: Gap[];
  recommendations: IntegratedRecommendation[];
  weeklyMealPlan: WeeklyMealPlan;
}

export async function performNutritionExerciseCrossAnalysis(
  userId: string,
  exercisePlan: ExercisePlan,
  nutritionData: NutritionData
): Promise<NutritionExerciseCrossAnalysis> {
  // 1. 운동 유형 분석
  const exerciseTypes = extractExerciseTypes(exercisePlan);

  // 2. 현재 영양 상태 분석
  const nutritionStatus = analyzeNutritionStatus(nutritionData);

  // 3. 시너지 식별
  const synergies = identifySynergies(exerciseTypes, nutritionStatus);

  // 4. 갭 분석
  const gaps = identifyGaps(exercisePlan, nutritionData);

  // 5. 통합 추천 생성
  const recommendations = generateIntegratedRecommendations(
    exerciseTypes,
    nutritionStatus,
    gaps
  );

  // 6. 주간 식단 생성
  const weeklyMealPlan = generateWeeklyMealPlan(exercisePlan, recommendations);

  return {
    exerciseAnalysis: summarizeExercise(exercisePlan),
    nutritionAnalysis: nutritionStatus,
    synergies,
    gaps,
    recommendations,
    weeklyMealPlan,
  };
}

function identifyGaps(
  exercisePlan: ExercisePlan,
  nutritionData: NutritionData
): Gap[] {
  const gaps: Gap[] = [];

  // 단백질 갭
  const proteinNeed = calculateProteinNeed(exercisePlan);
  if (nutritionData.avgDailyProtein < proteinNeed * 0.8) {
    gaps.push({
      type: 'protein_deficit',
      current: nutritionData.avgDailyProtein,
      recommended: proteinNeed,
      impact: '근육 회복 저하, 성장 제한',
      solution: `단백질 섭취를 ${proteinNeed}g으로 증가`,
    });
  }

  // 탄수화물 갭 (지구력 운동)
  if (exercisePlan.primaryType === 'cardio' || exercisePlan.primaryType === 'hiit') {
    const carbNeed = calculateCarbNeed(exercisePlan);
    if (nutritionData.avgDailyCarbs < carbNeed * 0.7) {
      gaps.push({
        type: 'carb_deficit',
        current: nutritionData.avgDailyCarbs,
        recommended: carbNeed,
        impact: '에너지 부족, 퍼포먼스 저하',
        solution: '운동 전후 탄수화물 증가',
      });
    }
  }

  // 수분 갭
  const hydrationNeed = calculateHydrationNeed(exercisePlan);
  if (nutritionData.avgDailyWater < hydrationNeed * 0.8) {
    gaps.push({
      type: 'hydration_deficit',
      current: nutritionData.avgDailyWater,
      recommended: hydrationNeed,
      impact: '퍼포먼스 저하, 회복 지연',
      solution: `일일 ${hydrationNeed}L 이상 수분 섭취`,
    });
  }

  return gaps;
}
```

### 3.2 주간 식단 생성

```typescript
// lib/analysis/meal-plan-generator.ts
export interface DayMealPlan {
  day: string;
  workoutScheduled: boolean;
  workoutType?: ExerciseType;
  meals: Meal[];
  totalCalories: number;
  totalMacros: MacroTotals;
}

export function generateWeeklyMealPlan(
  exercisePlan: ExercisePlan,
  goals: FitnessGoal
): WeeklyMealPlan {
  const days = ['월', '화', '수', '목', '금', '토', '일'];

  return days.map(day => {
    const workout = exercisePlan.schedule[day];
    const isWorkoutDay = !!workout;

    // 운동일/휴식일에 따른 칼로리 조정
    const calorieMultiplier = isWorkoutDay ? 1.15 : 1.0;
    const baseCalories = calculateBaseCalories(goals);
    const targetCalories = Math.round(baseCalories * calorieMultiplier);

    // 운동 유형에 따른 매크로 조정
    const macroRatio = isWorkoutDay
      ? getWorkoutDayMacros(workout.type)
      : getRestDayMacros(goals);

    // 식단 생성
    const meals = generateDayMeals(targetCalories, macroRatio, isWorkoutDay, workout);

    return {
      day,
      workoutScheduled: isWorkoutDay,
      workoutType: workout?.type,
      meals,
      totalCalories: targetCalories,
      totalMacros: calculateMealMacros(meals),
    };
  });
}
```

---

## 4. UI/UX 컴포넌트

### 4.1 영양-운동 타임라인

```tsx
// components/analysis/NutritionExerciseTimeline.tsx
export function NutritionExerciseTimeline({
  dayPlan,
}: {
  dayPlan: DayMealPlan;
}) {
  const timelineItems = [
    ...dayPlan.meals.map(m => ({ type: 'meal', time: m.time, data: m })),
    ...(dayPlan.workoutScheduled
      ? [{ type: 'workout', time: dayPlan.workoutTime, data: dayPlan.workout }]
      : []),
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div data-testid="nutrition-exercise-timeline" className="space-y-4">
      <h3 className="font-bold">오늘의 영양×운동 플랜</h3>

      <div className="relative">
        {/* 타임라인 선 */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        {/* 아이템들 */}
        <div className="space-y-4">
          {timelineItems.map((item, i) => (
            <div key={i} className="flex gap-4 relative">
              {/* 점 */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center z-10',
                  item.type === 'workout' ? 'bg-primary' : 'bg-secondary'
                )}
              >
                {item.type === 'workout' ? '💪' : '🍽️'}
              </div>

              {/* 내용 */}
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{item.time}</p>
                {item.type === 'meal' ? (
                  <MealCard meal={item.data as Meal} />
                ) : (
                  <WorkoutCard workout={item.data as Workout} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 4.2 갭 분석 카드

```tsx
// components/analysis/NutritionGapCard.tsx
export function NutritionGapCard({ gap }: { gap: Gap }) {
  return (
    <Card className="border-destructive/50" data-testid="nutrition-gap-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            ⚠️
          </div>
          <div>
            <h4 className="font-medium">{getGapTitle(gap.type)}</h4>
            <p className="text-sm text-muted-foreground mb-2">{gap.impact}</p>

            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">현재: </span>
                <span className="text-destructive font-medium">
                  {gap.current}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">권장: </span>
                <span className="text-primary font-medium">
                  {gap.recommended}
                </span>
              </div>
            </div>

            <p className="text-sm mt-2 p-2 bg-secondary rounded">
              💡 {gap.solution}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 5. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 운동 유형별 영양 매핑
- [ ] 목표별 영양 조정 로직
- [ ] 기본 갭 분석

### 단기 적용 (P1)

- [ ] 주간 식단 생성기
- [ ] 타임라인 UI
- [ ] 실시간 추적

### 장기 적용 (P2)

- [ ] AI 식단 최적화
- [ ] 음식 DB 연동
- [ ] 칼로리 자동 계산

---

## 6. 참고 자료

- [ISSN Nutrient Timing Position Stand](https://pmc.ncbi.nlm.nih.gov/articles/PMC5596471/)
- [UCLA Health Pre/Post Workout Nutrition](https://www.uclahealth.org/news/article/what-eat-before-and-after-workout-based-your-workout-type)
- [NASM Workout & Nutrition Timing](https://blog.nasm.org/workout-and-nutrition-timing)
- [Post-Exercise Anabolic Window (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3577439/)

---

**Version**: 1.0 | **Priority**: P1 High
