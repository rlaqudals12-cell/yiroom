/**
 * 오늘 요약 위젯 미리보기
 * iOS/Android 위젯에 표시될 UI 미러링
 */

import { View, Text, StyleSheet, useColorScheme } from 'react-native';

import { TodaySummaryData, DEFAULT_SUMMARY_DATA } from '../../lib/widgets/types';

interface TodaySummaryWidgetProps {
  data?: TodaySummaryData;
  size?: 'small' | 'medium' | 'large';
}

export function TodaySummaryWidget({
  data = DEFAULT_SUMMARY_DATA,
  size = 'medium',
}: TodaySummaryWidgetProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // 진행률 계산
  const waterProgress = Math.min((data.waterIntake / data.waterGoal) * 100, 100);
  const caloriesProgress = Math.min((data.caloriesConsumed / data.caloriesGoal) * 100, 100);

  // 소형 위젯
  if (size === 'small') {
    return (
      <View style={[styles.containerSmall, isDark && styles.containerDark]}>
        <Text style={[styles.streakText, isDark && styles.textLight]}>
          {data.currentStreak > 0 ? `${data.currentStreak}일 연속` : '오늘 시작!'}
        </Text>
        <View style={styles.iconRow}>
          <Text style={styles.statusIcon}>{data.workoutCompleted ? '✅' : '🏃'}</Text>
          <Text style={styles.statusIcon}>{waterProgress >= 100 ? '✅' : '💧'}</Text>
        </View>
      </View>
    );
  }

  // 중형 위젯
  if (size === 'medium') {
    return (
      <View style={[styles.containerMedium, isDark && styles.containerDark]}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.textLight]}>오늘의 이룸</Text>
          {data.currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>{data.currentStreak}일</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          {/* 운동 */}
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>{data.workoutCompleted ? '✅' : '🏃'}</Text>
            <Text style={[styles.statLabel, isDark && styles.textMuted]}>운동</Text>
            <Text style={[styles.statValue, isDark && styles.textLight]}>
              {data.workoutCompleted ? `${data.workoutMinutes}분` : '대기'}
            </Text>
          </View>

          {/* 물 */}
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>💧</Text>
            <Text style={[styles.statLabel, isDark && styles.textMuted]}>물</Text>
            <Text style={[styles.statValue, isDark && styles.textLight]}>
              {(data.waterIntake / 1000).toFixed(1)}L
            </Text>
          </View>

          {/* 칼로리 */}
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🍽️</Text>
            <Text style={[styles.statLabel, isDark && styles.textMuted]}>칼로리</Text>
            <Text style={[styles.statValue, isDark && styles.textLight]}>
              {data.caloriesConsumed}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // 대형 위젯
  return (
    <View style={[styles.containerLarge, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textLight]}>오늘의 이룸</Text>
        {data.currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeText}>{data.currentStreak}일 연속</Text>
          </View>
        )}
      </View>

      {/* 운동 */}
      <View style={styles.progressRow}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, isDark && styles.textLight]}>🏃 운동</Text>
          <Text style={[styles.progressValue, isDark && styles.textMuted]}>
            {data.workoutCompleted ? `${data.workoutMinutes}분 완료` : '아직 안 함'}
          </Text>
        </View>
        <View style={[styles.progressBar, isDark && styles.progressBarDark]}>
          <View
            style={[
              styles.progressFill,
              { width: data.workoutCompleted ? '100%' : '0%' },
              data.workoutCompleted && styles.progressComplete,
            ]}
          />
        </View>
      </View>

      {/* 물 섭취 */}
      <View style={styles.progressRow}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, isDark && styles.textLight]}>💧 물 섭취</Text>
          <Text style={[styles.progressValue, isDark && styles.textMuted]}>
            {data.waterIntake}ml / {data.waterGoal}ml
          </Text>
        </View>
        <View style={[styles.progressBar, isDark && styles.progressBarDark]}>
          <View
            style={[
              styles.progressFill,
              styles.progressWater,
              { width: `${waterProgress}%` },
              waterProgress >= 100 && styles.progressComplete,
            ]}
          />
        </View>
      </View>

      {/* 칼로리 */}
      <View style={styles.progressRow}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, isDark && styles.textLight]}>🍽️ 칼로리</Text>
          <Text style={[styles.progressValue, isDark && styles.textMuted]}>
            {data.caloriesConsumed} / {data.caloriesGoal} kcal
          </Text>
        </View>
        <View style={[styles.progressBar, isDark && styles.progressBarDark]}>
          <View
            style={[
              styles.progressFill,
              styles.progressCalories,
              { width: `${caloriesProgress}%` },
              caloriesProgress > 100 && styles.progressOver,
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerSmall: {
    width: 155,
    height: 155,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerMedium: {
    width: 329,
    height: 155,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerLarge: {
    width: 329,
    height: 345,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  streakBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  streakText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statusIcon: {
    fontSize: 28,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  progressRow: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  progressValue: {
    fontSize: 13,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarDark: {
    backgroundColor: '#333',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  progressWater: {
    backgroundColor: '#3b82f6',
  },
  progressCalories: {
    backgroundColor: '#f59e0b',
  },
  progressComplete: {
    backgroundColor: '#22c55e',
  },
  progressOver: {
    backgroundColor: '#ef4444',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
