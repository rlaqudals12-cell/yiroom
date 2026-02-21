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
  const { colors, isDark } = useTheme();

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
        <View style={[styles.statusBadge, styles.statusFriend]}>
          <Text style={styles.statusBadgeText}>친구</Text>
        </View>
      );
    }
    if (item.isPending) {
      return (
        <View style={[styles.statusBadge, styles.statusPending]}>
          <Text style={styles.statusBadgeText}>요청됨</Text>
        </View>
      );
    }
    if (item.isBlocked) {
      return (
        <View style={[styles.statusBadge, styles.statusBlocked]}>
          <Text style={styles.statusBadgeText}>차단됨</Text>
        </View>
      );
    }
    return (
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleSendRequest(item.userId, item.displayName)}
      >
        <Text style={styles.addButtonText}>친구 추가</Text>
      </TouchableOpacity>
    );
  };

  const renderResult = ({ item }: { item: UserSearchResult }) => (
    <View style={[styles.resultCard, isDark && styles.resultCardDark]}>
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, isDark && styles.avatarPlaceholderDark]}>
            <Text style={styles.avatarText}>{item.displayName.charAt(0)}</Text>
          </View>
        )}
        <View style={[styles.tierBadge, { backgroundColor: getTierColor(item.tier) }]} />
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, isDark && styles.textLight]}>{item.displayName}</Text>
        <Text style={[styles.userLevel, isDark && styles.textMuted]}>Lv.{item.level}</Text>
      </View>
      {getStatusButton(item)}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, isDark && styles.textLight]}
            placeholder="닉네임으로 검색"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      {/* 에러 메시지 */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* 검색 결과 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={[styles.emptyText, isDark && styles.textMuted]}>
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
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchBarDark: {
    backgroundColor: '#1a1a1a',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111',
  },
  clearIcon: {
    fontSize: 16,
    color: '#999',
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
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
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  errorText: {
    color: '#dc2626',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
  },
  resultCardDark: {
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderDark: {
    backgroundColor: '#333',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  tierBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  userLevel: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusFriend: {
    backgroundColor: '#dcfce7',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusBlocked: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
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
    color: '#666',
    textAlign: 'center',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
