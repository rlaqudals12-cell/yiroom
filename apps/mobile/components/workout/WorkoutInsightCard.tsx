/**
 * 운동 인사이트 카드
 *
 * AI 기반 운동 분석 인사이트 표시
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

export interface WorkoutInsight {
  id: string;
  title: string;
  description: string;
  category: 'strength' | 'cardio' | 'recovery' | 'nutrition' | 'general';
  priority: 'high' | 'medium' | 'low';
}

export interface WorkoutInsightCardProps {
  insights: WorkoutInsight[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  strength: '💪', cardio: '❤️', recovery: '😴', nutrition: '🍎', general: '💡',
};

const PRIORITY_CONFIG: Record<string, { colorKey: 'error' | 'warning' | 'info' }> = {
  high: { colorKey: 'error' },
  medium: { colorKey: 'warning' },
  low: { colorKey: 'info' },
};

export function WorkoutInsightCard({ insights }: WorkoutInsightCardProps): React.ReactElement {
  const { colors, status, module, typography, radii, spacing } = useTheme();

  return (
    <View testID="workout-insight-card" accessibilityLabel={`운동 인사이트 ${insights.length}개`}>
      <Text style={{ color: colors.foreground, fontSize: typography.size.base, fontWeight: '700', marginBottom: spacing.sm }}>
        운동 인사이트
      </Text>

      {insights.map((insight) => {
        const priorityColor = status[PRIORITY_CONFIG[insight.priority].colorKey];
        return (
          <View key={insight.id} style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.md, borderColor: colors.border, marginBottom: spacing.sm }]}>
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: typography.size.base }}>{CATEGORY_EMOJI[insight.category]}</Text>
              <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600', flex: 1, marginLeft: 8 }}>
                {insight.title}
              </Text>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            </View>
            <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs, lineHeight: 18, marginTop: 6 }}>
              {insight.description}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
});
