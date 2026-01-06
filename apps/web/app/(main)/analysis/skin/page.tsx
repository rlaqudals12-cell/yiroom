'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import { Clock, ArrowRight, Camera, ImageIcon } from 'lucide-react';
import {
  type SkinAnalysisResult,
  type SkinTypeId,
  type SkinConcernId,
  generateMockAnalysisResult,
  SKIN_CONCERNS,
} from '@/lib/mock/skin-analysis';
import type { MultiAngleImages } from '@/types/visual-analysis';
import LightingGuide from './_components/LightingGuide';
import PhotoUpload from './_components/PhotoUpload';
import MultiAngleSkinCapture from './_components/MultiAngleSkinCapture';
import KnownSkinTypeInput from './_components/KnownSkinTypeInput';
import AnalysisLoading from './_components/AnalysisLoading';
import AnalysisResult from './_components/AnalysisResult';
import { useShare } from '@/hooks/useShare';
import { ShareButton } from '@/components/share';
import { Confetti } from '@/components/animations';

// 새 플로우: 조명가이드 → 모드선택 → 사진촬영 → AI분석 → 결과
// 또는: 기존 피부 타입 입력 → 결과
type CaptureMode = 'select' | 'camera' | 'gallery';
type AnalysisStep =
  | 'guide'
  | 'mode-select'
  | 'camera'
  | 'upload'
  | 'loading'
  | 'result'
  | 'known-input';

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
  skin_type: string;
  created_at: string;
}

export default function SkinAnalysisPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('select');
  const [existingAnalysis, setExistingAnalysis] = useState<ExistingAnalysis | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  // 다각도 이미지 상태
  const [multiAngleImages, setMultiAngleImages] = useState<MultiAngleImages | null>(null);
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const analysisStartedRef = useRef(false);
  const existingCheckedRef = useRef(false);
  const { ref: shareRef, share, loading: shareLoading } = useShare('이룸-피부분석-결과');

  // 기존 분석 결과 확인
  useEffect(() => {
    async function checkExistingAnalysis() {
      if (!isLoaded || !isSignedIn || existingCheckedRef.current) return;

      existingCheckedRef.current = true;

      try {
        const { data } = await supabase
          .from('skin_analyses')
          .select('id, overall_score, skin_type, created_at')
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

  // 조명 가이드 완료 → 모드 선택으로
  const handleGuideComplete = useCallback(() => {
    setStep('mode-select');
    setCaptureMode('select');
  }, []);

  // 카메라 모드 선택 (다각도 촬영)
  const handleSelectCameraMode = useCallback(() => {
    setCaptureMode('camera');
    setStep('camera');
  }, []);

  // 갤러리 모드 선택 (단일 이미지)
  const handleSelectGalleryMode = useCallback(() => {
    setCaptureMode('gallery');
    setStep('upload');
  }, []);

  // 다각도 촬영 완료 핸들러
  const handleMultiAngleCaptureComplete = useCallback((images: MultiAngleImages) => {
    setMultiAngleImages(images);
    setStep('loading');
    setError(null);
    analysisStartedRef.current = false;
  }, []);

  // 다각도 촬영 취소 핸들러
  const handleMultiAngleCaptureCancel = useCallback(() => {
    setStep('mode-select');
    setCaptureMode('select');
  }, []);

  // 기존 피부 타입 알고 있음 → 입력 화면으로
  const handleSkipToKnownInput = useCallback(() => {
    setStep('known-input');
  }, []);

  // 기존 피부 타입 입력 → 결과 생성
  const handleKnownTypeSelect = useCallback((skinType: SkinTypeId, concerns: SkinConcernId[]) => {
    // Mock 결과 생성
    const mockResult = generateMockAnalysisResult();

    // 고민 정보 찾기
    const concernLabels = concerns
      .map((id) => SKIN_CONCERNS.find((c) => c.id === id)?.label)
      .filter(Boolean)
      .join(', ');

    // 피부 타입에 따른 인사이트 생성
    const typeInsights: Record<SkinTypeId, string> = {
      dry: '건성 피부는 수분 보충이 중요해요! 히알루론산과 세라마이드 성분을 추천드려요.',
      oily: '지성 피부는 유분 조절이 핵심이에요. 가벼운 수분크림과 BHA 성분을 활용해보세요.',
      combination: '복합성 피부는 부위별 케어가 필요해요. T존과 U존을 다르게 관리해주세요.',
      normal: '중성 피부는 현재 상태를 유지하는 것이 중요해요. 기본 루틴을 꾸준히 지켜주세요.',
      sensitive: '민감성 피부는 순한 성분이 필수예요. 세라마이드와 알로에베라를 추천드려요.',
    };

    setResult({
      ...mockResult,
      insight:
        typeInsights[skinType] +
        (concernLabels ? ` 특히 ${concernLabels} 관리에 신경써주세요.` : ''),
      analyzedAt: new Date(),
    });
    setStep('result');
    setShowConfetti(true);
  }, []);

  // 기존 피부 타입 입력에서 돌아가기
  const handleKnownInputBack = useCallback(() => {
    setStep('guide');
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

  // AI 분석 실행 (API 호출) - 다각도/단일 모드 모두 지원
  const runAnalysis = useCallback(async () => {
    // 갤러리 모드 (단일 이미지) 또는 카메라 모드 (다각도)
    const hasGalleryImage = imageFile && captureMode === 'gallery';
    const hasMultiAngleImages = multiAngleImages && captureMode === 'camera';

    if ((!hasGalleryImage && !hasMultiAngleImages) || !isSignedIn || analysisStartedRef.current) {
      return;
    }

    analysisStartedRef.current = true;
    setIsAnalyzing(true);

    try {
      let requestBody: Record<string, string | undefined>;

      if (hasMultiAngleImages) {
        // 다각도 촬영 모드: 3장의 이미지 전송
        requestBody = {
          frontImageBase64: multiAngleImages.frontImageBase64,
          leftImageBase64: multiAngleImages.leftImageBase64,
          rightImageBase64: multiAngleImages.rightImageBase64,
        };
      } else if (hasGalleryImage) {
        // 갤러리 모드: 단일 이미지를 frontImageBase64로 전송 (하위 호환성)
        const imageBase64 = await fileToBase64(imageFile);
        requestBody = {
          frontImageBase64: imageBase64,
        };
      } else {
        throw new Error('No image available');
      }

      const response = await fetch('/api/analyze/skin', {
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
      console.error('[S-1] Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      // 에러 시 촬영 모드에 따라 적절한 단계로 복귀
      setStep(captureMode === 'camera' ? 'camera' : 'upload');
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, multiAngleImages, captureMode, isSignedIn]);

  // 로딩 애니메이션 완료 시 분석 시작
  const handleAnalysisComplete = useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  // 다시 분석하기
  const handleRetry = useCallback(() => {
    setImageFile(null);
    setMultiAngleImages(null);
    setCaptureMode('select');
    setResult(null);
    setStep('guide');
    setError(null);
    setShowConfetti(false);
    analysisStartedRef.current = false;
  }, []);

  // 단계별 서브타이틀
  const subtitle = useMemo(() => {
    if (error) return '분석 중 오류가 발생했어요';
    switch (step) {
      case 'guide':
        return '정확한 분석을 위한 촬영 가이드';
      case 'mode-select':
        return '촬영 방법을 선택해주세요';
      case 'camera':
        return '다각도 피부 촬영';
      case 'upload':
        return '피부 사진을 선택해주세요';
      case 'known-input':
        return '피부 타입을 선택해주세요';
      case 'loading':
        return isAnalyzing ? 'AI가 분석 중이에요...' : 'AI가 분석 중이에요';
      case 'result':
        return '분석이 완료되었어요';
    }
  }, [step, error, isAnalyzing]);

  return (
    <>
      {/* 축하 Confetti 효과 */}
      <Confetti trigger={showConfetti} />

      <main className="min-h-[calc(100vh-80px)] bg-muted">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 헤더 */}
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">피부 분석</h1>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          </header>

          {/* 에러 메시지 */}
          {error && (step === 'upload' || step === 'camera') && (
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
              href={`/analysis/skin/result/${existingAnalysis.id}`}
              className="block mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-emerald-600">
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
                <ArrowRight className="w-5 h-5 text-emerald-500" />
              </div>
            </Link>
          )}

          {/* Step별 컴포넌트 렌더링 */}
          {step === 'guide' && (
            <LightingGuide onContinue={handleGuideComplete} onSkip={handleSkipToKnownInput} />
          )}

          {/* 모드 선택 UI */}
          {step === 'mode-select' && (
            <div className="space-y-6" data-testid="capture-mode-select">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">피부 분석을 위한 사진이 필요해요</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 카메라 모드 (다각도 촬영) */}
                <button
                  onClick={handleSelectCameraMode}
                  className="flex flex-col items-center justify-center p-6 bg-card rounded-xl border-2 border-transparent hover:border-primary/50 hover:shadow-md transition-all"
                  data-testid="camera-mode-button"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Camera className="w-7 h-7 text-primary" aria-hidden="true" />
                  </div>
                  <span className="font-medium text-foreground">촬영</span>
                  <span className="text-xs text-muted-foreground mt-1">(다각도)</span>
                </button>

                {/* 갤러리 모드 (단일 이미지) */}
                <button
                  onClick={handleSelectGalleryMode}
                  className="flex flex-col items-center justify-center p-6 bg-card rounded-xl border-2 border-transparent hover:border-primary/50 hover:shadow-md transition-all"
                  data-testid="gallery-mode-button"
                >
                  <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                    <ImageIcon className="w-7 h-7 text-secondary-foreground" aria-hidden="true" />
                  </div>
                  <span className="font-medium text-foreground">갤러리</span>
                  <span className="text-xs text-muted-foreground mt-1">(단일)</span>
                </button>
              </div>

              {/* 모드 설명 */}
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong className="text-foreground">촬영 모드</strong>: 정면 + 좌/우측 다각도
                  촬영으로 더 정확한 분석이 가능해요
                </p>
                <p>
                  <strong className="text-foreground">갤러리 모드</strong>: 기존에 찍은 정면
                  사진으로 간편하게 분석해요
                </p>
              </div>
            </div>
          )}

          {/* 카메라 모드: 다각도 촬영 */}
          {step === 'camera' && (
            <MultiAngleSkinCapture
              onComplete={handleMultiAngleCaptureComplete}
              onCancel={handleMultiAngleCaptureCancel}
            />
          )}

          {/* 갤러리 모드: 단일 이미지 업로드 */}
          {step === 'upload' && <PhotoUpload onPhotoSelect={handlePhotoSelect} />}

          {step === 'known-input' && (
            <KnownSkinTypeInput onSelect={handleKnownTypeSelect} onBack={handleKnownInputBack} />
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
