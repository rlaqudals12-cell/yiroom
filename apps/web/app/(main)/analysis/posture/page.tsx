'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import { Clock, ArrowRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type PostureAnalysisResult,
  type PostureType,
  POSTURE_TYPES,
} from '@/lib/mock/posture-analysis';
import PosturePhotographyGuide from './_components/PosturePhotographyGuide';
import PhotoUpload from './_components/PhotoUpload';
import AnalysisLoading from './_components/AnalysisLoading';
import AnalysisResult from './_components/AnalysisResult';
import { useShare } from '@/hooks/useShare';
import { ShareButton } from '@/components/share';
import { Confetti } from '@/components/animations';

// 분석 단계
type AnalysisStep = 'guide' | 'front-upload' | 'side-upload' | 'loading' | 'result';

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

// 자세 타입 라벨 헬퍼
function getPostureTypeLabel(postureType: string): string {
  const info = POSTURE_TYPES[postureType as PostureType];
  return info?.label || postureType;
}

// 기존 분석 결과 타입
interface ExistingAnalysis {
  id: string;
  posture_type: string;
  overall_score: number;
  created_at: string;
}

export default function PostureAnalysisPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [existingAnalysis, setExistingAnalysis] = useState<ExistingAnalysis | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const existingCheckedRef = useRef(false);
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [sideImage, setSideImage] = useState<File | null>(null);
  const [result, setResult] = useState<PostureAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const analysisStartedRef = useRef(false);
  const { ref: shareRef, share, loading: shareLoading } = useShare('이룸-자세분석-결과');

  // 기존 분석 결과 확인
  useEffect(() => {
    async function checkExistingAnalysis() {
      if (!isLoaded || !isSignedIn || existingCheckedRef.current) return;

      existingCheckedRef.current = true;

      try {
        const { data } = await supabase
          .from('posture_analyses')
          .select('id, posture_type, overall_score, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setExistingAnalysis(data);
        }
      } catch {
        // 기존 결과 없음 - 무시
      } finally {
        setCheckingExisting(false);
      }
    }

    checkExistingAnalysis();
  }, [isLoaded, isSignedIn, supabase]);

  // 가이드 완료 → 정면 촬영 단계로
  const handleGuideComplete = useCallback(() => {
    setStep('front-upload');
  }, []);

  // 정면 사진 선택 완료
  const handleFrontPhotoSelect = useCallback((file: File) => {
    setFrontImage(file);
    setStep('side-upload');
    setError(null);
  }, []);

  // 측면 사진 선택 완료 (또는 스킵)
  const handleSidePhotoSelect = useCallback((file: File | null) => {
    setSideImage(file);
    setStep('loading');
    setError(null);
    analysisStartedRef.current = false;
  }, []);

  // 측면 사진 스킵
  const handleSkipSidePhoto = useCallback(() => {
    handleSidePhotoSelect(null);
  }, [handleSidePhotoSelect]);

  // 이미지를 Base64로 변환
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // AI 분석 실행 (API 호출)
  const runAnalysis = useCallback(async () => {
    if (!frontImage || !isSignedIn || analysisStartedRef.current) {
      return;
    }

    analysisStartedRef.current = true;
    setIsAnalyzing(true);

    try {
      const frontImageBase64 = await fileToBase64(frontImage);
      const sideImageBase64 = sideImage ? await fileToBase64(sideImage) : undefined;

      console.log(`[A-1] Analyzing with ${sideImage ? 2 : 1} image(s)`);

      const response = await fetch('/api/analyze/posture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frontImageBase64,
          sideImageBase64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      console.log('[A-1] Analysis result:', data.usedMock ? 'Mock' : 'Real AI');

      // API 응답을 PostureAnalysisResult 형식으로 변환
      setResult({
        ...data.result,
        analyzedAt: new Date(data.result.analyzedAt),
      });
      setStep('result');
      setShowConfetti(true);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStep('front-upload');
    } finally {
      setIsAnalyzing(false);
    }
  }, [frontImage, sideImage, isSignedIn]);

  // 로딩 애니메이션 완료 시 분석 시작
  const handleAnalysisComplete = useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  // 다시 분석하기
  const handleRetry = useCallback(() => {
    setFrontImage(null);
    setSideImage(null);
    setResult(null);
    setStep('guide');
    setError(null);
    setShowConfetti(false);
    analysisStartedRef.current = false;
  }, []);

  // 단계별 서브타이틀
  const getSubtitle = () => {
    if (error) return '분석 중 오류가 발생했어요';
    switch (step) {
      case 'guide':
        return '정확한 분석을 위한 촬영 가이드';
      case 'front-upload':
        return '정면 전신 사진을 촬영해주세요';
      case 'side-upload':
        return '측면 사진을 촬영해주세요 (선택)';
      case 'loading':
        return isAnalyzing ? 'AI가 분석 중이에요...' : 'AI가 분석 중이에요';
      case 'result':
        return '분석이 완료되었어요';
    }
  };

  return (
    <>
      {/* 축하 Confetti 효과 */}
      <Confetti trigger={showConfetti} />

      <main className="min-h-[calc(100vh-80px)] bg-muted" data-testid="posture-analysis-page">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 헤더 */}
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">자세 분석</h1>
            <p className="text-muted-foreground mt-2">{getSubtitle()}</p>
          </header>

          {/* 에러 메시지 */}
          {error && (step === 'front-upload' || step === 'side-upload') && (
            <div
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
              role="alert"
              aria-live="polite"
            >
              {error}. 다시 시도해주세요.
            </div>
          )}

          {/* 기존 분석 결과 배너 */}
          {step === 'guide' && existingAnalysis && !checkingExisting && (
            <Link
              href={`/analysis/posture/result/${existingAnalysis.id}`}
              className="block mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">기존 분석 결과 보기</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-blue-600">
                        {getPostureTypeLabel(existingAnalysis.posture_type)}
                      </span>
                      <span>-</span>
                      <span>{existingAnalysis.overall_score}점</span>
                      <span>-</span>
                      <Clock className="w-3 h-3" />
                      {formatDate(new Date(existingAnalysis.created_at))}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500" />
              </div>
            </Link>
          )}

          {/* Step별 컴포넌트 렌더링 */}
          {step === 'guide' && <PosturePhotographyGuide onContinue={handleGuideComplete} />}

          {step === 'front-upload' && (
            <PhotoUpload onPhotoSelect={handleFrontPhotoSelect} angle="front" />
          )}

          {step === 'side-upload' && (
            <div className="space-y-4">
              <PhotoUpload onPhotoSelect={handleSidePhotoSelect} angle="side" />
              <Button variant="outline" onClick={handleSkipSidePhoto} className="w-full">
                측면 사진 건너뛰기
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                측면 사진을 추가하면 더 정확한 분석이 가능해요
              </p>
            </div>
          )}

          {step === 'loading' && <AnalysisLoading onComplete={handleAnalysisComplete} />}

          {step === 'result' && result && (
            <AnalysisResult result={result} onRetry={handleRetry} shareRef={shareRef} />
          )}
        </div>
      </main>

      {/* 공유 버튼 - 결과 화면에서만 하단 고정 */}
      {step === 'result' && result && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/80 backdrop-blur-sm border-t border-border/50 z-10">
          <div className="max-w-md mx-auto">
            <ShareButton onShare={share} loading={shareLoading} variant="outline" />
          </div>
        </div>
      )}
    </>
  );
}
