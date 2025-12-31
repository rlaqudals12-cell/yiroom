/**
 * R-1 통합 리포트 화면
 */
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// 샘플 리포트 데이터
const SAMPLE_REPORT = {
  user: {
    name: '이룸 사용자',
    memberSince: '2024.03',
  },
  personalColor: {
    season: '봄 웜톤',
    emoji: '🌸',
    confidence: 85,
    analyzedAt: '2024.12.01',
  },
  skin: {
    type: '복합성',
    score: 72,
    emoji: '✨',
    analyzedAt: '2024.12.02',
  },
  body: {
    type: '역삼각형',
    bmi: 22.5,
    emoji: '💪',
    analyzedAt: '2024.12.03',
  },
  workout: {
    type: '빌더',
    emoji: '🏋️',
    weeklyGoal: 4,
    completedThisWeek: 3,
    streak: 12,
  },
  nutrition: {
    avgCalories: 1850,
    goalCalories: 2000,
    emoji: '🥗',
  },
};

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 프로필 헤더 */}
        <View style={[styles.profileCard, isDark && styles.cardDark]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {SAMPLE_REPORT.user.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, isDark && styles.textLight]}>
              {SAMPLE_REPORT.user.name}
            </Text>
            <Text style={[styles.profileSince, isDark && styles.textMuted]}>
              {SAMPLE_REPORT.user.memberSince}부터 함께하고 있어요
            </Text>
          </View>
        </View>

        {/* Phase 1 분석 결과 */}
        <Text style={[styles.sectionLabel, isDark && styles.textMuted]}>
          나의 분석 결과
        </Text>

        <View style={styles.analysisGrid}>
          {/* 퍼스널 컬러 */}
          <TouchableOpacity
            style={[styles.analysisCard, isDark && styles.cardDark]}
            onPress={() => router.push('/(analysis)/personal-color')}
          >
            <Text style={styles.analysisEmoji}>{SAMPLE_REPORT.personalColor.emoji}</Text>
            <Text style={[styles.analysisType, isDark && styles.textMuted]}>
              퍼스널 컬러
            </Text>
            <Text style={[styles.analysisValue, isDark && styles.textLight]}>
              {SAMPLE_REPORT.personalColor.season}
            </Text>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {SAMPLE_REPORT.personalColor.confidence}%
              </Text>
            </View>
          </TouchableOpacity>

          {/* 피부 분석 */}
          <TouchableOpacity
            style={[styles.analysisCard, isDark && styles.cardDark]}
            onPress={() => router.push('/(analysis)/skin')}
          >
            <Text style={styles.analysisEmoji}>{SAMPLE_REPORT.skin.emoji}</Text>
            <Text style={[styles.analysisType, isDark && styles.textMuted]}>
              피부 타입
            </Text>
            <Text style={[styles.analysisValue, isDark && styles.textLight]}>
              {SAMPLE_REPORT.skin.type}
            </Text>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>
                {SAMPLE_REPORT.skin.score}점
              </Text>
            </View>
          </TouchableOpacity>

          {/* 체형 분석 */}
          <TouchableOpacity
            style={[styles.analysisCard, isDark && styles.cardDark]}
            onPress={() => router.push('/(analysis)/body')}
          >
            <Text style={styles.analysisEmoji}>{SAMPLE_REPORT.body.emoji}</Text>
            <Text style={[styles.analysisType, isDark && styles.textMuted]}>
              체형 타입
            </Text>
            <Text style={[styles.analysisValue, isDark && styles.textLight]}>
              {SAMPLE_REPORT.body.type}
            </Text>
            <View style={styles.bmiBadge}>
              <Text style={styles.bmiText}>
                BMI {SAMPLE_REPORT.body.bmi}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Phase 2 운동 현황 */}
        <Text style={[styles.sectionLabel, isDark && styles.textMuted]}>
          운동 현황
        </Text>

        <TouchableOpacity
          style={[styles.workoutCard, isDark && styles.cardDark]}
          onPress={() => router.push('/(workout)/onboarding')}
        >
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutEmoji}>{SAMPLE_REPORT.workout.emoji}</Text>
            <View style={styles.workoutInfo}>
              <Text style={[styles.workoutType, isDark && styles.textLight]}>
                {SAMPLE_REPORT.workout.type} 타입
              </Text>
              <Text style={[styles.workoutStreak, isDark && styles.textMuted]}>
                {SAMPLE_REPORT.workout.streak}일 연속 운동 중
              </Text>
            </View>
            <View style={styles.fireStreak}>
              <Text style={styles.fireEmoji}>🔥</Text>
              <Text style={styles.fireCount}>{SAMPLE_REPORT.workout.streak}</Text>
            </View>
          </View>

          <View style={styles.weeklyProgress}>
            <Text style={[styles.weeklyLabel, isDark && styles.textMuted]}>
              이번 주 운동
            </Text>
            <View style={styles.weekDots}>
              {[...Array(7)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.weekDot,
                    i < SAMPLE_REPORT.workout.completedThisWeek && styles.weekDotActive,
                    i < SAMPLE_REPORT.workout.weeklyGoal && styles.weekDotGoal,
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.weeklyCount, isDark && styles.textLight]}>
              {SAMPLE_REPORT.workout.completedThisWeek}/{SAMPLE_REPORT.workout.weeklyGoal}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 영양 현황 */}
        <Text style={[styles.sectionLabel, isDark && styles.textMuted]}>
          영양 현황
        </Text>

        <TouchableOpacity
          style={[styles.nutritionCard, isDark && styles.cardDark]}
          onPress={() => router.push('/(nutrition)/dashboard')}
        >
          <View style={styles.nutritionHeader}>
            <Text style={styles.nutritionEmoji}>{SAMPLE_REPORT.nutrition.emoji}</Text>
            <View style={styles.nutritionInfo}>
              <Text style={[styles.nutritionLabel, isDark && styles.textMuted]}>
                평균 일일 섭취량
              </Text>
              <Text style={[styles.nutritionValue, isDark && styles.textLight]}>
                {SAMPLE_REPORT.nutrition.avgCalories} kcal
              </Text>
            </View>
          </View>

          <View style={styles.calorieBar}>
            <View
              style={[
                styles.calorieBarFill,
                {
                  width: `${(SAMPLE_REPORT.nutrition.avgCalories / SAMPLE_REPORT.nutrition.goalCalories) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.calorieGoal, isDark && styles.textMuted]}>
            목표: {SAMPLE_REPORT.nutrition.goalCalories} kcal
          </Text>
        </TouchableOpacity>

        {/* 인사이트 */}
        <View style={[styles.insightCard, isDark && styles.cardDark]}>
          <Text style={styles.insightEmoji}>💡</Text>
          <Text style={[styles.insightTitle, isDark && styles.textLight]}>
            오늘의 인사이트
          </Text>
          <Text style={[styles.insightText, isDark && styles.textMuted]}>
            {SAMPLE_REPORT.personalColor.season}인 당신에게는 따뜻한 색상의 운동복이
            잘 어울려요. 오렌지, 코랄, 피치 톤을 추천합니다!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardDark: {
    backgroundColor: '#1a1a1a',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  profileSince: {
    fontSize: 13,
    color: '#666',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  analysisGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  analysisCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  analysisEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  analysisType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    textAlign: 'center',
    marginBottom: 8,
  },
  confidenceBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  scoreBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d97706',
  },
  bmiBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bmiText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutEmoji: {
    fontSize: 40,
  },
  workoutInfo: {
    flex: 1,
    marginLeft: 16,
  },
  workoutType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  workoutStreak: {
    fontSize: 13,
    color: '#666',
  },
  fireStreak: {
    alignItems: 'center',
  },
  fireEmoji: {
    fontSize: 24,
  },
  fireCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  weeklyProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  weeklyLabel: {
    fontSize: 13,
    color: '#666',
    width: 80,
  },
  weekDots: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  weekDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e5e5',
  },
  weekDotGoal: {
    borderWidth: 2,
    borderColor: '#fca5a5',
    backgroundColor: 'transparent',
  },
  weekDotActive: {
    backgroundColor: '#ef4444',
    borderWidth: 0,
  },
  weeklyCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    width: 40,
    textAlign: 'right',
  },
  nutritionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nutritionEmoji: {
    fontSize: 40,
  },
  nutritionInfo: {
    marginLeft: 16,
  },
  nutritionLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  calorieBar: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  calorieBarFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  calorieGoal: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  insightEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
