/**
 * 스트레칭 추천
 *
 * 자세 교정을 위한 스트레칭 카드 리스트
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface StretchingItem {
  id: string;
  name: string;
  targetArea: string;
  difficulty: DifficultyLevel;
  duration: string;
  frequency: string;
  description?: string;
}

export interface StretchingRecommendationProps {
  recommendations: StretchingItem[];
  /** 안내 배너 표시 여부 */
  showGuidance?: boolean;
}

const DIFFICULTY_CONFIG: Record<DifficultyLevel, { label: string; colorKey: 'success' | 'warning' | 'error' }> = {
  easy: { label: '쉬움', colorKey: 'success' },
  medium: { label: '보통', colorKey: 'warning' },
  hard: { label: '어려움', colorKey: 'error' },
};

export function StretchingRecommendation({
  recommendations,
  showGuidance = true,
}: StretchingRecommendationProps): React.ReactElement {
  const { colors, status, typography, radii, spacing } = useTheme();

  return (
    <View
      testID="stretching-recommendation"
      accessibilityLabel={`스트레칭 추천 ${recommendations.length}개`}
    >
      {/* 안내 배너 */}
      {showGuidance && (
        <View style={[styles.guidance, { backgroundColor: `${status.info}15`, borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.md }]}>
          <Text style={{ color: status.info, fontSize: typography.size.sm }}>
            🧘 꾸준한 스트레칭이 자세 교정의 핵심입니다
          </Text>
        </View>
      )}

      {/* 스트레칭 카드 리스트 */}
      {recommendations.map((item) => {
        const diffConfig = DIFFICULTY_CONFIG[item.difficulty];
        const diffColor = status[diffConfig.colorKey];

        return (
          <View
            key={item.id}
            style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.lg, borderColor: colors.border, marginBottom: spacing.sm }]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.name, { color: colors.foreground, fontSize: typography.size.base }]}>
                {item.name}
              </Text>
              <View style={[styles.diffBadge, { backgroundColor: `${diffColor}20`, borderRadius: radii.full }]}>
                <Text style={{ color: diffColor, fontSize: typography.size.xs, fontWeight: '600' }}>
                  {diffConfig.label}
                </Text>
              </View>
            </View>

            <View style={[styles.targetBadge, { backgroundColor: colors.secondary, borderRadius: radii.sm, alignSelf: 'flex-start', marginBottom: 8 }]}>
              <Text style={{ color: colors.secondaryForeground, fontSize: typography.size.xs }}>
                {item.targetArea}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
                ⏱️ {item.duration}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
                📅 {item.frequency}
              </Text>
            </View>

            {item.description && (
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs, lineHeight: 18, marginTop: 6 }}>
                {item.description}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  guidance: {},
  card: { borderWidth: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontWeight: '600', flex: 1 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3 },
  targetBadge: { paddingHorizontal: 8, paddingVertical: 3 },
  metaRow: { flexDirection: 'row', gap: 16 },
});
