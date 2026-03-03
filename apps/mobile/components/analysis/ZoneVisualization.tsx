/**
 * 존 시각화 래퍼
 *
 * FaceZoneMap + ZoneDetailCard를 결합한 상위 레벨 컴포넌트
 * 존 선택 → 상세 패널 연동
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, spacing, statusColors } from '../../lib/theme';

export type ZoneId = 'forehead' | 'tZone' | 'eyes' | 'cheeks' | 'uZone' | 'chin';

export type ZoneStatusLevel = 'good' | 'normal' | 'warning';

export interface ZoneData {
  score: number;
  status: ZoneStatusLevel;
  label: string;
  concerns?: string[];
  recommendations?: string[];
  metrics?: Array<{ name: string; value: number }>;
}

export interface ZoneVisualizationProps {
  zones: Partial<Record<ZoneId, ZoneData>>;
  /** 전체 활력도 점수 */
  vitalityScore?: number;
  /** T존/U존 차이 */
  tUZoneDiff?: number;
  /** 주요 피부 고민 */
  primaryConcerns?: string[];
  /** 존 터치 시 콜백 */
  onZonePress?: (zoneId: ZoneId) => void;
}

const STATUS_COLORS: Record<ZoneStatusLevel, string> = {
  good: statusColors.success,
  normal: statusColors.warning,
  warning: statusColors.error,
};

const ZONE_LABELS: Record<ZoneId, string> = {
  forehead: '이마',
  tZone: 'T존',
  eyes: '눈가',
  cheeks: '볼',
  uZone: 'U존',
  chin: '턱',
};

export function ZoneVisualization({
  zones,
  vitalityScore,
  tUZoneDiff,
  primaryConcerns = [],
  onZonePress,
}: ZoneVisualizationProps): React.ReactElement {
  const { colors, module, status, typography, radii, spacing } = useTheme();
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);

  const handleZoneSelect = useCallback(
    (zoneId: ZoneId) => {
      setSelectedZone((prev) => (prev === zoneId ? null : zoneId));
      onZonePress?.(zoneId);
    },
    [onZonePress],
  );

  const selectedData = selectedZone ? zones[selectedZone] : null;

  return (
    <View
      testID="zone-visualization"
      accessibilityLabel={`피부 존 시각화, ${Object.keys(zones).length}개 존`}
    >
      {/* 전체 요약 */}
      {(vitalityScore !== undefined || tUZoneDiff !== undefined) && (
        <View style={[styles.summaryRow, { marginBottom: spacing.md }]}>
          {vitalityScore !== undefined && (
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderRadius: radii.xl, borderColor: colors.border }]}>
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>피부 활력도</Text>
              <Text style={{ color: module.skin.base, fontSize: typography.size.xl, fontWeight: '700' }}>
                {vitalityScore}
              </Text>
            </View>
          )}
          {tUZoneDiff !== undefined && (
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderRadius: radii.xl, borderColor: colors.border }]}>
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>T-U존 차이</Text>
              <Text style={{ color: colors.foreground, fontSize: typography.size.xl, fontWeight: '700' }}>
                {tUZoneDiff}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 존 그리드 */}
      <View style={styles.zoneGrid}>
        {(Object.entries(zones) as Array<[ZoneId, ZoneData]>).map(([zoneId, data]) => {
          const isSelected = selectedZone === zoneId;
          const statusColor = STATUS_COLORS[data.status];

          return (
            <View
              key={zoneId}
              style={[
                styles.zoneItem,
                {
                  backgroundColor: isSelected ? `${statusColor}20` : colors.card,
                  borderRadius: radii.xl,
                  borderColor: isSelected ? statusColor : colors.border,
                },
              ]}
            >
              <View
                style={styles.zoneItemContent}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${data.label}: ${data.score}점, ${data.status}`}
              >
                <View
                  style={[styles.zonePressable]}
                  onTouchEnd={() => handleZoneSelect(zoneId)}
                >
                  <View style={[styles.zoneDot, { backgroundColor: statusColor }]} />
                  <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600' }}>
                    {data.label}
                  </Text>
                  <Text style={{ color: statusColor, fontSize: typography.size.lg, fontWeight: '700' }}>
                    {data.score}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* 선택된 존 상세 */}
      {selectedZone && selectedData && (
        <View style={[styles.detailPanel, { backgroundColor: colors.card, borderRadius: radii.xl, borderColor: colors.border, marginTop: spacing.md, padding: spacing.md }]}>
          <View style={styles.detailHeader}>
            <Text style={{ color: colors.foreground, fontSize: typography.size.base, fontWeight: '700' }}>
              {selectedData.label} 상세
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[selectedData.status]}20`, borderRadius: radii.full }]}>
              <Text style={{ color: STATUS_COLORS[selectedData.status], fontSize: typography.size.xs, fontWeight: '600' }}>
                {selectedData.score}점
              </Text>
            </View>
          </View>

          {/* 메트릭 */}
          {selectedData.metrics && selectedData.metrics.length > 0 && (
            <View style={[styles.metricsSection, { marginTop: spacing.sm }]}>
              {selectedData.metrics.map((metric, index) => (
                <View key={index} style={styles.metricRow}>
                  <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs, flex: 1 }}>
                    {metric.name}
                  </Text>
                  <View style={[styles.metricBar, { backgroundColor: colors.secondary, borderRadius: radii.full }]}>
                    <View
                      style={[styles.metricFill, { width: `${metric.value}%`, backgroundColor: module.skin.base, borderRadius: radii.full }]}
                    />
                  </View>
                  <Text style={{ color: colors.foreground, fontSize: typography.size.xs, fontWeight: '600', width: 30, textAlign: 'right' }}>
                    {metric.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* 고민 */}
          {selectedData.concerns && selectedData.concerns.length > 0 && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs, marginBottom: spacing.xs }}>고민</Text>
              <View style={styles.tagRow}>
                {selectedData.concerns.map((concern, i) => (
                  <View key={i} style={[styles.tag, { backgroundColor: `${status.warning}15`, borderRadius: radii.sm }]}>
                    <Text style={{ color: status.warning, fontSize: typography.size.xs }}>{concern}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 추천 */}
          {selectedData.recommendations && selectedData.recommendations.length > 0 && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs, marginBottom: spacing.xs }}>추천</Text>
              {selectedData.recommendations.slice(0, 3).map((rec, i) => (
                <Text key={i} style={{ color: colors.foreground, fontSize: typography.size.xs, lineHeight: 18 }}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 주요 고민 */}
      {primaryConcerns.length > 0 && (
        <View style={[styles.concernsSection, { marginTop: spacing.md }]}>
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600', marginBottom: 6 }}>
            주요 피부 고민
          </Text>
          <View style={styles.tagRow}>
            {primaryConcerns.map((concern, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: colors.secondary, borderRadius: radii.sm }]}>
                <Text style={{ color: colors.secondaryForeground, fontSize: typography.size.xs }}>{concern}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: spacing.smd },
  summaryCard: { flex: 1, alignItems: 'center', padding: spacing.smx, borderWidth: 1 },
  zoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  zoneItem: { width: '31%', borderWidth: 1, padding: spacing.smd, alignItems: 'center' },
  zoneItemContent: { alignItems: 'center' },
  zonePressable: { alignItems: 'center', gap: spacing.xs },
  zoneDot: { width: 8, height: 8, borderRadius: 4 },
  detailPanel: { borderWidth: 1 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3 },
  metricsSection: {},
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  metricBar: { flex: 1, height: 6 },
  metricFill: { height: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 3 },
  concernsSection: {},
});
