'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  type BodyAnalysisResult,
  type UserBodyInput,
} from '@/lib/mock/body-analysis';
import InputForm from './_components/InputForm';
import PhotoUpload from './_components/PhotoUpload';
import AnalysisLoading from './_components/AnalysisLoading';
import AnalysisResult from './_components/AnalysisResult';

type AnalysisStep = 'input' | 'upload' | 'loading' | 'result';

export default function BodyAnalysisPage() {
  const { isSignedIn } = useAuth();
  const [step, setStep] = useState<AnalysisStep>('input');
  const [userInput, setUserInput] = useState<UserBodyInput | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<BodyAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analysisStartedRef = useRef(false);

  // 기본 정보 입력 완료 시 사진 업로드 단계로 전환
  const handleInputSubmit = useCallback((data: UserBodyInput) => {
    setUserInput(data);
    setStep('upload');
    setError(null);
  }, []);

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

      const response = await fetch('/api/analyze/body', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64, userInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      console.log('[C-1] Analysis result:', data.usedMock ? 'Mock' : 'Real AI');

      // API 응답의 result + 퍼스널 컬러 추천 통합
      setResult({
        ...data.result,
        analyzedAt: new Date(data.result.analyzedAt),
        personalColorSeason: data.personalColorSeason,
        colorRecommendations: data.colorRecommendations,
        colorTips: data.colorTips,
      });
      setStep('result');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, userInput, isSignedIn]);

  // 로딩 애니메이션 완료 시 분석 시작
  const handleAnalysisComplete = useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  // 다시 분석하기
  const handleRetry = useCallback(() => {
    setUserInput(null);
    setImageFile(null);
    setResult(null);
    setStep('input');
    setError(null);
    analysisStartedRef.current = false;
  }, []);

  // 단계별 서브타이틀
  const getSubtitle = () => {
    if (error) return '분석 중 오류가 발생했어요';
    switch (step) {
      case 'input':
        return '나에게 어울리는 스타일이 궁금하신가요?';
      case 'upload':
        return '전신 사진을 업로드해주세요';
      case 'loading':
        return isAnalyzing ? 'AI가 분석 중이에요...' : 'AI가 분석 중이에요';
      case 'result':
        return '분석이 완료되었어요';
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">체형 분석</h1>
          <p className="text-gray-600 mt-2">{getSubtitle()}</p>
        </header>

        {/* 에러 메시지 */}
        {error && step === 'upload' && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}. 다시 시도해주세요.
          </div>
        )}

        {/* Step별 컴포넌트 렌더링 */}
        {step === 'input' && <InputForm onSubmit={handleInputSubmit} />}

        {step === 'upload' && <PhotoUpload onPhotoSelect={handlePhotoSelect} />}

        {step === 'loading' && (
          <AnalysisLoading onComplete={handleAnalysisComplete} />
        )}

        {step === 'result' && result && (
          <AnalysisResult result={result} onRetry={handleRetry} />
        )}
      </div>
    </main>
  );
}
