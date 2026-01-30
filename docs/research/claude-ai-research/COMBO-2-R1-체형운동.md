# 체형×운동 조합 분석

> **ID**: COMBO-2
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/analysis/

---

## 1. 개요

### 1.1 체형 분류 시스템

```
전통적 소마토타입 (Somatotype):
┌─────────────────────────────────────────────────┐
│                                                 │
│  Ectomorph (외배엽형)                           │
│  ├── 특징: 마른 체형, 긴 팔다리, 좁은 어깨      │
│  └── 대사: 빠름, 근육 성장 어려움               │
│                                                 │
│  Mesomorph (중배엽형)                           │
│  ├── 특징: 근육질, 넓은 어깨, 탄탄한 체형       │
│  └── 대사: 중간, 근육 성장 용이                 │
│                                                 │
│  Endomorph (내배엽형)                           │
│  ├── 특징: 넓은 허리, 지방 축적 용이            │
│  └── 대사: 느림, 근력 성장 가능                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 1.2 현대적 관점 (2025)

```
⚠️ 소마토타입의 한계:

1. 과학적 근거 부족
   - 예측력 낮음
   - 개인 차이 설명 불가

2. 실제로 중요한 요소
   - 훈련 경력 (Training Age)
   - 호르몬 상태
   - 회복 능력
   - 생활 습관

결론: 가이드라인으로 활용, 절대 기준 아님
```

---

## 2. 체형별 운동 권장

### 2.1 운동 매핑

```typescript
// lib/analysis/body-exercise-mapping.ts
export interface BodyTypeExercise {
  bodyType: BodyType;
  primaryFocus: string[];
  secondaryFocus: string[];
  exerciseTypes: ExerciseRecommendation[];
  frequency: string;
  intensity: string;
  tips: string[];
  avoid: string[];
}

export const BODY_TYPE_EXERCISE_MAP: Record<BodyType, BodyTypeExercise> = {
  ectomorph: {
    bodyType: 'ectomorph',
    primaryFocus: ['근비대', '근력 증가'],
    secondaryFocus: ['체중 증가'],
    exerciseTypes: [
      {
        type: 'compound',
        exercises: ['스쿼트', '데드리프트', '벤치프레스', '풀업', '로우'],
        setsReps: '3-4세트 x 6-10회',
        rest: '2-3분',
      },
    ],
    frequency: '주 3-4회',
    intensity: '중상 (RPE 7-8)',
    tips: [
      '복합 운동 중심',
      '충분한 휴식 (세트간, 일간)',
      '점진적 과부하',
      '칼로리 잉여 필수',
    ],
    avoid: ['과도한 유산소', '고빈도 훈련'],
  },

  mesomorph: {
    bodyType: 'mesomorph',
    primaryFocus: ['근력', '근비대', '운동능력'],
    secondaryFocus: ['체지방 관리'],
    exerciseTypes: [
      {
        type: 'strength',
        exercises: ['모든 복합 운동', '고립 운동 혼합'],
        setsReps: '4세트 x 8-12회',
        rest: '60-90초',
      },
      {
        type: 'cardio',
        exercises: ['HIIT', '스프린트'],
        duration: '20-30분',
        frequency: '주 2-3회',
      },
    ],
    frequency: '주 4-5회',
    intensity: '중상~상 (RPE 7-9)',
    tips: [
      '다양한 운동 가능',
      '식단 관리 병행',
      '과훈련 주의',
    ],
    avoid: ['식단 무관심'],
  },

  endomorph: {
    bodyType: 'endomorph',
    primaryFocus: ['체지방 감소', '근력 유지'],
    secondaryFocus: ['심폐지구력'],
    exerciseTypes: [
      {
        type: 'resistance',
        exercises: ['복합 운동', '서킷 트레이닝'],
        setsReps: '3-4세트 x 10-15회',
        rest: '45-60초',
      },
      {
        type: 'cardio',
        exercises: ['유산소', '걷기', '수영', '사이클'],
        duration: '30-45분',
        frequency: '주 3-5회',
      },
    ],
    frequency: '주 4-5회',
    intensity: '중 (RPE 6-7)',
    tips: [
      '서킷 트레이닝 효과적',
      'NEAT 증가 (비운동 활동)',
      '식단 관리 필수',
    ],
    avoid: ['극단적 칼로리 제한'],
  },

  // 이룸 체형 분류 추가
  rectangle: {
    bodyType: 'rectangle',
    primaryFocus: ['전체 균형', '곡선 생성'],
    secondaryFocus: ['코어 강화'],
    exerciseTypes: [
      {
        type: 'shaping',
        exercises: ['숄더프레스', '힙쓰러스트', '레터럴 레이즈'],
        setsReps: '3세트 x 12-15회',
        rest: '60초',
      },
    ],
    frequency: '주 3-4회',
    intensity: '중',
    tips: ['어깨/엉덩이 강조로 허리 대비 곡선 생성'],
    avoid: ['옆구리 운동 과다 (허리 더 두꺼워짐)'],
  },

  invertedTriangle: {
    bodyType: 'invertedTriangle',
    primaryFocus: ['하체 강화', '균형 개선'],
    secondaryFocus: ['코어'],
    exerciseTypes: [
      {
        type: 'lower',
        exercises: ['스쿼트', '런지', '힙쓰러스트', '레그프레스'],
        setsReps: '4세트 x 10-12회',
        rest: '90초',
      },
    ],
    frequency: '주 4회',
    intensity: '중상',
    tips: ['하체 볼륨 업으로 상하 균형'],
    avoid: ['어깨/등 과다 훈련'],
  },

  triangle: {
    bodyType: 'triangle',
    primaryFocus: ['상체 강화', '균형 개선'],
    secondaryFocus: ['코어'],
    exerciseTypes: [
      {
        type: 'upper',
        exercises: ['푸시업', '풀업', '숄더프레스', '로우'],
        setsReps: '4세트 x 10-12회',
        rest: '90초',
      },
    ],
    frequency: '주 4회',
    intensity: '중상',
    tips: ['상체 볼륨 업으로 상하 균형'],
    avoid: ['하체 과다 훈련 (더 강조됨)'],
  },

  hourglass: {
    bodyType: 'hourglass',
    primaryFocus: ['현재 비율 유지', '토닝'],
    secondaryFocus: ['전체 균형'],
    exerciseTypes: [
      {
        type: 'maintenance',
        exercises: ['전신 운동', '필라테스', '요가'],
        setsReps: '3세트 x 12-15회',
        rest: '60초',
      },
    ],
    frequency: '주 3-4회',
    intensity: '중',
    tips: ['균형 잡힌 전신 운동'],
    avoid: ['특정 부위만 과다 훈련'],
  },
};
```

### 2.2 자세 교정 연계

```typescript
// lib/analysis/posture-exercise-mapping.ts
export interface PostureExercise {
  posture: PostureIssue;
  targetMuscles: string[];
  strengthenExercises: Exercise[];
  stretchExercises: Exercise[];
  dailyHabits: string[];
  duration: string; // 개선 기대 기간
}

export const POSTURE_EXERCISE_MAP: Record<PostureIssue, PostureExercise> = {
  forwardHead: {
    posture: 'forwardHead',
    targetMuscles: ['경추신전근', '승모근 하부', '능형근'],
    strengthenExercises: [
      {
        name: '친 턱',
        description: '턱을 뒤로 당기듯이 넣기',
        duration: '10회 x 3세트',
        frequency: '매일',
      },
      {
        name: 'Y-T-W 레이즈',
        description: '엎드려서 Y-T-W 모양으로 팔 들기',
        duration: '10회 x 3세트',
        frequency: '주 3회',
      },
    ],
    stretchExercises: [
      {
        name: '흉쇄유돌근 스트레칭',
        description: '고개를 옆으로 기울여 목 측면 늘리기',
        duration: '30초 x 3세트',
        frequency: '매일',
      },
    ],
    dailyHabits: [
      '모니터 높이 눈높이로 조정',
      '스마트폰 사용 시 눈높이로',
      '베개 높이 조절',
    ],
    duration: '4-8주',
  },

  roundedShoulders: {
    posture: 'roundedShoulders',
    targetMuscles: ['능형근', '승모근 중부', '후삼각근'],
    strengthenExercises: [
      {
        name: '페이스 풀',
        description: '케이블을 얼굴 높이로 당기기',
        duration: '15회 x 3세트',
        frequency: '주 3회',
      },
      {
        name: '밴드 풀 아파트',
        description: '밴드를 양손으로 잡고 가슴 높이에서 벌리기',
        duration: '15회 x 3세트',
        frequency: '주 3회',
      },
    ],
    stretchExercises: [
      {
        name: '가슴 스트레칭',
        description: '문틀에 팔을 대고 앞으로 기울이기',
        duration: '30초 x 3세트',
        frequency: '매일',
      },
    ],
    dailyHabits: [
      '장시간 앉기 피하기',
      '30분마다 스트레칭',
      '의자 등받이 사용',
    ],
    duration: '6-12주',
  },

  anteriorPelvicTilt: {
    posture: 'anteriorPelvicTilt',
    targetMuscles: ['복근', '둔근', '햄스트링'],
    strengthenExercises: [
      {
        name: '데드버그',
        description: '누워서 반대쪽 팔다리 뻗기',
        duration: '10회 x 3세트 (양쪽)',
        frequency: '주 3회',
      },
      {
        name: '글루트 브릿지',
        description: '누워서 엉덩이 들기',
        duration: '15회 x 3세트',
        frequency: '주 3회',
      },
    ],
    stretchExercises: [
      {
        name: '장요근 스트레칭',
        description: '런지 자세에서 뒤쪽 고관절 앞면 늘리기',
        duration: '30초 x 3세트',
        frequency: '매일',
      },
    ],
    dailyHabits: [
      '장시간 앉기 피하기',
      '코어 의식적 사용',
      '하이힐 자제',
    ],
    duration: '8-16주',
  },

  scoliosis: {
    posture: 'scoliosis',
    targetMuscles: ['코어 전체', '등 근육'],
    strengthenExercises: [
      {
        name: '플랭크',
        description: '팔꿈치 짚고 몸 일직선 유지',
        duration: '30-60초 x 3세트',
        frequency: '주 4회',
      },
      {
        name: '버드독',
        description: '네발 자세에서 반대쪽 팔다리 뻗기',
        duration: '10회 x 3세트',
        frequency: '주 4회',
      },
    ],
    stretchExercises: [
      {
        name: '캣카우',
        description: '네발 자세에서 등 둥글게/오목하게',
        duration: '10회',
        frequency: '매일',
      },
    ],
    dailyHabits: [
      '한쪽으로 가방 매지 않기',
      '균형 잡힌 자세',
      '전문가 상담 권장',
    ],
    duration: '장기 관리 필요',
  },
};
```

---

## 3. 개인화 루틴 생성

### 3.1 루틴 생성 알고리즘

```typescript
// lib/analysis/routine-generator.ts
export interface RoutineConfig {
  bodyType: BodyType;
  postureIssues: PostureIssue[];
  fitnessGoal: FitnessGoal;
  availableTime: number; // 분
  availableDays: number; // 주당 일수
  equipment: Equipment[];
  experience: 'beginner' | 'intermediate' | 'advanced';
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  weeklySchedule: DayRoutine[];
  totalDuration: number;
  difficulty: string;
  focus: string[];
  progressionPlan: ProgressionWeek[];
}

export function generatePersonalizedRoutine(
  config: RoutineConfig
): WorkoutRoutine {
  const { bodyType, postureIssues, fitnessGoal, availableTime, availableDays } = config;

  // 1. 기본 템플릿 선택
  const baseTemplate = selectBaseTemplate(bodyType, fitnessGoal);

  // 2. 자세 교정 운동 추가
  const postureExercises = postureIssues.flatMap(issue =>
    POSTURE_EXERCISE_MAP[issue].strengthenExercises
  );

  // 3. 시간에 맞게 조정
  const adjustedRoutine = adjustForTime(baseTemplate, availableTime);

  // 4. 장비에 맞게 대체
  const equipmentAdjusted = adjustForEquipment(adjustedRoutine, config.equipment);

  // 5. 경험 수준에 따른 난이도 조정
  const finalRoutine = adjustForExperience(equipmentAdjusted, config.experience);

  // 6. 점진적 과부하 계획
  const progressionPlan = createProgressionPlan(finalRoutine, 8); // 8주

  return {
    id: generateId(),
    name: `${bodyType} ${fitnessGoal} 루틴`,
    weeklySchedule: distributeAcrossWeek(finalRoutine, availableDays),
    totalDuration: calculateTotalDuration(finalRoutine),
    difficulty: getDifficultyLabel(config.experience),
    focus: [
      ...BODY_TYPE_EXERCISE_MAP[bodyType].primaryFocus,
      ...postureIssues.map(p => `${p} 교정`),
    ],
    progressionPlan,
  };
}

function selectBaseTemplate(
  bodyType: BodyType,
  goal: FitnessGoal
): ExerciseTemplate[] {
  const bodyExercises = BODY_TYPE_EXERCISE_MAP[bodyType].exerciseTypes;

  switch (goal) {
    case 'muscle_gain':
      return bodyExercises.filter(e => e.type === 'compound' || e.type === 'strength');
    case 'fat_loss':
      return [...bodyExercises, { type: 'cardio', exercises: ['HIIT'], duration: '20분' }];
    case 'maintenance':
      return bodyExercises.map(e => ({ ...e, setsReps: reduceSets(e.setsReps) }));
    case 'posture':
      return []; // 자세 교정 운동만
    default:
      return bodyExercises;
  }
}
```

### 3.2 점진적 난이도 조절

```typescript
// lib/analysis/progression.ts
export interface ProgressionWeek {
  week: number;
  intensity: number; // 0-100
  volumeMultiplier: number;
  notes: string;
}

export function createProgressionPlan(
  routine: ExerciseRoutine,
  weeks: number
): ProgressionWeek[] {
  const plan: ProgressionWeek[] = [];

  for (let week = 1; week <= weeks; week++) {
    // 4주 주기 (3주 증가, 1주 휴식)
    const cycleWeek = (week - 1) % 4;

    if (cycleWeek === 3) {
      // 디로드 주
      plan.push({
        week,
        intensity: 60,
        volumeMultiplier: 0.7,
        notes: '디로드 주 - 회복에 집중',
      });
    } else {
      // 점진적 증가
      const baseIntensity = 70 + (cycleWeek * 5);
      const cycleNumber = Math.floor((week - 1) / 4);
      const progressedIntensity = Math.min(baseIntensity + (cycleNumber * 5), 95);

      plan.push({
        week,
        intensity: progressedIntensity,
        volumeMultiplier: 1 + (cycleWeek * 0.1),
        notes: `${cycleWeek + 1}/4주차 - ${getProgressionNote(cycleWeek)}`,
      });
    }
  }

  return plan;
}

function getProgressionNote(cycleWeek: number): string {
  switch (cycleWeek) {
    case 0: return '기초 다지기';
    case 1: return '볼륨 증가';
    case 2: return '강도 증가';
    default: return '';
  }
}
```

---

## 4. 통합 분석 시스템

### 4.1 체형-운동 크로스 분석

```typescript
// lib/analysis/body-exercise-cross.ts
export interface BodyExerciseCrossAnalysis {
  bodyAnalysis: BodyAnalysisResult;
  currentActivity: ActivityLevel;
  recommendations: ExerciseRecommendation[];
  postureCorrections: PostureCorrection[];
  progressionPath: ProgressionPath;
  warnings: string[];
}

export async function performBodyExerciseCrossAnalysis(
  userId: string,
  bodyAnalysis: BodyAnalysisResult
): Promise<BodyExerciseCrossAnalysis> {
  // 1. 현재 활동량 평가
  const currentActivity = await getUserActivityLevel(userId);

  // 2. 체형 기반 추천
  const bodyTypeRec = BODY_TYPE_EXERCISE_MAP[bodyAnalysis.bodyType];

  // 3. 자세 교정 추천
  const postureCorrections = bodyAnalysis.postureIssues.map(issue => ({
    issue,
    exercises: POSTURE_EXERCISE_MAP[issue],
    priority: calculatePosturePriority(issue, bodyAnalysis),
  }));

  // 4. 통합 추천 생성
  const recommendations = generateExerciseRecommendations(
    bodyTypeRec,
    postureCorrections,
    currentActivity
  );

  // 5. 진행 경로 계획
  const progressionPath = planProgressionPath(bodyAnalysis, currentActivity);

  // 6. 경고 사항
  const warnings = generateWarnings(bodyAnalysis, currentActivity);

  return {
    bodyAnalysis,
    currentActivity,
    recommendations,
    postureCorrections,
    progressionPath,
    warnings,
  };
}
```

---

## 5. UI/UX 설계

### 5.1 운동 추천 카드

```tsx
// components/analysis/ExerciseRecommendationCard.tsx
export function ExerciseRecommendationCard({
  recommendation,
}: {
  recommendation: ExerciseRecommendation;
}) {
  return (
    <Card data-testid="exercise-recommendation-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant={recommendation.priority}>
            {recommendation.priority === 'high' ? '핵심' : '보조'}
          </Badge>
          <CardTitle>{recommendation.name}</CardTitle>
        </div>
        <CardDescription>{recommendation.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 운동 목록 */}
          <div>
            <h4 className="font-medium mb-2">추천 운동</h4>
            <ul className="space-y-2">
              {recommendation.exercises.map((ex, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-primary">{ex.icon}</span>
                  <span>{ex.name}</span>
                  <span className="text-muted-foreground text-sm">
                    {ex.setsReps}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 주의사항 */}
          {recommendation.tips.length > 0 && (
            <div className="bg-secondary/50 p-3 rounded-lg">
              <h4 className="font-medium mb-1">팁</h4>
              <ul className="text-sm space-y-1">
                {recommendation.tips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5.2 주간 루틴 뷰

```tsx
// components/analysis/WeeklyRoutineView.tsx
export function WeeklyRoutineView({ routine }: { routine: WorkoutRoutine }) {
  const days = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div data-testid="weekly-routine-view" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{routine.name}</h3>
        <Badge>{routine.difficulty}</Badge>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const dayRoutine = routine.weeklySchedule[index];
          const isRestDay = !dayRoutine || dayRoutine.type === 'rest';

          return (
            <div
              key={day}
              className={cn(
                'p-3 rounded-lg text-center',
                isRestDay ? 'bg-secondary/30' : 'bg-primary/10'
              )}
            >
              <div className="font-medium">{day}</div>
              {isRestDay ? (
                <span className="text-sm text-muted-foreground">휴식</span>
              ) : (
                <div className="text-sm">
                  <div className="font-medium">{dayRoutine.focus}</div>
                  <div className="text-muted-foreground">
                    {dayRoutine.duration}분
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 6. 2026 트렌드: AI 개인화

### 6.1 AI 기반 루틴 조정

```typescript
// lib/analysis/ai-routine-adjustment.ts
export async function adjustRoutineWithAI(
  routine: WorkoutRoutine,
  feedback: UserFeedback
): Promise<WorkoutRoutine> {
  // AI가 사용자 피드백을 분석하여 루틴 조정
  const prompt = `
사용자 피드백:
- 난이도 느낌: ${feedback.difficultyFeel}
- 소요 시간: ${feedback.actualDuration}분 (계획: ${routine.totalDuration}분)
- 통증/불편: ${feedback.painPoints.join(', ')}
- 선호 운동: ${feedback.preferredExercises.join(', ')}

현재 루틴을 조정해주세요.
`;

  const adjustedRoutine = await generateWithGemini(prompt);
  return parseAdjustedRoutine(adjustedRoutine);
}
```

---

## 7. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 체형별 운동 매핑 데이터
- [ ] 자세 교정 운동 데이터
- [ ] 기본 루틴 생성 함수

### 단기 적용 (P1)

- [ ] 개인화 루틴 생성기
- [ ] 점진적 과부하 계획
- [ ] UI 컴포넌트

### 장기 적용 (P2)

- [ ] AI 기반 루틴 조정
- [ ] 운동 영상 연동
- [ ] 실시간 피드백 시스템

---

## 8. 참고 자료

- [NASM Body Types Training Guide](https://www.nasm.org/resource-center/blog/body-types-how-to-train-diet-for-your-body-type)
- [Somatotypes Science Review (Swolverine)](https://swolverine.com/blogs/blog/are-somatotypes-still-relevant-the-science-behind-body-types-in-fitness)
- [2026 Fitness Trends (Women's Health)](https://www.womenshealthmag.com/fitness/a69888034/fitness-trends-2026/)
- [Transparent Labs Somatotype Guide](https://www.transparentlabs.com/blogs/all/three-body-types-diet-exercise-somatotype)

---

**Version**: 1.0 | **Priority**: P1 High
