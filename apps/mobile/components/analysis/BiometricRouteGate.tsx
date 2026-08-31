import { useAuth } from '@clerk/clerk-expo';
import { router, useSegments } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AnalysisErrorState } from '@/components/analysis/AnalysisErrorState';
import { fetchAgreementStatus } from '@/lib/api/agreement';
import { fetchBirthdate } from '@/lib/api/birthdate';
import { useTheme } from '@/lib/theme';

type GateStatus = 'checking' | 'allowed' | 'needs-setup' | 'needs-auth' | 'error';

interface BiometricRouteGateProps {
  children: ReactNode;
  loadingColor: string;
  loadingTestID: string;
  failurePresentation?: 'redirect' | 'retry';
}

interface BiometricResultRouteGateProps {
  children: ReactNode;
  imageUri?: string | string[];
}

/** 로그인·연령·생체정보 동의를 사진 입력 전에 확인하는 공용 게이트. */
export function BiometricRouteGate({
  children,
  loadingColor,
  loadingTestID,
  failurePresentation = 'redirect',
}: BiometricRouteGateProps): React.JSX.Element {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const segments = useSegments();
  const [status, setStatus] = useState<GateStatus>('checking');
  const [retryCount, setRetryCount] = useState(0);
  const redirectedToRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let active = true;
    // 계정 전환 시 이전 계정의 허용 상태를 재사용하지 않는다.
    setStatus('checking');
    void (async () => {
      try {
        const token = await getToken();
        if (!active) return;
        if (!token) {
          setStatus('needs-auth');
          return;
        }

        const [birthdate, agreement] = await Promise.allSettled([
          fetchBirthdate(token),
          fetchAgreementStatus(token),
        ]);
        if (!active) return;

        if (birthdate.status === 'rejected' || agreement.status === 'rejected') {
          setStatus('error');
          return;
        }

        setStatus(
          birthdate.value.hasBirthDate && agreement.value.hasAgreed ? 'allowed' : 'needs-setup'
        );
      } catch {
        if (active) setStatus('error');
      }
    })();

    return () => {
      active = false;
    };
    // Clerk getToken은 렌더마다 새 참조일 수 있어 명시적 상태만 의존한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, retryCount, userId]);

  const redirectTarget: 'sign-in' | 'integrated' | null =
    !isLoaded || (isSignedIn && status === 'checking') || status === 'allowed'
      ? null
      : !isSignedIn || status === 'needs-auth'
        ? 'sign-in'
        : status === 'needs-setup' || (status === 'error' && failurePresentation === 'redirect')
          ? 'integrated'
          : null;

  const returnTo = `/${segments.join('/')}`;

  // Redirect 반복 렌더로 replace 루프가 생기지 않도록 이동은 한 번만 발행한다.
  useEffect(() => {
    if (!redirectTarget) return;
    const redirectKey =
      redirectTarget === 'sign-in' ? `${redirectTarget}:${returnTo}` : redirectTarget;
    if (redirectedToRef.current === redirectKey) return;
    redirectedToRef.current = redirectKey;
    router.replace(
      redirectTarget === 'sign-in'
        ? { pathname: '/(auth)/sign-in', params: { returnTo } }
        : '/(analysis)/integrated'
    );
  }, [redirectTarget, returnTo]);

  const handleRetry = useCallback((): void => {
    setStatus('checking');
    setRetryCount((current) => current + 1);
  }, []);

  const loadingState = (
    <View
      accessibilityLabel="분석 이용 조건 확인 중"
      style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}
      testID={loadingTestID}
    >
      <ActivityIndicator color={loadingColor} />
    </View>
  );

  if (!isLoaded || (isSignedIn && status === 'checking')) return loadingState;

  if (status === 'error' && failurePresentation === 'retry') {
    return (
      <AnalysisErrorState
        message="분석 이용 조건을 확인하지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요."
        onRetry={handleRetry}
        retryText="다시 확인하기"
        testID="biometric-route-gate-error"
      />
    );
  }

  if (redirectTarget) return loadingState;

  return <>{children}</>;
}

/** 저장 결과는 통과시키고, 새 사진 결과만 생체정보 사전 조건을 확인한다. */
export function BiometricResultRouteGate({
  children,
  imageUri,
}: BiometricResultRouteGateProps): React.JSX.Element {
  if (!imageUri) return <>{children}</>;
  return <FreshResultRouteGate>{children}</FreshResultRouteGate>;
}

function FreshResultRouteGate({ children }: { children: ReactNode }): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <BiometricRouteGate
      failurePresentation="retry"
      loadingColor={colors.foreground}
      loadingTestID="result-analysis-gate-loading"
    >
      {children}
    </BiometricRouteGate>
  );
}
