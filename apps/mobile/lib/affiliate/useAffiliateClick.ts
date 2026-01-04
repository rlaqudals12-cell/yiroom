/**
 * 어필리에이트 클릭 훅
 * @description 제품 클릭 시 트래킹 및 외부 링크 열기 (Clerk 통합)
 */

import { useUser } from '@clerk/clerk-expo';
import { useCallback, useState } from 'react';

import { useClerkSupabaseClient } from '../supabase';
import { createAffiliateClick } from './clicks';
import { trackAndOpenLink, identifyPartner } from './deeplink';
import type { AffiliatePartnerName } from './types';

interface UseAffiliateClickOptions {
  productId: string;
  productUrl: string;
  partner?: AffiliatePartnerName;
  sourcePage: string;
  sourceComponent?: string;
  recommendationType?: 'skin' | 'color' | 'body' | 'general';
}

interface UseAffiliateClickReturn {
  handleClick: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * 어필리에이트 클릭 훅
 * - 클릭 트래킹 → 딥링크 생성 → 외부 앱/브라우저 열기
 */
export function useAffiliateClick(
  options: UseAffiliateClickOptions
): UseAffiliateClickReturn {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    productId,
    productUrl,
    partner: providedPartner,
    sourcePage,
    sourceComponent,
    recommendationType,
  } = options;

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. 파트너 식별
      const partner = providedPartner || identifyPartner(productUrl);
      if (!partner) {
        console.warn('[Mobile Affiliate] 파트너 식별 불가, 원본 URL 사용');
      }

      // 2. 클릭 트래킹 (백그라운드, Clerk 통합 Supabase 사용)
      createAffiliateClick(supabase, {
        productId,
        clerkUserId: user?.id,
        sourcePage,
        sourceComponent,
        recommendationType,
      }).catch((err) => {
        console.error('[Mobile Affiliate] 클릭 트래킹 실패:', err);
      });

      // 3. 링크 열기
      const success = partner
        ? await trackAndOpenLink(productUrl, partner, `mobile-${sourcePage}`)
        : await trackAndOpenLink(productUrl, 'coupang', `mobile-${sourcePage}`);

      if (!success) {
        setError('링크를 열 수 없습니다');
      }
    } catch (err) {
      console.error('[Mobile Affiliate] 클릭 처리 오류:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [
    supabase,
    productId,
    productUrl,
    providedPartner,
    sourcePage,
    sourceComponent,
    recommendationType,
    user?.id,
  ]);

  return {
    handleClick,
    isLoading,
    error,
  };
}

export default useAffiliateClick;
