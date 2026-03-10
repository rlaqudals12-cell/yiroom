'use client';

import { useRef, useState, useCallback } from 'react';
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
export function useShare(
  title: string,
  options?: UseShareOptions
): UseShareReturn {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const share = useCallback(async () => {
    if (!ref.current) {
      toast.error('공유할 내용을 찾을 수 없습니다');
      return;
    }

    setLoading(true);

    try {
      // HTML 요소를 이미지로 캡처
      const blob = await captureElementAsImage(ref.current, {
        quality: options?.quality ?? 0.95,
        scale: options?.scale ?? 2,
        backgroundColor: options?.backgroundColor ?? '#ffffff',
      });

      if (!blob) {
        toast.error('이미지 생성에 실패했습니다');
        return;
      }

      // 공유 또는 다운로드
      const success = await shareImage(
        blob,
        title,
        `${title} - 이룸에서 확인하세요!`
      );

      if (success) {
        // Web Share API가 아닌 다운로드인 경우에만 토스트 표시
        // (공유는 시스템 UI가 표시되므로 토스트 불필요)
        if (!navigator.share) {
          toast.success('이미지가 저장되었습니다');
        }
      }
    } catch (error) {
      console.error('[이룸] 공유 오류:', error);
      toast.error('공유 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, [title, options]);

  return { ref, share, loading };
}

export default useShare;
