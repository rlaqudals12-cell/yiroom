/**
 * 인벤토리 모듈 레이아웃
 * 뷰티 화장대, 냉장고(팬트리), 바코드 스캔 등
 */
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useTheme, typography} from '../../lib/theme';

export default function InventoryLayout(): React.JSX.Element {
  const { colors, isDark, typography } = useTheme();

  return (
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
        animation: 'slide_from_right',
        animationDuration: 280,
        ...(Platform.OS === 'ios' && {
          headerBlurEffect: isDark ? 'dark' : 'light',
          headerTransparent: true,
        }),
      }}
    >
      <Stack.Screen
        name="beauty"
        options={{
          title: '내 화장대',
        }}
      />
      <Stack.Screen
        name="pantry"
        options={{
          title: '내 냉장고',
        }}
      />
      <Stack.Screen
        name="barcode-scan"
        options={{
          title: '바코드 스캔',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
