/**
 * W-2 스트레칭 모듈 타입 정의
 *
 * @module types/stretching
 * @description Janda 교차증후군, PNF, ACSM 가이드라인 기반 스트레칭 타입
 * @see docs/specs/SDD-W-2-ADVANCED-STRETCHING.md
 */

// ============================================
// 기본 타입
// ============================================

/**
 * 스트레칭 유형
 * - static: 정적 (운동 후, 유연성 향상)
 * - dynamic: 동적 (운동 전, 워밍업)
 * - pnf: PNF (운동 후, 최대 ROM 획득)
 */
export type StretchType = 'static' | 'dynamic' | 'pnf';

/**
 * 스트레칭 카테고리
 */
export type StretchCategory =
  | 'posture_correction'  // 자세교정
  | 'sport_warmup'        // 스포츠 워밍업
  | 'sport_cooldown'      // 스포츠 쿨다운
  | 'general_flexibility' // 일반 유연성
  | 'recovery';           // 회복

/**
 * 스포츠 유형 (Phase 1 지원)
 */
export type SportType =
  | 'hiking'    // 등산
  | 'running'   // 러닝
  | 'golf'      // 골프
  | 'cycling'   // 자전거
  | 'swimming'  // 수영
  | 'tennis';   // 테니스

/**
 * 자세 불균형 유형 (Janda 교차증후군 기반)
 */
export type PostureImbalanceType =
  | 'upper_cross'       // 상부교차증후군 (거북목 + 라운드숄더)
  | 'lower_cross'       // 하부교차증후군 (골반전방경사)
  | 'sway_back'         // 스웨이백
  | 'flat_back'         // 편평등
  | 'forward_head'      // 거북목 단독
  | 'rounded_shoulder'  // 라운드숄더 단독
  | 'pelvic_tilt_ant'   // 골반전방경사 단독
  | 'pelvic_tilt_post'; // 골반후방경사

/**
 * 근육군 (운동생리학 원리 기반)
 */
export type MuscleGroup =
  // 상체
  | 'pectoralis_major'      // 대흉근
  | 'pectoralis_minor'      // 소흉근
  | 'upper_trapezius'       // 상부 승모근
  | 'mid_lower_trapezius'   // 중/하부 승모근
  | 'levator_scapulae'      // 견갑거근
  | 'rhomboids'             // 능형근
  | 'serratus_anterior'     // 전거근
  | 'latissimus_dorsi'      // 광배근
  | 'deep_neck_flexors'     // 심부 경추 굴곡근
  | 'suboccipitals'         // 후두하근
  | 'sternocleidomastoid'   // 흉쇄유돌근
  | 'rotator_cuff'          // 회전근개
  | 'deltoid'               // 삼각근
  // 코어
  | 'rectus_abdominis'      // 복직근
  | 'transverse_abdominis'  // 복횡근
  | 'obliques'              // 복사근
  | 'erector_spinae'        // 척추기립근
  | 'multifidus'            // 다열근
  | 'quadratus_lumborum'    // 요방형근
  // 하체
  | 'iliopsoas'             // 장요근
  | 'rectus_femoris'        // 대퇴직근
  | 'gluteus_maximus'       // 대둔근
  | 'gluteus_medius'        // 중둔근
  | 'piriformis'            // 이상근
  | 'hamstrings'            // 햄스트링
  | 'quadriceps'            // 대퇴사두근
  | 'adductors'             // 내전근
  | 'tensor_fasciae_latae'  // 대퇴근막장근
  | 'iliotibial_band'       // 장경인대
  | 'gastrocnemius'         // 비복근
  | 'soleus'                // 가자미근
  | 'tibialis_anterior';    // 전경골근

/**
 * 장비 유형
 */
export type Equipment =
  | 'bodyweight'       // 맨몸
  | 'wall'             // 벽
  | 'chair'            // 의자
  | 'mat'              // 매트
  | 'foam_roller'      // 폼롤러
  | 'resistance_band'  // 저항밴드
  | 'yoga_block'       // 요가블록
  | 'trekking_pole'    // 트레킹폴 (등산)
  | 'golf_club';       // 골프채

/**
 * 난이도
 */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// ============================================
// 스트레칭 운동 정의
// ============================================

/**
 * 운동 변형 (특수 상황용)
 */
export interface ExerciseModification {
  condition: string;          // '무릎 통증', '임산부', '고령자' 등
  description: string;
  adjustedDuration?: number;
  adjustedSets?: number;
  alternativeExerciseId?: string;
}

/**
 * 스트레칭 운동 정의
 */
export interface StretchExercise {
  id: string;
  nameKo: string;
  nameEn: string;
  type: StretchType;
  category: StretchCategory;

  // 근육 타겟
  targetMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];

  // 실행 정보
  equipment: Equipment[];
  difficulty: Difficulty;

  // 파라미터
  defaultDuration: number;          // 초 (정적) 또는 횟수 (동적)
  durationUnit: 'seconds' | 'reps';
  sets: number;
  restBetweenSets: number;          // 초

  // 콘텐츠
  instructions: string[];           // 단계별 설명
  breathingGuide: string;           // 호흡 가이드
  commonMistakes: string[];         // 흔한 실수

  // 미디어
  videoUrl?: string;
  thumbnailUrl?: string;
  animationFrames?: string[];       // 애니메이션 프레임 URL

  // 안전
  contraindications: string[];      // 금기사항
  modifications: ExerciseModification[];
  redFlags: string[];               // 즉시 중단 신호
}

// ============================================
// 자세 분석 연동
// ============================================

/**
 * 자세 불균형 상세
 */
export interface PostureImbalance {
  type: PostureImbalanceType;
  severity: 'mild' | 'moderate' | 'severe';
  affectedAngles: string[];
  description: string;
}

/**
 * 자세 분석 결과 (C-1/C-2에서 전달받음)
 */
export interface PostureAnalysisResult {
  assessmentId: string;
  createdAt: string;

  // 측정 각도 (body-mechanics.md 참조)
  angles: {
    cva: number;              // 두개척추각 (정상: >50°)
    shoulderTilt: number;     // 어깨 기울기 (정상: 0°)
    thoracicKyphosis: number; // 흉추 후만 (정상: 20-40°)
    lumbarLordosis: number;   // 요추 전만 (정상: 40-60°)
    pelvicTilt: number;       // 골반 기울기 (정상: 0°)
  };

  // 점수 및 등급
  overallScore: number;       // 0-100
  category: 'excellent' | 'good' | 'moderate' | 'poor';

  // 감지된 불균형
  imbalances: PostureImbalance[];

  // 단축/약화 근육
  tightMuscles: MuscleGroup[];
  weakMuscles: MuscleGroup[];
}

// ============================================
// 사용자 프로필 및 처방
// ============================================

/**
 * 특수 조건 (안전 필터링용)
 */
export type SpecialCondition =
  | 'pregnancy'          // 임신
  | 'senior'             // 고령자 (65+)
  | 'osteoporosis'       // 골다공증
  | 'disc_herniation'    // 디스크 탈출
  | 'spinal_stenosis'    // 척추관 협착
  | 'rheumatoid'         // 류마티스
  | 'hypermobility'      // 과가동성
  | 'recent_surgery';    // 최근 수술

/**
 * 사용자 프로필 (스트레칭용)
 */
export interface StretchingUserProfile {
  userId: string;

  // 기본 정보
  age: number;
  gender: 'male' | 'female';

  // 운동 수준
  fitnessLevel: Difficulty;
  stretchingExperience: 'none' | 'some' | 'regular';

  // 스포츠 활동
  primarySports: SportType[];
  sportsFrequency: 'daily' | 'weekly' | 'monthly' | 'rarely';

  // 건강 정보
  contraindications: string[];  // 기존 질환, 부상
  specialConditions: SpecialCondition[];

  // 가용 장비
  availableEquipment: Equipment[];

  // 선호 설정
  preferredSessionDuration: number;  // 분
  preferredLanguage: 'ko' | 'en';
}

/**
 * 처방된 개별 스트레칭
 */
export interface PrescribedStretch {
  exercise: StretchExercise;
  order: number;
  adjustedDuration: number;
  adjustedSets: number;
  notes?: string;
}

/**
 * 스트레칭 처방 결과
 */
export interface StretchingPrescription {
  prescriptionId: string;
  createdAt: string;

  // 입력 기반
  basedOn: {
    postureAnalysis?: string;  // 자세분석 ID
    sport?: SportType;
    purpose: 'posture_correction' | 'warmup' | 'cooldown' | 'general';
  };

  // 처방 내용
  stretches: PrescribedStretch[];
  inhibitions?: PrescribedStretch[];   // SMR/폼롤링 (NASM)
  activations?: PrescribedStretch[];   // 약화근육 활성화

  // 메타 정보
  totalDuration: number;               // 분
  frequency: string;                   // '주 5-6회' 등
  warnings: string[];
  medicalDisclaimer: string;
}

// ============================================
// 주간 루틴
// ============================================

/**
 * 일일 루틴
 */
export interface DailyRoutine {
  type: 'stretch' | 'strengthen' | 'rest' | 'active_recovery';
  stretches: PrescribedStretch[];
  duration: number;  // 분
  notes?: string;
}

/**
 * 주간 스트레칭 플랜
 */
export interface WeeklyStretchingPlan {
  planId: string;
  userId: string;
  weekStartDate: string;

  days: {
    monday: DailyRoutine;
    tuesday: DailyRoutine;
    wednesday: DailyRoutine;
    thursday: DailyRoutine;
    friday: DailyRoutine;
    saturday: DailyRoutine;
    sunday: DailyRoutine;
  };

  progressionWeek: number;  // 1-4주차
}

// ============================================
// 진행 추적
// ============================================

/**
 * 완료된 운동 기록
 */
export interface CompletedExercise {
  exerciseId: string;
  completedAt: string;
  actualDuration: number;
  actualSets: number;
  difficultyFeedback: 'easy' | 'appropriate' | 'hard';
  notes?: string;
}

/**
 * 스트레칭 세션 기록
 */
export interface StretchingSession {
  sessionId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;

  // 수행 내용
  prescriptionId: string;
  completedExercises: CompletedExercise[];

  // 피드백
  perceivedEffort: number;    // 1-10 RPE
  painReported: boolean;
  painDetails?: string;
  notes?: string;
}

/**
 * ROM 자가보고 기록
 */
export interface ROMSelfReport {
  reportId: string;
  userId: string;
  reportedAt: string;

  measurements: {
    movement: string;           // '햄스트링 터치', '어깨 회전' 등
    achievedROM: number;        // 도 또는 거리(cm)
    unit: 'degrees' | 'cm';
    notes?: string;
  }[];
}

/**
 * 통증 보고
 */
export interface PainReport {
  reportId: string;
  userId: string;
  reportedAt: string;
  sessionId?: string;

  location: MuscleGroup;
  intensity: number;            // 0-10 VAS
  type: 'sharp' | 'dull' | 'burning' | 'stiffness';
  timing: 'during' | 'after' | 'next_day';
  description?: string;
}

// ============================================
// API 타입
// ============================================

/**
 * 스트레칭 처방 요청
 */
export interface StretchingPrescriptionRequest {
  userId: string;
  purpose: 'posture_correction' | 'warmup' | 'cooldown' | 'general';
  postureAnalysisId?: string;
  sport?: SportType;
  availableTime?: number;  // 분
  equipmentAvailable?: Equipment[];
}

/**
 * 스트레칭 처방 응답
 */
export interface StretchingPrescriptionResponse {
  success: boolean;
  data?: {
    prescription: StretchingPrescription;
    estimatedDuration: number;
    exerciseCount: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 루틴 생성 요청
 */
export interface RoutineGeneratorInput {
  userId: string;
  profile: StretchingUserProfile;
  postureAnalysis?: PostureAnalysisResult;
  sport?: SportType;
  purpose: 'posture_correction' | 'warmup' | 'cooldown' | 'general';
  availableMinutes: number;
}

/**
 * 루틴 생성 결과
 */
export interface RoutineGeneratorOutput {
  prescription: StretchingPrescription;
  weeklyPlan?: WeeklyStretchingPlan;
  progressionSuggestions: string[];
}
