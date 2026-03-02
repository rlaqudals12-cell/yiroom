/**
 * OutfitCard — 코디 조합 카드
 *
 * 아이템 목록과 상황/계절 정보를 포함한 코디 조합을 표시.
 * 퍼스널컬러 모듈 색상을 활용하여 패션 도메인을 시각적으로 연결.
 */
import React, { memo } from 'react';
import { Image } from 'expo-image';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface OutfitItem {
  name: string;
  category: string;
}

export interface OutfitCardProps {
  id: string;
  imageUri?: string;
  items: OutfitItem[];
  occasion: string;
  season: string;
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

const SEASON_LABEL: Record<string, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

const SEASON_EMOJI: Record<string, string> = {
  spring: '🌸',
  summer: '☀️',
  autumn: '🍂',
  winter: '❄️',
};

export const OutfitCard = memo(function OutfitCard({
  id,
  imageUri,
  items,
  occasion,
  season,
  onPress,
  style,
}: OutfitCardProps): React.JSX.Element {
  const { colors, spacing, radii, typography, shadows, module: moduleColors } = useTheme();

  const seasonText = SEASON_LABEL[season] ?? season;
  const seasonEmoji = SEASON_EMOJI[season] ?? '👗';

  return (
    <Pressable
      testID="outfit-card"
      accessibilityLabel={`${occasion} 코디, ${seasonText}, 아이템 ${items.length}개`}
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
      {/* 코디 이미지 */}
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
            accessibilityLabel="코디 이미지"
          />
        ) : (
          <Text style={{ fontSize: 40 }} accessibilityLabel="코디 기본 아이콘">
            👗
          </Text>
        )}
      </View>

      {/* 정보 영역 */}
      <View style={{ padding: spacing.md }}>
        {/* 상황 + 계절 태그 */}
        <View style={[styles.tagRow, { gap: spacing.xs }]}>
          <View
            style={[
              styles.tag,
              {
                backgroundColor: moduleColors.personalColor.base + '20',
                borderRadius: radii.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xxs,
              },
            ]}
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: moduleColors.personalColor.dark,
              }}
            >
              {occasion}
            </Text>
          </View>
          <View
            style={[
              styles.tag,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.sm,
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
              {seasonEmoji} {seasonText}
            </Text>
          </View>
        </View>

        {/* 아이템 목록 */}
        <View style={{ marginTop: spacing.sm }}>
          {items.map((item, index) => (
            <View
              key={`${item.name}-${index}`}
              style={[styles.itemRow, { marginTop: index > 0 ? spacing.xxs : 0 }]}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: moduleColors.personalColor.base },
                ]}
              />
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.foreground,
                  marginLeft: spacing.sm,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                }}
              >
                {item.category}
              </Text>
            </View>
          ))}
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
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {},
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
  },
});
