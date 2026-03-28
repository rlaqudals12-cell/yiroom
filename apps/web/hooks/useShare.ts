'use client';

import { useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { captureElementAsImage, shareImage } from '@/lib/share';
import { toast } from 'sonner';

interface UseShareOptions {
  /** 캡처 시 배경색 */
  backgroundColor?: string;
  /** 캡처 품질 (0-1) */
  quality?: number;
  /** 캡처 스케일 (픽셀 비율) */
  scale?: number;
}

interface UseShareReturn {
  /** 캡처 대상 요소에 연결할 ref */
  ref: React.RefObject<HTMLDivElement | null>;
  /** 공유 실행 함수 */
  share: () => Promise<void>;
  /** 로딩 상태 */
  loading: boolean;
}

/**
 * 결과 공유 기능 훅
 * @param title 공유 제목 (파일명으로도 사용)
 * @param options 캡처 옵션
 * @returns ref, share 함수, loading 상태
 *
 * @example
 * ```tsx
 * const { ref, share, loading } = useShare('이룸-운동타입-결과');
 *
 * return (
 *   <>
 *     <div ref={ref}>캡처할 영역</div>
 *     <ShareButton onShare={share} loading={loading} />
 *   </>
 * );
 * ```
 */
export function useShare(title: string, options?: UseShareOptions): UseShareReturn {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const t = useTranslations('share');

  const share = useCallback(async () => {
    if (!ref.current) {
      toast.error(t('sharePrepareFailed'));
      return;
    }

    setLoading(true);

    try {
      const blob = await captureElementAsImage(ref.current, {
        quality: options?.quality ?? 0.95,
        scale: options?.scale ?? 2,
        backgroundColor: options?.backgroundColor ?? '#ffffff',
      });

      if (!blob) {
        toast.error(t('imageFailed'));
        return;
      }

      const success = await shareImage(blob, title, t('checkOnYiroom', { title }));

      if (success) {
        if (!navigator.share) {
          toast.success(t('imageSaved'));
        }
      }
    } catch (error) {
      console.error('[이룸] 공유 오류:', error);
      toast.error(t('shareFailed'));
    } finally {
      setLoading(false);
    }
  }, [title, options, t]);

  return { ref, share, loading };
}

export default useShare;
