/**
 * 이룸 모바일 앱 루트 레이아웃
 */
import '../global.css';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AgeVerificationGate } from '../components/common/AgeVerificationGate';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { useAnalyticsLifecycle } from '../lib/analytics/lifecycle';
import { tokenCache, CLERK_PUBLISHABLE_KEY } from '../lib/clerk';
import { initSentry, SentryErrorBoundary, sentryWrap } from '../lib/monitoring/sentry';
import { cleanupHiddenWellnessNotificationsOnce } from '../lib/notifications/hidden-wellness-cleanup';
import { useNotificationResponse } from '../lib/notifications/useNotifications';
import { ThemeProvider, useTheme, lightColors, typography, spacing } from '../lib/theme';
import { resultSerifFonts } from '../lib/theme/fonts';
import { appLogger } from '../lib/utils/logger';

// Expo Go에서 expo-notifications 경고 억제 (SDK 53+ 제한)
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported',
]);

// ThemeProvider 내부에서 useTheme 사용 가능한 레이아웃
function ThemedStack() {
  const { colors, isDark } = useTheme();
  const { getToken, isSignedIn, userId } = useAuth();
  useAnalyticsLifecycle(getToken, isSignedIn === true, userId);

  // 알림 탭 → 딥링크(data.route로 이동). 아침 브리핑 등 로컬 알림 탭을 [오늘] 탭으로 연결.
  useNotificationResponse();

  // 배치 E 이전에 남은 운동·식사·물 예약 알림만 앱 시작 시 1회 정리한다.
  useEffect(() => {
    void cleanupHiddenWellnessNotificationsOnce();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <AgeVerificationGate loadingColor={colors.foreground}>
        <Stack
          initialRouteName="index"
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.card,
            },
            headerTintColor: colors.foreground,
            headerTitleStyle: {
              fontWeight: typography.weight.semibold,
            },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(analysis)" options={{ headerShown: false }} />
          <Stack.Screen name="(scan)" options={{ headerShown: false }} />
          <Stack.Screen name="(challenges)" options={{ headerShown: false }} />
          <Stack.Screen name="(closet)" options={{ headerShown: false }} />
          <Stack.Screen name="(chat)" options={{ headerShown: false }} />
          <Stack.Screen name="(coach)" options={{ headerShown: false }} />
          <Stack.Screen name="(feed)" options={{ headerShown: false }} />
          <Stack.Screen name="(nutrition)" options={{ headerShown: false }} />
          <Stack.Screen name="(reports)" options={{ headerShown: false }} />
          <Stack.Screen name="(social)" options={{ headerShown: false }} />
          <Stack.Screen name="(workout)" options={{ headerShown: false }} />
          <Stack.Screen name="(twin)" options={{ headerShown: false }} />
          <Stack.Screen name="products" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen
            name="privacy-policy"
            options={{ title: '개인정보처리방침', headerBackTitle: '뒤로' }}
          />
          <Stack.Screen name="terms" options={{ title: '이용약관', headerBackTitle: '뒤로' }} />
          <Stack.Screen
            name="wellness"
            options={{ title: '웰니스 점수', headerBackTitle: '뒤로' }}
          />
        </Stack>
      </AgeVerificationGate>
    </>
  );
}

// Sentry ErrorBoundary fallback
function SentryFallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.mlg }}>
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          marginBottom: spacing.sm,
        }}
      >
        문제가 발생했어요
      </Text>
      <Text
        style={{
          fontSize: typography.size.sm,
          color: lightColors.mutedForeground,
          textAlign: 'center',
        }}
      >
        앱을 다시 시작해 주세요.
      </Text>
    </View>
  );
}

function RootLayout() {
  // 결과 첫 프레임부터 세리프가 고정되도록 앱 루트에서 한 번만 미리 로드한다.
  const [fontsLoaded, fontError] = useFonts(resultSerifFonts);

  // Sentry 초기화
  useEffect(() => {
    initSentry();
  }, []);

  // Clerk key가 없으면 경고 (개발 중에는 무시)
  if (!CLERK_PUBLISHABLE_KEY) {
    appLogger.warn('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SentryErrorBoundary fallback={SentryFallback}>
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
          <ClerkLoaded>
            <ThemeProvider>
              <ThemedStack />
            </ThemeProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </SentryErrorBoundary>
    </GestureHandlerRootView>
  );
}

// Sentry wrap으로 앱 전체 성능 추적
export default sentryWrap(RootLayout);
