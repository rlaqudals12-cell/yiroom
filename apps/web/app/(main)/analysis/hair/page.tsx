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
  type HairTypeId,
  type HairConcernId,
  generateMockHairAnalysisResult,
  HAIR_TYPES,
  HAIR_CONCERNS,
} from '@/lib/mock/hair-analysis';
import { Button } from '@/components/ui/button';
import { mapToClass } from '@/lib/utils/conditional-helpers';
import { AnonymousFaceTemplate } from '@/components/analysis/overlay';

type AnalysisStep = 'guide' | 'upload' | 'known-input' | 'loading' | 'result';

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

      setStep('result');
    } catch (err) {
      console.error('[H-1] Analysis error:', err);
      setError(t('error.analysisProblem'));
      setStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, isSignedIn]);

  // 알고 있는 타입으로 건너뛰기
  const handleSkipToKnownInput = useCallback(() => {
    setStep('known-input');
  }, []);

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
      case 'known-input':
        return t('hair.subtitle.knownInput');
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
            className="block mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200 dark:border-amber-800 hover:shadow-md transition-shadow"
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

            <div className="flex gap-3">
              <Button onClick={() => setStep('upload')} className="flex-1">
                {t('action.selectPhoto')}
              </Button>
              <Button variant="outline" onClick={handleSkipToKnownInput}>
                {t('action.alreadyKnow')}
              </Button>
            </div>
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

        {/* 알고있는 타입 입력 */}
        {step === 'known-input' && (
          <KnownTypeInput
            onSubmit={(type, concerns) => {
              const mockResult = generateMockHairAnalysisResult();
              setResult({
                ...mockResult,
                hairType: type,
                hairTypeLabel: HAIR_TYPES.find((t) => t.id === type)?.label || '',
                concerns,
                analyzedAt: new Date(),
              });
              setStep('result');
            }}
            onBack={() => setStep('guide')}
          />
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

// 알고있는 타입 입력 컴포넌트
function KnownTypeInput({
  onSubmit,
  onBack,
}: {
  onSubmit: (type: HairTypeId, concerns: HairConcernId[]) => void;
  onBack: () => void;
}) {
  const t = useTranslations('analysisEntry');
  const [selectedType, setSelectedType] = useState<HairTypeId | null>(null);
  const [selectedConcerns, setSelectedConcerns] = useState<HairConcernId[]>([]);

  const toggleConcern = (id: HairConcernId) => {
    setSelectedConcerns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* 모발 타입 선택 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">{t('hair.selectHairType')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {HAIR_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedType === type.id
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-muted hover:border-amber-200'
              }`}
            >
              <span className="text-2xl mb-2 block">{type.emoji}</span>
              <span className="font-medium text-sm">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 고민 선택 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">{t('hair.selectConcerns')}</h3>
        <div className="flex flex-wrap gap-2">
          {HAIR_CONCERNS.map((concern) => (
            <button
              key={concern.id}
              onClick={() => toggleConcern(concern.id)}
              className={`px-3 py-2 rounded-full text-sm transition-all ${
                selectedConcerns.includes(concern.id)
                  ? 'bg-amber-500 text-white'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {concern.emoji} {concern.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          {t('action.back')}
        </Button>
        <Button
          onClick={() => selectedType && onSubmit(selectedType, selectedConcerns)}
          disabled={!selectedType}
          className="flex-1"
        >
          {t('action.viewResult')}
        </Button>
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/40';
      case 'warning':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/40';
      default:
        return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40';
    }
  };

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

      {/* 종합 점수 */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-6 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-white dark:bg-amber-900/40 shadow-lg flex items-center justify-center mb-4">
          <span className="text-4xl font-bold text-amber-600 dark:text-amber-400">
            {result.overallScore}
          </span>
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {result.hairTypeLabel} · {result.hairThicknessLabel}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{result.scalpTypeLabel}</p>
      </div>

      {/* 인사이트 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-3">{t('hair.resultSummary')}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.insight}</p>
      </div>

      {/* 지표 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">{t('hair.metricScores')}</h3>
        <div className="space-y-4">
          {result.metrics.map((metric) => (
            <div key={metric.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{metric.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(metric.status)}`}
                >
                  {t('hair.scorePoints', { score: metric.value })}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${mapToClass(metric.status, { good: 'bg-green-500', warning: 'bg-red-500' }, 'bg-amber-500')}`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 추천 성분 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-3">{t('hair.recommendedIngredients')}</h3>
        <div className="flex flex-wrap gap-2">
          {result.recommendedIngredients.map((ingredient, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full text-sm"
            >
              {ingredient}
            </span>
          ))}
        </div>
      </div>

      {/* 케어 팁 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-3">{t('hair.careTips')}</h3>
        <ul className="space-y-2">
          {result.careTips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-amber-500">•</span>
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
