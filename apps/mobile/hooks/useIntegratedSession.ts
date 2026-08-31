/**
 * 통합 분석 세션 조회 훅 (재방문/북마크 지원)
 *
 * @module hooks/useIntegratedSession
 * @description
 *   Supabase `integrated_analysis_sessions` + 5축 테이블을 조회하여
 *   결과 페이지 재방문 시 데이터를 복원. RLS로 본인 세션만 접근 가능.
 *
 * @see docs/adr/ADR-102-mobile-integrated-porting.md (Phase D.2)
 * @see docs/specs/SDD-MOBILE-INTEGRATED.md
 */

import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import {
  RECOMMENDATION_GENDERS,
  type AxisCode,
  type IntegratedAnalysisResult,
  type AxisResult,
  type AxisData,
  type PersonaProfile,
  type RecommendationGender,
} from '@/lib/api';
import { useClerkSupabaseClient } from '@/lib/supabase';

export interface UseIntegratedSessionResult {
  result: IntegratedAnalysisResult | null;
  isLoading: boolean;
  error: Error | null;
  stale: boolean;
  reload: () => void;
}

const CACHE_PREFIX = 'integrated-session:';

async function writeCache(sessionId: string, result: IntegratedAnalysisResult): Promise<void> {
  try {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${sessionId}`, JSON.stringify(result));
  } catch {
    /* 스토리지 용량 초과 등 — 캐시는 베스트 에포트 */
  }
}

async function readCache(sessionId: string): Promise<IntegratedAnalysisResult | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${sessionId}`);
    return raw ? (JSON.parse(raw) as IntegratedAnalysisResult) : null;
  } catch {
    return null;
  }
}

interface IntegratedSessionRow {
  id: string;
  clerk_user_id: string;
  status: 'pending' | 'partial' | 'completed' | 'failed';
  axes_completed: AxisCode[];
  axes_failed: AxisCode[];
  used_fallback: AxisCode[];
  persona: PersonaProfile | null;
  questionnaire?: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

/** 구형·손상 세션의 임의 문자열을 추천 분기로 흘리지 않고 중립으로 닫는다. */
function readRecommendationGender(
  questionnaire: Record<string, unknown> | null | undefined
): RecommendationGender {
  const value = questionnaire?.gender;
  return typeof value === 'string' && RECOMMENDATION_GENDERS.includes(value as RecommendationGender)
    ? (value as RecommendationGender)
    : 'neutral';
}

/** DB 레코드를 AxisResult로 변환 */
function toAxisResult(
  record: Record<string, unknown> | null,
  axis: AxisCode,
  session: IntegratedSessionRow
): AxisResult<AxisData> {
  if (record) {
    return {
      success: true,
      data: record as AxisData,
      usedFallback: session.used_fallback.includes(axis),
    };
  }
  return {
    success: false,
    error: {
      code: 'MISSING',
      message: `No ${axis} record for session`,
      userMessage: '이 축의 분석 결과가 없어요.',
      retryable: true,
    },
  };
}

/**
 * sessionId로 통합 분석 결과를 Supabase에서 조회.
 * 재방문(POST payload 없음) 또는 북마크 액세스 시 사용.
 *
 * @param sessionId — integrated_analysis_sessions.id
 * @param initialResult — POST 직후 전달받은 결과가 있으면 네트워크 호출 생략
 */
export function useIntegratedSession(
  sessionId: string | null,
  initialResult: IntegratedAnalysisResult | null = null
): UseIntegratedSessionResult {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [result, setResult] = useState<IntegratedAnalysisResult | null>(initialResult);
  const [isLoading, setIsLoading] = useState<boolean>(initialResult === null && sessionId !== null);
  const [error, setError] = useState<Error | null>(null);
  const [stale, setStale] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    // 왜: 초기 payload가 있으면 네트워크 호출 불필요
    if (initialResult !== null) {
      setResult(initialResult);
      setIsLoading(false);
      setError(null);
      setStale(false);
      if (sessionId) void writeCache(sessionId, initialResult);
      return;
    }
    if (!sessionId) {
      setResult(null);
      setIsLoading(false);
      setStale(false);
      return;
    }
    if (!isLoaded) return;
    if (!isSignedIn) {
      setResult(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setStale(false);

    (async () => {
      try {
        // 세션 조회 (RLS로 권한 검증)
        const { data: sessionData, error: sessionError } = await supabase
          .from('integrated_analysis_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle();

        if (cancelled) return;
        if (sessionError) throw new Error(sessionError.message);
        if (!sessionData) {
          setResult(null);
          setIsLoading(false);
          return;
        }

        const session = sessionData as IntegratedSessionRow;

        // 5축 결과 병렬 조회
        const [pcRes, skinRes, bodyRes, hairRes, makeupRes] = await Promise.all([
          supabase
            .from('personal_color_assessments')
            .select('*')
            .eq('session_id', sessionId)
            .maybeSingle(),
          supabase.from('skin_analyses').select('*').eq('session_id', sessionId).maybeSingle(),
          supabase.from('body_analyses').select('*').eq('session_id', sessionId).maybeSingle(),
          supabase.from('hair_analyses').select('*').eq('session_id', sessionId).maybeSingle(),
          supabase.from('makeup_analyses').select('*').eq('session_id', sessionId).maybeSingle(),
        ]);

        if (cancelled) return;

        const axisError = [pcRes, skinRes, bodyRes, hairRes, makeupRes].find(
          (response) => response.error
        )?.error;
        if (axisError) throw new Error(axisError.message);

        const assembled: IntegratedAnalysisResult = {
          sessionId: session.id,
          status:
            session.status === 'pending' || session.status === 'failed' ? 'failed' : session.status,
          axes: {
            personalColor: toAxisResult(
              (pcRes.data as Record<string, unknown> | null) ?? null,
              'personal_color',
              session
            ),
            skin: toAxisResult(
              (skinRes.data as Record<string, unknown> | null) ?? null,
              'skin',
              session
            ),
            body: toAxisResult(
              (bodyRes.data as Record<string, unknown> | null) ?? null,
              'body',
              session
            ),
            hair: toAxisResult(
              (hairRes.data as Record<string, unknown> | null) ?? null,
              'hair',
              session
            ),
            makeup: toAxisResult(
              (makeupRes.data as Record<string, unknown> | null) ?? null,
              'makeup',
              session
            ),
          },
          persona: session.persona ?? null,
          recommendationGender: readRecommendationGender(session.questionnaire),
          axesCompleted: session.axes_completed ?? [],
          axesFailed: session.axes_failed ?? [],
          usedFallback: session.used_fallback ?? [],
          createdAt: session.created_at,
          completedAt: session.completed_at ?? session.created_at,
        };

        await writeCache(sessionId, assembled);
        if (cancelled) return;
        setResult(assembled);
        setIsLoading(false);
      } catch (e) {
        if (cancelled) return;
        const normalizedError = e instanceof Error ? e : new Error(String(e));
        const cached = await readCache(sessionId);
        if (cancelled) return;
        setError(normalizedError);
        setResult(cached);
        setStale(cached !== null);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, initialResult, supabase, isLoaded, isSignedIn, reloadToken]);

  const reload = (): void => setReloadToken((n) => n + 1);

  return { result, isLoading, error, stale, reload };
}
