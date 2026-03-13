'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AIBadge, AITransparencyNotice } from '@/components/common/AIBadge';
import { MockDataNotice } from '@/components/common/MockDataNotice';
import { useExpertMode } from '@/hooks/useExpertMode';
import { ExpertModeToggle } from '@/components/analysis/ExpertModeToggle';
import { ExpertDataPanel } from '@/components/analysis/ExpertDataPanel';
import { ShareButton, PrintButton, ShareThemePicker } from '@/components/share';
import type { ShareCardFormat } from '@/components/share';
import { createOralHealthShareData, useAnalysisShare } from '@/hooks/useAnalysisShare';
import type { OralHealthAssessment } from '@/types/oral-health';
import { classifyByRange } from '@/lib/utils/conditional-helpers';
import { generateOralHealthIdentityLabel } from '@/lib/analysis/oral-health';
import { ResultPageInsights } from '@/components/insights';
import { useTranslations } from 'next-intl';

// 하단 컴포넌트는 dynamic import (below the fold, 번들 분할)
const OralHealthResultCard = dynamic(
  () =>
    import('@/components/analysis/oral-health').then((mod) => ({
      default: mod.OralHealthResultCard,
    })),
  { ssr: false }
);
const ContextLinkingCard = dynamic(
  () =>
    import('@/components/analysis/ContextLinkingCard').then((mod) => ({
      default: mod.ContextLinkingCard,
    })),
  { ssr: false }
);

// DB 행 → OralHealthAssessment 변환
interface DbOralHealthRow {
  id: string;
  clerk_user_id: string;
  overall_score: number;
  tooth_color: OralHealthAssessment['toothColor'] | null;
  gum_health: OralHealthAssessment['gumHealth'] | null;
  whitening_goal: OralHealthAssessment['whiteningGoal'] | null;
  recommendations: string[] | null;
  used_fallback: boolean;
  created_at: string;
}

function transformDbToAssessment(row: DbOralHealthRow): OralHealthAssessment {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    createdAt: row.created_at,
    usedFallback: row.used_fallback ?? false,
    toothColor: row.tooth_color ?? undefined,
    gumHealth: row.gum_health ?? undefined,
    whiteningGoal: row.whitening_goal ?? undefined,
    overallScore: row.overall_score,
    recommendations: row.recommendations ?? [],
  };
}

export default function OralHealthResultPage(): React.JSX.Element {
  const t = useTranslations('analysis');
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [assessment, setAssessment] = useState<OralHealthAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isExpert, toggleExpert } = useExpertMode();
  const fetchedRef = useRef(false);

  const rawId = params.id;
  const analysisId = Array.isArray(rawId) ? rawId[0] : rawId;

  // DB에서 분석 결과 조회
  const fetchAnalysis = useCallback(async () => {
    if (!isSignedIn || !analysisId || fetchedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('oral_health_assessments')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      if (!data) {
        throw new Error('분석 결과를 찾을 수 없어요');
      }

      const transformed = transformDbToAssessment(data as DbOralHealthRow);
      setAssessment(transformed);
      fetchedRef.current = true;
    } catch (err) {
      console.error('[OH-1] Fetch error:', err instanceof Error ? err.message : 'Unknown error');
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

  const handleNewAnalysis = useCallback(() => {
    router.push('/analysis/oral-health?forceNew=true');
  }, [router]);

  // Identity-First 타입 라벨 (ADR-080)
  const oralHealthIdentityLabel = useMemo(() => {
    if (!assessment) return null;
    return generateOralHealthIdentityLabel(
      assessment.toothColor?.interpretation?.brightness,
      assessment.gumHealth?.healthStatus
    );
  }, [assessment]);

  // 밝기 라벨 변환
  const brightnessLabels: Record<string, string> = {
    very_bright: '매우 밝음',
    bright: '밝음',
    medium: '보통',
    dark: '어두움',
    very_dark: '매우 어두움',
  };

  // 공유 데이터 생성
  const [shareFormat, setShareFormat] = useState<ShareCardFormat>('1:1');
  const shareData = assessment
    ? {
        ...createOralHealthShareData({
          overallScore: assessment.overallScore,
          identityLabel: oralHealthIdentityLabel ?? undefined,
          brightnessLabel: assessment.toothColor?.interpretation?.brightness
            ? brightnessLabels[assessment.toothColor.interpretation.brightness]
            : undefined,
          inflammationScore: assessment.gumHealth?.inflammationScore,
        }),
        format: shareFormat,
      }
    : createOralHealthShareData({ overallScore: 0 });
  const { share: handleShare, loading: shareLoading } = useAnalysisShare(
    shareData,
    '이룸 구강건강 분석 결과'
  );

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
            role="status"
            aria-label={t('loadingLabel')}
          />
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

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-muted"
      data-testid="oral-health-result-page"
      role="region"
      aria-label={t('pageAriaLabel.oralHealth')}
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
            <h1 className="text-lg font-bold text-foreground">{t('pageTitle.oralHealth')}</h1>
            <div className="flex items-center gap-2">
              <AIBadge variant="small" />
              <ExpertModeToggle isExpert={isExpert} onToggle={toggleExpert} />
            </div>
          </div>
          {/* K1: 신뢰도는 AI 분석 결과 페이지이므로 공통 고지로 커버 */}
          <div className="flex gap-2">
            <ShareButton onShare={handleShare} loading={shareLoading} variant="ghost" size="sm" />
            <ShareThemePicker
              value={shareData?.theme ?? 'default'}
              onChange={() => {}}
              format={shareFormat}
              onFormatChange={setShareFormat}
            />
            <PrintButton title="이룸 구강건강 분석 결과" variant="ghost" size="sm" />
          </div>
        </header>

        {/* AI Fallback 알림 */}
        {assessment?.usedFallback && (
          <div className="mb-6">
            <MockDataNotice />
          </div>
        )}

        {/* 전문가 모드 데이터 패널 */}
        {isExpert && assessment && (
          <div className="mb-6">
            <ExpertDataPanel
              data={{
                confidence: assessment.toothColor?.confidence ?? null,
                usedMock: assessment.usedFallback,
                analyzedAt: assessment.createdAt,
                imageQuality: null,
                evidenceSummary:
                  assessment.toothColor?.confidence != null
                    ? { toothColorConfidence: assessment.toothColor.confidence }
                    : null,
              }}
            />
          </div>
        )}

        {/* 종합 점수 */}
        {assessment && (
          <>
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-xl p-6 text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-white dark:bg-card shadow-lg flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-cyan-600">{assessment.overallScore}</span>
              </div>
              {oralHealthIdentityLabel && (
                <h2 className="text-xl font-bold text-foreground mb-1">
                  {oralHealthIdentityLabel}
                </h2>
              )}
              <p className="text-sm text-muted-foreground">
                구강건강 점수 {assessment.overallScore}점
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {classifyByRange(assessment.overallScore, [
                  { max: 60, result: '적극적인 케어를 시작하면 좋아요' },
                  { max: 80, result: '좋은 상태이지만 더 신경쓸 부분이 있어요' },
                  { min: 80, result: '전반적으로 건강한 상태예요' },
                ])}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                100점 만점 · 밝기, 색상 톤, 잇몸 상태 종합 평가
              </p>
              {/* K1: 분석 신뢰도 */}
              {assessment.toothColor?.confidence != null && (
                <p className="text-xs text-muted-foreground/60 mt-1">
                  분석 신뢰도 {assessment.toothColor.confidence}%
                </p>
              )}
            </div>

            {/* 상세 결과 카드 */}
            <OralHealthResultCard assessment={assessment} className="mb-6" />
          </>
        )}
      </div>

      {/* 하단 액션 바 — sticky로 콘텐츠 가림 방지 */}
      {assessment && (
        <div className="sticky bottom-20 left-0 right-0 p-4 bg-card/80 dark:bg-card/90 backdrop-blur-sm border-t border-border/50 dark:border-border z-10">
          <div className="max-w-md mx-auto">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleNewAnalysis}
              aria-label="구강건강 다시 분석하기"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              다시 분석하기
            </Button>
          </div>
        </div>
      )}

      {/* 하단 콘텐츠 — sticky 바 아래에 배치되어 스크롤 끝에서 노출 */}
      <div className="max-w-lg mx-auto px-4 pb-8">
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3 mt-6">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            이 결과는 AI 참고 정보이며 의료 진단이 아니에요. 정확한 진단과 치료는 치과 전문의와
            상담해주세요.
          </p>
        </div>
        <AITransparencyNotice compact className="mt-6" />
        <ContextLinkingCard currentModule="oral-health" />
        <ResultPageInsights currentModule="oral-health" />
      </div>
    </div>
  );
}
