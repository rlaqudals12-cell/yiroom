/**
 * 존 상세 카드
 *
 * FaceZoneMap에서 존 터치 시 표시되는 상세 정보 카드
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../lib/theme';

export type ZoneStatus = 'good' | 'normal' | 'warning';

export interface ZoneDetailCardProps {
  zoneId: string;
  zoneName: string;
  score: number;
  status: ZoneStatus;
  /** 발견된 문제점 */
  concerns: string[];
  /** 추천 관리법 */
  recommendations: string[];
  onClose?: () => void;
}

export function ZoneDetailCard({
  zoneId,
  zoneName,
  score,
  status,
  concerns,
  recommendations,
  onClose,
}: ZoneDetailCardProps): React.ReactElement {
  const { colors, status: statusColors, typography } = useTheme();

  const statusConfig = {
    good: { label: '좋음', color: statusColors.success, icon: '✓' },
    normal: { label: '보통', color: statusColors.warning, icon: '○' },
    warning: { label: '주의 필요', color: colors.destructive, icon: '!' },
  }[status];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="zone-detail-card"
      accessibilityLabel={`${zoneName} 영역: ${score}점, ${statusConfig.label}`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={[styles.zoneName, { color: colors.foreground, fontSize: typography.size.lg }]}>
          {zoneName}
        </Text>
        {onClose && (
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="닫기"
            hitSlop={8}
          >
            <Text style={[styles.closeIcon, { color: colors.mutedForeground }]}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* 점수 + 상태 */}
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color: colors.foreground, fontSize: typography.size['2xl'] }]}>
          {score}
        </Text>
        <Text style={[styles.scoreUnit, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
          /100
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}15` }]}>
          <Text style={[styles.statusIcon, { color: statusConfig.color }]}>
            {statusConfig.icon}
          </Text>
          <Text style={[styles.statusLabel, { color: statusConfig.color, fontSize: typography.size.xs }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* 발견된 문제 */}
      {concerns.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontSize: typography.size.sm }]}>
            발견된 문제
          </Text>
          {concerns.map((concern, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={[styles.bulletIcon, { color: statusColors.warning }]}>⚠</Text>
              <Text style={[styles.bulletText, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
                {concern}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 추천 관리법 */}
      {recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontSize: typography.size.sm }]}>
            추천 관리
          </Text>
          {recommendations.map((rec, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={[styles.bulletIcon, { color: statusColors.info }]}>💡</Text>
              <Text style={[styles.bulletText, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
                {rec}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  zoneName: {
    fontWeight: '700',
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  score: {
    fontWeight: '800',
  },
  scoreUnit: {
    marginLeft: 2,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  statusLabel: {
    fontWeight: '600',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletIcon: {
    fontSize: 12,
    marginRight: 6,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
  },
});
