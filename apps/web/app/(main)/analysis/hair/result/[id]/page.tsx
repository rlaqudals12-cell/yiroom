'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useScoreTrend } from '@/hooks/useScoreTrend';
import { ScoreTrendChip } from '@/components/analysis/ScoreTrendChip';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, RefreshCw, Sparkles, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareButton, PrintButton, ShareThemePicker } from '@/components/share';
import type { ShareCardFormat } from '@/components/share';
import { useAnalysisShare, createHairShareData } from '@/hooks/useAnalysisShare';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { AIBadge, AITransparencyNotice } from '@/components/common/AIBadge';

const ProgressiveProfilePrompt = dynamic(
  () =>
    import('@/components/analysis/ProgressiveProfilePrompt').then((mod) => ({
      default: mod.ProgressiveProfilePrompt,
    })),
  { loading: () => null, ssr: false }
);
const AnalysisMatchedProducts = dynamic(
  () =>
    import('@/components/analysis/AnalysisMatchedProducts').then((mod) => ({
      default: mod.AnalysisMatchedProducts,
    })),
  { loading: () => null, ssr: false }
);
import { MockDataNotice } from '@/components/common/MockDataNotice';
import { ResultPageInsights } from '@/components/insights';
import { useExpertMode } from '@/hooks/useExpertMode';
import { ExpertModeToggle } from '@/components/analysis/ExpertModeToggle';
import { ExpertDataPanel } from '@/components/analysis/ExpertDataPanel';
import { VisualReportCard } from '@/components/analysis/visual-report/VisualReportCard';
import { useTranslations } from 'next-intl';

// 하단 컴포넌트는 dynamic import (below the fold, 번들 분할)
const ContextLinkingCard = dynamic(
  () =>
    import('@/components/analysis/ContextLinkingCard').then((mod) => ({
      default: mod.ContextLinkingCard,
    })),
  { ssr: false }
);
const RecommendedProducts = dynamic(
  () =>
    import('@/components/analysis/RecommendedProducts').then((mod) => ({
      default: mod.RecommendedProducts,
    })),
  { ssr: false }
);
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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

// 점수에 따른 설명 생성 (인과 연결 포함)
function getDescription(name: string, value: number): string {
  if (value >= 71) return `${name} 상태가 좋아서 현재 루틴을 유지하면 돼요`;
  if (value >= 41) return `${name} 상태가 보통이라 조금만 관리하면 더 좋아질 수 있어요`;
  return `${name} 수치가 낮은 편이라 집중 케어하면 개선될 수 있어요`;
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
    usedMock?: boolean;
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
  analysisReliability: 'high' | 'medium' | 'low';
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

  // A1: 영어 raw value 노출 방지 — fallback은 한글 기본값
  const hairTypeLabel = HAIR_TYPES.find((t) => t.id === dbData.hair_type)?.label || '알 수 없음';
  const hairThicknessLabel =
    HAIR_THICKNESS.find((t) => t.id === dbData.hair_thickness)?.label || '알 수 없음';
  const scalpTypeLabel = SCALP_TYPES.find((t) => t.id === dbData.scalp_type)?.label || '알 수 없음';

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
    insight: dbData.recommendations?.insight || '더 나은 헤어 케어를 위한 팁을 확인해보세요',
    recommendedIngredients: dbData.recommendations?.ingredients || [],
    careTips: dbData.recommendations?.careTips || [],
    analysisReliability: dbData.recommendations?.analysisReliability || 'medium',
    analyzedAt: new Date(dbData.created_at),
  };
}

export default function HairAnalysisResultPage() {
  const t = useTranslations('analysis');
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [result, setResult] = useState<HairAnalysisResultView | null>(null);
  // 직전 분석 대비 추이 — 첫 분석이면 null (칩 미노출)
  const scoreTrend = useScoreTrend(
    'hair_analyses',
    result?.analyzedAt ?? null,
    result?.overallScore
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedMock, setUsedMock] = useState(false);
  const { isExpert, toggleExpert } = useExpertMode();
  const [activeTab, setActiveTab] = useState<string>('basic');
  const fetchedRef = useRef(false);

  const analysisId = params.id as string;

  // 공유 카드 데이터
  const [shareFormat, setShareFormat] = useState<ShareCardFormat>('1:1');
  const shareData = useMemo(() => {
    if (!result) return null;
    return {
      ...createHairShareData(
        {
          overallScore: result.overallScore,
          hairTypeLabel: result.hairTypeLabel,
          hairThicknessLabel: result.hairThicknessLabel,
          metrics: result.metrics.map((m) => ({ name: m.name, value: m.value })),
        },
        { profileImage: user?.imageUrl, userName: user?.firstName ?? user?.username ?? undefined }
      ),
      format: shareFormat,
    };
  }, [result, shareFormat, user?.firstName, user?.imageUrl, user?.username]);

  // 공유 훅
  const { share, loading: shareLoading } = useAnalysisShare(
    shareData || { analysisType: 'hair', title: '', subtitle: '' },
    '이룸-헤어분석-결과'
  );

  // DB에서 분석 결과 조회
  const fetchAnalysis = useCallback(async () => {
    if (!isSignedIn || !analysisId || fetchedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('hair_analyses')
        .select(
          'id, clerk_user_id, image_url, hair_type, hair_thickness, scalp_type, hydration, scalp_health, damage_level, density, elasticity, shine, overall_score, concerns, recommendations, created_at'
        )
        .eq('id', analysisId)
        .single();

      if (dbError) {
        throw new Error('분석 결과를 불러올 수 없어요');
      }

      if (!data) {
        throw new Error('분석 결과를 찾을 수 없어요');
      }

      const dbData = data as DbHairAnalysis;
      const transformedResult = transformDbToResult(dbData);
      setResult(transformedResult);
      setImageUrl(dbData.image_url);
      if (dbData.recommendations?.usedMock) {
        setUsedMock(true);
      }
      fetchedRef.current = true;
    } catch (err) {
      console.error('[H-1] Fetch error:', err);

      // Fallback: sessionStorage에서 캐시된 데이터 복원
      try {
        const cached = sessionStorage.getItem(`hair-result-${analysisId}`);
        if (cached) {
          const { dbData } = JSON.parse(cached);
          if (dbData) {
            const transformedResult = transformDbToResult(dbData as DbHairAnalysis);
            setResult(transformedResult);
            setImageUrl(dbData.image_url);
            // 캐시 유지 — 다음 방문 시에도 fallback으로 사용 가능하도록
            setIsLoading(false);
            return;
          }
        }
      } catch {
        /* sessionStorage 복원 실패 무시 */
      }

      setError('결과를 불러오는 데 문제가 발생했어요');
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

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // 비로그인 상태
  if (!isSignedIn) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">{t('loginRequired')}</h2>
          <p className="text-muted-foreground mb-4">{t('loginRequiredDesc')}</p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t('signInAction')}
          </Link>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-muted">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('goToDashboard')}
                </Link>
              </Button>
              <Button onClick={handleNewAnalysis}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('newAnalysis')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const reliabilityLabel = (() => {
    if (!result) return t('confidenceNormal');
    if (result.analysisReliability === 'high') return t('confidenceHigh');
    if (result.analysisReliability === 'medium') return t('confidenceNormal');
    return t('confidenceLow');
  })();

  return (
    <>
      <div
        className="min-h-[calc(100vh-80px)] bg-muted"
        data-testid="hair-result-page"
        role="region"
        aria-label={t('pageAriaLabel.hair')}
      >
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 헤더 */}
          <header className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t('back')}
              </Link>
            </Button>
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-lg font-bold text-foreground">{t('pageTitle.hair')}</h1>
              <div className="flex items-center gap-2">
                <AIBadge variant="small" />
                {result && (
                  <span className="text-xs text-muted-foreground">
                    {t('confidence')} {reliabilityLabel}
                  </span>
                )}
                <ExpertModeToggle isExpert={isExpert} onToggle={toggleExpert} />
              </div>
            </div>
            <div className="w-16" />
          </header>

          {/* AI 분석 실패 시 Mock 데이터 알림 */}
          {usedMock && (
            <div className="mb-6">
              <MockDataNotice />
            </div>
          )}

          {/* 전문가 모드 데이터 패널 */}
          {isExpert && result && (
            <div className="mb-6">
              <ExpertDataPanel
                data={{
                  confidence: { high: 90, medium: 70, low: 40 }[result.analysisReliability] ?? 40,
                  usedMock,
                  analyzedAt: result.analyzedAt.toISOString(),
                  imageQuality: null,
                  evidenceSummary: { reliability: result.analysisReliability },
                }}
              />
            </div>
          )}

          {/* 탭 기반 결과 */}
          {result && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 sticky top-0 z-10 bg-muted">
                <TabsTrigger value="basic" className="gap-1" aria-label={t('basicAnalysisLabel')}>
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  {t('basicAnalysis')}
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-1" aria-label={t('careGuideLabel')}>
                  <ClipboardList className="w-4 h-4" aria-hidden="true" />
                  {t('careGuide')}
                </TabsTrigger>
              </TabsList>

              {/* 기본 분석 탭 */}
              <TabsContent value="basic" className="mt-0 space-y-6">
                {/* 통합 비주얼 리포트 카드 (헤어) */}
                <VisualReportCard
                  analysisType="hair"
                  overallScore={result.overallScore}
                  hairMetrics={result.metrics}
                  hairTypeLabel={result.hairTypeLabel}
                  analyzedAt={result.analyzedAt}
                />
                {scoreTrend && (
                  <div className="flex justify-center -mt-3">
                    <ScoreTrendChip trend={scoreTrend} />
                  </div>
                )}

                {/* 인사이트 */}
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-3">{t('analysisSummary')}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.insight}</p>
                </div>

                {/* 고민 태그 */}
                {result.concerns.length > 0 && (
                  <div className="bg-card rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-3">{t('mainConcerns')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.concerns.map((concern) => {
                        const concernData = HAIR_CONCERNS.find((c) => c.id === concern);
                        return (
                          <Badge key={concern} variant="secondary" className="text-sm">
                            {concernData?.emoji} {concernData?.label || '기타'}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* 케어 가이드 탭 */}
              <TabsContent value="details" className="mt-0 space-y-6">
                {/* 콘텐츠 없는 경우 안내 */}
                {result.recommendedIngredients.length === 0 &&
                  result.careTips.length === 0 &&
                  !imageUrl && (
                    <div className="bg-card rounded-xl p-8 shadow-sm text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-3">
                        <ClipboardList
                          className="w-6 h-6 text-amber-600 dark:text-amber-400"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="text-muted-foreground text-sm">{t('noCareGuide')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('reanalyzeForCare')}</p>
                    </div>
                  )}

                {/* 추천 케어 성분 */}
                {result.recommendedIngredients.length > 0 && (
                  <div className="bg-card rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-3">{t('careIngredients')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.recommendedIngredients.map((ingredient, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full text-sm"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 관리 방법 */}
                {result.careTips.length > 0 && (
                  <div className="bg-card rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-3">{t('careMethod')}</h3>
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
                    <h3 className="font-semibold mb-3">{t('analysisImage')}</h3>
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hair-images/${imageUrl}`}
                        alt="분석된 헤어 이미지"
                        fill
                        sizes="(max-width: 768px) 100vw, 512px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* 맞춤 헤어케어 제품 추천 */}
          {result && (
            <RecommendedProducts
              analysisType="hair"
              analysisResult={{
                hairType: result.hairType,
                scalpType: result.scalpType,
                hairConcerns: result.concerns as string[],
              }}
              className="mt-6"
            />
          )}

          {/* 헤어 스타일·염색 추천 안내 — 컷(×얼굴형)·염색(×퍼스널컬러)은 크로스축이라 종합 분석으로 유도 (ADR-107) */}
          {result && (
            <button
              onClick={() => router.push('/analysis/integrated')}
              className="mt-6 w-full text-left bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-900/20 rounded-xl border border-violet-200 dark:border-violet-800/30 p-5 hover:shadow-md transition-shadow"
              data-testid="hair-style-consult-cta"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-violet-500" aria-hidden="true" />
                <h3 className="font-semibold">어울리는 헤어스타일·염색 컬러는?</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                컷은 얼굴형, 염색은 퍼스널컬러를 함께 봐야 정확해요. 통합 분석에서 나에게 맞는 헤어
                스타일과 염색 컬러를 확인해보세요. →
              </p>
            </button>
          )}
        </div>
      </div>

      {/* 하단 액션 바 — sticky로 콘텐츠 가림 방지 */}
      {result && (
        <div className="sticky bottom-20 left-0 right-0 p-4 bg-card/80 dark:bg-card/90 backdrop-blur-sm border-t border-border/50 dark:border-border z-10">
          <div className="max-w-md mx-auto space-y-2">
            <Button
              className="w-full"
              onClick={() =>
                router.push(`/products?scalpType=${result.scalpType || ''}&category=haircare`)
              }
              aria-label={t('productRecommendLabel.hair')}
            >
              <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
              헤어 맞춤 제품 보기
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleNewAnalysis}
                aria-label={t('reanalyze')}
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('reanalyze')}
              </Button>
              <ShareButton onShare={share} loading={shareLoading} variant="outline" />
              <ShareThemePicker
                value={shareData?.theme ?? 'default'}
                onChange={() => {}}
                format={shareFormat}
                onFormatChange={setShareFormat}
                className="mt-2"
              />
              <PrintButton title={t('printTitle.hair')} variant="outline" />
            </div>
          </div>
        </div>
      )}

      {/* 하단 콘텐츠 — sticky 바 아래에 배치되어 스크롤 끝에서 노출 */}
      <div className="max-w-lg mx-auto px-4 pb-8">
        <div className="mt-2">
          <AnalysisMatchedProducts analysisType="hair" />
        </div>
        <div className="mt-4">
          <ProgressiveProfilePrompt moduleId="hair" />
        </div>
        <AITransparencyNotice compact className="mt-6" />
        <p className="text-xs text-muted-foreground text-center mt-4 px-2">
          분석 결과는 참고용이며, 전문가 진단을 대체하지 않아요
        </p>
        <ContextLinkingCard currentModule="hair" />
        <ResultPageInsights currentModule="hair" />
      </div>
    </>
  );
}
