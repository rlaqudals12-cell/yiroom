/**
 * AI 트윈(내 AI 아바타) 라우트 레이아웃 (ADR-115)
 */

import { Stack } from 'expo-router';

import { BiometricRouteGate } from '@/components/analysis/BiometricRouteGate';
import { TwinStorageConsentGate } from '@/components/visual-expression/TwinStorageConsentGate';

import { useTheme } from '../../lib/theme';

export default function TwinLayout(): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <BiometricRouteGate
      loadingColor={colors.foreground}
      loadingTestID="twin-biometric-gate-loading"
    >
      <TwinStorageConsentGate>
        <Stack
          screenOptions={{
            headerShown: true,
            headerBackTitle: '뒤로',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.foreground,
          }}
        >
          <Stack.Screen name="index" options={{ title: '내 AI 아바타 만들기' }} />
        </Stack>
      </TwinStorageConsentGate>
    </BiometricRouteGate>
  );
}
