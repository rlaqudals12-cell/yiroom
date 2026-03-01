/**
 * 연간 리뷰 화면
 *
 * 한 해 동안의 웰니스 여정을 요약하고 주요 성과를 보여준다.
 */
import { View, Text, ScrollView } from 'react-native';

import { useTheme } from '../../lib/theme';

interface YearlyStats {
  year: number;
  totalAnalyses: number;
  totalWorkouts: number;
  totalMeals: number;
  streakBest: number;
  badgesEarned: number;
  levelGained: number;
  topModule: string;
  highlights: { month: string; event: string; emoji: string }[];
  improvements: { label: string; before: number; after: number; unit: string }[];
}

const MOCK_YEARLY: YearlyStats = {
  year: 2025,
  totalAnalyses: 48,
  totalWorkouts: 156,
  totalMeals: 720,
  streakBest: 42,
  badgesEarned: 12,
  levelGained: 15,
  topModule: '운동',
  highlights: [
    { month: '1월', event: '이룸 시작!', emoji: '🎉' },
    { month: '3월', event: '첫 피부 분석', emoji: '🔬' },
    { month: '5월', event: '운동 30일 연속', emoji: '💪' },
    { month: '7월', event: '레벨 10 달성', emoji: '⭐' },
    { month: '9월', event: '뱃지 10개 수집', emoji: '🏅' },
    { month: '11월', event: '영양 균형왕', emoji: '🥗' },
  ],
  improvements: [
    { label: '피부 점수', before: 62, after: 78, unit: '점' },
    { label: '주간 운동 횟수', before: 1, after: 4, unit: '회' },
    { label: '영양 균형도', before: 55, after: 82, unit: '%' },
    { label: '수면 만족도', before: 3, after: 4, unit: '/5' },
  ],
};

export default function YearlyReviewScreen(): React.ReactElement {
  const { colors, brand, spacing, radii, typography, status, score: scoreColors } = useTheme();

  const review = MOCK_YEARLY;

  return (
    <ScrollView
      testID="yearly-review-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      {/* 연도 헤더 */}
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <Text style={{ fontSize: typography.size['4xl'], fontWeight: typography.weight.bold, color: brand.primary }}>
          {review.year}
        </Text>
        <Text style={{ fontSize: typography.size.xl, fontWeight: typography.weight.semibold, color: colors.foreground, marginTop: spacing.xs }}>
          나의 웰니스 여정
        </Text>
        <Text style={{ fontSize: typography.size.base, color: colors.mutedForeground, marginTop: spacing.xxs }}>
          한 해 동안의 변화를 돌아보세요
        </Text>
      </View>

      {/* 전체 통계 */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm, textAlign: 'center' }}>
          올해의 숫자
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {[
            { label: '분석 횟수', value: `${review.totalAnalyses}회`, emoji: '🔬' },
            { label: '운동 횟수', value: `${review.totalWorkouts}회`, emoji: '💪' },
            { label: '식사 기록', value: `${review.totalMeals}건`, emoji: '🍽️' },
            { label: '최장 연속', value: `${review.streakBest}일`, emoji: '🔥' },
            { label: '획득 뱃지', value: `${review.badgesEarned}개`, emoji: '🏅' },
            { label: '레벨 성장', value: `+${review.levelGained}`, emoji: '⭐' },
          ].map((stat) => (
            <View key={stat.label} style={{ width: '33.33%', alignItems: 'center', paddingVertical: spacing.sm }}>
              <Text style={{ fontSize: 24 }}>{stat.emoji}</Text>
              <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground, marginTop: spacing.xxs }}>
                {stat.value}
              </Text>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 개선 지표 */}
      <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
        성장 지표
      </Text>
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {review.improvements.map((item) => {
          const improved = item.after > item.before;
          const percent = Math.round(((item.after - item.before) / item.before) * 100);
          return (
            <View
              key={item.label}
              style={{
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                padding: spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                  {item.label}
                </Text>
                <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: improved ? status.success : status.warning }}>
                  {improved ? '+' : ''}{percent}%
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                  {item.before}{item.unit}
                </Text>
                <View style={{ flex: 1, height: 4, backgroundColor: colors.secondary, borderRadius: radii.full }}>
                  <View
                    style={{
                      height: 4,
                      width: `${Math.min(100, (item.after / (item.before + item.after)) * 100)}%`,
                      backgroundColor: improved ? status.success : status.warning,
                      borderRadius: radii.full,
                    }}
                  />
                </View>
                <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: improved ? status.success : colors.foreground }}>
                  {item.after}{item.unit}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* 하이라이트 타임라인 */}
      <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
        하이라이트
      </Text>
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {review.highlights.map((highlight, index) => (
          <View
            key={highlight.month}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.sm,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: brand.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.smx,
              }}
            >
              <Text style={{ fontSize: 18 }}>{highlight.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                {highlight.event}
              </Text>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>{highlight.month}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 가장 많이 사용한 모듈 */}
      <View
        style={{
          backgroundColor: brand.primary + '15',
          borderRadius: radii.lg,
          padding: spacing.lg,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>가장 많이 사용한 모듈</Text>
        <Text style={{ fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: brand.primary, marginTop: spacing.xs }}>
          {review.topModule}
        </Text>
      </View>
    </ScrollView>
  );
}
