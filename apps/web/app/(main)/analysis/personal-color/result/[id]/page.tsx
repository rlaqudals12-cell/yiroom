'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  ArrowLeft,
  RefreshCw,
  Palette,
  ClipboardList,
  AlertTriangle,
  Lightbulb,
  Sun,
  Sparkles,
} from 'lucide-react';
import { CelebrationEffect } from '@/components/animations';
import { Button } from '@/components/ui/button';
import {
  type PersonalColorResult,
  type SeasonType,
  type ToneType,
  type DepthType,
  SEASON_INFO,
  BEST_COLORS,
  WORST_COLORS,
  LIPSTICK_RECOMMENDATIONS,
  FOUNDATION_RECOMMENDATIONS,
  CLOTHING_RECOMMENDATIONS,
  STYLE_DESCRIPTIONS,
  EASY_INSIGHTS,
} from '@/lib/mock/personal-color';
import AnalysisResult from '../../_components/AnalysisResult';
import { RecommendedProducts } from '@/components/analysis/RecommendedProducts';
import { ShareButton } from '@/components/share';
import { ShareButtons } from '@/components/common/ShareButtons';
import { useAnalysisShare, createPersonalColorShareData } from '@/hooks/useAnalysisShare';
import Link from 'next/link';
import type { PersonalColorSeason } from '@/types/product';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnalysisEvidenceReport, {
  type AnalysisEvidence,
  type ImageQuality,
} from '@/components/analysis/AnalysisEvidenceReport';
import { VisualReportCard } from '@/components/analysis/visual-report';
import { DrapingSimulationTab } from '@/components/analysis/visual';
import DetailedEvidenceReport from '@/components/analysis/personal-color/DetailedEvidenceReport';
import { ConsultantCTA } from '@/components/coach/ConsultantCTA';
import { GenderAdaptiveAccessories } from '@/components/analysis/GenderAdaptiveAccessories';
import { Shirt } from 'lucide-react';

// DB 데이터 타입
interface DbPersonalColorAssessment {
  id: string;
  clerk_user_id: string;
  season: string;
  undertone: string | null;
  confidence: number | null;
  best_colors: Array<{ name: string; hex: string }> | null;
  worst_colors: Array<{ name: string; hex: string }> | null;
  makeup_recommendations: {
    lipstick?: Array<{ shade: string; hex: string; description?: string }>;
  } | null;
  fashion_recommendations: {
    tops?: string[];
    bottoms?: string[];
    accessories?: string[];
  } | null;
  image_analysis: {
    insight?: string;
    analysisEvidence?: AnalysisEvidence;
    imageQuality?: ImageQuality;
  } | null;
  face_image_url?: string; // DB 컬럼명과 일치
  created_at: string;
}

// 신뢰도 기준값 (이 미만이면 재분석 권장)
const LOW_CONFIDENCE_THRESHOLD = 70;

// 시즌별 톤/깊이 결정
function getSeasonToneDepth(seasonType: SeasonType): { tone: ToneType; depth: DepthType } {
  switch (seasonType) {
    case 'spring':
      return { tone: 'warm', depth: 'light' };
    case 'summer':
      return { tone: 'cool', depth: 'light' };
    case 'autumn':
      return { tone: 'warm', depth: 'deep' };
    case 'winter':
      return { tone: 'cool', depth: 'deep' };
  }
}

// DB → PersonalColorResult 변환 (Hybrid: DB는 핵심 데이터만, 표시용은 최신 Mock 사용)
function transformDbToResult(dbData: DbPersonalColorAssessment): PersonalColorResult {
  const seasonType = dbData.season.toLowerCase() as SeasonType;
  const info = SEASON_INFO[seasonType] || SEASON_INFO.spring;
  const { tone, depth } = getSeasonToneDepth(seasonType);

  // Hybrid 전략: 표시 데이터는 항상 최신 Mock 사용 (코드 업데이트 시 기존 사용자도 혜택)
  const mockBestColors = BEST_COLORS[seasonType] || [];
  const mockWorstColors = WORST_COLORS[seasonType] || [];
  const mockLipstick = LIPSTICK_RECOMMENDATIONS[seasonType] || [];
  const mockFoundation = FOUNDATION_RECOMMENDATIONS[seasonType] || [];
  const mockStyle = STYLE_DESCRIPTIONS[seasonType];
  const mockEasyInsight = EASY_INSIGHTS[seasonType]?.[0];

  return {
    seasonType,
    seasonLabel: info.label,
    seasonDescription: info.description,
    tone,
    depth,
    confidence: dbData.confidence || 85,
    // 컬러 데이터: 최신 Mock 사용 (초보자 친화 이름 적용)
    bestColors: mockBestColors,
    worstColors: mockWorstColors,
    // 립스틱 추천: 최신 Mock 사용
    lipstickRecommendations: mockLipstick,
    // 파운데이션 추천: 최신 Mock 사용
    foundationRecommendations: mockFoundation,
    // 의류 추천: Hybrid 전략 - 최신 Mock 사용 (DB 데이터는 무시, 최신 추천 제공)
    clothingRecommendations: CLOTHING_RECOMMENDATIONS[seasonType] || [],
    // 스타일 설명: 최신 Mock 사용
    styleDescription: mockStyle || {
      imageKeywords: ['화사한', '세련된'],
      makeupStyle: `${info.label}에 어울리는 자연스러운 메이크업`,
      fashionStyle: `${info.description}을 살리는 스타일`,
      accessories: '골드/실버 톤 악세서리',
    },
    // 인사이트: DB에 AI 분석 인사이트가 있으면 사용, 없으면 easyInsight
    insight:
      dbData.image_analysis?.insight ||
      mockEasyInsight?.summary ||
      `${info.label} 타입의 특징을 가지고 있어요! ${info.characteristics}`,
    // 초보자 친화 인사이트 추가
    easyInsight: mockEasyInsight,
    analyzedAt: new Date(dbData.created_at),
  };
}

export default function PersonalColorResultPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [result, setResult] = useState<PersonalColorResult | null>(null);
  const [analysisEvidence, setAnalysisEvidence] = useState<AnalysisEvidence | null>(null);
  const [imageQuality, setImageQuality] = useState<ImageQuality | null>(null);
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
    return createPersonalColorShareData({
      seasonType: result.seasonType,
      seasonLabel: result.seasonLabel,
      bestColors: result.bestColors,
    });
  }, [result]);

  // 공유 훅
  const { share, loading: shareLoading } = useAnalysisShare(
    shareData || { analysisType: 'personal-color', title: '', subtitle: '' },
    '이룸-퍼스널컬러-결과'
  );

  // API Route를 통해 분석 결과 조회 (JWT 문제 해결)
  const fetchAnalysis = useCallback(async () => {
    if (!isSignedIn || !analysisId || fetchedRef.current) return;

    fetchedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analyze/personal-color/${analysisId}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || '결과를 불러올 수 없습니다');
      }

      if (!json.data) {
        throw new Error('분석 결과를 찾을 수 없습니다');
      }

      const dbData = json.data as DbPersonalColorAssessment;
      const transformedResult = transformDbToResult(dbData);
      setResult(transformedResult);

      // 분석 근거 데이터 추출
      if (dbData.image_analysis?.analysisEvidence) {
        setAnalysisEvidence(dbData.image_analysis.analysisEvidence);
      }
      if (dbData.image_analysis?.imageQuality) {
        setImageQuality(dbData.image_analysis.imageQuality);
      }

      // 이미지 URL 저장 (드레이핑 시뮬레이션용)
      if (dbData.face_image_url) {
        setImageUrl(dbData.face_image_url);
      }

      // 새 분석인 경우에만 축하 효과 표시 (세션당 1회)
      const celebrationKey = `celebration-pc-${analysisId}`;
      if (!sessionStorage.getItem(celebrationKey)) {
        sessionStorage.setItem(celebrationKey, 'shown');
        setShowCelebration(true);
      }
    } catch (err) {
      console.error('[PC-1] Fetch error:', err);
      setError(err instanceof Error ? err.message : '결과를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, analysisId]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchAnalysis();
    }
  }, [isLoaded, isSignedIn, fetchAnalysis]);

  // 새로 분석하기 (forceNew 파라미터로 자동 리디렉트 방지)
  const handleNewAnalysis = useCallback(() => {
    router.push('/analysis/personal-color?forceNew=true');
  }, [router]);

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
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
    <main className="min-h-[calc(100vh-80px)] bg-muted">
      {/* 분석 완료 축하 효과 */}
      <CelebrationEffect
        type="analysis_complete"
        trigger={showCelebration}
        message="퍼스널 컬러 분석 완료!"
        onComplete={() => setShowCelebration(false)}
      />

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-1" />
              뒤로
            </Link>
          </Button>
          <h1 className="text-lg font-bold text-foreground">퍼스널 컬러 결과</h1>
          <div className="w-16" />
        </header>

        {/* 낮은 신뢰도 경고 배너 */}
        {result && result.confidence < LOW_CONFIDENCE_THRESHOLD && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">분석 신뢰도가 낮아요</p>
                <p className="text-sm text-amber-700 mt-1">
                  더 정확한 결과를 위해 밝은 자연광 아래에서 다시 촬영해보세요.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewAnalysis}
                  className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 분석하기
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 탭 기반 결과 */}
        {result && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 sticky top-0 z-10 bg-muted">
              <TabsTrigger value="basic" className="gap-1">
                <Palette className="w-4 h-4" />
                기본 분석
              </TabsTrigger>
              <TabsTrigger value="draping" className="gap-1">
                <Shirt className="w-4 h-4" />
                드레이핑
              </TabsTrigger>
              <TabsTrigger value="detailed" className="gap-1">
                <ClipboardList className="w-4 h-4" />
                상세 리포트
              </TabsTrigger>
            </TabsList>

            {/* 기본 분석 탭 */}
            <TabsContent value="basic" className="mt-0">
              {/* 비주얼 리포트 카드 */}
              <VisualReportCard
                analysisType="personal-color"
                overallScore={result.confidence}
                seasonType={result.seasonType}
                seasonLabel={result.seasonLabel}
                confidence={result.confidence}
                bestColors={result.bestColors}
                analyzedAt={result.analyzedAt}
                className="mb-6"
              />

              {/* 환경 요인 안내 카드 */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">알아두세요</p>
                    <ul className="text-xs text-muted-foreground mt-1.5 space-y-1">
                      <li className="flex items-start gap-1.5">
                        <Sun className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
                        <span>조명/메이크업에 따라 결과가 달라질 수 있어요</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" />
                        <span>염색은 피부톤에 영향 없지만 분석 정확도에 영향을 줄 수 있어요</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <AnalysisResult
                result={result}
                onRetry={handleNewAnalysis}
                evidence={analysisEvidence}
              />

              {/* 분석 근거 리포트 (메인 탭에 직접 표시) */}
              {(analysisEvidence || imageQuality) && (
                <AnalysisEvidenceReport
                  evidence={analysisEvidence}
                  imageQuality={imageQuality}
                  seasonType={result.seasonType}
                  tone={result.tone}
                  className="mt-6"
                />
              )}

              {/* 성별 적응형 악세서리 추천 (K-1) */}
              <GenderAdaptiveAccessories seasonType={result.seasonType} className="mt-6" />

              {/* 맞춤 추천 제품 */}
              <RecommendedProducts
                analysisType="personal-color"
                analysisResult={{
                  seasonType: (result.seasonType.charAt(0).toUpperCase() +
                    result.seasonType.slice(1)) as PersonalColorSeason,
                }}
                className="mt-8"
              />

              {/* AI 컬러 상담 CTA */}
              <div className="mt-6 p-4 bg-card rounded-xl border border-border">
                <ConsultantCTA
                  category="personalColor"
                  params={{ season: result.seasonType }}
                  showQuickQuestions
                />
              </div>

              {/* 액션 버튼 (탭 내부) */}
              <div className="mt-8 mb-4 space-y-2">
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(`/products?season=${result.seasonType}&category=makeup`)
                  }
                >
                  <Palette className="w-4 h-4 mr-2" />내 색상에 맞는 제품
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleNewAnalysis}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    다시 분석하기
                  </Button>
                  <ShareButton onShare={share} loading={shareLoading} variant="outline" />
                </div>
                {/* 소셜 공유 버튼 */}
                <div className="flex justify-center">
                  <ShareButtons
                    content={{
                      title: `나의 퍼스널 컬러는 ${result?.seasonType?.toUpperCase() || ''} 타입!`,
                      description: '이룸에서 AI 퍼스널 컬러 진단 받아보세요',
                      url: typeof window !== 'undefined' ? window.location.href : '',
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            {/* 드레이핑 시뮬레이션 탭 */}
            <TabsContent value="draping" className="mt-0" data-testid="draping-tab">
              {imageUrl ? (
                <DrapingSimulationTab imageUrl={imageUrl} className="w-full" />
              ) : (
                <div className="p-6 bg-card rounded-xl border text-center">
                  <Shirt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">드레이핑 시뮬레이션</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    분석 이미지가 없어 드레이핑을 미리볼 수 없어요.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    다시 분석하면 드레이핑 시뮬레이션을 사용할 수 있어요.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* 상세 리포트 탭 */}
            <TabsContent value="detailed" className="mt-0">
              {/* 시각적 상세 리포트 */}
              <DetailedEvidenceReport
                evidence={analysisEvidence}
                imageQuality={imageQuality}
                seasonType={result.seasonType}
                tone={result.tone}
                bestColors={result.bestColors}
                worstColors={result.worstColors}
              />

              {/* 기존 분석 근거 (텍스트) */}
              {(analysisEvidence || imageQuality) && (
                <AnalysisEvidenceReport
                  evidence={analysisEvidence}
                  imageQuality={imageQuality}
                  seasonType={result.seasonType}
                  tone={result.tone}
                  className="mt-4"
                />
              )}

              {/* 분석 정확도 안내 */}
              <div className="mt-6 p-5 bg-card rounded-xl border border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-500" />더 정확한 결과를 위한 팁
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Sun className="w-4 h-4 text-amber-500 mt-0.5" />
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">자연광</span>에서 촬영하면
                      피부톤 왜곡이 적어요
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-rose-500 mt-0.5" />
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">노메이크업</span> 상태가 가장
                      정확해요
                    </p>
                  </div>
                </div>
              </div>

              {/* AI 컬러 상담 CTA */}
              <div className="mt-6 p-4 bg-card rounded-xl border border-border">
                <ConsultantCTA
                  category="personalColor"
                  params={{ season: result.seasonType }}
                  showQuickQuestions
                />
              </div>

              {/* 액션 버튼 */}
              <div className="mt-8 mb-4 space-y-2">
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(`/products?season=${result.seasonType}&category=makeup`)
                  }
                >
                  <Palette className="w-4 h-4 mr-2" />내 색상에 맞는 제품
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleNewAnalysis}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    다시 분석하기
                  </Button>
                  <ShareButton onShare={share} loading={shareLoading} variant="outline" />
                </div>
                {/* 소셜 공유 버튼 */}
                <div className="flex justify-center">
                  <ShareButtons
                    content={{
                      title: `나의 퍼스널 컬러는 ${result?.seasonType?.toUpperCase() || ''} 타입!`,
                      description: '이룸에서 AI 퍼스널 컬러 진단 받아보세요',
                      url: typeof window !== 'undefined' ? window.location.href : '',
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
