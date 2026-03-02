/**
 * 친구 요청 관리 페이지
 */

import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme, typography, radii , spacing } from '@/lib/theme';
import { ScreenContainer } from '../../../components/ui';

import { type FriendRequest } from '../../../lib/social';
import { useFriendRequests } from '../../../lib/social/useFriends';

export default function FriendRequestsScreen() {
  const { colors, brand, status, module: moduleColors, typography, spacing} = useTheme();

  const { requests, isLoading, error, accept, reject, refetch } = useFriendRequests();

  const handleAccept = async (request: FriendRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await accept(request.id);
    if (success) {
      Alert.alert('완료', `${request.requesterName}님과 친구가 되었습니다!`);
    } else {
      Alert.alert('오류', '친구 요청 수락에 실패했습니다.');
    }
  };

  const handleReject = async (request: FriendRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('확인', `${request.requesterName}님의 요청을 거절할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '거절',
        style: 'destructive',
        onPress: async () => {
          const success = await reject(request.id);
          if (!success) {
            Alert.alert('오류', '친구 요청 거절에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return `${Math.floor(diffDays / 30)}달 전`;
  };

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={[styles.requestCard, { backgroundColor: colors.card }]}>
      <View style={styles.requestInfo}>
        <View style={styles.avatarContainer}>
          {item.requesterAvatar ? (
            <Image source={{ uri: item.requesterAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
              <Text style={[styles.avatarText, { color: colors.mutedForeground }]}>
                {item.requesterName.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]}>{item.requesterName}</Text>
          <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>
            Lv.{item.requesterLevel} · {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.acceptButton, { backgroundColor: brand.primary }]}
          onPress={() => handleAccept(item)}
        >
          <Text style={[styles.acceptButtonText, { color: brand.primaryForeground }]}>수락</Text>
        </Pressable>
        <Pressable
          style={[styles.rejectButton, { backgroundColor: colors.muted }]}
          onPress={() => handleReject(item)}
        >
          <Text style={[styles.rejectButtonText, { color: colors.foreground }]}>거절</Text>
        </Pressable>
      </View>
    </View>
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
      testID="social-friend-requests-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      {/* 에러 메시지 */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: status.error + '15' }]}>
          <Text style={[styles.errorText, { color: status.error }]}>{error}</Text>
        </View>
      )}

      {/* 요청 목록 */}
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📬</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            받은 친구 요청이 없습니다
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            다른 사용자가 친구 요청을 보내면 여기에 표시됩니다
          </Text>
        </View>
      ) : (
        <>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>받은 요청</Text>
            <Text style={[styles.headerCount, { color: colors.mutedForeground }]}>
              {requests.length}개
            </Text>
          </View>

          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={renderRequest}
            contentContainerStyle={styles.listContent}
            refreshing={isLoading}
            onRefresh={refetch}
            showsVerticalScrollIndicator={false}
          />
        </>
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
  errorContainer: {
    margin: spacing.md,
    padding: spacing.smx,
    borderRadius: radii.md,
  },
  errorText: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smx,
  },
  headerTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  headerCount: {
    fontSize: typography.size.sm,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.smx,
  },
  requestCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarContainer: {
    marginRight: spacing.smx,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: typography.weight.semibold,
  },
  userMeta: {
    fontSize: 13,
    marginTop: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.smd,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: spacing.smx,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: spacing.smx,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
});
