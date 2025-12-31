// 운동 카테고리
export type ExerciseCategory = 'upper' | 'lower' | 'core' | 'cardio';

// 운동 스타일 (방식) - 2차원 분류용
export type ExerciseStyle =
  | 'weight' // 웨이트 트레이닝
  | 'calisthenics' // 맨몸 운동
  | 'pilates' // 필라테스
  | 'yoga' // 요가
  | 'stretching' // 스트레칭
  | 'hiit' // 고강도 인터벌
  | 'functional'; // 기능성 운동

// 운동 난이도
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

// 운동 타입 (5가지)
export type WorkoutType = 'toner' | 'builder' | 'burner' | 'mover' | 'flexer';

// 운동 장소
export type WorkoutLocation = 'home' | 'gym' | 'outdoor';

// 부위 분류
export type BodyPart =
  | 'chest' // 가슴
  | 'back' // 등
  | 'shoulder' // 어깨
  | 'arm' // 팔
  | 'thigh' // 허벅지
  | 'calf' // 종아리
  | 'hip' // 엉덩이
  | 'abs' // 복부
  | 'waist'; // 허리

// 개별 운동 정보
export interface Exercise {
  id: string;
  name: string;
  nameEn?: string;
  category: ExerciseCategory;
  bodyParts: BodyPart[];
  equipment: string[];
  difficulty: ExerciseDifficulty;
  instructions: string[];
  tips: string[];
  caloriesPerMinute: number;
  met: number; // Metabolic Equivalent of Task
  videoUrl?: string;
  thumbnailUrl?: string;
  suitableFor: {
    bodyTypes?: string[]; // 적합한 체형
    goals?: string[]; // 적합한 목표
    injuries?: string[]; // 주의 부상 (이 부상이 있으면 피해야 함)
    contraindications?: string[]; // 금기 조건 (임산부, 고혈압, 녹내장 등)
  };

  // 운동 스타일 (2차원 분류)
  style?: ExerciseStyle;

  // 요가/필라테스 전용 필드
  sanskritName?: string; // 요가 산스크리트명
  breathingGuide?: string; // 호흡법
  variations?: {
    // 변형 동작
    easier?: string;
    harder?: string;
  };
  mentalEffects?: string[]; // 정신적 효과 (요가/명상)
  physicalEffects?: string[]; // 신체적 효과 (유연성/근력 등)
}

// C-1에서 가져오는 체형 데이터
export interface BodyTypeData {
  type: string;
  proportions: {
    shoulder: number;
    waist: number;
    hip: number;
  };
  height?: number; // cm
  weight?: number; // kg
}

// 온보딩 입력 데이터 (Store와 동기화)
export interface WorkoutInputData {
  bodyTypeData: BodyTypeData | null;
  goals: string[];
  concerns: string[];
  frequency: string;
  location: string;
  equipment: string[];
  targetWeight?: number;
  targetDate?: string;
  injuries: string[];
}

// 주간 운동 계획 - 하루 단위
export interface DayPlan {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  dayLabel: string;
  isRestDay: boolean;
  focus?: BodyPart[]; // 집중 부위 (상세)
  categories?: ExerciseCategory[]; // 집중 카테고리 (캘린더 표시용)
  exercises: Exercise[];
  estimatedMinutes: number;
  estimatedCalories: number;
}

// 주간 운동 계획
export interface WorkoutPlan {
  id: string;
  userId: string;
  weekStartDate: string; // ISO date string (월요일)
  workoutType: WorkoutType;
  frequency: string;
  days: DayPlan[];
  totalMinutes: number;
  totalCalories: number;
  createdAt: string;
  updatedAt: string;
}

// 운동 세션 기록 (하루 운동 완료 기록)
export interface WorkoutSession {
  id: string;
  planId: string;
  userId: string;
  date: string; // ISO date string
  completedExercises: {
    exerciseId: string;
    sets: number;
    reps: number;
    weight?: number; // kg
    duration?: number; // minutes (유산소용)
    completed: boolean;
  }[];
  totalMinutes: number;
  totalCalories: number;
  notes?: string;
  createdAt: string;
}

// 연속 운동 기록 (Streak)
export interface WorkoutStreak {
  id: string;
  userId: string;
  currentStreak: number; // 현재 연속일
  longestStreak: number; // 최장 연속일
  lastWorkoutDate: string; // 마지막 운동 날짜
  streakStartDate: string; // 현재 연속 시작일
  milestones: number[]; // 달성한 마일스톤 (7, 14, 30, 60, 100...)
  updatedAt: string;
}

// AI 분석 결과
export interface WorkoutAnalysis {
  id: string;
  userId: string;
  inputData: WorkoutInputData;
  workoutType: WorkoutType;
  workoutTypeReason: string;
  recommendedExercises: Exercise[];
  weeklyPlan: WorkoutPlan;
  insights: {
    bodyTypeAdvice: string;
    goalAdvice: string;
    cautionAdvice?: string; // 부상 관련 주의사항
  };
  createdAt: string;
}

// 7가지 운동 지표
export interface WorkoutMetrics {
  weeklyFrequency: {
    current: number;
    target: number;
    percentage: number;
  };
  totalTime: {
    current: number; // minutes
    target: number;
  };
  totalCalories: {
    current: number;
    target: number;
  };
  volume: {
    current: number; // sets x reps x weight
    previousWeek: number;
    changePercent: number;
  };
  bodyBalance: {
    upper: number; // percentage
    lower: number;
    core: number;
  };
  goalProgress: {
    current: number;
    target: number;
    percentage: number;
  };
  streak: WorkoutStreak;
}

// 퍼스널 컬러 시즌
export type PersonalColorSeason = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

// 체형 타입 (C-1 연동)
export type BodyType = 'X' | 'A' | 'V' | 'H' | 'O' | 'I' | 'Y' | '8';

// =====================================================
// Sprint 3: 운동 세션 타입
// =====================================================

// 세트 상태
export type SetStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

// 개별 세트 기록
export interface SetRecord {
  setNumber: number;
  targetReps: number;
  actualReps?: number;
  targetWeight?: number; // kg
  actualWeight?: number; // kg
  status: SetStatus;
  completedAt?: string; // ISO date string
}

// 운동 세션 내 개별 운동 기록
export interface ExerciseSessionRecord {
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  sets: SetRecord[];
  restSeconds: number; // 세트 간 휴식 시간
  difficulty?: number; // 1-5 체감 난이도
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  isCompleted: boolean;
}

// 운동 세션 상태
export type SessionStatus = 'not_started' | 'in_progress' | 'resting' | 'completed' | 'paused';

// 운동 세션 (실시간 진행 상태)
export interface WorkoutSessionState {
  sessionId: string;
  planId: string;
  dayPlan: DayPlan;
  userId: string;
  workoutDate: string; // ISO date string
  status: SessionStatus;

  // 진행 상태
  currentExerciseIndex: number;
  currentSetIndex: number;
  exerciseRecords: ExerciseSessionRecord[];

  // 휴식 타이머
  restTimeRemaining?: number; // seconds
  isResting: boolean;

  // 통계
  totalSetsCompleted: number;
  totalSetsPlanned: number;
  elapsedTime: number; // seconds
  estimatedCalories: number;

  // 타임스탬프
  startedAt?: string;
  completedAt?: string;
}

// 휴식 타이머 설정
export interface RestTimerSettings {
  defaultSeconds: number; // 기본 휴식 시간
  minSeconds: number; // 최소 (30초)
  maxSeconds: number; // 최대 (180초)
  stepSeconds: number; // 조절 단위 (10초)
  autoStart: boolean; // 자동 시작 여부
  soundEnabled: boolean; // 소리 알림
  vibrationEnabled: boolean; // 진동 알림
}

// 운동 타입별 기본 휴식 시간
export const DEFAULT_REST_TIMES: Record<WorkoutType, number> = {
  toner: 45, // 토닝: 45초
  builder: 90, // 빌더: 90초
  burner: 30, // 버너: 30초
  mover: 60, // 무버: 60초
  flexer: 30, // 플렉서: 30초
};

// 운동 카테고리별 기본 휴식 시간
export const CATEGORY_REST_TIMES: Record<ExerciseCategory, number> = {
  upper: 60,
  lower: 90,
  core: 45,
  cardio: 30,
};

// 세션 완료 결과
export interface SessionCompletionResult {
  sessionId: string;
  totalExercises: number;
  completedExercises: number;
  totalSets: number;
  completedSets: number;
  totalVolume: number; // sets x reps x weight
  totalTime: number; // seconds
  caloriesBurned: number;
  averageDifficulty: number;
  isFullCompletion: boolean; // 모든 운동 완료 여부
}
