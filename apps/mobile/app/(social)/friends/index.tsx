/**
 * 친구 목록 페이지
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTierColor, type Friend } from '../../../lib/social';
import { useFriends, useFriendStats } from '../../../lib/social/useFriends';

export default function FriendsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const { friends, isLoading, refetch } = useFriends();
  const { stats } = useFriendStats();

  const handleSearch = () => {
    Haptics.selectionAsync();
    router.push('/(social)/friends/search');
  };

  const handleRequests = () => {
    Haptics.selectionAsync();
    router.push('/(social)/friends/requests');
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={[styles.friendCard, isDark && styles.friendCardDark]}
      onPress={() => Haptics.selectionAsync()}
    >
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              isDark && styles.avatarPlaceholderDark,
            ]}
          >
            <Text style={styles.avatarText}>{item.displayName.charAt(0)}</Text>
          </View>
        )}
        <View
          style={[
            styles.tierBadge,
            { backgroundColor: getTierColor(item.tier) },
          ]}
        />
      </View>
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, isDark && styles.textLight]}>
          {item.displayName}
        </Text>
        <Text style={[styles.friendLevel, isDark && styles.textMuted]}>
          Lv.{item.level}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      {/* 상단 액션 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.actionButton, isDark && styles.actionButtonDark]}
          onPress={handleSearch}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={[styles.actionText, isDark && styles.textLight]}>
            친구 찾기
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, isDark && styles.actionButtonDark]}
          onPress={handleRequests}
        >
          <Text style={styles.actionIcon}>📬</Text>
          <Text style={[styles.actionText, isDark && styles.textLight]}>
            요청 {stats?.pendingRequests ? `(${stats.pendingRequests})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 통계 */}
      <View style={[styles.statsCard, isDark && styles.statsCardDark]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDark && styles.textLight]}>
            {stats?.totalFriends ?? 0}
          </Text>
          <Text style={[styles.statLabel, isDark && styles.textMuted]}>
            친구
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDark && styles.textLight]}>
            {stats?.pendingRequests ?? 0}
          </Text>
          <Text style={[styles.statLabel, isDark && styles.textMuted]}>
            받은 요청
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDark && styles.textLight]}>
            {stats?.sentRequests ?? 0}
          </Text>
          <Text style={[styles.statLabel, isDark && styles.textMuted]}>
            보낸 요청
          </Text>
        </View>
      </View>

      {/* 친구 목록 */}
      {friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={[styles.emptyText, isDark && styles.textMuted]}>
            아직 친구가 없어요
          </Text>
          <Text style={[styles.emptySubtext, isDark && styles.textMuted]}>
            친구를 찾아 함께 운동해보세요!
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleSearch}>
            <Text style={styles.emptyButtonText}>친구 찾기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.userId}
          renderItem={renderFriend}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refetch}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  actionButtonDark: {
    backgroundColor: '#1a1a1a',
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  statsCardDark: {
    backgroundColor: '#1a1a1a',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    gap: 10,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
  },
  friendCardDark: {
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
  friendInfo: {
    flex: 1,
    marginLeft: 14,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  friendLevel: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
