/**
 * 잇몸 건강 인디케이터
 *
 * 잇몸 건강 상태, 염증 지수, 영향 부위 표시
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

export type GumHealthStatus =
  | 'healthy'
  | 'mild_gingivitis'
  | 'moderate_gingivitis'
  | 'severe_inflammation';

export interface AffectedArea {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface GumHealthResult {
  status: GumHealthStatus;
  inflammationScore: number;
  affectedAreas?: AffectedArea[];
  recommendations?: string[];
  needsDentalVisit?: boolean;
}

export interface GumHealthIndicatorProps {
  result: GumHealthResult;
  compact?: boolean;
}

const STATUS_CONFIG: Record<GumHealthStatus, { label: string; emoji: string; colorKey: 'success' | 'warning' | 'error' }> = {
  healthy: { label: '건강', emoji: '✅', colorKey: 'success' },
  mild_gingivitis: { label: '경미한 치은염', emoji: '⚠️', colorKey: 'warning' },
  moderate_gingivitis: { label: '중등도 치은염', emoji: '🟠', colorKey: 'warning' },
  severe_inflammation: { label: '심한 염증', emoji: '🔴', colorKey: 'error' },
};

const SEVERITY_LABELS: Record<string, string> = {
  mild: '경미',
  moderate: '중등',
  severe: '심각',
};

export function GumHealthIndicator({
  result,
  compact = false,
}: GumHealthIndicatorProps): React.ReactElement {
  const { colors, status, typography, radii, spacing } = useTheme();
  const config = STATUS_CONFIG[result.status];
  const statusColor = status[config.colorKey];

  return (
    <View
      testID="gum-health-indicator"
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.lg, borderColor: colors.border }]}
      accessibilityLabel={`잇몸 건강: ${config.label}, 염증 지수 ${result.inflammationScore}`}
    >
      {/* 상태 헤더 */}
      <View style={[styles.statusRow, { padding: spacing.md }]}>
        <Text style={{ fontSize: compact ? typography.size.lg : typography.size['2xl'] }}>
          {config.emoji}
        </Text>
        <View style={styles.statusText}>
          <Text style={[styles.statusLabel, { color: statusColor, fontSize: typography.size.base }]}>
            {config.label}
          </Text>
          {result.needsDentalVisit && (
            <Text style={{ color: status.error, fontSize: typography.size.xs, fontWeight: '500' }}>
              🦷 치과 방문 권장
            </Text>
          )}
        </View>
      </View>

      {/* 염증 지수 바 */}
      <View style={[styles.inflammationSection, { paddingHorizontal: spacing.md }]}>
        <View style={styles.inflammationHeader}>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>염증 지수</Text>
          <Text style={{ color: statusColor, fontSize: typography.size.sm, fontWeight: '700' }}>
            {result.inflammationScore}
          </Text>
        </View>
        <View style={[styles.progressBg, { backgroundColor: colors.secondary, borderRadius: radii.full }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(result.inflammationScore, 100)}%`,
                backgroundColor: statusColor,
                borderRadius: radii.full,
              },
            ]}
          />
        </View>
      </View>

      {/* 컴팩트 모드면 여기서 종료 */}
      {compact && <View style={{ height: spacing.md }} />}

      {/* 영향 부위 */}
      {!compact && result.affectedAreas && result.affectedAreas.length > 0 && (
        <View style={[styles.areasSection, { padding: spacing.md, borderTopColor: colors.border }]}>
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600', marginBottom: 8 }}>
            영향 부위
          </Text>
          <View style={styles.areasList}>
            {result.affectedAreas.map((area, index) => {
              const severityColor = area.severity === 'severe' ? status.error
                : area.severity === 'moderate' ? status.warning
                : colors.mutedForeground;
              return (
                <View key={index} style={[styles.areaBadge, { backgroundColor: `${severityColor}15`, borderRadius: radii.sm }]}>
                  <Text style={{ color: severityColor, fontSize: typography.size.xs, fontWeight: '500' }}>
                    {area.name} ({SEVERITY_LABELS[area.severity] ?? area.severity})
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 추천사항 */}
      {!compact && result.recommendations && result.recommendations.length > 0 && (
        <View style={[styles.recsSection, { padding: spacing.md, borderTopColor: colors.border }]}>
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600', marginBottom: 8 }}>
            추천사항
          </Text>
          {result.recommendations.slice(0, 4).map((rec, index) => (
            <Text key={index} style={{ color: colors.mutedForeground, fontSize: typography.size.xs, lineHeight: 18, marginBottom: 4 }}>
              • {rec}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusText: { flex: 1 },
  statusLabel: { fontWeight: '700' },
  inflammationSection: { marginBottom: 8 },
  inflammationHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressBg: { height: 8 },
  progressFill: { height: 8 },
  areasSection: { borderTopWidth: 1 },
  areasList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  areaBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  recsSection: { borderTopWidth: 1 },
});
