/**
 * BarcodeInput — 바코드 수동 입력
 *
 * 바코드 번호를 직접 입력하는 텍스트 입력 필드.
 */
import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface BarcodeInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  style?: ViewStyle;
}

export function BarcodeInput({
  value,
  onChangeText,
  onSearch,
  placeholder = '바코드 번호 입력',
  style,
}: BarcodeInputProps): React.JSX.Element {
  const { colors, spacing, typography, radii, brand } = useTheme();

  return (
    <View style={[styles.container, style]} testID="barcode-input">
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.xl,
            padding: spacing.sm,
            fontSize: typography.size.sm,
            color: colors.foreground,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType="number-pad"
        accessibilityLabel="바코드 번호"
        testID="barcode-text-input"
      />
      {onSearch && (
        <Pressable
          style={[
            styles.searchBtn,
            {
              backgroundColor: brand.primary,
              borderRadius: radii.xl,
              paddingHorizontal: spacing.md,
              marginLeft: spacing.sm,
            },
          ]}
          onPress={onSearch}
          accessibilityLabel="바코드 검색"
          accessibilityRole="button"
        >
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: brand.primaryForeground,
            }}
          >
            검색
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
  },
  searchBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
});
