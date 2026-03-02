/**
 * AddClothingSheet — 의류 추가 시트
 *
 * 새 의류를 옷장에 추가하는 폼. 바텀시트 콘텐츠용.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';
import type { ClothingCategory } from './ClothingCard';

export interface AddClothingSheetProps {
  onSave?: (data: { name: string; category: ClothingCategory; color: string }) => void;
  onCancel?: () => void;
  style?: ViewStyle;
}

const CATEGORIES: { key: ClothingCategory; label: string; emoji: string }[] = [
  { key: 'top', label: '상의', emoji: '👕' },
  { key: 'bottom', label: '하의', emoji: '👖' },
  { key: 'outer', label: '아우터', emoji: '🧥' },
  { key: 'shoes', label: '신발', emoji: '👟' },
  { key: 'accessory', label: '악세서리', emoji: '🎒' },
];

export function AddClothingSheet({
  onSave,
  onCancel,
  style,
}: AddClothingSheetProps): React.JSX.Element {
  const { colors, spacing, typography, radii, brand, module } = useTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('top');
  const [color, setColor] = useState('');

  return (
    <View
      style={[{ padding: spacing.md }, style]}
      testID="add-clothing-sheet"
      accessibilityLabel="의류 추가"
    >
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.md,
        }}
      >
        의류 추가
      </Text>

      {/* 이름 입력 */}
      <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground, marginBottom: spacing.xs }}>
        이름
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.lg,
            padding: spacing.sm,
            fontSize: typography.size.sm,
            color: colors.foreground,
          },
        ]}
        value={name}
        onChangeText={setName}
        placeholder="의류 이름"
        placeholderTextColor={colors.mutedForeground}
        accessibilityLabel="의류 이름"
        testID="clothing-name-input"
      />

      {/* 카테고리 선택 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          marginTop: spacing.md,
          marginBottom: spacing.xs,
        }}
      >
        카테고리
      </Text>
      <View style={[styles.categoryRow, { gap: spacing.xs }]}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={[
              styles.categoryBtn,
              {
                backgroundColor: category === cat.key ? module.personalColor.base : colors.secondary,
                borderRadius: radii.lg,
                paddingVertical: spacing.xs,
              },
            ]}
            onPress={() => setCategory(cat.key)}
            accessibilityLabel={`${cat.label}${category === cat.key ? ', 선택됨' : ''}`}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: typography.size.sm }}>{cat.emoji}</Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: category === cat.key ? colors.overlayForeground : colors.foreground,
                marginTop: spacing.xxs,
              }}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 색상 입력 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          marginTop: spacing.md,
          marginBottom: spacing.xs,
        }}
      >
        색상
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.lg,
            padding: spacing.sm,
            fontSize: typography.size.sm,
            color: colors.foreground,
          },
        ]}
        value={color}
        onChangeText={setColor}
        placeholder="예: 네이비, 블랙"
        placeholderTextColor={colors.mutedForeground}
        accessibilityLabel="의류 색상"
        testID="clothing-color-input"
      />

      {/* 버튼 */}
      <View style={[styles.btnRow, { marginTop: spacing.lg, gap: spacing.sm }]}>
        {onCancel && (
          <Pressable
            style={[
              styles.btn,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.lg,
                paddingVertical: spacing.smd,
              },
            ]}
            onPress={onCancel}
            accessibilityLabel="취소"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                textAlign: 'center',
              }}
            >
              취소
            </Text>
          </Pressable>
        )}
        {onSave && (
          <Pressable
            style={[
              styles.btn,
              {
                backgroundColor: brand.primary,
                borderRadius: radii.lg,
                paddingVertical: spacing.smd,
              },
            ]}
            onPress={() => onSave({ name, category, color })}
            accessibilityLabel="저장"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: brand.primaryForeground,
                textAlign: 'center',
              }}
            >
              저장
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {},
  categoryRow: {
    flexDirection: 'row',
  },
  categoryBtn: {
    flex: 1,
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
  },
  btn: {
    flex: 1,
  },
});
