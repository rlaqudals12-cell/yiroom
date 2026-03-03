/**
 * ItemDetailSheet — 아이템 상세 시트
 *
 * 인벤토리 아이템의 상세 정보를 표시하는 바텀시트용 콘텐츠.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface ItemDetailSheetProps {
  name: string;
  brand: string;
  category: string;
  emoji?: string;
  description?: string;
  purchaseDate?: string;
  expiryDate?: string;
  ingredients?: string[];
  onEdit?: () => void;
  onDelete?: () => void;
  style?: ViewStyle;
}

export function ItemDetailSheet({
  name,
  brand: itemBrand,
  category,
  emoji = '🧴',
  description,
  purchaseDate,
  expiryDate,
  ingredients,
  onEdit,
  onDelete,
  style,
}: ItemDetailSheetProps): React.JSX.Element {
  const { colors, spacing, typography, radii, status } = useTheme();

  return (
    <View
      style={[{ padding: spacing.md }, style]}
      testID="item-detail-sheet"
      accessibilityLabel={`${itemBrand} ${name} 상세 정보`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size['2xl'] }}>{emoji}</Text>
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <Text
            style={{
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            {name}
          </Text>
          <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
            {itemBrand} · {category}
          </Text>
        </View>
      </View>

      {/* 설명 */}
      {description && (
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.foreground,
            marginTop: spacing.md,
            lineHeight: 20,
          }}
        >
          {description}
        </Text>
      )}

      {/* 날짜 정보 */}
      <View style={[styles.infoRow, { marginTop: spacing.md, gap: spacing.md }]}>
        {purchaseDate && (
          <View>
            <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>구매일</Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                marginTop: spacing.xxs,
              }}
            >
              {purchaseDate}
            </Text>
          </View>
        )}
        {expiryDate && (
          <View>
            <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>유통기한</Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                marginTop: spacing.xxs,
              }}
            >
              {expiryDate}
            </Text>
          </View>
        )}
      </View>

      {/* 성분 */}
      {ingredients && ingredients.length > 0 && (
        <View style={{ marginTop: spacing.md }}>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginBottom: spacing.xs,
            }}
          >
            주요 성분
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, lineHeight: 18 }}>
            {ingredients.join(', ')}
          </Text>
        </View>
      )}

      {/* 액션 버튼 */}
      <View style={[styles.actions, { marginTop: spacing.lg, gap: spacing.sm }]}>
        {onEdit && (
          <Pressable
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.xl,
                paddingVertical: spacing.smd,
              },
            ]}
            onPress={onEdit}
            accessibilityLabel="수정"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.medium,
                color: colors.foreground,
                textAlign: 'center',
              }}
            >
              수정
            </Text>
          </Pressable>
        )}
        {onDelete && (
          <Pressable
            style={[
              styles.actionBtn,
              {
                backgroundColor: status.error,
                borderRadius: radii.xl,
                paddingVertical: spacing.smd,
              },
            ]}
            onPress={onDelete}
            accessibilityLabel="삭제"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.medium,
                color: colors.overlayForeground,
                textAlign: 'center',
              }}
            >
              삭제
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
  },
});
