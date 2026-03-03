/**
 * SizeRecommendationCard — 사이즈 추천 카드
 *
 * 브랜드/카테고리별 추천 사이즈와 신뢰도를 표시.
 * 선택적으로 측정값(가슴/허리/엉덩이)을 포함.
 */
import React, { memo } from 'react';
import { Ruler } from 'lucide-react-native';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface SizeMeasurements {
  chest?: number;
  waist?: number;
  hip?: number;
}

export interface SizeRecommendationCardProps {
  brand: string;
  category: string;
  recommendedSize: string;
  /** 신뢰도 (0~100) */
  confidence: number;
  measurements?: SizeMeasurements;
  style?: ViewStyle;
}

// 신뢰도에 따른 라벨과 색상
function getConfidenceInfo(confidence: number): { label: string; color: string } {
  if (confidence >= 90) return { label: '매우 정확', color: '#22C55E' };
  if (confidence >= 70) return { label: '정확', color: '#4ADE80' };
  if (confidence >= 50) return { label: '보통', color: '#F59E0B' };
  return { label: '참고', color: '#EF4444' };
}

const MEASUREMENT_LABELS: { key: keyof SizeMeasurements; label: string }[] = [
  { key: 'chest', label: '가슴' },
  { key: 'waist', label: '허리' },
  { key: 'hip', label: '엉덩이' },
];

export const SizeRecommendationCard = memo(function SizeRecommendationCard({
  brand,
  category,
  recommendedSize,
  confidence,
  measurements,
  style,
}: SizeRecommendationCardProps): React.JSX.Element {
  const { colors, spacing, radii, typography, shadows, module: moduleColors } = useTheme();

  const confInfo = getConfidenceInfo(confidence);
  const hasMeasurements =
    measurements && (measurements.chest || measurements.waist || measurements.hip);

  return (
    <View
      testID="size-recommendation-card"
      accessibilityLabel={`${brand} ${category} 추천 사이즈 ${recommendedSize}, 신뢰도 ${confidence}%`}
      style={[
        styles.container,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderColor: colors.border,
          padding: spacing.md,
        },
        style,
      ]}
    >
      {/* 헤더: 아이콘 + 브랜드/카테고리 */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: moduleColors.body.light + '30' },
          ]}
        >
          <Ruler size={18} color={moduleColors.body.dark} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
            numberOfLines={1}
          >
            {brand}
          </Text>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
              marginTop: spacing.xxs,
            }}
          >
            {category}
          </Text>
        </View>
      </View>

      {/* 추천 사이즈 + 신뢰도 */}
      <View
        style={[
          styles.sizeBox,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.xl,
            padding: spacing.md,
            marginTop: spacing.md,
          },
        ]}
      >
        <View style={styles.sizeRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
              }}
            >
              추천 사이즈
            </Text>
            <Text
              style={{
                fontSize: typography.size['2xl'],
                fontWeight: typography.weight.bold,
                color: colors.foreground,
                marginTop: spacing.xxs,
              }}
            >
              {recommendedSize}
            </Text>
          </View>

          {/* 신뢰도 뱃지 */}
          <View style={{ alignItems: 'flex-end' }}>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
              }}
            >
              신뢰도
            </Text>
            <View
              style={[
                styles.confidenceBadge,
                {
                  backgroundColor: confInfo.color + '18',
                  borderRadius: radii.sm,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xxs,
                  marginTop: spacing.xxs,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.bold,
                  color: confInfo.color,
                }}
              >
                {confidence}%
              </Text>
            </View>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: confInfo.color,
                marginTop: spacing.xxs,
              }}
            >
              {confInfo.label}
            </Text>
          </View>
        </View>
      </View>

      {/* 측정값 (선택) */}
      {hasMeasurements && (
        <View style={{ marginTop: spacing.md }}>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
              marginBottom: spacing.sm,
            }}
          >
            기반 측정값
          </Text>
          <View style={[styles.measurementRow, { gap: spacing.sm }]}>
            {MEASUREMENT_LABELS.map(({ key, label }) => {
              const value = measurements?.[key];
              if (!value) return null;
              return (
                <View
                  key={key}
                  style={[
                    styles.measurementItem,
                    {
                      backgroundColor: colors.secondary,
                      borderRadius: radii.xl,
                      padding: spacing.sm,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: typography.size.xs,
                      color: colors.mutedForeground,
                    }}
                  >
                    {label}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.size.base,
                      fontWeight: typography.weight.bold,
                      color: colors.foreground,
                      marginTop: spacing.xxs,
                    }}
                  >
                    {value}
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        fontWeight: typography.weight.normal,
                        color: colors.mutedForeground,
                      }}
                    >
                      cm
                    </Text>
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBox: {},
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  confidenceBadge: {},
  measurementRow: {
    flexDirection: 'row',
  },
  measurementItem: {
    flex: 1,
    alignItems: 'center',
  },
});
