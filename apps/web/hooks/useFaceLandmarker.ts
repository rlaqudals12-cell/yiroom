/**
 * MediaPipe FaceLandmarker React Hook
 *
 * @module hooks/useFaceLandmarker
 * @description 클라이언트 컴포넌트에서 MediaPipe 얼굴 랜드마크 감지
 *
 * ## 사용법
 * ```tsx
 * const { detect, isReady, isLoading, error } = useFaceLandmarker();
 *
 * const handleAnalyze = async (image: HTMLImageElement) => {
 *   const results = await detect(image);
 *   if (results) {
 *     // MediaPipeFaceResult[] 사용
 *   }
 * };
 * ```
 *
 * ## 동작
 * - 마운트 시 MediaPipe WASM + 모델 비동기 로드
 * - WebGL2 미지원 또는 로드 실패 시 graceful fallback (isReady=false)
 * - 언마운트 시 리소스 자동 해제
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MediaPipeFaceResult } from '@/lib/image-engine/cie-2/face-detector';

interface UseFaceLandmarkerResult {
  /** 이미지에서 얼굴 랜드마크 감지 */
  detect: (
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageData
  ) => Promise<MediaPipeFaceResult[] | null>;
  /** MediaPipe 로드 완료 여부 */
  isReady: boolean;
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 로드 에러 (있으면) */
  error: string | null;
}

/**
 * MediaPipe FaceLandmarker 훅
 *
 * 브라우저 환경에서 MediaPipe Tasks Vision을 로드하고
 * 얼굴 랜드마크 감지 기능을 제공합니다.
 *
 * SSR/Node.js에서는 isReady=false 반환 (호출자가 mock fallback 처리)
 */
export function useFaceLandmarker(): UseFaceLandmarkerResult {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    async function init(): Promise<void> {
      setIsLoading(true);
      try {
        // 동적 import (번들 분리)
        const { canUseMediaPipe, loadFaceLandmarker } =
          await import('@/lib/image-engine/cie-2/mediapipe-loader');

        if (cancelled) return;

        if (!canUseMediaPipe()) {
          setIsReady(false);
          setIsLoading(false);
          return;
        }

        const landmarker = await loadFaceLandmarker();
        if (cancelled) return;

        setIsReady(landmarker !== null);
        if (!landmarker) {
          setError('MediaPipe 로드에 실패했습니다.');
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'MediaPipe 초기화 실패';
        setError(message);
        setIsReady(false);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, []);

  const detect = useCallback(
    async (
      imageSource: HTMLImageElement | HTMLCanvasElement | ImageData
    ): Promise<MediaPipeFaceResult[] | null> => {
      if (!isReady) return null;

      try {
        const { detectFaceLandmarks } = await import('@/lib/image-engine/cie-2/mediapipe-loader');
        return await detectFaceLandmarks(imageSource);
      } catch (err) {
        console.warn('[useFaceLandmarker] Detection failed:', err);
        return null;
      }
    },
    [isReady]
  );

  return { detect, isReady, isLoading, error };
}
