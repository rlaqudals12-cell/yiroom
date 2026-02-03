/**
 * 분석 신뢰도 배지 컴포넌트
 *
 * AI 분석 또는 fallback 모드를 표시하는 배지
 */
import { View, Text, StyleSheet } from 'react-native';

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

const BADGE_CONFIGS: Record<
  TrustBadgeType,
  { defaultLabel: string; backgroundColor: string; textColor: string }
> = {
  ai: {
    defaultLabel: 'AI 분석 완료',
    backgroundColor: '#e8f5e9',
    textColor: '#2e7d32',
  },
  fallback: {
    defaultLabel: '기본 분석 결과',
    backgroundColor: '#fff3e0',
    textColor: '#ef6c00',
  },
  questionnaire: {
    defaultLabel: '문진 기반 분석',
    backgroundColor: '#fff3e0',
    textColor: '#ef6c00',
  },
};

export function AnalysisTrustBadge({
  type,
  confidence,
  label,
  testID = 'analysis-trust-badge',
}: AnalysisTrustBadgeProps) {
  const config = BADGE_CONFIGS[type];

  // AI 타입이고 confidence가 있으면 퍼센트 표시
  const displayLabel =
    label ||
    (type === 'ai' && confidence !== undefined
      ? `AI 분석 ${Math.round(confidence * 100)}%`
      : config.defaultLabel);

  return (
    <View
      style={[styles.badge, { backgroundColor: config.backgroundColor }]}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={displayLabel}
    >
      <Text style={[styles.badgeText, { color: config.textColor }]}>
        {displayLabel}
      </Text>
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
    fontWeight: '500',
  },
});
