'use client';

/**
 * 다각도 촬영 통합 컴포넌트
 * @description 정면(필수) + 좌/우(선택) 다각도 촬영 플로우
 */

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Loader2 } from 'lucide-react';
import { FaceGuideOverlay } from './FaceGuideOverlay';
import { AngleSelector } from './AngleSelector';
import type {
  FaceAngle,
  MultiAngleImages,
  ValidateFaceImageResponse,
} from '@/types/visual-analysis';

/** 촬영 단계 */
type CaptureStep = 'front' | 'additional' | 'complete';

interface MultiAngleCaptureProps {
  /** 촬영 완료 핸들러 */
  onComplete: (images: MultiAngleImages) => void;
  /** 이미지 검증 함수 (선택) */
  onValidate?: (imageBase64: string, angle: FaceAngle) => Promise<ValidateFaceImageResponse>;
  /** 취소 핸들러 */
  onCancel?: () => void;
  /** 추가 클래스 */
  className?: string;
}

export function MultiAngleCapture({
  onComplete,
  onValidate,
  onCancel,
  className,
}: MultiAngleCaptureProps) {
  // 촬영 상태
  const [step, setStep] = useState<CaptureStep>('front');
  const [currentAngle, setCurrentAngle] = useState<FaceAngle>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 촬영된 이미지
  const [images, setImages] = useState<Partial<MultiAngleImages>>({});
  const [capturedAngles, setCapturedAngles] = useState<FaceAngle[]>([]);

  // 비디오/캔버스 ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('[MultiAngleCapture] Camera error:', error);
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

      // 이미지 캡처 (좌우 반전 - 셀카 모드)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);

      // Base64 변환
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.9);

      // 검증 (옵션)
      if (onValidate) {
        setIsValidating(true);
        const result = await onValidate(imageBase64, currentAngle);
        setIsValidating(false);

        if (!result.suitable) {
          setValidationError(result.reason || '사진이 적합하지 않아요');
          setIsCapturing(false);
          return;
        }

        // 메이크업 경고
        if (result.quality.makeupDetected) {
          console.log('[MultiAngleCapture] Makeup detected (warning only)');
        }
      }

      // 이미지 저장
      const imageKey =
        currentAngle === 'front'
          ? 'frontImageBase64'
          : currentAngle === 'left'
            ? 'leftImageBase64'
            : 'rightImageBase64';

      setImages((prev) => ({ ...prev, [imageKey]: imageBase64 }));
      setCapturedAngles((prev) => [...prev, currentAngle]);

      // 다음 단계로
      if (currentAngle === 'front') {
        setStep('additional');
        stopCamera();
      }

      setIsCapturing(false);
    } catch (error) {
      console.error('[MultiAngleCapture] Capture error:', error);
      setValidationError('촬영 중 오류가 발생했어요');
      setIsCapturing(false);
      setIsValidating(false);
    }
  }, [currentAngle, onValidate, stopCamera]);

  // 추가 각도 선택
  const handleSelectAngle = useCallback(
    (angle: FaceAngle) => {
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
      leftImageBase64: images.leftImageBase64,
      rightImageBase64: images.rightImageBase64,
    });
  }, [images, onComplete, stopCamera]);

  // 재촬영
  const handleRetake = useCallback(() => {
    setValidationError(null);
    startCamera();
  }, [startCamera]);

  // 마운트 시 카메라 시작 (정면 촬영)
  // useEffect에서 처리하지 않고 버튼으로 시작하도록 함

  return (
    <div
      className={cn('relative flex flex-col h-full', className)}
      data-testid="multi-angle-capture"
    >
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
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* 얼굴 가이드 오버레이 */}
              <FaceGuideOverlay angle="front" />

              {/* 촬영 버튼 */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <Button
                  size="lg"
                  onClick={captureImage}
                  disabled={isCapturing || isValidating}
                  className="rounded-full w-16 h-16"
                >
                  {isValidating ? (
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
                <p className="text-muted-foreground">얼굴이 잘 보이도록 정면을 바라봐주세요</p>
              </div>
              <Button size="lg" onClick={startCamera}>
                <Camera className="w-5 h-5 mr-2" />
                카메라 시작
              </Button>
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
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="hidden" />

              <FaceGuideOverlay angle={currentAngle} />

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
                  disabled={isCapturing || isValidating}
                  className="rounded-full w-16 h-16"
                >
                  {isValidating ? (
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
                    className="w-32 h-40 object-cover rounded-lg border"
                  />
                  <p className="text-sm text-center text-muted-foreground mt-2">정면 촬영 완료</p>
                </div>
              )}

              <AngleSelector
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

export default MultiAngleCapture;
