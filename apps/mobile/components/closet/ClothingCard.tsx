/**
 * ClothingCard — 옷장 아이템 카드 (착용 추적 포함)
 *
 * 의류 아이템의 이미지, 카테고리, 색상, 마지막 착용일, 착용 횟수를 표시.
 * inventory/ClothingCard와 달리 착용 추적(lastWorn, wearCount) 기능 포함.
 */
import React, { memo } from 'react';
import { Image } from 'expo-image';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export type ClosetCategory = 'top' | 'bottom' | 'outer' | 'dress' | 'shoes' | 'accessory';

export interface ClosetClothingCardProps {
  id: string;
  name: string;
  category: ClosetCategory;
  color: string;
  imageUri?: string;
  /** ISO 날짜 문자열 (예: '2026-02-28') */
  lastWorn?: string;
  wearCount: number;
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

const CATEGORY_EMOJI: Record<ClosetCategory, string> = {
  top: '👕',
  bottom: '👖',
  outer: '🧥',
  dress: '👗',
  shoes: '👟',
  accessory: '💍',
};

const CATEGORY_LABEL: Record<ClosetCategory, string> = {
  top: '상의',
  bottom: '하의',
  outer: '아우터',
  dress: '원피스',
  shoes: '신발',
  accessory: '악세서리',
};

// 마지막 착용일로부터 경과일 계산
function getDaysAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return `${Math.floor(diffDays / 30)}개월 전`;
}

export const ClosetClothingCard = memo(function ClosetClothingCard({
  id,
  name,
  category,
  color,
  imageUri,
  lastWorn,
  wearCount,
  onPress,
  style,
}: ClosetClothingCardProps): React.JSX.Element {
  const { colors, spacing, radii, typography, shadows, module: moduleColors } = useTheme();

  const categoryLabel = CATEGORY_LABEL[category];
  const lastWornText = lastWorn ? getDaysAgo(lastWorn) : '미착용';

  return (
    <Pressable
      testID="closet-clothing-card"
      accessibilityLabel={`${name}, ${categoryLabel}, ${color}, 착용 ${wearCount}회${lastWorn ? `, 마지막 착용 ${lastWornText}` : ''}`}
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
      {/* 이미지 / 플레이스홀더 */}
      <View
        style={[
          styles.imageBox,
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
            accessibilityLabel={`${name} 이미지`}
          />
        ) : (
          <Text style={{ fontSize: 32 }}>
            {CATEGORY_EMOJI[category]}
          </Text>
        )}

        {/* 착용 횟수 뱃지 */}
        <View
          style={[
            styles.wearBadge,
            {
              backgroundColor: moduleColors.personalColor.base + 'E6',
              borderRadius: radii.sm,
              paddingHorizontal: spacing.xs,
              paddingVertical: spacing.xxs,
            },
          ]}
        >
          <Text
            style={{
              fontSize: typography.size.xs,
              fontWeight: typography.weight.bold,
              color: '#FFFFFF',
            }}
          >
            {wearCount}회
          </Text>
        </View>
      </View>

      {/* 정보 영역 */}
      <View style={{ padding: spacing.sm }}>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>

        <View style={[styles.metaRow, { marginTop: spacing.xxs }]}>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
            }}
          >
            {categoryLabel}
          </Text>
          <View
            style={[
              styles.colorDot,
              {
                backgroundColor: colors.border,
                marginHorizontal: spacing.xs,
              },
            ]}
          />
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {color}
          </Text>
        </View>

        {/* 마지막 착용 */}
        <Text
          style={{
            fontSize: typography.size.xs,
            color: lastWorn ? colors.mutedForeground : moduleColors.personalColor.dark,
            marginTop: spacing.xs,
          }}
        >
          {lastWorn ? `마지막 착용: ${lastWornText}` : '아직 착용하지 않았어요'}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  wearBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 3,
    height: 3,
    borderRadius: radii.full,
  },
});
