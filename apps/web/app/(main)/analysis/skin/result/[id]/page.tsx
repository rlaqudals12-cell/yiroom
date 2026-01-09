'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import {
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Eye,
  ClipboardList,
  Lightbulb,
  Sun,
  Droplets,
} from 'lucide-react';
import { CelebrationEffect } from '@/components/animations';
import { Button } from '@/components/ui/button';
import { type SkinAnalysisResult, type SkinTypeId, EASY_SKIN_TIPS } from '@/lib/mock/skin-analysis';
import AnalysisResult from '../../_components/AnalysisResult';
import { RecommendedProducts } from '@/components/analysis/RecommendedProducts';
import { ShareButton } from '@/components/share';
import { useAnalysisShare, createSkinShareData } from '@/hooks/useAnalysisShare';
import Link from 'next/link';
import type { SkinType as ProductSkinType, SkinConcern } from '@/types/product';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisualAnalysisTab } from '@/components/analysis/visual';
import SkinAnalysisEvidenceReport, {
  type SkinAnalysisEvidence,
  type SkinImageQuality,
} from '@/components/analysis/SkinAnalysisEvidenceReport';
import {
  VisualReportCard,
  FaceZoneMap,
  SkinVitalityScore,
  ZoneDetailCard,
  PhotoOverlayMap,
  TrendChart,
  type MetricItem,
  type ZoneStatus,
  type FaceZoneMapProps,
} from '@/components/analysis/visual-report';
import type { MetricStatus } from '@/lib/mock/skin-analysis';

// 존 ID 타입 (FaceZoneMapProps에서 추출)
type FaceZoneId = keyof NonNullable<FaceZoneMapProps['zones']>;

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

// DB 데이터 → AnalysisResult props 변환 (Hybrid: DB는 핵심 데이터만, 표시용은 최신 Mock 사용)
function transformDbToResult(dbData: DbSkinAnalysis): SkinAnalysisResult {
  // 메트릭 생성 헬퍼
  const createMetric = (id: string, name: string, value: number) => ({
    id,
    name,
    value,
    status: getStatus(value),
    description: getDescription(name, value),
  });

  // Hybrid 전략: 표시 데이터는 항상 최신 Mock 사용 (코드 업데이트 시 기존 사용자도 혜택)
  const skinType = dbData.skin_type?.toLowerCase() as SkinTypeId | undefined;
  const mockEasySkinTip = skinType ? EASY_SKIN_TIPS[skinType] : undefined;

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
    // Hybrid 데이터: 초보자 친화 팁 (최신 Mock 사용)
    easySkinTip: mockEasySkinTip,
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
    analysisEvidence?: SkinAnalysisEvidence;
    imageQuality?: SkinImageQuality;
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysisEvidence, setAnalysisEvidence] = useState<SkinAnalysisEvidence | null>(null);
  const [imageQuality, setImageQuality] = useState<SkinImageQuality | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [selectedZone, setSelectedZone] = useState<FaceZoneId | null>(null);
  // 트렌드 데이터 (과거 분석 기록)
  const [trendData, setTrendData] = useState<Array<{ date: Date; score: number }>>([]);
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

  // 얼굴 존 상태 계산 (메트릭 기반) - FaceZoneMapProps.zones 형식
  const zoneStatuses = useMemo((): FaceZoneMapProps['zones'] => {
    if (!result) return {};

    const getMetricValue = (id: string) => result.metrics.find((m) => m.id === id)?.value ?? 50;

    // 존별 점수 계산 헬퍼
    const calcZone = (name: string, ...metricIds: string[]): ZoneStatus => {
      const avg = Math.round(
        metricIds.reduce((sum, id) => sum + getMetricValue(id), 0) / metricIds.length
      );
      return { score: avg, status: getStatus(avg), label: name };
    };

    // 각 존에 가장 관련된 메트릭으로 점수 계산
    return {
      forehead: calcZone('이마', 'oil', 'pores'),
      tZone: calcZone('T존', 'oil', 'pores'),
      eyes: calcZone('눈가', 'wrinkles', 'pigmentation'),
      cheeks: calcZone('볼', 'hydration', 'sensitivity'),
      uZone: calcZone('U존', 'hydration', 'sensitivity'),
      chin: calcZone('턱', 'pores', 'oil'),
    };
  }, [result]);

  // 피부 활력도 점수 및 요인 계산
  const vitalityData = useMemo(() => {
    if (!result) return { score: 0, factors: { positive: [], negative: [] } };

    // 활력도 = 전체 메트릭의 가중 평균
    const score = result.overallScore;
    const positive: string[] = [];
    const negative: string[] = [];

    result.metrics.forEach((m) => {
      if (m.value >= 71) {
        positive.push(`${m.name} 우수`);
      } else if (m.value <= 40) {
        negative.push(`${m.name} 개선 필요`);
      }
    });

    return { score, factors: { positive, negative } };
  }, [result]);

  // 선택된 존 상세 정보
  const selectedZoneDetail = useMemo(() => {
    if (!selectedZone || !result || !zoneStatuses) return null;

    const zone = zoneStatuses[selectedZone];
    if (!zone) return null;

    // 존별 관련 문제 및 추천 (메트릭 기반 동적 생성)
    const getZoneConcerns = (zoneId: FaceZoneId): string[] => {
      const concerns: string[] = [];
      const getMetric = (id: string) => result.metrics.find((m) => m.id === id);

      if (zoneId === 'forehead' || zoneId === 'tZone' || zoneId === 'chin') {
        const oil = getMetric('oil');
        const pores = getMetric('pores');
        if (oil && oil.value <= 40) concerns.push('유분이 많은 편이에요');
        if (pores && pores.value <= 40) concerns.push('모공이 눈에 띄어요');
      }
      if (zoneId === 'eyes') {
        const wrinkles = getMetric('wrinkles');
        const pigmentation = getMetric('pigmentation');
        if (wrinkles && wrinkles.value <= 40) concerns.push('잔주름이 보여요');
        if (pigmentation && pigmentation.value <= 40) concerns.push('다크서클이 있어요');
      }
      if (zoneId === 'cheeks' || zoneId === 'uZone') {
        const hydration = getMetric('hydration');
        const sensitivity = getMetric('sensitivity');
        if (hydration && hydration.value <= 40) concerns.push('수분이 부족해요');
        if (sensitivity && sensitivity.value <= 40) concerns.push('민감한 편이에요');
      }
      return concerns;
    };

    const getZoneRecommendations = (zoneId: FaceZoneId): string[] => {
      const recs: string[] = [];
      const getMetric = (id: string) => result.metrics.find((m) => m.id === id);

      if (zoneId === 'forehead' || zoneId === 'tZone' || zoneId === 'chin') {
        const oil = getMetric('oil');
        const pores = getMetric('pores');
        if (oil && oil.value <= 40) recs.push('BHA 성분 토너 사용');
        if (pores && pores.value <= 40) recs.push('주 2회 클레이 마스크');
      }
      if (zoneId === 'eyes') {
        const wrinkles = getMetric('wrinkles');
        if (wrinkles && wrinkles.value <= 40) recs.push('아이크림 사용');
        recs.push('자외선 차단 철저');
      }
      if (zoneId === 'cheeks' || zoneId === 'uZone') {
        const hydration = getMetric('hydration');
        if (hydration && hydration.value <= 40) recs.push('히알루론산 세럼 사용');
        recs.push('수분 마스크 주 2-3회');
      }
      return recs;
    };

    return {
      zoneId: selectedZone,
      zoneName: zone.label,
      score: zone.score,
      status: zone.status as MetricStatus,
      concerns: getZoneConcerns(selectedZone),
      recommendations: getZoneRecommendations(selectedZone),
    };
  }, [selectedZone, result, zoneStatuses]);

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
      setImageUrl(dbData.image_url);

      // 분석 근거 데이터 추출
      if (dbData.recommendations?.analysisEvidence) {
        setAnalysisEvidence(dbData.recommendations.analysisEvidence);
      }
      if (dbData.recommendations?.imageQuality) {
        setImageQuality(dbData.recommendations.imageQuality);
      }

      // 새 분석인 경우에만 축하 효과 표시 (세션당 1회)
      const celebrationKey = `celebration-skin-${analysisId}`;
      if (!sessionStorage.getItem(celebrationKey)) {
        sessionStorage.setItem(celebrationKey, 'shown');
        setShowCelebration(true);
      }

      // 트렌드 데이터 조회 (최근 6개)
      const { data: trendRecords } = await supabase
        .from('skin_analyses')
        .select('overall_score, created_at')
        .order('created_at', { ascending: true })
        .limit(6);

      if (trendRecords && trendRecords.length > 0) {
        setTrendData(
          trendRecords.map((r) => ({
            date: new Date(r.created_at),
            score: r.overall_score,
          }))
        );
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

  // 새로 분석하기 (forceNew 파라미터로 자동 리디렉트 방지)
  const handleNewAnalysis = useCallback(() => {
    router.push('/analysis/skin?forceNew=true');
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

          {/* 탭 기반 결과 */}
          {result && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 sticky top-0 z-10 bg-muted">
                <TabsTrigger value="basic" className="gap-1">
                  <Sparkles className="w-4 h-4" />
                  기본 분석
                </TabsTrigger>
                <TabsTrigger value="evidence" className="gap-1">
                  <ClipboardList className="w-4 h-4" />
                  분석 근거
                </TabsTrigger>
                <TabsTrigger value="visual" className="gap-1">
                  <Eye className="w-4 h-4" />
                  시각화
                </TabsTrigger>
              </TabsList>

              {/* 기본 분석 탭 */}
              <TabsContent value="basic" className="mt-0">
                {/* 비주얼 리포트 카드 */}
                <VisualReportCard
                  analysisType="skin"
                  overallScore={result.overallScore}
                  skinMetrics={result.metrics.map(
                    (m): MetricItem => ({
                      id: m.id,
                      name: m.name,
                      value: m.value,
                      description: m.description,
                    })
                  )}
                  analyzedAt={result.analyzedAt}
                  className="mb-6"
                />

                {/* 피부 활력도 점수 */}
                <SkinVitalityScore
                  score={vitalityData.score}
                  factors={vitalityData.factors}
                  showDetails
                  className="mb-6"
                />

                {/* 환경 요인 안내 카드 */}
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                      <Lightbulb
                        className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">알아두세요</p>
                      <ul className="text-xs text-muted-foreground mt-1.5 space-y-1">
                        <li className="flex items-start gap-1.5">
                          <Sun
                            className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500"
                            aria-hidden="true"
                          />
                          <span>조명/메이크업에 따라 결과가 달라질 수 있어요</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Droplets
                            className="w-3 h-3 mt-0.5 flex-shrink-0 text-sky-500"
                            aria-hidden="true"
                          />
                          <span>메이크업이 있으면 피부 상태 분석 정확도가 낮아져요</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Sparkles
                            className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500"
                            aria-hidden="true"
                          />
                          <span>노메이크업 상태에서 촬영하면 가장 정확해요</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <AnalysisResult
                  result={result}
                  onRetry={handleNewAnalysis}
                  evidence={analysisEvidence}
                  skinType={skinType || undefined}
                />

                {/* 분석 근거 리포트 (메인 탭에 직접 표시) */}
                {(analysisEvidence || imageQuality) && (
                  <SkinAnalysisEvidenceReport
                    evidence={analysisEvidence}
                    imageQuality={imageQuality}
                    skinType={skinType || 'normal'}
                    overallScore={result.overallScore}
                    className="mt-6"
                  />
                )}

                {/* 맞춤 추천 제품 */}
                {skinType && (
                  <RecommendedProducts
                    analysisType="skin"
                    analysisResult={{
                      skinType: skinType as ProductSkinType,
                      skinConcerns: result.metrics
                        .filter((m) => m.status === 'warning')
                        .map((m) => {
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
              </TabsContent>

              {/* 분석 근거 탭 */}
              <TabsContent value="evidence" className="mt-0 pb-32">
                {analysisEvidence || imageQuality ? (
                  <SkinAnalysisEvidenceReport
                    evidence={analysisEvidence}
                    imageQuality={imageQuality}
                    skinType={skinType || 'normal'}
                    overallScore={result.overallScore}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>분석 근거 데이터가 없습니다</p>
                    <p className="text-sm mt-1">새로 분석하면 상세 근거가 제공됩니다</p>
                  </div>
                )}
              </TabsContent>

              {/* 상세 시각화 탭 (S-1+) */}
              <TabsContent value="visual" className="mt-0 pb-32 space-y-6">
                {/* 트렌드 차트 (과거 분석 이력) */}
                <TrendChart data={trendData} metric="overall" showGoal goalScore={80} />

                {/* 사진 오버레이 맵 (실제 사진 + 존 상태) */}
                {imageUrl && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      사진 기반 분석 결과
                    </h3>
                    <PhotoOverlayMap
                      imageUrl={imageUrl}
                      zones={zoneStatuses as Record<string, ZoneStatus>}
                      onZoneClick={(zoneId) => setSelectedZone(zoneId as FaceZoneId)}
                      showLabels
                      opacity={0.5}
                    />
                  </div>
                )}

                {/* 얼굴 존 맵 (도식화) */}
                <div className="flex flex-col items-center">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    영역별 상태 (탭하여 상세 보기)
                  </h3>
                  <FaceZoneMap
                    zones={zoneStatuses}
                    showLabels
                    showScores
                    size="lg"
                    highlightWorst
                    onZoneClick={(zoneId) => setSelectedZone(zoneId as FaceZoneId)}
                  />
                </div>

                {/* 선택된 존 상세 카드 */}
                {selectedZoneDetail && (
                  <ZoneDetailCard
                    zoneId={selectedZoneDetail.zoneId}
                    zoneName={selectedZoneDetail.zoneName}
                    score={selectedZoneDetail.score}
                    status={selectedZoneDetail.status}
                    concerns={selectedZoneDetail.concerns}
                    recommendations={selectedZoneDetail.recommendations}
                    onClose={() => setSelectedZone(null)}
                  />
                )}

                {/* 기존 시각화 (이미지 기반) */}
                {imageUrl ? (
                  <VisualAnalysisTab imageUrl={imageUrl} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    시각화에 필요한 이미지가 없습니다
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
              onClick={() => router.push(`/products?skinType=${skinType || ''}&category=skincare`)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              피부 맞춤 제품 보기
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
