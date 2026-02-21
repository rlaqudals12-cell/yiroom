/**
 * 이룸 모바일 앱 루트 레이아웃
 */
import '../global.css';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { tokenCache, CLERK_PUBLISHABLE_KEY } from '../lib/clerk';
import { ThemeProvider, useTheme } from '../lib/theme';
import { appLogger } from '../lib/utils/logger';

// ThemeProvider 내부에서 useTheme 사용 가능한 레이아웃
function ThemedStack() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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

export default function RootLayout() {
  // Clerk key가 없으면 경고 (개발 중에는 무시)
  if (!CLERK_PUBLISHABLE_KEY) {
    appLogger.warn('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ThemeProvider>
          <ThemedStack />
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
