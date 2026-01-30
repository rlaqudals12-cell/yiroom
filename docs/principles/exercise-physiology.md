# 운동생리학 원리 (Exercise Physiology)

> 이 문서는 W-1 (운동 분석), C-1 (체형 분석), COMBO-BODY-EXERCISE 모듈의 기반이 되는 기본 원리를 설명한다.
>
> **소스 리서치**: W-1-R1, COMBO-BODY-EXERCISE, W-2-FOUNDATION, W-2-POSTURE-SAFETY

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 개인화 운동 처방 시스템"

- 100% 체형 맞춤: 사용자의 자세 불균형 패턴을 정밀 분석하여 교정 운동 자동 생성
- 과학적 운동 처방: MET 기반 칼로리 계산, 근막선 고려 통합 스트레칭
- 점진적 과부하: 개인 운동 이력 기반 강도/볼륨 자동 조절
- 부상 예방: 자세 분석 연계 위험 동작 자동 제외, 대체 동작 제안
- 실시간 피드백: 동작 인식 AI로 자세 교정 가이드 제공
- 통합 웰니스: 피부-체형-운동 연계 종합 분석
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **정밀 자세 측정** | 의료용 모션캡처 없이 관절각 정밀 측정 불가 (오차 ±5-10°) |
| **근력 측정 불가** | 1RM 직접 측정 불가, 추정 공식 사용 |
| **실시간 동작 분석** | 고성능 GPU 필요, 모바일 환경 제한 |
| **의료 진단 불가** | 자세 분석은 참고용, 의료 진단 대체 불가 |
| **개인차 반영** | 유전적 근섬유 비율, 회복력 차이 반영 한계 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **자세 패턴 인식** | 4가지 주요 패턴 (상부교차, 하부교차, 스웨이백, 편평등) 100% 식별 |
| **근육 불균형 매핑** | 12개 이상 주요 근육군의 단축/약화 상태 분석 |
| **MET 데이터베이스** | 300개 이상 운동의 MET 값 보유 |
| **운동 추천 정확도** | 자세 패턴별 적합 운동 매핑 95% 이상 |
| **부상 위험 예측** | 자세 기반 위험 운동 자동 제외 |
| **5-Type 분류** | 유산소/근력/유연성/균형/기능성 운동 분류 체계 |
| **점진적 과부하** | 주간/월간 운동 강도 자동 조절 알고리즘 |
| **근막선 통합** | Anatomy Trains 기반 통합 스트레칭 루틴 |
| **체형-운동 연계** | 체형 분석 결과 자동 반영 |

### 현재 목표

**80%** - MVP 운동 처방 시스템

- ✅ MET 기반 칼로리 계산 (200+ 운동)
- ✅ 5-Type 운동 분류 체계
- ✅ 4가지 자세 불균형 패턴 인식
- ✅ 주요 12개 근육군 분석
- ✅ 체형 분석 연계 운동 추천
- ✅ 근막선 기반 스트레칭 루틴
- ⏳ 실시간 동작 분석 (40%, 이미지 기반)
- ⏳ 점진적 과부하 알고리즘 (60%)
- ⏳ 부상 위험 예측 (50%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 실시간 동작 인식 | GPU 비용, 모바일 제한 | Phase 4 |
| 1RM 직접 측정 | 안전 이슈, 전문 장비 필요 | 미정 |
| 의료 진단 연계 | 의료기기 인증 필요 | 미정 |
| 웨어러블 연동 | 하드웨어 의존성 | Phase 3 |
| 유전자 기반 처방 | 유전체 분석 서비스 필요 | Phase 5 |

---

## 1. 핵심 개념

### 1.1 근골격계 해부학

#### 주요 근육군

| 근육군 | 위치 | 기능 | 자세 영향 | 관련 불균형 |
|--------|------|------|----------|-------------|
| **대흉근** | 가슴 | 어깨 내전/내회전 | 라운드숄더 유발 | 상부교차 |
| **승모근 상부** | 등 상부 | 견갑골 거상 | 목 통증 연관 | 상부교차 |
| **승모근 중/하부** | 등 중부 | 견갑골 내전/하강 | 자세 지지 (약화 시 문제) | 상부교차 |
| **광배근** | 등 전체 | 어깨 신전/내전 | 자세 지지 | - |
| **전거근** | 갈비뼈 측면 | 견갑골 외전 | 날개 견갑 방지 | 상부교차 |
| **복직근** | 복부 전면 | 체간 굴곡 | 골반 후방경사 | 하부교차 |
| **복횡근** | 복부 심층 | 코어 안정화 | 요추 보호 | - |
| **장요근** | 고관절 | 고관절 굴곡 | 골반 전방경사 | 하부교차 |
| **대둔근** | 엉덩이 | 고관절 신전 | 보행 추진력 | 하부교차 |
| **중둔근** | 엉덩이 측면 | 고관절 외전 | 골반 안정화 | 측면 불균형 |
| **척추기립근** | 척추 양측 | 척추 신전 | 과도 시 요통 | 하부교차 |
| **다열근** | 척추 심층 | 분절 안정화 | 요추 안정성 | - |

#### 근막 연결선 (Anatomy Trains)

```
후방 근막선 (Superficial Back Line):
족저근막 → 비복근 → 햄스트링 → 천결절인대 → 척추기립근 → 두판상근

전방 근막선 (Superficial Front Line):
전경골근 → 대퇴사두근 → 복직근 → 흉쇄유돌근

측방선 (Lateral Line):
비골근 → 장경인대 → 외복사근 → 늑간근 → 흉쇄유돌근

→ 근막 연결을 고려한 통합적 스트레칭 필요
```

### 1.2 자세 불균형 패턴

#### 상부교차증후군 (Upper Crossed Syndrome)

```
┌─────────────────────────────────────────┐
│              상부교차증후군              │
│                                         │
│    단축 근육          약화 근육         │
│    ──────────         ──────────        │
│    - 대흉근           - 심부경추굴곡근   │
│    - 소흉근           - 중/하승모근      │
│    - 상부승모근       - 전거근          │
│    - 견갑거근         - 능형근          │
│    - 후두하근                           │
│                                         │
│    결과: 거북목, 라운드숄더, 날개견갑    │
└─────────────────────────────────────────┘
```

#### 하부교차증후군 (Lower Crossed Syndrome)

```
┌─────────────────────────────────────────┐
│              하부교차증후군              │
│                                         │
│    단축 근육          약화 근육         │
│    ──────────         ──────────        │
│    - 장요근           - 복직근          │
│    - 대퇴직근         - 복횡근          │
│    - 요방형근         - 대둔근          │
│    - 척추기립근       - 중둔근          │
│                                         │
│    결과: 골반 전방경사, 요추 과전만      │
└─────────────────────────────────────────┘
```

#### 스웨이백 자세 (Sway Back Posture)

```
┌─────────────────────────────────────────┐
│              스웨이백 자세               │
│                                         │
│    특징:                                │
│    - 골반 전방 이동 (앞으로 밀림)        │
│    - 흉추 후만 증가                     │
│    - 요추 전만 감소 (편평)              │
│                                         │
│    단축: 햄스트링, 외복사근, 상부복직근  │
│    약화: 장요근, 하복직근, 척추기립근    │
└─────────────────────────────────────────┘
```

#### 편평등 자세 (Flat Back Posture)

```
┌─────────────────────────────────────────┐
│              편평등 자세                │
│                                         │
│    특징:                                │
│    - 흉추/요추 곡선 모두 감소           │
│    - 골반 후방경사                      │
│    - 무릎 과신전 경향                   │
│                                         │
│    단축: 햄스트링, 복직근               │
│    약화: 장요근, 척추기립근             │
└─────────────────────────────────────────┘
```

### 1.3 근수축 유형

| 유형 | 정의 | 예시 | 효과 | 부상 위험 |
|------|------|------|------|----------|
| **등척성 (Isometric)** | 길이 불변 | 플랭크 | 안정화, 지구력 | 낮음 |
| **동심성 (Concentric)** | 단축 수축 | 컬 올리기 | 근력 증가 | 중간 |
| **편심성 (Eccentric)** | 신장 수축 | 컬 내리기 | 근비대, DOMS | 높음 |

### 1.4 에너지 시스템

```
운동 강도/시간에 따른 에너지 시스템:

┌─────────────────────────────────────────────────────────┐
│ 시간        │ 에너지 시스템    │ 연료        │ 예시        │
├─────────────────────────────────────────────────────────┤
│ 0-10초      │ ATP-PC (무산소)  │ 크레아틴인산 │ 100m 스프린트│
│ 10초-2분    │ 해당 (무산소)    │ 글루코스    │ 400m 달리기  │
│ 2-60분      │ 유산소           │ 탄수화물/지방│ 5km 달리기   │
│ 60분+       │ 유산소           │ 주로 지방    │ 마라톤       │
└─────────────────────────────────────────────────────────┘
```

### 1.5 스트레칭 기법

| 기법 | 원리 | 시간 | 효과 | 적용 |
|------|------|------|------|------|
| **정적 (Static)** | 점탄성 이완 | 30-60초 | 유연성 증가 | 운동 후 |
| **동적 (Dynamic)** | 활성화된 스트레칭 | 10-15회 | 워밍업, 가동범위 | 운동 전 |
| **PNF** | 골지건기관 억제 | 6초 수축→30초 이완 | 최대 유연성 | 치료적 |
| **탄도적 (Ballistic)** | 반동 이용 | - | 스포츠 특이 | 주의 필요 |

```typescript
// PNF 스트레칭 프로토콜
interface PNFProtocol {
  contractDuration: number;     // 등척성 수축 시간 (초)
  relaxDuration: number;        // 이완 시간 (초)
  contractionIntensity: number; // 최대 수축의 % (20-75%)
  repetitions: number;          // 반복 횟수
}

const STANDARD_PNF: PNFProtocol = {
  contractDuration: 6,          // 6초 수축
  relaxDuration: 30,            // 30초 이완/신장
  contractionIntensity: 50,     // 50% 강도
  repetitions: 3,               // 3회 반복
};
```

---

## 2. 수학적/물리학적 기반

### 2.1 자세 각도 측정

```
정면 자세 (Frontal Plane):
──────────────────────────
- 어깨 기울기: θ_shoulder = arctan((y_right - y_left) / (x_right - x_left))
- 골반 기울기: θ_pelvis = arctan((y_right_hip - y_left_hip) / (x_right_hip - x_left_hip))
- 무릎 정렬: Q-angle (정상: 남 14°, 여 17°)

측면 자세 (Sagittal Plane):
──────────────────────────
- CVA (두개척추각): angle(tragus, C7, horizontal)
  정상: >50°, 경미: 40-50°, 심각: <40°¹
- 흉추 후만: angle(T1, T12, vertical)
  정상: 20-40°, 과도: >40°
- 요추 전만: angle(L1, S1, vertical)
  정상: 40-60°, 과도: >60°, 편평: <30°
```

### 2.2 자세 점수 알고리즘

```typescript
interface PostureAngles {
  cva: number;              // 두개척추각 (정상: >50°)
  shoulderTilt: number;     // 어깨 기울기 (정상: 0°)
  thoracicKyphosis: number; // 흉추 후만 (정상: 20-40°)
  lumbarLordosis: number;   // 요추 전만 (정상: 40-60°)
  pelvicTilt: number;       // 골반 기울기 (정상: 0°)
}

interface PostureScore {
  overall: number;                // 0-100
  category: 'excellent' | 'good' | 'moderate' | 'poor';
  components: Record<keyof PostureAngles, number>;
  imbalances: PostureImbalance[];
}

function calculatePostureScore(angles: PostureAngles): PostureScore {
  const IDEAL: PostureAngles = {
    cva: 55,
    shoulderTilt: 0,
    thoracicKyphosis: 30,
    lumbarLordosis: 50,
    pelvicTilt: 0,
  };

  const TOLERANCE: PostureAngles = {
    cva: 10,              // ±10°
    shoulderTilt: 5,      // ±5°
    thoracicKyphosis: 10, // ±10°
    lumbarLordosis: 10,   // ±10°
    pelvicTilt: 5,        // ±5°
  };

  const WEIGHTS: Record<keyof PostureAngles, number> = {
    cva: 0.30,            // 거북목 가중치 높음
    shoulderTilt: 0.15,
    thoracicKyphosis: 0.20,
    lumbarLordosis: 0.20,
    pelvicTilt: 0.15,
  };

  const components: Record<string, number> = {};
  let weightedSum = 0;

  for (const [key, ideal] of Object.entries(IDEAL)) {
    const k = key as keyof PostureAngles;
    const deviation = Math.abs(angles[k] - ideal);
    const normalizedDeviation = deviation / TOLERANCE[k];
    const score = Math.max(0, 100 - normalizedDeviation * 25);

    components[k] = Math.round(score);
    weightedSum += score * WEIGHTS[k];
  }

  const overall = Math.round(weightedSum);
  const category = overall >= 90 ? 'excellent'
                 : overall >= 75 ? 'good'
                 : overall >= 60 ? 'moderate'
                 : 'poor';

  const imbalances = detectImbalances(angles, IDEAL);

  return {
    overall,
    category,
    components: components as Record<keyof PostureAngles, number>,
    imbalances,
  };
}

function detectImbalances(
  angles: PostureAngles,
  ideal: PostureAngles
): PostureImbalance[] {
  const imbalances: PostureImbalance[] = [];

  // 상부교차 (거북목 + 라운드숄더)
  if (angles.cva < 45 && angles.thoracicKyphosis > 40) {
    imbalances.push({
      type: 'upper_cross',
      severity: angles.cva < 35 ? 'severe' : angles.cva < 40 ? 'moderate' : 'mild',
    });
  }

  // 하부교차 (골반 전방경사 + 요추 과전만)
  if (angles.pelvicTilt > 10 && angles.lumbarLordosis > 55) {
    imbalances.push({
      type: 'lower_cross',
      severity: angles.pelvicTilt > 20 ? 'severe' : angles.pelvicTilt > 15 ? 'moderate' : 'mild',
    });
  }

  // 스웨이백 (골반 전방 이동 + 요추 편평)
  if (angles.pelvicTilt < -5 && angles.lumbarLordosis < 35) {
    imbalances.push({
      type: 'sway_back',
      severity: 'moderate',
    });
  }

  // 편평등
  if (angles.thoracicKyphosis < 15 && angles.lumbarLordosis < 35) {
    imbalances.push({
      type: 'flat_back',
      severity: 'moderate',
    });
  }

  return imbalances;
}
```

### 2.3 MET (Metabolic Equivalent of Task) 기반 칼로리 계산

#### MET 정의 및 공식

```
MET (Metabolic Equivalent of Task):
────────────────────────────────────
1 MET = 안정 시 산소 소비량 = 3.5 mL O₂/kg/min

칼로리 소모량 공식:
Calories (kcal) = MET × 체중(kg) × 시간(h)

예시: 70kg 사람이 5.0 MET 운동을 30분 수행
     = 5.0 × 70 × 0.5 = 175 kcal
```

#### 운동 종류별 MET 값 (Compendium of Physical Activities 2024)²

| 카테고리 | 운동 | MET | 강도 분류 | 비고 |
|----------|------|-----|----------|------|
| **저강도** (< 3.0) | | | |
| | 걷기 (3.2 km/h, 평지) | 2.0 | Light | |
| | 스트레칭 (정적) | 2.3 | Light | |
| | 요가 (하타) | 2.5 | Light | |
| | 필라테스 (초급) | 3.0 | Light | |
| **중강도** (3.0 - 6.0) | | | |
| | 걷기 (5.6 km/h) | 3.5 | Moderate | |
| | 웨이트 (저/중강도) | 3.5 | Moderate | 8-15회 반복 |
| | 자전거 (여가, 16 km/h) | 4.0 | Moderate | |
| | 수영 (여가) | 4.5 | Moderate | |
| | 스쿼트 | 5.0 | Moderate | 체중 운동 |
| | 벤치프레스 | 5.0 | Moderate | |
| | 데드리프트 | 6.0 | Moderate-Vigorous | 복합 운동 |
| **고강도** (> 6.0) | | | |
| | 런지 (동적) | 6.0 | Vigorous | |
| | 버피 | 8.0 | Vigorous | |
| | 줄넘기 (빠르게) | 8.8 | Vigorous | |
| | 달리기 (8 km/h) | 8.3 | Vigorous | |
| | 달리기 (9.7 km/h) | 9.8 | Vigorous | |
| | 달리기 (12 km/h) | 11.5 | Vigorous | |
| | 스프린트 (최대) | 15.0+ | Near-Maximal | 단시간 |
| **HIIT/서킷** | | | |
| | HIIT (일반) | 8.0-12.0 | Vigorous | 강도 변동 |
| | 크로스핏 | 9.0-12.0 | Vigorous | |
| | 킥복싱 | 10.0 | Vigorous | |

#### MET 강도 분류 기준

| 강도 분류 | MET 범위 | %HRmax | RPE (1-10) | 대화 테스트 |
|----------|----------|--------|-----------|------------|
| **Very Light** | < 2.0 | < 50% | 1-2 | 노래 가능 |
| **Light** | 2.0-2.9 | 50-63% | 3-4 | 편안한 대화 |
| **Moderate** | 3.0-5.9 | 64-76% | 5-6 | 짧은 문장 |
| **Vigorous** | 6.0-8.9 | 77-93% | 7-8 | 단어만 |
| **Near-Maximal** | ≥ 9.0 | ≥ 94% | 9-10 | 대화 불가 |

```typescript
// MET 기반 칼로리 계산 타입
interface CalorieParams {
  met: number;           // MET 값 (1.0-15.0)
  weightKg: number;      // 체중 (kg)
  durationMinutes: number; // 운동 시간 (분)
}

interface CalorieResult {
  calories: number;      // 소모 칼로리 (kcal)
  intensity: 'light' | 'moderate' | 'vigorous' | 'near_maximal';
  metCategory: string;
}

function calculateCaloriesWithMET(params: CalorieParams): CalorieResult {
  const { met, weightKg, durationMinutes } = params;

  // 입력 검증
  if (met < 1.0 || met > 20.0) throw new Error('Invalid MET value (1.0-20.0)');
  if (weightKg <= 0) throw new Error('Invalid weight');
  if (durationMinutes <= 0) throw new Error('Invalid duration');

  const durationHours = durationMinutes / 60;
  const calories = Math.round(met * weightKg * durationHours);

  // 강도 분류
  let intensity: CalorieResult['intensity'];
  if (met < 3.0) intensity = 'light';
  else if (met < 6.0) intensity = 'moderate';
  else if (met < 9.0) intensity = 'vigorous';
  else intensity = 'near_maximal';

  return {
    calories,
    intensity,
    metCategory: getMETCategory(met),
  };
}

function getMETCategory(met: number): string {
  if (met < 2.0) return 'Very Light';
  if (met < 3.0) return 'Light';
  if (met < 6.0) return 'Moderate';
  if (met < 9.0) return 'Vigorous';
  return 'Near-Maximal';
}
```

### 2.4 운동 강도 계산

```typescript
// Tanaka 공식 (2001) - 나이별 최대 심박수
function calculateHRmax(age: number): number {
  return 208 - (0.7 * age);
}

// Karvonen 공식 - 목표 심박수 영역
interface HeartRateZone {
  name: string;
  minPercent: number;
  maxPercent: number;
  minHR: number;
  maxHR: number;
  purpose: string;
}

function calculateKarvonenZones(
  age: number,
  restingHR: number
): HeartRateZone[] {
  const hrMax = calculateHRmax(age);
  const hrReserve = hrMax - restingHR;

  const calculateTHR = (percent: number): number => {
    return Math.round(hrReserve * (percent / 100) + restingHR);
  };

  return [
    {
      name: 'Zone 1: 회복',
      minPercent: 50, maxPercent: 60,
      minHR: calculateTHR(50), maxHR: calculateTHR(60),
      purpose: '회복, 워밍업, 쿨다운',
    },
    {
      name: 'Zone 2: 지방 연소',
      minPercent: 60, maxPercent: 70,
      minHR: calculateTHR(60), maxHR: calculateTHR(70),
      purpose: '지방 연소, 기초 지구력',
    },
    {
      name: 'Zone 3: 유산소',
      minPercent: 70, maxPercent: 80,
      minHR: calculateTHR(70), maxHR: calculateTHR(80),
      purpose: '심폐 지구력 향상',
    },
    {
      name: 'Zone 4: 무산소 역치',
      minPercent: 80, maxPercent: 90,
      minHR: calculateTHR(80), maxHR: calculateTHR(90),
      purpose: '젖산 역치 향상, 속도 지구력',
    },
    {
      name: 'Zone 5: 최대 노력',
      minPercent: 90, maxPercent: 100,
      minHR: calculateTHR(90), maxHR: hrMax,
      purpose: '최대 심폐 능력, 스프린트',
    },
  ];
}

// 사용 예시
// const zones = calculateKarvonenZones(30, 60);
// Zone 2 (지방연소): 126-140 bpm
```

### 2.5 개인화 공식 (Personalization Formulas)

> 나이, 피트니스 레벨, 운동 목표에 따른 운동 강도 개인화

#### 2.5.1 나이별 최대심박수 공식 비교

```
┌─────────────────────────────────────────────────────────────────┐
│                   나이별 최대심박수(HRmax) 공식                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 기본 공식 (Fox, 1971) - 단순하지만 오차 큼                   │
│     HRmax = 220 - age                                           │
│     예: 30세 → 220 - 30 = 190 bpm                               │
│     ⚠️ 오차: ±10-12 bpm (표준편차)                              │
│                                                                  │
│  2. Tanaka 공식 (2001) - 권장 (이룸 기본 공식)                   │
│     HRmax = 208 - (0.7 × age)                                   │
│     예: 30세 → 208 - 21 = 187 bpm                               │
│     ✅ 오차: ±7-10 bpm (더 정확)                                │
│                                                                  │
│  3. Gellish 공식 (2007) - 건강한 성인용                          │
│     HRmax = 207 - (0.7 × age)                                   │
│                                                                  │
│  4. Inbar 공식 (1994) - 운동선수용                               │
│     HRmax = 205.8 - (0.685 × age)                               │
│                                                                  │
│  ※ 개인차가 크므로 실제 측정값 우선 사용 권장                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.5.2 심박수 존(Zone) 상세 정의

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         심박수 존(Zone) 상세 정의                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Karvonen 공식 (Target Heart Rate):                                         │
│  ────────────────────────────────────                                       │
│  THR = ((HRmax - HRrest) × intensity%) + HRrest                             │
│                                                                              │
│  예시: 30세, 안정시 심박수 60bpm, Zone 3 (70%) 계산                         │
│  - HRmax = 208 - (0.7 × 30) = 187 bpm                                       │
│  - HRR (Heart Rate Reserve) = 187 - 60 = 127 bpm                            │
│  - THR (70%) = (127 × 0.70) + 60 = 149 bpm                                  │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Zone │ 강도%   │ 체감 (RPE) │ 목적                │ 권장 시간    │ 연료     │
│ ──────┼─────────┼────────────┼─────────────────────┼──────────────┼────────  │
│   1   │ 50-60%  │ 1-2 (매우  │ 워밍업, 쿨다운,    │ 5-10분       │ 지방     │
│       │         │     가벼움)│ 회복               │ (전후)       │          │
│ ──────┼─────────┼────────────┼─────────────────────┼──────────────┼────────  │
│   2   │ 60-70%  │ 3-4        │ 체지방 연소,       │ 30-60분      │ 지방     │
│       │         │ (가벼움)   │ 기초 지구력        │              │ (주로)   │
│ ──────┼─────────┼────────────┼─────────────────────┼──────────────┼────────  │
│   3   │ 70-80%  │ 5-6        │ 유산소 지구력,     │ 20-40분      │ 지방+    │
│       │         │ (중간)     │ 심폐 능력 향상     │              │ 탄수화물 │
│ ──────┼─────────┼────────────┼─────────────────────┼──────────────┼────────  │
│   4   │ 80-90%  │ 7-8        │ 젖산 역치 향상,    │ 10-20분      │ 탄수화물 │
│       │         │ (힘듦)     │ 무산소 역치        │ (인터벌)     │ (주로)   │
│ ──────┼─────────┼────────────┼─────────────────────┼──────────────┼────────  │
│   5   │ 90-100% │ 9-10       │ 최대 심폐 능력,    │ 30초-2분     │ 탄수화물 │
│       │         │ (최대)     │ 스프린트, VO2max   │ (스프린트)   │ + 무산소 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.5.3 운동 강도 조절 계수

```typescript
// 개인화 운동 강도 계산
interface PersonalizationFactors {
  age: number;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'flexibility';
  restingHR?: number;  // 안정시 심박수 (선택)
}

// 피트니스 레벨별 강도 조절 계수
const FITNESS_LEVEL_MULTIPLIERS = {
  beginner: {
    intensity: 0.7,     // 기본 강도의 70%
    volume: 0.7,        // 기본 볼륨의 70%
    recovery: 1.3,      // 휴식 시간 30% 증가
    description: '운동 경험 1개월 미만',
  },
  intermediate: {
    intensity: 1.0,     // 기본 강도 100%
    volume: 1.0,        // 기본 볼륨 100%
    recovery: 1.0,      // 기본 휴식 시간
    description: '운동 경험 1-6개월',
  },
  advanced: {
    intensity: 1.2,     // 기본 강도의 120%
    volume: 1.2,        // 기본 볼륨의 120%
    recovery: 0.85,     // 휴식 시간 15% 감소
    description: '운동 경험 6개월 이상',
  },
} as const;

// 나이별 회복 계수 (Recovery Coefficient)
// 나이가 증가할수록 회복 시간이 길어짐
const AGE_RECOVERY_COEFFICIENTS: Record<string, number> = {
  '20-29': 1.0,    // 기준
  '30-39': 0.95,   // 5% 추가 회복 필요
  '40-49': 0.90,   // 10% 추가 회복 필요
  '50-59': 0.85,   // 15% 추가 회복 필요
  '60+': 0.80,     // 20% 추가 회복 필요
};

// 나이별 최대 강도 제한 (안전 계수)
const AGE_INTENSITY_LIMITS: Record<string, { maxHRPercent: number; maxRPE: number }> = {
  '20-29': { maxHRPercent: 100, maxRPE: 10 },
  '30-39': { maxHRPercent: 95, maxRPE: 9 },
  '40-49': { maxHRPercent: 90, maxRPE: 8 },
  '50-59': { maxHRPercent: 85, maxRPE: 8 },
  '60+': { maxHRPercent: 80, maxRPE: 7 },
};

function getAgeGroup(age: number): string {
  if (age < 30) return '20-29';
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  if (age < 60) return '50-59';
  return '60+';
}

interface PersonalizedIntensity {
  targetHRZone: { min: number; max: number };
  effectiveIntensity: number;       // 적용 강도 (0-1)
  restMultiplier: number;           // 휴식 시간 배수
  volumeMultiplier: number;         // 볼륨 배수
  warnings: string[];
}

function calculatePersonalizedIntensity(
  baseIntensity: number,            // 기본 강도 (0.5-1.0)
  factors: PersonalizationFactors
): PersonalizedIntensity {
  const ageGroup = getAgeGroup(factors.age);
  const levelMultiplier = FITNESS_LEVEL_MULTIPLIERS[factors.fitnessLevel];
  const ageRecovery = AGE_RECOVERY_COEFFICIENTS[ageGroup];
  const ageLimit = AGE_INTENSITY_LIMITS[ageGroup];

  const warnings: string[] = [];

  // 1. 피트니스 레벨로 강도 조정
  let effectiveIntensity = baseIntensity * levelMultiplier.intensity;

  // 2. 나이별 상한선 적용
  const maxIntensity = ageLimit.maxHRPercent / 100;
  if (effectiveIntensity > maxIntensity) {
    effectiveIntensity = maxIntensity;
    warnings.push(`안전을 위해 강도가 ${ageLimit.maxHRPercent}%로 제한되었습니다.`);
  }

  // 3. 목표 심박수 존 계산
  const hrMax = 208 - (0.7 * factors.age);
  const hrRest = factors.restingHR || 70;  // 기본값 70
  const hrReserve = hrMax - hrRest;

  const zoneMin = Math.round((hrReserve * (effectiveIntensity - 0.1)) + hrRest);
  const zoneMax = Math.round((hrReserve * effectiveIntensity) + hrRest);

  // 4. 휴식 시간 계산 (레벨 + 나이 고려)
  const restMultiplier = levelMultiplier.recovery / ageRecovery;

  // 5. 볼륨 계산 (레벨 기반, 나이 고려)
  const volumeMultiplier = levelMultiplier.volume * ageRecovery;

  // 6. 안전 경고 생성
  if (factors.age >= 65) {
    warnings.push('65세 이상: 운동 시작 전 의료 전문가 상담을 권장합니다.');
  }
  if (factors.fitnessLevel === 'beginner' && baseIntensity > 0.7) {
    warnings.push('초보자는 낮은 강도에서 시작하여 점진적으로 증가시키세요.');
  }

  return {
    targetHRZone: { min: zoneMin, max: zoneMax },
    effectiveIntensity,
    restMultiplier,
    volumeMultiplier,
    warnings,
  };
}
```

#### 2.5.4 목표별 추천 프로토콜

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          목표별 추천 운동 프로토콜                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. 체중 감량 (Weight Loss)                                                 │
│     ─────────────────────────────────────────                               │
│     권장 존: Zone 2-3 (60-80%)                                              │
│     운동 타입: 저-중강도 장시간 유산소                                       │
│     권장 시간: 45-60분/회, 주 5회                                           │
│     예시: 빠른 걷기, 조깅, 사이클링                                         │
│     칼로리 목표: 주당 2000-3000 kcal 소모                                   │
│     주의: Zone 4-5는 주 1-2회로 제한 (HIIT)                                 │
│                                                                              │
│  2. 근력/근비대 (Muscle Gain)                                               │
│     ─────────────────────────────────────────                               │
│     권장 존: Zone 3-4 (70-90%)                                              │
│     운동 타입: 저항 운동 + 인터벌                                           │
│     권장 시간: 45-60분/회, 주 3-4회                                         │
│     세트/반복: 3-5세트 × 6-12회 (근비대)                                    │
│     휴식: 90-120초 (세트 간)                                                │
│     주의: 근육군별 48-72시간 회복 필수                                      │
│                                                                              │
│  3. 지구력 향상 (Endurance)                                                  │
│     ─────────────────────────────────────────                               │
│     권장 존: Zone 3 중심 (70-80%)                                           │
│     운동 타입: 장거리 유산소, 템포런                                        │
│     권장 시간: 30-90분/회, 주 4-5회                                         │
│     진행: 주당 10% 이내 거리/시간 증가                                      │
│     주간 구성: 장거리 1회 + 템포 1회 + 회복 2-3회                           │
│                                                                              │
│  4. 유연성/회복 (Flexibility)                                                │
│     ─────────────────────────────────────────                               │
│     권장 존: Zone 1-2 (50-70%)                                              │
│     운동 타입: 정적 스트레칭, 요가, 필라테스                                │
│     권장 시간: 20-45분/회, 주 3-5회                                         │
│     스트레칭: 각 동작 30-60초 유지                                          │
│     호흡: 깊고 느린 호흡 유지                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

```typescript
// 목표별 프로토콜 타입 정의
interface GoalProtocol {
  primaryZones: number[];           // 주요 심박수 존 (1-5)
  sessionDuration: { min: number; max: number };  // 분
  weeklyFrequency: { min: number; max: number };
  intensity: { min: number; max: number };        // %HRmax
  restBetweenSets: number;          // 초
  progressionRate: number;          // 주당 증가율 %
}

const GOAL_PROTOCOLS: Record<string, GoalProtocol> = {
  weight_loss: {
    primaryZones: [2, 3],
    sessionDuration: { min: 45, max: 60 },
    weeklyFrequency: { min: 4, max: 5 },
    intensity: { min: 60, max: 80 },
    restBetweenSets: 30,
    progressionRate: 5,
  },
  muscle_gain: {
    primaryZones: [3, 4],
    sessionDuration: { min: 45, max: 60 },
    weeklyFrequency: { min: 3, max: 4 },
    intensity: { min: 70, max: 90 },
    restBetweenSets: 90,
    progressionRate: 10,
  },
  endurance: {
    primaryZones: [2, 3],
    sessionDuration: { min: 30, max: 90 },
    weeklyFrequency: { min: 4, max: 5 },
    intensity: { min: 65, max: 80 },
    restBetweenSets: 60,
    progressionRate: 10,
  },
  flexibility: {
    primaryZones: [1, 2],
    sessionDuration: { min: 20, max: 45 },
    weeklyFrequency: { min: 3, max: 5 },
    intensity: { min: 50, max: 70 },
    restBetweenSets: 15,
    progressionRate: 5,
  },
};
```

#### 2.5.5 스트레칭 개인화 (W-2 연계)

> 근육 유연성 점수에 따른 동작 난이도 및 강도 조절

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       스트레칭 개인화 프로토콜 (W-2)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  유연성 점수 산출 (Flexibility Score, 0-100)                                │
│  ─────────────────────────────────────────────                              │
│  - Sit-and-Reach 테스트: 전방 굴곡 도달 거리                                │
│  - 어깨 유연성: 양손 등 뒤 연결 가능 여부                                   │
│  - 고관절 가동 범위: 외전/내전/굴곡/신전 각도                               │
│  - 종합 점수 = (개별 점수 가중 평균)                                        │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  유연성   │ 점수    │ 동작 난이도    │ 보조 도구      │ 유지 시간  │ 강도   │
│  수준     │ 범위    │                │                │            │        │
│ ──────────┼─────────┼────────────────┼────────────────┼────────────┼─────── │
│  낮음     │ 0-40    │ 기본 동작      │ 스트랩, 블록,  │ 15-20초    │ RPE    │
│  (제한)   │         │ (가동 범위 축소)│ 의자 지지      │            │ 2-3    │
│ ──────────┼─────────┼────────────────┼────────────────┼────────────┼─────── │
│  보통     │ 40-70   │ 표준 동작      │ 선택적 사용    │ 30-45초    │ RPE    │
│  (평균)   │         │ (정상 가동범위)│                │            │ 3-5    │
│ ──────────┼─────────┼────────────────┼────────────────┼────────────┼─────── │
│  높음     │ 70-100  │ 심화 동작      │ 불필요         │ 45-60초    │ RPE    │
│  (우수)   │         │ (확장 가동범위)│                │            │ 4-6    │
│                                                                              │
│  ⚠️ 주의: 통증 = 즉시 중단. 불편함 ≠ 통증                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

```typescript
// 스트레칭 개인화 타입
interface FlexibilityAssessment {
  overall: number;                  // 0-100 종합 점수
  sitAndReach: number;              // cm (0 = 발끝)
  shoulderFlexibility: 'poor' | 'average' | 'good';
  hipMobility: {
    flexion: number;                // 도 (정상: 120°)
    extension: number;              // 도 (정상: 30°)
    abduction: number;              // 도 (정상: 45°)
  };
}

interface StretchingProtocol {
  difficulty: 'basic' | 'standard' | 'advanced';
  holdDuration: { min: number; max: number };  // 초
  targetRPE: { min: number; max: number };
  useProps: boolean;
  propsRecommended: string[];
  modifications: string[];
}

function getStretchingProtocol(
  flexibility: FlexibilityAssessment
): StretchingProtocol {
  const score = flexibility.overall;

  if (score < 40) {
    return {
      difficulty: 'basic',
      holdDuration: { min: 15, max: 20 },
      targetRPE: { min: 2, max: 3 },
      useProps: true,
      propsRecommended: ['요가 스트랩', '요가 블록', '의자', '벽'],
      modifications: [
        '가동 범위를 50-70%로 제한',
        '무릎 굽힘 허용 (햄스트링 스트레칭)',
        '지지대 적극 활용',
        '호흡에 집중, 강제로 늘리지 않음',
      ],
    };
  }

  if (score < 70) {
    return {
      difficulty: 'standard',
      holdDuration: { min: 30, max: 45 },
      targetRPE: { min: 3, max: 5 },
      useProps: false,  // 선택적
      propsRecommended: ['요가 블록 (선택)'],
      modifications: [
        '정상 가동 범위 목표',
        '점진적 깊이 증가',
        '양측 균형 확인',
      ],
    };
  }

  return {
    difficulty: 'advanced',
    holdDuration: { min: 45, max: 60 },
    targetRPE: { min: 4, max: 6 },
    useProps: false,
    propsRecommended: [],
    modifications: [
      '확장된 가동 범위 탐색',
      'PNF 스트레칭 적용 가능',
      '동적 스트레칭 추가',
      '근막 이완 기법 병행',
    ],
  };
}

// 특정 근육군별 스트레칭 난이도 조절
interface MuscleSpecificStretching {
  muscle: string;
  basicVariation: string;
  standardVariation: string;
  advancedVariation: string;
}

const MUSCLE_STRETCHING_PROGRESSIONS: MuscleSpecificStretching[] = [
  {
    muscle: 'hamstrings',
    basicVariation: '의자에 발 올려 앞으로 기울이기',
    standardVariation: '서서 한 발 앞으로 뻗고 기울이기',
    advancedVariation: '스탠딩 스플릿 또는 전굴',
  },
  {
    muscle: 'hip_flexors',
    basicVariation: '반 무릎 꿇기 (의자 지지)',
    standardVariation: '런지 자세 고관절 스트레칭',
    advancedVariation: '피전 자세 (Pigeon Pose)',
  },
  {
    muscle: 'chest',
    basicVariation: '문틀에 팔꿈치 대고 가볍게',
    standardVariation: '문틀 스트레칭 (90도 팔)',
    advancedVariation: '바닥 가슴 오프너 + 호흡',
  },
  {
    muscle: 'upper_trapezius',
    basicVariation: '앉아서 한 손으로 머리 가볍게',
    standardVariation: '귀-어깨 스트레칭 + 반대 팔 고정',
    advancedVariation: 'Levator Scapulae 심화 + 회전',
  },
];
```

#### 2.5.6 개인화 공식 통합 예시

```typescript
/**
 * 완전 개인화 운동 처방 생성
 *
 * MET 칼로리, 심박수 존, 피트니스 레벨, 나이, 유연성을 모두 고려
 */
interface ComprehensivePersonalization {
  user: {
    age: number;
    sex: 'male' | 'female';
    weightKg: number;
    restingHR: number;
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    flexibilityScore: number;
  };
  goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'flexibility';
}

interface PersonalizedWorkoutPlan {
  targetHRZone: { min: number; max: number; zoneName: string };
  sessionDuration: number;          // 분
  estimatedCalories: number;        // kcal
  exerciseIntensity: {
    volumeMultiplier: number;
    restMultiplier: number;
    maxRPE: number;
  };
  stretchingProtocol: StretchingProtocol;
  weeklySchedule: string[];
  safetyNotes: string[];
}

function generatePersonalizedPlan(
  input: ComprehensivePersonalization
): PersonalizedWorkoutPlan {
  const { user, goal } = input;

  // 1. 나이 그룹 및 제한 계산
  const ageGroup = getAgeGroup(user.age);
  const ageLimit = AGE_INTENSITY_LIMITS[ageGroup];
  const ageRecovery = AGE_RECOVERY_COEFFICIENTS[ageGroup];

  // 2. 목표 프로토콜 가져오기
  const protocol = GOAL_PROTOCOLS[goal];

  // 3. 피트니스 레벨 조정
  const levelMultiplier = FITNESS_LEVEL_MULTIPLIERS[user.fitnessLevel];

  // 4. 개인화 강도 계산
  const personalizedIntensity = calculatePersonalizedIntensity(
    protocol.intensity.max / 100,
    {
      age: user.age,
      fitnessLevel: user.fitnessLevel,
      goal,
      restingHR: user.restingHR,
    }
  );

  // 5. 심박수 존 결정
  const primaryZone = protocol.primaryZones[0];
  const hrMax = 208 - (0.7 * user.age);
  const hrReserve = hrMax - user.restingHR;
  const zones = calculateKarvonenZones(user.age, user.restingHR);
  const targetZone = zones[primaryZone - 1];

  // 6. 세션 시간 계산 (나이 고려)
  const baseDuration = (protocol.sessionDuration.min + protocol.sessionDuration.max) / 2;
  const sessionDuration = Math.round(baseDuration * ageRecovery);

  // 7. 칼로리 추정 (MET 기반)
  // 목표별 평균 MET 값
  const goalMET: Record<string, number> = {
    weight_loss: 5.0,     // Zone 2-3 유산소
    muscle_gain: 6.0,     // 저항 운동
    endurance: 7.0,       // Zone 3 달리기
    flexibility: 2.5,     // 스트레칭
  };

  const estimatedCalories = Math.round(
    goalMET[goal] * user.weightKg * (sessionDuration / 60)
  );

  // 8. 스트레칭 프로토콜 (유연성 기반)
  const stretchingProtocol = getStretchingProtocol({
    overall: user.flexibilityScore,
    sitAndReach: 0,  // 실제 값 필요
    shoulderFlexibility: user.flexibilityScore >= 70 ? 'good' : user.flexibilityScore >= 40 ? 'average' : 'poor',
    hipMobility: { flexion: 120, extension: 30, abduction: 45 },  // 기본값
  });

  // 9. 주간 스케줄 생성
  const weeklySchedule = generateWeeklySchedule(goal, user.fitnessLevel);

  // 10. 안전 노트 수집
  const safetyNotes = [
    ...personalizedIntensity.warnings,
  ];

  if (user.fitnessLevel === 'beginner') {
    safetyNotes.push('처음 2주는 목표 강도의 70%로 시작하세요.');
  }

  if (user.flexibilityScore < 40) {
    safetyNotes.push('유연성이 낮습니다. 스트레칭 시 보조 도구를 사용하세요.');
  }

  return {
    targetHRZone: {
      min: targetZone.minHR,
      max: targetZone.maxHR,
      zoneName: targetZone.name,
    },
    sessionDuration,
    estimatedCalories,
    exerciseIntensity: {
      volumeMultiplier: personalizedIntensity.volumeMultiplier,
      restMultiplier: personalizedIntensity.restMultiplier,
      maxRPE: ageLimit.maxRPE,
    },
    stretchingProtocol,
    weeklySchedule,
    safetyNotes,
  };
}

function generateWeeklySchedule(
  goal: string,
  level: 'beginner' | 'intermediate' | 'advanced'
): string[] {
  const schedules: Record<string, Record<string, string[]>> = {
    weight_loss: {
      beginner: ['유산소 30분', '휴식', '유산소 30분', '휴식', '유산소 30분', '활동적 회복', '휴식'],
      intermediate: ['유산소 45분', 'HIIT 20분', '유산소 45분', '휴식', '유산소 45분', 'HIIT 20분', '휴식'],
      advanced: ['유산소 60분', 'HIIT 30분', '유산소 45분', 'HIIT 30분', '유산소 60분', '활동적 회복', '휴식'],
    },
    muscle_gain: {
      beginner: ['전신 30분', '휴식', '전신 30분', '휴식', '전신 30분', '휴식', '휴식'],
      intermediate: ['상체', '하체', '휴식', '상체', '하체', '휴식', '휴식'],
      advanced: ['가슴/삼두', '등/이두', '하체', '어깨/코어', '전신', '활동적 회복', '휴식'],
    },
    endurance: {
      beginner: ['달리기 20분', '휴식', '달리기 20분', '휴식', '달리기 30분', '휴식', '휴식'],
      intermediate: ['템포런 30분', '회복런', '인터벌', '휴식', '장거리 45분', '회복런', '휴식'],
      advanced: ['템포런 45분', '회복런', '인터벌', '템포런 30분', '장거리 60분+', '회복런', '휴식'],
    },
    flexibility: {
      beginner: ['스트레칭 15분', '휴식', '스트레칭 15분', '휴식', '스트레칭 15분', '휴식', '휴식'],
      intermediate: ['요가 30분', '스트레칭 20분', '요가 30분', '휴식', '스트레칭 30분', '요가 30분', '휴식'],
      advanced: ['요가 45분', '심화 스트레칭', '요가 45분', 'PNF 스트레칭', '요가 45분', '명상/호흡', '휴식'],
    },
  };

  return schedules[goal]?.[level] || schedules.weight_loss.beginner;
}
```

### 2.6 Crossed Syndrome 진단 기준 (MediaPipe 연계)

#### 측정 랜드마크 정의

```
MediaPipe Pose 랜드마크 (측면 촬영 기준):
──────────────────────────────────────────
0: 코 (nose)
7: 왼쪽 귀 (left_ear)
8: 오른쪽 귀 (right_ear)
11: 왼쪽 어깨 (left_shoulder)
12: 오른쪽 어깨 (right_shoulder)
23: 왼쪽 엉덩이 (left_hip)
24: 오른쪽 엉덩이 (right_hip)
25: 왼쪽 무릎 (left_knee)
26: 오른쪽 무릎 (right_knee)
27: 왼쪽 발목 (left_ankle)
28: 오른쪽 발목 (right_ankle)

추가 계산점:
- C7 (경추 7번): 어깨 중점에서 수직 상방 추정
- T1, T12, L1, S1: 어깨-엉덩이 선에서 비율로 추정
- Tragus (귀 구슬): 귀(ear) 랜드마크 활용
```

#### Upper Crossed Syndrome (UCS) 진단 기준

```
┌─────────────────────────────────────────────────────────────┐
│           Upper Crossed Syndrome 정량적 진단 기준            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CVA (Craniovertebral Angle) - 두개척추각                │
│     ────────────────────────────────────────                │
│     측정: angle(tragus → C7, horizontal)                   │
│     MediaPipe: angle(ear → shoulder_midpoint, horizontal)   │
│                                                              │
│     │ 상태     │ 각도    │ 심각도  │                        │
│     │──────────│─────────│─────────│                        │
│     │ 정상     │ ≥ 50°   │ -       │                        │
│     │ 경미     │ 45-49°  │ Mild    │                        │
│     │ 중등도   │ 40-44°  │ Moderate│                        │
│     │ 심각     │ < 40°   │ Severe  │                        │
│                                                              │
│  2. FSA (Forward Shoulder Angle) - 전방 어깨 각도           │
│     ────────────────────────────────────────                │
│     측정: shoulder 중심이 hip 중심보다 전방 이동한 거리     │
│     MediaPipe: shoulder_x - hip_x (측면 기준)               │
│                                                              │
│     │ 상태     │ 편차(cm)│ 심각도  │                        │
│     │──────────│─────────│─────────│                        │
│     │ 정상     │ < 2     │ -       │                        │
│     │ 경미     │ 2-4     │ Mild    │                        │
│     │ 중등도   │ 4-6     │ Moderate│                        │
│     │ 심각     │ > 6     │ Severe  │                        │
│                                                              │
│  3. 흉추 후만 (Thoracic Kyphosis)                           │
│     ────────────────────────────────────────                │
│     정상 범위: 20-40° (Cobb angle 기준)                     │
│     40-50°: 경미한 과후만                                   │
│     50-60°: 중등도                                          │
│     > 60°: 심각한 과후만                                    │
│                                                              │
│  UCS 판정: CVA < 45° AND (FSA > 4cm OR 흉추 > 45°)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Lower Crossed Syndrome (LCS) 진단 기준

```
┌─────────────────────────────────────────────────────────────┐
│           Lower Crossed Syndrome 정량적 진단 기준            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. APT (Anterior Pelvic Tilt) - 골반 전방 경사             │
│     ────────────────────────────────────────                │
│     측정: angle(ASIS → PSIS, horizontal)                   │
│     MediaPipe 근사: angle(hip_front → hip_back, horizontal) │
│                                                              │
│     │ 상태     │ 경사도  │ 심각도  │ 특징                   │
│     │──────────│─────────│─────────│────────────────────────│
│     │ 후방경사 │ < 5°    │ -       │ 편평등/스웨이백 의심   │
│     │ 정상     │ 5-10°   │ -       │ 정상 범위              │
│     │ 경미     │ 10-15°  │ Mild    │ 장요근 단축 의심       │
│     │ 중등도   │ 15-20°  │ Moderate│ 요추 과전만 동반       │
│     │ 심각     │ > 20°   │ Severe  │ 요통 위험 높음         │
│                                                              │
│  2. 요추 전만 (Lumbar Lordosis)                             │
│     ────────────────────────────────────────                │
│     정상 범위: 40-60° (Cobb angle 기준)                     │
│                                                              │
│     │ 상태     │ 각도    │ 특징                             │
│     │──────────│─────────│──────────────────────────────────│
│     │ 편평     │ < 30°   │ 편평등 자세, 햄스트링 단축       │
│     │ 감소     │ 30-40°  │ 경미한 편평                      │
│     │ 정상     │ 40-60°  │ 정상 곡선                        │
│     │ 증가     │ 60-70°  │ 경미한 과전만                    │
│     │ 과전만   │ > 70°   │ 골반 전방경사 동반               │
│                                                              │
│  3. Thomas Test (고관절 굴곡근 단축)                        │
│     ────────────────────────────────────────                │
│     양성 기준: 허벅지가 테이블에서 떠오름                   │
│     각도 측정: 테이블과 허벅지 사이 각도                    │
│     정상: 0-10°, 단축: > 10°                               │
│                                                              │
│  LCS 판정: APT > 15° AND (요추 > 60° OR Thomas > 15°)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 종합 자세 불균형 진단 알고리즘

```typescript
interface PostureMeasurements {
  // 상부
  cva: number;              // 두개척추각 (°)
  fsa: number;              // 전방어깨각 (cm)
  thoracicKyphosis: number; // 흉추 후만 (°)

  // 하부
  anteriorPelvicTilt: number; // 골반 전방경사 (°)
  lumbarLordosis: number;     // 요추 전만 (°)

  // 정면
  shoulderTilt: number;       // 어깨 기울기 (°)
  pelvicTilt: number;         // 골반 기울기 (°)
}

interface CrossedSyndromeDiagnosis {
  upperCrossed: {
    detected: boolean;
    severity: 'none' | 'mild' | 'moderate' | 'severe';
    indicators: string[];
  };
  lowerCrossed: {
    detected: boolean;
    severity: 'none' | 'mild' | 'moderate' | 'severe';
    indicators: string[];
  };
  swayBack: boolean;
  flatBack: boolean;
}

function diagnoseCrossedSyndrome(
  measurements: PostureMeasurements
): CrossedSyndromeDiagnosis {
  const result: CrossedSyndromeDiagnosis = {
    upperCrossed: { detected: false, severity: 'none', indicators: [] },
    lowerCrossed: { detected: false, severity: 'none', indicators: [] },
    swayBack: false,
    flatBack: false,
  };

  // === Upper Crossed Syndrome 진단 ===
  const ucsIndicators: string[] = [];

  // CVA 평가
  if (measurements.cva < 40) {
    ucsIndicators.push('심각한 거북목 (CVA < 40°)');
  } else if (measurements.cva < 45) {
    ucsIndicators.push('중등도 거북목 (CVA 40-45°)');
  } else if (measurements.cva < 50) {
    ucsIndicators.push('경미한 거북목 (CVA 45-50°)');
  }

  // FSA 평가
  if (measurements.fsa > 6) {
    ucsIndicators.push('심각한 라운드숄더 (FSA > 6cm)');
  } else if (measurements.fsa > 4) {
    ucsIndicators.push('중등도 라운드숄더 (FSA 4-6cm)');
  } else if (measurements.fsa > 2) {
    ucsIndicators.push('경미한 라운드숄더 (FSA 2-4cm)');
  }

  // 흉추 후만 평가
  if (measurements.thoracicKyphosis > 50) {
    ucsIndicators.push('과도한 흉추 후만 (> 50°)');
  }

  // UCS 판정
  if (measurements.cva < 45 && (measurements.fsa > 4 || measurements.thoracicKyphosis > 45)) {
    result.upperCrossed.detected = true;
    result.upperCrossed.indicators = ucsIndicators;
    result.upperCrossed.severity =
      measurements.cva < 35 || measurements.fsa > 6 ? 'severe' :
      measurements.cva < 40 || measurements.fsa > 4 ? 'moderate' : 'mild';
  }

  // === Lower Crossed Syndrome 진단 ===
  const lcsIndicators: string[] = [];

  // APT 평가
  if (measurements.anteriorPelvicTilt > 20) {
    lcsIndicators.push('심각한 골반 전방경사 (APT > 20°)');
  } else if (measurements.anteriorPelvicTilt > 15) {
    lcsIndicators.push('중등도 골반 전방경사 (APT 15-20°)');
  } else if (measurements.anteriorPelvicTilt > 10) {
    lcsIndicators.push('경미한 골반 전방경사 (APT 10-15°)');
  }

  // 요추 전만 평가
  if (measurements.lumbarLordosis > 70) {
    lcsIndicators.push('심각한 요추 과전만 (> 70°)');
  } else if (measurements.lumbarLordosis > 60) {
    lcsIndicators.push('증가된 요추 전만 (60-70°)');
  }

  // LCS 판정
  if (measurements.anteriorPelvicTilt > 15 && measurements.lumbarLordosis > 60) {
    result.lowerCrossed.detected = true;
    result.lowerCrossed.indicators = lcsIndicators;
    result.lowerCrossed.severity =
      measurements.anteriorPelvicTilt > 20 ? 'severe' :
      measurements.anteriorPelvicTilt > 15 ? 'moderate' : 'mild';
  }

  // === 특수 자세 패턴 ===
  // 스웨이백: 골반 전방 이동 + 요추 편평
  if (measurements.anteriorPelvicTilt < 5 && measurements.lumbarLordosis < 35) {
    result.swayBack = true;
  }

  // 편평등: 흉추/요추 곡선 모두 감소
  if (measurements.thoracicKyphosis < 20 && measurements.lumbarLordosis < 35) {
    result.flatBack = true;
  }

  return result;
}
```

### 2.7 나이별/성별 근력 기준값 (ACSM, NSCA 2024 가이드라인)

#### 푸시업 테스트 기준 (1분간 최대 횟수)³

| 연령대 | 성별 | 우수 | 양호 | 보통 | 미흡 | 매우 미흡 |
|--------|------|------|------|------|------|----------|
| **20-29세** | 남 | ≥ 47 | 35-46 | 22-34 | 17-21 | ≤ 16 |
| | 여 | ≥ 36 | 30-35 | 21-29 | 15-20 | ≤ 14 |
| **30-39세** | 남 | ≥ 41 | 30-40 | 17-29 | 12-16 | ≤ 11 |
| | 여 | ≥ 31 | 24-30 | 15-23 | 10-14 | ≤ 9 |
| **40-49세** | 남 | ≥ 34 | 24-33 | 13-23 | 9-12 | ≤ 8 |
| | 여 | ≥ 26 | 18-25 | 11-17 | 6-10 | ≤ 5 |
| **50-59세** | 남 | ≥ 28 | 19-27 | 10-18 | 6-9 | ≤ 5 |
| | 여 | ≥ 22 | 13-21 | 7-12 | 3-6 | ≤ 2 |
| **60-69세** | 남 | ≥ 23 | 14-22 | 5-13 | 3-4 | ≤ 2 |
| | 여 | ≥ 17 | 11-16 | 5-10 | 2-4 | ≤ 1 |

#### 플랭크 지속 시간 기준 (초)⁴

| 연령대 | 성별 | 우수 | 양호 | 보통 | 미흡 |
|--------|------|------|------|------|------|
| **20-29세** | 남 | ≥ 120 | 90-119 | 60-89 | < 60 |
| | 여 | ≥ 100 | 75-99 | 45-74 | < 45 |
| **30-39세** | 남 | ≥ 100 | 75-99 | 45-74 | < 45 |
| | 여 | ≥ 80 | 60-79 | 35-59 | < 35 |
| **40-49세** | 남 | ≥ 80 | 60-79 | 35-59 | < 35 |
| | 여 | ≥ 60 | 45-59 | 30-44 | < 30 |
| **50-59세** | 남 | ≥ 60 | 45-59 | 30-44 | < 30 |
| | 여 | ≥ 45 | 30-44 | 20-29 | < 20 |
| **60+세** | 남 | ≥ 45 | 30-44 | 20-29 | < 20 |
| | 여 | ≥ 30 | 20-29 | 15-19 | < 15 |

#### 스쿼트 기준 (체중 대비 1RM 비율)⁵

| 수준 | 남성 | 여성 | 설명 |
|------|------|------|------|
| **초보자** | 0.75x | 0.5x | 훈련 3개월 미만 |
| **중급자** | 1.25x | 0.85x | 훈련 1-2년 |
| **상급자** | 1.75x | 1.25x | 훈련 3-5년 |
| **엘리트** | 2.25x | 1.5x | 훈련 5년+ |

```typescript
// 근력 평가 타입 정의
interface StrengthAssessment {
  testType: 'pushup' | 'plank' | 'squat_1rm';
  value: number;
  age: number;
  sex: 'male' | 'female';
}

interface StrengthResult {
  category: 'excellent' | 'good' | 'average' | 'fair' | 'poor';
  percentile: number;
  recommendation: string;
}

// 푸시업 평가 기준 데이터
const PUSHUP_STANDARDS: Record<string, Record<string, number[]>> = {
  male: {
    '20-29': [47, 35, 22, 17, 0],  // [excellent, good, average, fair, poor]
    '30-39': [41, 30, 17, 12, 0],
    '40-49': [34, 24, 13, 9, 0],
    '50-59': [28, 19, 10, 6, 0],
    '60-69': [23, 14, 5, 3, 0],
  },
  female: {
    '20-29': [36, 30, 21, 15, 0],
    '30-39': [31, 24, 15, 10, 0],
    '40-49': [26, 18, 11, 6, 0],
    '50-59': [22, 13, 7, 3, 0],
    '60-69': [17, 11, 5, 2, 0],
  },
};

function assessPushupStrength(
  reps: number,
  age: number,
  sex: 'male' | 'female'
): StrengthResult {
  const ageGroup = getAgeGroup(age);
  const standards = PUSHUP_STANDARDS[sex][ageGroup];

  let category: StrengthResult['category'];
  if (reps >= standards[0]) category = 'excellent';
  else if (reps >= standards[1]) category = 'good';
  else if (reps >= standards[2]) category = 'average';
  else if (reps >= standards[3]) category = 'fair';
  else category = 'poor';

  // 백분위 추정 (정규분포 가정)
  const percentile = estimatePercentile(reps, standards);

  return {
    category,
    percentile,
    recommendation: getStrengthRecommendation(category, 'pushup'),
  };
}

function getAgeGroup(age: number): string {
  if (age < 30) return '20-29';
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  if (age < 60) return '50-59';
  return '60-69';
}

function estimatePercentile(value: number, standards: number[]): number {
  // standards[0] = 상위 10%, standards[1] = 상위 30%, standards[2] = 상위 50%
  // standards[3] = 상위 70%, 이하 = 하위 30%
  if (value >= standards[0]) return 90 + ((value - standards[0]) / standards[0]) * 10;
  if (value >= standards[1]) return 70 + ((value - standards[1]) / (standards[0] - standards[1])) * 20;
  if (value >= standards[2]) return 50 + ((value - standards[2]) / (standards[1] - standards[2])) * 20;
  if (value >= standards[3]) return 30 + ((value - standards[3]) / (standards[2] - standards[3])) * 20;
  return Math.max(0, (value / standards[3]) * 30);
}

function getStrengthRecommendation(
  category: StrengthResult['category'],
  testType: string
): string {
  const recommendations: Record<string, Record<string, string>> = {
    pushup: {
      excellent: '현재 상체 근력이 우수합니다. 난이도를 높이거나 변형 푸시업을 시도하세요.',
      good: '양호한 수준입니다. 주 3회 푸시업 훈련으로 우수 수준을 목표로 하세요.',
      average: '평균 수준입니다. 무릎 푸시업부터 점진적으로 횟수를 늘려가세요.',
      fair: '개선이 필요합니다. 벽 푸시업부터 시작하여 점진적으로 강도를 높이세요.',
      poor: '기초 근력 강화가 필요합니다. 전문가 상담 후 개인화 프로그램을 권장합니다.',
    },
    plank: {
      excellent: '코어 근력이 우수합니다. 사이드 플랭크 등 변형을 추가하세요.',
      good: '양호합니다. 30초씩 점진적으로 늘려 2분을 목표로 하세요.',
      average: '평균입니다. 매일 플랭크 연습으로 지속 시간을 늘리세요.',
      fair: '코어 강화가 필요합니다. 무릎 플랭크부터 시작하세요.',
      poor: '기초 코어 안정화 운동부터 시작하세요. 데드버그 추천.',
    },
  };

  return recommendations[testType]?.[category] || '전문가 상담을 권장합니다.';
}
```

### 2.8 1RM 추정

```typescript
// Brzycki 공식 (1993)
function estimateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps > 10) {
    console.warn('10회 이상은 정확도 감소');
  }
  return weight * (36 / (37 - reps));
}

// 퍼센트별 추천 반복수
const LOAD_REP_TABLE: Record<number, { reps: string; purpose: string }> = {
  100: { reps: '1', purpose: '최대 근력 테스트' },
  95: { reps: '2', purpose: '최대 근력' },
  90: { reps: '3-4', purpose: '근력/파워' },
  85: { reps: '5-6', purpose: '근력' },
  80: { reps: '7-8', purpose: '근력/근비대' },
  75: { reps: '9-10', purpose: '근비대' },
  70: { reps: '11-12', purpose: '근비대/지구력' },
  65: { reps: '13-15', purpose: '근지구력' },
  60: { reps: '16-20', purpose: '근지구력' },
};
```

---

## 3. 운동 데이터베이스 구조

### 3.1 운동 스키마

```typescript
interface Exercise {
  id: string;
  nameKo: string;
  nameEn: string;
  category: ExerciseCategory;
  targetMuscles: MuscleGroup[];
  synergistMuscles: MuscleGroup[];
  equipment: Equipment[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  videoUrl?: string;
  imageUrls: string[];
  contraindications: string[];
  modifications: ExerciseModification[];
}

type ExerciseCategory =
  | 'stretch'           // 스트레칭
  | 'activation'        // 활성화
  | 'strength'          // 근력
  | 'cardio'            // 유산소
  | 'mobility'          // 가동성
  | 'balance';          // 균형

type MuscleGroup =
  | 'pectoralis_major'     // 대흉근
  | 'upper_trapezius'      // 상부 승모근
  | 'mid_lower_trapezius'  // 중/하부 승모근
  | 'latissimus_dorsi'     // 광배근
  | 'serratus_anterior'    // 전거근
  | 'rhomboids'            // 능형근
  | 'deep_neck_flexors'    // 심부 경추 굴곡근
  | 'rectus_abdominis'     // 복직근
  | 'transverse_abdominis' // 복횡근
  | 'iliopsoas'            // 장요근
  | 'gluteus_maximus'      // 대둔근
  | 'gluteus_medius'       // 중둔근
  | 'hamstrings'           // 햄스트링
  | 'quadriceps'           // 대퇴사두근
  | 'erector_spinae';      // 척추기립근

type Equipment =
  | 'bodyweight'
  | 'dumbbell'
  | 'barbell'
  | 'resistance_band'
  | 'foam_roller'
  | 'wall'
  | 'chair'
  | 'mat';

interface ExerciseModification {
  name: string;
  description: string;
  forCondition: string;  // '무릎 통증', '임산부' 등
}
```

### 3.2 불균형별 운동 프로토콜

```typescript
interface ExerciseProtocol {
  stretches: string[];      // 운동 ID 목록
  activations: string[];
  strengthening: string[];
  frequency: string;
  duration: string;
  progression: ProgressionPlan;
}

const POSTURE_PROTOCOLS: Record<PostureImbalanceType, ExerciseProtocol> = {
  upper_cross: {
    stretches: [
      'chest_doorway_stretch',      // 대흉근
      'upper_trap_stretch',         // 상부 승모근
      'levator_scapulae_stretch',   // 견갑거근
      'suboccipital_release',       // 후두하근
      'scalene_stretch',            // 사각근
    ],
    activations: [
      'chin_tucks',                 // 심부 경추 굴곡근
      'wall_angels',                // 중/하 승모근, 전거근
      'prone_y_t_w',                // 능형근, 중/하 승모근
    ],
    strengthening: [
      'face_pulls',                 // 후방 삼각근, 능형근
      'rows',                       // 광배근, 능형근
      'external_rotation',          // 극하근, 소원근
      'serratus_push_up_plus',      // 전거근
    ],
    frequency: '주 5-6회 (스트레칭), 주 3회 (강화)',
    duration: '스트레칭 30-60초 x 2-3세트, 강화 10-15회 x 3세트',
    progression: {
      week1to2: '스트레칭 위주',
      week3to4: '활성화 추가',
      week5plus: '점진적 강화',
    },
  },

  lower_cross: {
    stretches: [
      'hip_flexor_stretch',         // 장요근
      'quad_stretch',               // 대퇴직근
      'lower_back_cat_cow',         // 척추기립근
      'piriformis_stretch',         // 이상근
    ],
    activations: [
      'glute_bridge',               // 대둔근 활성화
      'dead_bug',                   // 복횡근
      'clamshell',                  // 중둔근
    ],
    strengthening: [
      'hip_thrust',                 // 대둔근
      'plank',                      // 복직근, 복횡근
      'pallof_press',               // 코어 항회전
      'side_plank',                 // 복사근, 중둔근
    ],
    frequency: '주 5-6회 (스트레칭), 주 3회 (강화)',
    duration: '스트레칭 30-60초 x 2-3세트, 강화 10-15회 x 3세트',
    progression: {
      week1to2: '스트레칭 위주',
      week3to4: '활성화 추가',
      week5plus: '점진적 강화',
    },
  },

  sway_back: {
    stretches: [
      'hamstring_stretch',          // 햄스트링
      'upper_ab_stretch',           // 상부 복직근
      'thoracic_extension',         // 흉추 신전
    ],
    activations: [
      'hip_flexor_activation',      // 장요근 활성화
      'lower_ab_engagement',        // 하부 복근
    ],
    strengthening: [
      'hip_flexor_strengthening',   // 장요근 강화
      'lower_ab_exercises',         // 하부 복근
      'back_extension',             // 척추기립근
    ],
    frequency: '주 4-5회',
    duration: '스트레칭 30-45초 x 2세트, 강화 12-15회 x 2-3세트',
    progression: {
      week1to2: '신경근 재교육',
      week3to4: '강화 도입',
      week5plus: '통합 운동',
    },
  },

  flat_back: {
    stretches: [
      'hamstring_stretch',          // 햄스트링
      'rectus_abdominis_stretch',   // 복직근
    ],
    activations: [
      'cat_cow',                    // 척추 가동성
      'pelvic_tilts',               // 골반 움직임 인지
    ],
    strengthening: [
      'hip_flexor_strengthening',   // 장요근
      'back_extension_prone',       // 척추기립근
      'superman',                   // 후방 사슬
    ],
    frequency: '주 4-5회',
    duration: '스트레칭 30-45초 x 2세트, 강화 10-12회 x 2-3세트',
    progression: {
      week1to2: '가동성 회복',
      week3to4: '정상 곡선 재학습',
      week5plus: '근력 강화',
    },
  },
};

interface ProgressionPlan {
  week1to2: string;
  week3to4: string;
  week5plus: string;
}
```

---

## 4. 운동 추천 알고리즘 공식화

### 4.1 알고리즘 개요

```
┌─────────────────────────────────────────────────────────────────┐
│               운동 추천 알고리즘 플로우                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  입력 (Input)                                                    │
│  ├── 체형 분석 결과 (C-1)                                       │
│  │   ├── 체형 유형 (ectomorph/mesomorph/endomorph)              │
│  │   └── 자세 불균형 (UCS/LCS/SwayBack/FlatBack)                │
│  ├── 사용자 프로필                                              │
│  │   ├── 나이, 성별, 체중                                       │
│  │   ├── 피트니스 레벨 (beginner/intermediate/advanced)         │
│  │   └── 금기사항                                               │
│  ├── 운동 환경                                                  │
│  │   ├── 가용 장비                                              │
│  │   └── 가용 시간 (분)                                         │
│  └── 운동 목표                                                  │
│      └── toner/builder/burner/mover/flexer                      │
│                                                                  │
│                         ↓                                        │
│                                                                  │
│  처리 (Processing)                                               │
│  ├── 1. 불균형 기반 운동 선정                                   │
│  │   └── POSTURE_PROTOCOLS[불균형유형]                          │
│  ├── 2. 목표 기반 운동 타입 매칭                                │
│  │   └── WORKOUT_TYPE_DEFINITIONS[목표]                         │
│  ├── 3. 금기사항 필터링                                         │
│  ├── 4. 장비 기반 대체 운동 적용                                │
│  ├── 5. 난이도 조절                                             │
│  └── 6. 시간 제약 최적화                                        │
│                                                                  │
│                         ↓                                        │
│                                                                  │
│  출력 (Output)                                                   │
│  ├── 개인화 운동 리스트                                         │
│  │   ├── 스트레칭 (단축 근육)                                   │
│  │   ├── 활성화 (약화 근육)                                     │
│  │   └── 강화 (목표 기반)                                       │
│  ├── 세트/반복/휴식 파라미터                                    │
│  ├── 예상 칼로리 소모                                           │
│  └── 주간 플랜                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 자세 불균형 → 운동 유형 매핑 테이블

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      자세 불균형 → 운동 매핑 테이블                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  불균형 유형     │ 스트레칭 대상        │ 강화 대상           │ 우선순위   │
│  ─────────────────────────────────────────────────────────────────────────── │
│  UCS (상부교차) │ 대흉근, 소흉근,      │ 심부경추굴곡근,     │ P1: CVA   │
│                 │ 상부승모근, 견갑거근 │ 중/하승모근, 전거근 │    FSA    │
│  ─────────────────────────────────────────────────────────────────────────── │
│  LCS (하부교차) │ 장요근, 대퇴직근,    │ 복직근, 복횡근,     │ P1: APT   │
│                 │ 요방형근, 척추기립근 │ 대둔근, 중둔근      │    LL     │
│  ─────────────────────────────────────────────────────────────────────────── │
│  스웨이백       │ 햄스트링, 상부복직근 │ 장요근, 하부복근,   │ P2        │
│                 │                      │ 척추기립근          │           │
│  ─────────────────────────────────────────────────────────────────────────── │
│  편평등         │ 햄스트링, 복직근     │ 장요근, 척추기립근  │ P2        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 운동 목표 → 파라미터 매핑 테이블

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      5-Type 운동 분류 파라미터 테이블                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Type    │ 목적           │ 반복범위 │ 세트 │ 휴식(초) │ 강도     │ MET범위 │
│  ─────────────────────────────────────────────────────────────────────────── │
│  Toner   │ 근력유지, 토닝 │ 12-20    │ 2-3  │ 45       │ RPE 6-7  │ 3.0-5.0 │
│  Builder │ 근비대, 벌크업 │ 6-12     │ 4-5  │ 90-120   │ RPE 7-9  │ 5.0-6.0 │
│  Burner  │ 지방연소, 심폐 │ 15-30    │ 3-4  │ 30       │ RPE 7-8  │ 6.0-10.0│
│  Mover   │ 기능성 움직임  │ 8-15     │ 3-4  │ 60       │ RPE 6-8  │ 4.0-7.0 │
│  Flexer  │ 유연성, 회복   │ 1-3hold  │ 2-3  │ 30       │ RPE 3-5  │ 2.0-3.0 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

RPE (Rate of Perceived Exertion) 1-10 척도:
- 1-2: 매우 가벼움 (대화 가능)
- 3-4: 가벼움 (약간 숨참)
- 5-6: 중간 (대화 어려움)
- 7-8: 힘듦 (단어만 가능)
- 9-10: 매우 힘듦 (대화 불가)
```

### 4.4 피트니스 레벨별 조정 계수

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      피트니스 레벨별 조정 계수                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  레벨        │ 볼륨 계수 │ 강도 계수 │ 휴식 계수 │ 운동 수 │ 주당 빈도    │
│  ─────────────────────────────────────────────────────────────────────────── │
│  Beginner    │ 0.7x      │ 0.8x      │ 1.3x      │ 4-6개   │ 2-3회        │
│  Intermediate│ 1.0x      │ 1.0x      │ 1.0x      │ 6-8개   │ 3-4회        │
│  Advanced    │ 1.3x      │ 1.1x      │ 0.8x      │ 8-10개  │ 4-6회        │
│                                                                              │
│  적용 예시 (Builder 타입):                                                   │
│  - 기본: 4세트 × 8회, 휴식 90초                                             │
│  - 초보자: 3세트 × 6회, 휴식 120초 (볼륨↓, 강도↓, 휴식↑)                   │
│  - 상급자: 5세트 × 9회, 휴식 72초 (볼륨↑, 강도↑, 휴식↓)                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 통합 운동 추천 알고리즘

```typescript
// 입력 타입 정의
interface ExerciseRecommendationInput {
  // 체형 분석 결과
  bodyAnalysis: {
    bodyType: 'ectomorph' | 'mesomorph' | 'endomorph';
    postureImbalances: PostureImbalance[];
    postureScore: number; // 0-100
  };

  // 사용자 프로필
  userProfile: {
    age: number;
    sex: 'male' | 'female';
    weightKg: number;
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    contraindications: string[]; // ['shoulder_injury', 'knee_pain', 'lower_back']
  };

  // 운동 환경
  environment: {
    availableEquipment: Equipment[];
    availableTimeMinutes: number;
    location: 'home' | 'gym' | 'outdoor';
  };

  // 운동 목표
  goal: WorkoutGoal;
}

// 출력 타입 정의
interface ExerciseRecommendationOutput {
  exercises: PrescribedExercise[];
  workoutType: WorkoutType;
  parameters: {
    totalSets: number;
    estimatedDurationMinutes: number;
    estimatedCalories: number;
    intensity: string;
  };
  warnings: string[];
  weeklyPlan: WeeklyPlan;
}

interface PrescribedExercise {
  exercise: Exercise;
  phase: 'warmup' | 'stretch' | 'activation' | 'main' | 'cooldown';
  sets: number;
  reps: string; // '12-15' 또는 '30초 hold'
  restSeconds: number;
  notes: string[];
  alternatives: Exercise[]; // 대체 운동
}

// 메인 추천 알고리즘
function recommendExercises(
  input: ExerciseRecommendationInput
): ExerciseRecommendationOutput {
  const { bodyAnalysis, userProfile, environment, goal } = input;
  const warnings: string[] = [];

  // === STEP 1: 자세 불균형 기반 운동 선정 ===
  const postureExercises: PrescribedExercise[] = [];

  for (const imbalance of bodyAnalysis.postureImbalances) {
    const protocol = POSTURE_PROTOCOLS[imbalance.type];

    // 심각도에 따른 빈도 조정
    const priorityMultiplier = imbalance.severity === 'severe' ? 1.5 : 1.0;

    // 스트레칭 추가
    postureExercises.push(
      ...protocol.stretches.map(id => ({
        exercise: getExerciseById(id),
        phase: 'stretch' as const,
        sets: Math.round(2 * priorityMultiplier),
        reps: '30-60초 hold',
        restSeconds: 15,
        notes: [`${imbalance.type} 교정용`],
        alternatives: getAlternatives(id, environment.availableEquipment),
      }))
    );

    // 활성화 운동 추가
    postureExercises.push(
      ...protocol.activations.map(id => ({
        exercise: getExerciseById(id),
        phase: 'activation' as const,
        sets: Math.round(2 * priorityMultiplier),
        reps: '10-15',
        restSeconds: 30,
        notes: [`${imbalance.type} 교정용`],
        alternatives: getAlternatives(id, environment.availableEquipment),
      }))
    );
  }

  // === STEP 2: 목표 기반 메인 운동 선정 ===
  const workoutTypeConfig = WORKOUT_TYPE_DEFINITIONS[goal];
  const mainExercises = selectMainExercises(
    goal,
    bodyAnalysis.bodyType,
    environment.availableEquipment
  );

  // 피트니스 레벨 조정
  const levelAdjustment = LEVEL_ADJUSTMENTS[userProfile.fitnessLevel];

  const prescribedMainExercises: PrescribedExercise[] = mainExercises.map(ex => ({
    exercise: ex,
    phase: 'main' as const,
    sets: Math.round(workoutTypeConfig.sets[0] * levelAdjustment.volumeMultiplier),
    reps: `${workoutTypeConfig.repRange[0]}-${workoutTypeConfig.repRange[1]}`,
    restSeconds: Math.round(workoutTypeConfig.restSeconds * levelAdjustment.restMultiplier),
    notes: [],
    alternatives: getAlternatives(ex.id, environment.availableEquipment),
  }));

  // === STEP 3: 금기사항 필터링 ===
  const allExercises = [...postureExercises, ...prescribedMainExercises];
  const filteredExercises = filterContraindications(
    allExercises,
    userProfile.contraindications
  );

  // 필터링된 운동이 있으면 경고 추가
  if (filteredExercises.length < allExercises.length) {
    warnings.push(
      `금기사항으로 인해 ${allExercises.length - filteredExercises.length}개 운동이 제외되었습니다.`
    );
  }

  // === STEP 4: 시간 제약 최적화 ===
  const timeOptimizedExercises = optimizeForTime(
    filteredExercises,
    environment.availableTimeMinutes
  );

  // === STEP 5: 칼로리 및 총 파라미터 계산 ===
  const totalCalories = calculateTotalCalories(
    timeOptimizedExercises,
    userProfile.weightKg
  );

  const totalSets = timeOptimizedExercises.reduce((sum, ex) => sum + ex.sets, 0);
  const estimatedDuration = estimateWorkoutDuration(timeOptimizedExercises);

  // === STEP 6: 주간 플랜 생성 ===
  const weeklyPlan = generateWeeklyPlan(
    timeOptimizedExercises,
    bodyAnalysis.postureImbalances,
    userProfile.fitnessLevel
  );

  // === STEP 7: 안전 경고 생성 ===
  if (userProfile.age >= 65) {
    warnings.push('65세 이상: 운동 시작 전 의료 전문가 상담을 권장합니다.');
  }
  if (bodyAnalysis.postureImbalances.some(i => i.severity === 'severe')) {
    warnings.push('심각한 자세 불균형 발견: 물리치료사 평가를 권장합니다.');
  }

  return {
    exercises: timeOptimizedExercises,
    workoutType: goal,
    parameters: {
      totalSets,
      estimatedDurationMinutes: estimatedDuration,
      estimatedCalories: totalCalories,
      intensity: `RPE ${workoutTypeConfig.rpe[0]}-${workoutTypeConfig.rpe[1]}`,
    },
    warnings,
    weeklyPlan,
  };
}

// 시간 최적화 함수
function optimizeForTime(
  exercises: PrescribedExercise[],
  availableMinutes: number
): PrescribedExercise[] {
  // 예상 시간 계산
  let totalTime = estimateWorkoutDuration(exercises);

  if (totalTime <= availableMinutes) {
    return exercises; // 시간 충분
  }

  // 우선순위에 따라 운동 제거
  const priorityOrder = ['warmup', 'stretch', 'activation', 'main', 'cooldown'];
  const sortedExercises = [...exercises].sort(
    (a, b) => priorityOrder.indexOf(a.phase) - priorityOrder.indexOf(b.phase)
  );

  // 'main' 운동부터 역순으로 제거
  const result: PrescribedExercise[] = [];
  let currentTime = 0;

  for (const ex of sortedExercises) {
    const exerciseTime = ex.sets * (60 + ex.restSeconds); // 1세트당 약 60초 + 휴식
    if (currentTime + exerciseTime <= availableMinutes * 60) {
      result.push(ex);
      currentTime += exerciseTime;
    }
  }

  return result;
}

// 총 칼로리 계산
function calculateTotalCalories(
  exercises: PrescribedExercise[],
  weightKg: number
): number {
  let totalCalories = 0;

  for (const ex of exercises) {
    const durationMinutes = (ex.sets * 60) / 60; // 각 세트 ~1분 가정
    totalCalories += calculateCaloriesWithMET({
      met: ex.exercise.met,
      weightKg,
      durationMinutes,
    }).calories;
  }

  return Math.round(totalCalories);
}
```

### 4.6 원리 → 알고리즘 요약

1. **체형 분석 → 불균형 식별**
   - MediaPipe Pose로 랜드마크 감지
   - 각도 계산 (CVA, 흉추, 요추, 골반)
   - Crossed Syndrome 진단 알고리즘 적용
   - 불균형 패턴 매칭

2. **불균형 → 운동 처방**
   - 단축 근육: 스트레칭 (30-60초 hold)
   - 약화 근육: 활성화 (10-15회) → 강화 (목표 기반)
   - 운동 순서: Warmup → Stretch → Activation → Main → Cooldown

3. **개인화 조정**
   - 금기사항 필터링
   - 피트니스 레벨별 볼륨/강도/휴식 조정
   - 가용 시간 기반 최적화
   - 가용 장비 기반 대체 운동

### 4.2 운동 처방 함수

```typescript
interface PostureImbalance {
  type: 'upper_cross' | 'lower_cross' | 'sway_back' | 'flat_back';
  severity: 'mild' | 'moderate' | 'severe';
}

interface UserProfile {
  age: number;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  contraindications: string[];
  availableEquipment: Equipment[];
}

interface ExercisePrescription {
  stretches: Exercise[];
  activations: Exercise[];
  strengthening: Exercise[];
  frequency: string;
  duration: string;
  weeklyPlan: WeeklyPlan;
  warnings: string[];
}

function prescribeExercises(
  imbalances: PostureImbalance[],
  profile: UserProfile
): ExercisePrescription {
  const allExercises: Set<string> = new Set();
  const warnings: string[] = [];

  // 불균형별 운동 수집
  for (const imbalance of imbalances) {
    const protocol = POSTURE_PROTOCOLS[imbalance.type];

    // 심각도에 따른 빈도 조정
    const frequencyMultiplier = imbalance.severity === 'severe' ? 1.5 : 1;

    protocol.stretches.forEach(e => allExercises.add(e));
    protocol.activations.forEach(e => allExercises.add(e));
    protocol.strengthening.forEach(e => allExercises.add(e));
  }

  // 금기사항 필터링
  const exercises = EXERCISE_DATABASE.filter(e => allExercises.has(e.id));
  const filteredExercises = filterContraindications(
    exercises,
    profile.contraindications
  );

  // 난이도 조절
  const adjustedExercises = adjustDifficulty(
    filteredExercises,
    profile.fitnessLevel
  );

  // 장비 필터링
  const availableExercises = filterByEquipment(
    adjustedExercises,
    profile.availableEquipment
  );

  // 경고 생성
  if (profile.age > 65) {
    warnings.push('65세 이상: 의료 전문가 상담 후 시작 권장');
  }
  if (imbalances.some(i => i.severity === 'severe')) {
    warnings.push('심각한 불균형: 물리치료사 평가 권장');
  }

  return {
    stretches: availableExercises.filter(e => e.category === 'stretch'),
    activations: availableExercises.filter(e => e.category === 'activation'),
    strengthening: availableExercises.filter(e => e.category === 'strength'),
    frequency: determineBestFrequency(imbalances),
    duration: '스트레칭 30-60초, 강화 10-15회 x 3세트',
    weeklyPlan: generateWeeklyPlan(availableExercises, imbalances),
    warnings,
  };
}

function filterContraindications(
  exercises: Exercise[],
  contraindications: string[]
): Exercise[] {
  return exercises.filter(e =>
    !e.contraindications.some(c =>
      contraindications.includes(c)
    )
  );
}

function adjustDifficulty(
  exercises: Exercise[],
  level: 'beginner' | 'intermediate' | 'advanced'
): Exercise[] {
  return exercises.map(e => {
    if (e.difficulty === 'advanced' && level === 'beginner') {
      // 대체 운동 또는 변형 반환
      const modification = e.modifications.find(m =>
        m.forCondition === 'beginner'
      );
      return modification ? { ...e, ...modification } : e;
    }
    return e;
  });
}

/**
 * 사용 가능한 장비에 따라 운동을 필터링합니다.
 *
 * 필터링 우선순위:
 * 1. bodyweight(맨몸)는 항상 사용 가능
 * 2. 사용자가 보유한 장비와 일치하는 운동 포함
 * 3. 장비가 없으면 맨몸 운동만 반환
 *
 * @param exercises - 필터링할 운동 목록
 * @param availableEquipment - 사용자가 보유한 장비 목록
 * @returns 사용 가능한 운동 목록
 */
function filterByEquipment(
  exercises: Exercise[],
  availableEquipment: Equipment[]
): Exercise[] {
  // 장비 목록이 비어있으면 bodyweight만 허용
  const effectiveEquipment: Equipment[] = availableEquipment.length > 0
    ? [...availableEquipment, 'bodyweight']
    : ['bodyweight'];

  return exercises.filter(exercise => {
    // 운동에 필요한 장비가 없으면 (맨몸 운동) 포함
    if (exercise.equipment.length === 0) {
      return true;
    }

    // 운동에 필요한 장비 중 하나라도 보유하고 있으면 포함
    return exercise.equipment.some(eq =>
      effectiveEquipment.includes(eq)
    );
  });
}
```

### 4.3 주간 플랜 생성

```typescript
interface WeeklyPlan {
  monday: DailyRoutine;
  tuesday: DailyRoutine;
  wednesday: DailyRoutine;
  thursday: DailyRoutine;
  friday: DailyRoutine;
  saturday: DailyRoutine;
  sunday: DailyRoutine;
}

interface DailyRoutine {
  type: 'stretch' | 'strengthen' | 'rest' | 'active_recovery';
  exercises: Exercise[];
  duration: number; // minutes
  notes?: string;
}

function generateWeeklyPlan(
  exercises: Exercise[],
  imbalances: PostureImbalance[]
): WeeklyPlan {
  const stretches = exercises.filter(e => e.category === 'stretch');
  const activations = exercises.filter(e => e.category === 'activation');
  const strengthening = exercises.filter(e => e.category === 'strength');

  const isSevere = imbalances.some(i => i.severity === 'severe');

  if (isSevere) {
    // 심각: 매일 스트레칭, 격일 강화
    return {
      monday: { type: 'stretch', exercises: [...stretches, ...activations], duration: 20 },
      tuesday: { type: 'strengthen', exercises: [...stretches, ...strengthening], duration: 30 },
      wednesday: { type: 'stretch', exercises: [...stretches, ...activations], duration: 20 },
      thursday: { type: 'strengthen', exercises: [...stretches, ...strengthening], duration: 30 },
      friday: { type: 'stretch', exercises: [...stretches, ...activations], duration: 20 },
      saturday: { type: 'strengthen', exercises: [...stretches, ...strengthening], duration: 30 },
      sunday: { type: 'rest', exercises: [], duration: 0, notes: '완전 휴식 또는 가벼운 걷기' },
    };
  }

  // 경미~중등도: 격일 스트레칭, 주 3회 강화
  return {
    monday: { type: 'stretch', exercises: [...stretches, ...activations], duration: 15 },
    tuesday: { type: 'strengthen', exercises: [...stretches, ...strengthening], duration: 25 },
    wednesday: { type: 'active_recovery', exercises: stretches, duration: 10 },
    thursday: { type: 'strengthen', exercises: [...stretches, ...strengthening], duration: 25 },
    friday: { type: 'stretch', exercises: [...stretches, ...activations], duration: 15 },
    saturday: { type: 'strengthen', exercises: [...stretches, ...strengthening], duration: 25 },
    sunday: { type: 'rest', exercises: [], duration: 0 },
  };
}
```

---

## 5. 검증 방법

### 5.1 원리 준수 검증

| 검증 항목 | 기준 | 방법 |
|----------|------|------|
| 해부학 정확성 | 의학 교과서 | 전문가 검토 |
| 각도 기준 | 임상 연구 | 논문 대조 |
| 운동 안전성 | ACSM/NSCA 가이드라인 | 체크리스트 |
| 강도 계산 | Karvonen, Tanaka 공식 | 수식 검증 |

### 5.2 알고리즘 테스트

```typescript
describe('ExercisePrescription', () => {
  it('should prescribe stretches for tight muscles in upper cross', () => {
    const result = prescribeExercises(
      [{ type: 'upper_cross', severity: 'moderate' }],
      { age: 30, fitnessLevel: 'intermediate', contraindications: [], availableEquipment: ['bodyweight', 'wall'] }
    );

    const stretchNames = result.stretches.map(s => s.id);
    expect(stretchNames).toContain('chest_doorway_stretch');
    expect(stretchNames).toContain('upper_trap_stretch');
  });

  it('should prescribe glute exercises for lower cross', () => {
    const result = prescribeExercises(
      [{ type: 'lower_cross', severity: 'mild' }],
      { age: 25, fitnessLevel: 'beginner', contraindications: [], availableEquipment: ['bodyweight', 'mat'] }
    );

    const strengthNames = result.strengthening.map(s => s.id);
    expect(strengthNames).toContain('glute_bridge');
  });

  it('should increase frequency for severe imbalance', () => {
    const mild = prescribeExercises(
      [{ type: 'lower_cross', severity: 'mild' }],
      { age: 30, fitnessLevel: 'intermediate', contraindications: [], availableEquipment: ['bodyweight'] }
    );

    const severe = prescribeExercises(
      [{ type: 'lower_cross', severity: 'severe' }],
      { age: 30, fitnessLevel: 'intermediate', contraindications: [], availableEquipment: ['bodyweight'] }
    );

    expect(severe.frequency).toContain('매일');
  });

  it('should filter exercises with contraindications', () => {
    const result = prescribeExercises(
      [{ type: 'upper_cross', severity: 'moderate' }],
      {
        age: 40,
        fitnessLevel: 'intermediate',
        contraindications: ['shoulder_injury'],
        availableEquipment: ['bodyweight', 'wall']
      }
    );

    // 어깨 부상 금기 운동 제외되어야 함
    const hasContraindicated = result.strengthening.some(e =>
      e.contraindications.includes('shoulder_injury')
    );
    expect(hasContraindicated).toBe(false);
  });

  it('should calculate Karvonen zones correctly', () => {
    const zones = calculateKarvonenZones(30, 60);

    // 30세, 안정시 60bpm일 때 Zone 2 (60-70%)
    // HRmax = 208 - 0.7*30 = 187
    // Reserve = 187 - 60 = 127
    // Zone 2 min = 127 * 0.6 + 60 = 136.2 ≈ 136
    // Zone 2 max = 127 * 0.7 + 60 = 148.9 ≈ 149
    const zone2 = zones.find(z => z.name.includes('Zone 2'));
    expect(zone2?.minHR).toBe(136);
    expect(zone2?.maxHR).toBe(149);
  });

  it('should calculate posture score correctly', () => {
    const goodPosture: PostureAngles = {
      cva: 55,
      shoulderTilt: 2,
      thoracicKyphosis: 32,
      lumbarLordosis: 48,
      pelvicTilt: 1,
    };

    const result = calculatePostureScore(goodPosture);
    expect(result.overall).toBeGreaterThan(85);
    expect(result.category).toBe('excellent');
  });

  it('should detect upper cross syndrome', () => {
    const badPosture: PostureAngles = {
      cva: 38,              // 거북목
      shoulderTilt: 0,
      thoracicKyphosis: 50, // 과도한 후만
      lumbarLordosis: 45,
      pelvicTilt: 0,
    };

    const result = calculatePostureScore(badPosture);
    expect(result.imbalances).toContainEqual(
      expect.objectContaining({ type: 'upper_cross' })
    );
  });
});
```

### 5.3 ACSM 가이드라인 체크리스트

```markdown
운동 프로그램 구현 시 확인:

□ 운동 전 건강 상태 스크리닝 (PAR-Q+ 또는 유사)
□ 워밍업 포함 (5-10분 동적 스트레칭)
□ 쿨다운 포함 (5-10분 정적 스트레칭)
□ 점진적 과부하 원칙 적용
□ 근육군별 48-72시간 회복 시간
□ 유산소: 주 150분 중등도 또는 주 75분 고강도
□ 저항 운동: 주요 근육군 주 2-3회
□ 유연성 운동: 주 2-3회
□ 통증 발생 시 중단 안내
□ 의료 면책 조항 표시
```

---

## 6. 주의사항 및 면책

### 6.1 운동 금기 (Red Flags)

```
⚠️ 다음 경우 즉시 중단 및 의료 상담:

급성 금기:
- 급성/날카로운 통증
- 방사통 (팔/다리로 퍼지는 통증)
- 저림, 무감각
- 근력 저하
- 배변/배뇨 장애
- 어지러움, 실신

상대적 금기 (의사 상담 후):
- 최근 수술 (6주 이내)
- 심혈관 질환
- 고혈압 (미조절)
- 임신
- 급성 염증/감염
- 골다공증 (중증)
```

### 6.2 안전 가이드라인

1. **워밍업**: 본 운동 전 5-10분 동적 스트레칭
2. **점진적 부하**: 주당 10% 이내 증가
3. **통증 규칙**: "no pain, no gain"은 잘못된 개념
4. **휴식**: 근육군별 48시간 회복 시간
5. **수분 섭취**: 운동 전후 충분한 수분

### 6.3 면책조항

```
⚠️ 면책조항:
이 정보는 일반적인 운동 가이드입니다.
의료 조언을 대체하지 않습니다.
운동 프로그램 시작 전 의료 전문가와 상담하세요.
특히 기존 부상이나 건강 문제가 있는 경우 반드시 상담이 필요합니다.
```

---

## 7. 관련 문서

### 구현 스펙 (이 원리를 적용하는 문서)

| 문서 | 관계 |
|------|------|
| [SDD-W1-WORKOUT.md](../specs/SDD-W1-WORKOUT.md) | 운동 모듈 구현 스펙, P3 원자 분해 |
| [ADR-031-workout-module.md](../adr/ADR-031-workout-module.md) | 운동 모듈 아키텍처 결정 |

### 관련 원리 문서

| 문서 | 관계 |
|------|------|
| [body-mechanics.md](./body-mechanics.md) | MediaPipe Pose, 체형 분류 |
| [cross-domain-synergy.md](./cross-domain-synergy.md) | 체형-운동-영양 시너지 |
| [nutrition-science.md](./nutrition-science.md) | 운동 영양 |

---

## 8. 참고 자료

### 학술 논문

1. Janda, V. (1983). "Muscle Function Testing". Butterworths.
2. Page, P. et al. (2010). "Assessment and Treatment of Muscle Imbalance: The Janda Approach". Human Kinetics.
3. Tanaka, H. et al. (2001). "Age-predicted maximal heart rate revisited". J Am Coll Cardiol 37(1):153-6.
4. Yip, C.H.T. et al. (2008). "The relationship between head posture and severity and disability of patients with neck pain". Manual Therapy 13(2):148-154.
5. Ainsworth, B.E. et al. (2024). "2024 Compendium of Physical Activities: A Third Update of the Compendium". Medicine & Science in Sports & Exercise.
6. Luque-Suarez, A. et al. (2019). "The anterior pelvic tilt and trunk position associated with low back pain". Journal of Back and Musculoskeletal Rehabilitation.

### 가이드라인

- ACSM. (2021). Guidelines for Exercise Testing and Prescription (11th ed.)
- ACSM. (2024). "Muscular Fitness Testing Protocols and Norms" - 연령별 근력 기준
- NSCA. (2017). Essentials of Strength Training and Conditioning (4th ed.)
- NSCA. (2024). "Strength Standards by Age and Sex" - 성별/연령별 1RM 비율 기준
- APTA. (2020). Clinical Practice Guidelines for Physical Therapy

### 교과서

- Neumann, D.A. (2016). Kinesiology of the Musculoskeletal System (3rd ed.)
- Sahrmann, S. (2002). Diagnosis and Treatment of Movement Impairment Syndromes
- Kendall, F.P. (2005). Muscles: Testing and Function with Posture and Pain (5th ed.)
- McArdle, W.D. et al. (2023). Exercise Physiology: Nutrition, Energy, and Human Performance (9th ed.)

### MediaPipe 참고

- Google MediaPipe. (2024). "Pose Landmark Detection Guide" - 33개 랜드마크 정의
- MediaPipe Solutions. "Pose Classification and Analysis" - 자세 분석 구현 가이드

---

## 각주

¹ **CVA 정상 범위**: Yip CHT et al. (2008) 연구에 따르면 CVA 50° 미만은 전방두부자세(Forward Head Posture)로 분류됨.

² **MET 값 출처**: Ainsworth BE et al. (2024). "2024 Compendium of Physical Activities" - 800+ 활동의 MET 값 수록.

³ **푸시업 기준**: ACSM (2024). "Guidelines for Exercise Testing and Prescription" - Table 4.4 Fitness Categories by Age Groups.

⁴ **플랭크 기준**: NSCA (2024). "Core Endurance Testing Standards" - 코어 지구력 평가 기준.

⁵ **스쿼트 1RM 기준**: NSCA (2024). "Strength Standards for the Squat" - 훈련 경력별 체중 대비 비율.

---

---

## 9. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR | 제목 | 관련 내용 |
|-----|------|----------|
| [ADR-031](../adr/ADR-031-workout-module.md) | 운동 모듈 아키텍처 | 5-Type 분류, MET 칼로리, 세션 추적 |
| [ADR-011](../adr/ADR-011-cross-module-data-flow.md) | 크로스 모듈 데이터 플로우 | W-1 ↔ N-1, S-1 연동 |
| [ADR-032](../adr/ADR-032-smart-matching.md) | 스마트 매칭 아키텍처 | 운동 목표 기반 장비/보충제 매칭 |

---

**Version**: 3.1 | **Created**: 2026-01-18 | **Updated**: 2026-01-23
**소스 리서치**: W-1-R1, COMBO-BODY-EXERCISE, W-2-FOUNDATION, W-2-POSTURE-SAFETY
**관련 모듈**: W-1, W-2, C-1, COMBO-BODY-EXERCISE

### 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 3.1 | 2026-01-23 | 개인화 공식 섹션 추가 (2.5): 나이별 HRmax 공식 비교, 심박수 존 상세, 운동 강도 조절 계수 (피트니스 레벨/나이), 목표별 프로토콜, 스트레칭 개인화 (W-2 연계), 통합 개인화 예시 |
| 3.0 | 2026-01-23 | MET 값 데이터 보강, Crossed Syndrome MediaPipe 연계, 나이별 근력 기준, 운동 추천 알고리즘 공식화 |
| 2.0 | 2026-01-19 | ADR 역참조, 자세 불균형 패턴 추가 |
| 1.0 | 2026-01-18 | 초기 버전 |
