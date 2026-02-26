/**
 * 피부 다이어리 CRUD + 월별 조회 훅
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/clerk-expo';

import { useClerkSupabaseClient } from '../lib/supabase';
import {
  type SkinDiaryEntry,
  type SkinDiaryInput,
  type SkinDiaryMonthlySummary,
  type DbSkinDiaryEntry,
  type TrendDirection,
  transformDbToEntry,
} from '../lib/skincare/diary-types';

interface UseSkinDiaryReturn {
  // 상태
  entries: SkinDiaryEntry[];
  loading: boolean;
  error: string | null;
  summary: SkinDiaryMonthlySummary | null;
  // 선택 월
  year: number;
  month: number;
  setMonth: (year: number, month: number) => void;
  // CRUD
  saveEntry: (input: SkinDiaryInput) => Promise<boolean>;
  deleteEntry: (entryId: string) => Promise<boolean>;
  // 기타
  getEntryForDate: (date: string) => SkinDiaryEntry | undefined;
  refresh: () => Promise<void>;
}

export function useSkinDiary(): UseSkinDiaryReturn {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonthState] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState<SkinDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clerkUserId = user?.id;

  // 월별 엔트리 로드
  const loadEntries = useCallback(async (): Promise<void> => {
    if (!clerkUserId) return;
    setLoading(true);
    setError(null);

    try {
      // 해당 월의 시작/끝 날짜
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const { data, error: dbError } = await supabase
        .from('skin_diary_entries')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: false });

      if (dbError) {
        console.warn('[SkinDiary] 조회 실패:', dbError.message);
        setError('다이어리를 불러올 수 없어요.');
        setEntries([]);
        return;
      }

      const rows = (data ?? []) as unknown as DbSkinDiaryEntry[];
      setEntries(rows.map(transformDbToEntry));
    } catch {
      setError('다이어리를 불러올 수 없어요.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [clerkUserId, supabase, year, month]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // 월 변경
  const setMonth = useCallback((newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonthState(newMonth);
  }, []);

  // 엔트리 저장 (upsert)
  const saveEntry = useCallback(async (input: SkinDiaryInput): Promise<boolean> => {
    if (!clerkUserId) return false;

    try {
      const dbData = {
        clerk_user_id: clerkUserId,
        entry_date: input.entryDate,
        skin_condition: input.skinCondition,
        condition_notes: input.conditionNotes ?? null,
        sleep_hours: input.sleepHours ?? null,
        sleep_quality: input.sleepQuality ?? null,
        water_intake_ml: input.waterIntakeMl ?? null,
        stress_level: input.stressLevel ?? null,
        weather: input.weather ?? null,
        morning_routine_completed: input.morningRoutineCompleted,
        evening_routine_completed: input.eveningRoutineCompleted,
      };

      const { error: upsertError } = await supabase
        .from('skin_diary_entries')
        .upsert(dbData, { onConflict: 'clerk_user_id,entry_date' });

      if (upsertError) {
        console.warn('[SkinDiary] 저장 실패:', upsertError.message);
        return false;
      }

      await loadEntries();
      return true;
    } catch {
      return false;
    }
  }, [clerkUserId, supabase, loadEntries]);

  // 삭제
  const deleteEntry = useCallback(async (entryId: string): Promise<boolean> => {
    if (!clerkUserId) return false;

    try {
      const { error: delError } = await supabase
        .from('skin_diary_entries')
        .delete()
        .eq('id', entryId)
        .eq('clerk_user_id', clerkUserId);

      if (delError) {
        console.warn('[SkinDiary] 삭제 실패:', delError.message);
        return false;
      }

      await loadEntries();
      return true;
    } catch {
      return false;
    }
  }, [clerkUserId, supabase, loadEntries]);

  // 날짜별 엔트리 조회
  const getEntryForDate = useCallback(
    (date: string): SkinDiaryEntry | undefined =>
      entries.find((e) => e.entryDate === date),
    [entries],
  );

  // 월간 요약
  const summary = useMemo((): SkinDiaryMonthlySummary | null => {
    if (entries.length === 0) return null;

    const total = entries.length;
    const avgCondition =
      entries.reduce((sum, e) => sum + e.skinCondition, 0) / total;

    const morningCount = entries.filter((e) => e.morningRoutineCompleted).length;
    const eveningCount = entries.filter((e) => e.eveningRoutineCompleted).length;

    // 트렌드: 최근 7개 vs 이전 7개 평균 비교
    const sorted = [...entries].sort(
      (a, b) => a.entryDate.localeCompare(b.entryDate),
    );
    let trend: TrendDirection = 'stable';
    if (sorted.length >= 4) {
      const mid = Math.floor(sorted.length / 2);
      const firstHalf =
        sorted.slice(0, mid).reduce((s, e) => s + e.skinCondition, 0) / mid;
      const secondHalf =
        sorted
          .slice(mid)
          .reduce((s, e) => s + e.skinCondition, 0) /
        (sorted.length - mid);
      const diff = secondHalf - firstHalf;
      if (diff > 0.3) trend = 'improving';
      else if (diff < -0.3) trend = 'declining';
    }

    return {
      totalEntries: total,
      avgCondition: Math.round(avgCondition * 10) / 10,
      routineRate: {
        morning: Math.round((morningCount / total) * 100),
        evening: Math.round((eveningCount / total) * 100),
      },
      trend,
    };
  }, [entries]);

  return {
    entries,
    loading,
    error,
    summary,
    year,
    month,
    setMonth,
    saveEntry,
    deleteEntry,
    getEntryForDate,
    refresh: loadEntries,
  };
}
