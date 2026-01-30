'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, RefreshCw, Sparkles, ClipboardList } from 'lucide-react';
import { CelebrationEffect } from '@/components/animations';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/share';
import { useAnalysisShare, createHairShareData } from '@/hooks/useAnalysisShare';
import Link from 'next/link';
import { AIBadge } from '@/components/common/AIBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  type HairTypeId,
  type HairThicknessId,
  type ScalpTypeId,
  type HairConcernId,
  HAIR_TYPES,
  HAIR_THICKNESS,
  SCALP_TYPES,
  HAIR_CONCERNS,
} from '@/lib/mock/hair-analysis';

// 점수 -> 상태
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

// DB 타입 정의
interface DbHairAnalysis {
  id: string;
  clerk_user_id: string;
  image_url: string;
  hair_type: HairTypeId;
  hair_thickness: HairThicknessId;
  scalp_type: ScalpTypeId;
  hydration: number | null;
  scalp_health: number | null;
  damage_level: number | null;
  density: number | null;
  elasticity: number | null;
  shine: number | null;
  overall_score: number;
  concerns: HairConcernId[];
  recommendations: {
    insight?: string;
    ingredients?: string[];
    products?: Array<{ category: string; name: string; description: string }>;
    careTips?: string[];
    analysisReliability?: 'high' | 'medium' | 'low';
  } | null;
  created_at: string;
}

interface HairMetric {
  id: string;
  name: string;
  value: number;
  status: 'good' | 'normal' | 'warning';
  description: string;
}

interface HairAnalysisResultView {
  overallScore: number;
  metrics: HairMetric[];
  hairType: HairTypeId;
  hairTypeLabel: string;
  hairThickness: HairThicknessId;
  hairThicknessLabel: string;
  scalpType: ScalpTypeId;
  scalpTypeLabel: string;
  concerns: HairConcernId[];
  insight: string;
  recommendedIngredients: string[];
  careTips: string[];
  analyzedAt: Date;
}

// DB 데이터 -> 뷰 데이터 변환
function transformDbToResult(dbData: DbHairAnalysis): HairAnalysisResultView {
  const createMetric = (id: string, name: string, value: number | null) => ({
    id,
    name,
    value: value ?? 50,
    status: getStatus(value ?? 50),
    description: getDescription(name, value ?? 50),
  });

  const hairTypeLabel =
    HAIR_TYPES.find((t) => t.id === dbData.hair_type)?.label || dbData.hair_type;
  const hairThicknessLabel =
    HAIR_THICKNESS.find((t) => t.id === dbData.hair_thickness)?.label || dbData.hair_thickness;
  const scalpTypeLabel =
    SCALP_TYPES.find((t) => t.id === dbData.scalp_type)?.label || dbData.scalp_type;

  return {
    overallScore: dbData.overall_score,
    metrics: [
      createMetric('hydration', '수분도', dbData.hydration),
      createMetric('scalp', '두피 건강', dbData.scalp_health),
      createMetric('damage', '손상도', dbData.damage_level),
      createMetric('density', '모발 밀도', dbData.density),
      createMetric('elasticity', '탄력', dbData.elasticity),
      createMetric('shine', '윤기', dbData.shine),
    ],
    hairType: dbData.hair_type,
    hairTypeLabel,
    hairThickness: dbData.hair_thickness,
    hairThicknessLabel,
    scalpType: dbData.scalp_type,
    scalpTypeLabel,
    concerns: dbData.concerns || [],
    insight: dbData.recommendations?.insight || '헤어 케어에 도움이 필요해요!',
    recommendedIngredients: dbData.recommendations?.ingredients || [],
    careTips: dbData.recommendations?.careTips || [],
    analyzedAt: new Date(dbData.created_at),
  };
}

export default function HairAnalysisResultPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [result, setResult] = useState<HairAnalysisResultView | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const fetchedRef = useRef(false);

  const analysisId = params.id as string;

  // 공유 카드 데이터
  const shareData = useMemo(() => {
    if (!result) return null;
    return createHairShareData({
      overallScore: result.overallScore,
      hairTypeLabel: result.hairTypeLabel,
      hairThicknessLabel: result.hairThicknessLabel,
      metrics: result.metrics.map((m) => ({ name: m.name, value: m.value })),
    });
  }, [result]);

  // 공유 훅
  const { share, loading: shareLoading } = useAnalysisShare(
    shareData || { analysisType: 'hair', title: '', subtitle: '' },
    '이룸-헤어분석-결과'
  );

  // DB에서 분석 결과 조회
  const fetchAnalysis = useCallback(async () => {
    if (!isSignedIn || !analysisId || fetchedRef.current) return;

    fetchedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('hair_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      if (!data) {
        throw new Error('분석 결과를 찾을 수 없습니다');
      }

      const dbData = data as DbHairAnalysis;
      const transformedResult = transformDbToResult(dbData);
      setResult(transformedResult);
      setImageUrl(dbData.image_url);

      // 새 분석인 경우에만 축하 효과 표시 (세션당 1회)
      const celebrationKey = `celebration-hair-${analysisId}`;
      if (!sessionStorage.getItem(celebrationKey)) {
        sessionStorage.setItem(celebrationKey, 'shown');
        setShowCelebration(true);
      }
    } catch (err) {
      console.error('[H-1] Fetch error:', err);
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

  // 새로 분석하기 (forceNew 파라미터로 자동 리디렉트 방지)
  const handleNewAnalysis = useCallback(() => {
    router.push('/analysis/hair?forceNew=true');
  }, [router]);

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-amber-600 bg-amber-100';
    }
  };

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
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
        message="헤어 분석 완료!"
        onComplete={() => setShowCelebration(false)}
      />

      <main className="min-h-[calc(100vh-80px)] bg-muted" data-testid="hair-result-page">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 헤더 */}
          <header className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-1" />
                뒤로
              </Link>
            </Button>
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-lg font-bold text-foreground">헤어 분석 결과</h1>
              <AIBadge variant="small" />
            </div>
            <div className="w-16" />
          </header>

          {/* 탭 기반 결과 */}
          {result && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 sticky top-0 z-10 bg-muted">
                <TabsTrigger value="basic" className="gap-1">
                  <Sparkles className="w-4 h-4" />
                  기본 분석
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-1">
                  <ClipboardList className="w-4 h-4" />
                  상세 정보
                </TabsTrigger>
              </TabsList>

              {/* 기본 분석 탭 */}
              <TabsContent value="basic" className="mt-0 space-y-6">
                {/* 헤어 타입 요약 */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-amber-600">{result.overallScore}</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {result.hairTypeLabel} · {result.hairThicknessLabel}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{result.scalpTypeLabel}</p>
                </div>

                {/* 인사이트 */}
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-3">분석 인사이트</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.insight}</p>
                </div>

                {/* 상세 지표 */}
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-4">상세 지표</h3>
                  <div className="space-y-4">
                    {result.metrics.map((metric) => (
                      <div key={metric.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{metric.name}</span>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              getStatusColor(metric.status)
                            )}
                          >
                            {metric.value}점
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              metric.status === 'good'
                                ? 'bg-green-500'
                                : metric.status === 'warning'
                                  ? 'bg-red-500'
                                  : 'bg-amber-500'
                            )}
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 고민 태그 */}
                {result.concerns.length > 0 && (
                  <div className="bg-card rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-3">주요 고민</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.concerns.map((concern) => {
                        const concernData = HAIR_CONCERNS.find((c) => c.id === concern);
                        return (
                          <Badge key={concern} variant="secondary" className="text-sm">
                            {concernData?.emoji} {concernData?.label || concern}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* 상세 정보 탭 */}
              <TabsContent value="details" className="mt-0 space-y-6 pb-32">
                {/* 추천 성분 */}
                {result.recommendedIngredients.length > 0 && (
                  <div className="bg-card rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-3">추천 성분</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.recommendedIngredients.map((ingredient, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 케어 팁 */}
                {result.careTips.length > 0 && (
                  <div className="bg-card rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-3">케어 팁</h3>
                    <ul className="space-y-2">
                      {result.careTips.map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="text-amber-500">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 분석 이미지 */}
                {imageUrl && (
                  <div className="bg-card rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-3">분석 이미지</h3>
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hair-images/${imageUrl}`}
                        alt="분석된 헤어 이미지"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      {/* 하단 고정 버튼 */}
      {result && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border/50 z-10">
          <div className="max-w-md mx-auto space-y-2">
            {/* 제품 추천 버튼 */}
            <Button
              className="w-full"
              onClick={() =>
                router.push(`/products?scalpType=${result.scalpType || ''}&category=haircare`)
              }
            >
              <Sparkles className="w-4 h-4 mr-2" />
              헤어 맞춤 제품 보기
            </Button>
            {/* 다시 분석하기 + 공유 */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleNewAnalysis}>
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 분석하기
              </Button>
              <ShareButton onShare={share} loading={shareLoading} variant="outline" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
