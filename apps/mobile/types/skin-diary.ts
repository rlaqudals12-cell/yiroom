/**
 * 피부 일기 타입 정의
 * @description 피부 Phase C: 일일 컨디션 기록 및 월간 리포트 시스템
 * @version 1.0
 * @date 2026-01-10
 */

// ================================================
// 기본 타입
// ================================================

/** 피부 컨디션 점수 (1: 매우 나쁨 ~ 5: 매우 좋음) */
export type SkinConditionScore = 1 | 2 | 3 | 4 | 5;

/** 수면 품질 점수 (1: 매우 나쁨 ~ 5: 매우 좋음) */
export type SleepQualityScore = 1 | 2 | 3 | 4 | 5;

/** 스트레스 레벨 (1: 매우 낮음 ~ 5: 매우 높음) */
export type StressLevelScore = 1 | 2 | 3 | 4 | 5;

/** 날씨 타입 */
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'cold' | 'hot' | 'humid' | 'dry';

/** 트렌드 방향 */
export type TrendDirection = 'improving' | 'stable' | 'declining';

// ================================================
// 피부 일기 엔트리
// ================================================

/** 피부 일기 엔트리 */
export interface SkinDiaryEntry {
  id: string;
  clerkUserId: string;
  entryDate: Date;

  // 피부 컨디션 (필수)
  skinCondition: SkinConditionScore;
  conditionNotes?: string;

  // 생활 요인 (선택)
  sleepHours?: number;
  sleepQuality?: SleepQualityScore;
  waterIntakeMl?: number;
  stressLevel?: StressLevelScore;

  // 외부 요인 (선택)
  weather?: WeatherType;
  outdoorHours?: number;

  // 스킨케어 연동 (Phase B)
  morningRoutineCompleted: boolean;
  eveningRoutineCompleted: boolean;
  specialTreatments: string[];

  // AI 분석 결과
  aiCorrelationScore?: number;
  aiInsights?: CorrelationInsight[];

  createdAt: Date;
  updatedAt: Date;
}

/** DB 엔트리 (snake_case) */
export interface DbSkinDiaryEntry {
  id: string;
  clerk_user_id: string;
  entry_date: string;
  skin_condition: number;
  condition_notes: string | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  water_intake_ml: number | null;
  stress_level: number | null;
  weather: string | null;
  outdoor_hours: number | null;
  morning_routine_completed: boolean;
  evening_routine_completed: boolean;
  special_treatments: string[] | null;
  ai_correlation_score: number | null;
  ai_insights: CorrelationInsight[] | null;
  created_at: string;
  updated_at: string;
}

// ================================================
// 상관관계 분석
// ================================================

/** 상관관계 인사이트 */
export interface CorrelationInsight {
  factor: string; // "수면", "수분 섭취", "스트레스"
  factorKey: string; // "sleepHours", "waterIntakeMl", "stressLevel"
  correlation: number; // -1 ~ 1
  confidence: number; // 0-100
  insight: string; // "수면 7시간 이상일 때 피부 상태가 15% 개선"
  recommendation: string; // "수면 시간을 7시간 이상 유지해보세요"
  isPositive: boolean; // 양의 상관관계 여부
}

/** 상관관계 분석 요인 */
export interface CorrelationFactor {
  key: string;
  name: string;
  inverse?: boolean; // 역상관 (스트레스는 낮을수록 좋음)
}

// ================================================
// 월간 리포트
// ================================================

/** 월간 리포트 */
export interface MonthlyReport {
  month: string; // "2026-01"
  totalEntries: number;
  avgCondition: number;
  bestDay: Date | null;
  worstDay: Date | null;
  topFactors: CorrelationInsight[];
  routineCompletionRate: {
    morning: number; // 0-100%
    evening: number; // 0-100%
  };
  trendDirection: TrendDirection;
  weeklyAverages: WeeklyAverage[];
}

/** 주간 평균 */
export interface WeeklyAverage {
  weekStart: Date;
  avgCondition: number;
  entriesCount: number;
}

// ================================================
// UI 컴포넌트 Props
// ================================================

/** DiaryCalendar Props */
export interface DiaryCalendarProps {
  entries: SkinDiaryEntry[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange?: (year: number, month: number) => void;
  className?: string;
}

/** DiaryEntryForm Props */
export interface DiaryEntryFormProps {
  date: Date;
  existingEntry?: SkinDiaryEntry;
  onSubmit: (entry: SkinDiaryEntryInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

/** ConditionSelector Props */
export interface ConditionSelectorProps {
  value: SkinConditionScore | undefined;
  onChange: (score: SkinConditionScore) => void;
  className?: string;
}

/** LifestyleFactors Props */
export interface LifestyleFactorsProps {
  sleepHours?: number;
  sleepQuality?: SleepQualityScore;
  waterIntakeMl?: number;
  stressLevel?: StressLevelScore;
  weather?: WeatherType;
  outdoorHours?: number;
  onChange: (factors: LifestyleFactorsInput) => void;
  className?: string;
}

/** RoutineCheckbox Props */
export interface RoutineCheckboxProps {
  morningCompleted: boolean;
  eveningCompleted: boolean;
  specialTreatments: string[];
  onChange: (data: RoutineCheckboxInput) => void;
  className?: string;
}

/** MonthlyReportCard Props */
export interface MonthlyReportCardProps {
  report: MonthlyReport;
  onViewDetails?: () => void;
  className?: string;
}

/** CorrelationChart Props */
export interface CorrelationChartProps {
  insights: CorrelationInsight[];
  className?: string;
}

/** FactorTrendChart Props */
export interface FactorTrendChartProps {
  entries: SkinDiaryEntry[];
  factor: string;
  period: '7days' | '30days' | '90days';
  className?: string;
}

// ================================================
// 입력 타입
// ================================================

/** 피부 일기 엔트리 입력 */
export interface SkinDiaryEntryInput {
  entryDate: Date;
  skinCondition: SkinConditionScore;
  conditionNotes?: string;
  sleepHours?: number;
  sleepQuality?: SleepQualityScore;
  waterIntakeMl?: number;
  stressLevel?: StressLevelScore;
  weather?: WeatherType;
  outdoorHours?: number;
  morningRoutineCompleted?: boolean;
  eveningRoutineCompleted?: boolean;
  specialTreatments?: string[];
}

/** 생활 요인 입력 */
export interface LifestyleFactorsInput {
  sleepHours?: number;
  sleepQuality?: SleepQualityScore;
  waterIntakeMl?: number;
  stressLevel?: StressLevelScore;
  weather?: WeatherType;
  outdoorHours?: number;
}

/** 루틴 체크박스 입력 */
export interface RoutineCheckboxInput {
  morningCompleted: boolean;
  eveningCompleted: boolean;
  specialTreatments: string[];
}

// ================================================
// API 응답 타입
// ================================================

/** 엔트리 생성/업데이트 응답 */
export interface SkinDiaryEntryResponse {
  success: boolean;
  entry?: SkinDiaryEntry;
  error?: string;
}

/** 월간 엔트리 목록 응답 */
export interface MonthlyEntriesResponse {
  entries: SkinDiaryEntry[];
  month: string;
}

/** 월간 리포트 응답 */
export interface MonthlyReportResponse {
  success: boolean;
  report?: MonthlyReport;
  error?: string;
}

// ================================================
// 유틸리티 타입
// ================================================

/** 컨디션 점수별 이모지 */
export const CONDITION_EMOJIS: Record<SkinConditionScore, string> = {
  1: '😫',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
};

/** 컨디션 점수별 라벨 */
export const CONDITION_LABELS: Record<SkinConditionScore, string> = {
  1: '매우 나쁨',
  2: '나쁨',
  3: '보통',
  4: '좋음',
  5: '매우 좋음',
};

/** 컨디션 점수별 색상 */
export const CONDITION_COLORS: Record<SkinConditionScore, string> = {
  1: '#EF4444', // red-500
  2: '#F97316', // orange-500
  3: '#EAB308', // yellow-500
  4: '#84CC16', // lime-500
  5: '#22C55E', // green-500
};

/** 날씨 이모지 */
export const WEATHER_EMOJIS: Record<WeatherType, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  cold: '❄️',
  hot: '🔥',
  humid: '💧',
  dry: '🏜️',
};

/** 날씨 라벨 */
export const WEATHER_LABELS: Record<WeatherType, string> = {
  sunny: '맑음',
  cloudy: '흐림',
  rainy: '비',
  cold: '추움',
  hot: '더움',
  humid: '습함',
  dry: '건조',
};
