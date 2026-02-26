/**
 * 분석 비교 Hook
 *
 * 동일 모듈의 최근 2건 분석 결과를 가져와
 * ComparisonCard에 전달할 MetricComparison[] 형태로 변환.
 */
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback } from 'react';

import { useClerkSupabaseClient } from '../lib/supabase';
import { analysisLogger } from '../lib/utils/logger';
import type { AnalysisModuleType } from './useAnalysisHistory';

// 모듈별 비교 지표 정의
interface MetricConfig {
  column: string;
  label: string;
  higherIsBetter: boolean;
}

// 모듈별 테이블/지표 매핑
interface ModuleCompareConfig {
  table: string;
  columns: string;
  metrics: MetricConfig[];
  /** 전체 점수 컬럼 (있는 경우) */
  totalColumn?: string;
}

const MODULE_COMPARE_MAP: Record<AnalysisModuleType, ModuleCompareConfig> = {
  'personal-color': {
    table: 'personal_color_assessments',
    columns: 'id, confidence, created_at',
    metrics: [{ column: 'confidence', label: '정확도', higherIsBetter: true }],
    totalColumn: 'confidence',
  },
  skin: {
    table: 'skin_analyses',
    columns: 'id, overall_score, created_at',
    metrics: [{ column: 'overall_score', label: '종합 점수', higherIsBetter: true }],
    totalColumn: 'overall_score',
  },
  body: {
    table: 'body_analyses',
    columns: 'id, bmi, created_at',
    metrics: [{ column: 'bmi', label: 'BMI', higherIsBetter: false }],
  },
  hair: {
    table: 'hair_analyses',
    columns: 'id, overall_score, damage_level, created_at',
    metrics: [
      { column: 'overall_score', label: '종합 점수', higherIsBetter: true },
      { column: 'damage_level', label: '손상도', higherIsBetter: false },
    ],
    totalColumn: 'overall_score',
  },
  makeup: {
    table: 'makeup_analyses',
    columns: 'id, created_at',
    metrics: [],
  },
  'oral-health': {
    table: 'oral_health_assessments',
    columns: 'id, overall_score, created_at',
    metrics: [{ column: 'overall_score', label: '종합 점수', higherIsBetter: true }],
    totalColumn: 'overall_score',
  },
  posture: {
    table: 'posture_analyses',
    columns: 'id, overall_score, created_at',
    metrics: [{ column: 'overall_score', label: '종합 점수', higherIsBetter: true }],
    totalColumn: 'overall_score',
  },
};

// ComparisonCard에 전달할 지표 타입 (re-export 없이 동일 구조)
export interface ComparisonMetric {
  label: string;
  previous: number;
  current: number;
  higherIsBetter?: boolean;
}

export interface AnalysisComparisonData {
  title: string;
  metrics: ComparisonMetric[];
  previousTotal?: number;
  currentTotal?: number;
  previousDate?: Date;
  currentDate?: Date;
  isFirstAnalysis: boolean;
}

interface UseAnalysisComparisonReturn {
  data: AnalysisComparisonData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// 모듈 한글 이름
const MODULE_LABELS: Record<AnalysisModuleType, string> = {
  'personal-color': '퍼스널 컬러',
  skin: '피부',
  body: '체형',
  hair: '헤어',
  makeup: '메이크업',
  'oral-health': '구강건강',
  posture: '자세',
};

export function useAnalysisComparison(
  moduleType: AnalysisModuleType
): UseAnalysisComparisonReturn {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [data, setData] = useState<AnalysisComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchComparison = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const config = MODULE_COMPARE_MAP[moduleType];

      // 최근 2건 조회
      const { data: rows, error: fetchError } = await supabase
        .from(config.table)
        .select(config.columns)
        .order('created_at', { ascending: false })
        .limit(2);

      if (fetchError) {
        analysisLogger.warn(`Compare fetch failed (${config.table}):`, fetchError.message);
        setData({
          title: `${MODULE_LABELS[moduleType]} 분석 비교`,
          metrics: [],
          isFirstAnalysis: true,
        });
        setIsLoading(false);
        return;
      }

      if (!rows || rows.length === 0) {
        setData({
          title: `${MODULE_LABELS[moduleType]} 분석 비교`,
          metrics: [],
          isFirstAnalysis: true,
        });
        setIsLoading(false);
        return;
      }

      const current = rows[0] as unknown as Record<string, unknown>;
      const previous = rows.length > 1 ? (rows[1] as unknown as Record<string, unknown>) : null;

      if (!previous) {
        // 첫 분석 — 비교 불가
        setData({
          title: `${MODULE_LABELS[moduleType]} 분석 비교`,
          metrics: [],
          isFirstAnalysis: true,
          currentDate: new Date(current.created_at as string),
        });
        setIsLoading(false);
        return;
      }

      // 지표 추출
      const metrics: ComparisonMetric[] = config.metrics
        .filter((m) => {
          const prev = previous[m.column];
          const curr = current[m.column];
          return prev != null && curr != null && typeof prev === 'number' && typeof curr === 'number';
        })
        .map((m) => ({
          label: m.label,
          previous: previous[m.column] as number,
          current: current[m.column] as number,
          higherIsBetter: m.higherIsBetter,
        }));

      // 전체 점수
      let previousTotal: number | undefined;
      let currentTotal: number | undefined;
      if (config.totalColumn) {
        const pt = previous[config.totalColumn];
        const ct = current[config.totalColumn];
        if (typeof pt === 'number' && typeof ct === 'number') {
          previousTotal = pt;
          currentTotal = ct;
        }
      }

      setData({
        title: `${MODULE_LABELS[moduleType]} 분석 비교`,
        metrics,
        previousTotal,
        currentTotal,
        previousDate: new Date(previous.created_at as string),
        currentDate: new Date(current.created_at as string),
        isFirstAnalysis: false,
      });
    } catch (err) {
      analysisLogger.error('Compare fetch failed:', err);
      setError(err instanceof Error ? err : new Error('비교 데이터를 불러올 수 없어요'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase, moduleType]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchComparison();
  }, [isLoaded, fetchComparison]);

  return { data, isLoading, error, refetch: fetchComparison };
}
