/**
 * InlineProductCard -- 인라인 제품 추천 카드
 *
 * 채팅 내에서 표시되는 컴팩트한 제품 추천 카드.
 * 매치율 뱃지, 브랜드, 가격, 추천 이유를 표시.
 */
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface InlineProductCardProps {
  name: string;
  brand: string;
  imageUri?: string;
  matchRate: number;
  price?: number;
  reason: string;
  onPress: () => void;
  style?: ViewStyle;
}

/** 가격을 "12,900원" 형식으로 변환 */
function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}

export function InlineProductCard({
  name,
  brand,
  imageUri,
  matchRate,
  price,
  reason,
  onPress,
  style,
}: InlineProductCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status, module } = useTheme();

  // 매치율에 따른 색상
  const matchColor =
    matchRate >= 80
      ? status.success
      : matchRate >= 60
        ? status.warning
        : colors.mutedForeground;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.smx,
          opacity: pressed ? 0.85 : 1,
          ...shadows.sm,
        },
        style,
      ]}
      onPress={onPress}
      testID="inline-product-card"
      accessibilityLabel={`${brand} ${name}, 매칭률 ${matchRate}%${price ? `, 가격 ${formatPrice(price)}` : ''}`}
      accessibilityRole="button"
      accessibilityHint="제품 상세 정보를 확인하려면 탭하세요"
    >
      <View style={styles.row}>
        {/* 제품 이미지 */}
        <View
          style={[
            styles.imageContainer,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.lg,
            },
          ]}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={[styles.image, { borderRadius: radii.lg }]}
              accessibilityLabel={`${name} 제품 이미지`}
            />
          ) : (
            <ShoppingBag size={24} color={colors.mutedForeground} />
          )}
        </View>

        {/* 제품 정보 */}
        <View style={[styles.info, { marginLeft: spacing.smx }]}>
          {/* 브랜드 */}
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
            }}
            numberOfLines={1}
          >
            {brand}
          </Text>

          {/* 제품명 */}
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
              marginTop: spacing.xxs,
            }}
            numberOfLines={2}
          >
            {name}
          </Text>

          {/* 매치율 뱃지 + 가격 */}
          <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
            <View
              style={[
                styles.matchBadge,
                {
                  backgroundColor: matchColor + '18',
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
                  color: matchColor,
                }}
              >
                {matchRate}% 매칭
              </Text>
            </View>
            {price !== undefined && (
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  marginLeft: spacing.sm,
                }}
              >
                {formatPrice(price)}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* 추천 이유 */}
      <View
        style={[
          styles.reasonContainer,
          {
            backgroundColor: module.skin.light + '15',
            borderRadius: radii.md,
            marginTop: spacing.sm,
            padding: spacing.sm,
          },
        ]}
      >
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
            lineHeight: typography.size.xs * typography.lineHeight.normal,
          }}
          numberOfLines={2}
        >
          {reason}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 60,
    height: 60,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchBadge: {},
  reasonContainer: {},
});
