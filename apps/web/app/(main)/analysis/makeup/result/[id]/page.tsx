'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useScoreTrend } from '@/hooks/useScoreTrend';
import { ScoreTrendChip } from '@/components/analysis/ScoreTrendChip';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, RefreshCw, Sparkles, ClipboardList, Palette, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareButton, PrintButton, ShareThemePicker } from '@/components/share';
import type { ShareCardFormat, ShareCardTheme } from '@/components/share';
import { useAnalysisShare, createMakeupShareData } from '@/hooks/useAnalysisShare';
import Image from 'next/image';
import Link from 'next/link';
import { AIBadge, AITransparencyNotice } from '@/components/common/AIBadge';
import dynamic from 'next/dynamic';

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
import { ContextLinkingCard } from '@/components/analysis/ContextLinkingCard';
import { useExpertMode } from '@/hooks/useExpertMode';
import { useUrlTab } from '@/hooks/useUrlTab';
import { ExpertModeToggle } from '@/components/analysis/ExpertModeToggle';
import { ExpertDataPanel } from '@/components/analysis/ExpertDataPanel';
import { ResultPageInsights } from '@/components/insights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MAKEUP_STYLES, MAKEUP_CONCERNS } from '@/lib/analysis/makeup';
import {
  type DbMakeupAnalysis,
  type MakeupResultView,
  transformDbToResult,
} from './_lib/transform';
import { VisualReportCard } from '@/components/analysis/visual-report/VisualReportCard';
import { TopActionsCard, type TopAction } from '@/components/analysis/TopActionsCard';
import { useTranslations } from 'next-intl';

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

export default function MakeupAnalysisResultPage() {
  const t = useTranslations('analysis');
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
        { profileImage: user?.imageUrl, userName: user?.firstName ?? user?.username ?? undefined }
      ),
      format: shareFormat,
      theme: shareTheme,
    };
  }, [result, shareFormat, shareTheme, user?.firstName, user?.imageUrl, user?.username]);

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
      setImageUrl(dbData.image_url);
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
            setImageUrl(dbData.image_url);
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
          <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
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
    <div
      className="min-h-[calc(100vh-80px)] bg-muted"
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
                <Sparkles className="w-4 h-4" />
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
              {/* 통합 비주얼 리포트 카드 (메이크업) */}
              <VisualReportCard
                analysisType="makeup"
                overallScore={result.overallScore}
                makeupMetrics={result.metrics}
                undertoneLabel={result.undertoneLabel}
                analyzedAt={result.analyzedAt}
              />
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
                          <div
                            className="w-10 h-10 rounded-full shadow-md border-2 border-white dark:border-gray-700"
                            style={{ backgroundColor: color.hex }}
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
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold">퍼스널 컬러 연동</h3>
                  </div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
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
                          <span className="text-rose-500">•</span>
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

              {/* 분석 이미지 */}
              {imageUrl && (
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-3">{t('analysisImage')}</h3>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/makeup-images/${imageUrl}`}
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
        <div className="sticky bottom-20 left-0 right-0 p-4 bg-card/80 dark:bg-card/90 backdrop-blur-sm border-t border-border/50 dark:border-border z-10">
          <div className="max-w-md mx-auto space-y-2">
            <Button
              className="w-full"
              onClick={() =>
                router.push(`/products?undertone=${result.undertone || ''}&category=makeup`)
              }
            >
              <Sparkles className="w-4 h-4 mr-2" />
              맞춤 화장품 보기
            </Button>
            <div className="flex gap-2">
              <ShareButton onShare={share} loading={shareLoading} variant="outline" />
              <ShareThemePicker
                value={shareTheme}
                onChange={setShareTheme}
                format={shareFormat}
                onFormatChange={setShareFormat}
                className="mt-2"
              />
              <PrintButton title={t('printTitle.makeup')} variant="outline" />
            </div>
          </div>
        </div>
      )}

      {/* 하단 콘텐츠 — sticky 바 아래에 배치되어 스크롤 끝에서 노출 */}
      <div className="max-w-lg mx-auto px-4 pb-8">
        <ContextLinkingCard currentModule="makeup" />
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
