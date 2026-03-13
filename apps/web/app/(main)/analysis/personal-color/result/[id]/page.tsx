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
import { ShareButton, PrintButton, ShareThemePicker } from '@/components/share';
import type { ShareCardFormat } from '@/components/share';
import { ShareButtons } from '@/components/common/ShareButtons';
import { useAnalysisShare, createPersonalColorShareData } from '@/hooks/useAnalysisShare';
import Link from 'next/link';
import type { PersonalColorSeason } from '@/types/product';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AnalysisEvidence, ImageQuality } from '@/components/analysis/AnalysisEvidenceReport';
import { VisualReportCard } from '@/components/analysis/visual-report';
import { DrapingSimulationTab } from '@/components/analysis/visual';
import DetailedEvidenceReport from '@/components/analysis/personal-color/DetailedEvidenceReport';
import { ConsultantCTA } from '@/components/coach/ConsultantCTA';
import { GenderAdaptiveAccessories } from '@/components/analysis/GenderAdaptiveAccessories';
import { ContextLinkingCard } from '@/components/analysis/ContextLinkingCard';
import { ResultPageInsights } from '@/components/insights';
import { Camera, Shirt, History, Wand2, GitCompareArrows } from 'lucide-react';
import { AIBadge, AITransparencyNotice } from '@/components/common/AIBadge';
import { MockDataNotice } from '@/components/common/MockDataNotice';
import { useTranslations } from 'next-intl';
import { SeasonEducationModal } from '@/components/analysis/personal-color/SeasonEducationModal';
import { useExpertMode } from '@/hooks/useExpertMode';
import { ExpertModeToggle } from '@/components/analysis/ExpertModeToggle';
import { ExpertDataPanel } from '@/components/analysis/ExpertDataPanel';

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
    usedMock?: boolean; // AI 분석 실패 시 Mock 데이터 사용 여부
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

  // 서브톤 라벨 생성: DB undertone 우선, 없으면 시즌 기반 fallback
  const TONE_LABELS: Record<string, string> = { warm: '웜톤', cool: '쿨톤', neutral: '뉴트럴' };
  const toneLabel = dbData.undertone
    ? (TONE_LABELS[dbData.undertone] ?? '뉴트럴')
    : (TONE_LABELS[tone] ?? '웜톤');
  const depthLabel = depth === 'light' ? '라이트' : '딥';
  const undertoneLabel = `${toneLabel} · ${depthLabel}`;

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
    undertoneLabel,
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
  const t = useTranslations('analysis');
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [result, setResult] = useState<PersonalColorResult | null>(null);
  const [analysisEvidence, setAnalysisEvidence] = useState<AnalysisEvidence | null>(null);
  const [imageQuality, setImageQuality] = useState<ImageQuality | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 일시적 에러(5xx) 시 재시도 가능 여부
  const [isRetryable, setIsRetryable] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [showEducation, setShowEducation] = useState(false);
  // AI Fallback 사용 여부 (AI 분석 실패 시 Mock 데이터 사용)
  const [usedMock, setUsedMock] = useState(false);
  const { isExpert, toggleExpert } = useExpertMode();
  const fetchedRef = useRef(false);
  // 현재 URL (hydration 불일치 방지를 위해 클라이언트에서만 설정)
  const [currentUrl, setCurrentUrl] = useState('');

  const analysisId = params.id as string;

  // 공유 카드 데이터
  const [shareFormat, setShareFormat] = useState<ShareCardFormat>('1:1');
  const shareData = useMemo(() => {
    if (!result) return null;
    return {
      ...createPersonalColorShareData({
        seasonType: result.seasonType,
        seasonLabel: result.seasonLabel,
        bestColors: result.bestColors,
      }),
      format: shareFormat,
    };
  }, [result, shareFormat]);

  // 공유 훅
  const { share, loading: shareLoading } = useAnalysisShare(
    shareData || { analysisType: 'personal-color', title: '', subtitle: '' },
    '이룸-퍼스널컬러-결과'
  );

  // API Route를 통해 분석 결과 조회 (JWT 문제 해결)
  // eslint-disable-next-line sonarjs/cognitive-complexity -- result page render
  const fetchAnalysis = useCallback(async () => {
    if (!isSignedIn || !analysisId || fetchedRef.current) return;

    fetchedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analyze/personal-color/${analysisId}`);
      const json = await response.json();

      if (!response.ok) {
        // 5xx 에러는 일시적 실패 → 재시도 가능
        const retryable = response.status >= 500;
        setIsRetryable(retryable);
        throw new Error(
          json.error || (retryable ? '서버에 일시적인 문제가 있어요' : '결과를 불러올 수 없어요')
        );
      }

      if (!json.data) {
        throw new Error('분석 결과를 찾을 수 없어요');
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
      // AI Fallback 사용 여부 (AI 분석 실패 시 Mock 데이터 사용)
      if (dbData.image_analysis?.usedMock) {
        setUsedMock(true);
      }
    } catch (err) {
      console.error('[PC-1] Fetch error:', err);

      // Fallback: sessionStorage에서 캐시된 데이터 복원
      try {
        const cached = sessionStorage.getItem(`pc-result-${analysisId}`);
        if (cached) {
          const { dbData } = JSON.parse(cached);
          if (dbData) {
            const transformedResult = transformDbToResult(dbData as DbPersonalColorAssessment);
            setResult(transformedResult);
            if (dbData.image_analysis?.analysisEvidence) {
              setAnalysisEvidence(dbData.image_analysis.analysisEvidence);
            }
            if (dbData.image_analysis?.imageQuality) {
              setImageQuality(dbData.image_analysis.imageQuality);
            }
            if (dbData.face_image_url) {
              setImageUrl(dbData.face_image_url);
            }
            if (dbData.image_analysis?.usedMock) {
              setUsedMock(true);
            }
            // 캐시 유지 — 다음 방문 시에도 fallback으로 사용 가능하도록
            setIsLoading(false);
            return;
          }
        }
      } catch {
        /* sessionStorage 복원 실패 무시 */
      }

      setError('결과를 불러올 수 없어요. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, analysisId]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchAnalysis();
    }
  }, [isLoaded, isSignedIn, fetchAnalysis]);

  // 클라이언트에서만 URL 설정 (hydration 불일치 방지)
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  // 다시 시도 (일시적 에러 시 재조회)
  const handleRetry = useCallback(() => {
    fetchedRef.current = false;
    setError(null);
    setIsRetryable(false);
    fetchAnalysis();
  }, [fetchAnalysis]);

  // 새로 분석하기 (forceNew 파라미터로 자동 리디렉트 방지)
  const handleNewAnalysis = useCallback(() => {
    router.push('/analysis/personal-color?forceNew=true');
  }, [router]);

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
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
            로그인하기
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
              {isRetryable ? (
                <Button onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('retry')}
                </Button>
              ) : (
                <Button onClick={handleNewAnalysis}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('newAnalysis')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-muted"
      role="region"
      aria-label={t('pageAriaLabel.personalColor')}
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
            <h1 className="text-lg font-bold text-foreground">{t('pageTitle.personalColor')}</h1>
            <AIBadge variant="small" />
            <ExpertModeToggle isExpert={isExpert} onToggle={toggleExpert} />
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/analysis/personal-color/history">
              <History className="w-4 h-4 mr-1" />
              {t('previousResults')}
            </Link>
          </Button>
        </header>

        {/* 이전 결과 비교 링크 */}
        <div className="mb-4" data-testid="pc-compare-link">
          <Link
            href="/analysis/compare?type=personal-color"
            className="flex items-center gap-2 p-3 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors text-sm"
          >
            <GitCompareArrows className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">{t('comparePrevious')}</span>
            <span className="ml-auto text-primary text-xs">비교하기 →</span>
          </Link>
        </div>

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
                confidence: result.confidence,
                usedMock: usedMock,
                analyzedAt: result.analyzedAt,
                imageQuality: imageQuality,
                evidenceSummary: analysisEvidence
                  ? {
                      ...(analysisEvidence.veinColor
                        ? { 'Vein Color': analysisEvidence.veinColor }
                        : {}),
                      ...(analysisEvidence.skinUndertone
                        ? { 'Skin Undertone': analysisEvidence.skinUndertone }
                        : {}),
                      ...(analysisEvidence.lipNaturalColor
                        ? { 'Lip Color': analysisEvidence.lipNaturalColor }
                        : {}),
                    }
                  : null,
              }}
            />
          </div>
        )}

        {/* 낮은 신뢰도 경고 배너 */}
        {result && result.confidence < LOW_CONFIDENCE_THRESHOLD && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{t('lowConfidence')}</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  더 정확한 결과를 위해 밝은 자연광 아래에서 다시 촬영해보세요.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewAnalysis}
                  className="mt-3 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
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
                {t('basicAnalysis')}
              </TabsTrigger>
              <TabsTrigger value="draping" className="gap-1">
                <Shirt className="w-4 h-4" />
                {t('colorDraping')}
              </TabsTrigger>
              <TabsTrigger value="detailed" className="gap-1">
                <ClipboardList className="w-4 h-4" />
                {t('detailedReport')}
              </TabsTrigger>
            </TabsList>

            {/* 기본 분석 탭 */}
            <TabsContent
              value="basic"
              className="mt-0 data-[state=inactive]:hidden"
              data-testid="basic-tab"
            >
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
                onTabChange={setActiveTab}
              />

              {/* P16: 시즌별 교육 콘텐츠 트리거 */}
              <button
                type="button"
                className="w-full p-3 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors text-left flex items-center gap-3 cursor-pointer"
                onClick={() => setShowEducation(true)}
                data-testid="season-education-trigger"
              >
                <Wand2 className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    왜 {result.seasonLabel} 타입인가요?
                  </p>
                  <p className="text-xs text-muted-foreground">색채학 원리로 알아보기</p>
                </div>
                <span className="text-xs text-primary">자세히 →</span>
              </button>

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

              {/* AI 컬러 상담 + 투명성 고지 (접힘 기본) */}
              <details className="mt-6 bg-card rounded-xl border border-border">
                <summary className="p-4 cursor-pointer text-sm font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI 컬러 상담 받기
                </summary>
                <div className="px-4 pb-4">
                  <ConsultantCTA
                    category="personalColor"
                    params={{ season: result.seasonType }}
                    showQuickQuestions
                  />
                  <AITransparencyNotice compact className="mt-4" />
                </div>
              </details>

              {/* P7: 드레이핑 시뮬레이션 연결 배너 */}
              <div className="mt-6 mb-4">
                <button
                  type="button"
                  className="w-full p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors text-left flex items-center gap-3 cursor-pointer"
                  onClick={() => {
                    if (imageUrl) {
                      setActiveTab('draping');
                    }
                  }}
                  disabled={!imageUrl}
                >
                  <Shirt className="w-8 h-8 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{t('tryColorOnPhoto')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {imageUrl
                        ? '드레이핑 탭에서 내 얼굴에 시즌 컬러를 입혀볼 수 있어요'
                        : '분석 이미지가 없어 이용할 수 없어요. 다시 분석해보세요'}
                    </p>
                  </div>
                  {imageUrl && <span className="text-primary text-sm">→</span>}
                </button>
              </div>
            </TabsContent>

            {/* 드레이핑 시뮬레이션 탭 - 조건부 렌더링으로 canvas 오버플로우 방지 */}
            <TabsContent
              value="draping"
              className="mt-0 data-[state=inactive]:hidden"
              data-testid="draping-tab"
            >
              {activeTab === 'draping' && imageUrl && (
                <DrapingSimulationTab
                  imageUrl={imageUrl}
                  userSeason={result.seasonType}
                  className="w-full"
                />
              )}
              {activeTab === 'draping' && !imageUrl && (
                <div className="p-6 bg-card rounded-xl border text-center">
                  <Shirt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">{t('colorDraping')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    분석 이미지가 없어 색상을 입혀볼 수 없어요.
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    다시 분석하면 내 얼굴에 색상을 입혀볼 수 있어요.
                  </p>
                  <Button onClick={handleNewAnalysis} variant="outline" size="sm">
                    <Camera className="w-4 h-4 mr-1.5" />
                    다시 분석하기
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* 상세 리포트 탭 */}
            <TabsContent
              value="detailed"
              className="mt-0 data-[state=inactive]:hidden"
              data-testid="detailed-tab"
            >
              {/* 시각적 상세 리포트 */}
              <DetailedEvidenceReport
                evidence={analysisEvidence}
                imageQuality={imageQuality}
                seasonType={result.seasonType}
                tone={result.tone}
                bestColors={result.bestColors}
                worstColors={result.worstColors}
              />

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

              {/* P2: 상세 탭 하단 CTA */}
              <div className="mt-6 flex flex-col items-center gap-2 text-sm">
                <button
                  type="button"
                  className="text-primary hover:underline underline-offset-2 cursor-pointer"
                  onClick={() =>
                    router.push(`/products?season=${result.seasonType}&category=makeup`)
                  }
                >
                  <Palette className="w-3.5 h-3.5 inline-block mr-1" />
                  맞춤 제품 보기
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() => setActiveTab('basic')}
                >
                  {t('viewBasicAnalysis')}
                </button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* P14: 하단 액션 바 — sticky로 콘텐츠 가림 방지 */}
      {result && (
        <div className="sticky bottom-20 left-0 right-0 p-4 bg-card/80 dark:bg-card/90 backdrop-blur-sm border-t border-border/50 dark:border-border z-10">
          <div className="max-w-md mx-auto space-y-2">
            <Button
              className="w-full"
              onClick={() => router.push(`/products?season=${result.seasonType}&category=makeup`)}
            >
              <Palette className="w-4 h-4 mr-2" />내 색상에 맞는 제품
            </Button>
            {/* P15: 가상 메이크업 체험 */}
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push(`/style/virtual-try-on?season=${result.seasonType}`)}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              가상 메이크업 체험
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleNewAnalysis}>
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 분석하기
              </Button>
              <ShareButton onShare={share} loading={shareLoading} variant="outline" />
              <ShareThemePicker
                value={shareData?.theme ?? 'default'}
                onChange={() => {}}
                format={shareFormat}
                onFormatChange={setShareFormat}
                className="mt-2"
              />
              <PrintButton title="이룸 퍼스널 컬러 분석 결과" variant="outline" />
            </div>
            {/* 소셜 공유 버튼 */}
            <div className="flex justify-center">
              <ShareButtons
                content={{
                  title: `나의 퍼스널 컬러는 ${result?.seasonLabel || ''} 타입!`,
                  description: '이룸에서 나만의 퍼스널 컬러를 알아보세요',
                  url: currentUrl,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 하단 콘텐츠 — sticky 바 아래에 배치되어 스크롤 끝에서 노출 */}
      {result && (
        <div className="max-w-lg mx-auto px-4 pb-8">
          <ContextLinkingCard currentModule="personal-color" />
          <ResultPageInsights currentModule="personal-color" />
          <AITransparencyNotice compact className="mt-4" />
        </div>
      )}

      {/* P16: 시즌별 교육 콘텐츠 모달 */}
      {result && (
        <SeasonEducationModal
          seasonType={result.seasonType}
          isOpen={showEducation}
          onClose={() => setShowEducation(false)}
        />
      )}
    </div>
  );
}
