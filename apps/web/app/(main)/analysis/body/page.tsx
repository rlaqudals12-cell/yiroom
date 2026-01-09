'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import {
  type BodyAnalysisResult,
  type UserBodyInput,
  type BodyType3,
  BODY_TYPES_3,
  generateMockBodyAnalysis3,
} from '@/lib/mock/body-analysis';
import BodyPhotographyGuide from './_components/BodyPhotographyGuide';
import InputForm from './_components/InputForm';
import PhotoUpload from './_components/PhotoUpload';
import KnownBodyTypeInput from './_components/KnownBodyTypeInput';
import AnalysisLoading from './_components/AnalysisLoading';
import AnalysisResult from './_components/AnalysisResult';
import { useShare } from '@/hooks/useShare';
import { ShareButton } from '@/components/share';
import { Confetti } from '@/components/animations';
import { MultiAngleBodyCapture, type MultiAngleBodyImages } from '@/components/analysis/camera';

// 새로운 흐름: guide → input → multi-angle → loading → result
// 또는: guide → input → upload → loading → result (갤러리 단일 이미지)
// 또는: guide → known-type → result
type AnalysisStep =
  | 'guide'
  | 'input'
  | 'multi-angle'
  | 'upload'
  | 'loading'
  | 'result'
  | 'known-type';

export default function BodyAnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceNew = searchParams.get('forceNew') === 'true';
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [checkingExisting, setCheckingExisting] = useState(true);
  const existingCheckedRef = useRef(false);
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [userInput, setUserInput] = useState<UserBodyInput | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [multiAngleImages, setMultiAngleImages] = useState<MultiAngleBodyImages | null>(null);
  const [result, setResult] = useState<BodyAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const analysisStartedRef = useRef(false);
  const { ref: shareRef, share, loading: shareLoading } = useShare('이룸-체형분석-결과');

  // 기존 분석 결과 확인 및 자동 리디렉트
  useEffect(() => {
    let isRedirecting = false;

    async function checkExistingAnalysis() {
      // forceNew 파라미터가 있으면 자동 리디렉트 건너뛰기
      if (forceNew) {
        console.log('[C-1] forceNew=true, skipping auto-redirect');
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

  // 기존 체형 타입 알고 있음 → known-type 단계로
  const handleSkipToKnownType = useCallback(() => {
    setStep('known-type');
  }, []);

  // 기존 체형 타입 입력에서 돌아가기
  const handleKnownTypeBack = useCallback(() => {
    setStep('guide');
  }, []);

  // 기존 체형 타입 선택 → Mock 결과 생성
  const handleKnownTypeSelect = useCallback(
    (bodyType: BodyType3) => {
      const typeInfo = BODY_TYPES_3[bodyType];
      const mockResult = generateMockBodyAnalysis3(userInput || undefined);

      // 선택된 타입으로 결과 덮어쓰기 (BodyAnalysisResult 형식으로 변환)
      setResult({
        bodyType: bodyType as unknown as import('@/lib/mock/body-analysis').BodyType,
        bodyTypeLabel: typeInfo.label,
        bodyTypeDescription: typeInfo.description,
        measurements: mockResult.measurements,
        strengths: typeInfo.strengths,
        insight: typeInfo.insights[0],
        styleRecommendations: typeInfo.recommendations,
        analyzedAt: new Date(),
        userInput: userInput || undefined,
      });
      setStep('result');
      setShowConfetti(true);
    },
    [userInput]
  );

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
    analysisStartedRef.current = false;
  }, []);

  // 다각도 촬영 취소 시 입력 단계로 돌아가기
  const handleMultiAngleCancel = useCallback(() => {
    setStep('input');
  }, []);

  // 사진 선택 시 로딩 단계로 전환 (갤러리에서 단일 이미지 선택 시)
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

  // AI 분석 실행 (API 호출) - 다각도 또는 단일 이미지
  const runAnalysis = useCallback(async () => {
    // 다각도 이미지 또는 단일 이미지 중 하나가 있어야 함
    if ((!imageFile && !multiAngleImages) || !isSignedIn || analysisStartedRef.current) {
      return;
    }

    analysisStartedRef.current = true;
    setIsAnalyzing(true);

    try {
      let requestBody: Record<string, unknown>;

      if (multiAngleImages) {
        // 다각도 이미지 사용
        requestBody = {
          frontImageBase64: multiAngleImages.frontImageBase64,
          sideImageBase64: multiAngleImages.sideImageBase64,
          backImageBase64: multiAngleImages.backImageBase64,
          userInput,
        };
        const imageCount =
          1 +
          (multiAngleImages.sideImageBase64 ? 1 : 0) +
          (multiAngleImages.backImageBase64 ? 1 : 0);
        console.log(`[C-1] Analyzing with ${imageCount} image(s)`);
      } else if (imageFile) {
        // 단일 이미지 사용 (갤러리에서 선택)
        const imageBase64 = await fileToBase64(imageFile);
        requestBody = { imageBase64, userInput };
        console.log('[C-1] Analyzing with single image');
      } else {
        return;
      }

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
      console.log(
        '[C-1] Analysis result:',
        data.usedMock ? 'Mock' : 'Real AI',
        'Images:',
        data.imagesAnalyzed
      );

      // API 응답의 result + 퍼스널 컬러 추천 통합
      setResult({
        ...data.result,
        analyzedAt: new Date(data.result.analyzedAt),
        personalColorSeason: data.personalColorSeason,
        colorRecommendations: data.colorRecommendations,
        colorTips: data.colorTips,
        imagesAnalyzed: data.imagesAnalyzed,
      });
      setStep('result');
      // 분석 완료 시 축하 효과
      setShowConfetti(true);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStep('multi-angle');
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, multiAngleImages, userInput, isSignedIn]);

  // 로딩 애니메이션 완료 시 분석 시작
  const handleAnalysisComplete = useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  // 다시 분석하기
  const handleRetry = useCallback(() => {
    setUserInput(null);
    setImageFile(null);
    setMultiAngleImages(null);
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
      case 'input':
        return '나에게 어울리는 스타일이 궁금하신가요?';
      case 'multi-angle':
        return '정면, 측면, 후면 사진을 촬영해주세요';
      case 'upload':
        return '전신 사진을 업로드해주세요';
      case 'known-type':
        return '기존 체형 타입을 선택해주세요';
      case 'loading':
        return isAnalyzing ? 'AI가 분석 중이에요...' : 'AI가 분석 중이에요';
      case 'result':
        return '분석이 완료되었어요';
    }
  };

  // 기존 결과 확인 중이면 로딩 표시
  if (checkingExisting) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">확인 중...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* 축하 Confetti 효과 */}
      <Confetti trigger={showConfetti} />

      <main className="min-h-[calc(100vh-80px)] bg-muted">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 헤더 */}
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">체형 분석</h1>
            <p className="text-muted-foreground mt-2">{getSubtitle()}</p>
          </header>

          {/* 에러 메시지 */}
          {error && step === 'upload' && (
            <div
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
              role="alert"
              aria-live="polite"
            >
              {error}. 다시 시도해주세요.
            </div>
          )}

          {/* Step별 컴포넌트 렌더링 */}
          {step === 'guide' && (
            <BodyPhotographyGuide onContinue={handleGuideComplete} onSkip={handleSkipToKnownType} />
          )}

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

          {step === 'upload' && <PhotoUpload onPhotoSelect={handlePhotoSelect} />}

          {step === 'known-type' && (
            <KnownBodyTypeInput onSelect={handleKnownTypeSelect} onBack={handleKnownTypeBack} />
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
