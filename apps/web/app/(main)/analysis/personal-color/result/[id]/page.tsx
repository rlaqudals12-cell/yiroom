'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  ArrowLeft,
  RefreshCw,
  Palette,
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
import { getCardPalette } from '@/lib/share/tone-palettes';
import { getKoreanColorName } from '@/lib/utils/color-names';
import { ShareButton, PrintButton, ShareThemePicker } from '@/components/share';
import type { ShareCardFormat } from '@/components/share';
import { useAnalysisShare, createPersonalColorShareData } from '@/hooks/useAnalysisShare';
import type { ShareCardTheme } from '@/hooks/useAnalysisShare';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AnalysisEvidence, ImageQuality } from '@/components/analysis/AnalysisEvidenceReport';
import { DrapingSectionDynamic } from '@/components/analysis/personal-color';
import { ConsultantCTA } from '@/components/coach/ConsultantCTA';
import { GenderAdaptiveAccessories } from '@/components/analysis/GenderAdaptiveAccessories';
import { ResultPageInsights } from '@/components/insights';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Camera, Shirt, History, Wand2, SlidersHorizontal } from 'lucide-react';
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
    // 통합 파이프라인(axis-adapters)이 저장하는 12톤 서브타입 키 — 단독 경로의 seasonSubtype과
    // 이름이 갈려 통합 퍼널 사용자에게 서브타입이 통째로 소실됐다(2026-08 수리). 구 데이터 호환용.
    subtype?: string | null;
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

// 서브타입 표기 별칭 → 정본 표기.
// 왜: 저장 경로마다 어휘가 갈린다. 단독 경로(Gemini 프롬프트)는 'mute', 통합 경로
// (classifyTone·personal-color-v2)는 'muted'를 낸다. 같은 12톤인데 표기가 달라 통합 사용자의
// 서브타입 해석이 통째로 실패했다 → 읽는 쪽에서 한 번 접어 정본('mute')으로 통일한다.
const SUBTYPE_ALIAS: Record<string, string> = { muted: 'mute' };

// 저장된 원시 서브타입을 정본 표기로 정규화 (없으면 null → 시즌 기반 파생 폴백)
function normalizeRawSubtype(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = raw.toLowerCase();
  return SUBTYPE_ALIAS[key] ?? key;
}

// AI 원시 서브타입(mute 등) → getCardPalette 12톤 키 접두사
const RAW_TO_TONE12: Record<string, string> = {
  bright: 'bright',
  light: 'light',
  true: 'true',
  mute: 'muted',
  deep: 'deep',
};

/**
 * 팔레트 해석 — 공유카드 resolveCardPalettes 규칙 이식(2026-07-25).
 * 개인 실측(4색+, 이름 보장)이면 그대로, 아니면 진단 톤의 12톤 표준 큐레이션(getCardPalette)로
 * 대체해 웹세이프 Mock 폴백(#FF0000류)을 소거 — 공유카드와 화면 색 일치. Mock은 최후 폴백.
 */
function resolveResultPalettes(args: {
  seasonType: SeasonType;
  rawSubtype: string | null;
  hasSubtype: boolean;
  usedMock: boolean;
  dbBestColors: ColorInfo[];
  dbWorstColors: ColorInfo[];
}): {
  bestColors: ColorInfo[];
  worstColors: ColorInfo[];
  personalizedColors: boolean;
  paletteToneKey: string;
} {
  const { seasonType, rawSubtype, hasSubtype, usedMock, dbBestColors, dbWorstColors } = args;

  // 개인화 판정: Mock 폴백이 아니고 DB 팔레트가 충분할 때만 "내 사진에서 찾은 컬러"
  // (4색 미만 = 카드 품질 미달 → 톤 표준 큐레이션 대체)
  const personalizedColors = !usedMock && dbBestColors.length >= 4;

  const tone12Prefix =
    hasSubtype && rawSubtype ? RAW_TO_TONE12[rawSubtype.toLowerCase()] : undefined;
  const paletteToneKey = tone12Prefix ? `${tone12Prefix}-${seasonType}` : seasonType;
  const curated = getCardPalette(paletteToneKey, 'ko') ?? getCardPalette(seasonType, 'ko');
  // 큐레이션 avoid는 이름이 없는 색 필드 — 결과 UI(ColorInfo)에는 관습 색이름을 붙여 정직 유지
  const curatedAvoid = (curated?.avoid ?? []).map((c) => ({
    hex: c.hex,
    name: getKoreanColorName(c.hex),
  }));

  let worstColors: ColorInfo[];
  if (!usedMock && dbWorstColors.length > 0) {
    worstColors = dbWorstColors;
  } else if (curatedAvoid.length > 0) {
    worstColors = curatedAvoid;
  } else {
    worstColors = WORST_COLORS[seasonType] || [];
  }

  return {
    bestColors: personalizedColors
      ? dbBestColors
      : (curated?.best ?? BEST_COLORS[seasonType] ?? []),
    worstColors,
    personalizedColors,
    paletteToneKey,
  };
}

// DB → PersonalColorResult 변환.
// 개인화 우선: usedMock이 아니고 DB에 AI가 사진에서 뽑은 팔레트가 있으면 그걸 표시
// (같은 시즌이어도 사람마다 다른 "내 팔레트"). 없거나 Mock이면 시즌 공통 Mock으로 폴백.
function transformDbToResult(dbData: DbPersonalColorAssessment): PersonalColorResult {
  const seasonType = dbData.season.toLowerCase() as SeasonType;
  const info = SEASON_INFO[seasonType] || SEASON_INFO.spring;

  // 12톤 서브타입 우선: 저장값이 유효하면 tone/depth/라벨을 서브타입에서 도출
  // (예: 여름 쿨 뮤트 사용자에게 하드코딩 "라이트" 대신 "뮤트" 정확 표시). 없으면 시즌 파생.
  // 폴백 체인: 컬럼(단독 경로) → image_analysis.seasonSubtype(구 단독) → image_analysis.subtype(통합 경로).
  // 통합 퍼널은 마지막 키에만 저장해왔다 — 빠뜨리면 12톤 팔레트·명도/채도 행·톤 총람이 전부 소실된다.
  const rawSubtype = normalizeRawSubtype(
    dbData.season_subtype ?? dbData.image_analysis?.seasonSubtype ?? dbData.image_analysis?.subtype
  );
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

  const usedMock = dbData.image_analysis?.usedMock === true;
  const dbLipstick = normalizeDbLipstick(dbData.makeup_recommendations);

  // 팔레트 해석 — 개인 실측 우선, 아니면 12톤 표준 큐레이션 (resolveResultPalettes 참조)
  const { bestColors, worstColors, personalizedColors, paletteToneKey } = resolveResultPalettes({
    seasonType,
    rawSubtype,
    hasSubtype: subtype !== null,
    usedMock,
    dbBestColors: normalizeDbColors(dbData.best_colors),
    dbWorstColors: normalizeDbColors(dbData.worst_colors),
  });

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
    // 컬러 데이터: AI 개인 팔레트 우선, 없으면 12톤 표준 큐레이션(getCardPalette) 폴백
    // (구 웹세이프 Mock 팔레트는 최후 폴백으로만 — 공유카드와 화면 색 일치)
    bestColors,
    worstColors,
    personalizedColors,
    paletteToneKey,
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

// 탭 목록 — URL ?tab= 동기화용 (뒤로가기 시 탭 유지).
// 구 'detailed' 탭은 진단지(기본 분석)에 흡수·삭제(2026-08-01) — 옛 ?tab=detailed 링크는
// useUrlTab이 무효 값으로 판정해 basic으로 폴백한다
const RESULT_TABS = ['basic', 'draping'] as const;

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
  // 사진 옵트인 — 기본 OFF. 켜야만 프로필 사진이 카드에 담긴다(통합 리포트와 동일 계약)
  const [sharePhotoOptIn, setSharePhotoOptIn] = useState(false);
  const shareData = useMemo(() => {
    if (!result) return null;
    return {
      ...createPersonalColorShareData(
        {
          seasonType: result.seasonType,
          seasonLabel: result.seasonLabel,
          // 카드 진단명도 시트 히어로와 같은 12톤 라벨을 쓴다 ("봄 웜" → "여름 쿨 뮤트")
          toneLabel: result.undertoneLabel,
          bestColors: result.bestColors,
        },
        {
          profileImage: sharePhotoOptIn ? user?.imageUrl : undefined,
          userName: user?.firstName ?? user?.username ?? undefined,
        }
      ),
      format: shareFormat,
      theme: shareTheme,
    };
  }, [
    result,
    shareFormat,
    shareTheme,
    sharePhotoOptIn,
    user?.firstName,
    user?.imageUrl,
    user?.username,
  ]);

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
      <div className="min-h-[calc(100vh-80px)] bg-surface-ground">
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
      className="min-h-[calc(100vh-80px)] bg-surface-ground"
      data-testid="personal-color-result-page"
      role="region"
      aria-label={t('pageAriaLabel.personalColor')}
    >
      {/* 호스트 확폭 — md+에서 진단지 2단 밀도(01|02, 03 내부 2열, 05|06 병치)를 담기 위해
          ~880px (R5). 모바일은 max-w-lg 그대로(1열 불변). 탭바·헤더도 같은 폭을 따라간다 */}
      <div className="max-w-lg md:max-w-[880px] mx-auto px-4 py-8">
        {/* 헤더 — 인쇄물에는 빼기(PDF가 뒤로가기·재분석 버튼으로 시작하지 않게) */}
        <header className="flex items-center justify-between mb-6" data-print-hide>
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
          <div className="flex items-center gap-1">
            {/* 다시 분석 — 하단 sticky에서 헤더 보조 액션으로 이동 (primary 1개 원칙, 저신뢰 배너의 조건부 재분석과 별개) */}
            {/* 아이콘 단독은 발견 불가(창업자 실사용 피드백 8/1) — 텍스트 라벨 병기 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewAnalysis}
              data-testid="header-reanalyze"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              {t('reanalyze')}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/analysis/personal-color/history">
                <History className="w-4 h-4 mr-1" />
                {t('previousResults')}
              </Link>
            </Button>
          </div>
        </header>

        {/* AI 분석 실패 시 Mock 데이터 알림 — 상단은 컴팩트 칩으로 격하(위계), 전문 고지는 본문 말미 1회 */}
        {usedMock && (
          <div className="mb-4 flex justify-center">
            <MockDataNotice compact />
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
            {/* 구 3탭 중 'detailed'는 진단지에 흡수·삭제(세대 정합, 2026-08-01) — 2탭 */}
            <TabsList
              className="grid w-full grid-cols-2 mb-4 sticky top-0 z-10 bg-muted"
              data-print-hide
            >
              <TabsTrigger value="basic" className="gap-1">
                <Palette className="w-4 h-4" />
                {t('basicAnalysis')}
              </TabsTrigger>
              <TabsTrigger value="draping" className="gap-1">
                <Shirt className="w-4 h-4" />
                {t('colorDraping')}
              </TabsTrigger>
            </TabsList>

            {/* 기본 분석 탭 */}
            <TabsContent
              value="basic"
              className="mt-0 data-[state=inactive]:hidden"
              data-testid="basic-tab"
            >
              {/* 진단지 문법 결과 시트 (ADR-120) — 88점 채점 카드 소거, 신뢰도는 시트 푸터
                  신뢰 블록이 담당(정보 손실 0). 퍼스널 대비(ADR-116)도 속성표 행으로 흡수 */}
              <AnalysisResult
                result={result}
                evidence={analysisEvidence}
                contrastLevel={contrastLevel}
                photoUrl={imageUrl ?? undefined}
              />

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
                    {/* 구 상세 탭 "더 정확한 결과를 위한 팁" 중 유일한 미중복 항목 흡수 */}
                    <li className="flex items-start gap-1.5">
                      <Camera className="w-3 h-3 mt-0.5 flex-shrink-0 text-rose-400" />
                      <span>노메이크업 상태에서 촬영하면 분석이 가장 정확해요</span>
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
                        ? '드레이핑 탭에서 색을 얼굴 아래 대보고 비교할 수 있어요'
                        : '분석 이미지가 없어 이용할 수 없어요. 다시 분석해보세요'}
                    </p>
                  </div>
                  {imageUrl && <span className="text-primary text-sm">→</span>}
                </button>
              </div>

              {/* Mock 전문 고지(재시도 안내 포함) — 상단 칩과 짝, 본문 말미 1회만 노출 */}
              {usedMock && <MockDataNotice className="mt-6" />}
            </TabsContent>

            {/* 드레이핑 시뮬레이션 탭 - 조건부 렌더링으로 canvas 오버플로우 방지 */}
            <TabsContent
              value="draping"
              className="mt-0 data-[state=inactive]:hidden"
              data-testid="draping-tab"
            >
              {/* 통합결과 정본과 동일한 zero-mask 캔버스 합성 — 구 MediaPipe 경로(CSP 차단→Mock 가면)는 삭제됨 */}
              {activeTab === 'draping' && imageUrl && (
                <DrapingSectionDynamic
                  imageUrl={imageUrl}
                  bestColors={result.bestColors}
                  worstColors={result.worstColors}
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
              {/* 가상 메이크업 진입 — 구 sticky 보조 버튼을 드레이핑 경유 텍스트 링크로 격하 (primary 1개 원칙) */}
              <div className="mt-4 text-center">
                <Link
                  href={`/style/virtual-try-on?season=${result.seasonType}`}
                  className="text-sm text-primary hover:underline underline-offset-2"
                  data-testid="draping-to-makeup-link"
                >
                  메이크업으로도 입혀보기 →
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* P14: 하단 액션 바 — primary는 "다음 행동" 1개만, 공유는 보조 클러스터 (verdict-first 위계) */}
      {result && (
        <div
          className="sticky bottom-20 left-0 right-0 p-4 bg-card/80 dark:bg-card/90 backdrop-blur-sm border-t border-border/50 dark:border-border z-10"
          data-print-hide
        >
          <div className="max-w-md mx-auto space-y-2">
            <Button
              className="w-full"
              onClick={() => router.push(`/products?season=${result.seasonType}&category=makeup`)}
            >
              <Palette className="w-4 h-4 mr-2" />내 색상에 맞는 제품
            </Button>
            <div className="flex gap-2">
              <ShareButton
                onShare={share}
                loading={shareLoading}
                variant="outline"
                className="flex-1"
              />
              {/* 카드 스타일 선택은 공유 인터랙션 시에만 — 상시 인라인 노출 제거 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="공유 카드 스타일 선택"
                    data-testid="share-style-trigger"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" side="top" className="w-auto">
                  <ShareThemePicker
                    value={shareTheme}
                    onChange={setShareTheme}
                    format={shareFormat}
                    onFormatChange={setShareFormat}
                    photoOptIn={sharePhotoOptIn}
                    onPhotoOptInChange={setSharePhotoOptIn}
                  />
                </PopoverContent>
              </Popover>
              <PrintButton title={t('printTitle.personalColor')} variant="outline" size="icon" />
            </div>
            {/*
              URL 공유는 제거 — 결과 페이지는 로그인+본인 소유(RLS)라 친구가 열면 로그인 벽/404.
              공유는 위의 이미지 카드(ShareButton)로만. 공개 링크는 통합 리포트 토큰 경로에서 제공.
            */}
          </div>
        </div>
      )}

      {/* 하단 콘텐츠 — sticky 바 아래 스크롤 끝에서 노출. 다음 행동 표면은 ResultPageInsights 1곳.
          B3(2026-08-01): 하단 클러스터를 시트 내부와 동일한 접힘 헤더 문법(ProgressiveDisclosure)으로
          정돈 — 주요 1행(제목+요약 헤더)만 먼저 보이고 상세는 펼침. 폭도 시트 호스트와 동기화.
          내부 컴포넌트·testid 계약은 불변(표현 재조립만) */}
      {result && (
        <div className="max-w-lg md:max-w-[880px] mx-auto px-4 pb-8 space-y-3">
          <ProgressiveDisclosure
            title="다음 행동"
            summary="오늘의 루틴과 이어서 하면 좋은 분석을 확인해보세요"
            icon={<Sparkles className="w-4 h-4 text-primary" />}
          >
            <ResultPageInsights currentModule="personal-color" className="mt-0" />
          </ProgressiveDisclosure>
          {/* sticky primary("내 색상에 맞는 제품" = 제품 페이지 이동)와 역할 분화 —
              여기는 페이지를 떠나지 않고 보는 인라인 미리보기 */}
          <ProgressiveDisclosure
            title="이 색과 어울리는 제품 미리보기"
            summary="이 자리에서 바로 몇 가지만 훑어보세요"
            icon={<Palette className="w-4 h-4 text-primary" />}
          >
            <AnalysisMatchedProducts
              analysisType="personal-color"
              personalColorSeason={result.seasonType}
            />
          </ProgressiveDisclosure>
          <ProgressiveProfilePrompt
            moduleId="personal-color"
            currentConfidence={result.confidence > 0 ? result.confidence : undefined}
          />
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
