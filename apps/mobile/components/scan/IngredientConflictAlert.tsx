/**
 * IngredientConflictAlert -- 성분 충돌 경고 알림
 *
 * 스캔된 제품의 성분이 사용자의 피부 타입이나 알레르기와
 * 충돌할 때 표시하는 경고 카드. 심각도별 색상 구분.
 */
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii, typography, statusColors } from '../../lib/theme';

export type ConflictSeverity = 'low' | 'medium' | 'high';

export interface IngredientConflict {
  ingredient: string;
  reason: string;
  severity: ConflictSeverity;
}

interface IngredientConflictAlertProps {
  conflicts: IngredientConflict[];
  onDismiss?: () => void;
  style?: ViewStyle;
}

// 심각도별 색상/라벨/아이콘 매핑
const SEVERITY_CONFIG: Record<
  ConflictSeverity,
  { color: string; label: string; icon: string }
> = {
  low: { color: statusColors.info, label: '참고', icon: 'ℹ️' },
  medium: { color: statusColors.warning, label: '주의', icon: '⚠️' },
  high: { color: statusColors.error, label: '위험', icon: '🚨' },
};

export function IngredientConflictAlert({
  conflicts,
  onDismiss,
  style,
}: IngredientConflictAlertProps): React.JSX.Element | null {
  const { colors, shadows } = useTheme();

  if (conflicts.length === 0) return null;

  // 가장 높은 심각도로 전체 알림 색상 결정
  const maxSeverity = conflicts.reduce<ConflictSeverity>(
    (max, c) => {
      const order: ConflictSeverity[] = ['low', 'medium', 'high'];
      return order.indexOf(c.severity) > order.indexOf(max) ? c.severity : max;
    },
    'low'
  );
  const alertConfig = SEVERITY_CONFIG[maxSeverity];

  return (
    <View
      testID="ingredient-conflict-alert"
      style={[
        styles.card,
        shadows.sm,
        {
          backgroundColor: `${alertConfig.color}10`,
          borderColor: `${alertConfig.color}40`,
          borderRadius: radii.xl,
        },
        style,
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`성분 충돌 경고 ${conflicts.length}건`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{alertConfig.icon}</Text>
        <Text
          style={{
            flex: 1,
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: alertConfig.color,
            marginLeft: spacing.sm,
          }}
        >
          내 피부와 맞지 않는 성분이 {conflicts.length}건 발견됐어요
        </Text>

        {onDismiss && (
          <Pressable
            testID="conflict-alert-dismiss"
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.dismissButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="알림 닫기"
          >
            <Text
              style={{
                fontSize: typography.size.lg,
                color: colors.mutedForeground,
              }}
            >
              {'×'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* 충돌 목록 */}
      <View style={[styles.conflictList, { marginTop: spacing.smx }]}>
        {conflicts.map((conflict, index) => {
          const config = SEVERITY_CONFIG[conflict.severity];
          return (
            <View
              key={`${conflict.ingredient}-${index}`}
              style={[
                styles.conflictRow,
                {
                  paddingVertical: spacing.sm,
                  borderTopColor: `${alertConfig.color}20`,
                  borderTopWidth: index > 0 ? 1 : 0,
                },
              ]}
              accessibilityLabel={`${config.label}: ${conflict.ingredient}, ${conflict.reason}`}
            >
              <View style={styles.conflictHeader}>
                {/* 심각도 뱃지 */}
                <View
                  style={[
                    styles.severityBadge,
                    {
                      backgroundColor: `${config.color}20`,
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: typography.size.xs,
                      fontWeight: typography.weight.bold,
                      color: config.color,
                    }}
                  >
                    {config.label}
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.semibold,
                    color: colors.foreground,
                    marginLeft: spacing.sm,
                  }}
                  numberOfLines={1}
                >
                  {conflict.ingredient}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginTop: spacing.xxs,
                  lineHeight: typography.size.xs * typography.lineHeight.normal,
                }}
              >
                {conflict.reason}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
  },
  dismissButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  conflictList: {
    // 정적 리스트 (충돌 수 < 10 예상)
  },
  conflictRow: {
    // 동적 스타일은 인라인
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
});
