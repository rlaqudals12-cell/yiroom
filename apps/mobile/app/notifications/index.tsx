/**
 * 알림 인박스 스크린
 * 받은 알림 목록 표시
 */
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import { ScreenContainer, GlassCard } from '../../components/ui';
import { useClerkSupabaseClient } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';

interface NotificationItem {
  id: string;
  emoji: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

// 상대 시간 포맷
function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

// 알림 타입별 이모지
const TYPE_EMOJI: Record<string, string> = {
  analysis: '🔬',
  workout: '💪',
  nutrition: '🥗',
  badge: '🏆',
  system: '📢',
  reminder: '⏰',
};

export default function NotificationsScreen(): React.JSX.Element {
  const { colors, brand, spacing, radii, typography } = useTheme();
  const supabase = useClerkSupabaseClient();
  const { user } = useUser();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications(): Promise<void> {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('id, type, title, body, is_read, created_at')
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) throw error;

        if (data) {
          setNotifications(
            data.map((row) => ({
              id: row.id,
              emoji: TYPE_EMOJI[row.type] ?? '🔔',
              title: row.title,
              body: row.body ?? '',
              time: formatRelativeTime(row.created_at),
              read: row.is_read ?? false,
            }))
          );
        }
      } catch {
        // DB 테이블 미존재 시 빈 목록 유지
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotifications();
  }, [supabase, user?.id]);

  return (
    <ScreenContainer testID="notifications-screen" edges={['bottom']} backgroundGradient="profile">
      {/* 헤더 */}
      <GlassCard shadowSize="md" style={{ marginBottom: spacing.lg }}>
        <Text
          style={{
            fontSize: typography.size.xl,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginBottom: spacing.xs,
          }}
        >
          알림
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
          }}
        >
          최근 받은 알림을 확인하세요
        </Text>
      </GlassCard>

      {/* 알림 목록 */}
      {notifications.length > 0 ? (
        notifications.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: item.read ? colors.card : brand.primary + '10',
              borderRadius: radii.xl,
              padding: spacing.md,
              marginBottom: spacing.sm,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: spacing.sm + 2,
            }}
          >
            <Text style={{ fontSize: typography.size['2xl'] }}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: typography.size.base,
                    fontWeight: item.read ? typography.weight.normal : typography.weight.semibold,
                    color: colors.foreground,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    color: colors.mutedForeground,
                  }}
                >
                  {item.time}
                </Text>
              </View>
              <Text
                style={{
                  marginTop: spacing.xs,
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                  lineHeight: 20,
                }}
              >
                {item.body}
              </Text>
            </View>
          </View>
        ))
      ) : (
        /* 빈 상태 */
        <View
          style={{
            alignItems: 'center',
            paddingVertical: spacing.xl + spacing.lg,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🔔</Text>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
              marginBottom: spacing.sm,
            }}
          >
            아직 알림이 없어요
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            운동 리마인더, 식단 기록 알림 등{'\n'}설정에서 알림을 활성화해보세요
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
