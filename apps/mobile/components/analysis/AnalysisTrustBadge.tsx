/**
 * 분석 신뢰도 배지 컴포넌트
 *
 * AI 분석 또는 fallback 모드를 표시하는 배지
 */
import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme, typography} from '@/lib/theme';

export type TrustBadgeType = 'ai' | 'fallback' | 'questionnaire';

export interface AnalysisTrustBadgeProps {
  /** 배지 타입 */
  type: TrustBadgeType;
  /** AI 신뢰도 (0-1), AI 타입일 때만 사용 */
  confidence?: number;
  /** 커스텀 라벨 */
  label?: string;
  /** 테스트 ID */
  testID?: string;
}

const DEFAULT_LABELS: Record<TrustBadgeType, string> = {
  ai: 'AI 분석 완료',
  fallback: '기본 분석 결과',
  questionnaire: '문진 기반 분석',
};

export function AnalysisTrustBadge({
  type,
  confidence,
  label,
  testID = 'analysis-trust-badge',
}: AnalysisTrustBadgeProps) {
  const { status, isDark, typography } = useTheme();

  // AI 타입이고 confidence가 있으면 퍼센트 표시
  const displayLabel =
    label ||
    (type === 'ai' && confidence !== undefined
      ? `AI 분석 ${Math.round(confidence * 100)}%`
      : DEFAULT_LABELS[type]);

  // AI → 성공(초록), fallback/questionnaire → 경고(주황)
  const badgeColors = useMemo(() => {
    if (type === 'ai') {
      return {
        bg: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.12)',
        text: isDark ? '#4ADE80' : '#16A34A',
      };
    }
    return {
      bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
      text: isDark ? '#FBBF24' : '#D97706',
    };
  }, [type, isDark]);

  return (
    <View
      style={[styles.badge, { backgroundColor: badgeColors.bg }]}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={displayLabel}
    >
      <Text style={[styles.badgeText, { color: badgeColors.text }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: typography.weight.medium,
  },
});
