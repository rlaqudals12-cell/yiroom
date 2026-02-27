/**
 * 친구 목록 페이지
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useTheme, typography} from '@/lib/theme';
import { ScreenContainer } from '../../../components/ui';

import { getTierColor, type Friend } from '../../../lib/social';
import { useFriends, useFriendStats } from '../../../lib/social/useFriends';

export default function FriendsScreen() {
  const { colors, brand, module: moduleColors, typography } = useTheme();
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
    <Pressable
      style={[styles.friendCard, { backgroundColor: colors.card }]}
      onPress={() => Haptics.selectionAsync()}
    >
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} transition={200} />
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
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: colors.foreground }]}>{item.displayName}</Text>
        <Text style={[styles.friendLevel, { color: colors.mutedForeground }]}>Lv.{item.level}</Text>
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={moduleColors.body.dark} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      testID="social-friends-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      {/* 상단 액션 */}
      <View style={styles.header}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={handleSearch}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={[styles.actionText, { color: colors.foreground }]}>친구 찾기</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={handleRequests}
        >
          <Text style={styles.actionIcon}>📬</Text>
          <Text style={[styles.actionText, { color: colors.foreground }]}>
            요청 {stats?.pendingRequests ? `(${stats.pendingRequests})` : ''}
          </Text>
        </Pressable>
      </View>

      {/* 통계 */}
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {stats?.totalFriends ?? 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>친구</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {stats?.pendingRequests ?? 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>받은 요청</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {stats?.sentRequests ?? 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>보낸 요청</Text>
        </View>
      </View>

      {/* 친구 목록 */}
      {friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            아직 친구가 없어요
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            친구를 찾아 함께 운동해보세요!
          </Text>
          <Pressable
            style={[styles.emptyButton, { backgroundColor: brand.primary }]}
            onPress={handleSearch}
          >
            <Text style={[styles.emptyButtonText, { color: brand.primaryForeground }]}>
              친구 찾기
            </Text>
          </Pressable>
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
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
    fontWeight: typography.weight.semibold,
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
  friendInfo: {
    flex: 1,
    marginLeft: 14,
  },
  friendName: {
    fontSize: 16,
    fontWeight: typography.weight.semibold,
  },
  friendLevel: {
    fontSize: 13,
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
    fontWeight: typography.weight.semibold,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
});
