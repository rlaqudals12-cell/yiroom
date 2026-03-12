/**
 * 피부 일기 Repository
 * @module lib/skin-diary
 * @description skin_assessments 시계열 쿼리 + 메모 CRUD
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  DiaryEntry,
  DiaryNote,
  CalendarDay,
  CalendarMonth,
  ConditionEmoji,
  TrendPeriod,
} from './types';

// ============================================
// 기간 → 일수 매핑
// ============================================

const PERIOD_DAYS: Record<TrendPeriod, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

// ============================================
// 시계열 엔트리 조회
// ============================================

/**
 * skin_assessments에서 시계열 DiaryEntry 조회
 * @param supabase - Supabase 클라이언트
 * @param userId - clerk_user_id
 * @param period - 조회 기간
 */
export async function getDiaryEntries(
  supabase: SupabaseClient,
  userId: string,
  period: TrendPeriod
): Promise<DiaryEntry[]> {
  const days = PERIOD_DAYS[period];
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('skin_assessments')
    .select('id, created_at, scores, concerns, skin_type')
    .eq('clerk_user_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[SkinDiary] Failed to fetch entries:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // 동일 기간의 메모도 조회
  const notes = await getNotesByDateRange(supabase, userId, since, new Date());
  const noteMap = new Map(notes.map((n) => [n.date, n]));

  return data.map((row) => mapAssessmentToEntry(row, noteMap));
}

/**
 * skin_assessments 행 → DiaryEntry 변환
 */
function mapAssessmentToEntry(
  row: {
    id: string;
    created_at: string;
    scores: Record<string, unknown> | null;
    concerns: string[] | null;
    skin_type: string | null;
  },
  noteMap: Map<string, { conditionEmoji: string; text: string }>
): DiaryEntry {
  const date = row.created_at.split('T')[0];
  const scores = (row.scores ?? {}) as Record<string, unknown>;
  const breakdown = (scores.scoreBreakdown ?? {}) as Record<string, number>;

  const entry: DiaryEntry = {
    id: row.id,
    date,
    vitalityScore: (scores.vitalityScore as number) ?? 0,
    vitalityGrade: ((scores.vitalityGrade as string) ?? 'D') as DiaryEntry['vitalityGrade'],
    scoreBreakdown: {
      hydration: breakdown.hydration ?? 0,
      elasticity: breakdown.elasticity ?? 0,
      clarity: breakdown.clarity ?? 0,
      tone: breakdown.tone ?? 0,
    },
    primaryConcerns: row.concerns ?? [],
    skinType: row.skin_type ?? 'unknown',
  };

  // 메모 매핑
  const note = noteMap.get(date);
  if (note) {
    entry.note = {
      conditionEmoji: note.conditionEmoji as ConditionEmoji,
      text: note.text,
    };
  }

  return entry;
}

// ============================================
// 캘린더 데이터 생성
// ============================================

/**
 * 월간 캘린더 데이터 생성
 */
export async function getCalendarMonth(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number
): Promise<CalendarMonth> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // 월의 마지막 날

  // 해당 월의 분석 결과 조회
  const { data: assessments, error: assessmentError } = await supabase
    .from('skin_assessments')
    .select('created_at, scores')
    .eq('clerk_user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', new Date(year, month, 0, 23, 59, 59).toISOString())
    .order('created_at', { ascending: true });

  if (assessmentError) {
    console.error('[SkinDiary] Failed to fetch calendar assessments:', assessmentError);
  }

  // 해당 월의 메모 조회
  const notes = await getNotesByDateRange(supabase, userId, startDate, endDate);
  const noteMap = new Map(notes.map((n) => [n.date, n.conditionEmoji]));

  // 분석 결과를 날짜별로 매핑
  const assessmentMap = new Map<string, string>();
  let totalScore = 0;
  let scoreCount = 0;

  for (const a of assessments ?? []) {
    const date = a.created_at.split('T')[0];
    const scores = (a.scores ?? {}) as Record<string, unknown>;
    const grade = (scores.vitalityGrade as string) ?? 'D';
    assessmentMap.set(date, grade);

    const score = (scores.vitalityScore as number) ?? 0;
    totalScore += score;
    scoreCount++;
  }

  // 캘린더 일 배열 생성
  const today = new Date().toISOString().split('T')[0];
  const daysInMonth = endDate.getDate();
  const days: CalendarDay[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      date: dateStr,
      hasAssessment: assessmentMap.has(dateStr),
      vitalityGrade: assessmentMap.get(dateStr) as CalendarDay['vitalityGrade'],
      conditionEmoji: noteMap.get(dateStr),
      isToday: dateStr === today,
    });
  }

  return {
    year,
    month,
    days,
    assessmentCount: assessmentMap.size,
    averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
  };
}

// ============================================
// 메모 CRUD
// ============================================

/**
 * 날짜 범위의 메모 조회
 */
async function getNotesByDateRange(
  supabase: SupabaseClient,
  userId: string,
  start: Date,
  end: Date
): Promise<Array<{ date: string; conditionEmoji: string; text: string }>> {
  const startDate = start.toISOString().split('T')[0];
  const endDate = end.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('skin_diary_notes')
    .select('date, condition_emoji, note')
    .eq('clerk_user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    // 테이블이 아직 없을 수 있음 (마이그레이션 전)
    console.warn('[SkinDiary] Notes query failed (table may not exist):', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    date: row.date,
    conditionEmoji: row.condition_emoji ?? '😐',
    text: row.note ?? '',
  }));
}

/**
 * 메모 저장 (upsert: 하루 1개)
 */
export async function saveDiaryNote(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  note: DiaryNote
): Promise<{ success: boolean; error?: string }> {
  // 유효성 검증
  if (note.text.length > 200) {
    return { success: false, error: '메모는 200자까지 입력할 수 있어요' };
  }

  const { error } = await supabase.from('skin_diary_notes').upsert(
    {
      clerk_user_id: userId,
      date,
      condition_emoji: note.conditionEmoji,
      note: note.text,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'clerk_user_id,date' }
  );

  if (error) {
    console.error('[SkinDiary] Failed to save note:', error);
    return { success: false, error: '메모 저장에 실패했어요' };
  }

  return { success: true };
}

/**
 * 메모 삭제
 */
export async function deleteDiaryNote(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('skin_diary_notes')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('date', date);

  if (error) {
    console.error('[SkinDiary] Failed to delete note:', error);
    return { success: false };
  }

  return { success: true };
}
