/**
 * 친구 검색 페이지
 */

import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

import { getTierColor, type UserSearchResult } from '../../../lib/social';
import { useUserSearch } from '../../../lib/social/useFriends';

export default function FriendSearchScreen() {
  const { colors, brand, status, module: moduleColors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const { results, isLoading, error, search, sendRequest, clear } = useUserSearch();

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      Alert.alert('알림', '2글자 이상 입력해주세요');
      return;
    }
    Haptics.selectionAsync();
    await search(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    clear();
  };

  const handleSendRequest = async (userId: string, userName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await sendRequest(userId);
    if (success) {
      Alert.alert('완료', `${userName}님에게 친구 요청을 보냈습니다.`);
    } else {
      Alert.alert('오류', '친구 요청을 보내는데 실패했습니다.');
    }
  };

  const getStatusButton = (item: UserSearchResult) => {
    if (item.isFriend) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: status.success + '20' }]}>
          <Text style={[styles.statusBadgeText, { color: colors.foreground }]}>친구</Text>
        </View>
      );
    }
    if (item.isPending) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: status.warning + '20' }]}>
          <Text style={[styles.statusBadgeText, { color: colors.foreground }]}>요청됨</Text>
        </View>
      );
    }
    if (item.isBlocked) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: status.error + '15' }]}>
          <Text style={[styles.statusBadgeText, { color: colors.foreground }]}>차단됨</Text>
        </View>
      );
    }
    return (
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: brand.primary }]}
        onPress={() => handleSendRequest(item.userId, item.displayName)}
      >
        <Text style={[styles.addButtonText, { color: brand.primaryForeground }]}>친구 추가</Text>
      </TouchableOpacity>
    );
  };

  const renderResult = ({ item }: { item: UserSearchResult }) => (
    <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
            <Text style={[styles.avatarText, { color: colors.mutedForeground }]}>
              {item.displayName.charAt(0)}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.tierBadge,
            { backgroundColor: getTierColor(item.tier), borderColor: colors.card },
          ]}
        />
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.foreground }]}>{item.displayName}</Text>
        <Text style={[styles.userLevel, { color: colors.mutedForeground }]}>Lv.{item.level}</Text>
      </View>
      {getStatusButton(item)}
    </View>
  );

  return (
    <SafeAreaView
      testID="social-friend-search-screen"
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="닉네임으로 검색"
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Text style={[styles.clearIcon, { color: colors.mutedForeground }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: brand.primary }]}
          onPress={handleSearch}
        >
          <Text style={[styles.searchButtonText, { color: brand.primaryForeground }]}>검색</Text>
        </TouchableOpacity>
      </View>

      {/* 에러 메시지 */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: status.error + '15' }]}>
          <Text style={[styles.errorText, { color: status.error }]}>{error}</Text>
        </View>
      )}

      {/* 검색 결과 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={moduleColors.body.dark} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {searchQuery.length > 0 ? '검색 결과가 없습니다' : '닉네임으로 친구를 검색해보세요'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.userId}
          renderItem={renderResult}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  clearIcon: {
    fontSize: 16,
    padding: 4,
  },
  searchButton: {
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    gap: 10,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  tierBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userLevel: {
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
