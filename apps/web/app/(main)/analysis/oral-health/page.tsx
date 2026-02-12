'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import { Clock, ArrowRight, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OralHealthResultCard } from '@/components/analysis/oral-health';
import type { OralHealthAssessment } from '@/types/oral-health';

type AnalysisStep = 'guide' | 'upload' | 'loading' | 'result';

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

// 기존 분석 결과 타입
interface ExistingAnalysis {
  id: string;
  overall_score: number;
  created_at: string;
}

export default function OralHealthAnalysisPage(): React.JSX.Element {
  const { isSignedIn, isLoaded } = useAuth();
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
      // 파일을 Base64로 변환
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(imageFile);
      const imageBase64 = await base64Promise;

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
        throw new Error(errorData.error?.message || '분석에 실패했어요');
      }

      const data = await response.json();

      if (!data.success || !data.data?.assessment) {
        throw new Error('분석 결과를 받을 수 없었어요');
      }

      setResult(data.data.assessment);
      setStep('result');
    } catch (err) {
      console.error('[OH-1] Analysis error:', err);
      setError('분석 중 문제가 발생했어요. 다시 시도해주세요.');
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
    if (error) return '분석 중 문제가 발생했어요';
    switch (step) {
      case 'guide':
        return '정확한 분석을 위한 촬영 가이드';
      case 'upload':
        return '치아/잇몸 사진을 선택해주세요';
      case 'loading':
        return 'AI가 분석 중이에요...';
      case 'result':
        return '분석이 완료되었어요';
    }
  }, [step, error]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="oral-health-analysis-page">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">구강건강 분석</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </header>

        {/* 에러 메시지 */}
        {error && (
          <div
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* 기존 분석 결과 배너 */}
        {step === 'guide' && existingAnalysis && !checkingExisting && (
          <Link
            href={`/analysis/oral-health/result/${existingAnalysis.id}`}
            className="block mb-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-cyan-600">
                    {existingAnalysis.overall_score}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">기존 분석 결과 보기</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDate(new Date(existingAnalysis.created_at))}
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
              <h2 className="font-semibold text-lg mb-4">촬영 가이드</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500">&#10003;</span>
                  밝은 조명 아래에서 입을 크게 벌려 촬영해주세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500">&#10003;</span>
                  윗니와 아랫니 모두 보이도록 촬영하면 좋아요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500">&#10003;</span>
                  잇몸 상태를 확인하려면 잇몸이 잘 보이게 해주세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">&#10007;</span>
                  음식물이 묻어있거나 립스틱을 바른 상태는 피해주세요
                </li>
              </ul>
            </div>

            <Button onClick={() => setStep('upload')} className="w-full">
              사진 선택하기
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
              aria-label="구강 건강 분석용 사진 선택"
            />

            {imagePreview ? (
              <div className="space-y-4">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                  <img
                    src={imagePreview}
                    alt="선택된 이미지"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleUploadClick} className="flex-1">
                    다른 사진 선택
                  </Button>
                  <Button
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing}
                    className="flex-1"
                    aria-label="구강 건강 분석 시작"
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
                className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-4 bg-card"
              >
                <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-cyan-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">사진을 선택해주세요</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    치아와 잇몸이 잘 보이는 사진을 선택해주세요
                  </p>
                </div>
              </button>
            )}

            <Button variant="ghost" onClick={() => setStep('guide')} className="w-full">
              &#8592; 가이드로 돌아가기
            </Button>
          </div>
        )}

        {/* 로딩 */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-cyan-100 flex items-center justify-center mb-6 animate-pulse">
              <span className="text-4xl">&#x1F9B7;</span>
            </div>
            <p className="text-lg font-medium text-foreground">AI가 구강 상태를 분석하고 있어요</p>
            <p className="text-sm text-muted-foreground mt-2">잠시만 기다려주세요...</p>
            <Loader2 className="w-8 h-8 mt-6 animate-spin text-cyan-500" />
          </div>
        )}

        {/* 결과 */}
        {step === 'result' && result && (
          <div className="space-y-6">
            <OralHealthResultCard assessment={result} />

            <Button onClick={handleRetry} variant="outline" className="w-full">
              다시 분석하기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
