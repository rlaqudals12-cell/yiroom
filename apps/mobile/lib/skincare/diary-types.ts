/**
 * 피부 다이어리 타입 정의
 * 웹의 types/skin-diary.ts 기반, 모바일에 맞게 경량화
 */

// 점수 타입 (1-5)
export type SkinConditionScore = 1 | 2 | 3 | 4 | 5;
export type SleepQualityScore = 1 | 2 | 3 | 4 | 5;
export type StressLevelScore = 1 | 2 | 3 | 4 | 5;

export type WeatherType =
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'cold'
  | 'hot'
  | 'humid'
  | 'dry';

export type TrendDirection = 'improving' | 'stable' | 'declining';

/** 다이어리 엔트리 (앱 내부 camelCase) */
export interface SkinDiaryEntry {
  id: string;
  clerkUserId: string;
  entryDate: string; // YYYY-MM-DD
  skinCondition: SkinConditionScore;
  conditionNotes?: string;
  sleepHours?: number;
  sleepQuality?: SleepQualityScore;
  waterIntakeMl?: number;
  stressLevel?: StressLevelScore;
  weather?: WeatherType;
  morningRoutineCompleted: boolean;
  eveningRoutineCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 새 엔트리 입력 */
export interface SkinDiaryInput {
  entryDate: string;
  skinCondition: SkinConditionScore;
  conditionNotes?: string;
  sleepHours?: number;
  sleepQuality?: SleepQualityScore;
  waterIntakeMl?: number;
  stressLevel?: StressLevelScore;
  weather?: WeatherType;
  morningRoutineCompleted: boolean;
  eveningRoutineCompleted: boolean;
}

/** 월간 요약 */
export interface SkinDiaryMonthlySummary {
  totalEntries: number;
  avgCondition: number;
  routineRate: { morning: number; evening: number };
  trend: TrendDirection;
}

/** DB 로우 (snake_case) */
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
  morning_routine_completed: boolean;
  evening_routine_completed: boolean;
  created_at: string;
  updated_at: string;
}

// 컨디션 점수 라벨
export const CONDITION_LABELS: Record<SkinConditionScore, string> = {
  1: '매우 나쁨',
  2: '나쁨',
  3: '보통',
  4: '좋음',
  5: '매우 좋음',
};

// 컨디션 이모지
export const CONDITION_EMOJIS: Record<SkinConditionScore, string> = {
  1: '😣',
  2: '😟',
  3: '😐',
  4: '😊',
  5: '🤩',
};

// 날씨 라벨
export const WEATHER_LABELS: Record<WeatherType, string> = {
  sunny: '맑음',
  cloudy: '흐림',
  rainy: '비',
  cold: '추움',
  hot: '더움',
  humid: '습함',
  dry: '건조',
};

export const WEATHER_ICONS: Record<WeatherType, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  cold: '🥶',
  hot: '🥵',
  humid: '💧',
  dry: '🏜️',
};

/** DB 로우 → 앱 엔트리 변환 */
export function transformDbToEntry(row: DbSkinDiaryEntry): SkinDiaryEntry {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    entryDate: row.entry_date,
    skinCondition: row.skin_condition as SkinConditionScore,
    conditionNotes: row.condition_notes ?? undefined,
    sleepHours: row.sleep_hours ?? undefined,
    sleepQuality: row.sleep_quality != null
      ? (row.sleep_quality as SleepQualityScore)
      : undefined,
    waterIntakeMl: row.water_intake_ml ?? undefined,
    stressLevel: row.stress_level != null
      ? (row.stress_level as StressLevelScore)
      : undefined,
    weather: (row.weather as WeatherType) ?? undefined,
    morningRoutineCompleted: row.morning_routine_completed,
    eveningRoutineCompleted: row.evening_routine_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
