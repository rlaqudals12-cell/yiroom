/**
 * StyleRecommendation — AI 스타일 추천 카드
 *
 * AI가 생성한 스타일 추천을 아이템 목록과 매칭률로 표시.
 * 각 아이템에 매칭률 뱃지를 포함하여 추천 근거를 시각화.
 */
import React, { memo } from 'react';
import { Image } from 'expo-image';
import { Sparkles } from 'lucide-react-native';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface StyleItem {
  name: string;
  imageUri?: string;
  matchRate: number;
}

export interface StyleRecommendationProps {
  title: string;
  description: string;
  items: StyleItem[];
  onItemPress?: (item: StyleItem, index: number) => void;
  style?: ViewStyle;
}

export const StyleRecommendation = memo(function StyleRecommendation({
  title,
  description,
  items,
  onItemPress,
  style,
}: StyleRecommendationProps): React.JSX.Element {
  const { colors, spacing, radii, typography, shadows, module: moduleColors, status } = useTheme();

  return (
    <View
      testID="style-recommendation"
      accessibilityLabel={`스타일 추천: ${title}, 아이템 ${items.length}개`}
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
      {/* 헤더 */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: moduleColors.personalColor.light + '30' },
          ]}
        >
          <Sparkles size={18} color={moduleColors.personalColor.dark} />
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
            {title}
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              marginTop: spacing.xxs,
              lineHeight: typography.size.sm * typography.lineHeight.normal,
            }}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>
      </View>

      {/* 아이템 목록 */}
      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {items.map((item, index) => {
          // 매칭률에 따라 뱃지 색상 결정
          const matchColor =
            item.matchRate >= 80
              ? status.success
              : item.matchRate >= 60
                ? status.warning
                : colors.mutedForeground;

          return (
            <Pressable
              key={`${item.name}-${index}`}
              testID={`style-item-${index}`}
              accessibilityLabel={`${item.name}, 매칭률 ${item.matchRate}%`}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.itemCard,
                {
                  backgroundColor: colors.secondary,
                  borderRadius: radii.xl,
                  padding: spacing.sm,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={() => onItemPress?.(item, index)}
              disabled={!onItemPress}
            >
              {/* 아이템 이미지 또는 플레이스홀더 */}
              <View
                style={[
                  styles.itemImage,
                  {
                    backgroundColor: colors.card,
                    borderRadius: radii.xl,
                  },
                ]}
              >
                {item.imageUri ? (
                  <Image
                    source={{ uri: item.imageUri }}
                    style={styles.itemImageInner}
                    contentFit="cover"
                    transition={200}
                    accessibilityLabel={`${item.name} 이미지`}
                  />
                ) : (
                  <Text style={{ fontSize: 24 }}>👔</Text>
                )}
              </View>

              {/* 아이템 정보 */}
              <Text
                style={{
                  flex: 1,
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.medium,
                  color: colors.foreground,
                  marginLeft: spacing.sm,
                }}
                numberOfLines={1}
              >
                {item.name}
              </Text>

              {/* 매칭률 뱃지 */}
              <View
                style={[
                  styles.matchBadge,
                  {
                    backgroundColor: matchColor + '18',
                    borderRadius: radii.sm,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xxs,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.bold,
                    color: matchColor,
                  }}
                >
                  {item.matchRate}%
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemImageInner: {
    width: 44,
    height: 44,
  },
  matchBadge: {},
});
