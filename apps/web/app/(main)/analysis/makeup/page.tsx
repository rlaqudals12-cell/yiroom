'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';
import { getDateLocale } from '@/lib/utils/date-format';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, ArrowRight, Upload, Loader2, Brush } from 'lucide-react';
import { compressFileToBase64 } from '@/lib/utils/image-compression';
import type { MakeupAnalysisResult } from '@/lib/mock/makeup-analysis';
import { Button } from '@/components/ui/button';
import { MakeupGuide } from './_components/MakeupGuide';
import { MakeupAnalysisResultView } from './_components/MakeupAnalysisResultView';
import { invalidateAnalysisCache } from '@/hooks/useAnalysisStatus';
import { ImageConsentModal } from '@/components/analysis/consent';
import type { ImageConsent } from '@/components/analysis/consent/types';
import { isImageConsentActive } from '@/lib/consent/version-check';

type AnalysisStep = 'guide' | 'upload' | 'loading' | 'result';

// 날짜 포맷 헬퍼
function formatDate(
  date: Date,
  locale: string,
  tFn: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return tFn('date.today');
  if (days === 1) return tFn('date.yesterday');
  if (days < 7) return tFn('date.daysAgo', { days });
  if (days < 30) return tFn('date.weeksAgo', { weeks: Math.floor(days / 7) });
  return date.toLocaleDateString(getDateLocale(locale), { month: 'short', day: 'numeric' });
}

// 기존 분석 결과 타입 (_components에서도 공유)
export interface ExistingAnalysis {
  id: string;
  overall_score: number;
  undertone: string;
  created_at: string;
}

const UNDERTONE_LABELS: Record<string, string> = {
  warm: '웜톤',
  cool: '쿨톤',
  neutral: '뉴트럴',
};

export default function MakeupAnalysisPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const locale = useLocale();
  const t = useTranslations('analysisEntry');
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [existingAnalysis, setExistingAnalysis] = useState<ExistingAnalysis | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<MakeupAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [existingConsent, setExistingConsent] = useState<ImageConsent | null>(null);
  const [consentLookupSettled, setConsentLookupSettled] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const existingCheckedRef = useRef(false);
  const consentCheckedRef = useRef(false);
  const analysisStartedRef = useRef(false);
  const consentSubmissionRef = useRef(false);

  // 기존 분석 결과 확인
  useEffect(() => {
    async function checkExistingAnalysis() {
      if (!isLoaded || !isSignedIn || existingCheckedRef.current) return;

      existingCheckedRef.current = true;

      try {
        const { data } = await supabase
          .from('makeup_analyses')
          .select('id, overall_score, undertone, created_at')
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

  // 원본 사진 저장은 분석 처리 동의와 분리된 선택 동의다.
  useEffect(() => {
    async function checkExistingConsent() {
      if (!isLoaded || !isSignedIn || consentCheckedRef.current) return;

      consentCheckedRef.current = true;

      try {
        const { data, error: consentError } = await supabase
          .from('image_consents')
          .select('*')
          .eq('analysis_type', 'makeup')
          .maybeSingle();

        if (consentError) throw consentError;

        if (data) {
          setExistingConsent(data as ImageConsent);
        }
      } catch (consentError) {
        // 조회 실패 시 동의 없음으로 닫아 사진이 저장되지 않게 한다.
        console.error('[M-1] Error checking image storage consent:', consentError);
      } finally {
        setConsentLookupSettled(true);
      }
    }

    checkExistingConsent();
  }, [isLoaded, isSignedIn, supabase]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 분석 실행 (기존 동의 확인 또는 선택 모달 응답 뒤에만 호출)
  const runAnalysis = useCallback(
    async (imageStorageAllowed?: boolean) => {
      if (!imageFile || !isSignedIn || analysisStartedRef.current) return;

      analysisStartedRef.current = true;
      setIsAnalyzing(true);
      setStep('loading');
      setError(null);

      try {
        // 파일을 압축된 Base64로 변환 (Vercel 4.5MB body 제한 대응)
        const imageBase64 = await compressFileToBase64(imageFile);

        const response = await fetch('/api/analyze/makeup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, imageStorageAllowed }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Analysis failed');
        }

        const data = await response.json();

        setResult({
          ...data.result,
          analyzedAt: new Date(data.result.analyzedAt),
        });

        // sessionStorage 캐시 (결과 페이지 DB 조회 실패 시 복원용)
        try {
          sessionStorage.setItem(
            `makeup-result-${data.data.id}`,
            JSON.stringify({ dbData: data.data, cachedAt: new Date().toISOString() })
          );
        } catch {
          /* sessionStorage 실패 무시 */
        }

        // 분석 완료 → 홈/[나] 탭 5분 캐시 즉시 무효화 (stale "분석 0개" 방지)
        invalidateAnalysisCache();
        setStep('result');
      } catch (err) {
        console.error('[M-1] Analysis error:', err);
        setError(t('error.analysisProblem'));
        setStep('upload');
      } finally {
        analysisStartedRef.current = false;
        setIsAnalyzing(false);
      }
    },
    [imageFile, isSignedIn, t]
  );

  const handleStartAnalysis = useCallback(() => {
    if (!imageFile || !isSignedIn) return;

    if (isImageConsentActive(existingConsent)) {
      void runAnalysis(true);
      return;
    }

    setShowConsentModal(true);
  }, [existingConsent, imageFile, isSignedIn, runAnalysis]);

  const handleConsentAgree = useCallback(async () => {
    if (consentSubmissionRef.current) return;
    consentSubmissionRef.current = true;
    setConsentLoading(true);
    let imageStorageAllowed = false;

    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisType: 'makeup' }),
      });

      if (response.ok) {
        const data = await response.json();
        setExistingConsent(data.consent);
        imageStorageAllowed = true;
      } else {
        const errorData = await response.json();
        if (errorData.reason === 'under_age' || errorData.reason === 'no_birthdate') {
          console.warn('[M-1] Image storage consent ineligible:', errorData.reason);
          setStorageNotice('사진은 저장하지 않고 분석을 진행해요.');
        } else {
          throw new Error(errorData.error || 'Failed to save consent');
        }
      }
    } catch (consentError) {
      // 동의 저장 실패 시에도 분석은 가능하며, 서버는 동의가 없어 사진을 저장하지 않는다.
      console.error('[M-1] Image storage consent save error:', consentError);
      setStorageNotice('사진은 저장하지 않고 분석을 진행해요.');
    } finally {
      setShowConsentModal(false);
      setConsentLoading(false);
      await runAnalysis(imageStorageAllowed);
      consentSubmissionRef.current = false;
    }
  }, [runAnalysis]);

  const handleConsentSkip = useCallback(() => {
    setShowConsentModal(false);
    void runAnalysis(false);
  }, [runAnalysis]);

  // 다시 분석하기
  const handleRetry = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setStep('guide');
    setError(null);
    setStorageNotice(null);
    analysisStartedRef.current = false;
    consentSubmissionRef.current = false;
  }, []);

  // 단계별 서브타이틀
  const subtitle = useMemo(() => {
    if (error) return t('error.analysisError');
    switch (step) {
      case 'guide':
        return t('makeup.subtitle.guide');
      case 'upload':
        return t('makeup.subtitle.upload');
      case 'loading':
        return t('subtitle.aiAnalyzing');
      case 'result':
        return t('subtitle.analysisComplete');
    }
  }, [step, error, t]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="makeup-analysis-page">
      <ImageConsentModal
        isOpen={showConsentModal}
        onConsent={handleConsentAgree}
        onSkip={handleConsentSkip}
        analysisType="makeup"
        isLoading={consentLoading}
      />

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t('makeup.title')}</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </header>

        {/* 에러 메시지 */}
        {error && (
          <div
            className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm"
            role="alert"
            aria-live="assertive"
            data-testid="makeup-error-banner"
          >
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 px-0"
              aria-label={t('makeup.retryAria')}
              data-testid="makeup-error-retry-button"
            >
              {t('action.retryArrow')}
            </Button>
          </div>
        )}

        {storageNotice && (
          <p className="mb-4 text-sm text-muted-foreground" role="status">
            {storageNotice}
          </p>
        )}

        {/* 기존 분석 결과 배너 */}
        {step === 'guide' && existingAnalysis && !checkingExisting && (
          <Link
            href={`/analysis/makeup/result/${existingAnalysis.id}`}
            className="block mb-6 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-shadow"
            data-testid="makeup-existing-banner"
            aria-label={t('makeup.existingResultAria', { score: existingAnalysis.overall_score })}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {existingAnalysis.overall_score}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('action.viewExistingResult')}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDate(new Date(existingAnalysis.created_at), locale, t)} ·{' '}
                    {UNDERTONE_LABELS[existingAnalysis.undertone] || existingAnalysis.undertone}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
          </Link>
        )}

        {/* 촬영 가이드 */}
        {step === 'guide' && (
          <MakeupGuide
            existingAnalysis={existingAnalysis}
            checkingExisting={checkingExisting}
            onStartUpload={() => setStep('upload')}
          />
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
              aria-label={t('makeup.photoSelectAria')}
              data-testid="makeup-file-input"
            />

            {imagePreview ? (
              <div className="space-y-4">
                <div className="aspect-square rounded-xl overflow-hidden bg-muted relative">
                  <Image
                    src={imagePreview}
                    alt={t('upload.selectedImage')}
                    fill
                    sizes="(max-width: 512px) 100vw, 480px"
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
                    disabled={isAnalyzing || !consentLookupSettled}
                    className="flex-1"
                    data-testid="makeup-analyze-button"
                    aria-label={t('makeup.startAnalysisAria')}
                  >
                    {!consentLookupSettled ? (
                      '저장 설정 확인 중...'
                    ) : isAnalyzing ? (
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
                className="w-full aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-4 bg-card"
                aria-label={t('upload.selectPhotoAria')}
                data-testid="makeup-upload-area"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">{t('upload.selectPhoto')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('upload.tapToSelect')}</p>
                </div>
              </button>
            )}

            <Button variant="ghost" onClick={() => setStep('guide')} className="w-full">
              {t('action.backToGuide')}
            </Button>
          </div>
        )}

        {/* 로딩 */}
        {step === 'loading' && (
          <div
            className="flex flex-col items-center justify-center py-16"
            aria-live="polite"
            data-testid="makeup-loading"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
              <Brush className="w-9 h-9 text-primary" aria-hidden="true" />
            </div>
            <p className="text-lg font-medium text-foreground">{t('makeup.aiAnalyzingFace')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('loading.pleaseWait')}</p>
            <Loader2 className="w-8 h-8 mt-6 animate-spin text-primary" />
          </div>
        )}

        {/* 결과 */}
        {step === 'result' && result && (
          <MakeupAnalysisResultView result={result} onRetry={handleRetry} />
        )}
      </div>
    </div>
  );
}
