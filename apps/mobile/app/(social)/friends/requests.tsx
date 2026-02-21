/**
 * 친구 요청 관리 페이지
 */

import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

import { type FriendRequest } from '../../../lib/social';
import { useFriendRequests } from '../../../lib/social/useFriends';

export default function FriendRequestsScreen() {
  const { colors, brand, status, module: moduleColors } = useTheme();

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
        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: brand.primary }]}
          onPress={() => handleAccept(item)}
        >
          <Text style={[styles.acceptButtonText, { color: brand.primaryForeground }]}>수락</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rejectButton, { backgroundColor: colors.muted }]}
          onPress={() => handleReject(item)}
        >
          <Text style={[styles.rejectButtonText, { color: colors.foreground }]}>거절</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={moduleColors.body.dark} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      testID="social-friend-requests-screen"
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
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
    </SafeAreaView>
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
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerCount: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  requestCard: {
    borderRadius: 16,
    padding: 16,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarContainer: {
    marginRight: 12,
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
    fontSize: 20,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
  },
  userMeta: {
    fontSize: 13,
    marginTop: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 15,
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
