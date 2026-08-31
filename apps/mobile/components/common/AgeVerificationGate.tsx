/**
 * 로그인 사용자의 전역 연령 확인 게이트.
 *
 * 기존 계정도 보호 표면을 열기 전에 서버 정본(users.birth_date)을 확인한다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { isAgeVerificationRequiredRoute, isMinor, parseBirthDate } from '@/lib/age-verification';
import { BirthdateApiError, fetchBirthdate } from '@/lib/api/birthdate';

type GateStatus = 'idle' | 'checking' | 'verified';

// 성인 검증은 불변이므로 계정 단위로 캐시한다 — 오프라인·서버 지연 시 이미 검증된
// 사용자가 매 콜드스타트마다 수집 화면으로 튕기는 것을 막는다(미성년은 세션 폐기라 캐시 무관).
const AGE_VERIFIED_CACHE_PREFIX = 'yiroom.age-verified.v1:';

async function readVerifiedCache(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(`${AGE_VERIFIED_CACHE_PREFIX}${userId}`)) === '1';
  } catch {
    return false;
  }
}

function writeVerifiedCache(userId: string): void {
  AsyncStorage.setItem(`${AGE_VERIFIED_CACHE_PREFIX}${userId}`, '1').catch(() => {});
}

// 게이트 조회가 무한 대기하면 오버레이가 앱 전체를 영구 블록한다(RN 기본 타임아웃 없음).
// 상한 초과는 조회 실패와 동일하게 fail-closed(수집 화면 착지)로 처리한다.
const BIRTHDATE_FETCH_TIMEOUT_MS = 8000;

class BirthdateGateTimeoutError extends Error {
  constructor() {
    super('연령 확인 응답이 지연되고 있습니다.');
    this.name = 'BirthdateGateTimeoutError';
  }
}

function isBirthdateUnavailable(error: unknown): boolean {
  return (
    error instanceof BirthdateGateTimeoutError ||
    (error instanceof BirthdateApiError && (error.status === 0 || error.code === 'NETWORK_ERROR'))
  );
}

function withGateTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new BirthdateGateTimeoutError()),
      BIRTHDATE_FETCH_TIMEOUT_MS
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  });
}

interface AgeVerificationGateProps {
  children: React.ReactNode;
  loadingColor: string;
}

/** Expo Router의 URL에는 빠지는 route group을 복원해 기존 경로 계약과 맞춘다. */
export function buildAgeVerificationPath(segments: readonly string[]): string {
  return segments.length > 0 ? `/${segments.join('/')}` : '/';
}

export function AgeVerificationGate({
  children,
  loadingColor,
}: AgeVerificationGateProps): React.JSX.Element {
  const { getToken, isLoaded, isSignedIn, signOut, userId } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const routePath = useMemo(() => buildAgeVerificationPath(segments), [segments]);
  const requiresVerification = isAgeVerificationRequiredRoute(routePath);
  const [status, setStatus] = useState<GateStatus>('idle');
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !requiresVerification) {
      setStatus('idle');
      setVerifiedUserId(null);
      return;
    }

    let active = true;
    setStatus('checking');

    void (async () => {
      try {
        if (!userId) {
          router.replace('/(auth)/sign-in');
          return;
        }

        // 이미 성인으로 검증된 계정은 서버 왕복 없이 통과(오프라인 내성)
        if (await readVerifiedCache(userId)) {
          if (!active) return;
          setVerifiedUserId(userId);
          setStatus('verified');
          return;
        }
        if (!active) return;

        const token = await getToken();
        if (!active) return;
        if (!token) {
          router.replace('/(auth)/sign-in');
          return;
        }

        const birthdate = await withGateTimeout(fetchBirthdate(token));
        if (!active) return;

        if (!birthdate.hasBirthDate || !birthdate.birthDate) {
          router.replace('/(auth)/complete-profile');
          return;
        }

        const parsedBirthdate = parseBirthDate(birthdate.birthDate);
        if (!parsedBirthdate) {
          router.replace('/(auth)/complete-profile');
          return;
        }

        if (isMinor(parsedBirthdate)) {
          await signOut();
          if (active) router.replace('/(auth)/age-restricted');
          return;
        }

        writeVerifiedCache(userId);
        setVerifiedUserId(userId);
        setStatus('verified');
      } catch (error: unknown) {
        // 조회 실패를 통과로 취급하면 기존 계정이 연령 확인을 우회하므로 수집 화면으로 닫는다.
        if (!active) return;
        if (isBirthdateUnavailable(error)) {
          router.replace({
            pathname: '/(auth)/complete-profile',
            params: { reason: 'unavailable' },
          });
          return;
        }
        router.replace('/(auth)/complete-profile');
      }
    })();

    return () => {
      active = false;
    };
    // getToken/signOut은 Clerk가 렌더마다 새 참조를 줄 수 있어 계정·경로 변화만 재검사한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, requiresVerification, userId]);

  const isVerifiedUser = status === 'verified' && userId !== null && verifiedUserId === userId;
  const shouldBlock = Boolean(isLoaded && isSignedIn && requiresVerification && !isVerifiedUser);

  return (
    <View style={styles.container}>
      <View
        accessibilityElementsHidden={shouldBlock}
        importantForAccessibility={shouldBlock ? 'no-hide-descendants' : 'auto'}
        pointerEvents={shouldBlock ? 'none' : 'auto'}
        style={styles.content}
        testID="age-verification-content"
      >
        {children}
      </View>
      {shouldBlock && (
        <View
          accessibilityLabel="연령 확인 중"
          style={styles.loadingOverlay}
          testID="global-age-verification-loading"
        >
          <ActivityIndicator color={loadingColor} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
    justifyContent: 'center',
  },
});
