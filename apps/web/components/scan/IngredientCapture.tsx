'use client';

/**
 * 성분표 촬영 컴포넌트
 * - 카메라로 성분표 이미지 촬영
 * - 갤러리에서 이미지 선택
 * - OCR API 호출
 */

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, RotateCcw, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OcrResult } from '@/lib/scan/ingredient-ocr';

interface IngredientCaptureProps {
  onResult: (result: OcrResult) => void;
  onCancel?: () => void;
  className?: string;
}

type CaptureState = 'idle' | 'camera' | 'preview' | 'processing';

export function IngredientCapture({ onResult, onCancel, className }: IngredientCaptureProps) {
  const [state, setState] = useState<CaptureState>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 후면 카메라
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState('camera');
    } catch (err) {
      console.error('[IngredientCapture] Camera error:', err);
      setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
    }
  }, []);

  // 카메라 정지
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // 사진 촬영
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    setCapturedImage(imageData);
    stopCamera();
    setState('preview');
  }, [stopCamera]);

  // 파일 선택
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 타입 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setState('preview');
    };
    reader.onerror = () => {
      setError('이미지를 불러올 수 없습니다.');
    };
    reader.readAsDataURL(file);

    // input 초기화 (같은 파일 재선택 가능)
    e.target.value = '';
  }, []);

  // OCR 분석 요청
  const analyzeImage = useCallback(async () => {
    if (!capturedImage) return;

    setState('processing');
    setError(null);

    try {
      const response = await fetch('/api/scan/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'OCR 분석에 실패했습니다');
      }

      const result: OcrResult = await response.json();
      onResult(result);
    } catch (err) {
      console.error('[IngredientCapture] OCR error:', err);
      setError(err instanceof Error ? err.message : 'OCR 분석에 실패했습니다');
      setState('preview');
    }
  }, [capturedImage, onResult]);

  // 다시 촬영
  const retake = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    setState('idle');
  }, []);

  // 취소
  const handleCancel = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setState('idle');
    onCancel?.();
  }, [stopCamera, onCancel]);

  return (
    <div data-testid="ingredient-capture" className={cn('flex flex-col', className)}>
      {/* 숨겨진 canvas (캡처용) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 상태별 UI */}
      {state === 'idle' && (
        <div className="flex flex-col gap-3">
          <p className="mb-2 text-center text-sm text-muted-foreground">
            성분표/전성분을 촬영하거나 이미지를 선택해주세요
          </p>

          <Button onClick={startCamera} className="flex items-center justify-center gap-2">
            <Camera className="h-5 w-5" />
            카메라로 촬영
          </Button>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2"
          >
            <Upload className="h-5 w-5" />
            갤러리에서 선택
          </Button>

          {onCancel && (
            <Button variant="ghost" onClick={handleCancel} className="text-muted-foreground">
              취소
            </Button>
          )}
        </div>
      )}

      {state === 'camera' && (
        <div className="relative">
          {/* 카메라 프리뷰 */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-80 w-full rounded-lg bg-black object-cover"
          />

          {/* 가이드 오버레이 */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-64 rounded-lg border-2 border-dashed border-white/50">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/30" />
            </div>
          </div>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            성분표를 사각형 안에 맞춰주세요
          </p>

          {/* 컨트롤 버튼 */}
          <div className="mt-4 flex justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancel}
              className="h-12 w-12 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              onClick={capturePhoto}
              className="h-14 w-14 rounded-full bg-white text-black hover:bg-gray-100"
            >
              <div className="h-10 w-10 rounded-full border-4 border-black" />
            </Button>
            <div className="h-12 w-12" /> {/* 균형 맞추기용 빈 공간 */}
          </div>
        </div>
      )}

      {state === 'preview' && capturedImage && (
        <div className="flex flex-col gap-4">
          {/* 촬영된 이미지 */}
          <div className="relative">
            <img
              src={capturedImage}
              alt="촬영된 성분표"
              className="h-80 w-full rounded-lg object-contain bg-gray-100 dark:bg-gray-800"
            />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            이미지가 선명한가요? 성분 글씨가 잘 보이면 분석을 시작하세요.
          </p>

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={retake} className="flex-1">
              <RotateCcw className="mr-2 h-4 w-4" />
              다시 촬영
            </Button>

            <Button onClick={analyzeImage} className="flex-1">
              <Check className="mr-2 h-4 w-4" />
              분석하기
            </Button>
          </div>
        </div>
      )}

      {state === 'processing' && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <p className="font-medium">성분을 분석하고 있어요</p>
            <p className="text-sm text-muted-foreground">잠시만 기다려주세요...</p>
          </div>
        </div>
      )}
    </div>
  );
}
