'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useScoreTrend } from '@/hooks/useScoreTrend';
import { ScoreTrendChip } from '@/components/analysis/ScoreTrendChip';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, RefreshCw, Sparkles, ClipboardList, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ShareButton, PrintButton, ShareThemePicker } from '@/components/share';
import type { ShareCardFormat, ShareCardTheme } from '@/components/share';
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
import { useUrlTab } from '@/hooks/useUrlTab';
import { ExpertModeToggle } from '@/components/analysis/ExpertModeToggle';
import { ExpertDataPanel } from '@/components/analysis/ExpertDataPanel';
import { HairReportSheet } from '../../_components/HairReportSheet';
import { TopActionsCard, type TopAction } from '@/components/analysis/TopActionsCard';
import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  type HairTypeId,
  type HairThicknessId,
  type ScalpTypeId,
  type HairConcernId,
  getCautionIngredients,
  getScalpConcernNotice,
  HAIR_TYPES,
  HAIR_THICKNESS,
  SCALP_TYPES,
  HAIR_CONCERNS,
} from '@/lib/mock/hair-analysis';
// 퍼스널컬러 시즌 기반 염색 컬러 처방 (5축 고유 산출물 — AI 콜 0, 하드코딩 팔레트×시즌)
import { recommendHairColors, type HairColorRecommendation } from '@/lib/analysis/hair';
import { ReportEyebrow } from '@/components/analysis/report';

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

// 탭 목록 — URL ?tab= 동기화용 (뒤로가기 시 탭 유지)
const RESULT_TABS = ['basic', 'details'] as const;

// 유효 퍼스널컬러 시즌 키 — 이 외 값이면 색을 지어내지 않고 빈 상태로 유도(정직성).
// DB는 'Spring' 등 대문자로 저장하므로 소문자화 후 대조한다.
const VALID_PC_SEASONS = new Set(['spring', 'summer', 'autumn', 'winter']);

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
  // 퍼스널컬러 시즌 — 헤어 염색 컬러 처방 연동용(없으면 빈 상태로 퍼컬 진단 유도)
  const [pcSeason, setPcSeason] = useState<string | null>(null);
  const { isExpert, toggleExpert } = useExpertMode();
  // 탭 상태를 URL ?tab= 과 동기화 — 링크로 나갔다 뒤로가기 해도 탭 유지
  const [activeTab, setActiveTab] = useUrlTab(RESULT_TABS, 'basic');
  const fetchedRef = useRef(false);

  const analysisId = params.id as string;

  // 공유 카드 데이터 (테마/포맷은 ShareThemePicker에서 선택)
  const [shareFormat, setShareFormat] = useState<ShareCardFormat>('1:1');
  const [shareTheme, setShareTheme] = useState<ShareCardTheme>('default');
  // 사진 옵트인 — 기본 OFF. 켜야만 프로필 사진이 카드에 담긴다(통합 리포트와 동일 계약)
  const [sharePhotoOptIn, setSharePhotoOptIn] = useState(false);
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
    shareData || { analysisType: 'hair', title: '', subtitle: '' },
    '이룸-헤어분석-결과'
  );

  // 시즌별 염색 컬러 — 하드코딩 팔레트(hex)×사용자 퍼컬 시즌, AI 콜 0.
  // 유효 시즌이 없으면 빈 배열 → 빈 상태(퍼컬 진단 유도)로 표시(색을 지어내지 않는다).
  const hairColors = useMemo<HairColorRecommendation[]>(() => {
    const key = pcSeason?.toLowerCase();
    if (!key || !VALID_PC_SEASONS.has(key)) return [];
    return recommendHairColors(key);
  }, [pcSeason]);

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

      // 퍼스널컬러 시즌 조회 — 염색 컬러 처방 연동(실패해도 메인 결과 흐름 불변).
      // 별도 try/catch로 격리: 퍼컬 미진단/조회 실패가 헤어 결과 표시를 막지 않게 한다.
      try {
        const { data: pcData } = await supabase
          .from('personal_color_assessments')
          .select('season')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (pcData?.season) {
          setPcSeason(pcData.season);
        }
      } catch {
        /* 퍼스널컬러 미진단/조회 실패 — 헤어 컬러 섹션은 빈 상태로 유도 */
      }
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
        className="min-h-[calc(100vh-80px)] bg-surface-ground"
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
                {/* 진단지 시트 — 원형 채점·신호등 게이지 대신 속성표 + 스펙트럼 (ADR-120) */}
                {/* 결과 페이지 지표는 name 필드라 진단지 label로 어댑팅 (인라인 뷰와 필드명이 다름) */}
                <HairReportSheet
                  hairTypeLabel={result.hairTypeLabel}
                  hairThicknessLabel={result.hairThicknessLabel}
                  scalpTypeLabel={result.scalpTypeLabel}
                  overallScore={result.overallScore}
                  metrics={result.metrics.map((m) => ({
                    id: m.id,
                    label: m.name,
                    value: m.value,
                    status: m.status,
                  }))}
                  reliability={result.analysisReliability}
                  analyzedAt={result.analyzedAt}
                  testId="hair-report-sheet"
                />
                {scoreTrend && (
                  <div className="flex justify-center -mt-3">
                    <ScoreTrendChip trend={scoreTrend} />
                  </div>
                )}

                {/* 그래서, 이렇게 하세요 — 결론 액션 (기존 결과 데이터에서 조립, ADR-111) */}
                {(() => {
                  const actions: TopAction[] = [];
                  if (result.careTips[0]) actions.push({ title: result.careTips[0] });
                  if (result.recommendedIngredients[0]) {
                    actions.push({
                      title: `${result.recommendedIngredients[0]} 성분이 든 샴푸를 골라보세요`,
                    });
                  }
                  // 컷(×얼굴형)은 이 페이지에 데이터가 없어 통합 분석으로 정직하게 유도.
                  // 염색은 아래 "염색 컬러 처방" 섹션이 이 페이지에서 이미 답하므로 여기서 언급하지 않는다
                  // (통합 결과는 염색 컬러를 렌더하지 않아 빈 약속이 된다).
                  actions.push({
                    title: '어울리는 컷은 얼굴형을 함께 봐야 정확해요',
                    href: '/analysis/integrated',
                    hrefLabel: '통합 분석 보기',
                  });
                  return <TopActionsCard actions={actions} />;
                })()}

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
                      <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                        <ClipboardList
                          className="w-6 h-6 text-muted-foreground"
                          strokeWidth={1.75}
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
                      {/* 중립 칩 — 포인트 컬러 없이 텍스트로만 (ADR-120) */}
                      {result.recommendedIngredients.map((ingredient, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full border border-border text-sm text-foreground"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 주의 성분 — 두피 타입별 피하면 좋은 성분 */}
                <div
                  className="bg-card rounded-xl p-6 shadow-sm"
                  data-testid="hair-caution-ingredients"
                >
                  <h3 className="font-semibold mb-3">주의 성분 (피하면 좋아요)</h3>
                  <div className="flex flex-wrap gap-2">
                    {/* 취소선 문법 — 경고색 대신 "지운 항목"으로 말한다 (ADR-120) */}
                    {getCautionIngredients(result.scalpType).map((ingredient, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full border border-border text-sm text-muted-foreground line-through decoration-muted-foreground/60"
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 두피 고민 안내 — 진단이 아닌 "전문의 상담 권유" 형태 */}
                {(() => {
                  const notice = getScalpConcernNotice(result.concerns);
                  if (!notice) return null;
                  return (
                    <div
                      className="bg-muted/50 border border-border rounded-xl p-5"
                      role="note"
                      data-testid="hair-scalp-concern-notice"
                    >
                      <h3 className="font-semibold text-foreground mb-2 text-sm">
                        두피 고민이 있다면
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{notice}</p>
                    </div>
                  );
                })()}

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
                          <span aria-hidden="true">•</span>
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

          {/* 퍼스널컬러 기반 염색 컬러 처방 — 진단지 문법(색 스와치 + 속성).
              하드코딩 팔레트×사용자 시즌, AI 콜 0. 시즌 미진단 시 정직한 빈 상태(색 지어내지 않음). */}
          {result && (
            <section
              className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm"
              data-testid="hair-color-prescription"
            >
              <ReportEyebrow>HAIR COLOR</ReportEyebrow>
              <h3 className="mt-2 break-keep font-serif text-lg font-semibold text-foreground">
                나에게 어울리는 염색 컬러
              </h3>
              {hairColors.length > 0 ? (
                <>
                  <p className="mt-1 text-xs text-muted-foreground">
                    퍼스널컬러 시즌을 기준으로 어울리는 순서대로 정리했어요
                  </p>
                  <ul className="mt-4 space-y-2" data-testid="hair-color-swatches">
                    {hairColors.map((color, index) => (
                      <li
                        key={color.name}
                        className="flex items-center gap-3"
                        data-testid="hair-color-swatch"
                      >
                        {/* 색 스와치 — 하드코딩 hex를 그대로 표시(장식색·채도 증폭 없음) */}
                        <span
                          className="h-9 w-9 shrink-0 rounded-lg border border-border"
                          style={{ backgroundColor: color.hexColor }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{color.name}</p>
                          <p className="text-xs text-muted-foreground">{color.tags.join(' · ')}</p>
                        </div>
                        {/* 순위만 표기 — 시즌 팔레트는 4시즌 공통 사다리(90/85/80/75)라
                            개인 적합도 %가 아니다. 조작된 정밀도 금지(진단지 문법) */}
                        <span
                          className="shrink-0 text-xs font-medium text-muted-foreground"
                          data-testid="hair-color-rank"
                        >
                          추천 {index + 1}순위
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                // 정직한 빈 상태 — 시즌 미진단 시 색을 지어내지 않고 퍼컬 진단으로 유도
                <div className="mt-3" data-testid="hair-color-empty">
                  <p className="text-sm text-muted-foreground">
                    퍼스널컬러 시즌을 알면 어울리는 염색 컬러를 알려드릴 수 있어요.
                  </p>
                  <Link
                    href="/analysis/personal-color"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                    data-testid="hair-color-pc-cta"
                  >
                    먼저 퍼스널 컬러 진단하기 →
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* 헤어스타일(컷) 추천 안내 — 컷은 얼굴형과의 크로스축이라 통합 분석으로 유도 (ADR-107).
              염색은 위 "염색 컬러 처방" 섹션이 이 페이지에서 답하므로 여기서 약속하지 않는다 */}
          {result && (
            <button
              onClick={() => router.push('/analysis/integrated')}
              className="mt-6 w-full text-left bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
              data-testid="hair-style-consult-cta"
            >
              <h3 className="font-semibold mb-1">어울리는 헤어스타일(컷)은?</h3>
              <p className="text-sm text-muted-foreground">
                컷은 얼굴형을 함께 봐야 정확해요. 통합 분석에서 나에게 맞는 헤어스타일을
                확인해보세요. →
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
              <ShareButton
                onShare={share}
                loading={shareLoading}
                variant="outline"
                className="flex-1"
              />
              {/* 카드 스타일 선택은 공유 인터랙션 시에만 — 인라인 노출은 좁은 화면(360px)에서 넘침 */}
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
              <PrintButton title={t('printTitle.hair')} variant="outline" size="icon" />
            </div>
          </div>
        </div>
      )}

      {/* 하단 콘텐츠 — sticky 바 아래에 배치되어 스크롤 끝에서 노출 */}
      <div className="max-w-lg mx-auto px-4 pb-8">
        <div className="mt-2">
          <AnalysisMatchedProducts
            analysisType="hair"
            hairType={result?.hairType}
            scalpType={result?.scalpType}
          />
        </div>
        <div className="mt-4">
          <ProgressiveProfilePrompt moduleId="hair" />
        </div>
        <AITransparencyNotice compact className="mt-6" />
        <p className="text-xs text-muted-foreground text-center mt-4 px-2">
          분석 결과는 참고용이며, 전문가 진단을 대체하지 않아요
        </p>
        <ResultPageInsights currentModule="hair" />
      </div>
    </>
  );
}
