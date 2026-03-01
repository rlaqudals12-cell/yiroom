/**
 * Mock 데이터 표시 알림 컴포넌트
 *
 * AI 분석 실패 시 fallback Mock 데이터를 사용하고 있음을 사용자에게 명시
 *
 * @see docs/adr/ADR-007-mock-fallback-strategy.md
 * @see docs/adr/ADR-024-ai-transparency.md
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme, spacing, radii, typography } from '../../lib/theme';

interface MockDataNoticeProps {
  /** 컴팩트 모드 (짧은 메시지만) */
  compact?: boolean;
}

export function MockDataNotice({
  compact = false,
}: MockDataNoticeProps): React.ReactElement {
  const { isDark } = useTheme();

  const bg = isDark ? 'rgba(245,158,11,0.1)' : '#FFFBEB';
  const border = isDark ? 'rgba(245,158,11,0.25)' : '#FDE68A';
  const iconBg = isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7';
  const titleColor = isDark ? '#FDE68A' : '#92400E';
  const textColor = isDark ? '#FBBF24' : '#A16207';

  if (compact) {
    return (
      <View
        style={[styles.compactContainer, { backgroundColor: bg, borderColor: border }]}
        accessibilityRole="alert"
        accessibilityLabel="임시 데이터가 표시되고 있습니다. 샘플 결과입니다."
        testID="mock-data-notice-compact"
      >
        <Text style={[styles.compactIcon, { color: textColor }]} accessibilityElementsHidden>
          ⚠️
        </Text>
        <Text
          style={[
            styles.compactLabel,
            { color: textColor, fontWeight: typography.weight.medium },
          ]}
        >
          샘플 결과
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.fullContainer, { backgroundColor: bg, borderColor: border }]}
      accessibilityRole="alert"
      accessibilityLabel="임시 데이터 표시 중. 현재 AI 분석 서비스를 이용할 수 없어 샘플 결과를 표시합니다. 잠시 후 다시 시도하시면 정확한 분석 결과를 받으실 수 있습니다."
      testID="mock-data-notice"
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Text style={styles.fullIcon} accessibilityElementsHidden>
          ⚠️
        </Text>
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            { color: titleColor, fontWeight: typography.weight.medium },
          ]}
        >
          임시 데이터 표시 중
        </Text>
        <Text style={[styles.description, { color: textColor }]}>
          현재 AI 분석 서비스를 이용할 수 없어 샘플 결과를 표시합니다. 잠시 후 다시 시도하시면
          정확한 분석 결과를 받으실 수 있어요.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  compactIcon: {
    fontSize: 12,
  },
  compactLabel: {
    fontSize: 10,
  },
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.smx,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullIcon: {
    fontSize: typography.size.base,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.sm,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.size.xs,
    lineHeight: typography.size.xs * typography.lineHeight.relaxed,
  },
});
