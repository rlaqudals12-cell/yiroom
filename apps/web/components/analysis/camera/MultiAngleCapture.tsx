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
            <div className="flex flex-col items-center p-6 pt-4">
              {/* 촬영 가이드 영역 */}
              <div className="w-full max-w-[280px] aspect-[3/4] bg-muted/30 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center mb-6">
                <div className="w-24 h-32 border-2 border-dashed border-muted-foreground/40 rounded-xl flex items-center justify-center mb-3">
                  <Camera className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground text-center px-4">
                  정면을 바라보며
                  <br />
                  얼굴이 가이드 안에 들어오도록
                </p>
              </div>

              {/* 촬영 팁 */}
              <div className="w-full bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 mb-6">
                <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1.5">
                  촬영 팁
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5">
                  <li>• 자연광이 있는 밝은 곳에서 촬영</li>
                  <li>• 맨 얼굴 상태가 가장 정확해요</li>
                  <li>• 얼굴 전체가 화면에 나오도록</li>
                </ul>
              </div>

              {/* 버튼 */}
              <Button
                size="lg"
                onClick={startCamera}
                className="w-full max-w-[280px] h-14 text-base gap-2"
              >
                <Camera className="w-5 h-5" />
                카메라 시작
              </Button>
              {onCancel && (
                <Button variant="ghost" onClick={onCancel} className="mt-3 text-muted-foreground">
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
            // 추가 각도 선택 화면 (갤러리 플로우와 동일한 레이아웃)
            <div className="flex flex-col p-6 space-y-6">
              {/* 정면 사진 (촬영 완료) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">정면 사진</span>
                  <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-medium">
                    완료
                  </span>
                </div>
                {images.frontImageBase64 && (
                  <div className="relative aspect-[3/4] w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden border-2 border-green-400 shadow-lg">
                    <img
                      src={images.frontImageBase64}
                      alt="정면 사진"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1.5 shadow">
                      <Camera className="w-3.5 h-3.5" />
                      정면
                    </div>
                  </div>
                )}
              </div>

              {/* 추가 각도 (선택) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">추가 각도</span>
                    <span className="text-xs text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
                      선택
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">더 정확한 분석을 위해 추가</p>
                </div>

                <div className="flex gap-4 justify-center">
                  {/* 좌측 */}
                  <div className="flex-1 max-w-[180px]">
                    {capturedAngles.includes('left') && images.leftImageBase64 ? (
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-green-400 shadow-md">
                        <img
                          src={images.leftImageBase64}
                          alt="좌측 사진"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1.5 shadow">
                          <Camera className="w-3 h-3" />
                          좌측
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectAngle('left')}
                        className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 flex flex-col items-center justify-center gap-3 transition-all"
                      >
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <Camera className="w-7 h-7 text-primary/50" />
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-medium text-foreground">좌측</span>
                          <p className="text-xs text-muted-foreground mt-0.5">45° 왼쪽</p>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* 우측 */}
                  <div className="flex-1 max-w-[180px]">
                    {capturedAngles.includes('right') && images.rightImageBase64 ? (
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-green-400 shadow-md">
                        <img
                          src={images.rightImageBase64}
                          alt="우측 사진"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1.5 shadow">
                          <Camera className="w-3 h-3" />
                          우측
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectAngle('right')}
                        className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 flex flex-col items-center justify-center gap-3 transition-all"
                      >
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <Camera className="w-7 h-7 text-primary/50" />
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-medium text-foreground">우측</span>
                          <p className="text-xs text-muted-foreground mt-0.5">45° 오른쪽</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="pt-4 space-y-3">
                <Button
                  onClick={handleComplete}
                  className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 shadow-lg rounded-2xl transition-all font-bold gap-2"
                >
                  {capturedAngles.length > 1
                    ? `${capturedAngles.length}장으로 분석하기`
                    : '정면 사진으로 분석하기'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 완료 상태 (외부에서 처리) */}
    </div>
  );
}

export default MultiAngleCapture;
