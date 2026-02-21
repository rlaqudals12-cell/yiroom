/**
 * 이룸 모바일 앱 루트 레이아웃
 */
import '../global.css';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { OfflineBanner } from '../components/common/OfflineBanner';
import { tokenCache, CLERK_PUBLISHABLE_KEY } from '../lib/clerk';
import { initSentry, SentryErrorBoundary, sentryWrap } from '../lib/monitoring/sentry';
import { ThemeProvider, useTheme } from '../lib/theme';
import { appLogger } from '../lib/utils/logger';

// ThemeProvider 내부에서 useTheme 사용 가능한 레이아웃
function ThemedStack() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack
        initialRouteName="index"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.foreground,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(analysis)" options={{ headerShown: false }} />
        <Stack.Screen name="(challenges)" options={{ headerShown: false }} />
        <Stack.Screen name="(closet)" options={{ headerShown: false }} />
        <Stack.Screen name="(coach)" options={{ headerShown: false }} />
        <Stack.Screen name="(feed)" options={{ headerShown: false }} />
        <Stack.Screen name="(nutrition)" options={{ headerShown: false }} />
        <Stack.Screen name="(reports)" options={{ headerShown: false }} />
        <Stack.Screen name="(social)" options={{ headerShown: false }} />
        <Stack.Screen name="(workout)" options={{ headerShown: false }} />
        <Stack.Screen name="products" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen
          name="privacy-policy"
          options={{ title: '개인정보처리방침', headerBackTitle: '뒤로' }}
        />
        <Stack.Screen name="terms" options={{ title: '이용약관', headerBackTitle: '뒤로' }} />
      </Stack>
    </>
  );
}

// Sentry ErrorBoundary fallback
function SentryFallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>문제가 발생했어요</Text>
      <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
        앱을 다시 시작해 주세요.
      </Text>
    </View>
  );
}

function RootLayout() {
  // Sentry 초기화
  useEffect(() => {
    initSentry();
  }, []);

  // Clerk key가 없으면 경고 (개발 중에는 무시)
  if (!CLERK_PUBLISHABLE_KEY) {
    appLogger.warn('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  return (
    <SentryErrorBoundary fallback={SentryFallback}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <ClerkLoaded>
          <ThemeProvider>
            <ThemedStack />
          </ThemeProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </SentryErrorBoundary>
  );
}

// Sentry wrap으로 앱 전체 성능 추적
export default sentryWrap(RootLayout);
