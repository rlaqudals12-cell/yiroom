'use client';

/**
 * 다각도 체형 촬영 통합 컴포넌트
 * @description 정면(필수) + 측면(선택) + 후면(선택) 다각도 촬영 플로우
 */

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Loader2, ImagePlus } from 'lucide-react';
import { BodyGuideOverlay, type BodyAngle } from './BodyGuideOverlay';
import { BodyAngleSelector } from './BodyAngleSelector';

/** 촬영 단계 */
type CaptureStep = 'front' | 'additional' | 'complete';

/** 다각도 체형 이미지 세트 */
export interface MultiAngleBodyImages {
  /** 정면 이미지 (필수) */
  frontImageBase64: string;
  /** 측면 이미지 (선택) */
  sideImageBase64?: string;
  /** 후면 이미지 (선택) */
  backImageBase64?: string;
}

interface MultiAngleBodyCaptureProps {
  /** 촬영 완료 핸들러 */
  onComplete: (images: MultiAngleBodyImages) => void;
  /** 취소 핸들러 */
  onCancel?: () => void;
  /** 추가 클래스 */
  className?: string;
}

export function MultiAngleBodyCapture({
  onComplete,
  onCancel,
  className,
}: MultiAngleBodyCaptureProps) {
  // 촬영 상태
  const [step, setStep] = useState<CaptureStep>('front');
  const [currentAngle, setCurrentAngle] = useState<BodyAngle>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 촬영된 이미지
  const [images, setImages] = useState<Partial<MultiAngleBodyImages>>({});
  const [capturedAngles, setCapturedAngles] = useState<BodyAngle[]>([]);

  // 비디오/캔버스 ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 카메라 시작 (후면 카메라 사용 - 전신 촬영에 적합)
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 후면 카메라 사용
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('[MultiAngleBodyCapture] Camera error:', error);
      setValidationError('카메라에 접근할 수 없어요. 권한을 확인해주세요.');
    }
  }, []);

  // 카메라 정지
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // 촬영
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setValidationError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // 캔버스 크기 설정
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 이미지 캡처 (후면 카메라는 반전 없음)
      ctx.drawImage(video, 0, 0);

      // Base64 변환
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.9);

      // 이미지 저장
      const imageKey =
        currentAngle === 'front'
          ? 'frontImageBase64'
          : currentAngle === 'side'
            ? 'sideImageBase64'
            : 'backImageBase64';

      setImages((prev) => ({ ...prev, [imageKey]: imageBase64 }));
      setCapturedAngles((prev) => [...prev, currentAngle]);

      // 다음 단계로
      if (currentAngle === 'front') {
        setStep('additional');
        stopCamera();
      } else {
        // 추가 촬영 완료 후 다시 선택 화면으로
        stopCamera();
      }

      setIsCapturing(false);
    } catch (error) {
      console.error('[MultiAngleBodyCapture] Capture error:', error);
      setValidationError('촬영 중 오류가 발생했어요');
      setIsCapturing(false);
    }
  }, [currentAngle, stopCamera]);

  // 파일 선택 처리
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageBase64 = e.target?.result as string;

        const imageKey =
          currentAngle === 'front'
            ? 'frontImageBase64'
            : currentAngle === 'side'
              ? 'sideImageBase64'
              : 'backImageBase64';

        setImages((prev) => ({ ...prev, [imageKey]: imageBase64 }));
        setCapturedAngles((prev) => [...prev, currentAngle]);

        if (currentAngle === 'front') {
          setStep('additional');
        }
      };
      reader.readAsDataURL(file);
    },
    [currentAngle]
  );

  // 추가 각도 선택
  const handleSelectAngle = useCallback(
    (angle: BodyAngle) => {
      setCurrentAngle(angle);
      setValidationError(null);
      startCamera();
    },
    [startCamera]
  );

  // 건너뛰기 / 완료
  const handleComplete = useCallback(() => {
    stopCamera();

    if (!images.frontImageBase64) {
      setValidationError('정면 사진이 필요해요');
      return;
    }

    setStep('complete');
    onComplete({
      frontImageBase64: images.frontImageBase64,
      sideImageBase64: images.sideImageBase64,
      backImageBase64: images.backImageBase64,
    });
  }, [images, onComplete, stopCamera]);

  // 재촬영
  const handleRetake = useCallback(() => {
    setValidationError(null);
    startCamera();
  }, [startCamera]);

  // 갤러리에서 선택
  const handleGallerySelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      className={cn('relative flex flex-col h-full', className)}
      data-testid="multi-angle-body-capture"
    >
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* 정면 촬영 단계 */}
      {step === 'front' && (
        <>
          {/* 카메라 뷰 또는 시작 화면 */}
          {streamRef.current ? (
            <div className="relative flex-1 bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* 전신 가이드 오버레이 */}
              <BodyGuideOverlay angle="front" />

              {/* 촬영 버튼 */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                <Button
                  size="lg"
                  onClick={captureImage}
                  disabled={isCapturing}
                  className="rounded-full w-16 h-16"
                >
                  {isCapturing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6" />
                  )}
                </Button>
              </div>

              {/* 에러 메시지 */}
              {validationError && (
                <div className="absolute bottom-28 left-4 right-4">
                  <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-center">
                    {validationError}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRetake}
                      className="ml-2 text-white hover:text-white"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      다시
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="text-center mb-8">
                <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">정면 사진 촬영</h2>
                <p className="text-muted-foreground">전신이 잘 보이도록 정면을 촬영해주세요</p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button size="lg" onClick={startCamera}>
                  <Camera className="w-5 h-5 mr-2" />
                  카메라로 촬영
                </Button>
                <Button variant="outline" size="lg" onClick={handleGallerySelect}>
                  <ImagePlus className="w-5 h-5 mr-2" />
                  갤러리에서 선택
                </Button>
              </div>
              {onCancel && (
                <Button variant="ghost" onClick={onCancel} className="mt-4">
                  취소
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* 추가 촬영 단계 */}
      {step === 'additional' && (
        <>
          {streamRef.current ? (
            // 추가 각도 촬영 중
            <div className="relative flex-1 bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              <BodyGuideOverlay angle={currentAngle} />

              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    stopCamera();
                    setCurrentAngle('front');
                  }}
                >
                  취소
                </Button>
                <Button
                  size="lg"
                  onClick={captureImage}
                  disabled={isCapturing}
                  className="rounded-full w-16 h-16"
                >
                  {isCapturing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6" />
                  )}
                </Button>
              </div>

              {validationError && (
                <div className="absolute bottom-28 left-4 right-4">
                  <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-center">
                    {validationError}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // 추가 각도 선택 화면
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              {/* 정면 사진 미리보기 */}
              {images.frontImageBase64 && (
                <div className="mb-6">
                  <img
                    src={images.frontImageBase64}
                    alt="정면 사진"
                    className="w-24 h-40 object-cover rounded-lg border"
                  />
                  <p className="text-sm text-center text-muted-foreground mt-2">정면 촬영 완료</p>
                </div>
              )}

              <BodyAngleSelector
                capturedAngles={capturedAngles}
                onSelectAngle={handleSelectAngle}
                onSkip={handleComplete}
              />
            </div>
          )}
        </>
      )}

      {/* 완료 상태 (외부에서 처리) */}
    </div>
  );
}

export default MultiAngleBodyCapture;
