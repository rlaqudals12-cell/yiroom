'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { CelebrationEffect } from '@/components/animations';
import { Button } from '@/components/ui/button';
import { type SkinAnalysisResult } from '@/lib/mock/skin-analysis';
import AnalysisResult from '../../_components/AnalysisResult';
import { RecommendedProducts } from '@/components/analysis/RecommendedProducts';
import { ShareButton } from '@/components/share';
import { useAnalysisShare, createSkinShareData } from '@/hooks/useAnalysisShare';
import Link from 'next/link';
import type { SkinType as ProductSkinType, SkinConcern } from '@/types/product';

// 점수 → 상태 (MetricStatus 타입에 맞게)
function getStatus(value: number): 'good' | 'normal' | 'warning' {
  if (value >= 71) return 'good';
  if (value >= 41) return 'normal';
  return 'warning';
}

// 점수에 따른 설명 생성
function getDescription(name: string, value: number): string {
  if (value >= 71) return `${name}(이)가 좋은 상태입니다`;
  if (value >= 41) return `${name}(이)가 보통 수준입니다`;
  return `${name} 관리가 필요합니다`;
}

// DB 데이터 → AnalysisResult props 변환
function transformDbToResult(dbData: DbSkinAnalysis): SkinAnalysisResult {
  // 메트릭 생성 헬퍼
  const createMetric = (id: string, name: string, value: number) => ({
    id,
    name,
    value,
    status: getStatus(value),
    description: getDescription(name, value),
  });

  return {
    overallScore: dbData.overall_score,
    metrics: [
      createMetric('hydration', '수분도', dbData.hydration),
      createMetric('oil', '유분도', dbData.oil_level),
      createMetric('pores', '모공', dbData.pores),
      createMetric('pigmentation', '색소침착', dbData.pigmentation),
      createMetric('wrinkles', '주름', dbData.wrinkles),
      createMetric('sensitivity', '민감도', dbData.sensitivity),
      createMetric('elasticity', '탄력', Math.round((dbData.hydration + dbData.pores) / 2)),
    ],
    insight: dbData.recommendations?.insight || '피부 관리에 도움이 필요해요!',
    recommendedIngredients: dbData.recommendations?.ingredients || [],
    analyzedAt: new Date(dbData.created_at),
    personalColorSeason: dbData.personal_color_season,
    foundationRecommendation: dbData.foundation_recommendation,
    ingredientWarnings: dbData.ingredient_warnings?.map((w) => ({
      ...w,
      ewgGrade: null, // DB에 없으면 null
    })),
    productRecommendations: dbData.products
      ? {
          routine: (dbData.products.routine || []).map((r) => ({
            ...r,
            tip: '', // 기본값 추가
          })),
          specialCare: [],
          careTips: {
            weeklyCare: dbData.recommendations?.weekly_care || [],
            lifestyleTips: [],
          },
          skincareRoutine: {
            morning: dbData.recommendations?.morning_routine?.join(' → ') || '',
            evening: dbData.recommendations?.evening_routine?.join(' → ') || '',
          },
        }
      : undefined,
  };
}

// DB 타입 정의
interface DbSkinAnalysis {
  id: string;
  clerk_user_id: string;
  image_url: string;
  skin_type: string;
  hydration: number;
  oil_level: number;
  pores: number;
  pigmentation: number;
  wrinkles: number;
  sensitivity: number;
  overall_score: number;
  recommendations: {
    insight?: string;
    ingredients?: Array<{ name: string; reason: string }>;
    morning_routine?: string[];
    evening_routine?: string[];
    weekly_care?: string[];
  } | null;
  products: {
    routine?: Array<{ step: number; category: string; products: string[] }>;
  } | null;
  ingredient_warnings: Array<{
    ingredient: string;
    ingredientEn?: string;
    level: 'low' | 'medium' | 'high';
    reason: string;
    alternatives?: string[];
  }> | null;
  personal_color_season: string | null;
  foundation_recommendation: string | null;
  created_at: string;
}

export default function SkinAnalysisResultPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [skinType, setSkinType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const fetchedRef = useRef(false);

  const analysisId = params.id as string;

  // 공유 카드 데이터
  const shareData = useMemo(() => {
    if (!result) return null;
    return createSkinShareData({
      overallScore: result.overallScore,
      metrics: result.metrics.map((m) => ({ name: m.name, value: m.value })),
    });
  }, [result]);

  // 공유 훅
  const { share, loading: shareLoading } = useAnalysisShare(
    shareData || { analysisType: 'skin', title: '', subtitle: '' },
    '이룸-피부분석-결과'
  );

  // DB에서 분석 결과 조회
  const fetchAnalysis = useCallback(async () => {
    if (!isSignedIn || !analysisId || fetchedRef.current) return;

    fetchedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('skin_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      if (!data) {
        throw new Error('분석 결과를 찾을 수 없습니다');
      }

      // DB 데이터 → 컴포넌트 props 변환
      const dbData = data as DbSkinAnalysis;
      const transformedResult = transformDbToResult(dbData);
      setResult(transformedResult);
      setSkinType(dbData.skin_type);

      // 새 분석인 경우에만 축하 효과 표시 (세션당 1회)
      const celebrationKey = `celebration-skin-${analysisId}`;
      if (!sessionStorage.getItem(celebrationKey)) {
        sessionStorage.setItem(celebrationKey, 'shown');
        setShowCelebration(true);
      }
    } catch (err) {
      console.error('[S-1] Fetch error:', err);
      setError(err instanceof Error ? err.message : '결과를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, analysisId, supabase]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchAnalysis();
    }
  }, [isLoaded, isSignedIn, fetchAnalysis]);

  // 새로 분석하기
  const handleNewAnalysis = useCallback(() => {
    router.push('/analysis/skin');
  }, [router]);

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">결과를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  // 비로그인 상태
  if (!isSignedIn) {
    return (
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">로그인이 필요합니다</h2>
          <p className="text-muted-foreground">분석 결과를 확인하려면 먼저 로그인해주세요</p>
        </div>
      </main>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-muted">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  대시보드로
                </Link>
              </Button>
              <Button onClick={handleNewAnalysis}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로 분석하기
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* 분석 완료 축하 효과 */}
      <CelebrationEffect
        type="analysis_complete"
        trigger={showCelebration}
        message="피부 분석 완료!"
        onComplete={() => setShowCelebration(false)}
      />

      <main className="min-h-[calc(100vh-80px)] bg-muted">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 헤더 */}
          <header className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-1" />
                뒤로
              </Link>
            </Button>
            <h1 className="text-lg font-bold text-foreground">피부 분석 결과</h1>
            <div className="w-16" /> {/* 균형용 */}
          </header>

          {/* 결과 */}
          {result && <AnalysisResult result={result} onRetry={handleNewAnalysis} />}

          {/* 맞춤 추천 제품 */}
          {result && skinType && (
            <RecommendedProducts
              analysisType="skin"
              analysisResult={{
                skinType: skinType as ProductSkinType,
                skinConcerns: result.metrics
                  .filter((m) => m.status === 'warning')
                  .map((m) => {
                    // 메트릭 ID → SkinConcern 매핑
                    const concernMap: Record<string, SkinConcern> = {
                      hydration: 'hydration',
                      pores: 'pore',
                      pigmentation: 'whitening',
                      wrinkles: 'aging',
                      sensitivity: 'redness',
                    };
                    return concernMap[m.id];
                  })
                  .filter((c): c is SkinConcern => c !== undefined),
              }}
              className="mt-8 pb-32"
            />
          )}
        </div>
      </main>

      {/* 하단 고정 버튼 */}
      {result && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/80 backdrop-blur-sm border-t border-border/50 z-10">
          <div className="max-w-md mx-auto space-y-2">
            {/* 제품 추천 버튼 */}
            <Button
              className="w-full"
              onClick={() => router.push(`/products?skinType=${skinType || ''}&category=skincare`)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              피부 맞춤 제품 보기
            </Button>
            {/* 공유 버튼 */}
            <ShareButton onShare={share} loading={shareLoading} variant="outline" />
          </div>
        </div>
      )}
    </>
  );
}
