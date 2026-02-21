/**
 * W-1 운동 히스토리 화면
 * 과거 운동 기록 목록 및 통계
 */
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

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
  const { colors, isDark } = useTheme();
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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.foreground}
          />
        }
      >
        {/* 이번 주 통계 */}
        {weeklyStats && (
          <View style={styles.statsSection}>
            <Text style={[styles.statsTitle, isDark && styles.textLight]}>이번 주 통계</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, isDark && styles.statCardDark]}>
                <Text style={styles.statValue}>{weeklyStats.totalWorkouts}</Text>
                <Text style={[styles.statLabel, isDark && styles.textMuted]}>운동 횟수</Text>
              </View>
              <View style={[styles.statCard, isDark && styles.statCardDark]}>
                <Text style={styles.statValue}>{weeklyStats.totalDuration}</Text>
                <Text style={[styles.statLabel, isDark && styles.textMuted]}>총 시간 (분)</Text>
              </View>
              <View style={[styles.statCard, isDark && styles.statCardDark]}>
                <Text style={styles.statValue}>{weeklyStats.totalCalories}</Text>
                <Text style={[styles.statLabel, isDark && styles.textMuted]}>소모 칼로리</Text>
              </View>
            </View>
          </View>
        )}

        {/* 운동 기록 목록 */}
        <View style={styles.logsSection}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>최근 기록</Text>

          {logs.length === 0 ? (
            <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
              <Text style={styles.emptyIcon}>🏃</Text>
              <Text style={[styles.emptyText, isDark && styles.textMuted]}>
                아직 운동 기록이 없어요
              </Text>
              <Text style={[styles.emptySubtext, isDark && styles.textMuted]}>
                오늘 첫 운동을 시작해보세요!
              </Text>
            </View>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={[styles.logCard, isDark && styles.logCardDark]}>
                <View style={styles.logHeader}>
                  <Text style={styles.logIcon}>{getMoodIcon(log.mood)}</Text>
                  <Text style={[styles.logDate, isDark && styles.textLight]}>
                    {formatDate(log.workout_date)}
                  </Text>
                </View>

                <View style={styles.logStats}>
                  {log.actual_duration && (
                    <View style={styles.logStatItem}>
                      <Text style={[styles.logStatValue, isDark && styles.textLight]}>
                        {log.actual_duration}분
                      </Text>
                      <Text style={[styles.logStatLabel, isDark && styles.textMuted]}>시간</Text>
                    </View>
                  )}
                  {log.actual_calories && (
                    <View style={styles.logStatItem}>
                      <Text style={[styles.logStatValue, isDark && styles.textLight]}>
                        {log.actual_calories}kcal
                      </Text>
                      <Text style={[styles.logStatLabel, isDark && styles.textMuted]}>칼로리</Text>
                    </View>
                  )}
                  {log.exercise_logs && log.exercise_logs.length > 0 && (
                    <View style={styles.logStatItem}>
                      <Text style={[styles.logStatValue, isDark && styles.textLight]}>
                        {log.exercise_logs.length}개
                      </Text>
                      <Text style={[styles.logStatLabel, isDark && styles.textMuted]}>운동</Text>
                    </View>
                  )}
                </View>

                {log.exercise_logs && log.exercise_logs.length > 0 && (
                  <View style={styles.exerciseList}>
                    {log.exercise_logs.slice(0, 4).map((ex, index) => (
                      <View key={index} style={styles.exerciseChip}>
                        <Text style={[styles.exerciseChipText, isDark && styles.textMuted]}>
                          {ex.exercise_name}
                        </Text>
                      </View>
                    ))}
                    {log.exercise_logs.length > 4 && (
                      <View style={styles.exerciseChip}>
                        <Text style={[styles.exerciseChipText, isDark && styles.textMuted]}>
                          +{log.exercise_logs.length - 4}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {log.notes && (
                  <Text style={[styles.logNotes, isDark && styles.textMuted]} numberOfLines={2}>
                    {log.notes}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
    padding: 20,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statCardDark: {
    backgroundColor: '#1a1a1a',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  logsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyCardDark: {
    backgroundColor: '#1a1a1a',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  logCardDark: {
    backgroundColor: '#1a1a1a',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  logDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  logStatLabel: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  exerciseChipText: {
    fontSize: 12,
    color: '#666',
  },
  logNotes: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
