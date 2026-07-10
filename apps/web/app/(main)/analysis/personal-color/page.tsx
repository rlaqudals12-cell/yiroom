'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { getDateLocale } from '@/lib/utils/date-format';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import { Clock, Palette } from 'lucide-react';
import type { ImageConsent } from '@/components/analysis/consent/types';
import { compressFileToBase64 } from '@/lib/utils/image-compression';
import { useFaceLandmarker } from '@/hooks/useFaceLandmarker';
import { invalidateAnalysisCache } from '@/hooks/useAnalysisStatus';
import { measureContrastLevel } from './_components/measure-contrast';
import LightingGuide from './_components/LightingGuide';
import PhotoUpload from './_components/PhotoUpload';
import WristPhotoUpload from './_components/WristPhotoUpload';
import MultiAnglePersonalColorCapture from './_components/MultiAnglePersonalColorCapture';
import GalleryMultiAngleUpload from './_components/GalleryMultiAngleUpload';
import AnalysisLoading from './_components/AnalysisLoading';
import type {
  MultiAngleImages,
  FaceAngle,
  ValidateFaceImageResponse,
} from '@/types/visual-analysis';

// 새 플로우: 조명가이드 → 다각도촬영 → 손목사진 → AI분석 → 결과 페이지 이동
// 또는: 갤러리 플로우 → 다각도 갤러리 업로드 → 손목사진 → AI분석 → 결과 페이지 이동
// 또는: 레거시 플로우 (단일 사진 업로드)
type AnalysisStep = 'guide' | 'multi-angle' | 'gallery-upload' | 'upload' | 'wrist' | 'loading';

// 날짜 포맷 헬퍼 (i18n 사용 불가 — 컴포넌트 외부 함수이므로 t를 인자로 받음)
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

// 시즌 라벨 헬퍼 (i18n)
function getSeasonLabel(season: string, t: (key: string) => string): string {
  const key = season.toLowerCase();
  const map: Record<string, string> = {
    spring: t('season.springWarm'),
    summer: t('season.summerCool'),
    autumn: t('season.autumnWarm'),
    winter: t('season.winterCool'),
  };
  return map[key] || season;
}

// 분석에 쓰일 정면 얼굴 이미지(data URL) 확보 — 다각도=정면, 레거시=단일 파일
async function resolvePrimaryFaceBase64(
  multiAngleImages: MultiAngleImages | null,
  faceImageFile: File | null
): Promise<string | null> {
  if (multiAngleImages) return multiAngleImages.frontImageBase64;
  if (faceImageFile) return compressFileToBase64(faceImageFile);
  return null;
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
  const locale = useLocale();
  const t = useTranslations('analysisEntry');
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceNew = searchParams.get('forceNew') === 'true';
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  // 퍼스널 대비 실측용 MediaPipe 랜드마커 (ADR-116) — 미가용 시 detect가 null 반환 → 대비 생략
  const { detect: detectFaceLandmarks } = useFaceLandmarker();
  const [existingAnalysis, setExistingAnalysis] = useState<ExistingAnalysis | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [step, setStep] = useState<AnalysisStep>('guide');
  const [faceImageFile, setFaceImageFile] = useState<File | null>(null);
  const [wristImageFile, setWristImageFile] = useState<File | null>(null);
  // 다각도 촬영 이미지
  const [multiAngleImages, setMultiAngleImages] = useState<MultiAngleImages | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // API 완료 상태 (로딩 프로그레스 동기화)
  const [isApiComplete, setIsApiComplete] = useState(false);
  const analysisStartedRef = useRef(false);
  // 이미지 동의 상태 (가이드 체크박스에서 설정됨)
  const [existingConsent, setExistingConsent] = useState<ImageConsent | null>(null);
  const consentCheckedRef = useRef(false);
  // 현재 세션에서의 동의 여부 (비동기 상태 업데이트 타이밍 이슈 해결용)
  const [currentSessionConsent, setCurrentSessionConsent] = useState(false);

  // 기존 분석 결과 확인 및 자동 리디렉트
  useEffect(() => {
    // 이미 리디렉트 중이면 스킵
    let isRedirecting = false;

    // eslint-disable-next-line sonarjs/cognitive-complexity -- result page render
    async function checkExistingAnalysis() {
      // forceNew 파라미터가 있으면 자동 리디렉트 건너뛰기
      if (forceNew) {
        setCheckingExisting(false);
        return;
      }

      if (!isLoaded || !isSignedIn) {
        return;
      }

      try {
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
          try {
            const response = await fetch('/api/analyze/personal-color');
            if (response.ok) {
              const apiResult = await response.json();
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

  // 기존 이미지 저장 동의 확인
  useEffect(() => {
    async function checkExistingConsent() {
      if (!isLoaded || !isSignedIn || consentCheckedRef.current) return;

      consentCheckedRef.current = true;

      try {
        const { data } = await supabase
          .from('image_consents')
          .select('*')
          .eq('analysis_type', 'personal-color')
          .maybeSingle();

        if (data) {
          setExistingConsent(data as ImageConsent);
        }
      } catch (err) {
        console.error('[PC-1] Error checking consent:', err);
      }
    }

    checkExistingConsent();
  }, [isLoaded, isSignedIn, supabase]);

  // 동의 저장 함수 (가이드에서 체크박스로 동의 시)
  const saveConsent = useCallback(async (consent: boolean) => {
    if (!consent) return;

    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisType: 'personal-color' }),
      });

      if (response.ok) {
        const data = await response.json();
        setExistingConsent(data.consent);
      }
    } catch (err) {
      console.error('[PC-1] Consent save error:', err);
      // 동의 저장 실패해도 분석은 진행 (saveImage가 false가 됨)
    }
  }, []);

  // 조명 가이드 완료 → 동의 저장 후 다각도 촬영으로
  const handleGuideComplete = useCallback(
    async (consentToSaveImage: boolean) => {
      setError(null);
      // 현재 세션 동의 상태 저장 (타이밍 이슈 해결)
      setCurrentSessionConsent(consentToSaveImage);
      // 체크박스 동의 시 DB에도 저장
      if (consentToSaveImage) {
        await saveConsent(consentToSaveImage);
      }
      setStep('multi-angle');
    },
    [saveConsent]
  );

  // 갤러리에서 선택 → 동의 저장 후 다각도 갤러리 업로드로
  const handleGallerySelect = useCallback(
    async (consentToSaveImage: boolean) => {
      setError(null);
      // 현재 세션 동의 상태 저장 (타이밍 이슈 해결)
      setCurrentSessionConsent(consentToSaveImage);
      // 체크박스 동의 시 DB에도 저장
      if (consentToSaveImage) {
        await saveConsent(consentToSaveImage);
      }
      setStep('gallery-upload');
    },
    [saveConsent]
  );

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

  // 갤러리 다각도 업로드 완료 → 손목 촬영으로 (동의는 가이드에서 처리됨)
  const handleGalleryUploadComplete = useCallback((images: MultiAngleImages) => {
    setMultiAngleImages(images);
    setStep('wrist');
    setError(null);
  }, []);

  // 갤러리 업로드 취소 → 가이드로 돌아가기
  const handleGalleryUploadCancel = useCallback(() => {
    setStep('guide');
  }, []);

  // 다각도 촬영 완료 → 손목 촬영으로 (동의는 가이드에서 처리됨)
  const handleMultiAngleComplete = useCallback((images: MultiAngleImages) => {
    setMultiAngleImages(images);
    setStep('wrist');
    setError(null);
  }, []);

  // 다각도 촬영 취소 → 가이드로 돌아가기
  const handleMultiAngleCancel = useCallback(() => {
    setStep('guide');
  }, []);

  // 얼굴 사진 선택 → 손목 사진으로 (레거시 플로우, 동의는 가이드에서 처리됨)
  const handleFacePhotoSelect = useCallback((file: File) => {
    setFaceImageFile(file);
    setStep('wrist');
    setError(null);
  }, []);

  // 손목 사진 선택 → AI 분석으로
  const handleWristPhotoSelect = useCallback((file: File) => {
    setWristImageFile(file);
    setStep('loading');
    setIsApiComplete(false);
    analysisStartedRef.current = false;
  }, []);

  // 손목 사진 건너뛰기 → 얼굴 사진만으로 분석
  const handleWristSkip = useCallback(() => {
    setStep('loading');
    setIsApiComplete(false);
    analysisStartedRef.current = false;
  }, []);

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
        wristImageBase64 = await compressFileToBase64(wristImageFile);
      }

      // API 요청 본문 구성
      let requestBody: Record<string, unknown>;

      // 동의가 있을 때만 이미지 저장 (드레이핑용)
      // currentSessionConsent: 현재 세션에서 체크박스로 동의한 경우
      // existingConsent: 이전에 이미 동의한 경우
      const saveImage = currentSessionConsent || !!existingConsent?.consent_given;

      // 분석에 쓰일 정면 얼굴 이미지(data URL) 확보
      const primaryFaceBase64 = await resolvePrimaryFaceBase64(multiAngleImages, faceImageFile);

      if (!primaryFaceBase64) {
        throw new Error('No image available');
      }

      // 퍼스널 대비 실측 (ADR-116) — 클라이언트에서 피부·모발 L* 격차를 측정한다.
      // MediaPipe 미가용/얼굴 미감지면 null → 요청에서 필드 생략(지어내지 않고, 분석은 계속).
      const contrastLevel = await measureContrastLevel(detectFaceLandmarks, primaryFaceBase64);

      if (hasMultiAngle && multiAngleImages) {
        // 다각도 분석 요청
        requestBody = {
          frontImageBase64: multiAngleImages.frontImageBase64,
          leftImageBase64: multiAngleImages.leftImageBase64,
          rightImageBase64: multiAngleImages.rightImageBase64,
          wristImageBase64,
          saveImage,
          ...(contrastLevel ? { contrastLevel } : {}),
        };
      } else {
        // 레거시 단일 이미지 요청
        requestBody = {
          imageBase64: primaryFaceBase64,
          wristImageBase64,
          saveImage,
          ...(contrastLevel ? { contrastLevel } : {}),
        };
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
      // sessionStorage 캐시 (결과 페이지 DB 조회 실패 시 복원용)
      try {
        sessionStorage.setItem(
          `pc-result-${data.data.id}`,
          JSON.stringify({ dbData: data.data, cachedAt: new Date().toISOString() })
        );
      } catch {
        /* sessionStorage 실패 무시 */
      }

      // 분석 완료 → 홈/[나] 탭 5분 캐시 즉시 무효화 (stale "분석 0개" 방지)
      invalidateAnalysisCache();
      // 결과 페이지로 리다이렉트 (DB에서 analysisEvidence 포함한 전체 데이터 조회)
      router.push(`/analysis/personal-color/result/${data.data.id}`);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(t('error.analysisFailed'));
      // 갤러리 플로우인지 카메라 플로우인지에 따라 돌아갈 step 결정
      setStep('guide'); // 가이드로 돌아가서 사용자가 다시 선택하도록
    } finally {
      setIsApiComplete(true);
      setIsAnalyzing(false);
    }
  }, [
    faceImageFile,
    wristImageFile,
    multiAngleImages,
    isSignedIn,
    router,
    existingConsent,
    currentSessionConsent,
    detectFaceLandmarks,
    t,
  ]);

  // 로딩 단계 진입 시 즉시 API 호출 시작
  useEffect(() => {
    if (step === 'loading') {
      runAnalysis();
    }
  }, [step, runAnalysis]);

  // 단계별 서브타이틀
  const subtitle = useMemo(() => {
    // guide 단계에서는 에러를 별도 UI로 표시하므로 subtitle은 기본값 유지
    if (error && step !== 'guide') return t('error.analysisError');
    switch (step) {
      case 'guide':
        return t('pc.subtitle.guide');
      case 'multi-angle':
        return t('pc.subtitle.multiAngle');
      case 'gallery-upload':
        return t('pc.subtitle.galleryUpload');
      case 'upload':
        return t('pc.subtitle.upload');
      case 'wrist':
        return t('pc.subtitle.wrist');
      case 'loading':
        return isAnalyzing ? t('subtitle.aiAnalyzing') : t('subtitle.aiAnalyzingDone');
    }
  }, [step, error, isAnalyzing]);

  // 기존 결과 확인 중이면 로딩 표시
  if (checkingExisting) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{t('loading.checkingExisting')}</p>
          <button
            onClick={() => window.history.back()}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            {t('action.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="personal-color-analysis-page">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t('pc.title')}</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </header>

        {/* 에러 메시지 */}
        {error && (step === 'upload' || step === 'guide') && (
          <div
            className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
            role="alert"
            aria-live="polite"
          >
            <p className="font-medium">{t('error.analysisError')}</p>
            <p className="mt-1 text-red-500">{error}</p>
            <p className="mt-2 text-xs text-red-400">{t('error.retryWithBetterLighting')}</p>
          </div>
        )}

        {/* 기존 분석 결과 배너 (낮은 신뢰도인 경우에만 표시 - 높은 신뢰도는 자동 리디렉트) */}
        {step === 'guide' && existingAnalysis && !checkingExisting && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Palette className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t('pc.existingResult')}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-amber-600">
                    {getSeasonLabel(existingAnalysis.season, t)}
                  </span>
                  <span>•</span>
                  <span className="text-amber-500">{t('pc.lowConfidence')}</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  {formatDate(new Date(existingAnalysis.created_at), locale, t)}
                </div>
              </div>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              {t('pc.lowConfidenceDesc')}
            </p>
            <div className="flex gap-2">
              <Link
                href={`/analysis/personal-color/result/${existingAnalysis.id}`}
                className="flex-1 px-3 py-2 text-sm text-center bg-white dark:bg-card border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
              >
                {t('action.viewExistingResult')}
              </Link>
              <button
                onClick={() => setStep('multi-angle')}
                className="flex-1 px-3 py-2 text-sm text-center bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                {t('action.reAnalyze')}
              </button>
            </div>
          </div>
        )}

        {/* Step별 컴포넌트 렌더링 */}
        {step === 'guide' && (
          <LightingGuide onContinue={handleGuideComplete} onGallery={handleGallerySelect} />
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

        {step === 'loading' && <AnalysisLoading isApiComplete={isApiComplete} />}
      </div>
    </div>
  );
}
