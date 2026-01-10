/**
 * 스킨케어 루틴 Hook
 * @description 웹과 동기화된 스킨케어 루틴 조회 및 생성
 * @version 1.0
 * @date 2026-01-11
 */

import { useAuth } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { useClerkSupabaseClient } from '@/lib/supabase';

import {
  formatDuration,
  calculateEstimatedTime,
  getSkinTypeLabel,
} from './mock';
import { generateRoutine } from './routine';
import type {
  SkinAnalysisData,
  SkinTypeId,
  SkinConcernId,
  TimeOfDay,
  RoutineStep,
} from './types';

// Hook 반환 타입
interface UseSkincareRoutineReturn {
  // 상태
  loading: boolean;
  error: string | null;
  skinData: SkinAnalysisData | null;

  // 루틴 데이터
  activeTime: TimeOfDay;
  morningSteps: RoutineStep[];
  eveningSteps: RoutineStep[];
  currentSteps: RoutineStep[];
  currentEstimatedTime: number;
  personalizationNote: string;

  // 유틸리티
  skinTypeLabel: string;
  timeLabel: string;
  formattedTime: string;

  // 액션
  setActiveTime: (time: TimeOfDay) => void;
  refresh: () => Promise<void>;
}

/**
 * 스킨케어 루틴 관리 Hook
 * 웹 앱과 동일한 DB(skin_analyses)에서 데이터를 가져와 루틴 생성
 */
export function useSkincareRoutine(): UseSkincareRoutineReturn {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();

  // 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skinData, setSkinData] = useState<SkinAnalysisData | null>(null);
  const [activeTime, setActiveTime] = useState<TimeOfDay>('morning');
  const [morningSteps, setMorningSteps] = useState<RoutineStep[]>([]);
  const [eveningSteps, setEveningSteps] = useState<RoutineStep[]>([]);
  const [personalizationNote, setPersonalizationNote] = useState('');

  // 피부 분석 데이터 가져오기
  const fetchSkinAnalysis = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('skin_analyses')
        .select('id, skin_type, concerns, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        // 분석 결과 없음 (PGRST116 = no rows)
        if (fetchError.code === 'PGRST116') {
          setError('피부 분석을 먼저 진행해주세요.');
          return;
        }
        throw fetchError;
      }

      // 타입 변환 및 저장
      const analysisData: SkinAnalysisData = {
        id: data.id,
        skin_type: (data.skin_type || 'normal') as SkinTypeId,
        concerns: (data.concerns || []) as SkinConcernId[],
        created_at: data.created_at,
      };

      setSkinData(analysisData);
    } catch (err) {
      console.error('[Skincare Routine] Error fetching skin analysis:', err);
      setError('피부 분석 데이터를 불러오는데 실패했어요.');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, supabase]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchSkinAnalysis();
  }, [fetchSkinAnalysis]);

  // 피부 데이터가 변경되면 루틴 생성
  useEffect(() => {
    if (!skinData) return;

    const skinType = skinData.skin_type || 'normal';
    const concerns = skinData.concerns || [];

    // 아침 루틴 생성
    const morningResult = generateRoutine({
      skinType,
      concerns,
      timeOfDay: 'morning',
      includeOptional: true,
    });

    // 저녁 루틴 생성
    const eveningResult = generateRoutine({
      skinType,
      concerns,
      timeOfDay: 'evening',
      includeOptional: true,
    });

    setMorningSteps(morningResult.routine);
    setEveningSteps(eveningResult.routine);
    setPersonalizationNote(morningResult.personalizationNote);
  }, [skinData]);

  // 현재 활성 루틴
  const currentSteps = useMemo(
    () => (activeTime === 'morning' ? morningSteps : eveningSteps),
    [activeTime, morningSteps, eveningSteps]
  );

  const currentEstimatedTime = useMemo(
    () => calculateEstimatedTime(currentSteps),
    [currentSteps]
  );

  // 유틸리티 값들
  const skinTypeLabel = useMemo(
    () => (skinData ? getSkinTypeLabel(skinData.skin_type) : ''),
    [skinData]
  );

  const timeLabel = useMemo(
    () => (activeTime === 'morning' ? '아침' : '저녁'),
    [activeTime]
  );

  const formattedTime = useMemo(
    () => formatDuration(currentEstimatedTime),
    [currentEstimatedTime]
  );

  // 새로고침 액션
  const refresh = useCallback(async () => {
    await fetchSkinAnalysis();
  }, [fetchSkinAnalysis]);

  return {
    // 상태
    loading,
    error,
    skinData,

    // 루틴 데이터
    activeTime,
    morningSteps,
    eveningSteps,
    currentSteps,
    currentEstimatedTime,
    personalizationNote,

    // 유틸리티
    skinTypeLabel,
    timeLabel,
    formattedTime,

    // 액션
    setActiveTime,
    refresh,
  };
}
