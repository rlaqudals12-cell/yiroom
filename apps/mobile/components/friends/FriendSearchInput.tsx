/**
 * FriendSearchInput -- 친구 검색 입력
 *
 * 돋보기 아이콘 + 텍스트 입력 + 클리어 버튼.
 * onSearch 콜백으로 검색 실행.
 */
import React from 'react';
import { Pressable, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import { Search, X } from 'lucide-react-native';

import { useTheme, spacing } from '../../lib/theme';

export interface FriendSearchInputProps {
  value: string;
  onChange: (text: string) => void;
  onSearch: () => void;
  placeholder?: string;
  style?: ViewStyle;
}

export function FriendSearchInput({
  value,
  onChange,
  onSearch,
  placeholder = '이름 또는 닉네임으로 검색',
  style,
}: FriendSearchInputProps): React.JSX.Element {
  const { colors, spacing, typography, radii } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.secondary,
          borderRadius: radii.xl,
          paddingHorizontal: spacing.smx,
        },
        style,
      ]}
      testID="friend-search-input"
    >
      {/* 돋보기 아이콘 */}
      <Search
        size={18}
        color={colors.mutedForeground}
        accessibilityElementsHidden
      />

      {/* 입력 */}
      <TextInput
        style={[
          styles.input,
          {
            fontSize: typography.size.sm,
            color: colors.foreground,
            marginHorizontal: spacing.sm,
          },
        ]}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSearch}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="친구 검색 입력"
      />

      {/* 텍스트가 있으면 클리어 버튼 표시 */}
      {value.length > 0 && (
        <Pressable
          onPress={() => onChange('')}
          hitSlop={spacing.sm}
          accessibilityLabel="검색어 지우기"
          accessibilityRole="button"
        >
          <View
            style={[
              styles.clearBtn,
              {
                backgroundColor: colors.mutedForeground,
                borderRadius: radii.full,
              },
            ]}
          >
            <X size={12} color={colors.card} />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  clearBtn: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
