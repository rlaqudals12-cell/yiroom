/**
 * 분석 결과 화면 동적 스타일 훅
 *
 * useTheme() 기반으로 다크모드 자동 전환.
 */
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme, radii , spacing } from '@/lib/theme';

export function useAnalysisStyles() {
  const theme = useTheme();
  const { colors, brand } = theme;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        // 컨테이너
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: 20,
        },

        // 카드
        card: {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: 20,
          marginBottom: spacing.md,
        },

        // 섹션 (카드와 동일 레이아웃, sectionTitle과 함께 사용)
        section: {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: 20,
          marginBottom: spacing.md,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.foreground,
          marginBottom: spacing.md,
        },

        // 결과 카드 (가운데 정렬)
        resultCard: {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.lg,
          marginBottom: spacing.md,
          alignItems: 'center',
        },

        // 텍스트
        label: {
          fontSize: 14,
          color: colors.mutedForeground,
          marginBottom: spacing.sm,
        },
        subLabel: {
          fontSize: 15,
          color: colors.mutedForeground,
        },
        description: {
          fontSize: 15,
          color: colors.mutedForeground,
          lineHeight: 24,
          textAlign: 'center',
        },
        listItem: {
          fontSize: 15,
          color: colors.mutedForeground,
          lineHeight: 26,
        },

        // 이미지 컨테이너
        imageContainer: {
          alignItems: 'center',
          marginBottom: 20,
        },
      }),
    [colors, brand]
  );

  return {
    styles,
    ...theme,
  };
}
