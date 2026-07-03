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
  bmi: number;
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
  makeupStyle: string;
  colorRecommendations: Record<string, unknown>;
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
        const { data: pcData, error: pcError } = await supabase
          .from('personal_color_assessments')
          .select('id, season, tone, color_palette, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (pcData && !pcError) {
          const pc: PersonalColorResult = {
            id: pcData.id,
            season: pcData.season,
            tone: pcData.tone || '',
            colorPalette: pcData.color_palette || [],
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
        const { data: skinRows, error: skinError } = await supabase
          .from('skin_analyses')
          .select('id, skin_type, overall_score, concerns, created_at')
          .order('created_at', { ascending: false })
          .limit(2); // 추이(직전 대비)용 2건

        if (skinRows && skinRows.length > 0 && !skinError) {
          const latest = skinRows[0];
          const skin: SkinAnalysisResult = {
            id: latest.id,
            skinType: latest.skin_type,
            overallScore: latest.overall_score,
            concerns: latest.concerns || [],
            createdAt: new Date(latest.created_at),
          };
          setSkinAnalysis(skin);
          const trend =
            skinRows.length > 1
              ? computeSkinTrend(latest.overall_score, skinRows[1].overall_score)
              : null;
          results.push({
            id: skin.id,
            type: 'skin',
            createdAt: skin.createdAt,
            summary: `피부 점수 ${skin.overallScore}점`,
            skinScore: skin.overallScore,
            ...(trend ? { skinDelta: trend.delta, skinTrend: trend.trend } : {}),
          });
        }

        // 체형 분석 결과
        const { data: bodyData, error: bodyError } = await supabase
          .from('body_analyses')
          .select('id, body_type, height, weight, bmi, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (bodyData && !bodyError) {
          const body: BodyAnalysisResult = {
            id: bodyData.id,
            bodyType: bodyData.body_type,
            height: bodyData.height,
            weight: bodyData.weight,
            bmi: bodyData.bmi,
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

        // 헤어 분석 결과
        const { data: hairData, error: hairError } = await supabase
          .from('hair_analyses')
          .select('id, hair_type, overall_score, damage_level, concerns, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

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
          results.push({
            id: hair.id,
            type: 'hair',
            createdAt: hair.createdAt,
            summary: `${getHairTypeLabel(hair.hairType)} · ${hair.overallScore}점`,
            hairScore: hair.overallScore,
            hairType: hair.hairType,
          });
        }

        // 메이크업 분석 결과
        const { data: makeupData, error: makeupError } = await supabase
          .from('makeup_analyses')
          .select('id, makeup_style, undertone, overall_score, color_recommendations, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (makeupData && !makeupError) {
          const makeup: MakeupAnalysisResult = {
            id: makeupData.id,
            makeupStyle: makeupData.makeup_style,
            colorRecommendations: makeupData.color_recommendations || {},
            createdAt: new Date(makeupData.created_at),
          };
          setMakeupAnalysis(makeup);
          results.push({
            id: makeup.id,
            type: 'makeup',
            createdAt: makeup.createdAt,
            summary: `${getUndertoneLabel(makeupData.undertone)} · ${makeupData.overall_score}점`,
            makeupScore: makeupData.overall_score,
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
