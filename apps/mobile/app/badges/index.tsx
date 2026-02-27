/**
 * 뱃지/업적 스크린
 * 분석 완료, 연속 기록 등 업적 표시
 */
import { router } from 'expo-router';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserAnalyses, useWorkoutData, useNutritionData } from '../../hooks';
import { useTheme } from '../../lib/theme';

interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
}

export default function BadgesScreen(): React.JSX.Element {
  const { colors, brand, spacing, radii, typography } = useTheme();
  const { personalColor, skinAnalysis, bodyAnalysis } = useUserAnalyses();
  const { streak: workoutStreak } = useWorkoutData();
  const { streak: nutritionStreak } = useNutritionData();

  // 뱃지 목록 (실 데이터 기반 earned 상태)
  const badges: Badge[] = [
    {
      id: 'pc-complete',
      emoji: '🌸',
      title: '컬러 탐험가',
      description: '퍼스널 컬러 분석을 완료했어요',
      earned: !!personalColor,
    },
    {
      id: 'skin-complete',
      emoji: '✨',
      title: '피부 관리사',
      description: '피부 분석을 완료했어요',
      earned: !!skinAnalysis,
    },
    {
      id: 'body-complete',
      emoji: '💪',
      title: '체형 분석가',
      description: '체형 분석을 완료했어요',
      earned: !!bodyAnalysis,
    },
    {
      id: 'all-analysis',
      emoji: '🏆',
      title: '분석 마스터',
      description: '모든 기본 분석을 완료했어요',
      earned: !!(personalColor && skinAnalysis && bodyAnalysis),
    },
    {
      id: 'workout-3',
      emoji: '🔥',
      title: '3일 연속',
      description: '3일 연속으로 운동했어요',
      earned: (workoutStreak?.currentStreak ?? 0) >= 3,
    },
    {
      id: 'workout-7',
      emoji: '⚡',
      title: '일주일 챔피언',
      description: '7일 연속으로 운동했어요',
      earned: (workoutStreak?.currentStreak ?? 0) >= 7,
    },
    {
      id: 'nutrition-3',
      emoji: '🥗',
      title: '꾸준한 식단',
      description: '3일 연속 식단을 기록했어요',
      earned: (nutritionStreak?.currentStreak ?? 0) >= 3,
    },
    {
      id: 'nutrition-7',
      emoji: '🍽️',
      title: '식단 마스터',
      description: '7일 연속 식단을 기록했어요',
      earned: (nutritionStreak?.currentStreak ?? 0) >= 7,
    },
  ];

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <SafeAreaView
      testID="badges-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.md + 4 }}>
        {/* 헤더 */}
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>🏅</Text>
          <Text
            style={{
              fontSize: typography.size.xl,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginBottom: 4,
            }}
          >
            나의 뱃지
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
            }}
          >
            {earnedCount}/{badges.length}개 획득
          </Text>
        </View>

        {/* 뱃지 그리드 */}
        <View style={styles.grid}>
          {badges.map((badge) => (
            <View
              key={badge.id}
              style={{
                width: '48%',
                backgroundColor: colors.card,
                borderRadius: radii.xl,
                padding: spacing.md,
                alignItems: 'center',
                opacity: badge.earned ? 1 : 0.4,
                marginBottom: spacing.sm + 4,
              }}
            >
              <Text style={{ fontSize: 40, marginBottom: spacing.sm }}>
                {badge.earned ? badge.emoji : '🔒'}
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  textAlign: 'center',
                  marginBottom: 4,
                }}
              >
                {badge.title}
              </Text>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                  lineHeight: 16,
                }}
              >
                {badge.description}
              </Text>
              {badge.earned && (
                <View
                  style={{
                    marginTop: spacing.sm,
                    backgroundColor: brand.primary + '20',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: radii.md,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '600', color: brand.primary }}>
                    획득 완료
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 분석 CTA */}
        {earnedCount < badges.length && (
          <Pressable
            style={{
              backgroundColor: brand.primary,
              borderRadius: radii.lg,
              padding: spacing.md,
              alignItems: 'center',
              marginTop: spacing.sm,
            }}
            onPress={() => router.back()}
          >
            <Text
              style={{
                color: brand.primaryForeground,
                fontSize: typography.size.base,
                fontWeight: typography.weight.semibold,
              }}
            >
              더 많은 뱃지를 획득해보세요!
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
