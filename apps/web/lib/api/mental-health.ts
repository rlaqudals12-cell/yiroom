/**
 * M-1 정신건강 트래킹 Repository
 *
 * 스트레스/수면/기분 일일 트래킹 데이터 CRUD
 * - clerk_user_id 기반 RLS 적용
 * - 일일 체크인 기록 저장/조회
 * - 트렌드 분석용 기간별 조회
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';

// =====================================================
// 타입 정의
// =====================================================

/** 기분 점수 (1-5) */
export type MoodScore = 1 | 2 | 3 | 4 | 5;

/** 스트레스 레벨 (1-10) */
export type StressLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** 수면 품질 (1-5) */
export type SleepQuality = 1 | 2 | 3 | 4 | 5;

/** 에너지 레벨 (1-5) */
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

/** 정신건강 로그 */
export interface MentalHealthLog {
  id: string;
  clerk_user_id: string;
  log_date: string;
  mood_score: MoodScore | null;
  stress_level: StressLevel | null;
  sleep_hours: number | null;
  sleep_quality: SleepQuality | null;
  energy_level: EnergyLevel | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** 체크인 입력 데이터 */
export interface MentalHealthCheckinInput {
  log_date?: string; // 기본값: 오늘
  mood_score?: MoodScore;
  stress_level?: StressLevel;
  sleep_hours?: number;
  sleep_quality?: SleepQuality;
  energy_level?: EnergyLevel;
  notes?: string;
}

/** 트렌드 통계 */
export interface MentalHealthTrend {
  period: 'week' | 'month';
  avgMoodScore: number;
  avgStressLevel: number;
  avgSleepHours: number;
  avgSleepQuality: number;
  avgEnergyLevel: number;
  totalLogs: number;
  startDate: string;
  endDate: string;
}

/** 오늘의 요약 */
export interface TodaySummary {
  hasCheckin: boolean;
  log: MentalHealthLog | null;
  streak: number; // 연속 체크인 일수
}

// =====================================================
// CRUD 함수
// =====================================================

/**
 * 정신건강 체크인 저장 (upsert)
 * - 같은 날짜에 이미 기록이 있으면 업데이트
 */
export async function saveMentalHealthCheckin(
  userId: string,
  input: MentalHealthCheckinInput
): Promise<MentalHealthLog | null> {
  const supabase = createClerkSupabaseClient();

  const logDate = input.log_date || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('mental_health_logs')
    .upsert(
      {
        clerk_user_id: userId,
        log_date: logDate,
        mood_score: input.mood_score,
        stress_level: input.stress_level,
        sleep_hours: input.sleep_hours,
        sleep_quality: input.sleep_quality,
        energy_level: input.energy_level,
        notes: input.notes,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'clerk_user_id,log_date',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('[MentalHealth] Save checkin error:', error);
    return null;
  }

  return data as MentalHealthLog;
}

/**
 * 특정 날짜의 체크인 조회
 */
export async function getMentalHealthLog(
  userId: string,
  date: string
): Promise<MentalHealthLog | null> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('mental_health_logs')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('log_date', date)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      // Not found는 정상
      console.error('[MentalHealth] Get log error:', error);
    }
    return null;
  }

  return data as MentalHealthLog;
}

/**
 * 오늘의 체크인 조회
 */
export async function getTodayCheckin(userId: string): Promise<MentalHealthLog | null> {
  const today = new Date().toISOString().split('T')[0];
  return getMentalHealthLog(userId, today);
}

/**
 * 기간별 체크인 목록 조회
 */
export async function getMentalHealthLogs(
  userId: string,
  startDate: string,
  endDate: string,
  limit = 100
): Promise<MentalHealthLog[]> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('mental_health_logs')
    .select('*')
    .eq('clerk_user_id', userId)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[MentalHealth] Get logs error:', error);
    return [];
  }

  return (data || []) as MentalHealthLog[];
}

/**
 * 최근 N일 체크인 조회
 */
export async function getRecentLogs(userId: string, days = 7): Promise<MentalHealthLog[]> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return getMentalHealthLogs(userId, startDate, endDate, days);
}

/**
 * 체크인 삭제
 */
export async function deleteMentalHealthLog(
  userId: string,
  logId: string
): Promise<boolean> {
  const supabase = createClerkSupabaseClient();

  const { error } = await supabase
    .from('mental_health_logs')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('id', logId);

  if (error) {
    console.error('[MentalHealth] Delete log error:', error);
    return false;
  }

  return true;
}

// =====================================================
// 통계 및 트렌드 함수
// =====================================================

/**
 * 기간별 트렌드 통계 계산
 */
export async function getMentalHealthTrend(
  userId: string,
  period: 'week' | 'month'
): Promise<MentalHealthTrend | null> {
  const now = new Date();
  const days = period === 'week' ? 7 : 30;
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const endDate = now.toISOString().split('T')[0];

  const logs = await getMentalHealthLogs(userId, startDate, endDate, days);

  if (logs.length === 0) {
    return null;
  }

  // 평균 계산 (null 값 제외)
  const moodScores = logs.filter((l) => l.mood_score !== null).map((l) => l.mood_score!);
  const stressLevels = logs.filter((l) => l.stress_level !== null).map((l) => l.stress_level!);
  const sleepHours = logs.filter((l) => l.sleep_hours !== null).map((l) => l.sleep_hours!);
  const sleepQualities = logs.filter((l) => l.sleep_quality !== null).map((l) => l.sleep_quality!);
  const energyLevels = logs.filter((l) => l.energy_level !== null).map((l) => l.energy_level!);

  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  return {
    period,
    avgMoodScore: Number(avg(moodScores).toFixed(1)),
    avgStressLevel: Number(avg(stressLevels).toFixed(1)),
    avgSleepHours: Number(avg(sleepHours).toFixed(1)),
    avgSleepQuality: Number(avg(sleepQualities).toFixed(1)),
    avgEnergyLevel: Number(avg(energyLevels).toFixed(1)),
    totalLogs: logs.length,
    startDate,
    endDate,
  };
}

/**
 * 오늘의 요약 조회 (체크인 여부, 연속 체크인 일수)
 */
export async function getTodaySummary(userId: string): Promise<TodaySummary> {
  const todayLog = await getTodayCheckin(userId);

  // 연속 체크인 일수 계산
  let streak = 0;
  if (todayLog) {
    streak = 1;
    const logs = await getRecentLogs(userId, 30);

    // 오늘부터 역순으로 연속 체크인 확인
    const today = new Date();
    for (let i = 1; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const hasLog = logs.some((l) => l.log_date === checkDate);
      if (hasLog) {
        streak++;
      } else {
        break;
      }
    }
  }

  return {
    hasCheckin: !!todayLog,
    log: todayLog,
    streak,
  };
}

// =====================================================
// 유틸리티 함수
// =====================================================

/** 기분 점수 이모지 */
export const MOOD_EMOJIS: Record<MoodScore, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😊',
};

/** 기분 점수 라벨 */
export const MOOD_LABELS: Record<MoodScore, string> = {
  1: '매우 안좋음',
  2: '안좋음',
  3: '보통',
  4: '좋음',
  5: '매우 좋음',
};

/** 에너지 레벨 이모지 */
export const ENERGY_EMOJIS: Record<EnergyLevel, string> = {
  1: '🪫',
  2: '🔋',
  3: '⚡',
  4: '💪',
  5: '🔥',
};

/** 수면 품질 라벨 */
export const SLEEP_QUALITY_LABELS: Record<SleepQuality, string> = {
  1: '매우 나쁨',
  2: '나쁨',
  3: '보통',
  4: '좋음',
  5: '매우 좋음',
};
