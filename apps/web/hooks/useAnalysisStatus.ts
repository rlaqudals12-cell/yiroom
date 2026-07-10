'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { computeSkinTrend } from '@yiroom/shared';
import { getBodyShapeLabel } from '@/lib/body';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

// computeSkinTrend는 @yiroom/shared로 승격 (웹·앱 공유 — ADR-109 Phase 4A).
// 하위 호환: 기존 '@/hooks/useAnalysisStatus' import 경로 유지용 re-export.
export { computeSkinTrend } from '@yiroom/shared';

// 캐시 TTL: 5분 (밀리초)
const CACHE_TTL = 5 * 60 * 1000;

// 글로벌 캐시 (컴포넌트 간 공유)
interface CacheEntry {
  data: AnalysisSummary[];
  timestamp: number;
}
const analysisCache = new Map<string, CacheEntry>();

// 분석 완료 후 캐시 무효화 (홈 State 즉시 전환용)
// 소비처: 통합분석·개별 5축 분석의 완료 경로 — 완료 직후 호출해야 홈/[나] 탭이
// 5분 캐시로 이전 상태("분석 0개" 등)를 보여주지 않는다.
export function invalidateAnalysisCache(userId?: string): void {
  if (userId) {
    analysisCache.delete(userId);
  } else {
    analysisCache.clear();
  }
}

// 분석 타입 정의
export type AnalysisType = 'personal-color' | 'skin' | 'body' | 'hair' | 'makeup';

// 분석 요약 정보
export interface AnalysisSummary {
  id: string;
  type: AnalysisType;
  createdAt: Date;
  summary: string;
  // 타입별 추가 데이터
  seasonType?: string; // PC-1
  skinScore?: number; // S-1
  skinDelta?: number; // S-1 직전 분석 대비 점수 변화 (ADR-109 Phase 3 — "오늘의 컨디션" 추이)
  skinTrend?: 'up' | 'down' | 'flat'; // S-1 추이 방향
  bodyType?: string; // C-1
  hairScore?: number; // H-1
  hairType?: string; // H-1
  makeupScore?: number; // M-1
  undertone?: string; // M-1
  // PC-1 베스트 컬러(진단된 hex 팔레트) — 홈 브리핑/프로필 카드 시각화용 (V1 시각 자산 노출)
  bestColors?: Array<{ name: string; hex: string }>;
  // PC 퍼스널 대비(모발-피부 명도 실측, ADR-116) — 실측값이 있을 때만. 배색/브리핑 강도 조절용.
  contrastLevel?: 'low' | 'medium' | 'high';
}

// DB best_colors(JSONB 배열) 항목 하나를 {name,hex}로 정규화 (AI 원본 {name,hex}, 방어적으로 color 폴백)
function normalizeColorItem(c: unknown): { name: string; hex: string } | null {
  if (typeof c !== 'object' || c === null) return null;
  const item = c as { name?: unknown; hex?: unknown; color?: unknown };
  let hex: string | null = null;
  if (typeof item.hex === 'string') hex = item.hex;
  else if (typeof item.color === 'string') hex = item.color;
  if (!hex) return null;
  return { name: typeof item.name === 'string' ? item.name : '', hex };
}

// DB best_colors 배열을 유효한 {name,hex}만 정규화
function normalizeBestColors(raw: unknown): Array<{ name: string; hex: string }> {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeColorItem).filter((c): c is { name: string; hex: string } => c !== null);
}

// image_analysis JSONB에서 실측 대비 레벨만 안전 추출 (없거나 무효면 undefined — 추측 없음)
function extractContrastLevel(raw: unknown): 'low' | 'medium' | 'high' | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const value = (raw as { contrastLevel?: unknown }).contrastLevel;
  return value === 'low' || value === 'medium' || value === 'high' ? value : undefined;
}

// PC 분석 요약 조립 — best_colors 정규화 포함 (fetchAnalyses 복잡도 분리)
function buildPersonalColorSummary(row: {
  id: string;
  season: string;
  created_at: string;
  best_colors: unknown;
  image_analysis?: unknown;
}): AnalysisSummary {
  const bestColors = normalizeBestColors(row.best_colors);
  const contrastLevel = extractContrastLevel(row.image_analysis);
  return {
    id: row.id,
    type: 'personal-color',
    createdAt: new Date(row.created_at),
    summary: getSeasonLabel(row.season),
    seasonType: row.season,
    ...(bestColors.length > 0 ? { bestColors } : {}),
    ...(contrastLevel ? { contrastLevel } : {}),
  };
}

// 5축 병렬 조회 결과에서 첫 쿼리 오류를 찾는다 — postgrest는 실패 시 throw 대신
// { data: null, error }를 반환하므로 catch로는 감지되지 않는다.
function firstQueryError(results: Array<{ error: unknown }>): unknown {
  return results.find((r) => r.error)?.error ?? null;
}

// 5축 조회 행 타입 (select 필드와 1:1)
interface SkinRow {
  id: string;
  overall_score: number;
  created_at: string;
}
interface BodyRow {
  id: string;
  body_type: string;
  created_at: string;
}
interface HairRow {
  id: string;
  hair_type: string;
  overall_score: number;
  created_at: string;
}
interface MakeupRow {
  id: string;
  undertone: string;
  overall_score: number;
  created_at: string;
}

// 5축 조회 결과 → AnalysisSummary 배열 조립 (순수 함수 — fetchAnalyses 복잡도 분리)
function buildAnalysisSummaries(queries: {
  pcResult: { data: Parameters<typeof buildPersonalColorSummary>[0][] | null };
  skinResult: { data: SkinRow[] | null };
  bodyResult: { data: BodyRow[] | null };
  hairResult: { data: HairRow[] | null };
  makeupResult: { data: MakeupRow[] | null };
}): AnalysisSummary[] {
  const { pcResult, skinResult, bodyResult, hairResult, makeupResult } = queries;
  const results: AnalysisSummary[] = [];

  // 퍼스널 컬러
  if (pcResult.data && pcResult.data.length > 0) {
    results.push(buildPersonalColorSummary(pcResult.data[0]));
  }

  // 피부 분석 (직전 대비 추이 포함 — "오늘의 컨디션")
  if (skinResult.data && skinResult.data.length > 0) {
    const latestScore = skinResult.data[0].overall_score;
    const trend =
      skinResult.data.length > 1
        ? computeSkinTrend(latestScore, skinResult.data[1].overall_score)
        : null;
    results.push({
      id: skinResult.data[0].id,
      type: 'skin',
      createdAt: new Date(skinResult.data[0].created_at),
      summary: `${latestScore}점`,
      skinScore: latestScore,
      ...(trend ? { skinDelta: trend.delta, skinTrend: trend.trend } : {}),
    });
  }

  // 체형 분석
  if (bodyResult.data && bodyResult.data.length > 0) {
    results.push({
      id: bodyResult.data[0].id,
      type: 'body',
      createdAt: new Date(bodyResult.data[0].created_at),
      summary: getBodyTypeLabel(bodyResult.data[0].body_type),
      bodyType: bodyResult.data[0].body_type,
    });
  }

  // 헤어 분석
  if (hairResult.data && hairResult.data.length > 0) {
    results.push({
      id: hairResult.data[0].id,
      type: 'hair',
      createdAt: new Date(hairResult.data[0].created_at),
      summary: `${getHairTypeLabel(hairResult.data[0].hair_type)} · ${hairResult.data[0].overall_score}점`,
      hairScore: hairResult.data[0].overall_score,
      hairType: hairResult.data[0].hair_type,
    });
  }

  // 메이크업 분석
  if (makeupResult.data && makeupResult.data.length > 0) {
    results.push({
      id: makeupResult.data[0].id,
      type: 'makeup',
      createdAt: new Date(makeupResult.data[0].created_at),
      summary: `${getUndertoneLabel(makeupResult.data[0].undertone)} · ${makeupResult.data[0].overall_score}점`,
      makeupScore: makeupResult.data[0].overall_score,
      undertone: makeupResult.data[0].undertone,
    });
  }

  return results;
}

// 분석 상태 반환 타입
export interface AnalysisStatus {
  isLoading: boolean;
  hasError: boolean; // 분석 상태 조회 실패 여부
  analyses: AnalysisSummary[];
  analysisCount: number;
  hasPersonalColor: boolean;
  hasSkin: boolean;
  hasBody: boolean;
  hasHair: boolean;
  hasMakeup: boolean;
  // 상태 판단 헬퍼
  isNewUser: boolean; // 분석 0개
  isGrowingUser: boolean; // 분석 1-3개
  isActiveUser: boolean; // 분석 4개 이상
  // 재시도
  refetch: () => void;
}

// 헬퍼 함수들
function getSeasonLabel(season: string): string {
  const labels: Record<string, string> = {
    Spring: '봄 웜톤',
    Summer: '여름 쿨톤',
    Autumn: '가을 웜톤',
    Winter: '겨울 쿨톤',
    spring: '봄 웜톤',
    summer: '여름 쿨톤',
    autumn: '가을 웜톤',
    winter: '겨울 쿨톤',
  };
  return labels[season] || '기타';
}

// 체형 라벨은 lib/body 공용 헬퍼로 일원화 (S/W/N 골격 + body-v2 5형 + 레거시).
// 초보자는 "웨이브"가 골격 용어인 걸 모르므로 짧은 풀이를 병기한다.
const BODY_TYPE_DESC: Record<string, string> = {
  스트레이트: '직선형',
  웨이브: '곡선형',
  내추럴: '골격형',
};

function getBodyTypeLabel(bodyType: string): string {
  const label = getBodyShapeLabel(bodyType);
  const desc = BODY_TYPE_DESC[label];
  return desc ? `${label} · ${desc}` : label;
}

function getHairTypeLabel(hairType: string): string {
  const labels: Record<string, string> = {
    straight: '직모',
    wavy: '웨이브',
    curly: '곱슬',
    coily: '강한 곱슬',
  };
  return labels[hairType] || '기타';
}

function getUndertoneLabel(undertone: string): string {
  const labels: Record<string, string> = {
    warm: '웜톤',
    cool: '쿨톤',
    neutral: '뉴트럴',
  };
  return labels[undertone] || '기타';
}

/**
 * 사용자의 분석 완료 상태를 조회하는 훅
 * - 각 분석 타입별 완료 여부
 * - 분석 요약 정보
 * - 사용자 상태 판단 (신규/부분/활성)
 * - 5분 캐싱으로 불필요한 API 호출 방지
 */
export function useAnalysisStatus(): AnalysisStatus {
  const { user, isLoaded: isUserLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // refetch가 실제 재조회를 트리거하는 키 — fetch는 useEffect 안에만 있으므로
  // 캐시 삭제만으로는 재조회가 일어나지 않는다(영구 스켈레톤 방지).
  const [reloadKey, setReloadKey] = useState(0);
  const fetchingRef = useRef(false);

  // 캐시 유효성 검사
  const getCachedData = useCallback((userId: string): AnalysisSummary[] | null => {
    const cached = analysisCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  }, []);

  // 캐시 저장
  const setCachedData = useCallback((userId: string, data: AnalysisSummary[]) => {
    analysisCache.set(userId, { data, timestamp: Date.now() });
  }, []);

  useEffect(() => {
    async function fetchAnalyses() {
      if (!user?.id || fetchingRef.current) {
        if (!user?.id) setIsLoading(false);
        return;
      }

      // 캐시 확인
      const cachedData = getCachedData(user.id);
      if (cachedData) {
        setAnalyses(cachedData);
        setIsLoading(false);
        return;
      }

      fetchingRef.current = true;
      setHasError(false);

      try {
        // 병렬로 모든 분석 결과 조회
        const [pcResult, skinResult, bodyResult, hairResult, makeupResult] = await Promise.all([
          supabase
            .from('personal_color_assessments')
            .select('id, season, created_at, best_colors, image_analysis')
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('skin_analyses')
            .select('id, overall_score, created_at')
            .order('created_at', { ascending: false })
            .limit(2), // 추이(직전 대비)용 2건 — ADR-109 Phase 3
          supabase
            .from('body_analyses')
            .select('id, body_type, created_at')
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('hair_analyses')
            .select('id, hair_type, overall_score, created_at')
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('makeup_analyses')
            .select('id, undertone, overall_score, created_at')
            .order('created_at', { ascending: false })
            .limit(1),
        ]);

        // 오류를 "분석 0개"로 위장하지 않는다 — 각 쿼리의 error를 직접 검사.
        // 오류 시: 캐시 기록 금지 + hasError로 정직한 오류 상태(홈 에러 UI + 재시도).
        const queryError = firstQueryError([
          pcResult,
          skinResult,
          bodyResult,
          hairResult,
          makeupResult,
        ]);
        if (queryError) {
          console.error('[useAnalysisStatus] Failed to fetch analyses:', queryError);
          setHasError(true);
          return;
        }

        const results = buildAnalysisSummaries({
          pcResult,
          skinResult,
          bodyResult,
          hairResult,
          makeupResult,
        });

        // 캐시 저장 (성공 시에만 — 오류는 위에서 return하므로 캐시에 기록되지 않는다)
        setCachedData(user.id, results);
        setAnalyses(results);
      } catch (error) {
        console.error('[useAnalysisStatus] Failed to fetch analyses:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    }

    if (isUserLoaded) {
      fetchAnalyses();
    }
    // reloadKey: refetch()가 캐시 삭제 후 실제 재조회를 트리거하기 위한 deps
  }, [user?.id, isUserLoaded, supabase, getCachedData, setCachedData, reloadKey]);

  // 페이지 포커스 복귀 시 캐시 무효화 (분석 완료 후 홈 복귀 대응)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && user?.id) {
        const cached = analysisCache.get(user.id);
        if (cached && Date.now() - cached.timestamp > 30 * 1000) {
          analysisCache.delete(user.id);
          fetchingRef.current = false;
          // 캐시 삭제만으로는 마운트된 컴포넌트가 갱신되지 않음 — 실제 재조회 트리거
          setReloadKey((k) => k + 1);
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  // 재시도 함수 — 캐시 삭제 + reloadKey 증가로 useEffect가 실제 재조회를 수행
  const refetch = useCallback(() => {
    if (user?.id) {
      analysisCache.delete(user.id);
      fetchingRef.current = false;
      setIsLoading(true);
      setHasError(false);
      setReloadKey((k) => k + 1);
    }
  }, [user?.id]);

  // 각 분석 타입 존재 여부
  const hasPersonalColor = analyses.some((a) => a.type === 'personal-color');
  const hasSkin = analyses.some((a) => a.type === 'skin');
  const hasBody = analyses.some((a) => a.type === 'body');
  const hasHair = analyses.some((a) => a.type === 'hair');
  const hasMakeup = analyses.some((a) => a.type === 'makeup');

  // 사용자 상태 판단
  const analysisCount = analyses.length;
  const isNewUser = analysisCount === 0;
  const isGrowingUser = analysisCount >= 1 && analysisCount <= 3;
  const isActiveUser = analysisCount >= 4;

  return {
    isLoading: !isUserLoaded || isLoading,
    hasError,
    analyses,
    analysisCount,
    hasPersonalColor,
    hasSkin,
    hasBody,
    hasHair,
    hasMakeup,
    isNewUser,
    isGrowingUser,
    isActiveUser,
    refetch,
  };
}
