/**
 * 분석 이력 조회 Hook
 *
 * 모듈별 분석 결과를 페이지네이션으로 조회.
 * useUserAnalyses()가 최신 1건만 가져오는 것과 달리 이력 전체를 가져옴.
 */
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback } from 'react';

import { useClerkSupabaseClient } from '../lib/supabase';
import { analysisLogger } from '../lib/utils/logger';

// 지원하는 분석 모듈 타입
export type AnalysisModuleType =
  | 'personal-color'
  | 'skin'
  | 'body'
  | 'hair'
  | 'makeup'
  | 'oral-health'
  | 'posture';

// 조회 기간 필터
export type HistoryPeriod = '1m' | '3m' | '6m' | 'all';

// 이력 항목
export interface AnalysisHistoryItem {
  id: string;
  moduleType: AnalysisModuleType;
  createdAt: Date;
  summary: string;
  score?: number;
  imageUrl?: string | null;
}

// 모듈별 테이블/컬럼 매핑
interface TableConfig {
  table: string;
  columns: string;
  toItem: (row: Record<string, unknown>) => AnalysisHistoryItem;
}

const MODULE_TABLE_MAP: Record<AnalysisModuleType, TableConfig> = {
  'personal-color': {
    table: 'personal_color_assessments',
    columns: 'id, season, tone, confidence, created_at',
    toItem: (row) => ({
      id: row.id as string,
      moduleType: 'personal-color',
      createdAt: new Date(row.created_at as string),
      summary: getSeasonLabel(row.season as string),
      score: row.confidence as number | undefined,
    }),
  },
  skin: {
    table: 'skin_analyses',
    columns: 'id, skin_type, overall_score, image_url, created_at',
    toItem: (row) => ({
      id: row.id as string,
      moduleType: 'skin',
      createdAt: new Date(row.created_at as string),
      summary: getSkinTypeLabel(row.skin_type as string),
      score: row.overall_score as number | undefined,
      imageUrl: row.image_url as string | null,
    }),
  },
  body: {
    table: 'body_analyses',
    columns: 'id, body_type, bmi, image_url, created_at',
    toItem: (row) => ({
      id: row.id as string,
      moduleType: 'body',
      createdAt: new Date(row.created_at as string),
      summary: getBodyTypeLabel(row.body_type as string),
      score: row.bmi as number | undefined,
      imageUrl: row.image_url as string | null,
    }),
  },
  hair: {
    table: 'hair_analyses',
    columns: 'id, hair_type, overall_score, damage_level, image_url, created_at',
    toItem: (row) => ({
      id: row.id as string,
      moduleType: 'hair',
      createdAt: new Date(row.created_at as string),
      summary: getHairTypeLabel(row.hair_type as string),
      score: row.overall_score as number | undefined,
      imageUrl: row.image_url as string | null,
    }),
  },
  makeup: {
    table: 'makeup_analyses',
    columns: 'id, makeup_style, created_at',
    toItem: (row) => ({
      id: row.id as string,
      moduleType: 'makeup',
      createdAt: new Date(row.created_at as string),
      summary: '메이크업 분석',
    }),
  },
  'oral-health': {
    table: 'oral_health_assessments',
    columns: 'id, overall_score, created_at',
    toItem: (row) => ({
      id: row.id as string,
      moduleType: 'oral-health',
      createdAt: new Date(row.created_at as string),
      summary: '구강건강 분석',
      score: row.overall_score as number | undefined,
    }),
  },
  posture: {
    table: 'posture_analyses',
    columns: 'id, overall_score, created_at',
    toItem: (row) => ({
      id: row.id as string,
      moduleType: 'posture',
      createdAt: new Date(row.created_at as string),
      summary: '자세 분석',
      score: row.overall_score as number | undefined,
    }),
  },
};

interface UseAnalysisHistoryReturn {
  items: AnalysisHistoryItem[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

const PAGE_SIZE = 20;

export function useAnalysisHistory(
  moduleType: AnalysisModuleType | 'all',
  period: HistoryPeriod = 'all'
): UseAnalysisHistoryReturn {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [items, setItems] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // 기간 필터 계산
  const getDateFilter = useCallback((): string | null => {
    if (period === 'all') return null;
    const now = new Date();
    const months = period === '1m' ? 1 : period === '3m' ? 3 : 6;
    now.setMonth(now.getMonth() - months);
    return now.toISOString();
  }, [period]);

  // 단일 모듈 조회
  const fetchModule = useCallback(
    async (
      type: AnalysisModuleType,
      pageOffset: number,
      dateFilter: string | null
    ): Promise<AnalysisHistoryItem[]> => {
      const config = MODULE_TABLE_MAP[type];
      let query = supabase
        .from(config.table)
        .select(config.columns)
        .order('created_at', { ascending: false })
        .range(pageOffset, pageOffset + PAGE_SIZE - 1);

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) {
        // 테이블이 없는 경우 무시 (oral-health, posture는 아직 모바일에서 미저장일 수 있음)
        analysisLogger.warn(`History fetch failed (${config.table}):`, fetchError.message);
        return [];
      }

      return (data || []).map((row) => config.toItem(row as unknown as Record<string, unknown>));
    },
    [supabase]
  );

  // 전체 조회 (모든 모듈)
  const fetchAll = useCallback(
    async (pageOffset: number, dateFilter: string | null): Promise<AnalysisHistoryItem[]> => {
      const types: AnalysisModuleType[] = [
        'personal-color',
        'skin',
        'body',
        'hair',
        'makeup',
        'oral-health',
        'posture',
      ];

      const results = await Promise.all(
        types.map((type) => fetchModule(type, 0, dateFilter))
      );

      // 전체를 시간순 정렬 후 페이지네이션
      return results
        .flat()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(pageOffset, pageOffset + PAGE_SIZE);
    },
    [fetchModule]
  );

  const fetchItems = useCallback(
    async (pageOffset: number, append: boolean = false) => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      if (!append) setIsLoading(true);
      setError(null);

      try {
        const dateFilter = getDateFilter();
        let fetched: AnalysisHistoryItem[];

        if (moduleType === 'all') {
          fetched = await fetchAll(pageOffset, dateFilter);
        } else {
          fetched = await fetchModule(moduleType, pageOffset, dateFilter);
        }

        if (append) {
          setItems((prev) => [...prev, ...fetched]);
        } else {
          setItems(fetched);
        }
        setHasMore(fetched.length >= PAGE_SIZE);
        setOffset(pageOffset + fetched.length);
      } catch (err) {
        analysisLogger.error('History fetch failed:', err);
        setError(err instanceof Error ? err : new Error('이력 조회에 실패했어요'));
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, moduleType, getDateFilter, fetchAll, fetchModule]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchItems(offset, true);
  }, [hasMore, isLoading, offset, fetchItems]);

  const refetch = useCallback(async () => {
    setOffset(0);
    await fetchItems(0, false);
  }, [fetchItems]);

  useEffect(() => {
    if (!isLoaded) return;
    setOffset(0);
    fetchItems(0, false);
  }, [isLoaded, fetchItems]);

  return { items, isLoading, error, hasMore, loadMore, refetch };
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

function getSkinTypeLabel(skinType: string): string {
  const labels: Record<string, string> = {
    dry: '건성',
    oily: '지성',
    combination: '복합성',
    normal: '중성',
    sensitive: '민감성',
  };
  return labels[skinType] || skinType;
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
  return labels[hairType] || hairType;
}
