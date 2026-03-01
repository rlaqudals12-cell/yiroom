/**
 * AI 기술 사용 안내 컴포넌트
 *
 * AI 기본법 제31조 (2026.1.22 시행) 준수
 * — AI 분석 결과임을 사용자에게 명시적으로 고지
 *
 * @see docs/adr/ADR-024-ai-transparency.md
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme, spacing, radii, typography } from '../../lib/theme';

interface AITransparencyNoticeProps {
  /** 컴팩트 모드 (짧은 설명만) */
  compact?: boolean;
}

export function AITransparencyNotice({
  compact = false,
}: AITransparencyNoticeProps): React.ReactElement {
  const { isDark } = useTheme();

  const bg = isDark ? 'rgba(139,92,246,0.1)' : '#F5F3FF';
  const border = isDark ? 'rgba(139,92,246,0.25)' : '#DDD6FE';
  const iconBg = isDark ? 'rgba(139,92,246,0.2)' : '#EDE9FE';
  const titleColor = isDark ? '#E9D5FF' : '#1C1C1E';
  const textColor = isDark ? '#C4B5FD' : '#6B7280';
  const iconColor = isDark ? '#C4B5FD' : '#7C3AED';

  if (compact) {
    return (
      <View
        style={[styles.compactContainer, { backgroundColor: bg, borderColor: border }]}
        accessibilityRole="text"
        accessibilityLabel="AI 기술 사용 안내: 이 서비스는 AI 기술을 사용하여 분석 결과를 제공해요."
        testID="ai-transparency-notice-compact"
      >
        <Text style={[styles.compactIcon, { color: iconColor }]} accessibilityElementsHidden>
          ✨
        </Text>
        <Text style={[styles.compactText, { color: textColor }]}>
          이 서비스는 AI 기술을 사용하여 분석 결과를 제공해요.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.fullContainer, { backgroundColor: bg, borderColor: border }]}
      accessibilityRole="text"
      accessibilityLabel="AI 기술 사용 안내: 이룸은 Google Gemini AI 기술을 사용하여 분석 결과를 제공해요. AI 분석 결과는 참고용이며, 정확한 진단이 필요한 경우 전문가 상담을 권장해요."
      testID="ai-transparency-notice"
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Text style={[styles.fullIcon, { color: iconColor }]} accessibilityElementsHidden>
          ✨
        </Text>
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            { color: titleColor, fontWeight: typography.weight.semibold },
          ]}
        >
          AI 기술 사용 안내
        </Text>
        <Text style={[styles.description, { color: textColor }]}>
          이룸은 Google Gemini AI 기술을 사용하여 퍼스널컬러, 피부, 체형 등의 분석 결과를
          제공해요. AI 분석 결과는 참고용이며, 정확한 진단이 필요한 경우 전문가 상담을 권장해요.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.smx,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  compactIcon: {
    fontSize: typography.size.sm,
  },
  compactText: {
    flex: 1,
    fontSize: typography.size.xs,
    lineHeight: typography.size.xs * typography.lineHeight.normal,
  },
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.smx,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullIcon: {
    fontSize: typography.size.xl,
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
