/**
 * ClosetPreviewStrip — 옷장 아이템 가로 프리뷰
 *
 * 옷장의 최근 아이템을 가로 스크롤로 표시.
 * 빈 상태에서 CTA 제공.
 */
import { Image } from 'expo-image';
import { Package } from 'lucide-react-native';
import { FlatList, StyleSheet, Text, View, Pressable, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme , spacing } from '../../lib/theme';
import { TIMING } from '../../lib/animations';
import type { InventoryItem } from '../../lib/inventory';

interface ClosetPreviewStripProps {
  items: InventoryItem[];
  onItemPress?: (item: InventoryItem) => void;
  onViewAll?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export function ClosetPreviewStrip({
  items,
  onItemPress,
  onViewAll,
  style,
  testID,
}: ClosetPreviewStripProps): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, module: moduleColors, shadows } = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      testID={testID}
      accessibilityLabel={`옷장 프리뷰: ${items.length}개 아이템`}
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
        <View style={[styles.iconBadge, { backgroundColor: moduleColors.body.light + '20' }]}>
          <Package size={18} color={moduleColors.body.dark} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
            }}
          >
            내 옷장
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
            {items.length}개 아이템
          </Text>
        </View>
        {onViewAll && items.length > 0 && (
          <Pressable
            onPress={onViewAll}
            accessibilityRole="button"
            accessibilityLabel="옷장 전체 보기"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                color: brand.primary,
                fontWeight: typography.weight.semibold,
              }}
            >
              전체 보기
            </Text>
          </Pressable>
        )}
      </View>

      {/* 아이템 리스트 */}
      {items.length > 0 ? (
        <FlatList
          horizontal
          data={items.slice(0, 10)}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.sm }}
          contentContainerStyle={{ gap: spacing.sm }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onItemPress?.(item)}
              accessibilityLabel={item.name}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View
                style={[
                  styles.itemCard,
                  {
                    borderRadius: radii.lg,
                    backgroundColor: colors.secondary,
                  },
                ]}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={[styles.itemImage, { borderRadius: radii.lg }]}
                  contentFit="cover"
                  transition={200}
                />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginTop: spacing.xs,
                  textAlign: 'center',
                  maxWidth: 72,
                }}
              >
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      ) : (
        <View style={[styles.emptyState, { marginTop: spacing.sm }]}>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              textAlign: 'center',
            }}
          >
            옷장에 아이템을 추가해보세요
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

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
  itemCard: {
    width: 72,
    height: 72,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
