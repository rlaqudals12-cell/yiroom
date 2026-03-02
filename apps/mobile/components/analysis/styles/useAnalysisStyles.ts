/**
 * 분석 결과 화면 동적 스타일 훅
 *
 * useTheme() 기반으로 다크모드 자동 전환.
 * 웹 shadcn/ui 카드 패턴 동기화: rounded-2xl + shadow-sm + border
 */
import { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { useTheme, radii , spacing } from '@/lib/theme';

export function useAnalysisStyles() {
  const theme = useTheme();
  const { colors, brand, isDark } = theme;

  // 웹 shadow-sm 대응 (다크모드에선 그림자 제거, border만 사용)
  const cardShadow = isDark
    ? {}
    : Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        },
        android: { elevation: 1 },
      });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        // 컨테이너
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: spacing.mlg,
        },

        // 카드 — 웹 bg-card rounded-2xl shadow-sm border border-border/50
        card: {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.mlg,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: isDark ? `${colors.border}80` : `${colors.border}80`,
          ...cardShadow,
        },

        // 섹션 카드 — card와 동일 + sectionTitle과 함께 사용
        section: {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.mlg,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: isDark ? `${colors.border}80` : `${colors.border}80`,
          ...cardShadow,
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.foreground,
          marginBottom: spacing.smx,
        },

        // 결과 카드 (가운데 정렬) — 더 두드러진 그림자
        resultCard: {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.lg,
          marginBottom: spacing.md,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: isDark ? `${colors.border}80` : `${colors.border}80`,
          ...cardShadow,
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
          marginBottom: spacing.mlg,
        },
      }),
    [colors, brand, isDark]
  );

  return {
    styles,
    ...theme,
  };
}
