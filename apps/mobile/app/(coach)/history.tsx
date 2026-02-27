/**
 * 코치 채팅 히스토리 화면
 * 과거 세션 목록 + 세션 선택/삭제
 */

import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

import { getCoachSessions, deleteCoachSession, type CoachSession } from '../../lib/coach';
import { useClerkSupabaseClient } from '../../lib/supabase';

export default function CoachHistoryScreen() {
  const { colors, brand } = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const data = await getCoachSessions(supabase, user.id);
    setSessions(data);
    setIsLoading(false);
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSessionPress = (session: CoachSession) => {
    Haptics.selectionAsync();
    router.replace({
      pathname: '/(coach)',
      params: { sessionId: session.id },
    });
  };

  const handleDelete = (session: CoachSession) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('세션 삭제', '이 대화를 삭제할까요? 삭제된 대화는 복구할 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const success = await deleteCoachSession(supabase, session.id);
          if (success) {
            setSessions((prev) => prev.filter((s) => s.id !== session.id));
          } else {
            Alert.alert('오류', '세션 삭제에 실패했어요.');
          }
        },
      },
    ]);
  };

  const handleNewSession = () => {
    Haptics.selectionAsync();
    router.replace('/(coach)');
  };

  // 상대 시간 포맷
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return '방금';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return `${Math.floor(diffDays / 30)}달 전`;
  };

  // 카테고리 이모지
  const getCategoryEmoji = (category: string): string => {
    switch (category) {
      case 'workout':
        return '💪';
      case 'nutrition':
        return '🥗';
      case 'skin':
        return '✨';
      default:
        return '💬';
    }
  };

  const renderSession = ({ item }: { item: CoachSession }) => (
    <Pressable
      style={[styles.sessionCard, { backgroundColor: colors.card }]}
      onPress={() => handleSessionPress(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.sessionRow}>
        <Text style={styles.categoryEmoji}>{getCategoryEmoji(item.category)}</Text>
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.title || '새 대화'}
          </Text>
          <Text style={[styles.sessionMeta, { color: colors.mutedForeground }]}>
            {formatRelativeTime(item.updatedAt)} · {item.messageCount}개 메시지
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      testID="coach-history-screen"
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      {/* 새 대화 버튼 */}
      <Pressable
        style={[styles.newSessionButton, { backgroundColor: brand.primary }]}
        onPress={handleNewSession}
      >
        <Text style={[styles.newSessionButtonText, { color: brand.primaryForeground }]}>
          + 새 대화 시작
        </Text>
      </Pressable>

      {/* 세션 목록 */}
      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            아직 대화 기록이 없어요
          </Text>
          <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
            AI 코치와 대화를 시작해보세요!
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.listHeader, { color: colors.mutedForeground }]}>
            최근 대화 ({sessions.length})
          </Text>
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={renderSession}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          <Text style={[styles.deleteHint, { color: colors.mutedForeground }]}>
            길게 눌러서 삭제할 수 있어요
          </Text>
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
  newSessionButton: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  newSessionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listHeader: {
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  sessionMeta: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  deleteHint: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
