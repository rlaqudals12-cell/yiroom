/**
 * 피부 활력도 점수
 *
 * "피부 나이" 대신 "피부 활력도"로 표현 (정확도 한계 고려)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

export interface SkinVitalityScoreProps {
  /** 0-100 */
  score: number;
  factors: {
    positive: string[];
    negative: string[];
  };
  showDetails?: boolean;
}

interface VitalityLevel {
  label: string;
  color: string;
}

function getVitalityLevel(score: number, statusColors: { success: string; info: string; warning: string }, destructive: string): VitalityLevel {
  if (score >= 80) return { label: '매우 활력 있음', color: statusColors.success };
  if (score >= 60) return { label: '양호함', color: statusColors.info };
  if (score >= 40) return { label: '관리 필요', color: statusColors.warning };
  return { label: '집중 케어 권장', color: destructive };
}

export function SkinVitalityScore({
  score,
  factors,
  showDetails = true,
}: SkinVitalityScoreProps): React.ReactElement {
  const { colors, brand, status, module, typography } = useTheme();

  const level = getVitalityLevel(score, status, colors.destructive);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="skin-vitality-score"
      accessibilityLabel={`피부 활력도 ${score}점: ${level.label}`}
    >
      {/* 그래디언트 헤더 */}
      <View style={[styles.header, { backgroundColor: `${module.skin.base}15` }]}>
        <Text style={[styles.headerLabel, { color: module.skin.base, fontSize: typography.size.sm }]}>
          피부 활력도
        </Text>
        <Text style={[styles.score, { color: colors.foreground, fontSize: typography.size['4xl'] }]}>
          {score}
        </Text>
        <View style={[styles.levelBadge, { backgroundColor: `${level.color}15` }]}>
          <Text style={[styles.levelText, { color: level.color, fontSize: typography.size.xs }]}>
            {level.label}
          </Text>
        </View>
      </View>

      {/* 프로그레스 바 */}
      <View style={styles.progressSection}>
        <View style={[styles.progressTrack, { backgroundColor: `${level.color}20` }]}>
          <View
            style={[styles.progressFill, { width: `${score}%`, backgroundColor: level.color }]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>0</Text>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>100</Text>
        </View>
      </View>

      {/* 상세 요인 */}
      {showDetails && (
        <View style={styles.factorsSection}>
          {/* 강점 */}
          {factors.positive.length > 0 && (
            <View style={styles.factorGroup}>
              {factors.positive.map((factor, i) => (
                <View key={i} style={styles.factorRow}>
                  <Text style={[styles.factorIcon, { color: status.success }]}>▲</Text>
                  <Text style={[styles.factorText, { color: colors.foreground, fontSize: typography.size.sm }]}>
                    {factor}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* 개선점 */}
          {factors.negative.length > 0 && (
            <View style={[styles.factorGroup, styles.negativeGroup]}>
              {factors.negative.map((factor, i) => (
                <View key={i} style={styles.factorRow}>
                  <Text style={[styles.factorIcon, { color: status.warning }]}>▼</Text>
                  <Text style={[styles.factorText, { color: colors.foreground, fontSize: typography.size.sm }]}>
                    {factor}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  score: {
    fontWeight: '800',
    marginBottom: 8,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontWeight: '600',
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabel: {},
  factorsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  factorGroup: {},
  negativeGroup: {
    marginTop: 8,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  factorIcon: {
    fontSize: 10,
    marginRight: 8,
    fontWeight: '700',
  },
  factorText: {},
});
