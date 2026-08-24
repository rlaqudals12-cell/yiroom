/**
 * 분석 모듈 레이아웃
 * 슬라이드/페이드 전환 애니메이션 + 반투명 헤더
 */
import { useAuth } from '@clerk/clerk-expo';
import { FEATURE_FLAGS } from '@yiroom/shared';
import { Redirect, Stack, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { fetchAgreementStatus } from '@/lib/api/agreement';
import { fetchBirthdate } from '@/lib/api/birthdate';

import { useTheme } from '../../lib/theme';

const STANDALONE_BIOMETRIC_AXES = new Set(['personal-color', 'skin', 'body', 'hair', 'makeup']);

type GateStatus = 'checking' | 'allowed' | 'needs-setup' | 'needs-auth';

function analysisRouteParts(segments: readonly string[]): {
  module: string | undefined;
  screen: string | undefined;
} {
  const groupIndex = segments.indexOf('(analysis)');
  const moduleIndex = groupIndex >= 0 ? groupIndex + 1 : 0;
  return { module: segments[moduleIndex], screen: segments[moduleIndex + 1] };
}

/** 사진 입력·분석 실행 화면만 선제 게이트한다. 이력·루틴 등 조회 표면은 범위 밖이다. */
export function requiresStandaloneAnalysisGate(segments: readonly string[]): boolean {
  const { module, screen } = analysisRouteParts(segments);
  if (!module || !STANDALONE_BIOMETRIC_AXES.has(module)) return false;
  return screen === undefined || screen === 'index' || screen === 'camera' || screen === 'result';
}

function isPostureRoute(segments: readonly string[]): boolean {
  return analysisRouteParts(segments).module === 'posture';
}

function StandaloneAnalysisGate({
  children,
  loadingColor,
}: {
  children: React.ReactNode;
  loadingColor: string;
}): React.JSX.Element {
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

        // 통합 분석과 같은 서버 정본을 조회한다. 둘 중 하나라도 없거나 조회에 실패하면
        // 사진을 받지 않고 기존 통합 분석의 연령·동의 수집 화면으로 보낸다.
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
    // Clerk의 getToken은 렌더마다 새 참조일 수 있다. 로그인 판정 후 마운트당 한 번만 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, userId]);

  if (!isLoaded || (isSignedIn && status === 'checking')) {
    return (
      <View
        accessibilityLabel="분석 이용 조건 확인 중"
        style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}
        testID="standalone-analysis-gate-loading"
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

export default function AnalysisLayout(): React.JSX.Element {
  const { colors, isDark, typography } = useTheme();
  const segments = useSegments();

  // 자세는 출시 범위 밖이다. 하위 파일을 유지하면서도 index/camera/result/history를
  // 포함한 모든 직접 딥링크를 레이아웃 경계에서 먼저 차단한다.
  if (isPostureRoute(segments) && !FEATURE_FLAGS.WELLNESS_PHASE2) {
    return <Redirect href="/(tabs)" />;
  }

  const stack = (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontWeight: typography.weight.semibold,
        },
        headerBackTitle: '뒤로',
        // 전환 애니메이션
        animation: 'slide_from_right',
        animationDuration: 280,
        // iOS 헤더 블러 효과
        ...(Platform.OS === 'ios' && {
          headerBlurEffect: isDark ? 'dark' : 'light',
          headerTransparent: true,
        }),
      }}
    >
      <Stack.Screen
        name="personal-color/index"
        options={{
          title: '퍼스널 컬러 진단',
        }}
      />
      <Stack.Screen
        name="personal-color/camera"
        options={{
          title: '사진 촬영',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="personal-color/result"
        options={{
          title: '진단 결과',
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen name="personal-color/history" options={{ title: '퍼스널컬러 이력' }} />
      <Stack.Screen
        name="skin/index"
        options={{
          title: '피부 분석',
        }}
      />
      <Stack.Screen
        name="skin/camera"
        options={{
          title: '사진 촬영',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="skin/result"
        options={{
          title: '분석 결과',
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen
        name="skin/routine"
        options={{
          title: '스킨케어 루틴',
        }}
      />
      <Stack.Screen name="skin/history" options={{ title: '피부 분석 이력' }} />
      <Stack.Screen name="skin/diary" options={{ title: '피부 다이어리' }} />
      <Stack.Screen
        name="skin/diary-entry"
        options={{
          title: '다이어리 기록',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="skin/consultation" options={{ title: '피부 상담' }} />
      <Stack.Screen name="skin/solution" options={{ title: '피부 솔루션' }} />
      <Stack.Screen
        name="body/index"
        options={{
          title: '체형 분석',
        }}
      />
      <Stack.Screen
        name="body/result"
        options={{
          title: '분석 결과',
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen name="body/history" options={{ title: '체형 분석 이력' }} />
      {/* H-1 헤어 분석 */}
      <Stack.Screen
        name="hair/index"
        options={{
          title: '헤어 분석',
        }}
      />
      <Stack.Screen
        name="hair/camera"
        options={{
          title: '사진 촬영',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="hair/result"
        options={{
          title: '분석 결과',
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen name="hair/history" options={{ title: '헤어 분석 이력' }} />
      {/* M-1 메이크업 분석 */}
      <Stack.Screen
        name="makeup/index"
        options={{
          title: '메이크업 분석',
        }}
      />
      <Stack.Screen
        name="makeup/camera"
        options={{
          title: '사진 촬영',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="makeup/result"
        options={{
          title: '분석 결과',
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen name="makeup/history" options={{ title: '메이크업 이력' }} />
      {/* 통합 분석 (ADR-102) — 미등록 시 헤더에 raw 라우트명(integrated/index) 노출 */}
      <Stack.Screen
        name="integrated/index"
        options={{
          title: '5축 통합 분석',
        }}
      />
      <Stack.Screen
        name="integrated/result/[sessionId]"
        options={{
          title: '통합 분석 결과',
          animation: 'fade_from_bottom',
        }}
      />
      {/* 분석 허브 */}
      <Stack.Screen name="hub" options={{ title: '분석' }} />
      {/* OH-1 구강건강: ADR-098로 완전 제거됨 — 화면 파일이 없으므로 등록하지 않음 */}
      {/* 분석 이력 */}
      <Stack.Screen
        name="history/index"
        options={{
          title: '분석 이력',
        }}
      />
      {/* 분석 비교 (제네릭) */}
      <Stack.Screen
        name="compare"
        options={{
          title: '분석 비교',
          animation: 'fade_from_bottom',
        }}
      />
      {/* Posture 자세 분석 */}
      <Stack.Screen
        name="posture/index"
        options={{
          title: '자세 분석',
        }}
      />
      <Stack.Screen
        name="posture/camera"
        options={{
          title: '사진 촬영',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="posture/result"
        options={{
          title: '분석 결과',
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen name="posture/history" options={{ title: '자세 분석 이력' }} />
    </Stack>
  );

  // 통합 분석은 자체 화면에서 연령·동의를 수집하므로 이 게이트의 대상이 아니다.
  return requiresStandaloneAnalysisGate(segments) ? (
    <StandaloneAnalysisGate loadingColor={colors.foreground}>{stack}</StandaloneAnalysisGate>
  ) : (
    stack
  );
}
