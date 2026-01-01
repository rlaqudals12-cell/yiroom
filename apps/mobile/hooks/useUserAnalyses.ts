/**
 * 사용자 분석 결과 조회 Hook
 * PC-1/S-1/C-1 분석 결과를 가져옴
 */
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback } from 'react';

import { useClerkSupabaseClient } from '../lib/supabase';

// 분석 결과 타입
export interface AnalysisSummary {
  id: string;
  type: 'personal-color' | 'skin' | 'body';
  createdAt: Date;
  summary: string;
  // 타입별 추가 데이터
  seasonType?: string;
  skinScore?: number;
  bodyType?: string;
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

interface UseUserAnalysesReturn {
  analyses: AnalysisSummary[];
  personalColor: PersonalColorResult | null;
  skinAnalysis: SkinAnalysisResult | null;
  bodyAnalysis: BodyAnalysisResult | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUserAnalyses(): UseUserAnalysesReturn {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [personalColor, setPersonalColor] =
    useState<PersonalColorResult | null>(null);
  const [skinAnalysis, setSkinAnalysis] = useState<SkinAnalysisResult | null>(
    null
  );
  const [bodyAnalysis, setBodyAnalysis] = useState<BodyAnalysisResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalyses = useCallback(
    async (signal?: AbortSignal) => {
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

        // 피부 분석 결과
        const { data: skinData, error: skinError } = await supabase
          .from('skin_analyses')
          .select('id, skin_type, overall_score, concerns, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (skinData && !skinError) {
          const skin: SkinAnalysisResult = {
            id: skinData.id,
            skinType: skinData.skin_type,
            overallScore: skinData.overall_score,
            concerns: skinData.concerns || [],
            createdAt: new Date(skinData.created_at),
          };
          setSkinAnalysis(skin);
          results.push({
            id: skin.id,
            type: 'skin',
            createdAt: skin.createdAt,
            summary: `피부 점수 ${skin.overallScore}점`,
            skinScore: skin.overallScore,
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

        setAnalyses(results);
      } catch (err) {
        // AbortError는 정상적인 취소이므로 무시
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[Mobile] Failed to fetch analyses:', err);
        setError(
          err instanceof Error ? err : new Error('Failed to fetch analyses')
        );
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  ); // supabase 제거 - 클라이언트는 안정적

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
