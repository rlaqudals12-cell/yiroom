# 스트레칭 생리학 원리

> 이 문서는 이룸 플랫폼의 스트레칭 모듈(W-2)의 기반이 되는 생리학적 원리를 설명한다.
>
> **소스 리서치**: exercise-physiology.md 확장, W-2 Stretching 스펙

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 개인화 스트레칭 추천 시스템"

- 사용자의 체형, 유연성, 운동 이력 기반 맞춤 스트레칭
- 실시간 자세 피드백 및 교정
- 부상 예방 및 회복 최적화
- 장기적 유연성 향상 추적 및 목표 설정
```

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 개인 변동 | 연령, 성별, 유전에 따른 유연성 차이 |
| 측정 한계 | 스마트폰만으로 정밀 ROM 측정 어려움 |
| 실시간 피드백 | 지연 시간, 센서 정확도 한계 |
| 안전성 | 부적절한 스트레칭으로 인한 부상 위험 |

### 100점 기준

- ROM(Range of Motion) 측정 정확도 ±5도 이내
- 스트레칭 효과(유연성 향상) 80% 이상 체감
- 부상 위험 경고 정확도 90% 이상
- 개인화 추천 만족도 85% 이상

### 현재 목표: 70%

- 주요 근육군 12개 대상 스트레칭 가이드
- 운동 전/후 스트레칭 루틴 제공
- 기본 ROM 추정 (체형 분석 연동)
- 통증/불편 부위 기반 추천

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 실시간 자세 교정 | 고급 센서/카메라 필요 | 웨어러블 연동 시 |
| 재활 스트레칭 | 의료 영역, 전문가 지도 필요 | 전문가 연동 시 |
| PNF 스트레칭 | 파트너 필요, 자가 수행 어려움 | 향후 검토 |

---

## 1. 핵심 개념

### 1.1 근육 해부학적 구조

#### 근육-건 단위 (Muscle-Tendon Unit, MTU)

```
┌─────────────────────────────────────────────────┐
│                근육-건 단위 (MTU)                 │
├─────────────────────────────────────────────────┤
│                                                 │
│   건(Tendon) ─── 근육(Muscle) ─── 건(Tendon)    │
│       │              │              │           │
│       ▼              ▼              ▼           │
│   [뼈 부착]    [수축 조직]     [뼈 부착]         │
│                                                 │
│   ┌─────────── 근육 내부 ───────────┐           │
│   │                                 │           │
│   │  근섬유 (Muscle Fiber)          │           │
│   │      │                          │           │
│   │      ├── 근원섬유 (Myofibril)   │           │
│   │      │       │                  │           │
│   │      │       └── 근절 (Sarcomere)│          │
│   │      │            (수축 단위)   │           │
│   │      │                          │           │
│   │      └── 결합조직 (Fascia)      │           │
│   │           (탄성 요소)           │           │
│   │                                 │           │
│   └─────────────────────────────────┘           │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 탄성 요소

| 요소 | 위치 | 역할 |
|------|------|------|
| **직렬 탄성 요소 (SEC)** | 건, 근막 | 스트레칭 시 주요 신장 부위 |
| **병렬 탄성 요소 (PEC)** | 근막, 근내막 | 이완 상태 저항 제공 |
| **수축 요소 (CE)** | 근절 (액틴-미오신) | 능동 수축 생성 |

### 1.2 스트레칭 유형

| 유형 | 영문명 | 특징 | 권장 시점 |
|------|--------|------|----------|
| **정적 스트레칭** | Static | 고정 자세 15-60초 유지 | 운동 후, 취침 전 |
| **동적 스트레칭** | Dynamic | 움직임 동반, 반복 수행 | 운동 전 |
| **탄도성 스트레칭** | Ballistic | 반동 이용, 빠른 움직임 | 비권장 (부상 위험) |
| **PNF 스트레칭** | PNF | 수축-이완 반복 | 전문가 지도 하 |
| **능동 스트레칭** | Active | 근육 자체 힘으로 유지 | 운동 전/중 |

### 1.3 유연성 (Flexibility) 정의

**유연성**: 관절의 가동 범위(ROM)와 주변 조직의 신장 능력

**영향 요인**:
- 관절 구조 (골격적 제한)
- 근육-건 단위 길이
- 결합조직 탄성
- 신경근 조절 (근긴장)
- 온도 (높을수록 유연)
- 연령, 성별, 유전

---

## 2. 수학적/물리학적 기반

### 2.1 점탄성 모델 (Viscoelastic Model)

근육-건 단위는 점탄성(Viscoelastic) 특성을 가진다.

#### 스프링-댐퍼 모델

```
┌─────────────────────────────────────────┐
│     Maxwell Model (직렬 배열)            │
│                                         │
│     ─┬─ [Spring] ─── [Damper] ─┬─      │
│      │                         │        │
│                                         │
├─────────────────────────────────────────┤
│     Kelvin-Voigt Model (병렬 배열)       │
│                                         │
│        ┌── [Spring] ──┐                 │
│     ───┤              ├───              │
│        └── [Damper] ──┘                 │
│                                         │
└─────────────────────────────────────────┘
```

#### 응력-변형률 관계

$$\sigma(t) = E \cdot \varepsilon(t) + \eta \cdot \frac{d\varepsilon}{dt}$$

- $\sigma$: 응력 (Stress)
- $\varepsilon$: 변형률 (Strain)
- $E$: 탄성 계수 (Elastic Modulus)
- $\eta$: 점성 계수 (Viscosity)

#### 응력 이완 (Stress Relaxation)

정적 스트레칭 중 장력 감소:

$$\sigma(t) = \sigma_0 \cdot e^{-t/\tau}$$

- $\sigma_0$: 초기 응력
- $\tau$: 이완 시간 상수 (보통 10-30초)
- 이완 시간 상수가 짧을수록 빠르게 이완

### 2.2 가동 범위 (ROM) 정량화

#### 관절각 측정

$$ROM = \theta_{max} - \theta_{min}$$

**주요 관절 정상 ROM**:

| 관절 | 동작 | 정상 ROM | 유연성 기준 |
|------|------|----------|------------|
| 어깨 | 굴곡 | 180° | >170° 양호 |
| 어깨 | 외회전 | 90° | >80° 양호 |
| 고관절 | 굴곡 | 120° | >100° 양호 |
| 고관절 | 신전 | 30° | >20° 양호 |
| 무릎 | 굴곡 | 135° | >120° 양호 |
| 발목 | 배굴 | 20° | >15° 양호 |
| 척추 | 전굴 | 손끝-바닥 | 0cm 이하 양호 |

### 2.3 스트레칭 효과 공식

#### 크리프 (Creep)

지속적 하중 하에서 길이 증가:

$$\varepsilon(t) = \varepsilon_0 + \frac{\sigma_0}{\eta} \cdot t$$

#### 최적 스트레칭 시간

연구 기반 권장 시간:

$$T_{optimal} = 15 + (Age - 20) \times 0.5 \text{ (초)}$$

- 20세: 15초
- 40세: 25초
- 60세: 35초

---

## 3. 구현 도출

### 3.1 스트레칭 추천 알고리즘

```typescript
interface StretchingRecommendation {
  targetMuscle: MuscleGroup;
  stretchType: 'static' | 'dynamic' | 'active';
  duration: number;       // 초
  repetitions: number;
  intensity: 'light' | 'moderate' | 'deep';
  precautions: string[];
  videoGuideUrl?: string;
}

type MuscleGroup =
  | 'neck'
  | 'shoulders'
  | 'chest'
  | 'upper_back'
  | 'lower_back'
  | 'hip_flexors'
  | 'glutes'
  | 'hamstrings'
  | 'quadriceps'
  | 'calves'
  | 'adductors'
  | 'it_band';

interface UserProfile {
  age: number;
  flexibility: 'low' | 'average' | 'high';
  injuryHistory: string[];
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  targetGoal: 'warmup' | 'cooldown' | 'flexibility' | 'pain_relief';
  painAreas: MuscleGroup[];
}

function generateStretchingPlan(
  profile: UserProfile,
  workoutType?: WorkoutType
): StretchingRecommendation[] {
  const recommendations: StretchingRecommendation[] = [];

  // 기본 스트레칭 시간 계산
  const baseDuration = calculateBaseDuration(profile.age);

  // 유연성 수준에 따른 조정
  const durationMultiplier = getDurationMultiplier(profile.flexibility);

  // 목표에 따른 스트레칭 유형 결정
  const stretchType = profile.targetGoal === 'warmup' ? 'dynamic' : 'static';

  // 대상 근육군 결정
  const targetMuscles = determineTargetMuscles(
    profile.targetGoal,
    profile.painAreas,
    workoutType
  );

  for (const muscle of targetMuscles) {
    const rec: StretchingRecommendation = {
      targetMuscle: muscle,
      stretchType,
      duration: Math.round(baseDuration * durationMultiplier),
      repetitions: stretchType === 'dynamic' ? 10 : 2,
      intensity: getIntensityForProfile(profile),
      precautions: getPrecautions(muscle, profile.injuryHistory),
    };

    recommendations.push(rec);
  }

  return recommendations;
}

function calculateBaseDuration(age: number): number {
  // 연령 기반 최적 시간 (초)
  return Math.round(15 + (age - 20) * 0.5);
}

function getDurationMultiplier(flexibility: UserProfile['flexibility']): number {
  switch (flexibility) {
    case 'low': return 1.3;      // 더 긴 시간 필요
    case 'average': return 1.0;
    case 'high': return 0.8;     // 짧아도 효과적
  }
}

function determineTargetMuscles(
  goal: UserProfile['targetGoal'],
  painAreas: MuscleGroup[],
  workoutType?: WorkoutType
): MuscleGroup[] {
  // 통증 부위 우선
  if (painAreas.length > 0) {
    return [...painAreas, ...getRelatedMuscles(painAreas)];
  }

  // 운동 유형에 따른 근육군
  if (workoutType) {
    return getMusclesForWorkout(workoutType, goal);
  }

  // 기본 전신 스트레칭
  return [
    'neck',
    'shoulders',
    'hamstrings',
    'hip_flexors',
    'lower_back',
    'calves',
  ];
}
```

### 3.2 운동 전/후 스트레칭 루틴

```typescript
interface StretchingRoutine {
  phase: 'pre_workout' | 'post_workout' | 'standalone';
  totalDuration: number;  // 분
  exercises: StretchingRecommendation[];
  notes: string[];
}

function createPreWorkoutRoutine(
  workoutType: WorkoutType,
  profile: UserProfile
): StretchingRoutine {
  const targetMuscles = getMusclesForWorkout(workoutType, 'warmup');

  const exercises = targetMuscles.map(muscle => ({
    targetMuscle: muscle,
    stretchType: 'dynamic' as const,
    duration: 30,  // 동적 스트레칭은 짧게
    repetitions: 10,
    intensity: 'moderate' as const,
    precautions: getPrecautions(muscle, profile.injuryHistory),
  }));

  return {
    phase: 'pre_workout',
    totalDuration: Math.ceil(exercises.length * 0.75),  // 분
    exercises,
    notes: [
      '동적 스트레칭으로 근육 온도를 높입니다',
      '통증이 느껴지면 즉시 중단하세요',
      '호흡을 멈추지 마세요',
    ],
  };
}

function createPostWorkoutRoutine(
  workoutType: WorkoutType,
  profile: UserProfile
): StretchingRoutine {
  const targetMuscles = getMusclesForWorkout(workoutType, 'cooldown');
  const baseDuration = calculateBaseDuration(profile.age);

  const exercises = targetMuscles.map(muscle => ({
    targetMuscle: muscle,
    stretchType: 'static' as const,
    duration: baseDuration,
    repetitions: 2,
    intensity: 'moderate' as const,
    precautions: getPrecautions(muscle, profile.injuryHistory),
  }));

  return {
    phase: 'post_workout',
    totalDuration: Math.ceil(exercises.length * 1.5),  // 분
    exercises,
    notes: [
      '정적 스트레칭으로 근육 이완을 돕습니다',
      '각 자세에서 15-30초 유지하세요',
      '깊고 규칙적인 호흡을 유지하세요',
      '반동을 주지 마세요',
    ],
  };
}

// 운동 유형별 대상 근육
function getMusclesForWorkout(
  workoutType: WorkoutType,
  phase: 'warmup' | 'cooldown'
): MuscleGroup[] {
  const muscleMap: Record<WorkoutType, MuscleGroup[]> = {
    running: ['hip_flexors', 'hamstrings', 'quadriceps', 'calves', 'it_band'],
    cycling: ['quadriceps', 'hip_flexors', 'lower_back', 'calves'],
    swimming: ['shoulders', 'chest', 'upper_back', 'hip_flexors'],
    weight_training: ['chest', 'shoulders', 'upper_back', 'lower_back', 'hamstrings'],
    yoga: [], // 요가는 스트레칭 자체
    hiit: ['hip_flexors', 'hamstrings', 'shoulders', 'calves'],
  };

  return muscleMap[workoutType] || ['hamstrings', 'hip_flexors', 'shoulders'];
}
```

### 3.3 유연성 평가

```typescript
interface FlexibilityAssessment {
  testName: string;
  targetArea: MuscleGroup;
  measurement: number;
  unit: 'degrees' | 'cm';
  rating: 'poor' | 'fair' | 'good' | 'excellent';
  percentile: number;  // 연령/성별 대비
}

const FLEXIBILITY_NORMS: Record<string, { male: number[]; female: number[] }> = {
  // Sit-and-Reach Test (cm)
  sit_reach: {
    male: [-10, 0, 10, 20],      // [poor, fair, good, excellent]
    female: [-5, 5, 15, 25],
  },
  // Shoulder Flexibility (cm, 양손 사이 거리)
  shoulder_reach: {
    male: [20, 10, 5, 0],        // 작을수록 좋음
    female: [15, 8, 3, 0],
  },
};

function assessFlexibility(
  testName: string,
  value: number,
  age: number,
  gender: 'male' | 'female'
): FlexibilityAssessment['rating'] {
  const norms = FLEXIBILITY_NORMS[testName]?.[gender];
  if (!norms) return 'fair';

  // 연령 보정 (-0.5cm per decade after 30)
  const ageAdjustment = Math.max(0, (age - 30) / 10) * 0.5;
  const adjustedValue = value + ageAdjustment;

  if (adjustedValue >= norms[3]) return 'excellent';
  if (adjustedValue >= norms[2]) return 'good';
  if (adjustedValue >= norms[1]) return 'fair';
  return 'poor';
}
```

---

## 4. 검증 방법

### 4.1 스트레칭 효과 검증

**단기 효과 (즉시)**:
- ROM 측정 (스트레칭 전후 비교)
- 근긴장도 감소 (주관적 평가)

**장기 효과 (4-8주)**:
- 기준선 대비 ROM 향상률
- 자가 평가 유연성 점수
- 통증/불편감 감소

### 4.2 추천 품질 검증

```typescript
interface RecommendationQuality {
  relevance: number;     // 사용자 목표와의 관련성 (0-100)
  safety: number;        // 안전성 점수 (0-100)
  effectiveness: number; // 효과성 점수 (0-100)
  userSatisfaction: number; // 사용자 만족도 (0-100)
}

// 목표 기준
const QUALITY_TARGETS: RecommendationQuality = {
  relevance: 85,
  safety: 95,
  effectiveness: 75,
  userSatisfaction: 80,
};
```

### 4.3 안전성 검증

- 부상 발생률 모니터링 (목표: <1%)
- 금기 조건 필터링 정확도 (목표: 100%)
- 사용자 불편 보고 추적

---

## 5. 안전 가이드라인

### 5.1 일반 원칙

```
스트레칭 안전 수칙

1. 통증은 경고 신호입니다
   - 약간의 당김은 정상, 날카로운 통증은 즉시 중단

2. 호흡을 유지하세요
   - 스트레칭 중 호흡을 멈추지 마세요
   - 내쉬면서 더 깊이 스트레칭

3. 반동을 주지 마세요
   - 탄도성 스트레칭은 부상 위험

4. 점진적으로 진행하세요
   - 매일 조금씩, 무리하지 않기

5. 워밍업 후 스트레칭하세요
   - 차가운 근육은 더 쉽게 손상됨
```

### 5.2 금기 사항

| 상태 | 피해야 할 스트레칭 | 대안 |
|------|-------------------|------|
| 급성 염좌/좌상 | 해당 부위 모든 스트레칭 | RICE 처치, 회복 후 시작 |
| 관절 불안정 | 끝 범위 스트레칭 | 가벼운 범위 내 유지 |
| 골다공증 | 강한 전굴/회전 | 서서 하는 가벼운 스트레칭 |
| 임신 중기 이후 | 과도한 복부 스트레칭 | 옆으로 누운 자세 |

### 5.3 연령별 주의사항

```typescript
function getAgePrecautions(age: number): string[] {
  if (age < 18) {
    return [
      '성장판 보호를 위해 과도한 스트레칭 피하기',
      '부모/감독자 동반 권장',
    ];
  }
  if (age >= 60) {
    return [
      '의자나 벽을 잡고 균형 유지',
      '갑작스러운 자세 변화 피하기',
      '스트레칭 시간을 길게, 강도는 낮게',
    ];
  }
  return [];
}
```

---

## 6. 참고 자료

- Alter, M.J. (2004). Science of Flexibility, 3rd Edition
- Page, P. (2012). "Current concepts in muscle stretching for exercise and rehabilitation." IJSPT 7(1): 109-119
- Behm, D.G. & Chaouachi, A. (2011). "A review of the acute effects of static and dynamic stretching on performance." EJAP 111(11): 2633-2651
- ACSM's Guidelines for Exercise Testing and Prescription, 11th Edition

---

## 7. 관련 문서

### 구현 스펙 (이 원리를 적용하는 문서)

| 문서 | 설명 |
|------|------|
| [SDD-W-2-ADVANCED-STRETCHING](../specs/SDD-W-2-ADVANCED-STRETCHING.md) | W-2 스트레칭 모듈 스펙 |
| [SDD-W1-WORKOUT](../specs/SDD-W1-WORKOUT.md) | W-1 운동 모듈 (연동) |

### 관련 원리 문서

| 문서 | 설명 |
|------|------|
| [exercise-physiology.md](./exercise-physiology.md) | 운동 생리학 기반 |
| [body-mechanics.md](./body-mechanics.md) | 체형/자세 분석 |

---

**Version**: 1.0 | **Created**: 2026-01-29
**소스 리서치**: exercise-physiology.md 확장
**관련 모듈**: W-2 Stretching, W-1 Workout
