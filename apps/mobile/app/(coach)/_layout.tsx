/**
 * AI 코치 라우트 레이아웃
 */

import { router } from 'expo-router';
import { Stack } from 'expo-router';
import { Pressable, Text, StyleSheet } from 'react-native';

import { useTheme, typography, spacing } from '../../lib/theme';

export default function CoachLayout() {
  const { colors, brand, typography } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '뒤로',
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'AI 코치',
          headerLargeTitle: false,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/(coach)/history')}
              style={styles.headerButton}
            >
              <Text style={[styles.headerButtonText, { color: brand.primary }]}>기록</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: '대화 기록',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
});
