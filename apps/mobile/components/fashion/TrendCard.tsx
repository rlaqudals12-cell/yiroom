/**
 * TrendCard — 패션 트렌드 카드
 *
 * 패션 트렌드 정보를 이미지, 태그, 인기도 지표와 함께 표시.
 * 인기도(0~100)를 프로그레스 바로 시각화.
 */
import React, { memo } from 'react';
import { Image } from 'expo-image';
import { TrendingUp } from 'lucide-react-native';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface TrendCardProps {
  id: string;
  title: string;
  imageUri?: string;
  description: string;
  tags: string[];
  /** 인기도 (0~100) */
  popularity: number;
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

// 인기도에 따른 라벨과 색상 결정
function getPopularityInfo(popularity: number): { label: string; color: string } {
  if (popularity >= 80) return { label: '인기 급상승', color: '#EF4444' };
  if (popularity >= 60) return { label: '인기', color: '#F59E0B' };
  if (popularity >= 40) return { label: '주목', color: '#22C55E' };
  return { label: '새로운', color: '#3B82F6' };
}

export const TrendCard = memo(function TrendCard({
  id,
  title,
  imageUri,
  description,
  tags,
  popularity,
  onPress,
  style,
}: TrendCardProps): React.JSX.Element {
  const { colors, spacing, radii, typography, shadows, module: moduleColors } = useTheme();

  const popInfo = getPopularityInfo(popularity);
  // 인기도 바 너비 비율 (0~100)
  const clampedPopularity = Math.max(0, Math.min(100, popularity));

  return (
    <Pressable
      testID="trend-card"
      accessibilityLabel={`패션 트렌드: ${title}, 인기도 ${popularity}%`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
      onPress={() => onPress?.(id)}
      disabled={!onPress}
    >
      {/* 이미지 */}
      <View
        style={[
          styles.imageContainer,
          {
            backgroundColor: colors.secondary,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
          },
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            accessibilityLabel={`${title} 트렌드 이미지`}
          />
        ) : (
          <Text style={{ fontSize: 40 }} accessibilityLabel="트렌드 기본 아이콘">
            ✨
          </Text>
        )}

        {/* 인기도 뱃지 — 이미지 위에 겹침 */}
        <View
          style={[
            styles.popularityBadge,
            {
              backgroundColor: popInfo.color + 'E6',
              borderRadius: radii.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xxs,
            },
          ]}
        >
          <TrendingUp size={12} color="#FFFFFF" />
          <Text
            style={{
              fontSize: typography.size.xs,
              fontWeight: typography.weight.bold,
              color: '#FFFFFF',
              marginLeft: spacing.xxs,
            }}
          >
            {popInfo.label}
          </Text>
        </View>
      </View>

      {/* 콘텐츠 */}
      <View style={{ padding: spacing.md }}>
        {/* 제목 */}
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
          numberOfLines={2}
        >
          {title}
        </Text>

        {/* 설명 */}
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            marginTop: spacing.xs,
            lineHeight: typography.size.sm * typography.lineHeight.normal,
          }}
          numberOfLines={3}
        >
          {description}
        </Text>

        {/* 태그 */}
        {tags.length > 0 && (
          <View style={[styles.tagRow, { marginTop: spacing.sm, gap: spacing.xs }]}>
            {tags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  {
                    backgroundColor: colors.secondary,
                    borderRadius: radii.full,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xxs,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    color: colors.mutedForeground,
                  }}
                >
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 인기도 바 */}
        <View style={{ marginTop: spacing.sm }}>
          <View style={styles.popularityLabelRow}>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
              }}
            >
              인기도
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.bold,
                color: popInfo.color,
              }}
            >
              {popularity}%
            </Text>
          </View>
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.full,
                marginTop: spacing.xxs,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: popInfo.color,
                  borderRadius: radii.full,
                  width: `${clampedPopularity}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  popularityBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {},
  popularityLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});
