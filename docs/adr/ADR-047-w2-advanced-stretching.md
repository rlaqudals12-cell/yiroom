# ADR-047: W-2 고급 스트레칭/교정 운동 모듈

## 상태

`accepted`

## 날짜

2026-01-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"C-2 자세 분석 결과와 연동하여 개인 근육 불균형 패턴에 맞는 맞춤 스트레칭/교정 운동을 제공하고, ROM 변화를 추적하여 유연성 개선을 측정하는 시스템"

- **자세 기반 추천**: C-2 분석 결과(거북목, 굽은등, 골반) 연동
- **교정 프로토콜**: Janda Upper/Lower Cross 증후군 대응
- **스트레칭 DB**: 100+ 스트레칭 (정적, 동적, PNF)
- **가이드 콘텐츠**: 일러스트, 애니메이션, 영상 연동
- **ROM 추적**: 유연성 변화 기록 및 시각화

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 자세 정확도 | C-2 분석 의존, MediaPipe Pose ±2cm 오차 |
| 개인차 | 기존 부상, 질환에 따른 금기사항 존재 |
| ROM 측정 | 이미지 기반 추정, 전문 각도계 대비 오차 |
| 콘텐츠 제작 | 100+ 스트레칭 영상/일러스트 제작 비용 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 스트레칭 DB | 100+ | - | 정적/동적/PNF |
| C-2 연동률 | 100% | 0% | 자세 문제별 매칭 |
| 가이드 콘텐츠 | 100+ 영상 | 0 | 제작 필요 |
| 금기사항 커버리지 | 95% | - | 안전 우선 |
| ROM 추적 정확도 | ±5° | - | 이미지 기반 |

### 현재 목표: 65%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 실시간 자세 코칭 | GPU 집약적 (PERFORMANCE) | Edge ML 최적화 시 |
| 물리치료 처방 | 의료행위 (LEGAL_HOLD) | N/A (영구 제외) |
| 전문 ROM 측정기 연동 | 하드웨어 의존 (HARDWARE_DEPENDENCY) | IoT 연동 시 |
| 1:1 코칭 영상통화 | 범위 초과 (SCOPE_EXCEED) | Phase 4+ |

## 맥락 (Context)

### W-1 (운동 모듈) 현재 상태

W-1은 5-Type 운동 분류(Toner, Builder, Burner, Mover, Flexer)와 MET 기반 칼로리 계산을 제공하는 운동 추천 모듈입니다.

| 기능 | 상태 | 설명 |
|------|------|------|
| 운동 추천 | 구현됨 | 체형/목표/장비 기반 AI 추천 |
| 주간 플랜 | 구현됨 | Push/Pull/Legs, Full-Body 스플릿 |
| 세션 추적 | 구현됨 | 세트/반복/무게 기록 |
| 칼로리 계산 | 구현됨 | MET 기반 소모량 추정 |

### W-1의 한계점 (스트레칭 영역)

| 한계 | 영향 | 근본 원인 |
|------|------|----------|
| **자세 기반 추천 부재** | 일반적 스트레칭만 제공 | C-2 자세 분석 미연동 |
| **교정 운동 미제공** | 근본적 불균형 해결 불가 | 교정 프로토콜 DB 없음 |
| **스트레칭 DB 제한** | Flexer 타입 운동 부족 | 스트레칭 전문 DB 미구축 |
| **가이드 콘텐츠 부족** | 올바른 동작 학습 어려움 | 영상/일러스트 미연동 |
| **진행 추적 없음** | 유연성 개선 측정 불가 | ROM 변화 기록 없음 |

### W-2 필요성

1. **C-2 자세 분석 연동**: 거북목, 굽은등, 골반 틀어짐 등 자세 문제 감지 결과 기반 맞춤 스트레칭
2. **Janda 교차증후군 대응**: Upper Cross, Lower Cross 등 근육 불균형 패턴별 교정 프로토콜
3. **스트레칭 전문 DB**: 100+ 스트레칭 (정적, 동적, PNF)
4. **가이드 콘텐츠**: 일러스트, 애니메이션, 영상 연동
5. **ROM 진행 추적**: 유연성 변화 기록 및 시각화

## 결정 (Decision)

**자세 기반 맞춤 스트레칭 시스템**을 W-2로 구현합니다.

### 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   W-2 Advanced Stretching Module                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      입력 소스 (Input Sources)                       │   │
│  │                                                                       │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │   │
│  │  │   C-2 자세   │    │ 사용자 목표 │    │ 통증/제한   │              │   │
│  │  │   분석 결과  │    │  입력      │    │  입력      │              │   │
│  │  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘              │   │
│  │         │                  │                  │                      │   │
│  │         └──────────────────┼──────────────────┘                      │   │
│  └─────────────────────────────┼────────────────────────────────────────┘   │
│                                ▼                                            │
│                    ┌─────────────────────┐                                  │
│                    │  Stretching Engine  │                                  │
│                    │                     │                                  │
│                    │ • 불균형 패턴 매칭  │                                  │
│                    │ • 금기사항 필터링   │                                  │
│                    │ • 우선순위 결정     │                                  │
│                    └──────────┬──────────┘                                  │
│                               │                                             │
│         ┌─────────────────────┼─────────────────────┐                       │
│         ▼                     ▼                     ▼                       │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                 │
│  │ 스트레칭 DB │      │  루틴 생성   │      │ 가이드 연동  │                 │
│  │  (100+)    │      │ (5/10/15분) │      │ (영상/이미지)│                 │
│  └──────┬──────┘      └──────┬──────┘      └──────┬──────┘                 │
│         │                    │                    │                         │
│         └────────────────────┼────────────────────┘                         │
│                              ▼                                              │
│                    ┌─────────────────────┐                                  │
│                    │   진행 추적 시스템   │                                  │
│                    │                     │                                  │
│                    │ • 완료 기록         │                                  │
│                    │ • ROM 변화 측정     │                                  │
│                    │ • 루틴 효과 분석    │                                  │
│                    └─────────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 핵심 결정 사항

#### 1. 자세별 스트레칭 매핑

| 자세 문제 | C-2 지표 | 단축근 | 핵심 스트레칭 |
|----------|---------|--------|--------------|
| **거북목** | CVA < 45° | 흉쇄유돌근, 상부승모근 | 턱당기기, 흉추신전, 상부승모근 스트레칭 |
| **라운드숄더** | 어깨 전방 돌출 | 대흉근, 소흉근 | 문틀 스트레칭, 코너 스트레칭, 흉추 폼롤러 |
| **굽은등** | 흉추후만 > 40° | 흉근, 복직근 | 흉추 신전, Cat-Cow, 월 엔젤 |
| **골반 전방경사** | 골반 기울기 > 15° | 장요근, 대퇴직근 | 런지 스트레칭, 토마스 테스트 자세 |
| **골반 후방경사** | 골반 기울기 < 0° | 햄스트링, 둔근 | 햄스트링 스트레칭, 고양이-소 |

#### 2. 스트레칭 DB 스키마

```typescript
interface Stretch {
  id: string;
  nameKo: string;
  nameEn: string;

  // 타겟팅
  targetMuscles: MuscleGroup[];        // 주 타겟 근육
  synergistMuscles?: MuscleGroup[];    // 보조 근육
  postureIssues: PostureIssue[];       // 관련 자세 문제

  // 분류
  type: 'static' | 'dynamic' | 'pnf';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;                     // 초 단위 권장 시간
  repetitions?: number;                 // 동적 스트레칭 횟수

  // 실행 가이드
  instructions: string[];               // 단계별 설명
  breathingGuide: string;               // 호흡법
  commonMistakes: string[];             // 흔한 실수
  modifications: StretchModification[]; // 난이도 조절

  // 안전
  contraindications: string[];          // 금기사항
  redFlags: string[];                   // 즉시 중단 신호

  // 콘텐츠
  imageUrl: string;                     // 자세 이미지
  animationUrl?: string;                // 애니메이션 (선택)
  videoUrl?: string;                    // 영상 (향후)

  // 메타데이터
  equipment: Equipment[];               // 필요 장비
  met: number;                          // 칼로리 계산용
  effectScore: number;                  // 효과 점수 (1-10)
}

type PostureIssue =
  | 'forward_head'      // 거북목
  | 'round_shoulder'    // 라운드숄더
  | 'thoracic_kyphosis' // 굽은등
  | 'anterior_pelvic_tilt'  // 골반 전방경사
  | 'posterior_pelvic_tilt' // 골반 후방경사
  | 'sway_back'         // 스웨이백
  | 'flat_back'         // 편평등
  | 'upper_cross'       // 상부 교차증후군
  | 'lower_cross';      // 하부 교차증후군

interface StretchModification {
  name: string;
  description: string;
  forCondition: string;  // '무릎 통증', '임산부', '초보자' 등
}
```

#### 3. 루틴 생성 알고리즘

```typescript
interface RoutineInput {
  postureAnalysis: C2PostureResult;     // C-2 자세 분석 결과
  userGoals: StretchingGoal[];          // 사용자 목표
  availableTime: 5 | 10 | 15 | 20;      // 분 단위
  contraindications: string[];          // 금기사항
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  availableEquipment: Equipment[];
}

type StretchingGoal =
  | 'posture_correction'  // 자세 교정
  | 'flexibility'         // 유연성 향상
  | 'pain_relief'         // 통증 완화
  | 'pre_workout'         // 운동 전 워밍업
  | 'post_workout'        // 운동 후 쿨다운
  | 'desk_break';         // 사무직 휴식

interface StretchingRoutine {
  id: string;
  name: string;
  targetDuration: number;              // 목표 시간 (분)
  actualDuration: number;              // 실제 예상 시간

  phases: RoutinePhase[];

  totalStretches: number;
  primaryFocus: PostureIssue[];
  estimatedCalories: number;

  warnings: string[];
  disclaimer: string;
}

interface RoutinePhase {
  name: 'warmup' | 'main' | 'cooldown';
  stretches: RoutineStretch[];
  duration: number;
}

interface RoutineStretch {
  stretch: Stretch;
  sets: number;
  holdTime: number;                    // 초
  restBetweenSets: number;             // 초
  priority: 'essential' | 'recommended' | 'optional';
  notes?: string;
}

function generateStretchingRoutine(input: RoutineInput): StretchingRoutine {
  const { postureAnalysis, availableTime, contraindications, fitnessLevel } = input;

  // 1. 자세 문제 우선순위 결정
  const prioritizedIssues = prioritizePostureIssues(postureAnalysis);

  // 2. 관련 스트레칭 수집
  const relevantStretches = getStretchesForIssues(prioritizedIssues);

  // 3. 금기사항 필터링
  const safeStretches = filterContraindications(relevantStretches, contraindications);

  // 4. 난이도 필터링
  const levelAppropriate = filterByLevel(safeStretches, fitnessLevel);

  // 5. 시간에 맞춰 선택
  const selectedStretches = selectForDuration(levelAppropriate, availableTime);

  // 6. 루틴 구조화
  return structureRoutine(selectedStretches, availableTime, prioritizedIssues);
}
```

#### 4. 시간별 루틴 템플릿

| 시간 | 워밍업 | 메인 | 쿨다운 | 총 스트레칭 수 |
|------|--------|------|--------|---------------|
| **5분** | 1분 (동적 2개) | 3분 (정적 3개) | 1분 (호흡 1개) | 6개 |
| **10분** | 2분 (동적 3개) | 6분 (정적 5개) | 2분 (정적 2개) | 10개 |
| **15분** | 3분 (동적 4개) | 10분 (정적 7개) | 2분 (정적 2개) | 13개 |
| **20분** | 3분 (동적 4개) | 14분 (정적/PNF 10개) | 3분 (정적 3개) | 17개 |

#### 5. 진행 추적 시스템

```typescript
interface StretchingProgress {
  id: string;
  clerkUserId: string;

  // 완료 기록
  completedRoutines: CompletedRoutine[];
  totalMinutes: number;
  streakDays: number;

  // ROM 변화 (자가 평가)
  romAssessments: ROMAssessment[];

  // 분석
  mostImprovedArea?: PostureIssue;
  consistencyScore: number;            // 0-100
  recommendedNextSteps: string[];
}

interface CompletedRoutine {
  routineId: string;
  completedAt: string;
  duration: number;
  skippedStretches: string[];
  difficultyRating: 1 | 2 | 3 | 4 | 5;
  painLevel?: number;                  // 0-10
  notes?: string;
}

interface ROMAssessment {
  assessedAt: string;
  type: ROMTestType;
  value: number;                       // 각도 또는 거리
  unit: 'degrees' | 'cm';
  postureIssue: PostureIssue;
}

type ROMTestType =
  | 'forward_bend'        // 전굴 (손가락-바닥 거리)
  | 'shoulder_flexion'    // 어깨 굴곡 (벽 테스트)
  | 'neck_rotation'       // 목 회전 (좌/우)
  | 'hip_flexor_length';  // 장요근 길이 (토마스 테스트)
```

#### 6. 콘텐츠 저장소 전략

| 콘텐츠 타입 | 저장소 | 이유 |
|------------|--------|------|
| 스트레칭 메타데이터 | Supabase DB | 검색, 필터링 |
| 이미지/일러스트 | Supabase Storage | 비공개 버킷, CDN 연동 |
| 애니메이션 (Lottie) | Supabase Storage | 경량, 벡터 기반 |
| 영상 (향후) | YouTube/Vimeo 연동 | 저장 비용 절감, 기존 콘텐츠 활용 |

### 파일 구조

```
lib/stretching/
├── index.ts                        # Barrel export
├── types.ts                        # W-2 타입 정의
├── internal/
│   ├── stretch-database.ts         # 스트레칭 DB
│   ├── routine-generator.ts        # 루틴 생성 알고리즘
│   ├── posture-matcher.ts          # 자세→스트레칭 매칭
│   ├── contraindication-filter.ts  # 금기사항 필터
│   ├── duration-optimizer.ts       # 시간별 최적화
│   └── progress-tracker.ts         # 진행 추적
└── __tests__/
    ├── routine-generator.test.ts
    └── posture-matcher.test.ts

app/api/stretching/
├── routine/route.ts                # 루틴 생성 API
├── progress/route.ts               # 진행 기록 API
├── assessment/route.ts             # ROM 평가 API
└── database/route.ts               # 스트레칭 DB 조회

components/stretching/
├── RoutinePlayer.tsx               # 루틴 실행 UI
├── StretchCard.tsx                 # 개별 스트레칭 카드
├── StretchGuide.tsx                # 상세 가이드 (이미지/영상)
├── ProgressChart.tsx               # 진행 차트
├── ROMAssessmentForm.tsx           # ROM 자가 평가
└── TimerDisplay.tsx                # 타이머 표시
```

### API 설계

```typescript
// POST /api/stretching/routine
// 맞춤 루틴 생성
interface GenerateRoutineRequest {
  postureAnalysisId?: string;         // C-2 분석 ID (없으면 일반 루틴)
  goals: StretchingGoal[];
  duration: 5 | 10 | 15 | 20;
  contraindications?: string[];
}

interface GenerateRoutineResponse {
  success: boolean;
  data?: StretchingRoutine;
  error?: { code: string; message: string };
}

// POST /api/stretching/progress
// 완료 기록
interface RecordProgressRequest {
  routineId: string;
  duration: number;
  skippedStretches?: string[];
  difficultyRating: 1 | 2 | 3 | 4 | 5;
  painLevel?: number;
  notes?: string;
}

// POST /api/stretching/assessment
// ROM 자가 평가 기록
interface RecordAssessmentRequest {
  type: ROMTestType;
  value: number;
  unit: 'degrees' | 'cm';
  postureIssue: PostureIssue;
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **W-1 Flexer 확장** | 구현 단순, 기존 구조 활용 | 자세 연동 부재, 전문성 부족 | `LOW_QUALITY` - 교정 효과 제한 |
| **외부 스트레칭 API** | 검증된 콘텐츠 | 비용, 의존성, 맞춤화 어려움 | `FINANCIAL_HOLD` - ROI 불확실 |
| **영상 전용 (YouTube 연동)** | 콘텐츠 비용 절감 | 맞춤화 불가, 오프라인 불가 | `LOW_PERSONALIZATION` |
| **물리치료 앱 화이트라벨** | 전문가 검증 | 라이선스 비용, 브랜딩 불일치 | `FINANCIAL_HOLD` - 비용 과다 |
| **자체 스트레칭 DB + C-2 연동** ✅ | 완전 맞춤화, C-2 연동, 오프라인 지원 | 초기 콘텐츠 제작 비용 | **채택** |

### 효과 측정 방식 비교

| 방식 | 장점 | 단점 | 선택 |
|------|------|------|------|
| **자가 평가 (ROM 테스트)** | 비용 낮음, 사용자 참여↑ | 정확도 제한 | ✅ 1차 채택 |
| **C-2 재측정** | 객관적, 자동화 | 카메라 필요, 복잡 | Phase 2 |
| **웨어러블 연동** | 정밀 측정 | 장비 의존성 | 향후 검토 |

## 결과 (Consequences)

### 긍정적 결과

- **맞춤 교정**: C-2 자세 분석 기반 개인화 스트레칭
- **Janda 프로토콜**: 상부/하부 교차증후군 대응
- **시간 유연성**: 5/10/15/20분 루틴 선택
- **안전성**: 금기사항 필터링, Red Flags 안내
- **진행 추적**: ROM 변화 시각화로 동기 부여
- **W-1 시너지**: 운동 전후 워밍업/쿨다운 연계

### 부정적 결과

- **콘텐츠 제작 비용**: 100+ 스트레칭 이미지/설명 제작
- **초기 복잡도**: C-2 연동 로직, 매칭 알고리즘
- **의료 면책 부담**: 자세 교정 관련 법적 고려

### 리스크

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|----------|
| 콘텐츠 품질 불균일 | 중 | 중 | 전문가 검수, 단계적 출시 |
| 사용자 부상 주장 | 낮 | 높 | 명확한 면책조항, 금기사항 강조 |
| C-2 분석 실패 시 | 중 | 낮 | 일반 루틴 폴백 제공 |
| 저조한 사용률 | 중 | 중 | 푸시 알림, 게이미피케이션 |

## 운동 안전 원칙

W-2 스트레칭 모듈은 사용자 안전을 최우선으로 합니다. 다음 원칙과 가이드라인을 준수합니다.

### 금기 조건 (Contraindications)

| 조건 | 제한 수준 | 대안 |
|------|----------|------|
| 급성 부상 | 완전 금지 | 의료 상담 |
| 만성 관절염 | 부분 제한 | 저강도 동작 |
| 고혈압 (조절되지 않는) | 부분 제한 | 저강도, 호흡 주의 |
| 임신 | 부분 제한 | 임산부 전용 동작 |
| 심장 질환 | 의료 상담 필수 | 의사 승인 후 |
| 골다공증 | 부분 제한 | 충격 동작 제외 |

### 운동 전 체크리스트

앱에서 루틴 시작 전 사용자에게 다음 항목을 확인합니다:

1. [ ] 최근 부상이나 통증이 없는가?
2. [ ] 충분한 수분 섭취를 했는가?
3. [ ] 적절한 운동복과 신발을 착용했는가?
4. [ ] 운동 공간이 안전한가?
5. [ ] 워밍업을 완료했는가?

### 통증 스케일 기반 강도 조절

스트레칭 중 통증 수준에 따른 대응 가이드:

| 점수 범위 | 상태 | 권장 조치 |
|----------|------|----------|
| **0-3점** | 정상 범위 | 계속 진행 |
| **4-6점** | 불편함 | 강도 낮추기, 자세 확인 |
| **7-10점** | 통증 | 즉시 중단, 휴식 |

### RPE (운동자각도) 기준

| RPE | 느낌 | 적용 상황 |
|-----|------|----------|
| **1-3** | 매우 가벼움 | 워밍업 |
| **4-6** | 적당함 | 메인 세트 (권장) |
| **7-8** | 힘듦 | 고강도 인터벌 (고급자) |
| **9-10** | 최대 | **권장하지 않음** |

### 응급 상황 대응 프로토콜

| 증상 | 즉각 조치 | 추가 조치 |
|------|----------|----------|
| 어지러움/호흡 곤란 | 즉시 중단, 앉거나 눕기 | 증상 지속 시 의료 도움 요청 |
| 급성 통증 발생 | 즉시 중단, RICE 처치 | 24시간 내 개선 없으면 진료 |
| 가슴 통증/압박감 | 운동 중단, 안정 취하기 | **119 호출** |
| 실신/의식 저하 | 안전한 자세로 눕히기 | **119 호출**, 기도 확보 |

### RICE 처치법

급성 부상 시 초기 대응:

- **R**est (휴식): 부상 부위 사용 중단
- **I**ce (냉찜질): 20분간 얼음찜질, 2시간 간격
- **C**ompression (압박): 압박 붕대로 부종 방지
- **E**levation (거상): 부상 부위를 심장보다 높이 위치

### 자동 안전 알림 시스템

앱에서 다음 상황 감지 시 자동으로 안전 알림을 제공합니다:

| 트리거 조건 | 알림 내용 | 액션 |
|------------|----------|------|
| 운동 시간 60분 초과 | "충분히 운동했어요. 휴식을 취해주세요." | 휴식 권유 |
| 심박수 Zone 5 지속 (연동 시) | "심박수가 높습니다. 강도를 낮춰주세요." | 저강도 동작 권유 |
| 주 7회 연속 운동 | "휴식일도 중요해요. 오늘은 쉬어가는 건 어떨까요?" | 휴식일 권유 |
| 통증 4점 이상 2회 연속 | "통증이 지속되고 있어요. 전문가 상담을 권장합니다." | 의료 상담 권유 |

### 특수 조건별 주의사항

#### 임산부

- 복부 압박 동작 금지
- 바로 눕는 자세 제한 (2분기 이후)
- 과도한 스트레칭 금지 (릴랙신 호르몬 영향)
- 임산부 전용 루틴 제공

#### 고령자 (65세 이상)

- 급격한 자세 변화 제한
- 평형감각 고려 (지지대 활용 권장)
- 동작 속도 감소
- 호흡 리듬 강조

#### 만성 질환자

- 개인화된 금기사항 필터링 적용
- 저강도 대안 동작 우선 제공
- 증상 악화 시 즉시 중단 안내
- 정기적인 의료 상담 권장

## 구현 가이드

### 우선순위별 구현 순서

| 순서 | 항목 | 예상 시간 | 의존성 |
|------|------|----------|--------|
| 1 | 스트레칭 DB 스키마 및 초기 데이터 (30개) | 8h | - |
| 2 | 자세→스트레칭 매칭 알고리즘 | 6h | 1 |
| 3 | 루틴 생성 알고리즘 | 8h | 2 |
| 4 | 루틴 실행 UI (RoutinePlayer) | 8h | 3 |
| 5 | 진행 추적 API 및 DB | 6h | 4 |
| 6 | ROM 자가 평가 UI | 4h | 5 |
| 7 | 스트레칭 DB 확장 (70개 추가) | 16h | 4 |
| 8 | 가이드 콘텐츠 (이미지/애니메이션) | 20h | 7 |

**총 예상 시간**: 76시간

### 스트레칭 우선순위 (Phase 1)

Phase 1에서 구현할 핵심 30개 스트레칭:

**상부 교차 대응 (12개)**:
- 상부승모근 스트레칭
- 견갑거근 스트레칭
- 대흉근 스트레칭 (문틀)
- 소흉근 스트레칭
- 턱당기기 (Chin Tucks)
- 흉추 폼롤러
- 월 엔젤 (Wall Angels)
- Cat-Cow
- Prone Y-T-W
- 사각근 스트레칭
- 후두하근 릴리즈
- 경추 회전 스트레칭

**하부 교차 대응 (10개)**:
- 장요근 스트레칭 (런지)
- 대퇴직근 스트레칭
- 햄스트링 스트레칭
- 이상근 스트레칭
- 글루트 브릿지
- 데드버그
- 플랭크
- 버드독
- 골반 틸트
- 고관절 90-90 스트레칭

**전신/회복 (8개)**:
- 전신 스트레칭 루틴
- 호흡 다이아프램
- 어깨 돌리기 (동적)
- 고관절 원 그리기 (동적)
- 측면 굽히기
- 척추 트위스트
- 사이드 런지 (동적)
- 다운독/업독

## 리서치 티켓

```
[W-2-R1] 스트레칭 효과 측정 방법론
────────────────────────────────────────
리서치 질문:
1. ROM 자가 평가의 정확도와 신뢰도는?
2. 자가 평가 vs 카메라 측정 상관관계
3. 스트레칭 효과 나타나는 최소 기간 (주 단위)

예상 출력:
- ROM 테스트 프로토콜 선정
- 효과 측정 주기 권장안
```

```
[W-2-R2] 금기사항 및 안전 가이드라인
────────────────────────────────────────
리서치 질문:
1. 스트레칭별 절대/상대 금기사항
2. Red Flags 증상 목록 (즉시 중단 기준)
3. 임산부, 노인, 특수 조건별 주의사항

예상 출력:
- 금기사항 필터링 로직
- 안전 경고 메시지 템플릿
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 체형 역학](../principles/body-mechanics.md) - 자세 평가, 스트레칭 원리, Janda 교차증후군
- [원리: 운동 생리학](../principles/exercise-physiology.md) - 근수축 유형, 스트레칭 기법, 불균형 프로토콜

### 관련 ADR
- [ADR-031: 운동 모듈 아키텍처](./ADR-031-workout-module.md) - W-1 기반 구조
- [ADR-044: C-2 체형분석 v2](./ADR-044-c2-v2-architecture.md) - 자세 분석 연동
- [ADR-011: 크로스 모듈 데이터 플로우](./ADR-011-cross-module-data-flow.md) - C-2 ↔ W-2 데이터 연동
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md) - C-2 실패 시 폴백

### 관련 스펙
- [SDD-W-2-ADVANCED-STRETCHING](../specs/SDD-W-2-ADVANCED-STRETCHING.md) - W-2 상세 설계 (작성 예정)
- [SDD-W1-WORKOUT](../specs/SDD-W1-WORKOUT.md) - W-1 운동 모듈

### 의료 면책

```
⚠️ 중요 의료 면책

이 스트레칭 프로그램은 일반적인 웰니스 및 피트니스 목적이며,
의료 진단이나 물리치료를 대체하지 않습니다.

다음 사항에 해당하면 반드시 전문가 상담 후 시작하세요:
- 급성 통증 또는 부상
- 만성 근골격계 질환
- 최근 수술 (6주 이내)
- 심혈관 질환
- 임신

스트레칭 중 다음 증상 발생 시 즉시 중단:
- 방사통 (팔/다리로 퍼지는 통증)
- 저림, 무감각
- 어지러움, 실신
- 갑작스러운 근력 저하

자세 교정 효과는 개인차가 있으며,
지속적인 실천과 전문가 가이드를 권장합니다.
```

---

**Author**: Claude Code
**Version**: 1.1 | **Updated**: 2026-01-23 | 운동 안전 원칙 섹션 추가
**Reviewed by**: -
