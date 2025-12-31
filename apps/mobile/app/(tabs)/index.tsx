/**
 * 이룸 홈 화면
 * 대시보드 스타일 UI + 오늘 할 일 + 알림 요약
 */
import { View, Text, StyleSheet, ScrollView, useColorScheme, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useWorkoutData, useNutritionData, useUserAnalyses, calculateCalorieProgress } from '../../hooks';
import { useMemo } from 'react';

// 색상 상수
const COLORS = {
  primary: '#2e5afa',
  secondary: '#8b5cf6',
  workout: '#f97316',
  nutrition: '#22c55e',
  skin: '#ec4899',
  body: '#06b6d4',
  lightBg: '#f8f9fc',
  darkBg: '#0a0a0a',
  cardLight: '#ffffff',
  cardDark: '#1a1a1a',
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // 실제 데이터 훅
  const { streak: workoutStreak, isLoading: workoutLoading } = useWorkoutData();
  const { todaySummary, settings: nutritionSettings, isLoading: nutritionLoading } = useNutritionData();
  const { personalColor, skinAnalysis, bodyAnalysis, isLoading: analysisLoading } = useUserAnalyses();

  const greeting = getGreeting();
  const userName = user?.firstName || user?.username || '사용자';

  // 오늘의 요약 값 계산
  const workoutValue = workoutLoading ? '...' : workoutStreak?.currentStreak ? `${workoutStreak.currentStreak}일` : '—';
  const nutritionValue = nutritionLoading
    ? '...'
    : todaySummary && nutritionSettings
      ? `${calculateCalorieProgress(todaySummary.totalCalories || 0, nutritionSettings.dailyCalorieGoal)}%`
      : '—';
  const checkinValue = analysisLoading
    ? '...'
    : [personalColor, skinAnalysis, bodyAnalysis].filter(Boolean).length > 0
      ? `${[personalColor, skinAnalysis, bodyAnalysis].filter(Boolean).length}/3`
      : '—';

  // 오늘 할 일 목록 생성
  const todayTasks = useMemo(() => {
    const tasks: { id: string; label: string; completed: boolean; route: string }[] = [];

    // 운동 완료 여부
    tasks.push({
      id: 'workout',
      label: '오늘의 운동 완료',
      completed: workoutStreak?.lastWorkoutDate === new Date().toISOString().split('T')[0],
      route: '/(tabs)/records',
    });

    // 아침 식사 기록 (식사 횟수로 추정)
    tasks.push({
      id: 'meal',
      label: '식사 기록하기',
      completed: (todaySummary?.mealCount || 0) >= 1,
      route: '/(tabs)/records',
    });

    // 물 섭취 (division by zero 방지)
    const waterProgress = todaySummary && nutritionSettings && nutritionSettings.waterGoal > 0
      ? (todaySummary.waterIntake / nutritionSettings.waterGoal) * 100
      : 0;
    tasks.push({
      id: 'water',
      label: `물 마시기 (${Math.round(waterProgress)}%)`,
      completed: waterProgress >= 100,
      route: '/(tabs)/records',
    });

    // 분석 완료 (3가지 중 미완료 항목)
    if (!personalColor) {
      tasks.push({
        id: 'personal-color',
        label: '퍼스널 컬러 분석',
        completed: false,
        route: '/(analysis)/personal-color',
      });
    }

    return tasks;
  }, [workoutStreak, todaySummary, nutritionSettings, personalColor]);

  // 알림 요약 생성
  const notificationSummary = useMemo(() => {
    const notifications: { id: string; message: string; type: 'info' | 'warning' | 'success' }[] = [];

    // Streak 알림
    if (workoutStreak?.currentStreak && workoutStreak.currentStreak >= 3) {
      notifications.push({
        id: 'workout-streak',
        message: `🔥 운동 ${workoutStreak.currentStreak}일 연속 달성 중!`,
        type: 'success',
      });
    }

    // 분석 미완료 알림
    const analysisCount = [personalColor, skinAnalysis, bodyAnalysis].filter(Boolean).length;
    if (analysisCount < 3 && analysisCount > 0) {
      notifications.push({
        id: 'analysis-incomplete',
        message: `📊 분석 ${3 - analysisCount}개가 남아있어요`,
        type: 'info',
      });
    }

    // 식단 목표 달성 여부
    if (todaySummary && nutritionSettings) {
      const calorieProgress = calculateCalorieProgress(todaySummary.totalCalories, nutritionSettings.dailyCalorieGoal);
      if (calorieProgress >= 100) {
        notifications.push({
          id: 'calorie-goal',
          message: '✅ 오늘 칼로리 목표 달성!',
          type: 'success',
        });
      }
    }

    // 기본 메시지
    if (notifications.length === 0) {
      notifications.push({
        id: 'welcome',
        message: '👋 오늘도 이룸과 함께 건강한 하루를!',
        type: 'info',
      });
    }

    return notifications;
  }, [workoutStreak, personalColor, skinAnalysis, bodyAnalysis, todaySummary, nutritionSettings]);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.greeting, isDark && styles.textMuted]}>
            {greeting}
          </Text>
          <Text style={[styles.userName, isDark && styles.textLight]}>
            {isLoaded ? userName : '...'}님
          </Text>
        </View>

        {/* 알림 요약 */}
        <View style={styles.notificationSection}>
          {notificationSummary.map((notification) => (
            <View
              key={notification.id}
              style={[
                styles.notificationBanner,
                isDark && styles.cardDark,
                notification.type === 'success' && styles.notificationSuccess,
                notification.type === 'warning' && styles.notificationWarning,
              ]}
            >
              <Text style={[styles.notificationText, isDark && styles.textLight]}>
                {notification.message}
              </Text>
            </View>
          ))}
        </View>

        {/* 오늘의 요약 카드 */}
        <View style={[styles.summaryCard, isDark && styles.cardDark]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, isDark && styles.textLight]}>
              오늘의 요약
            </Text>
          </View>
          <View style={styles.summaryStats}>
            <StatItem label="운동" value={workoutValue} color={COLORS.workout} />
            <StatItem label="식단" value={nutritionValue} color={COLORS.nutrition} />
            <StatItem label="분석" value={checkinValue} color={COLORS.primary} />
          </View>
        </View>

        {/* 오늘 할 일 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            오늘 할 일
          </Text>
          <View style={[styles.todoCard, isDark && styles.cardDark]}>
            {todayTasks.map((task, index) => (
              <TodoItem
                key={task.id}
                label={task.label}
                completed={task.completed}
                isDark={isDark}
                onPress={() => router.push(task.route as never)}
                isLast={index === todayTasks.length - 1}
              />
            ))}
          </View>
        </View>

        {/* 퀵 액션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            빠른 시작
          </Text>
          <View style={styles.quickActions}>
            <QuickActionButton
              title="퍼스널 컬러"
              subtitle="나의 컬러 찾기"
              color={COLORS.primary}
              isDark={isDark}
              onPress={() => router.push('/(analysis)/personal-color')}
              completed={!!personalColor}
            />
            <QuickActionButton
              title="피부 분석"
              subtitle="AI 피부 진단"
              color={COLORS.skin}
              isDark={isDark}
              onPress={() => router.push('/(analysis)/skin')}
              completed={!!skinAnalysis}
            />
            <QuickActionButton
              title="체형 분석"
              subtitle="맞춤 스타일"
              color={COLORS.body}
              isDark={isDark}
              onPress={() => router.push('/(analysis)/body')}
              completed={!!bodyAnalysis}
            />
          </View>
        </View>

        {/* 모듈 카드 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            나의 여정
          </Text>
          <View style={styles.modules}>
            <ModuleCard
              title="운동"
              description="맞춤 운동 플랜으로 목표 달성"
              color={COLORS.workout}
              isDark={isDark}
              onPress={() => router.push('/(workout)/onboarding')}
            />
            <ModuleCard
              title="영양"
              description="균형 잡힌 식단으로 건강 관리"
              color={COLORS.nutrition}
              isDark={isDark}
              onPress={() => router.push('/(nutrition)/dashboard')}
            />
          </View>
        </View>

        {/* 팁 카드 */}
        <View style={[styles.tipCard, isDark && styles.cardDark]}>
          <Text style={[styles.tipLabel, { color: COLORS.secondary }]}>
            💡 오늘의 팁
          </Text>
          <Text style={[styles.tipText, isDark && styles.textLight]}>
            꾸준한 기록이 변화의 시작입니다.{'\n'}
            오늘도 이룸과 함께해요!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 인사말 생성
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '늦은 밤이에요';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

// 통계 아이템
function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// 할 일 아이템
function TodoItem({
  label,
  completed,
  isDark,
  onPress,
  isLast,
}: {
  label: string;
  completed: boolean;
  isDark: boolean;
  onPress: () => void;
  isLast: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.todoItem,
        !isLast && styles.todoItemBorder,
        !isLast && isDark && styles.todoItemBorderDark,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.todoCheckbox, completed && styles.todoCheckboxCompleted]}>
        {completed && <Text style={styles.todoCheckmark}>✓</Text>}
      </View>
      <Text
        style={[
          styles.todoLabel,
          isDark && styles.textLight,
          completed && styles.todoLabelCompleted,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// 퀵 액션 버튼
function QuickActionButton({
  title,
  subtitle,
  color,
  isDark,
  onPress,
  completed,
}: {
  title: string;
  subtitle: string;
  color: string;
  isDark: boolean;
  onPress: () => void;
  completed?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickAction,
        isDark && styles.cardDark,
        pressed && styles.pressed,
        completed && styles.quickActionCompleted,
      ]}
      onPress={onPress}
    >
      <View style={styles.quickActionHeader}>
        <View style={[styles.quickActionDot, { backgroundColor: color }]} />
        {completed && <Text style={styles.checkMark}>✓</Text>}
      </View>
      <Text style={[styles.quickActionTitle, isDark && styles.textLight]}>
        {title}
      </Text>
      <Text style={[styles.quickActionSubtitle, isDark && styles.textMuted]}>
        {completed ? '완료됨' : subtitle}
      </Text>
    </Pressable>
  );
}

// 모듈 카드
function ModuleCard({
  title,
  description,
  color,
  isDark,
  onPress,
}: {
  title: string;
  description: string;
  color: string;
  isDark: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.moduleCard,
        isDark && styles.cardDark,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.moduleAccent, { backgroundColor: color }]} />
      <View style={styles.moduleContent}>
        <Text style={[styles.moduleTitle, isDark && styles.textLight]}>
          {title}
        </Text>
        <Text style={[styles.moduleDescription, isDark && styles.textMuted]}>
          {description}
        </Text>
      </View>
      <Text style={[styles.moduleArrow, isDark && styles.textMuted]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  containerDark: {
    backgroundColor: COLORS.darkBg,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },

  // 알림 배너
  notificationSection: {
    marginBottom: 16,
    gap: 8,
  },
  notificationBanner: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notificationSuccess: {
    backgroundColor: '#dcfce7',
  },
  notificationWarning: {
    backgroundColor: '#fef3c7',
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
  },

  // 요약 카드
  summaryCard: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: COLORS.cardDark,
  },
  summaryHeader: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // 섹션
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },

  // 오늘 할 일
  todoCard: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  todoItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  todoItemBorderDark: {
    borderBottomColor: '#333',
  },
  todoCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoCheckboxCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  todoCheckmark: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  todoLabel: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  todoLabelCompleted: {
    color: '#999',
    textDecorationLine: 'line-through',
  },

  // 퀵 액션
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickActionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickActionCompleted: {
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  checkMark: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: '#666',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // 모듈 카드
  modules: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  moduleAccent: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 16,
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 13,
    color: '#666',
  },
  moduleArrow: {
    fontSize: 24,
    color: '#999',
    marginLeft: 8,
  },

  // 팁 카드
  tipCard: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tipLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});
