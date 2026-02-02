'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

// 캐시 TTL: 5분 (밀리초)
const CACHE_TTL = 5 * 60 * 1000;

// 글로벌 캐시 (컴포넌트 간 공유)
interface CacheEntry {
  data: AnalysisSummary[];
  timestamp: number;
}
const analysisCache = new Map<string, CacheEntry>();

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
  bodyType?: string; // C-1
  hairScore?: number; // H-1
  hairType?: string; // H-1
  makeupScore?: number; // M-1
  undertone?: string; // M-1
}

// 분석 상태 반환 타입
export interface AnalysisStatus {
  isLoading: boolean;
  analyses: AnalysisSummary[];
  analysisCount: number;
  hasPersonalColor: boolean;
  hasSkin: boolean;
  hasBody: boolean;
  hasHair: boolean;
  hasMakeup: boolean;
  // 상태 판단 헬퍼
  isNewUser: boolean; // 분석 0개
  isPartialUser: boolean; // 분석 1-2개
  isActiveUser: boolean; // 분석 3개 이상
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
    coily: '꼬임',
  };
  return labels[hairType] || hairType;
}

function getUndertoneLabel(undertone: string): string {
  const labels: Record<string, string> = {
    warm: '웜톤',
    cool: '쿨톤',
    neutral: '뉴트럴',
  };
  return labels[undertone] || undertone;
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

      try {
        // 병렬로 모든 분석 결과 조회
        const [pcResult, skinResult, bodyResult, hairResult, makeupResult] = await Promise.all([
          supabase
            .from('personal_color_assessments')
            .select('id, season, created_at')
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('skin_analyses')
            .select('id, overall_score, created_at')
            .order('created_at', { ascending: false })
            .limit(1),
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

        const results: AnalysisSummary[] = [];

        // 퍼스널 컬러
        if (pcResult.data && pcResult.data.length > 0) {
          results.push({
            id: pcResult.data[0].id,
            type: 'personal-color',
            createdAt: new Date(pcResult.data[0].created_at),
            summary: getSeasonLabel(pcResult.data[0].season),
            seasonType: pcResult.data[0].season,
          });
        }

        // 피부 분석
        if (skinResult.data && skinResult.data.length > 0) {
          results.push({
            id: skinResult.data[0].id,
            type: 'skin',
            createdAt: new Date(skinResult.data[0].created_at),
            summary: `${skinResult.data[0].overall_score}점`,
            skinScore: skinResult.data[0].overall_score,
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

        // 캐시 저장
        setCachedData(user.id, results);
        setAnalyses(results);
      } catch (error) {
        console.error('[useAnalysisStatus] Failed to fetch analyses:', error);
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    }

    if (isUserLoaded) {
      fetchAnalyses();
    }
  }, [user?.id, isUserLoaded, supabase, getCachedData, setCachedData]);

  // 각 분석 타입 존재 여부
  const hasPersonalColor = analyses.some((a) => a.type === 'personal-color');
  const hasSkin = analyses.some((a) => a.type === 'skin');
  const hasBody = analyses.some((a) => a.type === 'body');
  const hasHair = analyses.some((a) => a.type === 'hair');
  const hasMakeup = analyses.some((a) => a.type === 'makeup');

  // 사용자 상태 판단
  const analysisCount = analyses.length;
  const isNewUser = analysisCount === 0;
  const isPartialUser = analysisCount >= 1 && analysisCount <= 2;
  const isActiveUser = analysisCount >= 3;

  return {
    isLoading: !isUserLoaded || isLoading,
    analyses,
    analysisCount,
    hasPersonalColor,
    hasSkin,
    hasBody,
    hasHair,
    hasMakeup,
    isNewUser,
    isPartialUser,
    isActiveUser,
  };
}
