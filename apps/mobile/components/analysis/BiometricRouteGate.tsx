import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { fetchAgreementStatus } from '@/lib/api/agreement';
import { fetchBirthdate } from '@/lib/api/birthdate';

type GateStatus = 'checking' | 'allowed' | 'needs-setup' | 'needs-auth';

interface BiometricRouteGateProps {
  children: ReactNode;
  loadingColor: string;
  loadingTestID: string;
}

/**
 * 사진 기반 기능의 공용 선제 게이트.
 *
 * 로그인·연령·생체정보 동의 중 하나라도 확인할 수 없으면 사진 입력 화면을 열지 않는다.
 * 통합 분석이 이미 제공하는 수집 플로우를 정본으로 재사용한다.
 */
export function BiometricRouteGate({
  children,
  loadingColor,
  loadingTestID,
}: BiometricRouteGateProps): React.JSX.Element {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const [status, setStatus] = useState<GateStatus>('checking');

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let active = true;
    // 같은 레이아웃에서 계정만 전환되어도 이전 계정의 허용 상태를 재사용하지 않는다.
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

        const isReady =
          birthdate.status === 'fulfilled' &&
          birthdate.value.hasBirthDate &&
          agreement.status === 'fulfilled' &&
          agreement.value.hasAgreed;
        setStatus(isReady ? 'allowed' : 'needs-setup');
      } catch {
        if (active) setStatus('needs-setup');
      }
    })();

    return () => {
      active = false;
    };
    // Clerk의 getToken은 렌더마다 새 참조일 수 있다. 로그인 판정 후 계정당 한 번만 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, userId]);

  if (!isLoaded || (isSignedIn && status === 'checking')) {
    return (
      <View
        accessibilityLabel="분석 이용 조건 확인 중"
        style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}
        testID={loadingTestID}
      >
        <ActivityIndicator color={loadingColor} />
      </View>
    );
  }

  if (!isSignedIn || status === 'needs-auth') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (status === 'needs-setup') {
    return <Redirect href="/(analysis)/integrated" />;
  }

  return <>{children}</>;
}
