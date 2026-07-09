'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth, useUser } from '@clerk/nextjs';
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
  type ColorInfo,
  type LipstickRecommendation,
  SEASON_INFO,
  BEST_COLORS,
  WORST_COLORS,
  LIPSTICK_RECOMMENDATIONS,
  FOUNDATION_RECOMMENDATIONS,
  CLOTHING_RECOMMENDATIONS,
  STYLE_DESCRIPTIONS,
  EASY_INSIGHTS,
  resolveSubtype,
} from '@/lib/mock/personal-color';
import AnalysisResult from '../../_components/AnalysisResult';
import { ShareButton, PrintButton, ShareThemePicker } from '@/components/share';
import type { ShareCardFormat } from '@/components/share';
import { useAnalysisShare, createPersonalColorShareData } from '@/hooks/useAnalysisShare';
import type { ShareCardTheme } from '@/hooks/useAnalysisShare';
import Link from 'next/link';
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
import { ProgressiveDisclosure } from '@/components/common/ProgressiveDisclosure';
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
const ColorHarmonyGuide = dynamic(
  () =>
    import('@/components/analysis/ColorHarmonyGuide').then((mod) => ({
      default: mod.ColorHarmonyGuide,
    })),
  { loading: () => null, ssr: false }
);
import { MockDataNotice } from '@/components/common/MockDataNotice';
import { useTranslations } from 'next-intl';
import { SeasonEducationModal } from '@/components/analysis/personal-color/SeasonEducationModal';
import { useExpertMode } from '@/hooks/useExpertMode';
import { useUrlTab } from '@/hooks/useUrlTab';
import { ExpertModeToggle } from '@/components/analysis/ExpertModeToggle';
import { ExpertDataPanel } from '@/components/analysis/ExpertDataPanel';

// DB 데이터 타입
interface DbPersonalColorAssessment {
  id: string;
  clerk_user_id: string;
  season: string;
  undertone: string | null;
  // 12톤 서브타입 (bright/light/true/mute/deep) — NULL이면 구 데이터
  season_subtype?: string | null;
  confidence: number | null;
  best_colors: Array<{ name: string; hex: string }> | null;
  worst_colors: Array<{ name: string; hex: string }> | null;
  // 저장 실체는 AI 원본 형태({colorName, hex, brandExample}) — 방어적으로 두 형태 모두 수용
  makeup_recommendations: {
    lipstick?: Array<{
      colorName?: string;
      shade?: string;
      hex: string;
      brandExample?: string;
      description?: string;
    }>;
  } | null;
  fashion_recommendations: {
    tops?: string[];
    bottoms?: string[];
    accessories?: string[];
  } | null;
  image_analysis: {
    insight?: string;
    seasonSubtype?: string | null;
    analysisEvidence?: AnalysisEvidence;
    imageQuality?: ImageQuality;
    usedMock?: boolean; // AI 분석 실패 시 Mock 데이터 사용 여부
    // 퍼스널 대비(모발-피부 명도 실측, ADR-116) — 실측값이 있을 때만 저장됨
    contrastLevel?: 'low' | 'medium' | 'high';
  } | null;
  face_image_url?: string; // DB 컬럼명과 일치
  created_at: string;
}

// 신뢰도 기준값 (이 미만이면 재분석 권장)
const LOW_CONFIDENCE_THRESHOLD = 70;

// 퍼스널 대비(ADR-116) 안내 문구 — 초보자 풀이 병기("얼굴의 밝고 어두움 차이").
// 판정 보조 1줄(접힌 섹션 아님) · 실측값이 있을 때만 노출.
const CONTRAST_COPY: Record<'low' | 'medium' | 'high', { label: string; line: string }> = {
  low: {
    label: '낮은 대비',
    line: '얼굴의 밝고 어두움 차이(대비)가 낮은 편이에요 — 톤온톤·인접 명도 배색이 잘 어울려요.',
  },
  medium: {
    label: '중간 대비',
    line: '얼굴의 밝고 어두움 차이(대비)가 중간이에요 — 배색 강도를 자유롭게 조절해도 잘 받아요.',
  },
  high: {
    label: '높은 대비',
    line: '얼굴의 밝고 어두움 차이(대비)가 높은 편이에요 — 명확한 명암 배색·진한 발색이 잘 어울려요.',
  },
};

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

// DB best_colors/worst_colors 배열을 ColorInfo[]로 정규화 (유효한 {name,hex}만)
function normalizeDbColors(raw: unknown): ColorInfo[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (c): c is { name: string; hex: string } =>
        typeof c === 'object' &&
        c !== null &&
        typeof (c as { hex?: unknown }).hex === 'string' &&
        typeof (c as { name?: unknown }).name === 'string'
    )
    .map((c) => ({ name: c.name, hex: c.hex }));
}

// DB 립스틱(저장 실체 {colorName,hex,brandExample} 또는 구 {shade,...})을 LipstickRecommendation[]로
function normalizeDbLipstick(
  raw: DbPersonalColorAssessment['makeup_recommendations']
): LipstickRecommendation[] {
  const list = raw?.lipstick;
  if (!Array.isArray(list)) return [];
  return list
    .filter((l): l is NonNullable<typeof l> => !!l && typeof l.hex === 'string')
    .map((l) => ({
      colorName: l.colorName ?? l.shade ?? '추천 컬러',
      hex: l.hex,
      brandExample: l.brandExample,
      easyDescription: l.description,
    }));
}

// DB → PersonalColorResult 변환.
// 개인화 우선: usedMock이 아니고 DB에 AI가 사진에서 뽑은 팔레트가 있으면 그걸 표시
// (같은 시즌이어도 사람마다 다른 "내 팔레트"). 없거나 Mock이면 시즌 공통 Mock으로 폴백.
function transformDbToResult(dbData: DbPersonalColorAssessment): PersonalColorResult {
  const seasonType = dbData.season.toLowerCase() as SeasonType;
  const info = SEASON_INFO[seasonType] || SEASON_INFO.spring;

  // 12톤 서브타입 우선: 저장값이 유효하면 tone/depth/라벨을 서브타입에서 도출
  // (예: 여름 쿨 뮤트 사용자에게 하드코딩 "라이트" 대신 "뮤트" 정확 표시). 없으면 시즌 파생.
  const rawSubtype = dbData.season_subtype ?? dbData.image_analysis?.seasonSubtype ?? null;
  const subtype = resolveSubtype(seasonType, rawSubtype);
  const { tone, depth } = subtype
    ? { tone: subtype.tone, depth: subtype.depth }
    : getSeasonToneDepth(seasonType);

  // 서브톤 라벨: 서브타입이 있으면 "여름 쿨 뮤트", 없으면 톤·깊이 조합 폴백
  let undertoneLabel: string;
  if (subtype) {
    undertoneLabel = subtype.label;
  } else {
    const TONE_LABELS: Record<string, string> = { warm: '웜톤', cool: '쿨톤', neutral: '뉴트럴' };
    const toneLabel = dbData.undertone
      ? (TONE_LABELS[dbData.undertone] ?? '뉴트럴')
      : (TONE_LABELS[tone] ?? '웜톤');
    const depthLabel = depth === 'light' ? '라이트' : '딥';
    undertoneLabel = `${toneLabel} · ${depthLabel}`;
  }

  // 개인화 판정: Mock 폴백이 아니고 DB에 실제 팔레트가 있을 때만 "내 사진에서 찾은 컬러"
  const usedMock = dbData.image_analysis?.usedMock === true;
  const dbBestColors = normalizeDbColors(dbData.best_colors);
  const dbWorstColors = normalizeDbColors(dbData.worst_colors);
  const dbLipstick = normalizeDbLipstick(dbData.makeup_recommendations);
  const personalizedColors = !usedMock && dbBestColors.length > 0;

  // 시즌 공통 Mock (폴백용)
  const mockFoundation = FOUNDATION_RECOMMENDATIONS[seasonType] || [];
  const mockStyle = STYLE_DESCRIPTIONS[seasonType];
  const mockEasyInsight = EASY_INSIGHTS[seasonType]?.[0];

  return {
    seasonType,
    seasonLabel: info.label,
    seasonDescription: info.description,
    tone,
    depth,
    // 정직: 저장된 신뢰도가 없으면 85로 위장하지 않는다. 0 = "저장값 없음" → UI에서 미표시
    // (실제 분석 신뢰도는 항상 85~95라 0과 충돌하지 않음)
    confidence: dbData.confidence ?? 0,
    undertoneLabel,
    // 컬러 데이터: AI 개인 팔레트 우선, 없으면 시즌 Mock 폴백
    bestColors: personalizedColors ? dbBestColors : BEST_COLORS[seasonType] || [],
    worstColors:
      !usedMock && dbWorstColors.length > 0 ? dbWorstColors : WORST_COLORS[seasonType] || [],
    personalizedColors,
    // 립스틱 추천: AI 개인 추천 우선, 없으면 Mock
    lipstickRecommendations:
      !usedMock && dbLipstick.length > 0 ? dbLipstick : LIPSTICK_RECOMMENDATIONS[seasonType] || [],
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

// 탭 목록 — URL ?tab= 동기화용 (뒤로가기 시 탭 유지)
const RESULT_TABS = ['basic', 'draping', 'detailed'] as const;

export default function PersonalColorResultPage() {
  const t = useTranslations('analysis');
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [result, setResult] = useState<PersonalColorResult | null>(null);
  const [analysisEvidence, setAnalysisEvidence] = useState<AnalysisEvidence | null>(null);
  const [imageQuality, setImageQuality] = useState<ImageQuality | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 일시적 에러(5xx) 시 재시도 가능 여부
  const [isRetryable, setIsRetryable] = useState(false);
  // 탭 상태를 URL ?tab= 과 동기화 — 링크로 나갔다 뒤로가기 해도 탭 유지
  const [activeTab, setActiveTab] = useUrlTab(RESULT_TABS, 'basic');
  const [showEducation, setShowEducation] = useState(false);
  // AI Fallback 사용 여부 (AI 분석 실패 시 Mock 데이터 사용)
  const [usedMock, setUsedMock] = useState(false);
  // 퍼스널 대비(모발-피부 명도 실측, ADR-116) — 실측값이 있을 때만 표시
  const [contrastLevel, setContrastLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const { isExpert, toggleExpert } = useExpertMode();
  const fetchedRef = useRef(false);

  const analysisId = params.id as string;

  // 공유 카드 데이터
  const [shareFormat, setShareFormat] = useState<ShareCardFormat>('1:1');
  const [shareTheme, setShareTheme] = useState<ShareCardTheme>('default');
  const shareData = useMemo(() => {
    if (!result) return null;
    return {
      ...createPersonalColorShareData(
        {
          seasonType: result.seasonType,
          seasonLabel: result.seasonLabel,
          bestColors: result.bestColors,
        },
        { profileImage: user?.imageUrl, userName: user?.firstName ?? user?.username ?? undefined }
      ),
      format: shareFormat,
      theme: shareTheme,
    };
  }, [result, shareFormat, shareTheme, user?.firstName, user?.imageUrl, user?.username]);

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
      // 퍼스널 대비 실측값 (있을 때만 — 없으면 미표시, 추측 없음)
      if (dbData.image_analysis?.contrastLevel) {
        setContrastLevel(dbData.image_analysis.contrastLevel);
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
            if (dbData.image_analysis?.contrastLevel) {
              setContrastLevel(dbData.image_analysis.contrastLevel);
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
      data-testid="personal-color-result-page"
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
            <span className="ml-auto text-primary text-xs">{t('compare')} →</span>
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
                confidence: result.confidence > 0 ? result.confidence : undefined,
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

        {/* 낮은 신뢰도 경고 배너 — 저장된 신뢰도(>0)가 있을 때만 판단 */}
        {result && result.confidence > 0 && result.confidence < LOW_CONFIDENCE_THRESHOLD && (
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
                  {t('reanalyze')}
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
              {/* 비주얼 리포트 카드 — 저장된 신뢰도(>0)가 있을 때만 (위장 점수 금지, 체형 정책과 동일) */}
              {result.confidence > 0 && (
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
              )}

              {/* 판정 → 결론 → 팔레트 → 접힌 심화 (ADR-111 표현 원칙 1) */}
              <AnalysisResult
                result={result}
                onRetry={handleNewAnalysis}
                evidence={analysisEvidence}
                onTabChange={setActiveTab}
              />

              {/* 퍼스널 대비 실측 안내 — 판정 보조 1줄(접힘 아님), 실측값 있을 때만 (ADR-116) */}
              {contrastLevel && (
                <div
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-950/20 p-3.5"
                  data-testid="pc-contrast-note"
                >
                  <GitCompareArrows className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {CONTRAST_COPY[contrastLevel].label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {CONTRAST_COPY[contrastLevel].line}
                    </p>
                  </div>
                </div>
              )}

              {/* 배색 가이드 — 대표색 기반 배색 이론 코디 안내 (접힘 — 결론 먼저) */}
              {result.bestColors.length > 0 && (
                <div className="mt-6">
                  <ProgressiveDisclosure
                    title="배색 가이드"
                    summary="대표 컬러로 배색 조합을 만들어보세요"
                    icon={<Palette className="w-4 h-4 text-primary" />}
                  >
                    <ColorHarmonyGuide
                      baseHex={result.bestColors[0].hex}
                      baseName={result.bestColors[0].name}
                    />
                  </ProgressiveDisclosure>
                </div>
              )}

              {/* 성별 적응형 악세서리 추천 (K-1, 접힘 — 결론 먼저) */}
              <div className="mt-4">
                <ProgressiveDisclosure
                  title="액세서리 추천"
                  summary="내 톤에 어울리는 주얼리·소품을 확인해보세요"
                  icon={<Sparkles className="w-4 h-4 text-amber-500" />}
                >
                  <GenderAdaptiveAccessories seasonType={result.seasonType} />
                </ProgressiveDisclosure>
              </div>

              {/* AI 컬러 상담 + 투명성 고지 (접힘 — 결론 먼저) */}
              <div className="mt-4">
                <ProgressiveDisclosure
                  title="AI 컬러 상담 받기"
                  summary="궁금한 점을 이룸에게 물어보세요"
                  icon={<Sparkles className="w-4 h-4 text-primary" />}
                >
                  <ConsultantCTA
                    category="personalColor"
                    params={{ season: result.seasonType }}
                    showQuickQuestions
                  />
                  <AITransparencyNotice compact className="mt-4" />
                </ProgressiveDisclosure>
              </div>

              {/* 환경 요인 안내 (심화 — 접힘) */}
              <div className="mt-4">
                <ProgressiveDisclosure
                  title={t('knowThis')}
                  summary="조명·염색이 분석 정확도에 영향을 줄 수 있어요"
                  icon={<Lightbulb className="w-4 h-4 text-blue-500" />}
                >
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-start gap-1.5">
                      <Sun className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
                      <span>{t('lightingNote')}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-500" />
                      <span>염색은 피부톤에 영향 없지만 분석 정확도에 영향을 줄 수 있어요</span>
                    </li>
                  </ul>
                </ProgressiveDisclosure>
              </div>

              {/* P16: 시즌별 교육 콘텐츠 트리거 (짧아서 그대로 — 접힌 섹션 아래) */}
              <button
                type="button"
                className="mt-4 w-full p-3 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors text-left flex items-center gap-3 cursor-pointer"
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
                  userSubtypeLabel={result.undertoneLabel}
                  className="w-full"
                />
              )}
              {activeTab === 'draping' && !imageUrl && (
                <div className="p-6 bg-card rounded-xl border text-center">
                  <Shirt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">{t('colorDraping')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t('noDrapingImage')}</p>
                  <p className="text-xs text-muted-foreground mb-4">{t('reanalyzeForDraping')}</p>
                  <Button onClick={handleNewAnalysis} variant="outline" size="sm">
                    <Camera className="w-4 h-4 mr-1.5" />
                    {t('reanalyze')}
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
                {t('reanalyze')}
              </Button>
              <ShareButton onShare={share} loading={shareLoading} variant="outline" />
              <ShareThemePicker
                value={shareTheme}
                onChange={setShareTheme}
                format={shareFormat}
                onFormatChange={setShareFormat}
                className="mt-2"
              />
              <PrintButton title={t('printTitle.personalColor')} variant="outline" />
            </div>
            {/*
              URL 공유는 제거 — 결과 페이지는 로그인+본인 소유(RLS)라 친구가 열면 로그인 벽/404.
              공유는 위의 이미지 카드(ShareButton)로만. 공개 링크는 통합 리포트 토큰 경로에서 제공.
            */}
          </div>
        </div>
      )}

      {/* 하단 콘텐츠 — sticky 바 아래에 배치되어 스크롤 끝에서 노출 */}
      {result && (
        <div className="max-w-lg mx-auto px-4 pb-8">
          <ContextLinkingCard currentModule="personal-color" />
          <ResultPageInsights currentModule="personal-color" />
          <div className="mt-6">
            <AnalysisMatchedProducts
              analysisType="personal-color"
              personalColorSeason={result.seasonType}
            />
          </div>
          <div className="mt-4">
            <ProgressiveProfilePrompt
              moduleId="personal-color"
              currentConfidence={result.confidence > 0 ? result.confidence : undefined}
            />
          </div>
          {/* 퍼스널컬러는 동일 사진 반복 분석 판정 일치를 실측 → 재현성 문구 노출 */}
          <AITransparencyNotice compact showReproducibility className="mt-4" />
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
