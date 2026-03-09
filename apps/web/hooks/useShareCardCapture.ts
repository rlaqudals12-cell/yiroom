'use client';

import { useRef, useState, useCallback } from 'react';
import { captureElementAsImage, captureElementAsDataUrl } from '@/lib/share';

interface UseShareCardCaptureReturn {
  cardRef: React.RefObject<HTMLDivElement | null>;
  captureAsBlob: () => Promise<Blob | null>;
  captureAsDataUrl: () => Promise<string | null>;
  isCapturing: boolean;
}

/**
 * ShareCardTemplate 캡처 훅
 * - cardRef를 ShareCardTemplate에 연결하여 이미지로 캡처
 */
export function useShareCardCapture(): UseShareCardCaptureReturn {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureAsBlob = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;

    setIsCapturing(true);
    try {
      return await captureElementAsImage(cardRef.current);
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const captureAsDataUrl = useCallback(async (): Promise<string | null> => {
    if (!cardRef.current) return null;

    setIsCapturing(true);
    try {
      return await captureElementAsDataUrl(cardRef.current);
    } finally {
      setIsCapturing(false);
    }
  }, []);

  return { cardRef, captureAsBlob, captureAsDataUrl, isCapturing };
}
