/**
 * 딥링크 훅
 * 딥링크 수신 및 처리
 */

// Note: useRouter, useSegments는 필요시 활성화
// import { useRouter, useSegments } from 'expo-router';
import { useEffect, useCallback, useState } from 'react';
import { Linking } from 'react-native';

import {
  parseDeepLink,
  navigateToDeepLink,
  getInitialDeepLink,
} from './handler';
import { ParsedDeepLink } from './types';

interface UseDeepLinkOptions {
  // 자동 처리 활성화
  autoHandle?: boolean;
  // 처리 전 콜백
  onBeforeNavigate?: (parsed: ParsedDeepLink) => boolean;
  // 처리 후 콜백
  onAfterNavigate?: (parsed: ParsedDeepLink, success: boolean) => void;
}

interface UseDeepLinkReturn {
  // 마지막 수신된 딥링크
  lastDeepLink: ParsedDeepLink | null;
  // 수동 처리
  handleUrl: (url: string) => boolean;
  // 초기화 완료 여부
  isReady: boolean;
}

/**
 * 딥링크 처리 훅
 */
export function useDeepLink(
  options: UseDeepLinkOptions = {}
): UseDeepLinkReturn {
  const { autoHandle = true, onBeforeNavigate, onAfterNavigate } = options;
  // Note: 향후 네비게이션 상태 기반 처리 시 활용
  // const router = useRouter();
  // const segments = useSegments();

  const [lastDeepLink, setLastDeepLink] = useState<ParsedDeepLink | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 딥링크 처리
  const handleUrl = useCallback(
    (url: string): boolean => {
      const parsed = parseDeepLink(url);
      setLastDeepLink(parsed);

      if (!parsed.isValid) {
        console.log('[DeepLink] Invalid URL:', url);
        return false;
      }

      // 처리 전 콜백
      if (onBeforeNavigate && !onBeforeNavigate(parsed)) {
        console.log('[DeepLink] Navigation cancelled by callback');
        return false;
      }

      // 네비게이션
      const success = navigateToDeepLink(parsed);

      // 처리 후 콜백
      onAfterNavigate?.(parsed, success);

      return success;
    },
    [onBeforeNavigate, onAfterNavigate]
  );

  // 초기 딥링크 처리 (콜드 스타트)
  useEffect(() => {
    const checkInitialUrl = async () => {
      const initial = await getInitialDeepLink();
      if (initial && autoHandle) {
        // 약간의 딜레이 후 처리 (네비게이션 준비 대기)
        setTimeout(() => {
          handleUrl(`yiroom://${initial.path}`);
        }, 500);
      }
      setIsReady(true);
    };

    checkInitialUrl();
  }, [autoHandle, handleUrl]);

  // 실시간 딥링크 수신 (앱 실행 중)
  useEffect(() => {
    if (!autoHandle) return;

    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[DeepLink] Received URL:', url);
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [autoHandle, handleUrl]);

  return {
    lastDeepLink,
    handleUrl,
    isReady,
  };
}
