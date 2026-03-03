/**
 * FriendSearchInput — 친구 검색 입력
 *
 * 친구 검색 바. 이름/닉네임으로 검색.
 */
import React from 'react';
import { View, TextInput, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface FriendSearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export function FriendSearchInput({
  value,
  onChangeText,
  placeholder = '이름으로 친구 검색',
  style,
}: FriendSearchInputProps): React.JSX.Element {
  const { colors, spacing, typography, radii } = useTheme();

  return (
    <View style={[styles.container, style]} testID="friend-search-input">
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.xl,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            fontSize: typography.size.sm,
            color: colors.foreground,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        accessibilityLabel="친구 검색"
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  input: {},
});
