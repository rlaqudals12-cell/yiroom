'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import { Clock, Palette } from 'lucide-react';
import {
  type PersonalColorResult,
  type SeasonType,
  type PersonalColorSubtype,
  generateMockPersonalColorResult,
  PERSONAL_COLOR_SUBTYPES,
  SEASON_INFO,
} from '@/lib/mock/personal-color';
import LightingGuide from './_components/LightingGuide';
import PhotoUpload from './_components/PhotoUpload';
import WristPhotoUpload from './_components/WristPhotoUpload';
import KnownPersonalColorInput from './_components/KnownPersonalColorInput';
import MultiAnglePersonalColorCapture from './_components/MultiAnglePersonalColorCapture';
import GalleryMultiAngleUpload from './_components/GalleryMultiAngleUpload';
import AnalysisLoading from './_components/AnalysisLoading';
import AnalysisResult from './_components/AnalysisResult';
import type {
  MultiAngleImages,
  FaceAngle,
  ValidateFaceImageResponse,
} from '@/types/visual-analysis';

// 새 플로우: 조명가이드 → 다각도촬영 → 손목사진 → AI분석 → 결과
// 또는: 갤러리 플로우 → 다각도 갤러리 업로드 → 손목사진 → AI분석 → 결과
// 또는: 기존 퍼스널 컬러 입력 → 결과
// 또는: 레거시 플로우 (단일 사진 업로드)
type AnalysisStep =
  | 'guide'
  | 'multi-angle'
  | 'gallery-upload'
  | 'upload'
  | 'wrist'
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

// 시즌 라벨 헬퍼
function getSeasonLabel(season: string): string {
  const labels: Record<string, string> = {
    Spring: '봄 웜톤',
    Summer: '여름 쿨톤',
    Autumn: '가을 웜톤',
    Winter: '겨울 쿨톤',
    spring: '봄 웜톤',
    summer: '여름 쿨톤',
    autumn: '가을 웜톤',
    winter: '겨울 쿨톤',
  };
  return labels[season] || season;
}

// 기존 분석 결과 타입
interface ExistingAnalysis {
  id: string;
  season: string;
  confidence: number | null;
  created_at: string;
}

// 신뢰도 기준값 (이 이상이면 자동 리디렉트)
const HIGH_CONFIDENCE_THRESHOLD = 70;

export default function PersonalColorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceNew = searchParams.get('forceNew') === 'true';
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [existingAnalysis, setExistingAnalysis] = useState<ExistingAnalysis | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [faceImageFile, setFaceImageFile] = useState<File | null>(null);
  const [wristImageFile, setWristImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  // 다각도 촬영 이미지
  const [multiAngleImages, setMultiAngleImages] = useState<MultiAngleImages | null>(null);
  const [result, setResult] = useState<PersonalColorResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analysisStartedRef = useRef(false);

  // 기존 분석 결과 확인 및 자동 리디렉트
  useEffect(() => {
    // 이미 리디렉트 중이면 스킵
    let isRedirecting = false;

    async function checkExistingAnalysis() {
      // forceNew 파라미터가 있으면 자동 리디렉트 건너뛰기
      if (forceNew) {
        console.log('[PC-1] forceNew=true, skipping auto-redirect');
        setCheckingExisting(false);
        return;
      }

      if (!isLoaded || !isSignedIn) {
        console.log('[PC-1] Skipping check - isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);
        return;
      }

      try {
        console.log('[PC-1] Checking existing analysis...');
        console.log('[PC-1] Auth state - isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);

        // 1차 시도: 클라이언트 측 Supabase 쿼리 (RLS)
        let data = null;
        let queryFailed = false;

        try {
          const result = await supabase
            .from('personal_color_assessments')
            .select('id, season, confidence, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          console.log('[PC-1] Client query result - data:', result.data, 'count:', result.count);

          if (result.error) {
            console.error('[PC-1] Client query error:', result.error.message);
            queryFailed = true;
          } else {
            data = result.data;
          }
        } catch (clientError) {
          console.error('[PC-1] Client query exception:', clientError);
          queryFailed = true;
        }

        // 2차 시도: 클라이언트 쿼리 실패 시 API 통해 조회 (Service Role 사용)
        if (queryFailed || (!data && isSignedIn)) {
          console.log('[PC-1] Trying API fallback...');
          try {
            const response = await fetch('/api/analyze/personal-color');
            if (response.ok) {
              const apiResult = await response.json();
              console.log('[PC-1] API fallback result:', apiResult);
              if (apiResult.data) {
                data = {
                  id: apiResult.data.id,
                  season: apiResult.data.season,
                  confidence: apiResult.data.confidence,
                  created_at: apiResult.data.created_at,
                };
              }
            }
          } catch (apiError) {
            console.error('[PC-1] API fallback error:', apiError);
          }
        }

        console.log('[PC-1] Final existing analysis data:', data);

        if (data && !isRedirecting) {
          // 신뢰도가 높으면 자동으로 결과 페이지로 리디렉트
          const confidence = data.confidence ?? 85;
          if (confidence >= HIGH_CONFIDENCE_THRESHOLD) {
            isRedirecting = true;
            router.replace(`/analysis/personal-color/result/${data.id}`);
            return;
          }
          // 낮은 신뢰도면 배너 표시용으로 저장
          setExistingAnalysis(data);
        }
      } catch (err) {
        // 기존 결과 없음 또는 에러
        console.error('[PC-1] Exception in checkExistingAnalysis:', err);
      } finally {
        if (!isRedirecting) {
          setCheckingExisting(false);
        }
      }
    }

    checkExistingAnalysis();
  }, [isLoaded, isSignedIn, supabase, router, forceNew]);

  // 조명 가이드 완료 → 다각도 촬영으로
  const handleGuideComplete = useCallback(() => {
    setError(null); // 에러 초기화
    setStep('multi-angle');
  }, []);

  // 갤러리에서 선택 → 다각도 갤러리 업로드로
  const handleGallerySelect = useCallback(() => {
    setError(null); // 에러 초기화
    setStep('gallery-upload');
  }, []);

  // 갤러리 이미지 검증 API 호출
  const handleGalleryValidate = useCallback(
    async (imageBase64: string, expectedAngle: FaceAngle): Promise<ValidateFaceImageResponse> => {
      try {
        const response = await fetch('/api/validate/face-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, expectedAngle }),
        });

        if (!response.ok) {
          throw new Error('Validation failed');
        }

        return await response.json();
      } catch (error) {
        console.error('[PC-1] Gallery validation error:', error);
        // 검증 실패 시에도 촬영 허용 (AI 분석에서 처리)
        return {
          suitable: true,
          detectedAngle: expectedAngle,
          quality: {
            lighting: 'good',
            makeupDetected: false,
            faceDetected: true,
            blur: false,
          },
        };
      }
    },
    []
  );

  // 갤러리 다각도 업로드 완료 → 손목 촬영으로
  const handleGalleryUploadComplete = useCallback((images: MultiAngleImages) => {
    setMultiAngleImages(images);
    setStep('wrist');
    setError(null);
  }, []);

  // 갤러리 업로드 취소 → 가이드로 돌아가기
  const handleGalleryUploadCancel = useCallback(() => {
    setStep('guide');
  }, []);

  // 다각도 촬영 완료 → 손목 촬영으로
  const handleMultiAngleComplete = useCallback((images: MultiAngleImages) => {
    setMultiAngleImages(images);
    setStep('wrist');
    setError(null);
  }, []);

  // 다각도 촬영 취소 → 가이드로 돌아가기
  const handleMultiAngleCancel = useCallback(() => {
    setStep('guide');
  }, []);

  // 기존 퍼스널 컬러 알고 있음 → 입력 화면으로
  const handleSkipToKnownInput = useCallback(() => {
    setStep('known-input');
  }, []);

  // 기존 퍼스널 컬러 입력 → 결과 생성
  const handleKnownColorSelect = useCallback(
    (seasonType: SeasonType, subtype?: PersonalColorSubtype) => {
      // Mock 결과 생성 (해당 시즌 타입으로)
      const mockResult = generateMockPersonalColorResult();

      // 서브타입 정보 찾기
      const subtypeInfo = subtype ? PERSONAL_COLOR_SUBTYPES.find((s) => s.id === subtype) : null;

      // 시즌 라벨 결정 (서브타입이 있으면 서브타입 라벨 사용)
      const seasonLabel = subtypeInfo ? subtypeInfo.label : SEASON_INFO[seasonType].label;

      // 톤과 깊이 결정
      const tone = subtypeInfo
        ? subtypeInfo.tone
        : seasonType === 'spring' || seasonType === 'autumn'
          ? 'warm'
          : 'cool';
      const depth = subtypeInfo
        ? subtypeInfo.depth
        : seasonType === 'spring' || seasonType === 'summer'
          ? 'light'
          : 'deep';

      setResult({
        ...mockResult,
        seasonType,
        seasonLabel,
        tone,
        depth,
        confidence: 100, // 사용자가 직접 입력했으므로 100%
        analyzedAt: new Date(),
      });
      setStep('result');
    },
    []
  );

  // 기존 퍼스널 컬러 입력에서 돌아가기
  const handleKnownInputBack = useCallback(() => {
    setStep('guide');
  }, []);

  // 얼굴 사진 선택 → 손목 사진으로
  const handleFacePhotoSelect = useCallback((file: File) => {
    setFaceImageFile(file);
    // 미리보기 URL 생성
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setStep('wrist');
    setError(null);
  }, []);

  // 손목 사진 선택 → AI 분석으로
  const handleWristPhotoSelect = useCallback((file: File) => {
    setWristImageFile(file);
    setStep('loading');
    analysisStartedRef.current = false;
  }, []);

  // 손목 사진 건너뛰기 → 얼굴 사진만으로 분석
  const handleWristSkip = useCallback(() => {
    setStep('loading');
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
    // 다각도 이미지 또는 레거시 단일 이미지 필요
    const hasMultiAngle = !!multiAngleImages;
    const hasLegacyImage = !!faceImageFile;

    if ((!hasMultiAngle && !hasLegacyImage) || !isSignedIn || analysisStartedRef.current) {
      return;
    }

    analysisStartedRef.current = true;
    setIsAnalyzing(true);

    try {
      // 손목 이미지가 있으면 Base64로 변환
      let wristImageBase64: string | undefined;
      if (wristImageFile) {
        wristImageBase64 = await fileToBase64(wristImageFile);
      }

      // API 요청 본문 구성
      let requestBody: Record<string, unknown>;

      if (hasMultiAngle && multiAngleImages) {
        // 다각도 분석 요청
        requestBody = {
          frontImageBase64: multiAngleImages.frontImageBase64,
          leftImageBase64: multiAngleImages.leftImageBase64,
          rightImageBase64: multiAngleImages.rightImageBase64,
          wristImageBase64,
        };
        console.log('[PC-1] Using multi-angle images:', {
          front: !!multiAngleImages.frontImageBase64,
          left: !!multiAngleImages.leftImageBase64,
          right: !!multiAngleImages.rightImageBase64,
        });
      } else if (faceImageFile) {
        // 레거시 단일 이미지 요청
        const faceImageBase64 = await fileToBase64(faceImageFile);
        requestBody = {
          imageBase64: faceImageBase64,
          wristImageBase64,
        };
      } else {
        throw new Error('No image available');
      }

      const response = await fetch('/api/analyze/personal-color', {
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
        '[PC-1] Analysis result:',
        data.usedMock ? 'Mock' : 'Real AI',
        '/ Reliability:',
        data.analysisReliability,
        '/ Images:',
        data.imagesCount
      );

      // 결과 페이지로 리다이렉트 (DB에서 analysisEvidence 포함한 전체 데이터 조회)
      router.push(`/analysis/personal-color/result/${data.data.id}`);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      // 갤러리 플로우인지 카메라 플로우인지에 따라 돌아갈 step 결정
      setStep('guide'); // 가이드로 돌아가서 사용자가 다시 선택하도록
    } finally {
      setIsAnalyzing(false);
    }
  }, [faceImageFile, wristImageFile, multiAngleImages, isSignedIn, router]);

  // 로딩 애니메이션 완료 시 분석 시작
  const handleAnalysisComplete = useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  // 다시 분석하기
  const handleRetry = useCallback(() => {
    // 이전 이미지 URL 정리
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setFaceImageFile(null);
    setWristImageFile(null);
    setMultiAngleImages(null);
    setImageUrl(null);
    setResult(null);
    setStep('guide');
    setError(null);
    analysisStartedRef.current = false;
  }, [imageUrl]);

  // 단계별 서브타이틀
  const subtitle = useMemo(() => {
    // guide 단계에서는 에러를 별도 UI로 표시하므로 subtitle은 기본값 유지
    if (error && step !== 'guide') return '분석 중 오류가 발생했어요';
    switch (step) {
      case 'guide':
        return '정확한 진단을 위한 촬영 가이드';
      case 'multi-angle':
        return '정확한 진단을 위해 여러 각도로 촬영해요';
      case 'gallery-upload':
        return '갤러리에서 사진을 선택해주세요';
      case 'upload':
        return '얼굴 사진을 촬영해주세요';
      case 'wrist':
        return '손목 사진을 촬영해주세요';
      case 'known-input':
        return '기존 퍼스널 컬러를 선택해주세요';
      case 'loading':
        return isAnalyzing ? 'AI가 분석 중이에요...' : 'AI가 분석 중이에요';
      case 'result':
        return '분석이 완료되었어요';
    }
  }, [step, error, isAnalyzing]);

  // 기존 결과 확인 중이면 로딩 표시
  if (checkingExisting) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">확인 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-muted">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">퍼스널 컬러 진단</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </header>

        {/* 에러 메시지 */}
        {error && (step === 'upload' || step === 'guide') && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            <p className="font-medium">분석 중 오류가 발생했어요</p>
            <p className="mt-1 text-red-500">{error}</p>
            <p className="mt-2 text-xs text-red-400">
              다시 시도해주세요. 조명이 밝은 곳에서 촬영하면 더 좋아요.
            </p>
          </div>
        )}

        {/* 기존 분석 결과 배너 (낮은 신뢰도인 경우에만 표시 - 높은 신뢰도는 자동 리디렉트) */}
        {step === 'guide' && existingAnalysis && !checkingExisting && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">이전 진단 결과가 있어요</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-amber-600">
                    {getSeasonLabel(existingAnalysis.season)}
                  </span>
                  <span>•</span>
                  <span className="text-amber-500">신뢰도 낮음</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  {formatDate(new Date(existingAnalysis.created_at))}
                </div>
              </div>
            </div>
            <p className="text-sm text-amber-700 mb-3">
              이전 분석의 신뢰도가 낮아요. 더 정확한 결과를 위해 재분석을 권장해요.
            </p>
            <div className="flex gap-2">
              <Link
                href={`/analysis/personal-color/result/${existingAnalysis.id}`}
                className="flex-1 px-3 py-2 text-sm text-center bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
              >
                기존 결과 보기
              </Link>
              <button
                onClick={() => setStep('multi-angle')}
                className="flex-1 px-3 py-2 text-sm text-center bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                다시 분석하기
              </button>
            </div>
          </div>
        )}

        {/* Step별 컴포넌트 렌더링 */}
        {step === 'guide' && (
          <LightingGuide
            onContinue={handleGuideComplete}
            onSkip={handleSkipToKnownInput}
            onGallery={handleGallerySelect}
          />
        )}

        {step === 'multi-angle' && (
          <MultiAnglePersonalColorCapture
            onComplete={handleMultiAngleComplete}
            onCancel={handleMultiAngleCancel}
          />
        )}

        {step === 'gallery-upload' && (
          <GalleryMultiAngleUpload
            onComplete={handleGalleryUploadComplete}
            onValidate={handleGalleryValidate}
            onCancel={handleGalleryUploadCancel}
          />
        )}

        {step === 'upload' && <PhotoUpload onPhotoSelect={handleFacePhotoSelect} />}

        {step === 'wrist' && (
          <WristPhotoUpload onPhotoSelect={handleWristPhotoSelect} onSkip={handleWristSkip} />
        )}

        {step === 'known-input' && (
          <KnownPersonalColorInput
            onSelect={handleKnownColorSelect}
            onBack={handleKnownInputBack}
          />
        )}

        {step === 'loading' && <AnalysisLoading onComplete={handleAnalysisComplete} />}

        {step === 'result' && result && <AnalysisResult result={result} onRetry={handleRetry} />}
      </div>
    </main>
  );
}
