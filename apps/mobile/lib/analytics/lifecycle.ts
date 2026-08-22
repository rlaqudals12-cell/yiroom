import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { fetchConsentPreferences } from '@/lib/api/consent-preferences';

import { getSessionId } from './session';
import {
  flushEvents,
  resetAnalyticsIdentity,
  setAnalyticsConsent,
  trackAppStarted,
} from './tracker';

type GetClerkToken = () => Promise<string | null>;

/** 앱 최초 실행과 백그라운드 복귀를 세션 시작 경계로 기록한다. */
export function useAnalyticsLifecycle(
  getToken: GetClerkToken,
  isSignedIn: boolean,
  userId: string | null | undefined
): void {
  const previousIdentityRef = useRef<string | null | undefined>(undefined);
  const wasBackgroundedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const getAnalyticsToken = async (): Promise<string | null> => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    };
    const loadConsentAndSendSessionStart = (): void => {
      void getAnalyticsToken().then(async (token) => {
        if (!mounted || !token) {
          if (mounted) setAnalyticsConsent(null);
          return;
        }

        try {
          const preferences = await fetchConsentPreferences(token);
          if (!mounted) return;
          setAnalyticsConsent(preferences.analyticsConsent);
          if (preferences.analyticsConsent) await trackAppStarted(token);
        } catch {
          // 조회 실패도 동의로 추정하지 않는다. 다음 활성화 때 다시 조회한다.
          if (mounted) setAnalyticsConsent(null);
        }
      });
    };

    const currentIdentity = isSignedIn && userId ? userId : null;
    const previousIdentity = previousIdentityRef.current;
    const isFirstEffect = previousIdentity === undefined;
    const identityChanged = !isFirstEffect && previousIdentity !== currentIdentity;

    if (identityChanged) resetAnalyticsIdentity();
    if (isFirstEffect && !currentIdentity) setAnalyticsConsent(null);
    previousIdentityRef.current = currentIdentity;

    if (currentIdentity && (isFirstEffect || identityChanged)) {
      loadConsentAndSendSessionStart();
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        wasBackgroundedRef.current = true;
        if (!currentIdentity) return;
        void getAnalyticsToken().then((token) => {
          // 토큰 대기 중 계정이 바뀌면 이전 사용자의 토큰으로 새 사용자의 큐를 보내면 안 된다.
          if (mounted) void flushEvents(token);
        });
        return;
      }

      if (nextState === 'active' && wasBackgroundedRef.current) {
        wasBackgroundedRef.current = false;
        if (!currentIdentity) return;
        // 짧은 앱 전환은 같은 세션이다. 30분 비활성으로 세션이 만료된 경우만 새 시작을 센다.
        if (getSessionId() === null) loadConsentAndSendSessionStart();
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [getToken, isSignedIn, userId]);
}
