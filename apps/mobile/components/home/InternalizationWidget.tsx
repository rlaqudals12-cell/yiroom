/**
 * InternalizationWidget — ConnectionAwareness 4-status 세그먼트 바
 *
 * 사용자의 자기 이해 내재화 진행도를 시각화.
 * 웹 InternalizationWidget의 간소화된 RN 버전.
 */
import { useUser } from '@clerk/clerk-expo';
import { Brain } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING } from '@/lib/animations';
import type { ConnectionStats, ConnectionStatus } from '@/lib/connection-awareness';
import { getConnectionStats } from '@/lib/connection-awareness';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

// 상태별 색상 + 라벨
const STATUS_CONFIG: Record<ConnectionStatus, { label: string; color: string; darkColor: string }> =
  {
    exposed: { label: '발견', color: '#cbd5e1', darkColor: '#475569' },
    recognized: { label: '인식', color: '#c4b5fd', darkColor: '#6d28d9' },
    internalized: { label: '내재화', color: '#818cf8', darkColor: '#4f46e5' },
    independent: { label: '자립', color: '#34d399', darkColor: '#059669' },
  };

const STATUS_ORDER: ConnectionStatus[] = ['exposed', 'recognized', 'internalized', 'independent'];

interface InternalizationWidgetProps {
  style?: ViewStyle;
  testID?: string;
}

export function InternalizationWidget({
  style,
  testID,
}: InternalizationWidgetProps): React.JSX.Element | null {
  const { colors, spacing, radii, typography, shadows, isDark } = useTheme();
  const supabase = useClerkSupabaseClient();
  const { user } = useUser();
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    async function load(): Promise<void> {
      try {
        const result = await getConnectionStats(supabase, user!.id);
        setStats(result);
      } catch {
        // 테이블 미생성 시 무시
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user, supabase]);

  // 로딩 중이거나 데이터 없으면 숨김
  if (isLoading || !stats || stats.totalConnections === 0) return null;

  const rate = Math.round(stats.internalizationRate * 100);
  const total = stats.totalConnections;

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      testID={testID ?? 'internalization-widget'}
      style={[
        styles.container,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderColor: colors.border,
          padding: spacing.md,
        },
        style,
      ]}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Brain size={18} color={isDark ? '#818cf8' : '#6366f1'} />
        <Text
          style={{
            marginLeft: spacing.xs,
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
          }}
        >
          자기 이해 내재화
        </Text>
        <Text
          style={{
            marginLeft: 'auto' as unknown as number,
            fontSize: typography.size.xs,
            fontWeight: typography.weight.bold,
            color: isDark ? '#34d399' : '#059669',
          }}
        >
          {rate}%
        </Text>
      </View>

      {/* 4-status 세그먼트 바 */}
      <View
        style={[
          styles.segmentBar,
          {
            marginTop: spacing.sm,
            borderRadius: radii.md,
            backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
            overflow: 'hidden',
          },
        ]}
      >
        {STATUS_ORDER.map((status) => {
          const count = stats.byStatus[status];
          const pct = total > 0 ? (count / total) * 100 : 0;
          if (pct === 0) return null;

          return (
            <View
              key={status}
              style={{
                width: `${pct}%` as unknown as number,
                height: 8,
                backgroundColor: isDark
                  ? STATUS_CONFIG[status].darkColor
                  : STATUS_CONFIG[status].color,
              }}
            />
          );
        })}
      </View>

      {/* 범례 */}
      <View style={[styles.legend, { marginTop: spacing.sm }]}>
        {STATUS_ORDER.map((status) => {
          const count = stats.byStatus[status];
          if (count === 0) return null;

          return (
            <View key={status} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor: isDark
                      ? STATUS_CONFIG[status].darkColor
                      : STATUS_CONFIG[status].color,
                  },
                ]}
              />
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                }}
              >
                {STATUS_CONFIG[status].label} {count}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentBar: {
    flexDirection: 'row',
    height: 8,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
