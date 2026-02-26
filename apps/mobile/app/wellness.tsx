/**
 * 웰니스 점수 상세 페이지
 * 종합 점수 + 영역별 분석 + 업적 + 개선 가이드
 */
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { TrendingUp, Target, Dumbbell, Apple, Sparkles } from 'lucide-react-native';

import { WellnessScoreRing, AchievementGrid } from '../components/profile';
import { useUserAnalyses, useWorkoutData, useNutritionData, useWellnessScore } from '../hooks';
import { useTheme, brand } from '../lib/theme';
import { spacing, radii, typography } from '../lib/theme';

// 영역별 개선 가이드
function getImprovementTips(
  analysisScore: number,
  workoutScore: number,
  nutritionScore: number,
): { area: string; icon: typeof TrendingUp; tips: string[] }[] {
  const guides: { area: string; icon: typeof TrendingUp; tips: string[] }[] = [];

  if (analysisScore < 100) {
    const missing: string[] = [];
    if (analysisScore < 40) missing.push('퍼스널 컬러', '피부', '체형');
    else if (analysisScore < 70) missing.push('추가 분석');
    else missing.push('마지막 분석');
    guides.push({
      area: '분석 완료도',
      icon: Sparkles,
      tips: [
        `${missing.join(', ')} 분석을 진행해보세요`,
        '분석 결과를 기반으로 맞춤 추천을 받을 수 있어요',
      ],
    });
  }

  if (workoutScore < 70) {
    guides.push({
      area: '운동 습관',
      icon: Dumbbell,
      tips: [
        workoutScore === 0
          ? '오늘부터 운동 기록을 시작해보세요'
          : '꾸준히 운동을 기록하면 점수가 올라가요',
        '일주일에 3일 이상 운동하면 큰 효과가 있어요',
      ],
    });
  }

  if (nutritionScore < 70) {
    guides.push({
      area: '영양 관리',
      icon: Apple,
      tips: [
        nutritionScore === 0
          ? '식단 기록을 시작해보세요'
          : '매일 식단을 기록하면 영양 밸런스를 파악할 수 있어요',
        '3일 이상 연속 기록하면 업적이 해제돼요',
      ],
    });
  }

  return guides;
}

export default function WellnessScorePage(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const { personalColor, skinAnalysis, bodyAnalysis } = useUserAnalyses();
  const { streak: workoutStreak } = useWorkoutData();
  const { streak: nutritionStreak } = useNutritionData();

  const { score, breakdown, level, achievements } = useWellnessScore({
    personalColor,
    skinAnalysis,
    bodyAnalysis,
    workoutStreak,
    nutritionStreak,
  });

  const improvementTips = getImprovementTips(
    breakdown.analysis,
    breakdown.workout,
    breakdown.nutrition,
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      testID="wellness-score-screen"
    >
      {/* 메인 점수 */}
      <WellnessScoreRing score={score} breakdown={breakdown} />

      {/* 레벨 정보 */}
      <View
        style={[
          styles.levelCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.levelHeader}>
          <Text style={[styles.levelTitle, { color: colors.foreground }]}>
            Lv.{level.level} {level.title}
          </Text>
          <Text style={[styles.levelXp, { color: colors.muted }]}>
            {level.xp} / {level.nextLevelXp} XP
          </Text>
        </View>
        <View style={[styles.xpBarBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.xpBarFill,
              {
                backgroundColor: brand.primary,
                width: `${Math.min((level.xp / level.nextLevelXp) * 100, 100)}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* 영역별 상세 */}
      <View
        style={[
          styles.breakdownCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          영역별 점수
        </Text>
        <BreakdownRow
          label="분석 완료"
          emoji="🔬"
          score={breakdown.analysis}
          weight="40%"
          colors={colors}
        />
        <BreakdownRow
          label="운동 습관"
          emoji="💪"
          score={breakdown.workout}
          weight="30%"
          colors={colors}
        />
        <BreakdownRow
          label="영양 관리"
          emoji="🥗"
          score={breakdown.nutrition}
          weight="30%"
          colors={colors}
        />
      </View>

      {/* 업적 */}
      <View
        style={[
          styles.achievementSection,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.achievementHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            업적
          </Text>
          <Text style={[styles.achievementCount, { color: colors.muted }]}>
            {unlockedCount} / {achievements.length}
          </Text>
        </View>
        <AchievementGrid achievements={achievements} />
      </View>

      {/* 개선 가이드 */}
      {improvementTips.length > 0 && (
        <View style={styles.guideSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: spacing.sm }]}>
            점수 올리기
          </Text>
          {improvementTips.map((guide) => {
            const Icon = guide.icon;
            return (
              <View
                key={guide.area}
                style={[
                  styles.guideCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.guideHeader}>
                  <Icon size={18} color={brand.primary} />
                  <Text style={[styles.guideArea, { color: colors.foreground }]}>
                    {guide.area}
                  </Text>
                </View>
                {guide.tips.map((tip, i) => (
                  <Text key={i} style={[styles.guideTip, { color: colors.muted }]}>
                    • {tip}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      )}

      {/* CTA */}
      {score < 100 && (
        <Pressable
          style={[styles.ctaButton, { backgroundColor: brand.primary }]}
          onPress={() => router.push('/(tabs)')}
        >
          <Target size={18} color={brand.primaryForeground} />
          <Text style={[styles.ctaText, { color: brand.primaryForeground }]}>
            점수 올리러 가기
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

// 영역별 점수 행 컴포넌트
function BreakdownRow({
  label,
  emoji,
  score,
  weight,
  colors,
}: {
  label: string;
  emoji: string;
  score: number;
  weight: string;
  colors: { foreground: string; muted: string; border: string };
}): React.JSX.Element {
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownLabel}>
        <Text style={styles.breakdownEmoji}>{emoji}</Text>
        <Text style={[styles.breakdownText, { color: colors.foreground }]}>
          {label}
        </Text>
        <Text style={[styles.breakdownWeight, { color: colors.muted }]}>
          ({weight})
        </Text>
      </View>
      <View style={styles.breakdownBarContainer}>
        <View style={[styles.breakdownBarBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.breakdownBarFill,
              {
                backgroundColor: brand.primary,
                width: `${score}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.breakdownScore, { color: colors.foreground }]}>
          {score}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  // 레벨 카드
  levelCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  levelTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  levelXp: {
    fontSize: typography.size.sm,
  },
  xpBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  // 영역별 상세
  breakdownCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  breakdownEmoji: {
    fontSize: 16,
  },
  breakdownText: {
    fontSize: typography.size.sm,
    fontWeight: '500',
  },
  breakdownWeight: {
    fontSize: typography.size.xs,
  },
  breakdownBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  breakdownBarBg: {
    height: 6,
    borderRadius: 3,
    flex: 1,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownScore: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    width: 28,
    textAlign: 'right',
  },
  // 업적
  achievementSection: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  achievementCount: {
    fontSize: typography.size.sm,
  },
  // 가이드
  guideSection: {
    marginTop: spacing.md,
  },
  guideCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  guideArea: {
    fontSize: typography.size.base,
    fontWeight: '600',
  },
  guideTip: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginBottom: 2,
    paddingLeft: spacing.lg,
  },
  // CTA
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    marginTop: spacing.lg,
  },
  ctaText: {
    fontSize: typography.size.base,
    fontWeight: '600',
  },
});
