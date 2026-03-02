/**
 * 상세 얼굴 존 맵 (12존)
 *
 * 기본 FaceZoneMap(6존)의 확장 버전
 * SVG 기반 12존 시각화
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Ellipse, Rect } from 'react-native-svg';
import { useTheme, zoneColors } from '../../lib/theme';

export type DetailedZoneId =
  | 'forehead_center' | 'forehead_left' | 'forehead_right'
  | 'eye_left' | 'eye_right'
  | 'cheek_left' | 'cheek_right'
  | 'nose_bridge' | 'nose_tip'
  | 'chin_center' | 'chin_left' | 'chin_right';

export type DetailedStatusLevel = 'excellent' | 'good' | 'normal' | 'warning' | 'critical';

export interface DetailedZoneStatus {
  score: number;
  status: DetailedStatusLevel;
  concerns?: string[];
}

export interface DetailedFaceZoneMapProps {
  zones: Partial<Record<DetailedZoneId, DetailedZoneStatus>>;
  /** simple(6존) / detailed(12존) */
  viewMode?: 'simple' | 'detailed';
  showLabels?: boolean;
  showScores?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onZonePress?: (zoneId: DetailedZoneId) => void;
}

const SIZE_MAP = {
  sm: { width: 140, height: 196 },
  md: { width: 200, height: 280 },
  lg: { width: 280, height: 392 },
};

const STATUS_COLORS: Record<DetailedStatusLevel, string> = zoneColors;

const LEGEND_ITEMS: Array<{ status: DetailedStatusLevel; label: string }> = [
  { status: 'excellent', label: '매우 좋음' },
  { status: 'good', label: '좋음' },
  { status: 'normal', label: '보통' },
  { status: 'warning', label: '주의' },
  { status: 'critical', label: '관리 필요' },
];

// 12존 위치 (비율 기반)
const ZONE_POSITIONS: Record<DetailedZoneId, { x: number; y: number; label: string }> = {
  forehead_center: { x: 0.5, y: 0.15, label: '이마 중앙' },
  forehead_left: { x: 0.3, y: 0.18, label: '이마 좌' },
  forehead_right: { x: 0.7, y: 0.18, label: '이마 우' },
  eye_left: { x: 0.32, y: 0.35, label: '왼쪽 눈' },
  eye_right: { x: 0.68, y: 0.35, label: '오른쪽 눈' },
  nose_bridge: { x: 0.5, y: 0.4, label: '콧등' },
  nose_tip: { x: 0.5, y: 0.52, label: '코끝' },
  cheek_left: { x: 0.25, y: 0.55, label: '왼쪽 볼' },
  cheek_right: { x: 0.75, y: 0.55, label: '오른쪽 볼' },
  chin_left: { x: 0.35, y: 0.78, label: '턱 좌' },
  chin_center: { x: 0.5, y: 0.82, label: '턱 중앙' },
  chin_right: { x: 0.65, y: 0.78, label: '턱 우' },
};

export function DetailedFaceZoneMap({
  zones,
  viewMode = 'detailed',
  showLabels = false,
  showScores = true,
  size = 'md',
  onZonePress,
}: DetailedFaceZoneMapProps): React.ReactElement {
  const { colors, status, typography } = useTheme();
  const dimensions = SIZE_MAP[size];
  const dotSize = size === 'sm' ? 16 : size === 'md' ? 22 : 28;

  const handleZonePress = useCallback(
    (zoneId: DetailedZoneId) => {
      onZonePress?.(zoneId);
    },
    [onZonePress],
  );

  const zoneEntries = Object.entries(ZONE_POSITIONS) as Array<[DetailedZoneId, typeof ZONE_POSITIONS[DetailedZoneId]]>;

  return (
    <View testID="detailed-face-zone-map">
      {/* SVG 얼굴 맵 */}
      <View style={[styles.mapContainer, { width: dimensions.width, height: dimensions.height }]}>
        <Svg width={dimensions.width} height={dimensions.height}>
          {/* 얼굴 윤곽 */}
          <Ellipse
            cx={dimensions.width / 2}
            cy={dimensions.height * 0.45}
            rx={dimensions.width * 0.42}
            ry={dimensions.height * 0.42}
            fill={`${colors.muted}50`}
            stroke={colors.border}
            strokeWidth={1}
          />
        </Svg>

        {/* 존 도트 오버레이 */}
        {zoneEntries.map(([zoneId, pos]) => {
          const zoneData = zones[zoneId];
          const zoneColor = zoneData
            ? STATUS_COLORS[zoneData.status]
            : colors.muted;
          const x = pos.x * dimensions.width - dotSize / 2;
          const y = pos.y * dimensions.height - dotSize / 2;

          return (
            <Pressable
              key={zoneId}
              style={[
                styles.zoneDot,
                {
                  left: x,
                  top: y,
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: `${zoneColor}40`,
                  borderColor: zoneColor,
                },
              ]}
              onPress={() => handleZonePress(zoneId)}
              accessibilityRole="button"
              accessibilityLabel={`${pos.label}: ${zoneData ? `${zoneData.score}점` : '데이터 없음'}`}
              hitSlop={8}
            >
              {showScores && zoneData && (
                <Text style={[styles.zoneScore, { color: zoneColor, fontSize: size === 'sm' ? 7 : 9 }]}>
                  {zoneData.score}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* 범례 */}
      <View style={styles.legend}>
        {LEGEND_ITEMS.map((item) => (
          <View key={item.status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
            <Text style={[styles.legendLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    alignSelf: 'center',
    position: 'relative',
  },
  zoneDot: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneScore: {
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendLabel: {},
});
