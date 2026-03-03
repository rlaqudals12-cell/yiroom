/**
 * AddFriendSheet -- 친구 추가 하단 시트
 *
 * BottomSheet 위에 검색 + 결과 목록 + 친구 요청 버튼을 구성.
 * FriendSearchInput을 재사용하고, 검색 결과를 FlatList로 표시.
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { useTheme, spacing, radii } from '../../lib/theme';
import { BottomSheet } from '../ui/BottomSheet';
import { FriendSearchInput } from './FriendSearchInput';

export interface SearchResultUser {
  id: string;
  name: string;
  avatar?: string;
  mutualFriends?: number;
}

export interface AddFriendSheetProps {
  visible: boolean;
  onClose: () => void;
  onSendRequest: (userId: string) => void;
  /** 검색 결과 데이터 (부모에서 관리) */
  searchResults?: SearchResultUser[];
  /** 검색 콜백 (부모에서 API 호출) */
  onSearchQuery?: (query: string) => void;
  /** 검색 로딩 상태 */
  isSearching?: boolean;
  /** 이미 요청 보낸 사용자 ID 목록 */
  sentRequestIds?: string[];
}

export function AddFriendSheet({
  visible,
  onClose,
  onSendRequest,
  searchResults = [],
  onSearchQuery,
  isSearching = false,
  sentRequestIds = [],
}: AddFriendSheetProps): React.JSX.Element {
  const { colors, spacing, typography, radii, status, brand } = useTheme();
  const [searchText, setSearchText] = useState('');

  const handleSearch = useCallback((): void => {
    if (searchText.trim().length > 0) {
      onSearchQuery?.(searchText.trim());
    }
  }, [searchText, onSearchQuery]);

  const handleChange = useCallback((text: string): void => {
    setSearchText(text);
    // 텍스트 비우면 결과도 초기화
    if (text.trim().length === 0) {
      onSearchQuery?.('');
    }
  }, [onSearchQuery]);

  const renderResult = useCallback(
    ({ item }: { item: SearchResultUser }): React.JSX.Element => {
      const isSent = sentRequestIds.includes(item.id);

      return (
        <View
          style={[
            styles.resultRow,
            {
              paddingVertical: spacing.smx,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
          testID={`search-result-${item.id}`}
        >
          {/* 아바타 */}
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.full,
              },
            ]}
          >
            <Text style={{ fontSize: typography.size.base, color: colors.foreground }}>
              {item.name.charAt(0)}
            </Text>
          </View>

          {/* 이름 + 공통 친구 */}
          <View style={[styles.resultInfo, { marginLeft: spacing.smx }]}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
              }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.mutualFriends !== undefined && item.mutualFriends > 0 && (
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginTop: spacing.xxs,
                }}
              >
                공통 친구 {item.mutualFriends}명
              </Text>
            )}
          </View>

          {/* 요청 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: isSent ? colors.secondary : brand.primary,
                borderRadius: radii.xl,
                paddingHorizontal: spacing.smx,
                paddingVertical: spacing.xs,
                opacity: pressed && !isSent ? 0.7 : 1,
              },
            ]}
            onPress={() => !isSent && onSendRequest(item.id)}
            disabled={isSent}
            accessibilityLabel={isSent ? '이미 요청함' : `${item.name}님에게 친구 요청 보내기`}
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: isSent ? colors.mutedForeground : brand.primaryForeground,
              }}
            >
              {isSent ? '요청됨' : '친구 요청'}
            </Text>
          </Pressable>
        </View>
      );
    },
    [colors, spacing, typography, radii, brand, sentRequestIds, onSendRequest]
  );

  // 빈 상태
  const renderEmpty = useCallback((): React.JSX.Element | null => {
    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={colors.mutedForeground} />
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              marginTop: spacing.sm,
            }}
          >
            검색 중...
          </Text>
        </View>
      );
    }

    if (searchText.trim().length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              textAlign: 'center',
            }}
          >
            이름 또는 닉네임으로{'\n'}친구를 검색해보세요
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            textAlign: 'center',
          }}
        >
          검색 결과가 없어요
        </Text>
      </View>
    );
  }, [isSearching, searchText, colors, typography, spacing]);

  return (
    <BottomSheet
      isVisible={visible}
      onClose={onClose}
      snapPoints={['60%']}
      title="친구 추가"
      testID="add-friend-sheet"
    >
      {/* 검색 입력 */}
      <FriendSearchInput
        value={searchText}
        onChange={handleChange}
        onSearch={handleSearch}
        placeholder="이름 또는 닉네임으로 검색"
        style={{ marginBottom: spacing.sm } as ViewStyle}
      />

      {/* 검색 결과 목록 */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={renderResult}
        ListEmptyComponent={renderEmpty}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        testID="search-results-list"
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  sendBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
});
