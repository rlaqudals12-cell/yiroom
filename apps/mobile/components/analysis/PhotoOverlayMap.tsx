/**
 * 사진 오버레이 맵
 *
 * 실제 분석 사진 위에 존 상태를 오버레이
 */

import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useTheme, statusColors, radii, spacing} from '../../lib/theme';

export type OverlayZoneId = 'forehead' | 'tZone' | 'eyes' | 'cheeks' | 'uZone' | 'chin';

export interface OverlayZoneStatus {
  score: number;
  status: 'good' | 'normal' | 'warning';
  label: string;
  concern?: string;
}

export interface PhotoOverlayMapProps {
  imageUrl: string;
  zones: Partial<Record<OverlayZoneId, OverlayZoneStatus>>;
  onZonePress?: (zoneId: OverlayZoneId) => void;
  showLabels?: boolean;
  /** 오버레이 투명도 0-1 (기본 0.4) */
  opacity?: number;
}

const ZONE_COLORS: Record<'good' | 'normal' | 'warning', string> = {
  good: statusColors.success,
  normal: statusColors.warning,
  warning: statusColors.error,
};

// 존 위치 (비율)
const ZONE_LAYOUT: Record<OverlayZoneId, { x: number; y: number; w: number; h: number }> = {
  forehead: { x: 0.2, y: 0.05, w: 0.6, h: 0.15 },
  tZone: { x: 0.35, y: 0.2, w: 0.3, h: 0.35 },
  eyes: { x: 0.15, y: 0.25, w: 0.7, h: 0.1 },
  cheeks: { x: 0.1, y: 0.4, w: 0.8, h: 0.2 },
  uZone: { x: 0.15, y: 0.6, w: 0.7, h: 0.15 },
  chin: { x: 0.3, y: 0.75, w: 0.4, h: 0.15 },
};

export function PhotoOverlayMap({
  imageUrl,
  zones,
  onZonePress,
  showLabels = true,
  opacity = 0.4,
}: PhotoOverlayMapProps): React.ReactElement {
  const { colors, typography } = useTheme();

  return (
    <View
      style={[styles.container, { borderColor: colors.border }]}
      testID="photo-overlay-map"
      accessibilityLabel="사진 위 존 분석 오버레이"
    >
      {/* 배경 이미지 */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel="분석 사진"
      />

      {/* 존 오버레이 */}
      {(Object.entries(ZONE_LAYOUT) as Array<[OverlayZoneId, typeof ZONE_LAYOUT[OverlayZoneId]]>).map(
        ([zoneId, layout]) => {
          const zoneData = zones[zoneId];
          if (!zoneData) return null;

          const zoneColor = ZONE_COLORS[zoneData.status];

          return (
            <Pressable
              key={zoneId}
              style={[
                styles.zoneOverlay,
                {
                  left: `${layout.x * 100}%`,
                  top: `${layout.y * 100}%`,
                  width: `${layout.w * 100}%`,
                  height: `${layout.h * 100}%`,
                  backgroundColor: `${zoneColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                  borderColor: zoneColor,
                },
              ]}
              onPress={() => onZonePress?.(zoneId)}
              accessibilityRole="button"
              accessibilityLabel={`${zoneData.label}: ${zoneData.score}점`}
            >
              {showLabels && (
                <View style={[styles.labelBadge, { backgroundColor: `${zoneColor}CC` }]}>
                  <Text style={[styles.labelText, { fontSize: typography.size.xs, color: colors.overlayForeground }]}>
                    {zoneData.label} {zoneData.score}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        },
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    aspectRatio: 3 / 4,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  zoneOverlay: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBadge: {
    paddingHorizontal: 6,
    paddingVertical: spacing.xxs,
    borderRadius: 4,
  },
  labelText: {
    fontWeight: '600',
  },
});
