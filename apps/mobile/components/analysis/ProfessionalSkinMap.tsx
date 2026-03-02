/**
 * 전문가용 피부 맵
 *
 * 12존 상세 피부 시각화 (DetailedFaceZoneMap 래핑)
 * 평균 점수, 뷰 모드 전환, 선택 존 상세
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, spacing, zoneColors } from '../../lib/theme';
import type { DetailedZoneId, DetailedStatusLevel, DetailedZoneStatus } from './DetailedFaceZoneMap';

export type ViewMode = 'overview' | 'detailed';

export interface ProfessionalSkinMapProps {
  zones: Partial<Record<DetailedZoneId, DetailedZoneStatus>>;
  /** 뷰 모드 */
  viewMode?: ViewMode;
  /** 선택된 존 */
  selectedZone?: DetailedZoneId | null;
  /** 존 선택 콜백 */
  onZoneSelect?: (zoneId: DetailedZoneId) => void;
}

// 존 한국어 라벨
const ZONE_LABELS: Record<DetailedZoneId, string> = {
  forehead_center: '이마 중앙',
  forehead_left: '이마 좌',
  forehead_right: '이마 우',
  eye_left: '왼쪽 눈',
  eye_right: '오른쪽 눈',
  nose_bridge: '콧등',
  nose_tip: '코끝',
  cheek_left: '왼쪽 볼',
  cheek_right: '오른쪽 볼',
  chin_left: '턱 좌',
  chin_center: '턱 중앙',
  chin_right: '턱 우',
};

const STATUS_LABELS: Record<DetailedStatusLevel, string> = {
  excellent: '매우 좋음',
  good: '좋음',
  normal: '보통',
  warning: '주의',
  critical: '관리 필요',
};

const STATUS_COLORS: Record<DetailedStatusLevel, string> = zoneColors;

export function ProfessionalSkinMap({
  zones,
  viewMode = 'overview',
  selectedZone: externalSelectedZone,
  onZoneSelect,
}: ProfessionalSkinMapProps): React.ReactElement {
  const { colors, module, typography, radii, spacing } = useTheme();
  const [internalSelectedZone, setInternalSelectedZone] = useState<DetailedZoneId | null>(null);

  const selectedZone = externalSelectedZone ?? internalSelectedZone;

  const handleZonePress = useCallback(
    (zoneId: DetailedZoneId) => {
      setInternalSelectedZone((prev) => (prev === zoneId ? null : zoneId));
      onZoneSelect?.(zoneId);
    },
    [onZoneSelect],
  );

  // 평균 점수 계산
  const zoneEntries = Object.entries(zones) as Array<[DetailedZoneId, DetailedZoneStatus]>;
  const avgScore = zoneEntries.length > 0
    ? Math.round(zoneEntries.reduce((sum, [, z]) => sum + z.score, 0) / zoneEntries.length)
    : 0;

  const selectedData = selectedZone ? zones[selectedZone] : null;

  return (
    <View
      testID="professional-skin-map"
      accessibilityLabel={`전문가 피부 맵, 평균 점수 ${avgScore}점, ${zoneEntries.length}개 존`}
    >
      {/* 평균 점수 */}
      <View style={[styles.avgRow, { marginBottom: spacing.md }]}>
        <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm }}>평균 점수</Text>
        <Text style={{ color: module.skin.base, fontSize: typography.size['2xl'], fontWeight: '700' }}>
          {avgScore}점
        </Text>
      </View>

      {/* 존 리스트 (그리드) */}
      <View style={styles.zoneGrid}>
        {zoneEntries.map(([zoneId, data]) => {
          const isSelected = selectedZone === zoneId;
          const statusColor = STATUS_COLORS[data.status];

          return (
            <Pressable
              key={zoneId}
              onPress={() => handleZonePress(zoneId)}
              style={[
                styles.zoneCard,
                {
                  backgroundColor: isSelected ? `${statusColor}20` : colors.card,
                  borderRadius: radii.md,
                  borderColor: isSelected ? statusColor : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${ZONE_LABELS[zoneId]}: ${data.score}점, ${STATUS_LABELS[data.status]}`}
            >
              <View style={[styles.zoneDot, { backgroundColor: statusColor }]} />
              <Text style={{ color: colors.foreground, fontSize: typography.size.xs, fontWeight: '500' }}>
                {ZONE_LABELS[zoneId]}
              </Text>
              <Text style={{ color: statusColor, fontSize: typography.size.base, fontWeight: '700' }}>
                {data.score}
              </Text>
              <Text style={{ color: statusColor, fontSize: 10 }}>
                {STATUS_LABELS[data.status]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 선택된 존 상세 */}
      {selectedZone && selectedData && (
        <View style={[styles.detailPanel, { backgroundColor: colors.card, borderRadius: radii.lg, borderColor: colors.border, marginTop: spacing.md, padding: spacing.md }]}>
          <Text style={{ color: colors.foreground, fontSize: typography.size.base, fontWeight: '700', marginBottom: 8 }}>
            {ZONE_LABELS[selectedZone]} 상세
          </Text>
          <View style={styles.detailRow}>
            <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm }}>점수</Text>
            <Text style={{ color: STATUS_COLORS[selectedData.status], fontSize: typography.size.lg, fontWeight: '700' }}>
              {selectedData.score}점
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm }}>상태</Text>
            <Text style={{ color: STATUS_COLORS[selectedData.status], fontSize: typography.size.sm, fontWeight: '600' }}>
              {STATUS_LABELS[selectedData.status]}
            </Text>
          </View>
          {selectedData.concerns && selectedData.concerns.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs, marginBottom: 4 }}>고민</Text>
              {selectedData.concerns.map((concern, i) => (
                <Text key={i} style={{ color: colors.foreground, fontSize: typography.size.xs, lineHeight: 18 }}>
                  • {concern}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  zoneCard: { width: '31%', borderWidth: 1, padding: spacing.smd, alignItems: 'center', gap: spacing.xxs },
  zoneDot: { width: 8, height: 8, borderRadius: 4, marginBottom: spacing.xxs },
  detailPanel: { borderWidth: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
});
