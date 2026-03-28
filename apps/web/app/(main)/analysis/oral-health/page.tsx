'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@clerk/nextjs';
import { formatDate as formatDateLocale } from '@/lib/utils/date-format';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { compressFileToBase64 } from '@/lib/utils/image-compression';
import { Button } from '@/components/ui/button';
import { OralHealthResultCard } from '@/components/analysis/oral-health';
import { ToothDiagramOverlay } from '@/components/analysis/overlay';
import type { OralHealthAssessment } from '@/types/oral-health';

type AnalysisStep = 'guide' | 'upload' | 'loading' | 'result';

// 날짜 포맷 헬퍼
function formatDate(
  date: Date,
  locale: string = 'ko',
  tFn: (key: string, values?: Record<string, unknown>) => string
): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return tFn('date.today');
  if (days === 1) return tFn('date.yesterday');
  if (days < 7) return tFn('date.daysAgo', { days });
  if (days < 30) return tFn('date.weeksAgo', { weeks: Math.floor(days / 7) });
  return formatDateLocale(date, locale, { month: 'short', day: 'numeric' });
}

// 기존 분석 결과 타입
interface ExistingAnalysis {
  id: string;
  overall_score: number;
  created_at: string;
}

export default function OralHealthAnalysisPage(): React.JSX.Element {
  const { isSignedIn, isLoaded } = useAuth();
  const locale = useLocale();
  const t = useTranslations('analysisEntry');
  const supabase = useClerkSupabaseClient();
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [existingAnalysis, setExistingAnalysis] = useState<ExistingAnalysis | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<OralHealthAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const existingCheckedRef = useRef(false);

  // 기존 분석 결과 확인
  useEffect(() => {
    async function checkExistingAnalysis(): Promise<void> {
      if (!isLoaded || !isSignedIn || existingCheckedRef.current) return;

      existingCheckedRef.current = true;

      try {
        const { data } = await supabase
          .from('oral_health_assessments')
          .select('id, overall_score, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setExistingAnalysis(data);
        }
      } catch {
        // 기존 결과 없음
      } finally {
        setCheckingExisting(false);
      }
    }

    checkExistingAnalysis();
  }, [isLoaded, isSignedIn, supabase]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }, []);

  // 이미지 업로드 버튼 클릭
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 분석 시작
  const handleStartAnalysis = useCallback(async () => {
    if (!imageFile || !isSignedIn) return;

    setIsAnalyzing(true);
    setStep('loading');
    setError(null);

    try {
      // 파일을 압축된 Base64로 변환 (Vercel 4.5MB body 제한 대응)
      const imageBase64 = await compressFileToBase64(imageFile);

      // API 호출
      const response = await fetch('/api/analyze/oral-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          analysisType: 'full',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Analysis failed');
      }

      const data = await response.json();

      if (!data.success || !data.data?.assessment) {
        throw new Error('Could not receive analysis result');
      }

      setResult(data.data.assessment);
      setStep('result');
    } catch (err) {
      console.error('[OH-1] Analysis error:', err instanceof Error ? err.message : 'Unknown error');
      setError(t('error.analysisFailed'));
      setStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, isSignedIn]);

  // 다시 분석하기
  const handleRetry = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setStep('guide');
    setError(null);
  }, []);

  // 단계별 서브타이틀
  const subtitle = useMemo(() => {
    if (error) return t('error.analysisProblem');
    switch (step) {
      case 'guide':
        return t('oral.subtitle.guide');
      case 'upload':
        return t('oral.subtitle.upload');
      case 'loading':
        return t('subtitle.aiAnalyzing');
      case 'result':
        return t('subtitle.analysisComplete');
    }
  }, [step, error]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="oral-health-analysis-page">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="relative text-center mb-8">
          <Link
            href="/analysis"
            className="absolute left-0 top-1 p-1 text-muted-foreground hover:text-foreground"
            aria-label={t('oral.backToListAria')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{t('oral.title')}</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </header>

        {/* 에러 메시지 */}
        {error && (
          <div
            className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {/* 기존 분석 결과 배너 */}
        {step === 'guide' && existingAnalysis && !checkingExisting && (
          <Link
            href={`/analysis/oral-health/result/${existingAnalysis.id}`}
            className="block mb-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-xl border border-cyan-200 dark:border-cyan-800 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
                  <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                    {existingAnalysis.overall_score}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('action.viewExistingResult')}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDate(new Date(existingAnalysis.created_at), locale, t)}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-cyan-500" />
            </div>
          </Link>
        )}

        {/* 촬영 가이드 */}
        {step === 'guide' && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-4">{t('oral.guideTitle')}</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500">&#10003;</span>
                  {t('oral.guideTip1')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500">&#10003;</span>
                  {t('oral.guideTip2')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500">&#10003;</span>
                  {t('oral.guideTip3')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500">&#10003;</span>
                  {t('oral.guideTip4')}
                </li>
              </ul>
            </div>

            <Button onClick={() => setStep('upload')} className="w-full">
              {t('action.selectPhoto')}
            </Button>
          </div>
        )}

        {/* 사진 업로드 */}
        {step === 'upload' && (
          <div className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label={t('oral.photoSelectAria')}
            />

            {imagePreview ? (
              <div className="space-y-4">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                  <Image
                    src={imagePreview}
                    alt={t('upload.selectedImage')}
                    fill
                    sizes="(max-width: 768px) 100vw, 512px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleUploadClick} className="flex-1">
                    {t('action.selectOtherPhoto')}
                  </Button>
                  <Button
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing}
                    className="flex-1"
                    aria-label={t('oral.startAnalysisAria')}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('action.analyzing')}
                      </>
                    ) : (
                      t('action.startAnalysis')
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleUploadClick}
                className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-4 bg-card"
              >
                <div className="w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">{t('upload.selectPhoto')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('oral.uploadHint')}</p>
                </div>
              </button>
            )}

            <p className="text-xs text-center text-muted-foreground">{t('oral.privacyNote')}</p>

            <Button variant="ghost" onClick={() => setStep('guide')} className="w-full">
              {t('action.backToGuide')}
            </Button>
          </div>
        )}

        {/* 로딩 */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center mb-6 animate-pulse">
              <span className="text-4xl">&#x1F9B7;</span>
            </div>
            <p className="text-lg font-medium text-foreground">{t('oral.aiAnalyzing')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('loading.pleaseWait')}</p>
            <Loader2 className="w-8 h-8 mt-6 animate-spin text-cyan-500" />
          </div>
        )}

        {/* 결과 */}
        {step === 'result' && result && (
          <div className="space-y-6">
            {/* Layer 0.5: 치아 도식 시각화 (ADR-097) */}
            <ToothDiagramOverlay
              toothColor={result.toothColor}
              gumHealth={result.gumHealth}
              whiteningGoal={result.whiteningGoal}
            />

            <OralHealthResultCard assessment={result} />

            <Button onClick={handleRetry} variant="outline" className="w-full">
              {t('action.reAnalyze')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
