/**
 * FaceZoneMap — 피부 분석 6-zone 히트맵
 *
 * SVG viewBox 기반 얼굴 영역 시각화.
 * 점수 기반 fill 색상 (초록/노랑/주황/빨강).
 * zone 터치 시 콜백.
 */
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { TIMING } from '../../lib/animations';
import { useTheme, spacing, radii, typography, scoreColors } from '../../lib/theme';

export interface FaceZone {
  /** zone 식별자 */
  id: 'forehead' | 'tzone' | 'leftCheek' | 'rightCheek' | 'nose' | 'chin';
  /** 한국어 라벨 */
  label: string;
  /** 점수 0–100 */
  score: number;
  /** 상세 설명 (선택) */
  description?: string;
}

interface FaceZoneMapProps {
  zones: FaceZone[];
  /** zone 터치 콜백 */
  onZonePress?: (zone: FaceZone) => void;
  /** SVG 크기 */
  size?: number;
  style?: ViewStyle;
  testID?: string;
}

// 점수 → 색상
function scoreToColor(score: number): string {
  if (score >= 80) return scoreColors.excellent; // 초록
  if (score >= 60) return scoreColors.good; // 노랑
  if (score >= 40) return scoreColors.caution; // 주황
  return scoreColors.poor; // 빨강
}

// 점수 → 한국어 등급
function scoreToGrade(score: number): string {
  if (score >= 80) return '좋음';
  if (score >= 60) return '보통';
  if (score >= 40) return '주의';
  return '관리 필요';
}

// zone별 SVG Path (viewBox 0 0 200 280)
const ZONE_PATHS: Record<FaceZone['id'], { d: string; cx: number; cy: number }> = {
  forehead: {
    d: 'M60 40 Q100 10 140 40 L150 80 Q100 70 50 80 Z',
    cx: 100,
    cy: 55,
  },
  tzone: {
    d: 'M85 80 L115 80 L110 160 Q100 170 90 160 Z',
    cx: 100,
    cy: 120,
  },
  leftCheek: {
    d: 'M30 100 L80 90 L75 170 Q50 185 30 160 Z',
    cx: 55,
    cy: 135,
  },
  rightCheek: {
    d: 'M120 90 L170 100 L170 160 Q150 185 125 170 Z',
    cx: 145,
    cy: 135,
  },
  nose: {
    d: 'M90 120 L110 120 L115 170 Q100 180 85 170 Z',
    cx: 100,
    cy: 150,
  },
  chin: {
    d: 'M70 185 Q100 220 130 185 L125 170 Q100 180 75 170 Z',
    cx: 100,
    cy: 195,
  },
};

const ZONE_LABELS: Record<FaceZone['id'], string> = {
  forehead: '이마',
  tzone: 'T존',
  leftCheek: '볼(L)',
  rightCheek: '볼(R)',
  nose: '코',
  chin: '턱',
};

export function FaceZoneMap({
  zones,
  onZonePress,
  size = 220,
  style,
  testID = 'face-zone-map',
}: FaceZoneMapProps): React.JSX.Element {
  const { colors, spacing, typography, status } = useTheme();
  const [selectedZone, setSelectedZone] = useState<FaceZone | null>(null);

  const zoneMap = new Map(zones.map((z) => [z.id, z]));

  const handleZonePress = useCallback(
    (zoneId: FaceZone['id']) => {
      const zone = zoneMap.get(zoneId);
      if (!zone) return;
      Haptics.selectionAsync();
      setSelectedZone(zone);
      onZonePress?.(zone);
    },
    [zoneMap, onZonePress],
  );

  const scale = size / 200;

  return (
    <View testID={testID} style={[styles.container, style]}>
      <Svg
        width={size}
        height={size * 1.4}
        viewBox="0 0 200 280"
        accessibilityRole="image"
        accessibilityLabel="얼굴 피부 존 맵"
      >
        {/* 얼굴 외곽 */}
        <Path
          d="M100 10 Q20 40 25 140 Q30 220 100 260 Q170 220 175 140 Q180 40 100 10"
          fill="none"
          stroke={colors.border}
          strokeWidth={1.5}
        />

        {/* zone별 영역 */}
        {Object.entries(ZONE_PATHS).map(([id, { d, cx, cy }]) => {
          const zone = zoneMap.get(id as FaceZone['id']);
          const score = zone?.score ?? 50;
          const fillColor = scoreToColor(score);

          return (
            <Path
              key={id}
              d={d}
              fill={fillColor}
              fillOpacity={0.35}
              stroke={selectedZone?.id === id ? colors.foreground : fillColor}
              strokeWidth={selectedZone?.id === id ? 2 : 1}
              onPress={() => handleZonePress(id as FaceZone['id'])}
            />
          );
        })}

        {/* zone 라벨 */}
        {Object.entries(ZONE_PATHS).map(([id, { cx, cy }]) => {
          const zone = zoneMap.get(id as FaceZone['id']);
          return (
            <SvgText
              key={`label-${id}`}
              x={cx}
              y={cy}
              textAnchor="middle"
              fontSize={10 * scale}
              fontWeight="600"
              fill={colors.foreground}
            >
              {zone?.score ?? '–'}
            </SvgText>
          );
        })}
      </Svg>

      {/* 선택된 zone 상세 카드 */}
      {selectedZone && (
        <Animated.View
          entering={FadeInUp.duration(TIMING.fast)}
          style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.detailHeader}>
            <Text style={[styles.detailTitle, { color: colors.foreground }]}>
              {ZONE_LABELS[selectedZone.id]}
            </Text>
            <View style={[styles.scoreBadge, { backgroundColor: scoreToColor(selectedZone.score) + '30' }]}>
              <Text style={[styles.scoreText, { color: scoreToColor(selectedZone.score) }]}>
                {selectedZone.score}점 · {scoreToGrade(selectedZone.score)}
              </Text>
            </View>
          </View>
          {selectedZone.description && (
            <Text style={[styles.detailDesc, { color: colors.mutedForeground }]}>
              {selectedZone.description}
            </Text>
          )}
        </Animated.View>
      )}

      {/* 범례 */}
      <View style={styles.legend}>
        {[
          { color: scoreColors.excellent, label: '좋음' },
          { color: scoreColors.good, label: '보통' },
          { color: scoreColors.caution, label: '주의' },
          { color: scoreColors.poor, label: '관리' },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.smx,
  },
  detailCard: {
    width: '100%',
    padding: 14,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: 6,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  scoreBadge: {
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
    borderRadius: radii.xl,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
  },
});
