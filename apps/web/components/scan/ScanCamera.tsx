'use client';

/**
 * 바코드 스캔 카메라 컴포넌트
 * - 카메라 스트림 연결
 * - 바코드 실시간 인식
 * - 스캔 가이드 오버레이
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CameraOff, FlashlightOff, Flashlight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  requestCameraAccess,
  stopCameraStream,
  scanBarcodeFromVideo,
  checkCameraPermission,
} from '@/lib/scan';
import type { BarcodeResult } from '@/lib/scan';

interface ScanCameraProps {
  /** 스캔 성공 시 콜백 */
  onScan: (result: BarcodeResult) => void;
  /** 에러 발생 시 콜백 */
  onError?: (error: string) => void;
  /** 스캔 활성화 여부 */
  active?: boolean;
  /** 스캔 모드 */
  mode?: 'barcode' | 'ingredient';
  className?: string;
}

export function ScanCamera({
  onScan,
  onError,
  active = true,
  mode = 'barcode',
  className,
}: ScanCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  // 카메라 초기화
  const initCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 권한 확인
      const permission = await checkCameraPermission();
      if (permission === 'denied') {
        setHasPermission(false);
        setError('카메라 접근이 거부되었습니다. 설정에서 권한을 허용해주세요.');
        setIsLoading(false);
        return;
      }

      // 카메라 스트림 획득
      const stream = await requestCameraAccess();
      if (!stream) {
        setHasPermission(false);
        setError('카메라에 접근할 수 없습니다.');
        setIsLoading(false);
        return;
      }

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 플래시 지원 여부 확인
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & {
        torch?: boolean;
      };
      setTorchSupported(!!capabilities?.torch);

      setIsLoading(false);
    } catch (err) {
      console.error('[ScanCamera] 초기화 실패:', err);
      setError('카메라 초기화에 실패했습니다.');
      setIsLoading(false);
      onError?.('카메라 초기화에 실패했습니다.');
    }
  }, [onError]);

  // 스캔 시작
  const startScanning = useCallback(async () => {
    if (!videoRef.current || !active || scanningRef.current) return;

    scanningRef.current = true;

    while (scanningRef.current && active) {
      const result = await scanBarcodeFromVideo(videoRef.current, {
        timeout: 5000,
      });

      if (result) {
        scanningRef.current = false;
        onScan(result);
        break;
      }

      // 잠시 대기 후 재시도
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }, [active, onScan]);

  // 플래시 토글
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !torchSupported) return;

    const track = streamRef.current.getVideoTracks()[0];
    const newTorch = !torch;

    try {
      await track.applyConstraints({
        advanced: [{ torch: newTorch } as MediaTrackConstraintSet],
      });
      setTorch(newTorch);
    } catch (err) {
      console.error('[ScanCamera] 플래시 토글 실패:', err);
    }
  }, [torch, torchSupported]);

  // 재시도
  const retry = useCallback(() => {
    if (streamRef.current) {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    }
    initCamera();
  }, [initCamera]);

  // 초기화
  useEffect(() => {
    if (active) {
      initCamera();
    }

    return () => {
      scanningRef.current = false;
      if (streamRef.current) {
        stopCameraStream(streamRef.current);
        streamRef.current = null;
      }
    };
  }, [active, initCamera]);

  // 스캔 시작
  useEffect(() => {
    if (hasPermission && !isLoading && active && mode === 'barcode') {
      startScanning();
    }
  }, [hasPermission, isLoading, active, mode, startScanning]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div
        data-testid="scan-camera-loading"
        className={cn(
          'flex flex-col items-center justify-center bg-black',
          'aspect-[3/4] rounded-2xl',
          className
        )}
      >
        <Camera className="w-12 h-12 text-white/50 animate-pulse" />
        <p className="mt-4 text-white/70 text-sm">카메라 연결 중...</p>
      </div>
    );
  }

  // 권한 없음
  if (hasPermission === false || error) {
    return (
      <div
        data-testid="scan-camera-error"
        className={cn(
          'flex flex-col items-center justify-center bg-gray-900',
          'aspect-[3/4] rounded-2xl p-6',
          className
        )}
      >
        <CameraOff className="w-12 h-12 text-red-400" />
        <p className="mt-4 text-white text-center">{error || '카메라 접근이 필요합니다'}</p>
        <button
          onClick={retry}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="scan-camera"
      className={cn('relative overflow-hidden rounded-2xl bg-black', className)}
    >
      {/* 비디오 */}
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

      {/* 스캔 가이드 오버레이 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* 반투명 마스크 */}
        <div className="absolute inset-0 bg-black/40" />

        {/* 스캔 영역 */}
        <div className="relative w-64 h-40 border-2 border-white rounded-lg">
          {/* 코너 마커 */}
          <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
          <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
          <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
          <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />

          {/* 스캔 라인 애니메이션 */}
          <div className="absolute inset-x-2 h-0.5 bg-primary/80 animate-scan-line" />
        </div>
      </div>

      {/* 안내 텍스트 */}
      <div className="absolute bottom-20 left-0 right-0 text-center">
        <p className="text-white text-sm font-medium bg-black/50 mx-auto px-4 py-2 rounded-full inline-block">
          바코드를 사각형 안에 맞춰주세요
        </p>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
        {torchSupported && (
          <button
            onClick={toggleTorch}
            className={cn(
              'p-3 rounded-full transition-colors',
              torch ? 'bg-yellow-500' : 'bg-white/20 hover:bg-white/30'
            )}
            aria-label={torch ? '플래시 끄기' : '플래시 켜기'}
          >
            {torch ? (
              <Flashlight className="w-5 h-5 text-black" />
            ) : (
              <FlashlightOff className="w-5 h-5 text-white" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
