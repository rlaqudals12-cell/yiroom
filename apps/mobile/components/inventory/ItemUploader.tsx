/**
 * ItemUploader — 아이템 등록 카드
 *
 * 새 제품을 인벤토리에 추가하는 CTA 카드. 카메라/갤러리 옵션.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface ItemUploaderProps {
  onCamera?: () => void;
  onGallery?: () => void;
  onManual?: () => void;
  style?: ViewStyle;
}

export function ItemUploader({
  onCamera,
  onGallery,
  onManual,
  style,
}: ItemUploaderProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      testID="item-uploader"
      accessibilityLabel="제품 등록"
    >
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        제품 추가
      </Text>

      <View style={[styles.btnRow, { gap: spacing.sm }]}>
        {onCamera && (
          <Pressable
            style={[
              styles.optionBtn,
              {
                backgroundColor: brand.primary,
                borderRadius: radii.lg,
                paddingVertical: spacing.smd,
              },
            ]}
            onPress={onCamera}
            accessibilityLabel="카메라로 촬영"
            accessibilityRole="button"
          >
            <Text style={{ fontSize: typography.size.base }}>📷</Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.medium,
                color: brand.primaryForeground,
                marginTop: spacing.xxs,
              }}
            >
              촬영
            </Text>
          </Pressable>
        )}
        {onGallery && (
          <Pressable
            style={[
              styles.optionBtn,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.lg,
                paddingVertical: spacing.smd,
              },
            ]}
            onPress={onGallery}
            accessibilityLabel="갤러리에서 선택"
            accessibilityRole="button"
          >
            <Text style={{ fontSize: typography.size.base }}>🖼️</Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.medium,
                color: colors.foreground,
                marginTop: spacing.xxs,
              }}
            >
              갤러리
            </Text>
          </Pressable>
        )}
        {onManual && (
          <Pressable
            style={[
              styles.optionBtn,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.lg,
                paddingVertical: spacing.smd,
              },
            ]}
            onPress={onManual}
            accessibilityLabel="직접 입력"
            accessibilityRole="button"
          >
            <Text style={{ fontSize: typography.size.base }}>✏️</Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.medium,
                color: colors.foreground,
                marginTop: spacing.xxs,
              }}
            >
              직접 입력
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  btnRow: {
    flexDirection: 'row',
  },
  optionBtn: {
    flex: 1,
    alignItems: 'center',
  },
});
