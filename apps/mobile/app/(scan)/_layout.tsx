/**
 * 성분 스캔 레이아웃 (ADR-112 "나와의 적합도")
 * 제품 성분표를 촬영/선택 → OCR → 판정. 인벤토리 바코드 스캔과 별개 흐름.
 */
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useTheme } from '../../lib/theme';

export default function ScanLayout(): React.JSX.Element {
  const { colors, isDark, typography } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontWeight: typography.weight.semibold },
        headerBackTitle: '뒤로',
        animation: 'slide_from_right',
        animationDuration: 280,
        ...(Platform.OS === 'ios' && {
          headerBlurEffect: isDark ? 'dark' : 'light',
          headerTransparent: true,
        }),
      }}
    >
      <Stack.Screen name="index" options={{ title: '성분 스캔' }} />
    </Stack>
  );
}
