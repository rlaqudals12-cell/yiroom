/**
 * ProductMiniCard — 축약 제품 카드
 *
 * 제품 이미지 + 이름 + 브랜드 + 매치율을 컴팩트하게 표시.
 * 뷰티 피드의 각 아이템으로 사용.
 */
import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme , spacing } from '../../lib/theme';

export interface BeautyProduct {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  matchRate: number;
  rating: number;
  price?: number;
  category: string;
  concerns: string[];
  ingredients?: string[];
}

interface ProductMiniCardProps {
  product: BeautyProduct;
  onPress?: (product: BeautyProduct) => void;
  style?: ViewStyle;
  testID?: string;
}

export function ProductMiniCard({
  product,
  onPress,
  style,
  testID,
}: ProductMiniCardProps): React.JSX.Element {
  const { colors, spacing, radii, typography, brand: brandColors, shadows, status } = useTheme();

  const matchColor =
    product.matchRate >= 80
      ? status.success
      : product.matchRate >= 60
        ? status.warning
        : colors.mutedForeground;

  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          borderColor: colors.border,
          padding: spacing.sm + 2,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
      onPress={() => onPress?.(product)}
      accessibilityLabel={`${product.brand} ${product.name}, 매칭률 ${product.matchRate}%`}
      accessibilityRole="button"
    >
      <View style={styles.row}>
        {/* 이미지 */}
        <View
          style={[
            styles.imageContainer,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.md,
            },
          ]}
        >
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              accessibilityLabel={`${product.name} 제품 이미지`}
            />
          ) : (
            <Text style={{ fontSize: 28 }} accessibilityLabel={`${product.name} 기본 아이콘`}>🧴</Text>
          )}
        </View>

        {/* 정보 */}
        <View style={[styles.info, { marginLeft: spacing.sm }]}>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
            }}
            numberOfLines={1}
          >
            {product.brand}
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {product.name}
          </Text>

          {/* 하단: 매치율 + 평점 */}
          <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
            <View style={[styles.matchBadge, { backgroundColor: matchColor + '18' }]}>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  fontWeight: typography.weight.bold,
                  color: matchColor,
                }}
              >
                {product.matchRate}%
              </Text>
            </View>
            <View style={styles.ratingRow}>
              <Star size={12} color={status.warning} fill={status.warning} />
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginLeft: 3,
                }}
              >
                {product.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 72,
    height: 72,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});
