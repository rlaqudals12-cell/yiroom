# ADR-031: 운동 모듈 아키텍처 (W-1)

## 상태

`accepted`

## 날짜

2026-01-19

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"사용자의 모든 운동이 과학적으로 최적화되고 전체 웰니스와 통합되는 상태"

- **완벽한 개인화**: 체형, 목표, 컨디션, 장비에 맞는 실시간 운동 조정
- **실시간 폼 코칭**: 카메라로 자세 분석 및 즉각 피드백
- **예측적 추천**: AI가 피로, 회복, 성장 예측하여 선제적 플랜 조정
- **완전 통합**: 영양(N-1), 피부(S-1), 퍼스널컬러(PC-1) 실시간 연동

### 물리적 한계

| 항목 | 한계 |
|------|------|
| MET 정확도 | 개인 차이 반영 불가 (대사율 20% 편차) |
| 실시간 폼 분석 | 모바일 카메라 각도/위치 제약 |
| 회복 예측 | HRV 등 생체 데이터 없이 정밀도 한계 |
| 장비 인식 | 자동 장비 감지 현재 불가능 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 운동 추천 정확도 | 90% 만족도 | 75% | AI 추천 |
| 칼로리 계산 정확도 | ±10% | ±25% | MET 기반 |
| 주간 플랜 완주율 | 80% | 60% | 난이도 조절 |
| 크로스 모듈 연동 | 100% | 70% | PC-1, S-1, N-1 |

### 현재 목표: 75%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 실시간 폼 분석 | 모바일 ML 복잡도 | Phase 3 |
| HRV 기반 회복 | 웨어러블 연동 필요 | 헬스킷 통합 후 |
| RPE/1RM 기반 강도 | 사용자 교육 필요 | 고급 사용자 모드 |
| 소셜 운동 | 핵심 기능 우선 | 소셜 피드 안정화 후 |

---

## 맥락 (Context)

이룸은 체형 분석(C-1) 결과를 기반으로 개인화된 운동 추천과 실시간 세션 추적 기능이 필요합니다. 영양(N-1), 피부(S-1) 모듈과 통합되어 전체적인 웰니스 관리를 제공해야 합니다.

### 요구사항

1. **운동 추천**: 체형, 목표, 장비 기반 AI 추천
2. **주간 플랜**: 7일 운동 계획 자동 생성
3. **세션 추적**: 실시간 세트/반복/무게 기록
4. **칼로리 계산**: MET 기반 소모 칼로리 추정
5. **크로스 모듈 통합**: 영양 타이밍, 운동 후 스킨케어 연계

## 결정 (Decision)

**5-Type 운동 분류 + MET 기반 칼로리 시스템** 아키텍처 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                   운동 모듈 아키텍처 (W-1)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  5-Type 운동 분류                                            │
│  ├── Toner: 근력 유지, 토닝                                 │
│  ├── Builder: 근비대, 벌크업                                │
│  ├── Burner: 유산소, 지방 연소                              │
│  ├── Mover: 기능성 움직임, 스포츠                           │
│  └── Flexer: 유연성, 스트레칭                               │
│                                                              │
│  운동 데이터베이스                                           │
│  └── 200+ 운동 (장비, 난이도, 근육 그룹, MET 값)            │
│                                                              │
│  AI 추천 엔진 (Gemini)                                       │
│  ├── 입력: 체형(C-1), 목표, 장비, 장소, 피트니스 레벨       │
│  ├── 출력: 개인화 운동 리스트                               │
│  └── 폴백: Mock 데이터 (3초 타임아웃)                       │
│                                                              │
│  주간 플랜 생성                                              │
│  ├── Push/Pull/Legs 또는 Full-Body 스플릿                   │
│  ├── 휴식일 자동 배치                                       │
│  └── 난이도 점진적 증가                                     │
│                                                              │
│  세션 추적 (Sprint 3)                                        │
│  ├── 실시간 세트/반복/무게 기록                             │
│  ├── 자동 휴식 타이머                                       │
│  └── 운동별 폼 가이드 (YouTube 연동)                        │
│                                                              │
│  칼로리 계산                                                 │
│  └── MET × 체중(kg) × 시간(h) = 소모 칼로리                 │
│                                                              │
│  크로스 모듈 인사이트                                        │
│  ├── PC-1 연동: 운동복 컬러 추천                            │
│  ├── S-1 연동: 운동 후 스킨케어 가이드                      │
│  └── N-1 연동: 운동 전후 영양 타이밍                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5-Type 운동 분류 시스템

```typescript
type WorkoutType = 'toner' | 'builder' | 'burner' | 'mover' | 'flexer';

const WORKOUT_TYPE_DEFINITIONS = {
  toner: {
    name: '토너',
    description: '근력 유지 및 토닝',
    repRange: [12, 20],
    sets: [2, 3],
    restSeconds: 45,
  },
  builder: {
    name: '빌더',
    description: '근비대 및 벌크업',
    repRange: [6, 12],
    sets: [4, 5],
    restSeconds: 90,
  },
  burner: {
    name: '버너',
    description: '유산소 및 지방 연소',
    repRange: [15, 30],
    sets: [3, 4],
    restSeconds: 30,
  },
  mover: {
    name: '무버',
    description: '기능성 움직임',
    repRange: [8, 15],
    sets: [3, 4],
    restSeconds: 60,
  },
  flexer: {
    name: '플렉서',
    description: '유연성 및 스트레칭',
    repRange: [1, 3],  // holds
    sets: [2, 3],
    restSeconds: 30,
  },
};
```

### MET 기반 칼로리 계산

```typescript
// MET (Metabolic Equivalent of Task) 값
const EXERCISE_MET_VALUES = {
  squats: 5.0,
  deadlifts: 6.0,
  benchPress: 5.0,
  running: 9.8,
  walking: 3.5,
  cycling: 7.5,
  yoga: 2.5,
  stretching: 2.3,
};

// 칼로리 계산
function calculateCaloriesBurned(
  met: number,
  weightKg: number,
  durationMinutes: number
): number {
  // 공식: MET × 체중(kg) × 시간(h)
  const durationHours = durationMinutes / 60;
  return Math.round(met * weightKg * durationHours);
}
```

### 주간 스플릿 로직

```typescript
interface WeeklyPlan {
  days: DayPlan[];
  totalVolume: number;
  estimatedCalories: number;
}

interface DayPlan {
  dayOfWeek: number;
  focus: 'upper' | 'lower' | 'full' | 'rest' | 'cardio';
  exercises: Exercise[];
  estimatedDuration: number;
}

// 빈도별 스플릿 자동 결정
function determineWeeklySplit(
  daysPerWeek: number,
  goal: WorkoutGoal
): SplitType {
  if (daysPerWeek <= 3) {
    return 'full-body';  // 주 3회 이하: 전신 운동
  } else if (daysPerWeek <= 5) {
    return 'upper-lower';  // 주 4-5회: 상체/하체 분리
  } else {
    return 'push-pull-legs';  // 주 6회: PPL
  }
}
```

### 휴식 타이머 자동 조절

```typescript
const REST_TIMER_BY_CATEGORY = {
  upper: 60,    // 상체: 60초
  lower: 90,    // 하체: 90초 (더 큰 근육)
  core: 45,     // 코어: 45초
  cardio: 30,   // 유산소: 30초
};

// 운동 유형별 휴식 시간
function getRestDuration(
  exercise: Exercise,
  workoutType: WorkoutType
): number {
  const baseRest = REST_TIMER_BY_CATEGORY[exercise.category];

  // 빌더 타입은 휴식 시간 증가
  if (workoutType === 'builder') {
    return baseRest * 1.5;
  }
  // 버너 타입은 휴식 시간 감소
  if (workoutType === 'burner') {
    return baseRest * 0.5;
  }

  return baseRest;
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| Push/Pull/Legs만 | 검증된 방식 | 초보자 어려움 | `LOW_ACCESSIBILITY` |
| RPE 기반 | 개인화 높음 | 학습 곡선 | `HIGH_COMPLEXITY` - 사용자 교육 필요 |
| 1RM % 기반 | 정확한 강도 | 1RM 테스트 필요 | `HIGH_BARRIER` - 진입 장벽 |
| 3분류 (근력/유산소/유연성) | 단순 | 표현력 부족 | `LOW_EXPRESSIVITY` |

## 결과 (Consequences)

### 긍정적 결과

- **직관적 분류**: 5가지 타입으로 명확한 목표 설정
- **과학적 칼로리**: MET 기반 정확한 추정
- **실시간 추적**: 세션 중 진행 상황 파악
- **통합 경험**: 영양/스킨케어 연계 조언

### 부정적 결과

- **단순화 비용**: 세부적 프로그래밍 어려움
- **MET 한계**: 개인 차이 반영 제한

### 리스크 완화

- AI 추천 실패 → **200+ 운동 DB에서 규칙 기반 추천**
- 개인 차이 → **세션 피드백으로 점진적 조정**

## 구현 가이드

### 파일 구조

```
app/api/workout/
├── recommend/route.ts         # AI 운동 추천
├── plan/route.ts              # 주간 플랜 생성
├── session/route.ts           # 세션 추적
├── history/route.ts           # 기록 조회
└── settings/route.ts          # 설정

lib/workout/
├── exercises.ts               # 200+ 운동 DB
├── classifyWorkoutType.ts     # 5-Type 분류
├── calculations.ts            # 볼륨/강도 계산
├── calorieCalculations.ts     # MET 기반 칼로리
├── weeklyPlan.ts              # 주간 플랜 생성
├── streak.ts                  # 연속 기록
├── styleRecommendations.ts    # PC-1 연동
├── skinTips.ts                # S-1 연동
├── nutritionTips.ts           # N-1 연동
├── shoppingLinks.ts           # 장비 어필리에이트
└── best5-generator.ts         # Top 5 추천

components/workout/
├── dashboard/                 # 대시보드
├── planning/                  # 플랜 관리
├── session/                   # 세션 추적
├── results/                   # 결과 표시
├── streak/                    # 연속 기록
├── history/                   # 기록
└── common/                    # 공통
```

### 운동 데이터 구조

```typescript
interface Exercise {
  id: string;
  name: string;
  nameKo: string;
  category: 'upper' | 'lower' | 'core' | 'cardio';
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  met: number;
  videoUrl?: string;  // YouTube 폼 가이드
  tips: string[];
}

// 예시
const SQUAT: Exercise = {
  id: 'squat',
  name: 'Squat',
  nameKo: '스쿼트',
  category: 'lower',
  muscleGroups: ['quads', 'glutes', 'hamstrings'],
  equipment: ['bodyweight', 'barbell', 'dumbbell'],
  difficulty: 'beginner',
  met: 5.0,
  videoUrl: 'https://youtube.com/...',
  tips: ['무릎이 발끝을 넘지 않게', '허리를 곧게 유지'],
};
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 운동 생리학](../principles/exercise-physiology.md) - MET, 근육 역학, 회복 이론
- [원리: 체형 역학](../principles/body-mechanics.md) - 체형별 운동 적합성

### 관련 ADR/스펙
- [ADR-011: Cross-Module Data Flow](./ADR-011-cross-module-data-flow.md) - 모듈 간 데이터 흐름
- [ADR-003: AI 모델 선택](./ADR-003-ai-model-selection.md) - Gemini 타임아웃/폴백
- [ADR-030: Nutrition 모듈](./ADR-030-nutrition-module.md) - W-1 ↔ N-1 통합

## 구현 스펙

이 ADR을 구현하는 스펙 문서:

| 스펙 | 상태 | 설명 |
|------|------|------|
| [SDD-W1-WORKOUT](../specs/SDD-W1-WORKOUT.md) | ✅ 구현됨 | 운동 추천, 5-Type, MET, 세션 추적 |

### 핵심 구현 파일

```
app/api/workout/
├── recommend/route.ts        # AI 운동 추천
├── plan/route.ts             # 주간 플랜
├── session/route.ts          # 세션 추적
└── history/route.ts          # 기록 조회

lib/workout/
├── exercises.ts              # 200+ 운동 DB
├── classifyWorkoutType.ts    # 5-Type 분류
├── calorieCalculations.ts    # MET 칼로리
├── weeklyPlan.ts             # 주간 플랜
└── nutritionTips.ts          # N-1 연동

components/workout/
├── dashboard/                # 대시보드
├── session/                  # 세션 추적
└── planning/                 # 플랜 관리
```

---

**Author**: Claude Code
**Reviewed by**: -
