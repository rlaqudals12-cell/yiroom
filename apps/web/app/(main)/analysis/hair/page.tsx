'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';
import { getDateLocale } from '@/lib/utils/date-format';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight, Upload, Loader2 } from 'lucide-react';
import { compressFileToBase64 } from '@/lib/utils/image-compression';
import {
  type HairAnalysisResult,
  getCautionIngredients,
  getScalpConcernNotice,
} from '@/lib/mock/hair-analysis';
import { Button } from '@/components/ui/button';
import { AnonymousFaceTemplate } from '@/components/analysis/overlay';
import { HairReportSheet } from './_components/HairReportSheet';
import { invalidateAnalysisCache } from '@/hooks/useAnalysisStatus';

type AnalysisStep = 'guide' | 'upload' | 'loading' | 'result';

// 날짜 포맷 헬퍼 (i18n)
function formatDate(
  date: Date,
  locale: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return t('date.today');
  if (days === 1) return t('date.yesterday');
  if (days < 7) return t('date.daysAgo', { days });
  if (days < 30) return t('date.weeksAgo', { weeks: Math.floor(days / 7) });
  return date.toLocaleDateString(getDateLocale(locale), { month: 'short', day: 'numeric' });
}

// 기존 분석 결과 타입
interface ExistingAnalysis {
  id: string;
  overall_score: number;
  hair_type: string;
  created_at: string;
}

export default function HairAnalysisPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const locale = useLocale();
  const t = useTranslations('analysisEntry');
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [existingAnalysis, setExistingAnalysis] = useState<ExistingAnalysis | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<HairAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const existingCheckedRef = useRef(false);

  // 기존 분석 결과 확인
  useEffect(() => {
    async function checkExistingAnalysis() {
      if (!isLoaded || !isSignedIn || existingCheckedRef.current) return;

      existingCheckedRef.current = true;

      try {
        const { data } = await supabase
          .from('hair_analyses')
          .select('id, overall_score, hair_type, created_at')
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
      const response = await fetch('/api/analyze/hair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
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
          `hair-result-${data.data.id}`,
          JSON.stringify({ dbData: data.data, cachedAt: new Date().toISOString() })
        );
      } catch {
        /* sessionStorage 실패 무시 */
      }

      // 분석 완료 → 홈/[나] 탭 5분 캐시 즉시 무효화 (stale "분석 0개" 방지)
      invalidateAnalysisCache();
      setStep('result');
    } catch (err) {
      console.error('[H-1] Analysis error:', err);
      setError(t('error.analysisProblem'));
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
        return t('hair.subtitle.guide');
      case 'upload':
        return t('hair.subtitle.upload');
      case 'loading':
        return t('subtitle.aiAnalyzing');
      case 'result':
        return t('subtitle.analysisComplete');
    }
  }, [step, error]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="hair-analysis-page">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t('hair.title')}</h1>
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
            href={`/analysis/hair/result/${existingAnalysis.id}`}
            className="block mb-6 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
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
              <ArrowRight className="w-5 h-5 text-amber-500" />
            </div>
          </Link>
        )}

        {/* 촬영 가이드 */}
        {step === 'guide' && (
          <div className="space-y-6">
            {/* 한 장이면 충분 — 사용자가 여러 장 촬영을 혼동하지 않도록 명시 */}
            <div
              className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300"
              data-testid="hair-single-photo-notice"
            >
              {t('hair.guideSinglePhoto')}
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-4">{t('hair.guideTitle')}</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">&#10003;</span>
                  {t('hair.guideTip1')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">&#10003;</span>
                  {t('hair.guideTip2')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">&#10003;</span>
                  {t('hair.guideTip3')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">&#10007;</span>
                  {t('hair.guideAvoid')}
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
              aria-label={t('hair.photoSelectAria')}
            />

            {imagePreview ? (
              <div className="space-y-4">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <Image
                    src={imagePreview}
                    alt={t('upload.selectedImage')}
                    fill
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
                    aria-label={t('hair.startAnalysisAria')}
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
                className="w-full aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-4 bg-card"
              >
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-amber-600 dark:text-amber-400" />
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
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-6 animate-pulse"></div>
            <p className="text-lg font-medium text-foreground">{t('hair.aiAnalyzingHair')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('loading.pleaseWait')}</p>
            <Loader2 className="w-8 h-8 mt-6 animate-spin text-amber-500" />
          </div>
        )}

        {/* 결과 */}
        {step === 'result' && result && (
          <AnalysisResultView result={result} onRetry={handleRetry} />
        )}
      </div>
    </div>
  );
}

// 결과 보기 컴포넌트
function AnalysisResultView({
  result,
  onRetry,
}: {
  result: HairAnalysisResult;
  onRetry: () => void;
}) {
  const t = useTranslations('analysisEntry');

  return (
    <div className="space-y-6" data-testid="hair-analysis-result">
      {/* Layer 0.5: 얼굴형 일러스트 도식 (ADR-097) */}
      <div className="flex justify-center">
        <AnonymousFaceTemplate faceShape="oval" skinTone="medium">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-background/80 rounded-lg px-3 py-2">
              <p className="font-semibold text-sm text-foreground">{result.hairTypeLabel}</p>
              <p className="text-xs text-muted-foreground">{result.scalpTypeLabel}</p>
            </div>
          </div>
        </AnonymousFaceTemplate>
      </div>

      {/* 진단지 시트 — 원형 채점·신호등 게이지 대신 속성표 + 스펙트럼 (ADR-120) */}
      <HairReportSheet
        hairTypeLabel={result.hairTypeLabel}
        hairThicknessLabel={result.hairThicknessLabel}
        scalpTypeLabel={result.scalpTypeLabel}
        overallScore={result.overallScore}
        metrics={result.metrics}
        reliability={result.analysisReliability}
        analyzedAt={result.analyzedAt}
        metricsTitle={t('hair.metricScores')}
        testId="hair-report-sheet"
      />

      {/* 인사이트 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-3">{t('hair.resultSummary')}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.insight}</p>
      </div>

      {/* 추천 성분 — 중립 칩 (포인트 컬러 없이 텍스트로만) */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-3">{t('hair.recommendedIngredients')}</h3>
        <div className="flex flex-wrap gap-2">
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

      {/* 주의 성분 — 취소선 문법 (경고색 대신 "지운 항목"으로 말한다) */}
      {(() => {
        const cautions = getCautionIngredients(result.scalpType);
        if (cautions.length === 0) return null;
        return (
          <div className="bg-card rounded-xl p-6 shadow-sm" data-testid="hair-caution-ingredients">
            <h3 className="font-semibold mb-3">{t('hair.cautionIngredients')}</h3>
            <div className="flex flex-wrap gap-2">
              {cautions.map((ingredient, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full border border-border text-sm text-muted-foreground line-through decoration-muted-foreground/60"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* 두피 고민 안내 — 탈모·비듬 등은 진단이 아닌 "전문의 상담 권유" 형태로만 (muted note) */}
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
              {t('hair.scalpConcernTitle')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{notice}</p>
          </div>
        );
      })()}

      {/* 케어 팁 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-3">{t('hair.careTips')}</h3>
        <ul className="space-y-2">
          {result.careTips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span aria-hidden="true">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* 버튼 */}
      <Button onClick={onRetry} variant="outline" className="w-full">
        {t('action.reAnalyze')}
      </Button>
    </div>
  );
}
