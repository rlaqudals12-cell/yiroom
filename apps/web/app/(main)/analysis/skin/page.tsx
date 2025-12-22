'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { type SkinAnalysisResult } from '@/lib/mock/skin-analysis';
import PhotoUpload from './_components/PhotoUpload';
import AnalysisLoading from './_components/AnalysisLoading';
import AnalysisResult from './_components/AnalysisResult';
import { useShare } from '@/hooks/useShare';
import { ShareButton } from '@/components/share';
import { Confetti } from '@/components/animations';

type AnalysisStep = 'upload' | 'loading' | 'result';

export default function SkinAnalysisPage() {
  const { isSignedIn } = useAuth();
  const [step, setStep] = useState<AnalysisStep>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const analysisStartedRef = useRef(false);
  const { ref: shareRef, share, loading: shareLoading } = useShare('이룸-피부분석-결과');

  // 사진 선택 시 로딩 단계로 전환
  const handlePhotoSelect = useCallback((file: File) => {
    setImageFile(file);
    setStep('loading');
    setError(null);
    analysisStartedRef.current = false;
  }, []);

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
    if (!imageFile || !isSignedIn || analysisStartedRef.current) {
      return;
    }

    analysisStartedRef.current = true;
    setIsAnalyzing(true);

    try {
      const imageBase64 = await fileToBase64(imageFile);

      const response = await fetch('/api/analyze/skin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      console.log('[S-1] Analysis result:', data.usedMock ? 'Mock' : 'Real AI');

      // API 응답의 result + 성분 분석 + 제품 추천 통합
      setResult({
        ...data.result,
        analyzedAt: new Date(data.result.analyzedAt),
        personalColorSeason: data.personalColorSeason,
        foundationRecommendation: data.foundationRecommendation,
        ingredientWarnings: data.ingredientWarnings,
        productRecommendations: data.productRecommendations,
      });
      setStep('result');
      // 분석 완료 시 축하 효과
      setShowConfetti(true);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, isSignedIn]);

  // 로딩 애니메이션 완료 시 분석 시작
  const handleAnalysisComplete = useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  // 다시 분석하기
  const handleRetry = useCallback(() => {
    setImageFile(null);
    setResult(null);
    setStep('upload');
    setError(null);
    setShowConfetti(false);
    analysisStartedRef.current = false;
  }, []);

  // 서브타이틀
  const getSubtitle = () => {
    if (error) return '분석 중 오류가 발생했어요';
    if (step === 'upload') return '오늘 피부 상태가 궁금하신가요?';
    if (step === 'loading') {
      return isAnalyzing ? 'AI가 분석 중이에요...' : 'AI가 분석 중이에요';
    }
    if (step === 'result') return '분석이 완료되었어요';
    return '';
  };

  return (
    <>
      {/* 축하 Confetti 효과 */}
      <Confetti trigger={showConfetti} />

      <main className="min-h-[calc(100vh-80px)] bg-muted">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 헤더 */}
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">피부 분석</h1>
            <p className="text-muted-foreground mt-2">{getSubtitle()}</p>
          </header>

          {/* 에러 메시지 */}
          {error && step === 'upload' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}. 다시 시도해주세요.
            </div>
          )}

          {/* Step별 컴포넌트 렌더링 */}
          {step === 'upload' && <PhotoUpload onPhotoSelect={handlePhotoSelect} />}

          {step === 'loading' && (
            <AnalysisLoading onComplete={handleAnalysisComplete} />
          )}

          {step === 'result' && result && (
            <AnalysisResult result={result} onRetry={handleRetry} shareRef={shareRef} />
          )}
        </div>
      </main>

      {/* 공유 버튼 - 결과 화면에서만 하단 고정 */}
      {step === 'result' && result && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-card/80 backdrop-blur-sm border-t border-border/50 z-10">
          <div className="max-w-md mx-auto">
            <ShareButton
              onShare={share}
              loading={shareLoading}
              variant="outline"
            />
          </div>
        </div>
      )}
    </>
  );
}
