'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { type BodyAnalysisResult, type UserBodyInput } from '@/lib/mock/body-analysis';
import BodyPhotographyGuide from './_components/BodyPhotographyGuide';
import InputForm from './_components/InputForm';
import AnalysisLoading from './_components/AnalysisLoading';
import AnalysisResult from './_components/AnalysisResult';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShare } from '@/hooks/useShare';
import { ShareButton } from '@/components/share';
import { Confetti } from '@/components/animations';
import { MultiAngleBodyCapture, type MultiAngleBodyImages } from '@/components/analysis/camera';
import { invalidateAnalysisCache } from '@/hooks/useAnalysisStatus';

// 흐름: guide → input → multi-angle → loading → result
type AnalysisStep = 'guide' | 'input' | 'multi-angle' | 'loading' | 'result';

export default function BodyAnalysisPage() {
  const t = useTranslations('analysisEntry');
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceNew = searchParams.get('forceNew') === 'true';
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [checkingExisting, setCheckingExisting] = useState(true);
  const existingCheckedRef = useRef(false);
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [userInput, setUserInput] = useState<UserBodyInput | null>(null);
  const [multiAngleImages, setMultiAngleImages] = useState<MultiAngleBodyImages | null>(null);
  const [result, setResult] = useState<BodyAnalysisResult | null>(null);
  // 저장된 분석 ID — 전체 결과 페이지 딥링크용 (사진 분석 경로에서만 존재)
  const [resultId, setResultId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  // API 완료 상태 (로딩 프로그레스 동기화)
  const [isApiComplete, setIsApiComplete] = useState(false);
  const analysisStartedRef = useRef(false);
  const { ref: shareRef, share, loading: shareLoading } = useShare('이룸-체형분석-결과');

  // 기존 분석 결과 확인 및 자동 리디렉트
  useEffect(() => {
    let isRedirecting = false;

    async function checkExistingAnalysis() {
      // forceNew 파라미터가 있으면 자동 리디렉트 건너뛰기
      if (forceNew) {
        setCheckingExisting(false);
        return;
      }

      if (!isLoaded || !isSignedIn || existingCheckedRef.current) return;

      existingCheckedRef.current = true;

      try {
        const { data } = await supabase
          .from('body_analyses')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data && !isRedirecting) {
          // 기존 결과가 있으면 자동으로 결과 페이지로 리디렉트
          isRedirecting = true;
          router.replace(`/analysis/body/result/${data.id}`);
          return;
        }
      } catch {
        // 기존 결과 없음 - 무시
      } finally {
        if (!isRedirecting) {
          setCheckingExisting(false);
        }
      }
    }

    checkExistingAnalysis();
  }, [isLoaded, isSignedIn, supabase, router, forceNew]);

  // 가이드 완료 → 입력 단계로
  const handleGuideComplete = useCallback(() => {
    setStep('input');
  }, []);

  // 기본 정보 입력 완료 시 다각도 촬영 단계로 전환
  const handleInputSubmit = useCallback((data: UserBodyInput) => {
    setUserInput(data);
    setStep('multi-angle');
    setError(null);
  }, []);

  // 다각도 촬영 완료 시 로딩 단계로 전환
  const handleMultiAngleComplete = useCallback((images: MultiAngleBodyImages) => {
    setMultiAngleImages(images);
    setStep('loading');
    setError(null);
    setIsApiComplete(false);
    analysisStartedRef.current = false;
  }, []);

  // 다각도 촬영 취소 시 입력 단계로 돌아가기
  const handleMultiAngleCancel = useCallback(() => {
    setStep('input');
    setError(null);
  }, []);

  // AI 분석 실행 (API 호출) - 다각도 이미지
  const runAnalysis = useCallback(async () => {
    if (!multiAngleImages || !isSignedIn || analysisStartedRef.current) {
      return;
    }

    analysisStartedRef.current = true;
    setIsAnalyzing(true);

    try {
      const requestBody: Record<string, unknown> = {
        frontImageBase64: multiAngleImages.frontImageBase64,
        leftSideImageBase64: multiAngleImages.leftSideImageBase64,
        rightSideImageBase64: multiAngleImages.rightSideImageBase64,
        backImageBase64: multiAngleImages.backImageBase64,
        userInput,
      };

      const response = await fetch('/api/analyze/body', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      // API 응답의 result + 퍼스널 컬러 추천 통합
      setResult({
        ...data.result,
        analyzedAt: new Date(data.result.analyzedAt),
        personalColorSeason: data.personalColorSeason,
        colorRecommendations: data.colorRecommendations,
        colorTips: data.colorTips,
        imagesAnalyzed: data.imagesAnalyzed,
      });

      // 전체 결과 페이지 딥링크용 ID 저장
      setResultId(data.data?.id ?? null);

      // sessionStorage 캐시 (결과 페이지 DB 조회 실패 시 복원용)
      try {
        sessionStorage.setItem(
          `body-result-${data.data.id}`,
          JSON.stringify({ dbData: data.data, cachedAt: new Date().toISOString() })
        );
      } catch {
        /* sessionStorage 실패 무시 */
      }

      // 분석 완료 → 홈/[나] 탭 5분 캐시 즉시 무효화 (stale "분석 0개" 방지)
      invalidateAnalysisCache();
      setStep('result');
      // 분석 완료 시 축하 효과
      setShowConfetti(true);
    } catch (err) {
      console.error('[C-1] Analysis error:', err instanceof Error ? err.message : err);
      setError(t('error.analysisFailed'));
      setStep('multi-angle');
    } finally {
      setIsApiComplete(true);
      setIsAnalyzing(false);
    }
  }, [multiAngleImages, userInput, isSignedIn]);

  // 로딩 단계 진입 시 즉시 API 호출 시작
  useEffect(() => {
    if (step === 'loading') {
      runAnalysis();
    }
  }, [step, runAnalysis]);

  // 다시 분석하기
  const handleRetry = useCallback(() => {
    setUserInput(null);
    setMultiAngleImages(null);
    setResult(null);
    setResultId(null);
    setStep('guide');
    setError(null);
    setShowConfetti(false);
    setIsApiComplete(false);
    analysisStartedRef.current = false;
  }, []);

  // 단계별 서브타이틀 (에러는 인라인 배너로 표시, subtitle은 step 기준)
  const getSubtitle = () => {
    switch (step) {
      case 'guide':
        return t('body.subtitle.guide');
      case 'input':
        return t('body.subtitle.input');
      case 'multi-angle':
        return t('body.subtitle.multiAngle');
      case 'loading':
        return isAnalyzing ? t('subtitle.aiAnalyzing') : t('subtitle.aiAnalyzingDone');
      case 'result':
        return t('subtitle.analysisComplete');
    }
  };

  // 기존 결과 확인 중이면 로딩 표시
  if (checkingExisting) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading.checkingExisting')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 축하 Confetti 효과 */}
      <Confetti trigger={showConfetti} />

      <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="body-analysis-page">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 헤더 */}
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">{t('body.title')}</h1>
            <p className="text-muted-foreground mt-2">{getSubtitle()}</p>
          </header>

          {/* 에러 메시지 (multi-angle 단계에서 표시) */}
          {error && step === 'multi-angle' && (
            <div
              className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center justify-between"
              role="alert"
              aria-live="polite"
            >
              <span>{t('error.analysisFailed')}</span>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 text-xs shrink-0"
                aria-label={t('action.closeError')}
              >
                {t('action.close')}
              </button>
            </div>
          )}

          {/* Step별 컴포넌트 렌더링 */}
          {step === 'guide' && <BodyPhotographyGuide onContinue={handleGuideComplete} />}

          {step === 'input' && <InputForm onSubmit={handleInputSubmit} />}

          {step === 'multi-angle' && (
            <div
              className="bg-card rounded-xl overflow-hidden"
              style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
            >
              <MultiAngleBodyCapture
                onComplete={handleMultiAngleComplete}
                onCancel={handleMultiAngleCancel}
                className="h-full"
              />
            </div>
          )}

          {step === 'loading' && <AnalysisLoading isApiComplete={isApiComplete} />}

          {step === 'result' && result && (
            <>
              {/* 전체 결과 페이지로의 명확한 진입 — 딥링크 (사진 분석 경로에서만) */}
              {resultId && (
                <Button asChild className="w-full h-12 text-base gap-2 mb-4">
                  <Link href={`/analysis/body/result/${resultId}`} data-testid="view-full-result">
                    전체 결과 보기
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              )}
              <AnalysisResult result={result} onRetry={handleRetry} shareRef={shareRef} />
            </>
          )}
        </div>
      </div>

      {/* 공유 버튼 - 결과 화면에서만 하단 고정 */}
      {step === 'result' && result && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/80 dark:bg-card/90 backdrop-blur-sm border-t border-border/50 dark:border-border z-10">
          <div className="max-w-md mx-auto">
            <ShareButton onShare={share} loading={shareLoading} variant="outline" />
          </div>
        </div>
      )}
    </>
  );
}
