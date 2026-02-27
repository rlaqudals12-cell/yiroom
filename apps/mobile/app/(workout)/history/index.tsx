/**
 * W-1 운동 히스토리 화면
 * 과거 운동 기록 목록 및 통계
 */
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { ScreenContainer, DataStateWrapper } from '@/components/ui';
import { GlassCard } from '@/components/ui/GlassCard';
import { staggeredEntry } from '@/lib/animations';
import { useTheme, typography} from '@/lib/theme';

import { useClerkSupabaseClient } from '../../../lib/supabase';
import { workoutLogger } from '../../../lib/utils/logger';

interface WorkoutLog {
  id: string;
  workout_date: string;
  actual_duration: number | null;
  actual_calories: number | null;
  exercise_logs: {
    exercise_name: string;
    difficulty: number;
  }[];
  mood: string | null;
  notes: string | null;
}

interface WeeklyStats {
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  avgDuration: number;
}

export default function WorkoutHistoryScreen() {
  const { colors, spacing, module: moduleColors, typography } = useTheme();
  const workoutColor = moduleColors.workout.base;
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 운동 기록 조회
  const fetchWorkoutLogs = useCallback(async () => {
    if (!user?.id) return;

    try {
      // 최근 30일 기록
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('workout_logs')
        .select('id, workout_date, actual_duration, actual_calories, exercise_logs, mood, notes')
        .gte('workout_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('workout_date', { ascending: false });

      if (error) throw error;

      setLogs(data || []);

      // 이번 주 통계 계산
      const weekStart = getWeekStartDate();
      const weekLogs = (data || []).filter((log) => new Date(log.workout_date) >= weekStart);

      const totalDuration = weekLogs.reduce((sum, log) => sum + (log.actual_duration || 0), 0);
      const totalCalories = weekLogs.reduce((sum, log) => sum + (log.actual_calories || 0), 0);

      setWeeklyStats({
        totalWorkouts: weekLogs.length,
        totalDuration,
        totalCalories,
        avgDuration: weekLogs.length > 0 ? Math.round(totalDuration / weekLogs.length) : 0,
      });
    } catch (error) {
      workoutLogger.error('Failed to fetch workout logs:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchWorkoutLogs();
  }, [fetchWorkoutLogs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchWorkoutLogs();
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return '오늘';
    }
    if (dateStr === yesterday.toISOString().split('T')[0]) {
      return '어제';
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${month}/${day} (${dayOfWeek})`;
  };

  // 기분 아이콘
  const getMoodIcon = (mood: string | null) => {
    switch (mood) {
      case 'energetic':
        return '💪';
      case 'relaxed':
        return '😌';
      case 'tired':
        return '😴';
      default:
        return '🏋️';
    }
  };

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      testID="workout-history-screen"
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
    >
      <DataStateWrapper
        isLoading={isLoading}
        isEmpty={logs.length === 0 && !weeklyStats}
        emptyConfig={{
          icon: <Text style={{ fontSize: 48 }}>🏃</Text>,
          title: '아직 운동 기록이 없어요',
          description: '오늘 첫 운동을 시작해보세요!',
        }}
        onRetry={handleRefresh}
      >
        {/* 이번 주 통계 */}
        {weeklyStats && (
          <Animated.View entering={staggeredEntry(0)} style={styles.statsSection}>
            <Text style={[styles.statsTitle, { color: colors.foreground }]}>이번 주 통계</Text>
            <View style={styles.statsGrid}>
              <GlassCard style={styles.statCard}>
                <Text style={[styles.statValue, { color: workoutColor }]}>
                  {weeklyStats.totalWorkouts}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>운동 횟수</Text>
              </GlassCard>
              <GlassCard style={styles.statCard}>
                <Text style={[styles.statValue, { color: workoutColor }]}>
                  {weeklyStats.totalDuration}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  총 시간 (분)
                </Text>
              </GlassCard>
              <GlassCard style={styles.statCard}>
                <Text style={[styles.statValue, { color: workoutColor }]}>
                  {weeklyStats.totalCalories}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  소모 칼로리
                </Text>
              </GlassCard>
            </View>
          </Animated.View>
        )}

        {/* 운동 기록 목록 */}
        <View style={styles.logsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>최근 기록</Text>

          {logs.map((log, index) => (
              <Animated.View
                key={log.id}
                entering={staggeredEntry(index + 1)}
              >
                <GlassCard style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logIcon}>{getMoodIcon(log.mood)}</Text>
                    <Text style={[styles.logDate, { color: colors.foreground }]}>
                      {formatDate(log.workout_date)}
                    </Text>
                  </View>

                  <View style={styles.logStats}>
                    {log.actual_duration && (
                      <View style={styles.logStatItem}>
                        <Text style={[styles.logStatValue, { color: colors.foreground }]}>
                          {log.actual_duration}분
                        </Text>
                        <Text style={[styles.logStatLabel, { color: colors.mutedForeground }]}>
                          시간
                        </Text>
                      </View>
                    )}
                    {log.actual_calories && (
                      <View style={styles.logStatItem}>
                        <Text style={[styles.logStatValue, { color: colors.foreground }]}>
                          {log.actual_calories}kcal
                        </Text>
                        <Text style={[styles.logStatLabel, { color: colors.mutedForeground }]}>
                          칼로리
                        </Text>
                      </View>
                    )}
                    {log.exercise_logs && log.exercise_logs.length > 0 && (
                      <View style={styles.logStatItem}>
                        <Text style={[styles.logStatValue, { color: colors.foreground }]}>
                          {log.exercise_logs.length}개
                        </Text>
                        <Text style={[styles.logStatLabel, { color: colors.mutedForeground }]}>
                          운동
                        </Text>
                      </View>
                    )}
                  </View>

                  {log.exercise_logs && log.exercise_logs.length > 0 && (
                    <View style={styles.exerciseList}>
                      {log.exercise_logs.slice(0, 4).map((ex, exIndex) => (
                        <View
                          key={exIndex}
                          style={[styles.exerciseChip, { backgroundColor: colors.muted }]}
                        >
                          <Text style={[styles.exerciseChipText, { color: colors.mutedForeground }]}>
                            {ex.exercise_name}
                          </Text>
                        </View>
                      ))}
                      {log.exercise_logs.length > 4 && (
                        <View
                          style={[styles.exerciseChip, { backgroundColor: colors.muted }]}
                        >
                          <Text style={[styles.exerciseChipText, { color: colors.mutedForeground }]}>
                            +{log.exercise_logs.length - 4}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {log.notes && (
                    <Text
                      style={[styles.logNotes, { color: colors.mutedForeground }]}
                      numberOfLines={2}
                    >
                      {log.notes}
                    </Text>
                  )}
                </GlassCard>
              </Animated.View>
            ))}
        </View>
      </DataStateWrapper>
    </ScreenContainer>
  );
}

// 이번 주 시작일 (월요일)
function getWeekStartDate(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 월요일 = 0
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

const styles = StyleSheet.create({
  statsSection: {
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: typography.size.xs,
  },
  logsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: 12,
  },
  logCard: {
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logIcon: {
    fontSize: typography.size['2xl'],
    marginRight: 10,
  },
  logDate: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  logStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  logStatItem: {
    alignItems: 'center',
  },
  logStatValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  logStatLabel: {
    fontSize: typography.size.xs,
  },
  exerciseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  exerciseChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseChipText: {
    fontSize: typography.size.xs,
  },
  logNotes: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
