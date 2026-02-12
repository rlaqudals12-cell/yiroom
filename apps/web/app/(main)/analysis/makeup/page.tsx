'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, ArrowRight, Upload, Loader2 } from 'lucide-react';
import {
  type MakeupAnalysisResult,
  generateMockMakeupAnalysisResult,
  UNDERTONES,
} from '@/lib/mock/makeup-analysis';
import { Button } from '@/components/ui/button';
import { MakeupGuide } from './_components/MakeupGuide';
import { MakeupKnownTypeInput } from './_components/MakeupKnownTypeInput';
import { MakeupAnalysisResultView } from './_components/MakeupAnalysisResultView';

type AnalysisStep = 'guide' | 'upload' | 'known-input' | 'loading' | 'result';

// 날짜 포맷 헬퍼
function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
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
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [existingAnalysis, setExistingAnalysis] = useState<ExistingAnalysis | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<MakeupAnalysisResult | null>(null);
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

  // 분석 시작
  const handleStartAnalysis = useCallback(async () => {
    if (!imageFile || !isSignedIn) return;

    setIsAnalyzing(true);
    setStep('loading');
    setError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(imageFile);
      const imageBase64 = await base64Promise;

      const response = await fetch('/api/analyze/makeup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '분석에 실패했어요');
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

      setStep('result');
    } catch (err) {
      console.error('[M-1] Analysis error:', err);
      setError('분석 중 문제가 발생했어요');
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
    if (error) return '분석 중 오류가 발생했어요';
    switch (step) {
      case 'guide':
        return '정확한 분석을 위한 촬영 가이드';
      case 'upload':
        return '얼굴 사진을 선택해주세요';
      case 'known-input':
        return '피부 타입을 선택해주세요';
      case 'loading':
        return 'AI가 분석 중이에요...';
      case 'result':
        return '분석이 완료되었어요';
    }
  }, [step, error]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="makeup-analysis-page">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">💄 메이크업 분석</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </header>

        {/* 에러 메시지 */}
        {error && (
          <div
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm"
            role="alert"
            aria-live="assertive"
            data-testid="makeup-error-banner"
          >
            <p className="text-red-600">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-100 px-0"
              aria-label="메이크업 분석 다시 시도"
              data-testid="makeup-error-retry-button"
            >
              다시 시도하기 →
            </Button>
          </div>
        )}

        {/* 기존 분석 결과 배너 */}
        {step === 'guide' && existingAnalysis && !checkingExisting && (
          <Link
            href={`/analysis/makeup/result/${existingAnalysis.id}`}
            className="block mb-6 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200 hover:shadow-md transition-shadow"
            data-testid="makeup-existing-banner"
            aria-label={`기존 메이크업 분석 결과 보기 (${existingAnalysis.overall_score}점)`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-pink-600">
                    {existingAnalysis.overall_score}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">기존 분석 결과 보기</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDate(new Date(existingAnalysis.created_at))} ·{' '}
                    {UNDERTONE_LABELS[existingAnalysis.undertone] || existingAnalysis.undertone}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-pink-500" />
            </div>
          </Link>
        )}

        {/* 촬영 가이드 */}
        {step === 'guide' && (
          <MakeupGuide
            existingAnalysis={existingAnalysis}
            checkingExisting={checkingExisting}
            onStartUpload={() => setStep('upload')}
            onSkipToKnownInput={() => setStep('known-input')}
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
              aria-label="메이크업 분석용 사진 선택"
              data-testid="makeup-file-input"
            />

            {imagePreview ? (
              <div className="space-y-4">
                <div className="aspect-square rounded-xl overflow-hidden bg-muted relative">
                  <Image
                    src={imagePreview}
                    alt="선택된 이미지"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleUploadClick} className="flex-1">
                    다른 사진 선택
                  </Button>
                  <Button
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing}
                    className="flex-1 bg-pink-500 hover:bg-pink-600"
                    data-testid="makeup-analyze-button"
                    aria-label="메이크업 분석 시작"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      '분석 시작'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleUploadClick}
                className="w-full aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-pink-500/50 transition-colors flex flex-col items-center justify-center gap-4 bg-card"
                aria-label="사진을 선택해주세요. 탭하여 갤러리에서 선택"
                data-testid="makeup-upload-area"
              >
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-pink-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">사진을 선택해주세요</p>
                  <p className="text-sm text-muted-foreground mt-1">탭하여 갤러리에서 선택</p>
                </div>
              </button>
            )}

            <Button variant="ghost" onClick={() => setStep('guide')} className="w-full">
              ← 가이드로 돌아가기
            </Button>
          </div>
        )}

        {/* 알고있는 타입 입력 */}
        {step === 'known-input' && (
          <MakeupKnownTypeInput
            onSubmit={(undertone, concerns) => {
              const mockResult = generateMockMakeupAnalysisResult();
              setResult({
                ...mockResult,
                undertone,
                undertoneLabel: UNDERTONES.find((t) => t.id === undertone)?.label || '',
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
          <div
            className="flex flex-col items-center justify-center py-16"
            aria-live="polite"
            data-testid="makeup-loading"
          >
            <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mb-6 animate-pulse">
              <span className="text-4xl">💄</span>
            </div>
            <p className="text-lg font-medium text-foreground">AI가 얼굴을 분석하고 있어요</p>
            <p className="text-sm text-muted-foreground mt-2">잠시만 기다려주세요...</p>
            <Loader2 className="w-8 h-8 mt-6 animate-spin text-pink-500" />
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
