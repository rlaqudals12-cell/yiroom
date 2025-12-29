/**
 * 바코드 스캐너 컴포넌트
 *
 * html5-qrcode 라이브러리를 사용한 바코드 스캔
 * - EAN-13, EAN-8, UPC-A 지원
 * - 카메라 권한 관리
 * - 스캔 성공/실패 피드백
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Flashlight, FlashlightOff, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BarcodeScannerProps {
  /** 바코드 스캔 성공 시 호출 */
  onScan: (barcode: string) => void;
  /** 에러 발생 시 호출 */
  onError?: (error: string) => void;
  /** 닫기 버튼 클릭 시 호출 */
  onClose?: () => void;
  /** 추가 CSS 클래스 */
  className?: string;
}

// 스캐너 상태
type ScannerState = 'initializing' | 'ready' | 'scanning' | 'success' | 'error';

export default function BarcodeScanner({
  onScan,
  onError,
  onClose,
  className,
}: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrcodeRef = useRef<unknown>(null);
  const [state, setState] = useState<ScannerState>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);

  // 진동 피드백
  const vibrate = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }, []);

  // 스캔 성공 처리
  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      setState('success');
      vibrate();

      // 성공음 재생 (옵션)
      try {
        const audio = new Audio('/sounds/beep.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {
        // 소리 재생 실패 무시
      }

      onScan(decodedText);
    },
    [onScan, vibrate]
  );

  // 스캐너 초기화
  useEffect(() => {
    let mounted = true;

    const initScanner = async () => {
      if (!scannerRef.current) return;

      try {
        // html5-qrcode 동적 import (클라이언트 전용)
        const { Html5Qrcode } = await import('html5-qrcode');

        if (!mounted) return;

        const scanner = new Html5Qrcode('barcode-scanner-region');
        html5QrcodeRef.current = scanner;

        // 카메라 시작
        await scanner.start(
          { facingMode: 'environment' }, // 후면 카메라
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.777778, // 16:9
          },
          (decodedText) => {
            // 스캔 성공
            handleScanSuccess(decodedText);

            // 스캐너 정지
            scanner.stop().catch(() => {});
          },
          () => {
            // 스캔 실패 (무시 - 계속 스캔)
          }
        );

        // 플래시 지원 확인
        try {
          const capabilities = scanner.getRunningTrackCameraCapabilities();
          if (capabilities.torchFeature().isSupported()) {
            setHasFlash(true);
          }
        } catch {
          // 플래시 미지원
        }

        if (mounted) {
          setState('ready');
        }
      } catch (err) {
        if (!mounted) return;

        const message =
          err instanceof Error
            ? err.message
            : '카메라를 시작할 수 없습니다';

        // 권한 거부 메시지 개선
        if (message.includes('Permission') || message.includes('NotAllowed')) {
          setErrorMessage('카메라 권한이 필요합니다. 설정에서 권한을 허용해주세요.');
        } else if (message.includes('NotFound') || message.includes('DevicesNotFound')) {
          setErrorMessage('카메라를 찾을 수 없습니다.');
        } else {
          setErrorMessage(message);
        }

        setState('error');
        onError?.(message);
      }
    };

    initScanner();

    return () => {
      mounted = false;

      // 스캐너 정리
      const scanner = html5QrcodeRef.current as { stop?: () => Promise<void> } | null;
      if (scanner?.stop) {
        scanner.stop().catch(() => {});
      }
    };
  }, [handleScanSuccess, onError]);

  // 플래시 토글
  const toggleFlash = async () => {
    try {
      const scanner = html5QrcodeRef.current as {
        applyVideoConstraints?: (constraints: { advanced: { torch: boolean }[] }) => Promise<void>;
      } | null;

      if (scanner?.applyVideoConstraints) {
        await scanner.applyVideoConstraints({
          advanced: [{ torch: !flashOn }],
        });
        setFlashOn(!flashOn);
      }
    } catch {
      // 플래시 토글 실패
    }
  };

  // 갤러리에서 이미지 선택 (향후 구현)
  const handleGallerySelect = () => {
    // TODO: 이미지에서 바코드 인식 구현
    onError?.('갤러리 기능은 준비 중입니다');
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-black flex flex-col',
        className
      )}
      data-testid="barcode-scanner"
    >
      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="닫기"
          data-testid="barcode-scanner-close"
        >
          <X className="w-6 h-6" />
        </button>

        <span className="text-white text-sm font-medium">
          바코드를 프레임에 맞춰주세요
        </span>

        <div className="w-10" /> {/* 균형용 스페이서 */}
      </div>

      {/* 스캐너 영역 */}
      <div className="flex-1 flex items-center justify-center">
        {state === 'initializing' && (
          <div className="text-white text-center">
            <div className="animate-spin w-10 h-10 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
            <p>카메라 준비 중...</p>
          </div>
        )}

        {state === 'error' && (
          <div className="text-white text-center p-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-lg font-medium mb-2">카메라 오류</p>
            <p className="text-sm text-gray-400">{errorMessage}</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-white text-black rounded-lg font-medium"
            >
              닫기
            </button>
          </div>
        )}

        {state === 'success' && (
          <div className="text-white text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-medium">스캔 완료!</p>
          </div>
        )}

        {/* html5-qrcode 컨테이너 */}
        <div
          id="barcode-scanner-region"
          ref={scannerRef}
          className={cn(
            'w-full h-full',
            (state === 'initializing' || state === 'error' || state === 'success') && 'hidden'
          )}
        />

        {/* 스캔 가이드 오버레이 */}
        {(state === 'ready' || state === 'scanning') && (
          <div className="absolute inset-0 pointer-events-none">
            {/* 어두운 영역 */}
            <div className="absolute inset-0 bg-black/50" />

            {/* 투명 스캔 영역 */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[160px]"
              style={{
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              }}
            >
              {/* 코너 마커 */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br" />

              {/* 스캔 라인 애니메이션 */}
              <div className="absolute left-0 right-0 h-0.5 bg-green-400 animate-scan" />
            </div>
          </div>
        )}
      </div>

      {/* 하단 컨트롤 */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-between">
        {/* 플래시 버튼 */}
        {hasFlash && (
          <button
            onClick={toggleFlash}
            className="p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label={flashOn ? '플래시 끄기' : '플래시 켜기'}
            data-testid="barcode-scanner-flash"
          >
            {flashOn ? (
              <Flashlight className="w-6 h-6" />
            ) : (
              <FlashlightOff className="w-6 h-6" />
            )}
          </button>
        )}

        {!hasFlash && <div className="w-12" />}

        {/* 중앙 안내 텍스트 */}
        <div className="text-center">
          <p className="text-white/80 text-sm">
            EAN-13, EAN-8, UPC-A 바코드 지원
          </p>
        </div>

        {/* 갤러리 버튼 */}
        <button
          onClick={handleGallerySelect}
          className="p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="갤러리에서 선택"
          data-testid="barcode-scanner-gallery"
        >
          <ImageIcon className="w-6 h-6" />
        </button>
      </div>

      {/* 스캔 라인 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes scan {
          0%,
          100% {
            top: 0;
          }
          50% {
            top: calc(100% - 2px);
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
