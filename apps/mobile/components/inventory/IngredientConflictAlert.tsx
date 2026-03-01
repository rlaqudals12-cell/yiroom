/**
 * IngredientConflictAlert — 성분 충돌 알림
 *
 * 제품 간 성분 충돌 또는 알레르기 경고를 표시.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface ConflictItem {
  ingredient: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

export interface IngredientConflictAlertProps {
  conflicts: ConflictItem[];
  style?: ViewStyle;
}

export function IngredientConflictAlert({
  conflicts,
  style,
}: IngredientConflictAlertProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status } = useTheme();

  const highCount = conflicts.filter((c) => c.severity === 'high').length;

  const severityColor = (severity: ConflictItem['severity']): string => {
    switch (severity) {
      case 'high': return status.error;
      case 'medium': return status.warning;
      case 'low': return status.info;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
          borderLeftWidth: 3,
          borderLeftColor: highCount > 0 ? status.error : status.warning,
        },
        style,
      ]}
      testID="ingredient-conflict-alert"
      accessibilityLabel={`성분 충돌 ${conflicts.length}건${highCount > 0 ? `, 위험 ${highCount}건` : ''}`}
      accessibilityRole="alert"
    >
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size.base }}>⚠️</Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginLeft: spacing.xs,
          }}
        >
          성분 주의
        </Text>
      </View>

      {conflicts.map((conflict, i) => (
        <View
          key={i}
          style={[styles.conflictRow, { marginTop: spacing.sm }]}
        >
          <View
            style={[
              styles.severityDot,
              { backgroundColor: severityColor(conflict.severity), borderRadius: radii.full },
            ]}
          />
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.medium,
                color: colors.foreground,
              }}
            >
              {conflict.ingredient}
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginTop: spacing.xxs,
              }}
            >
              {conflict.reason}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conflictRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  severityDot: {
    width: 8,
    height: 8,
    marginTop: 6,
  },
});
