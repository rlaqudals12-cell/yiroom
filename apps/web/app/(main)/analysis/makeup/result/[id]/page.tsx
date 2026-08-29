'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useScoreTrend } from '@/hooks/useScoreTrend';
import { ScoreTrendChip } from '@/components/analysis/ScoreTrendChip';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import {
  Activity,
  ArrowLeft,
  ClipboardList,
  Droplets,
  Eye,
  FileText,
  Heart,
  Palette,
  RefreshCw,
  ScanFace,
  SlidersHorizontal,
  Smile,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ShareButton, PrintButton, ShareThemePicker } from '@/components/share';
import type { ShareCardFormat, ShareCardTheme } from '@/components/share';
import { useAnalysisShare, createMakeupShareData } from '@/hooks/useAnalysisShare';
import Image from 'next/image';
import Link from 'next/link';
import { AIBadge, AITransparencyNotice } from '@/components/common/AIBadge';
import dynamic from 'next/dynamic';
import { resolveConsentedAnalysisImageUrl } from '@/lib/consent/image-access';

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
import { useExpertMode } from '@/hooks/useExpertMode';
import { useUrlTab } from '@/hooks/useUrlTab';
import { ExpertModeToggle } from '@/components/analysis/ExpertModeToggle';
import { ExpertDataPanel } from '@/components/analysis/ExpertDataPanel';
import { ImageStorageUnavailableNotice } from '@/components/analysis/consent/ImageStorageUnavailableNotice';
import { ResultPageInsights } from '@/components/insights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MAKEUP_STYLES, MAKEUP_CONCERNS } from '@/lib/analysis/makeup';
import {
  type DbMakeupAnalysis,
  type MakeupResultView,
  transformDbToResult,
} from './_lib/transform';
import { TopActionsCard, type TopAction } from '@/components/analysis/TopActionsCard';
import { useLocale, useTranslations } from 'next-intl';
import { getDateLocale } from '@/lib/utils/date-format';
import { TextureSwatch, type TextureKind } from '@/components/share/TextureSwatch';
import {
  ReportEyebrow,
  SectionHeader,
  AttrRow,
  RowTable,
  SpectrumRow,
  TrustFooter,
} from '@/components/analysis/report';

// 시즌 한국어 변환
const SEASON_LABELS: Record<string, string> = {
  spring: '봄 웜톤',
  Spring: '봄 웜톤',
  summer: '여름 쿨톤',
  Summer: '여름 쿨톤',
  autumn: '가을 웜톤',
  Autumn: '가을 웜톤',
  winter: '겨울 쿨톤',
  Winter: '겨울 쿨톤',
};

// 탭 목록 — URL ?tab= 동기화용 (뒤로가기 시 탭 유지)
const RESULT_TABS = ['basic', 'colors', 'tips'] as const;

// 신호등 상태색 대신 텍스트로 말한다 (ADR-120 — 채점 연출 금지)
const STATUS_LABELS: Record<'good' | 'normal' | 'warning', string> = {
  good: '양호',
  normal: '보통',
  warning: '집중 케어',
};

// 종합 점수 상태어 임계값 — 헤어 진단지 scoreStatusText와 동일 기준(결정론 매핑)
const SCORE_GOOD_MIN = 71;
const SCORE_NORMAL_MIN = 41;

// 저장 점수의 표기 번역(새 판정 생성 아님) — "NN점" 단독 표기의 해석 공백을 메운다
function scoreStatusText(value: number): string {
  if (value >= SCORE_GOOD_MIN) return STATUS_LABELS.good;
  if (value >= SCORE_NORMAL_MIN) return STATUS_LABELS.normal;
  return STATUS_LABELS.warning;
}

// 신뢰도 등급 → 표시 % — ExpertDataPanel과 동일 매핑(새 수치 발명 아님)
const RELIABILITY_CONFIDENCE: Record<'high' | 'medium' | 'low', number> = {
  high: 90,
  medium: 70,
  low: 40,
};

// 카테고리별 발색 질감 — 플랫 칩 대신 "실물 발색". 색은 진단 hex 그대로(재현성 유지)
const TEXTURE_BY_CATEGORY: Record<string, TextureKind> = {
  foundation: 'foundation',
  lip: 'lip',
  eyeshadow: 'powder',
  blush: 'powder',
  contour: 'powder',
};

export default function MakeupAnalysisResultPage() {
  const t = useTranslations('analysis');
  // 콜로폰 분석 시간 표기 — 하드코딩 ko-KR 대신 사용자 로캘 (PC 진단지 표준)
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [result, setResult] = useState<MakeupResultView | null>(null);
  // 직전 분석 대비 추이 — 첫 분석이면 null (칩 미노출)
  const scoreTrend = useScoreTrend(
    'makeup_analyses',
    result?.analyzedAt ?? null,
    result?.overallScore
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedMock, setUsedMock] = useState(false);
  const { isExpert, toggleExpert } = useExpertMode();
  // 탭 상태를 URL ?tab= 과 동기화 — 링크로 나갔다 뒤로가기 해도 탭 유지
  const [activeTab, setActiveTab] = useUrlTab(RESULT_TABS, 'basic');
  const fetchedRef = useRef(false);

  const rawId = params.id;
  const analysisId = Array.isArray(rawId) ? rawId[0] : rawId;

  // 공유 카드 데이터 (테마/포맷은 ShareThemePicker에서 선택)
  const [shareFormat, setShareFormat] = useState<ShareCardFormat>('1:1');
  const [shareTheme, setShareTheme] = useState<ShareCardTheme>('default');
  // 사진 옵트인 — 기본 OFF. 켜야만 프로필 사진이 카드에 담긴다(통합 리포트와 동일 계약)
  const [sharePhotoOptIn, setSharePhotoOptIn] = useState(false);
  const shareData = useMemo(() => {
    if (!result) return null;
    return {
      ...createMakeupShareData(
        {
          overallScore: result.overallScore,
          undertoneLabel: result.undertoneLabel,
          styleLabel: result.recommendedStyles[0]
            ? MAKEUP_STYLES.find((s) => s.id === result.recommendedStyles[0])?.label
            : undefined,
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
    shareData || { analysisType: 'makeup', title: '', subtitle: '' },
    '이룸-메이크업분석-결과'
  );

  // DB에서 분석 결과 조회
  const fetchAnalysis = useCallback(async () => {
    if (!isSignedIn || !analysisId || fetchedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('makeup_analyses')
        .select(
          'id, clerk_user_id, image_url, undertone, eye_shape, lip_shape, face_shape, skin_texture, skin_tone_uniformity, hydration, pore_visibility, oil_balance, overall_score, concerns, recommendations, analysis_reliability, created_at'
        )
        .eq('id', analysisId)
        .single();

      if (dbError) {
        console.error('[M-1] DB error:', dbError.message);
        throw new Error('결과를 불러올 수 없어요');
      }

      if (!data) {
        throw new Error('분석 결과를 찾을 수 없어요');
      }

      const dbData = data as DbMakeupAnalysis;
      const transformedResult = transformDbToResult(dbData);
      setResult(transformedResult);
      setImageUrl(await resolveConsentedAnalysisImageUrl(supabase, 'makeup', dbData.image_url));
      if (dbData.recommendations?.usedMock) {
        setUsedMock(true);
      }
      fetchedRef.current = true;
    } catch (err) {
      console.error('[M-1] Fetch error:', err);

      // Fallback: sessionStorage에서 캐시된 데이터 복원
      try {
        const cached = sessionStorage.getItem(`makeup-result-${analysisId}`);
        if (cached) {
          const { dbData } = JSON.parse(cached);
          if (dbData) {
            const transformedResult = transformDbToResult(dbData as DbMakeupAnalysis);
            setResult(transformedResult);
            setImageUrl(
              await resolveConsentedAnalysisImageUrl(supabase, 'makeup', dbData.image_url)
            );
            // 캐시 유지 — 다음 방문 시에도 fallback으로 사용 가능하도록
            setIsLoading(false);
            return;
          }
        }
      } catch {
        /* sessionStorage 복원 실패 무시 */
      }

      setError('결과를 불러올 수 없어요');
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
    router.push('/analysis/makeup');
  }, [router]);

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
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

  // 미측정 항목 고지 — 통합분석 M-1(조합 레이어)은 얼굴 상세·피부 세부 지표를 측정하지 않는다.
  // 빈자리를 침묵으로 두면 "왜 없지?"가 되고, 채우면 지어낸 진단이 된다 → 사실대로 밝힌다.
  const unmeasuredNote = (() => {
    if (!result) return null;
    const missing: string[] = [];
    if (!result.measured.faceShape) missing.push('얼굴형');
    if (!result.measured.eyeShape) missing.push('눈');
    if (!result.measured.lipShape) missing.push('입술');
    if (result.metrics.length === 0) missing.push('피부 세부 지표');
    if (missing.length === 0) return null;
    return `${missing.join(' · ')} 항목은 이번 분석에서 측정하지 않아 표시하지 않았어요.`;
  })();

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-surface-ground"
      data-testid="makeup-result-page"
      role="region"
      aria-label={t('pageAriaLabel.makeup')}
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
            <h1 className="text-lg font-bold text-foreground">{t('pageTitle.makeup')}</h1>
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
            <TabsList
              className="grid w-full grid-cols-3 mb-4 sticky top-0 z-10 bg-muted"
              aria-label={t('tabAriaLabel.makeup')}
            >
              <TabsTrigger value="basic" className="gap-1 text-xs sm:text-sm">
                <FileText className="w-4 h-4" />
                {t('analysisComplete')}
              </TabsTrigger>
              <TabsTrigger value="colors" className="gap-1 text-xs sm:text-sm">
                <Palette className="w-4 h-4" />
                컬러
              </TabsTrigger>
              <TabsTrigger value="tips" className="gap-1 text-xs sm:text-sm">
                <ClipboardList className="w-4 h-4" />팁
              </TabsTrigger>
            </TabsList>

            {/* 기본 분석 탭 */}
            <TabsContent value="basic" className="mt-0 space-y-6">
              {/* 진단지 시트 — 아이브로우 + 세리프 진단명 + 속성표 + 스펙트럼 + 신뢰 푸터 (ADR-120) */}
              <section className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="px-5 pb-6 pt-6 sm:px-7">
                  <ReportEyebrow>MAKEUP REPORT</ReportEyebrow>
                  {/* 헤드라인은 실측 항목만 — 미측정 얼굴형을 진단명처럼 쓰지 않는다 */}
                  <h2 className="mt-3 break-keep font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground">
                    {[result.undertoneLabel, result.measured.faceShape ? result.faceShapeLabel : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </h2>
                  {(() => {
                    const subLabels = [
                      result.measured.eyeShape ? result.eyeShapeLabel : '',
                      result.measured.lipShape ? result.lipShapeLabel : '',
                    ].filter(Boolean);
                    return subLabels.length > 0 ? (
                      <p className="mt-2 break-keep text-sm text-muted-foreground">
                        {subLabels.join(' · ')}
                      </p>
                    ) : null;
                  })()}

                  <div className="mt-6">
                    <SectionHeader no={1} title="진단 속성" />
                    <div className="mt-4">
                      <RowTable testId="makeup-report-attrs">
                        <AttrRow icon={Droplets} label="언더톤" value={result.undertoneLabel} />
                        {result.measured.faceShape && (
                          <AttrRow icon={ScanFace} label="얼굴형" value={result.faceShapeLabel} />
                        )}
                        {result.measured.eyeShape && (
                          <AttrRow icon={Eye} label="눈" value={result.eyeShapeLabel} />
                        )}
                        {result.measured.lipShape && (
                          <AttrRow icon={Smile} label="입술" value={result.lipShapeLabel} />
                        )}
                        <AttrRow
                          icon={Activity}
                          label="피부 컨디션"
                          value={`${result.overallScore}점 · ${scoreStatusText(result.overallScore)}`}
                        />
                      </RowTable>
                    </div>
                  </div>

                  {/* 측정된 지표가 없으면 섹션 자체를 내린다 (빈 표·0점 위장 금지) */}
                  {result.metrics.length > 0 && (
                    <div className="mt-6">
                      <SectionHeader no={2} title="피부 상태" />
                      <div className="mt-4">
                        <RowTable testId="makeup-report-metrics">
                          {result.metrics.map((metric) => (
                            // progressbar aria는 SpectrumRow가 소유한다(래핑하면 상태 텍스트가 소실)
                            <SpectrumRow
                              key={metric.id}
                              label={metric.name}
                              pos={metric.value / 100}
                              status={`${metric.value}점 · ${STATUS_LABELS[metric.status]}`}
                            />
                          ))}
                        </RowTable>
                      </div>
                    </div>
                  )}

                  {/* 푸터 신뢰 블록 — 등급→% 매핑은 전문가 패널과 동일 (진단서의 직인) */}
                  <TrustFooter
                    confidence={RELIABILITY_CONFIDENCE[result.analysisReliability]}
                    testId="makeup-trust-footer"
                    className="mt-6"
                  >
                    <p>
                      분석 시간:{' '}
                      {result.analyzedAt.toLocaleString(getDateLocale(locale), {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </p>
                    {/* 왜 항목이 비었는지 정직하게 밝힌다 — 빈 자리를 추측으로 채우지 않는다 */}
                    {unmeasuredNote && <p data-testid="makeup-unmeasured-note">{unmeasuredNote}</p>}
                  </TrustFooter>
                </div>
              </section>
              {scoreTrend && (
                <div className="flex justify-center -mt-3">
                  <ScoreTrendChip trend={scoreTrend} />
                </div>
              )}

              {/* 그래서, 이렇게 하세요 — 결론 액션 (기존 결과 데이터에서 조립, ADR-111) */}
              {(() => {
                const actions: TopAction[] = [];
                const topStyle = result.recommendedStyles[0]
                  ? MAKEUP_STYLES.find((s) => s.id === result.recommendedStyles[0])
                  : undefined;
                if (topStyle) {
                  actions.push({ title: `${topStyle.label} 스타일이 잘 어울려요` });
                }
                // 립 카테고리 우선, 없으면 첫 카테고리의 첫 컬러 — 탭 링크 대신 안내 문구만
                const firstGroup =
                  result.colorRecommendations.find((c) => c.category === 'lip') ??
                  result.colorRecommendations[0];
                const firstColor = firstGroup?.colors[0];
                if (firstGroup && firstColor) {
                  actions.push({
                    title: `${firstGroup.categoryLabel}은 ${firstColor.name}부터 발라보세요`,
                    detail: '컬러 탭에서 전체 추천 색상을 확인할 수 있어요',
                    swatches: [{ hex: firstColor.hex, name: firstColor.name }],
                  });
                }
                if (result.personalColorConnection?.note) {
                  actions.push({ title: result.personalColorConnection.note });
                }
                return <TopActionsCard actions={actions} />;
              })()}

              {/* 인사이트 */}
              <div className="bg-card rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-3">{t('analysisSummary')}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.insight}</p>
              </div>

              {/* 추천 스타일 */}
              {result.recommendedStyles.length > 0 && (
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-3">{t('recommendedStyle')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.recommendedStyles.map((styleId) => {
                      const style = MAKEUP_STYLES.find((s) => s.id === styleId);
                      return (
                        <Badge key={styleId} variant="secondary" className="text-sm px-3 py-1">
                          {style?.emoji} {style?.label || '스타일'}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 고민 태그 */}
              {result.concerns.length > 0 && (
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-3">{t('carePoints')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.concerns.map((concern) => {
                      const concernData = MAKEUP_CONCERNS.find((c) => c.id === concern);
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

            {/* 컬러 추천 탭 */}
            <TabsContent value="colors" className="mt-0 space-y-6">
              {result.colorRecommendations.length > 0 ? (
                result.colorRecommendations.map((colorRec) => (
                  <div key={colorRec.category} className="bg-card rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-4">{colorRec.categoryLabel}</h3>
                    <div className="space-y-3">
                      {colorRec.colors.map((color, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          {/* 플랫 칩 → 발색 질감 스와치 (색은 진단 hex 그대로) */}
                          <TextureSwatch
                            hex={color.hex}
                            kind={TEXTURE_BY_CATEGORY[colorRec.category] ?? 'powder'}
                            width={56}
                            className="shrink-0"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{color.name}</p>
                            <p className="text-xs text-muted-foreground">{color.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-card rounded-xl p-6 shadow-sm text-center">
                  <p className="text-muted-foreground">{t('noColorRecommendation')}</p>
                </div>
              )}

              {/* 퍼스널 컬러 연결 */}
              {result.personalColorConnection && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart
                      className="w-5 h-5 text-muted-foreground"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <h3 className="font-semibold">퍼스널 컬러 연동</h3>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    추정 시즌:{' '}
                    {SEASON_LABELS[result.personalColorConnection.season] || '알 수 없음'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {result.personalColorConnection.note}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* 메이크업 팁 탭 */}
            <TabsContent value="tips" className="mt-0 space-y-6">
              {result.makeupTips.length > 0 ? (
                result.makeupTips.map((tipGroup) => (
                  <div key={tipGroup.category} className="bg-card rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-3">{tipGroup.category}</h3>
                    <ul className="space-y-2">
                      {tipGroup.tips.map((tip, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span aria-hidden="true">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <div className="bg-card rounded-xl p-6 shadow-sm text-center">
                  <p className="text-muted-foreground">메이크업 팁 정보가 아직 없어요</p>
                </div>
              )}

              {/* 분석 이미지 — 저장 사진이 없으면 조용히 숨기지 않고 동의 경로를 안내 */}
              {!imageUrl && (
                <ImageStorageUnavailableNotice
                  featureLabel="분석 사진 카드"
                  reason="no_consent"
                  analysisHref="/analysis/makeup"
                  testId="makeup-image-storage-notice"
                />
              )}
              {imageUrl && (
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-3">{t('analysisImage')}</h3>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                    <Image
                      src={imageUrl}
                      alt="분석된 메이크업 이미지"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 512px"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* 하단 액션 바 — sticky로 콘텐츠 가림 방지 */}
      {result && (
        <div className="sticky bottom-20 left-0 right-0 z-10 border-t border-border bg-card p-4">
          <div className="max-w-md mx-auto space-y-2">
            <Button
              className="w-full"
              onClick={() => {
                // 기존 `/products?undertone=…&category=makeup`는 죽은 CTA였다:
                // `/products`는 `/beauty`로 308 영구 리다이렉트되며 파라미터가 유실되고,
                // 수신 페이지가 `undertone`/`category=makeup`을 읽지도 않았다.
                // → 화장품 정본(/beauty)으로 직접 보내고, /beauty가 실제로 해석하는
                //   `filter`(대분류=메이크업)·`tone`(시즌 필터)으로 프리셋한다.
                const tone =
                  result.undertone === 'warm' || result.undertone === 'cool'
                    ? `&tone=${result.undertone}`
                    : '';
                router.push(`/beauty?filter=personal-color${tone}`);
              }}
            >
              맞춤 화장품 보기
            </Button>
            <div className="flex gap-2">
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
              <PrintButton title={t('printTitle.makeup')} variant="outline" size="icon" />
            </div>
          </div>
        </div>
      )}

      {/* 하단 콘텐츠 — sticky 바 아래에 배치되어 스크롤 끝에서 노출 */}
      <div className="max-w-lg mx-auto px-4 pb-8">
        <ResultPageInsights currentModule="makeup" />
        <div className="mt-6">
          <AnalysisMatchedProducts
            analysisType="makeup"
            undertone={result?.undertone}
            personalColorSeason={result?.personalColorConnection?.season}
          />
        </div>
        <div className="mt-4">
          <ProgressiveProfilePrompt moduleId="makeup" />
        </div>
        <AITransparencyNotice compact className="mt-8" />
      </div>
    </div>
  );
}
