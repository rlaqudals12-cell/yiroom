'use client';

/**
 * Phase J P3-D: 코디 공유 훅
 * 이미지 생성 + Web Share API / 다운로드
 *
 * 성능 최적화: html-to-image 동적 import (~30KB 번들 분리)
 */

import { useRef, useState, useCallback } from 'react';
import type { FullOutfit } from '@/types/styling';
import type { SeasonType } from '@/lib/mock/personal-color';

interface UseOutfitShareReturn {
  cardRef: React.RefObject<HTMLDivElement | null>;
  isGenerating: boolean;
  error: string | null;
  generateImage: () => Promise<string | null>;
  shareOutfit: () => Promise<boolean>;
  downloadImage: () => Promise<boolean>;
  copyToClipboard: () => Promise<boolean>;
  canShare: boolean;
}

export function useOutfitShare(
  outfit: FullOutfit | null,
  _seasonType: SeasonType | null
): UseOutfitShareReturn {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web Share API 지원 여부
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  // 이미지 생성 (html-to-image 동적 import)
  const generateImage = useCallback(async (): Promise<string | null> => {
    if (!cardRef.current) {
      setError('카드 요소를 찾을 수 없습니다');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 동적 import로 번들 크기 최적화
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2, // 고해상도
        backgroundColor: '#ffffff',
      });

      return dataUrl;
    } catch (err) {
      console.error('[useOutfitShare] Image generation failed:', err);
      setError('이미지 생성에 실패했습니다');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Data URL을 Blob으로 변환
  const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const response = await fetch(dataUrl);
    return response.blob();
  };

  // Web Share API로 공유
  const shareOutfit = useCallback(async (): Promise<boolean> => {
    if (!canShare) {
      setError('이 브라우저에서는 공유 기능을 지원하지 않습니다');
      return false;
    }

    const dataUrl = await generateImage();
    if (!dataUrl) return false;

    try {
      const blob = await dataUrlToBlob(dataUrl);
      const file = new File([blob], `이룸_코디_${Date.now()}.png`, { type: 'image/png' });

      await navigator.share({
        title: '이룸 코디 추천',
        text: `나의 ${outfit?.occasion || ''} 코디를 확인해보세요!`,
        files: [file],
      });

      return true;
    } catch (err) {
      // 사용자가 취소한 경우
      if (err instanceof Error && err.name === 'AbortError') {
        return false;
      }
      console.error('[useOutfitShare] Share failed:', err);
      setError('공유에 실패했습니다');
      return false;
    }
  }, [canShare, generateImage, outfit?.occasion]);

  // 이미지 다운로드
  const downloadImage = useCallback(async (): Promise<boolean> => {
    const dataUrl = await generateImage();
    if (!dataUrl) return false;

    try {
      const link = document.createElement('a');
      link.download = `이룸_코디_${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (err) {
      console.error('[useOutfitShare] Download failed:', err);
      setError('다운로드에 실패했습니다');
      return false;
    }
  }, [generateImage]);

  // 클립보드에 복사
  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    const dataUrl = await generateImage();
    if (!dataUrl) return false;

    try {
      const blob = await dataUrlToBlob(dataUrl);

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);

      return true;
    } catch (err) {
      console.error('[useOutfitShare] Copy failed:', err);
      setError('복사에 실패했습니다');
      return false;
    }
  }, [generateImage]);

  return {
    cardRef,
    isGenerating,
    error,
    generateImage,
    shareOutfit,
    downloadImage,
    copyToClipboard,
    canShare,
  };
}
