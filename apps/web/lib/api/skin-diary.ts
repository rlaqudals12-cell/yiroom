/**
 * 피부 일기 Repository
 * @description 피부 Phase C: CRUD 작업 및 데이터 변환
 * @version 1.0
 * @date 2026-01-10
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type {
  SkinDiaryEntry,
  DbSkinDiaryEntry,
  SkinDiaryEntryInput,
  MonthlyReport,
  CorrelationInsight,
  WeeklyAverage,
  TrendDirection,
  SkinConditionScore,
} from '@/types/skin-diary';
import { analyzeCorrelations } from '@/lib/skincare/correlation';

// ================================================
// 타입 변환 함수
// ================================================

/**
 * DB 엔트리 → 앱 엔트리 변환
 */
function transformDbToEntry(dbEntry: DbSkinDiaryEntry): SkinDiaryEntry {
  return {
    id: dbEntry.id,
    clerkUserId: dbEntry.clerk_user_id,
    entryDate: new Date(dbEntry.entry_date),
    skinCondition: dbEntry.skin_condition as SkinConditionScore,
    conditionNotes: dbEntry.condition_notes ?? undefined,
    sleepHours: dbEntry.sleep_hours ?? undefined,
    sleepQuality: dbEntry.sleep_quality as SkinDiaryEntry['sleepQuality'],
    waterIntakeMl: dbEntry.water_intake_ml ?? undefined,
    stressLevel: dbEntry.stress_level as SkinDiaryEntry['stressLevel'],
    weather: dbEntry.weather as SkinDiaryEntry['weather'],
    outdoorHours: dbEntry.outdoor_hours ?? undefined,
    morningRoutineCompleted: dbEntry.morning_routine_completed,
    eveningRoutineCompleted: dbEntry.evening_routine_completed,
    specialTreatments: dbEntry.special_treatments ?? [],
    aiCorrelationScore: dbEntry.ai_correlation_score ?? undefined,
    aiInsights: dbEntry.ai_insights ?? undefined,
    createdAt: new Date(dbEntry.created_at),
    updatedAt: new Date(dbEntry.updated_at),
  };
}

/**
 * 앱 입력 → DB 입력 변환
 */
function transformInputToDb(
  input: SkinDiaryEntryInput,
  clerkUserId: string
): Omit<
  DbSkinDiaryEntry,
  'id' | 'created_at' | 'updated_at' | 'ai_correlation_score' | 'ai_insights'
> {
  return {
    clerk_user_id: clerkUserId,
    entry_date: input.entryDate.toISOString().split('T')[0],
    skin_condition: input.skinCondition,
    condition_notes: input.conditionNotes ?? null,
    sleep_hours: input.sleepHours ?? null,
    sleep_quality: input.sleepQuality ?? null,
    water_intake_ml: input.waterIntakeMl ?? null,
    stress_level: input.stressLevel ?? null,
    weather: input.weather ?? null,
    outdoor_hours: input.outdoorHours ?? null,
    morning_routine_completed: input.morningRoutineCompleted ?? false,
    evening_routine_completed: input.eveningRoutineCompleted ?? false,
    special_treatments: input.specialTreatments ?? null,
  };
}

// ================================================
// CRUD 함수
// ================================================

/**
 * 피부 일기 엔트리 생성
 */
export async function createEntry(
  clerkUserId: string,
  input: SkinDiaryEntryInput
): Promise<SkinDiaryEntry | null> {
  const supabase = createClerkSupabaseClient();

  const dbInput = transformInputToDb(input, clerkUserId);

  const { data, error } = await supabase
    .from('skin_diary_entries')
    .insert(dbInput)
    .select()
    .single();

  if (error) {
    console.error('[SkinDiary] Error creating entry:', error);
    return null;
  }

  return transformDbToEntry(data as DbSkinDiaryEntry);
}

/**
 * 특정 날짜의 피부 일기 엔트리 조회
 */
export async function getEntry(clerkUserId: string, date: Date): Promise<SkinDiaryEntry | null> {
  const supabase = createClerkSupabaseClient();

  const dateStr = date.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('skin_diary_entries')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq('entry_date', dateStr)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 엔트리 없음
      return null;
    }
    console.error('[SkinDiary] Error fetching entry:', error);
    return null;
  }

  return transformDbToEntry(data as DbSkinDiaryEntry);
}

/**
 * 피부 일기 엔트리 업데이트
 */
export async function updateEntry(
  clerkUserId: string,
  entryId: string,
  input: Partial<SkinDiaryEntryInput>
): Promise<SkinDiaryEntry | null> {
  const supabase = createClerkSupabaseClient();

  // 입력 데이터 변환
  const updateData: Record<string, unknown> = {};
  if (input.skinCondition !== undefined) updateData.skin_condition = input.skinCondition;
  if (input.conditionNotes !== undefined) updateData.condition_notes = input.conditionNotes;
  if (input.sleepHours !== undefined) updateData.sleep_hours = input.sleepHours;
  if (input.sleepQuality !== undefined) updateData.sleep_quality = input.sleepQuality;
  if (input.waterIntakeMl !== undefined) updateData.water_intake_ml = input.waterIntakeMl;
  if (input.stressLevel !== undefined) updateData.stress_level = input.stressLevel;
  if (input.weather !== undefined) updateData.weather = input.weather;
  if (input.outdoorHours !== undefined) updateData.outdoor_hours = input.outdoorHours;
  if (input.morningRoutineCompleted !== undefined)
    updateData.morning_routine_completed = input.morningRoutineCompleted;
  if (input.eveningRoutineCompleted !== undefined)
    updateData.evening_routine_completed = input.eveningRoutineCompleted;
  if (input.specialTreatments !== undefined)
    updateData.special_treatments = input.specialTreatments;

  const { data, error } = await supabase
    .from('skin_diary_entries')
    .update(updateData)
    .eq('id', entryId)
    .eq('clerk_user_id', clerkUserId)
    .select()
    .single();

  if (error) {
    console.error('[SkinDiary] Error updating entry:', error);
    return null;
  }

  return transformDbToEntry(data as DbSkinDiaryEntry);
}

/**
 * 피부 일기 엔트리 삭제
 */
export async function deleteEntry(clerkUserId: string, entryId: string): Promise<boolean> {
  const supabase = createClerkSupabaseClient();

  const { error } = await supabase
    .from('skin_diary_entries')
    .delete()
    .eq('id', entryId)
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('[SkinDiary] Error deleting entry:', error);
    return false;
  }

  return true;
}

/**
 * 월별 피부 일기 엔트리 조회
 */
export async function getEntriesByMonth(
  clerkUserId: string,
  year: number,
  month: number
): Promise<SkinDiaryEntry[]> {
  const supabase = createClerkSupabaseClient();

  // 해당 월의 시작일과 종료일 계산
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('skin_diary_entries')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .gte('entry_date', startDateStr)
    .lte('entry_date', endDateStr)
    .order('entry_date', { ascending: true });

  if (error) {
    console.error('[SkinDiary] Error fetching monthly entries:', error);
    return [];
  }

  return (data as DbSkinDiaryEntry[]).map(transformDbToEntry);
}

/**
 * 기간별 피부 일기 엔트리 조회
 */
export async function getEntriesByPeriod(
  clerkUserId: string,
  startDate: Date,
  endDate: Date
): Promise<SkinDiaryEntry[]> {
  const supabase = createClerkSupabaseClient();

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('skin_diary_entries')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .gte('entry_date', startDateStr)
    .lte('entry_date', endDateStr)
    .order('entry_date', { ascending: true });

  if (error) {
    console.error('[SkinDiary] Error fetching entries by period:', error);
    return [];
  }

  return (data as DbSkinDiaryEntry[]).map(transformDbToEntry);
}

/**
 * 월간 리포트 생성
 */
export async function getMonthlyReport(
  clerkUserId: string,
  year: number,
  month: number
): Promise<MonthlyReport | null> {
  // 해당 월의 모든 엔트리 조회
  const entries = await getEntriesByMonth(clerkUserId, year, month);

  if (entries.length === 0) {
    return null;
  }

  // 평균 컨디션 계산
  const totalCondition = entries.reduce((sum, e) => sum + e.skinCondition, 0);
  const avgCondition = totalCondition / entries.length;

  // 최고/최저 컨디션 날짜 찾기
  let bestDay: Date | null = null;
  let worstDay: Date | null = null;
  let bestScore = 0;
  let worstScore = 6;

  for (const entry of entries) {
    if (entry.skinCondition > bestScore) {
      bestScore = entry.skinCondition;
      bestDay = entry.entryDate;
    }
    if (entry.skinCondition < worstScore) {
      worstScore = entry.skinCondition;
      worstDay = entry.entryDate;
    }
  }

  // 루틴 완료율 계산
  const morningCompletedCount = entries.filter((e) => e.morningRoutineCompleted).length;
  const eveningCompletedCount = entries.filter((e) => e.eveningRoutineCompleted).length;

  const routineCompletionRate = {
    morning: Math.round((morningCompletedCount / entries.length) * 100),
    evening: Math.round((eveningCompletedCount / entries.length) * 100),
  };

  // 상관관계 분석 (7일 이상 데이터가 있을 때만)
  let topFactors: CorrelationInsight[] = [];
  if (entries.length >= 7) {
    topFactors = analyzeCorrelations(entries, '30days').slice(0, 3);
  }

  // 주간 평균 계산
  const weeklyAverages = calculateWeeklyAverages(entries);

  // 트렌드 방향 결정
  const trendDirection = determineTrend(weeklyAverages);

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    totalEntries: entries.length,
    avgCondition: Math.round(avgCondition * 10) / 10,
    bestDay,
    worstDay,
    topFactors,
    routineCompletionRate,
    trendDirection,
    weeklyAverages,
  };
}

/**
 * 주간 평균 계산
 */
function calculateWeeklyAverages(entries: SkinDiaryEntry[]): WeeklyAverage[] {
  // 주별로 그룹화
  const weeklyMap = new Map<string, SkinDiaryEntry[]>();

  for (const entry of entries) {
    const weekStart = getWeekStart(entry.entryDate);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, []);
    }
    weeklyMap.get(weekKey)!.push(entry);
  }

  // 주간 평균 계산
  const weeklyAverages: WeeklyAverage[] = [];

  for (const [weekKey, weekEntries] of weeklyMap) {
    const totalCondition = weekEntries.reduce((sum, e) => sum + e.skinCondition, 0);
    const avgCondition = totalCondition / weekEntries.length;

    weeklyAverages.push({
      weekStart: new Date(weekKey),
      avgCondition: Math.round(avgCondition * 10) / 10,
      entriesCount: weekEntries.length,
    });
  }

  // 날짜순 정렬
  return weeklyAverages.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
}

/**
 * 주 시작일 계산 (월요일 기준)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 트렌드 방향 결정
 */
function determineTrend(weeklyAverages: WeeklyAverage[]): TrendDirection {
  if (weeklyAverages.length < 2) {
    return 'stable';
  }

  // 처음과 마지막 주 비교
  const firstWeek = weeklyAverages[0];
  const lastWeek = weeklyAverages[weeklyAverages.length - 1];

  const diff = lastWeek.avgCondition - firstWeek.avgCondition;

  if (diff > 0.3) {
    return 'improving';
  } else if (diff < -0.3) {
    return 'declining';
  }

  return 'stable';
}

/**
 * 루틴 완료 시 자동 기록 (Phase B 연동)
 */
export async function markRoutineCompleted(
  clerkUserId: string,
  timeOfDay: 'morning' | 'evening'
): Promise<SkinDiaryEntry | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 오늘 엔트리 확인
  const existingEntry = await getEntry(clerkUserId, today);

  if (existingEntry) {
    // 기존 엔트리 업데이트
    const updateData =
      timeOfDay === 'morning'
        ? { morningRoutineCompleted: true }
        : { eveningRoutineCompleted: true };

    return updateEntry(clerkUserId, existingEntry.id, updateData);
  } else {
    // 새 엔트리 생성 (컨디션은 기본값 3)
    const newEntry: SkinDiaryEntryInput = {
      entryDate: today,
      skinCondition: 3,
      morningRoutineCompleted: timeOfDay === 'morning',
      eveningRoutineCompleted: timeOfDay === 'evening',
    };

    return createEntry(clerkUserId, newEntry);
  }
}

/**
 * AI 인사이트 업데이트
 */
export async function updateAiInsights(
  clerkUserId: string,
  entryId: string,
  correlationScore: number,
  insights: CorrelationInsight[]
): Promise<boolean> {
  const supabase = createClerkSupabaseClient();

  const { error } = await supabase
    .from('skin_diary_entries')
    .update({
      ai_correlation_score: correlationScore,
      ai_insights: insights,
    })
    .eq('id', entryId)
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('[SkinDiary] Error updating AI insights:', error);
    return false;
  }

  return true;
}

/**
 * 최근 엔트리 조회
 */
export async function getRecentEntries(
  clerkUserId: string,
  days: number = 7
): Promise<SkinDiaryEntry[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return getEntriesByPeriod(clerkUserId, startDate, endDate);
}
