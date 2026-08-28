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
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme, typography, radii, spacing } from '@/lib/theme';

import { GlassCard, ScreenContainer } from '../../components/ui';
import { TIMING } from '../../lib/animations';
import {
  BEAUTY_COACH_SESSION_CATEGORY,
  BEAUTY_TEAM_HISTORY_ENABLED,
  getCoachSessions,
  deleteCoachSession,
  deleteLegacyCoachSessions,
  type CoachSession,
} from '../../lib/coach';
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
    const data = await getCoachSessions(supabase, user.id, {
      category: BEAUTY_COACH_SESSION_CATEGORY,
    });
    setSessions(data);
    setIsLoading(false);
  }, [user?.id, supabase]);

  useEffect(() => {
    if (!BEAUTY_TEAM_HISTORY_ENABLED) {
      // 기존 세션은 웰니스/뷰티 출처를 구분할 수 없어 뷰티팀에 주입하지 않는다.
      setIsLoading(false);
      router.replace('/(coach)');
      return;
    }
    void fetchSessions();
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
          const success = await deleteCoachSession(
            supabase,
            session.id,
            BEAUTY_COACH_SESSION_CATEGORY
          );
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

  const handleDeleteLegacy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      '이전 대화 데이터 삭제',
      '뷰티팀과 웰니스 출처를 구분할 수 없는 이전 대화 데이터를 모두 삭제할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            const success = await deleteLegacyCoachSessions(supabase, user.id);
            Alert.alert(
              success ? '삭제 완료' : '오류',
              success
                ? '이전 대화 데이터를 삭제했어요.'
                : '이전 대화 데이터를 삭제하지 못했어요. 다시 시도해 주세요.'
            );
          },
        },
      ]
    );
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

  const renderSession = ({ item }: { item: CoachSession }) => (
    <Pressable
      style={[styles.sessionCard, { backgroundColor: colors.card }]}
      onPress={() => handleSessionPress(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.sessionRow}>
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
      <ScreenContainer scrollable={false} edges={['bottom']} backgroundGradient="home">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      testID="coach-history-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
      backgroundGradient="home"
    >
      {/* 새 대화 버튼 */}
      <Animated.View
        entering={FadeInUp.duration(TIMING.normal)}
        style={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.smx,
        }}
      >
        <GlassCard shadowSize="md" style={{}}>
          <Pressable
            style={[styles.newSessionButton, { backgroundColor: brand.primary }]}
            onPress={handleNewSession}
          >
            <Text style={[styles.newSessionButtonText, { color: brand.primaryForeground }]}>
              + 새 대화 시작
            </Text>
          </Pressable>
        </GlassCard>
        <Pressable
          style={styles.legacyDeleteButton}
          onPress={handleDeleteLegacy}
          accessibilityRole="button"
          accessibilityLabel="이전 대화 데이터 삭제"
          testID="delete-legacy-coach-history"
        >
          <Text style={[styles.legacyDeleteText, { color: colors.mutedForeground }]}>
            이전 대화 데이터 삭제
          </Text>
        </Pressable>
      </Animated.View>

      {/* 세션 목록 */}
      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            아직 대화 기록이 없어요
          </Text>
          <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
            전속 뷰티팀과 대화를 시작해보세요
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
  newSessionButton: {
    paddingVertical: 14,
    borderRadius: radii.full,
    alignItems: 'center',
  },
  newSessionButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  legacyDeleteButton: {
    alignItems: 'center',
    paddingTop: spacing.smx,
  },
  legacyDeleteText: {
    fontSize: typography.size.xs,
    textDecorationLine: 'underline',
  },
  listHeader: {
    fontSize: 13,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  sessionCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    marginBottom: spacing.xs,
  },
  sessionMeta: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  emptyHint: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  deleteHint: {
    fontSize: typography.size.xs,
    textAlign: 'center',
    paddingVertical: spacing.smx,
  },
});
