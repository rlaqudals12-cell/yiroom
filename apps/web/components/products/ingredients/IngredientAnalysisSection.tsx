'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FlaskConical, Info, HelpCircle } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import type { CosmeticIngredient, ProductIngredientAnalysis } from '@/types/ingredient';
import {
  getProductIngredients,
  analyzeProductIngredients,
  getFunctionCounts,
} from '@/lib/products/repositories/ingredients';
import {
  analyzeIngredientsWithAI,
  type AIIngredientSummary as AIIngredientSummaryType,
} from '@/lib/products/services/ingredient-analysis';

// 하위 컴포넌트
import { IngredientCautionAlert } from './IngredientCautionAlert';
import { EWGDistributionChart, IngredientFunctionChart } from './IngredientFunctionChart';
import { SkinTypeAnalysis } from './SkinTypeAnalysis';
import { IngredientList } from './IngredientList';
import { AIIngredientSummary } from './AIIngredientSummary';

interface IngredientAnalysisSectionProps {
  /** 제품 ID */
  productId: string;
  /** 미리 로드된 성분 목록 (선택) */
  preloadedIngredients?: CosmeticIngredient[];
  /** 추가 클래스 */
  className?: string;
}

/**
 * 성분 분석 섹션 (메인 컨테이너)
 * - EWG 등급 분포 차트
 * - 주의 성분 알림
 * - 기능별 분포
 * - 피부타입 적합도
 * - 전체 성분 목록
 */
export function IngredientAnalysisSection({
  productId,
  preloadedIngredients,
  className,
}: IngredientAnalysisSectionProps) {
  const supabase = useClerkSupabaseClient();

  // 상태
  const [ingredients, setIngredients] = useState<CosmeticIngredient[]>(preloadedIngredients || []);
  const [analysis, setAnalysis] = useState<ProductIngredientAnalysis | null>(null);
  const [functionCounts, setFunctionCounts] = useState<{ name: string; count: number }[]>([]);
  const [aiSummary, setAiSummary] = useState<AIIngredientSummaryType | null>(null);
  const [isLoading, setIsLoading] = useState(!preloadedIngredients);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      if (preloadedIngredients) {
        // 분석 결과만 로드
        const analysisResult = await analyzeProductIngredients(supabase, productId);
        setAnalysis(analysisResult);
        setIsLoading(false);

        // AI 분석 비동기 실행
        setIsAiLoading(true);
        analyzeIngredientsWithAI(preloadedIngredients)
          .then(setAiSummary)
          .finally(() => setIsAiLoading(false));
        return;
      }

      setIsLoading(true);
      try {
        const [ingredientsData, analysisData, functionsData] = await Promise.all([
          getProductIngredients(supabase, productId),
          analyzeProductIngredients(supabase, productId),
          getFunctionCounts(supabase),
        ]);

        setIngredients(ingredientsData);
        setAnalysis(analysisData);
        setFunctionCounts(functionsData);

        // AI 분석 비동기 실행 (성분 데이터 로드 후)
        if (ingredientsData.length > 0) {
          setIsAiLoading(true);
          analyzeIngredientsWithAI(ingredientsData)
            .then(setAiSummary)
            .finally(() => setIsAiLoading(false));
        }
      } catch (error) {
        console.error('[IngredientAnalysis] 데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [supabase, productId, preloadedIngredients]);

  // 기능별 집계 (로드된 성분에서 계산)
  const localFunctionCounts = useMemo(() => {
    if (functionCounts.length > 0) return functionCounts;

    const counts: Record<string, number> = {};
    ingredients.forEach((ing) => {
      ing.functions.forEach((fn) => {
        counts[fn] = (counts[fn] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [ingredients, functionCounts]);

  // 로딩 스켈레톤
  if (isLoading) {
    return <IngredientAnalysisSectionSkeleton className={className} />;
  }

  // 성분 데이터 없음
  if (ingredients.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <FlaskConical className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">성분 정보가 등록되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)} data-testid="ingredient-analysis-section">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" aria-hidden="true" />
          성분 정보
          <span className="text-sm font-normal text-muted-foreground">
            ({ingredients.length}개)
          </span>
        </h3>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          aria-label="EWG 등급 설명"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* EWG 설명 */}
      {showHelp && (
        <div className="p-4 bg-muted/50 rounded-xl border text-sm space-y-2">
          <p className="font-medium flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            EWG 등급이란?
          </p>
          <p className="text-muted-foreground">
            미국 환경연구단체 EWG(Environmental Working Group)에서 화장품 성분의 안전성을 평가한
            등급입니다.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              1-2등급: 안전한 성분
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              3-6등급: 보통 주의 수준
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              7-10등급: 사용 주의 필요
            </li>
          </ul>
        </div>
      )}

      {/* AI 성분 분석 요약 */}
      <AIIngredientSummary summary={aiSummary} isLoading={isAiLoading} />

      {/* 주의 성분 알림 */}
      {analysis && (
        <IngredientCautionAlert
          cautionIngredients={analysis.cautionIngredients}
          allergenIngredients={analysis.allergenIngredients}
        />
      )}

      {/* 차트 그리드 */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* EWG 분포 */}
          <div className="p-4 bg-card rounded-xl border">
            <EWGDistributionChart distribution={analysis.ewgDistribution} />
          </div>

          {/* 기능별 분포 */}
          <div className="p-4 bg-card rounded-xl border">
            <IngredientFunctionChart data={localFunctionCounts} maxItems={6} />
          </div>
        </div>
      )}

      {/* 피부타입 적합도 */}
      {analysis && (
        <div className="p-4 bg-card rounded-xl border">
          <SkinTypeAnalysis compatibility={analysis.skinTypeCompatibility} />
        </div>
      )}

      {/* 성분 목록 */}
      <div className="pt-4 border-t">
        <IngredientList
          ingredients={ingredients}
          functionCounts={localFunctionCounts}
          initialCount={10}
        />
      </div>
    </div>
  );
}

/**
 * 로딩 스켈레톤
 */
export function IngredientAnalysisSectionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6 animate-pulse', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="h-6 bg-muted rounded w-32" />
        <div className="h-8 w-8 bg-muted rounded-lg" />
      </div>

      {/* 주의 알림 */}
      <div className="h-16 bg-muted rounded-xl" />

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-40 bg-muted rounded-xl" />
        <div className="h-40 bg-muted rounded-xl" />
      </div>

      {/* 피부타입 */}
      <div className="h-32 bg-muted rounded-xl" />

      {/* 성분 목록 */}
      <div className="space-y-2 pt-4 border-t">
        <div className="h-10 bg-muted rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default IngredientAnalysisSection;
