/**
 * 사용자 분석 결과 조회 Hook
 * PC-1/S-1/C-1 분석 결과를 가져옴
 */
import { useUser } from '@clerk/clerk-expo';
import { computeSkinTrend } from '@yiroom/shared';
import { useState, useEffect, useCallback } from 'react';

import { useClerkSupabaseClient } from '../lib/supabase';
import { analysisLogger } from '../lib/utils/logger';

// 분석 결과 타입
export interface AnalysisSummary {
  id: string;
  type: 'personal-color' | 'skin' | 'body' | 'hair' | 'makeup' | 'oral-health';
  createdAt: Date;
  summary: string;
  // 타입별 추가 데이터
  seasonType?: string;
  skinScore?: number;
  skinDelta?: number; // S-1 직전 대비 점수 변화 (ADR-109 Phase 3 — "오늘의 컨디션")
  skinTrend?: 'up' | 'down' | 'flat'; // S-1 추이 방향
  bodyType?: string;
  hairType?: string;
  hairScore?: number;
  makeupScore?: number; // M-1
  undertone?: string;
  oralHealthScore?: number;
}

export interface PersonalColorResult {
  id: string;
  season: string;
  tone: string;
  colorPalette: string[];
  createdAt: Date;
}

export interface SkinAnalysisResult {
  id: string;
  skinType: string;
  overallScore: number;
  concerns: string[];
  createdAt: Date;
}

export interface BodyAnalysisResult {
  id: string;
  bodyType: string;
  height: number;
  weight: number;
  // BMI는 prod에 별도 컬럼이 없어 height/weight에서 파생 — 둘 중 하나라도 없으면 undefined
  bmi?: number;
  createdAt: Date;
}

export interface HairAnalysisResult {
  id: string;
  hairType: string;
  overallScore: number;
  damageLevel: number;
  concerns: string[];
  createdAt: Date;
}

export interface MakeupAnalysisResult {
  id: string;
  // prod makeup_analyses 실재 컬럼 (과거 makeupStyle·colorRecommendations는 존재하지 않는 컬럼이었음)
  undertone: string;
  overallScore: number | null;
  faceShape: string;
  createdAt: Date;
}

interface UseUserAnalysesReturn {
  analyses: AnalysisSummary[];
  personalColor: PersonalColorResult | null;
  skinAnalysis: SkinAnalysisResult | null;
  bodyAnalysis: BodyAnalysisResult | null;
  hairAnalysis: HairAnalysisResult | null;
  makeupAnalysis: MakeupAnalysisResult | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUserAnalyses(): UseUserAnalysesReturn {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [personalColor, setPersonalColor] = useState<PersonalColorResult | null>(null);
  const [skinAnalysis, setSkinAnalysis] = useState<SkinAnalysisResult | null>(null);
  const [bodyAnalysis, setBodyAnalysis] = useState<BodyAnalysisResult | null>(null);
  const [hairAnalysis, setHairAnalysis] = useState<HairAnalysisResult | null>(null);
  const [makeupAnalysis, setMakeupAnalysis] = useState<MakeupAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalyses = useCallback(
    async (_signal?: AbortSignal) => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results: AnalysisSummary[] = [];

        // 퍼스널 컬러 분석 결과
        // 왜 maybeSingle: 0행(미분석)은 정상 상태 — single은 0행을 에러로 취급.
        // prod엔 tone·color_palette 컬럼이 없음(실재: undertone·best_colors) → 과거 select는
        // 존재하지 않는 컬럼을 요청해 쿼리가 런타임 에러로 죽고 홈 집계에서 통째로 누락됐다.
        const { data: pcData, error: pcError } = await supabase
          .from('personal_color_assessments')
          .select('id, season, undertone, best_colors, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pcData && !pcError) {
          const pc: PersonalColorResult = {
            id: pcData.id,
            season: pcData.season,
            // 톤(웜/쿨)은 실재 undertone 컬럼으로 대체
            tone: pcData.undertone || '',
            // 팔레트는 실재 best_colors(jsonb 배열)로 대체
            colorPalette: pcData.best_colors || [],
            createdAt: new Date(pcData.created_at),
          };
          setPersonalColor(pc);
          results.push({
            id: pc.id,
            type: 'personal-color',
            createdAt: pc.createdAt,
            summary: getSeasonLabel(pc.season),
            seasonType: pc.season,
          });
        }

        // 피부 분석 결과 (직전 대비 추이 포함 — "오늘의 컨디션", ADR-109 Phase 3)
        // prod skin_analyses엔 concerns 컬럼이 없음 → 고민은 recommendations.primaryConcerns(jsonb)에서 추출.
        const { data: skinRows, error: skinError } = await supabase
          .from('skin_analyses')
          .select('id, skin_type, overall_score, recommendations, created_at')
          .order('created_at', { ascending: false })
          .limit(2); // 추이(직전 대비)용 2건

        if (skinRows && skinRows.length > 0 && !skinError) {
          const latest = skinRows[0];
          const skin: SkinAnalysisResult = {
            id: latest.id,
            skinType: latest.skin_type,
            overallScore: latest.overall_score,
            concerns: extractConcerns(latest.recommendations),
            createdAt: new Date(latest.created_at),
          };
          setSkinAnalysis(skin);
          // 추이는 두 점수가 모두 유효한 숫자일 때만 (점수 미저장 방어)
          const prevScore = skinRows.length > 1 ? skinRows[1].overall_score : null;
          const trend =
            isFiniteScore(latest.overall_score) && isFiniteScore(prevScore)
              ? computeSkinTrend(latest.overall_score, prevScore)
              : null;
          results.push({
            id: skin.id,
            type: 'skin',
            createdAt: skin.createdAt,
            // 점수가 없으면 "null점"을 만들지 않는다
            summary: isFiniteScore(latest.overall_score)
              ? `피부 점수 ${latest.overall_score}점`
              : '피부 분석 완료',
            ...(isFiniteScore(latest.overall_score) ? { skinScore: latest.overall_score } : {}),
            ...(trend ? { skinDelta: trend.delta, skinTrend: trend.trend } : {}),
          });
        }

        // 체형 분석 결과
        // prod body_analyses엔 bmi 컬럼이 없음(실재: height·weight) → BMI는 두 값에서 파생.
        const { data: bodyData, error: bodyError } = await supabase
          .from('body_analyses')
          .select('id, body_type, height, weight, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (bodyData && !bodyError) {
          const body: BodyAnalysisResult = {
            id: bodyData.id,
            bodyType: bodyData.body_type,
            height: bodyData.height,
            weight: bodyData.weight,
            bmi: computeBmi(bodyData.height, bodyData.weight),
            createdAt: new Date(bodyData.created_at),
          };
          setBodyAnalysis(body);
          results.push({
            id: body.id,
            type: 'body',
            createdAt: body.createdAt,
            summary: getBodyTypeLabel(body.bodyType),
            bodyType: body.bodyType,
          });
        }

        // 헤어 분석 결과 (select 컬럼은 모두 prod에 실재)
        const { data: hairData, error: hairError } = await supabase
          .from('hair_analyses')
          .select('id, hair_type, overall_score, damage_level, concerns, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (hairData && !hairError) {
          const hair: HairAnalysisResult = {
            id: hairData.id,
            hairType: hairData.hair_type,
            overallScore: hairData.overall_score,
            damageLevel: hairData.damage_level,
            concerns: hairData.concerns || [],
            createdAt: new Date(hairData.created_at),
          };
          setHairAnalysis(hair);
          // 통합 분석 경로는 헤어 종합점수를 저장하지 않음(정성 분석) → overall_score가 null일 수 있음.
          // 점수가 없으면 "null점"을 만들지 않고 타입 라벨만 노출.
          const hairLabel = getHairTypeLabel(hair.hairType);
          results.push({
            id: hair.id,
            type: 'hair',
            createdAt: hair.createdAt,
            summary: isFiniteScore(hair.overallScore)
              ? `${hairLabel} · ${hair.overallScore}점`
              : hairLabel,
            ...(isFiniteScore(hair.overallScore) ? { hairScore: hair.overallScore } : {}),
            hairType: hair.hairType,
          });
        }

        // 메이크업 분석 결과
        // prod makeup_analyses엔 makeup_style·color_recommendations 컬럼이 없음(실재: undertone·face_shape·recommendations).
        const { data: makeupData, error: makeupError } = await supabase
          .from('makeup_analyses')
          .select('id, undertone, overall_score, face_shape, recommendations, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (makeupData && !makeupError) {
          const makeup: MakeupAnalysisResult = {
            id: makeupData.id,
            undertone: makeupData.undertone,
            overallScore: isFiniteScore(makeupData.overall_score) ? makeupData.overall_score : null,
            faceShape: makeupData.face_shape,
            createdAt: new Date(makeupData.created_at),
          };
          setMakeupAnalysis(makeup);
          const toneLabel = getUndertoneLabel(makeupData.undertone);
          results.push({
            id: makeup.id,
            type: 'makeup',
            createdAt: makeup.createdAt,
            // 점수가 없으면 "null점"을 만들지 않는다
            summary: isFiniteScore(makeupData.overall_score)
              ? `${toneLabel} · ${makeupData.overall_score}점`
              : toneLabel,
            ...(isFiniteScore(makeupData.overall_score)
              ? { makeupScore: makeupData.overall_score }
              : {}),
            undertone: makeupData.undertone,
          });
        }

        setAnalyses(results);
      } catch (err) {
        // AbortError는 정상적인 취소이므로 무시
        if (err instanceof Error && err.name === 'AbortError') return;
        analysisLogger.error('Failed to fetch analyses:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch analyses'));
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, supabase]
  );

  useEffect(() => {
    if (!isLoaded) return;

    // 컴포넌트 언마운트 시 요청 취소를 위한 플래그
    let isMounted = true;
    const abortController = new AbortController();

    const fetch = async () => {
      await fetchAnalyses(abortController.signal);
      if (!isMounted) return; // 언마운트 후 상태 업데이트 방지
    };

    fetch();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [isLoaded, fetchAnalyses]);

  return {
    analyses,
    personalColor,
    skinAnalysis,
    bodyAnalysis,
    hairAnalysis,
    makeupAnalysis,
    isLoading,
    error,
    refetch: fetchAnalyses,
  };
}

// 헬퍼 함수

/** 유효 점수 판별 — null/undefined/NaN이면 false (점수 미저장 시 "null점" 렌더 방지) */
function isFiniteScore(score: unknown): score is number {
  return typeof score === 'number' && Number.isFinite(score);
}

/**
 * skin_analyses.recommendations(jsonb)에서 고민 배열 추출.
 * prod엔 concerns 컬럼이 없어 통합 저장 시 recommendations.primaryConcerns에 담긴다.
 */
function extractConcerns(recommendations: unknown): string[] {
  if (recommendations && typeof recommendations === 'object') {
    const pc = (recommendations as Record<string, unknown>).primaryConcerns;
    if (Array.isArray(pc)) return pc.filter((x): x is string => typeof x === 'string');
  }
  return [];
}

/** BMI 파생 — 키(cm)·몸무게(kg)가 모두 유효할 때만. 없으면 undefined(지어내지 않음). */
function computeBmi(heightCm: unknown, weightKg: unknown): number | undefined {
  if (!isFiniteScore(heightCm) || !isFiniteScore(weightKg) || heightCm <= 0) return undefined;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

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
  return labels[season] || season;
}

function getBodyTypeLabel(bodyType: string): string {
  const labels: Record<string, string> = {
    hourglass: '모래시계형',
    pear: '서양배형',
    apple: '사과형',
    rectangle: '직사각형',
    inverted_triangle: '역삼각형',
  };
  return labels[bodyType] || bodyType;
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
