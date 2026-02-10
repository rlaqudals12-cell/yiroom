'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Camera, ImageIcon } from 'lucide-react';
import type { SkinAnalysisResult } from '@/lib/mock/skin-analysis';
import type { MultiAngleImages } from '@/types/visual-analysis';
import type { ImageConsent } from '@/components/analysis/consent/types';
import LightingGuide from './_components/LightingGuide';
import GalleryMultiAngleSkinUpload from './_components/GalleryMultiAngleSkinUpload';
import MultiAngleSkinCapture from './_components/MultiAngleSkinCapture';
// KnownSkinTypeInput 제거됨 - AI가 피부 타입 자동 판단
import AnalysisLoading from './_components/AnalysisLoading';
import AnalysisResult from './_components/AnalysisResult';
import { ImageConsentModal } from '@/components/analysis/consent';
import { useShare } from '@/hooks/useShare';
import { ShareButton } from '@/components/share';
import { Confetti } from '@/components/animations';
import { PhotoReuseSelector } from '@/components/analysis/skin/PhotoReuseSelector';
import { checkPhotoReuseEligibility, type PhotoReuseEligibility } from '@/lib/analysis';

// 새 플로우: 조명가이드 → 모드선택 → 사진촬영 → AI분석 → 결과
// 또는: 기존 피부 타입 입력 → 결과
type CaptureMode = 'select' | 'camera' | 'gallery';
type AnalysisStep = 'guide' | 'mode-select' | 'camera' | 'upload' | 'loading' | 'result';

export default function SkinAnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceNew = searchParams.get('forceNew') === 'true';
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('select');
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  // 다각도 이미지 상태
  const [multiAngleImages, setMultiAngleImages] = useState<MultiAngleImages | null>(null);
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  // 이미지 동의 관련 상태
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [existingConsent, setExistingConsent] = useState<ImageConsent | null>(null);
  const [consentLoading, setConsentLoading] = useState(false);
  // 임시 이미지 상태 (동의 모달 표시 전 저장)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingMultiAngleImages, setPendingMultiAngleImages] = useState<MultiAngleImages | null>(
    null
  );
  // 사진 재사용 상태
  const [photoReuseEligibility, setPhotoReuseEligibility] = useState<PhotoReuseEligibility | null>(
    null
  );
  const [reuseChecking, setReuseChecking] = useState(false);
  const analysisStartedRef = useRef(false);
  const existingCheckedRef = useRef(false);
  const consentCheckedRef = useRef(false);
  const reuseCheckedRef = useRef(false);
  const { ref: shareRef, share, loading: shareLoading } = useShare('이룸-피부분석-결과');

  // 기존 분석 결과 확인 및 자동 리디렉트
  useEffect(() => {
    let isRedirecting = false;

    async function checkExistingAnalysis() {
      // forceNew 파라미터가 있으면 자동 리디렉트 건너뛰기
      if (forceNew) {
        console.log('[S-1] forceNew=true, skipping auto-redirect');
        setCheckingExisting(false);
        return;
      }

      if (!isLoaded || !isSignedIn || existingCheckedRef.current) return;

      existingCheckedRef.current = true;

      try {
        const { data } = await supabase
          .from('skin_analyses')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data && !isRedirecting) {
          // 기존 결과가 있으면 자동으로 결과 페이지로 리디렉트
          isRedirecting = true;
          router.replace(`/analysis/skin/result/${data.id}`);
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

  // 기존 이미지 저장 동의 확인
  useEffect(() => {
    async function checkExistingConsent() {
      if (!isLoaded || !isSignedIn || consentCheckedRef.current) return;

      consentCheckedRef.current = true;

      try {
        const { data } = await supabase
          .from('image_consents')
          .select('*')
          .eq('analysis_type', 'skin')
          .maybeSingle();

        if (data) {
          setExistingConsent(data as ImageConsent);
        }
      } catch (err) {
        console.error('[S-1] Error checking consent:', err);
      }
    }

    checkExistingConsent();
  }, [isLoaded, isSignedIn, supabase]);

  // 사진 재사용 가능 여부 확인
  useEffect(() => {
    async function checkPhotoReuse() {
      if (!isLoaded || !isSignedIn || reuseCheckedRef.current) return;

      reuseCheckedRef.current = true;
      setReuseChecking(true);

      try {
        const eligibility = await checkPhotoReuseEligibility(supabase, 'skin');
        setPhotoReuseEligibility(eligibility);
      } catch (err) {
        console.error('[S-1] Error checking photo reuse:', err);
        setPhotoReuseEligibility({ eligible: false, reason: 'no_image' });
      } finally {
        setReuseChecking(false);
      }
    }

    checkPhotoReuse();
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

  // 분석 진행 (동의 후 또는 기존 동의가 있는 경우)
  const proceedToAnalysis = useCallback(
    (file: File | null, multiImages: MultiAngleImages | null) => {
      if (file) {
        setImageFile(file);
      }
      if (multiImages) {
        setMultiAngleImages(multiImages);
      }
      setPendingImageFile(null);
      setPendingMultiAngleImages(null);
      setStep('loading');
      setError(null);
      analysisStartedRef.current = false;
    },
    []
  );

  // 사진 재사용 선택
  const handleSelectReuse = useCallback(async () => {
    if (!photoReuseEligibility?.sourceImage) return;

    // 재사용 이미지 URL을 fetch하여 File 객체로 변환 후 분석 진행
    try {
      const response = await fetch(photoReuseEligibility.sourceImage.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'reused-photo.jpg', { type: 'image/jpeg' });

      setCaptureMode('gallery');
      proceedToAnalysis(file, null);
    } catch (err) {
      console.error('[S-1] Error fetching reuse image:', err);
      // 에러 시 새 촬영으로 fallback
      setCaptureMode('camera');
      setStep('camera');
    }
  }, [photoReuseEligibility, proceedToAnalysis]);

  // 다각도 촬영 완료 핸들러
  const handleMultiAngleCaptureComplete = useCallback(
    (images: MultiAngleImages) => {
      // 기존 동의가 있으면 바로 분석 진행
      if (existingConsent?.consent_given) {
        proceedToAnalysis(null, images);
        return;
      }
      // 동의가 없으면 모달 표시
      setPendingMultiAngleImages(images);
      setShowConsentModal(true);
    },
    [existingConsent, proceedToAnalysis]
  );

  // 다각도 촬영 취소 핸들러
  const handleMultiAngleCaptureCancel = useCallback(() => {
    setStep('mode-select');
    setCaptureMode('select');
  }, []);

  // 동의 저장 핸들러
  const handleConsentAgree = useCallback(async () => {
    setConsentLoading(true);
    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisType: 'skin' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // 14세 미만이거나 생년월일 미입력 시 오류 메시지 표시 후 건너뛰기
        if (errorData.reason === 'under_age' || errorData.reason === 'no_birthdate') {
          console.warn('[S-1] Consent ineligible:', errorData.reason);
          // 오류가 있어도 분석은 진행 (이미지만 저장 안 함)
        } else {
          throw new Error(errorData.error || 'Failed to save consent');
        }
      } else {
        const data = await response.json();
        setExistingConsent(data.consent);
      }

      // 분석 진행
      setShowConsentModal(false);
      proceedToAnalysis(pendingImageFile, pendingMultiAngleImages);
    } catch (err) {
      console.error('[S-1] Consent save error:', err);
      // 에러 발생해도 분석은 진행
      setShowConsentModal(false);
      proceedToAnalysis(pendingImageFile, pendingMultiAngleImages);
    } finally {
      setConsentLoading(false);
    }
  }, [pendingImageFile, pendingMultiAngleImages, proceedToAnalysis]);

  // 동의 건너뛰기 핸들러
  const handleConsentSkip = useCallback(() => {
    setShowConsentModal(false);
    proceedToAnalysis(pendingImageFile, pendingMultiAngleImages);
  }, [pendingImageFile, pendingMultiAngleImages, proceedToAnalysis]);

  // 이미지를 Base64로 변환
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // AI 분석 실행 (API 호출) - 다각도 모드 지원 (카메라/갤러리 모두)
  const runAnalysis = useCallback(async () => {
    // 다각도 이미지가 있는지 확인 (카메라/갤러리 모드 공통)
    const hasMultiAngleImages = !!multiAngleImages;
    // 구버전 호환: 단일 이미지 파일 (갤러리 모드에서 PhotoUpload 사용 시)
    const hasSingleImage = imageFile && captureMode === 'gallery';

    if ((!hasMultiAngleImages && !hasSingleImage) || !isSignedIn || analysisStartedRef.current) {
      return;
    }

    analysisStartedRef.current = true;
    setIsAnalyzing(true);

    try {
      let requestBody: Record<string, string | undefined>;

      if (hasMultiAngleImages) {
        // 다각도 모드: 정면(필수) + 좌/우(선택) 이미지 전송
        requestBody = {
          frontImageBase64: multiAngleImages.frontImageBase64,
          leftImageBase64: multiAngleImages.leftImageBase64,
          rightImageBase64: multiAngleImages.rightImageBase64,
        };
      } else if (hasSingleImage) {
        // 구버전 호환: 단일 이미지를 frontImageBase64로 전송
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

      // 분석 결과가 DB에 저장되었으면 결과 페이지로 리다이렉트
      if (data.data?.id) {
        // 결과 데이터를 sessionStorage에 캐시 (결과 페이지 DB 조회 실패 시 fallback용)
        try {
          sessionStorage.setItem(
            `skin-result-${data.data.id}`,
            JSON.stringify({
              dbData: data.data,
              result: data.result,
              personalColorSeason: data.personalColorSeason,
              foundationRecommendation: data.foundationRecommendation,
              ingredientWarnings: data.ingredientWarnings,
              productRecommendations: data.productRecommendations,
              cachedAt: new Date().toISOString(),
            })
          );
        } catch {
          // sessionStorage 실패 무시 (시크릿 모드 등)
        }
        router.push(`/analysis/skin/result/${data.data.id}`);
        return;
      }

      // Fallback: DB 저장 실패 시 인라인 결과 표시
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
      case 'loading':
        return isAnalyzing ? 'AI가 분석 중이에요...' : 'AI가 분석 중이에요';
      case 'result':
        return '분석이 완료되었어요';
    }
  }, [step, error, isAnalyzing]);

  // 기존 결과 확인 중이면 로딩 표시
  if (checkingExisting) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 축하 Confetti 효과 */}
      <Confetti trigger={showConfetti} />

      {/* 이미지 저장 동의 모달 */}
      <ImageConsentModal
        isOpen={showConsentModal}
        onConsent={handleConsentAgree}
        onSkip={handleConsentSkip}
        analysisType="skin"
        isLoading={consentLoading}
      />

      <div className="min-h-[calc(100vh-80px)] bg-muted">
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

          {/* Step별 컴포넌트 렌더링 */}
          {step === 'guide' && (
            <LightingGuide onContinue={handleGuideComplete} onGallery={handleSelectGalleryMode} />
          )}

          {/* 모드 선택 UI */}
          {step === 'mode-select' && (
            <div className="space-y-6" data-testid="capture-mode-select">
              {/* 사진 재사용 옵션 (재사용 가능한 경우에만 표시) */}
              {!reuseChecking && photoReuseEligibility?.eligible && (
                <PhotoReuseSelector
                  eligibility={photoReuseEligibility}
                  onSelectReuse={handleSelectReuse}
                  onSelectNewCapture={handleSelectCameraMode}
                  className="mb-4"
                />
              )}

              {/* 재사용 불가 시 기존 모드 선택 UI 표시 */}
              {(!photoReuseEligibility?.eligible || reuseChecking) && (
                <>
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground">
                      피부 분석을 위한 사진이 필요해요
                    </p>
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

                    {/* 갤러리 모드 (다각도 업로드) */}
                    <button
                      onClick={handleSelectGalleryMode}
                      className="flex flex-col items-center justify-center p-6 bg-card rounded-xl border-2 border-transparent hover:border-primary/50 hover:shadow-md transition-all"
                      data-testid="gallery-mode-button"
                    >
                      <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                        <ImageIcon
                          className="w-7 h-7 text-secondary-foreground"
                          aria-hidden="true"
                        />
                      </div>
                      <span className="font-medium text-foreground">갤러리</span>
                      <span className="text-xs text-muted-foreground mt-1">(다각도)</span>
                    </button>
                  </div>

                  {/* 모드 설명 */}
                  <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                    <p className="mb-2">
                      <strong className="text-foreground">촬영 모드</strong>: 실시간 카메라로 정면 +
                      좌/우측 다각도 촬영
                    </p>
                    <p>
                      <strong className="text-foreground">갤러리 모드</strong>: 기존에 찍은 사진으로
                      정면 + 좌/우측 다각도 업로드
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 카메라 모드: 다각도 촬영 */}
          {step === 'camera' && (
            <MultiAngleSkinCapture
              onComplete={handleMultiAngleCaptureComplete}
              onCancel={handleMultiAngleCaptureCancel}
            />
          )}

          {/* 갤러리 모드: 다각도 이미지 업로드 */}
          {step === 'upload' && (
            <GalleryMultiAngleSkinUpload
              onComplete={handleMultiAngleCaptureComplete}
              onCancel={handleMultiAngleCaptureCancel}
            />
          )}

          {step === 'loading' && <AnalysisLoading onComplete={handleAnalysisComplete} />}

          {step === 'result' && result && (
            <AnalysisResult result={result} onRetry={handleRetry} shareRef={shareRef} />
          )}
        </div>
      </div>

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
