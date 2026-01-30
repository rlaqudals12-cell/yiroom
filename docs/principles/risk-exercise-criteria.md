# 위험 운동 기준 원리

> 이 문서는 이룸 플랫폼의 운동 추천 시 안전성 평가 기준을 설명한다.
>
> **소스 리서치**: exercise-physiology.md, ACSM/NSCA 가이드라인

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 운동 안전성 평가 시스템"

- 사용자의 건강 상태, 체형, 부상 이력 기반 실시간 위험도 평가
- 잠재적 위험 운동 자동 필터링
- 안전한 대체 운동 즉시 제안
- 점진적 난이도 조절로 부상 예방
```

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 의료 정보 | 사용자 자가 신고 의존, 검증 불가 |
| 개인 변동 | 동일 운동도 개인별 위험도 차이 |
| 실시간 모니터링 | 운동 중 자세/상태 파악 한계 |
| 책임 범위 | 법적/의료적 책임 한계 |

### 100점 기준

- 위험 운동 필터링 정확도 95% 이상
- 부상 관련 운동 추천 0건
- 사전 경고 제공률 100%
- 대체 운동 제안 만족도 85% 이상

### 현재 목표: 80%

- 주요 금기 사항 30개 이상 식별
- 운동별 위험 요소 데이터베이스 구축
- 자동 경고 시스템 구현
- 기본 대체 운동 매핑

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 의료 진단 | 의사 영역 | N/A |
| 재활 운동 처방 | 전문가 지도 필요 | 전문가 연동 시 |
| 고강도 경쟁 운동 | 전문 코칭 필요 | 향후 검토 |

---

## 1. 핵심 개념

### 1.1 운동 위험 분류 체계

#### 절대적 금기 (Absolute Contraindication)

해당 조건에서 **절대로 수행해서는 안 되는** 운동

```typescript
type AbsoluteContraindication = {
  condition: string;
  prohibitedExercises: ExerciseType[];
  reason: string;
  duration: 'permanent' | 'until_cleared';
};
```

#### 상대적 금기 (Relative Contraindication)

전문가 상담 후 **주의하에 가능한** 운동

```typescript
type RelativeContraindication = {
  condition: string;
  cautionExercises: ExerciseType[];
  modifications: string[];
  professionalGuidanceRequired: boolean;
};
```

### 1.2 위험 요소 분류

| 범주 | 요소 | 예시 |
|------|------|------|
| **심혈관** | 심장 질환, 고혈압 | 고강도 운동 제한 |
| **근골격** | 관절 문제, 부상 이력 | 해당 부위 운동 주의 |
| **대사** | 당뇨, 갑상선 질환 | 혈당 관리 주의 |
| **호흡기** | 천식, COPD | 호흡 부담 운동 주의 |
| **신경** | 현기증, 균형 장애 | 균형 필요 운동 주의 |
| **임신** | 임신 각 단계별 | 복압/충격 운동 제한 |

---

## 2. 수학적/물리학적 기반

### 2.1 위험도 점수 모델

```typescript
interface RiskScore {
  overallRisk: number;  // 0-100 (0: 안전, 100: 고위험)
  categories: {
    cardiovascular: number;
    musculoskeletal: number;
    metabolic: number;
    other: number;
  };
  confidence: number;  // 0-1
}
```

#### 종합 위험도 계산

$$Risk_{total} = \sum_{i=1}^{n} w_i \times R_i \times S_i$$

- $w_i$: 위험 요소 가중치
- $R_i$: 개별 위험 점수 (0-10)
- $S_i$: 심각도 계수 (1-3)

### 2.2 운동 강도별 위험 분류

#### RPE (자각적 운동 강도) 기반

| RPE | 강도 수준 | 심박수 범위 | 위험 그룹 적합성 |
|-----|----------|------------|-----------------|
| 1-3 | 매우 가벼움 | <50% HRmax | 모든 그룹 |
| 4-6 | 중간 | 50-70% HRmax | 대부분 적합 |
| 7-8 | 격렬함 | 70-85% HRmax | 건강한 성인 |
| 9-10 | 최대 | >85% HRmax | 전문 선수급 |

#### MET 기반 강도 분류

$$\text{위험 등급} = \begin{cases} \text{Low} & \text{if MET} < 3 \\ \text{Moderate} & \text{if } 3 \leq \text{MET} < 6 \\ \text{High} & \text{if MET} \geq 6 \end{cases}$$

### 2.3 부하-내성 모델 (Load-Tolerance Model)

```
부상 위험 = 적용 부하 / 조직 내성

적용 부하 (Applied Load):
- 운동 강도
- 반복 횟수
- 운동 빈도
- 운동 지속 시간

조직 내성 (Tissue Tolerance):
- 현재 체력 수준
- 적응 기간
- 회복 상태
- 개인 취약성
```

---

## 3. 구현 도출

### 3.1 금기 사항 데이터베이스

```typescript
interface Contraindication {
  id: string;
  condition: string;                    // 건강 상태/조건
  type: 'absolute' | 'relative';
  prohibitedExercises: ExerciseType[];  // 금지 운동
  cautionExercises: ExerciseType[];     // 주의 운동
  safeAlternatives: ExerciseType[];     // 안전한 대체
  warningMessage: string;               // 사용자 경고 메시지
  professionalAdvice: string;           // 전문가 조언
  source: string;                       // 근거 출처
}

const CONTRAINDICATIONS: Contraindication[] = [
  // 심혈관 관련
  {
    id: 'cv-01',
    condition: '급성 심장 질환',
    type: 'absolute',
    prohibitedExercises: ['all'],
    cautionExercises: [],
    safeAlternatives: [],
    warningMessage: '의사의 운동 허가가 필요합니다.',
    professionalAdvice: '심장 전문의 상담 후 운동 프로그램을 시작하세요.',
    source: 'ACSM Guidelines 11th Ed.',
  },
  {
    id: 'cv-02',
    condition: '조절되지 않는 고혈압 (>180/110 mmHg)',
    type: 'absolute',
    prohibitedExercises: ['heavy_resistance', 'high_intensity_cardio', 'isometric'],
    cautionExercises: ['moderate_cardio'],
    safeAlternatives: ['light_walking', 'gentle_stretching'],
    warningMessage: '고혈압이 조절된 후 운동을 시작하세요.',
    professionalAdvice: '혈압 관리 후 가벼운 운동부터 시작하세요.',
    source: 'ACSM Guidelines 11th Ed.',
  },

  // 근골격 관련
  {
    id: 'ms-01',
    condition: '급성 허리 통증',
    type: 'relative',
    prohibitedExercises: ['deadlift', 'squat', 'forward_bend', 'twisting'],
    cautionExercises: ['core_exercises', 'back_extensions'],
    safeAlternatives: ['gentle_stretching', 'swimming', 'walking'],
    warningMessage: '허리에 무리가 가는 운동은 피하세요.',
    professionalAdvice: '통증이 지속되면 정형외과 상담을 권장합니다.',
    source: 'NSCA Essentials',
  },
  {
    id: 'ms-02',
    condition: '무릎 관절염',
    type: 'relative',
    prohibitedExercises: ['deep_squat', 'lunges', 'jumping', 'running'],
    cautionExercises: ['partial_squat', 'leg_press'],
    safeAlternatives: ['swimming', 'cycling', 'elliptical', 'water_aerobics'],
    warningMessage: '무릎에 충격이 가는 운동은 피하세요.',
    professionalAdvice: '저충격 운동 위주로 진행하세요.',
    source: 'ACR Guidelines',
  },

  // 임신 관련
  {
    id: 'preg-01',
    condition: '임신 (2-3기)',
    type: 'relative',
    prohibitedExercises: ['contact_sports', 'scuba_diving', 'supine_exercises_after_20wk'],
    cautionExercises: ['high_impact', 'heavy_lifting', 'hot_yoga'],
    safeAlternatives: ['walking', 'swimming', 'prenatal_yoga', 'light_resistance'],
    warningMessage: '복압이 증가하거나 충격이 가는 운동은 피하세요.',
    professionalAdvice: '산부인과 전문의와 상담 후 운동하세요.',
    source: 'ACOG Guidelines',
  },

  // 대사 관련
  {
    id: 'met-01',
    condition: '제1형 당뇨',
    type: 'relative',
    prohibitedExercises: [],
    cautionExercises: ['prolonged_cardio', 'high_intensity'],
    safeAlternatives: ['moderate_cardio', 'resistance_training'],
    warningMessage: '혈당 수치를 모니터링하며 운동하세요.',
    professionalAdvice: '운동 전후 혈당 체크, 저혈당 대비 간식 준비.',
    source: 'ADA Guidelines',
  },
];
```

### 3.2 위험도 평가 알고리즘

```typescript
interface UserHealthProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  conditions: string[];           // 건강 상태 목록
  medications: string[];          // 복용 약물
  injuryHistory: InjuryRecord[];  // 부상 이력
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  lastMedicalCheckup?: Date;
}

interface InjuryRecord {
  area: BodyArea;
  type: string;
  date: Date;
  status: 'recovered' | 'recovering' | 'chronic';
}

interface RiskAssessment {
  exerciseId: string;
  overallRisk: 'low' | 'moderate' | 'high' | 'prohibited';
  riskScore: number;  // 0-100
  contraindications: Contraindication[];
  warnings: string[];
  modifications: string[];
  alternatives: ExerciseType[];
  requiresProfessionalClearance: boolean;
}

function assessExerciseRisk(
  exercise: Exercise,
  profile: UserHealthProfile
): RiskAssessment {
  const contraindications: Contraindication[] = [];
  const warnings: string[] = [];
  const modifications: string[] = [];
  let riskScore = 0;

  // 1. 절대적 금기 사항 체크
  for (const condition of profile.conditions) {
    const absoluteContra = findAbsoluteContraindication(condition, exercise.type);
    if (absoluteContra) {
      return {
        exerciseId: exercise.id,
        overallRisk: 'prohibited',
        riskScore: 100,
        contraindications: [absoluteContra],
        warnings: [absoluteContra.warningMessage],
        modifications: [],
        alternatives: absoluteContra.safeAlternatives,
        requiresProfessionalClearance: true,
      };
    }
  }

  // 2. 상대적 금기 사항 체크
  for (const condition of profile.conditions) {
    const relativeContra = findRelativeContraindication(condition, exercise.type);
    if (relativeContra) {
      contraindications.push(relativeContra);
      riskScore += 30;
      warnings.push(relativeContra.warningMessage);
      modifications.push(...getModifications(relativeContra, exercise));
    }
  }

  // 3. 부상 이력 체크
  for (const injury of profile.injuryHistory) {
    if (isExerciseAffectedByInjury(exercise, injury)) {
      const injuryRisk = calculateInjuryRisk(injury);
      riskScore += injuryRisk;
      warnings.push(`${injury.area} 부위 부상 이력이 있습니다.`);
    }
  }

  // 4. 연령 기반 위험 조정
  riskScore += getAgeRiskAdjustment(profile.age, exercise);

  // 5. 체력 수준 기반 조정
  riskScore += getFitnessLevelAdjustment(profile.fitnessLevel, exercise.intensity);

  // 6. 최종 위험 등급 결정
  const overallRisk = determineRiskLevel(riskScore);

  return {
    exerciseId: exercise.id,
    overallRisk,
    riskScore: Math.min(100, riskScore),
    contraindications,
    warnings,
    modifications,
    alternatives: findSafeAlternatives(exercise, profile),
    requiresProfessionalClearance: riskScore > 50,
  };
}

function determineRiskLevel(score: number): RiskAssessment['overallRisk'] {
  if (score >= 80) return 'prohibited';
  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

function getAgeRiskAdjustment(age: number, exercise: Exercise): number {
  // 고령자 고강도 운동 위험 증가
  if (age >= 65 && exercise.intensity === 'high') {
    return 20;
  }
  if (age >= 55 && exercise.intensity === 'high') {
    return 10;
  }
  // 청소년 고강도 저항 운동 주의
  if (age < 16 && exercise.type === 'heavy_resistance') {
    return 15;
  }
  return 0;
}
```

### 3.3 운동별 위험 요소 정의

```typescript
interface ExerciseRiskProfile {
  exerciseType: ExerciseType;
  inherentRisk: 'low' | 'moderate' | 'high';
  primaryRiskFactors: RiskFactor[];
  affectedBodyAreas: BodyArea[];
  contraindicated: {
    conditions: string[];
    injuries: string[];
  };
  safetyTips: string[];
  properFormCritical: boolean;
}

const EXERCISE_RISK_PROFILES: ExerciseRiskProfile[] = [
  {
    exerciseType: 'deadlift',
    inherentRisk: 'high',
    primaryRiskFactors: ['spinal_load', 'grip_failure', 'improper_form'],
    affectedBodyAreas: ['lower_back', 'hamstrings', 'grip'],
    contraindicated: {
      conditions: ['herniated_disc', 'acute_back_pain', 'osteoporosis'],
      injuries: ['lower_back_injury', 'hamstring_strain'],
    },
    safetyTips: [
      '허리를 곧게 유지하세요',
      '바벨을 몸에 가깝게 유지하세요',
      '무게를 점진적으로 증가시키세요',
      '코어를 항상 긴장시키세요',
    ],
    properFormCritical: true,
  },
  {
    exerciseType: 'running',
    inherentRisk: 'moderate',
    primaryRiskFactors: ['impact_stress', 'overuse', 'terrain'],
    affectedBodyAreas: ['knees', 'ankles', 'shins', 'hips'],
    contraindicated: {
      conditions: ['severe_knee_arthritis', 'stress_fracture'],
      injuries: ['acute_knee_injury', 'shin_splints', 'plantar_fasciitis'],
    },
    safetyTips: [
      '적절한 러닝화를 착용하세요',
      '점진적으로 거리를 늘리세요 (10% 규칙)',
      '다양한 표면에서 달리세요',
      '적절한 워밍업을 하세요',
    ],
    properFormCritical: true,
  },
  {
    exerciseType: 'swimming',
    inherentRisk: 'low',
    primaryRiskFactors: ['drowning', 'shoulder_overuse'],
    affectedBodyAreas: ['shoulders', 'neck'],
    contraindicated: {
      conditions: ['epilepsy_uncontrolled', 'open_wounds'],
      injuries: ['shoulder_impingement_acute'],
    },
    safetyTips: [
      '항상 감시가 있는 곳에서 수영하세요',
      '다양한 영법을 번갈아 사용하세요',
      '어깨 스트레칭을 충분히 하세요',
    ],
    properFormCritical: false,
  },
];
```

### 3.4 대체 운동 제안 시스템

```typescript
interface AlternativeExercise {
  originalExercise: ExerciseType;
  alternative: ExerciseType;
  targetMuscles: MuscleGroup[];
  riskReduction: number;  // 0-100%
  effectivenessRatio: number;  // 대안 효과 / 원래 효과
  notes: string;
}

const EXERCISE_ALTERNATIVES: AlternativeExercise[] = [
  {
    originalExercise: 'barbell_squat',
    alternative: 'leg_press',
    targetMuscles: ['quadriceps', 'glutes'],
    riskReduction: 60,
    effectivenessRatio: 0.85,
    notes: '척추 부하 감소, 무릎 부상 이력자에게 적합',
  },
  {
    originalExercise: 'running',
    alternative: 'cycling',
    targetMuscles: ['quadriceps', 'cardiovascular'],
    riskReduction: 70,
    effectivenessRatio: 0.9,
    notes: '무릎/발목 충격 제거, 심폐 효과 유사',
  },
  {
    originalExercise: 'deadlift',
    alternative: 'hip_hinge_machine',
    targetMuscles: ['hamstrings', 'glutes', 'lower_back'],
    riskReduction: 70,
    effectivenessRatio: 0.75,
    notes: '척추 안정화, 초보자/허리 문제에 적합',
  },
  {
    originalExercise: 'overhead_press',
    alternative: 'landmine_press',
    targetMuscles: ['shoulders', 'triceps'],
    riskReduction: 50,
    effectivenessRatio: 0.85,
    notes: '어깨 충돌 위험 감소, 가동범위 조절 용이',
  },
];

function findSafeAlternatives(
  exercise: Exercise,
  profile: UserHealthProfile
): ExerciseType[] {
  const alternatives = EXERCISE_ALTERNATIVES
    .filter(alt => alt.originalExercise === exercise.type)
    .filter(alt => {
      // 대체 운동도 안전한지 확인
      const altRisk = assessExerciseRisk({ ...exercise, type: alt.alternative }, profile);
      return altRisk.overallRisk !== 'prohibited' && altRisk.overallRisk !== 'high';
    })
    .sort((a, b) => b.riskReduction - a.riskReduction)
    .map(alt => alt.alternative);

  return alternatives;
}
```

---

## 4. 검증 방법

### 4.1 금기 사항 정확도 검증

- 의학 가이드라인과의 일치도 (ACSM, NSCA, 전문학회)
- 전문가 리뷰 (운동생리학자, 물리치료사)
- 정기적 업데이트 (연 1회 이상)

### 4.2 부상 발생률 모니터링

```typescript
interface SafetyMetrics {
  injuryReportRate: number;      // 1000회 운동당 부상 보고
  nearMissRate: number;          // 위험 상황 보고
  warningEffectiveness: number;  // 경고 후 운동 포기율
  alternativeAdoption: number;   // 대체 운동 채택률
}

const SAFETY_TARGETS: SafetyMetrics = {
  injuryReportRate: 0.5,         // 1000회당 0.5건 이하
  nearMissRate: 2.0,             // 1000회당 2건 이하
  warningEffectiveness: 0.8,     // 80% 이상
  alternativeAdoption: 0.7,      // 70% 이상
};
```

### 4.3 사용자 피드백 수집

- 운동 후 통증/불편 보고
- 경고 메시지 유용성 평가
- 대체 운동 만족도

---

## 5. 법적 고지 및 면책

### 5.1 필수 면책 조항

```typescript
const LEGAL_DISCLAIMER = `
중요 고지

이 서비스는 일반적인 운동 가이드라인을 제공하며,
개인화된 의료 조언을 대체하지 않습니다.

다음 경우 운동 시작 전 의사와 상담하세요:
- 심장 질환, 고혈압 등 심혈관 문제가 있는 경우
- 당뇨, 갑상선 질환 등 대사 질환이 있는 경우
- 최근 수술을 받았거나 부상 중인 경우
- 임신 중이거나 임신 가능성이 있는 경우
- 처방약을 복용 중인 경우
- 65세 이상인 경우

운동 중 흉통, 현기증, 호흡곤란, 심한 통증이 발생하면
즉시 운동을 중단하고 의료 전문가와 상담하세요.

본 서비스 사용으로 인한 부상이나 건강 문제에 대해
이룸은 법적 책임을 지지 않습니다.
`;
```

### 5.2 PAR-Q+ 설문 통합

```typescript
interface PARQ_Plus {
  generalHealthQuestions: {
    question: string;
    yesAction: 'proceed' | 'caution' | 'professional_clearance';
  }[];
  followUpQuestions: Record<string, Question[]>;
}

const PARQ_QUESTIONS = [
  {
    question: '의사가 심장 질환이 있다고 말한 적 있습니까?',
    yesAction: 'professional_clearance',
  },
  {
    question: '운동 시 가슴 통증을 느낀 적 있습니까?',
    yesAction: 'professional_clearance',
  },
  {
    question: '지난 한 달간 어지러움이나 의식 상실을 경험한 적 있습니까?',
    yesAction: 'professional_clearance',
  },
  {
    question: '현재 처방약을 복용 중입니까?',
    yesAction: 'caution',
  },
  // ... 추가 질문
];
```

---

## 6. 참고 자료

- ACSM's Guidelines for Exercise Testing and Prescription, 11th Edition
- NSCA's Essentials of Strength Training and Conditioning, 4th Edition
- Physical Activity Readiness Questionnaire for Everyone (PAR-Q+)
- American Heart Association Exercise Standards
- ACOG Guidelines for Physical Activity During Pregnancy

---

## 7. 관련 문서

### 구현 스펙 (이 원리를 적용하는 문서)

| 문서 | 설명 |
|------|------|
| [SDD-W1-WORKOUT](../specs/SDD-W1-WORKOUT.md) | W-1 운동 모듈 스펙 |
| [SDD-W-2-ADVANCED-STRETCHING](../specs/SDD-W-2-ADVANCED-STRETCHING.md) | W-2 스트레칭 모듈 |

### 관련 원리 문서

| 문서 | 설명 |
|------|------|
| [exercise-physiology.md](./exercise-physiology.md) | 운동 생리학 기반 |
| [stretching-physiology.md](./stretching-physiology.md) | 스트레칭 안전 |
| [body-mechanics.md](./body-mechanics.md) | 체형/자세 분석 |

---

**Version**: 1.0 | **Created**: 2026-01-29
**소스 리서치**: ACSM, NSCA Guidelines
**관련 모듈**: W-1 Workout, W-2 Stretching
