/**
 * 옷장 통계 화면
 *
 * 옷장 아이템의 착용 빈도, 카테고리 분포, 색상 분포 등을 시각화한다.
 */
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { useTheme } from '@/lib/theme';

interface CategoryStat {
  category: string;
  emoji: string;
  count: number;
  percentage: number;
}

interface WearStat {
  label: string;
  count: number;
  description: string;
}

// 예시 데이터
const MOCK_TOTAL = 42;

const MOCK_CATEGORIES: CategoryStat[] = [
  { category: '상의', emoji: '👕', count: 15, percentage: 36 },
  { category: '하의', emoji: '👖', count: 10, percentage: 24 },
  { category: '아우터', emoji: '🧥', count: 6, percentage: 14 },
  { category: '신발', emoji: '👟', count: 5, percentage: 12 },
  { category: '가방', emoji: '👜', count: 3, percentage: 7 },
  { category: '액세서리', emoji: '💍', count: 3, percentage: 7 },
];

const MOCK_WEAR_STATS: WearStat[] = [
  { label: '자주 입는 옷', count: 8, description: '5회 이상 착용' },
  { label: '가끔 입는 옷', count: 20, description: '1~4회 착용' },
  { label: '안 입는 옷', count: 14, description: '0회 착용' },
];

export default function WardrobeStatsScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, brand, spacing, radii, typography, status, module: moduleColors, score: scoreColors } = useTheme();

  const getWearColor = (index: number): string => {
    const wearColors = [scoreColors.excellent, scoreColors.caution, scoreColors.poor];
    return wearColors[index] ?? colors.mutedForeground;
  };

  return (
    <ScrollView
      testID="wardrobe-stats-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        옷장 통계
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        총 {MOCK_TOTAL}개 아이템
      </Text>

      {/* 카테고리 분포 */}
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        카테고리 분포
      </Text>
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {MOCK_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.category}
            accessibilityLabel={`${cat.category} ${cat.count}개, ${cat.percentage}%`}
            onPress={() => router.push({ pathname: '/(closet)/category/[slug]' as never, params: { slug: cat.category } })}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ fontSize: typography.size.lg, marginRight: spacing.xs }}>{cat.emoji}</Text>
              <Text style={{ flex: 1, fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                {cat.category}
              </Text>
              <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                {cat.count}개
              </Text>
            </View>
            {/* 프로그레스 바 */}
            <View style={{ height: 6, backgroundColor: colors.secondary, borderRadius: radii.full }}>
              <View
                style={{
                  height: 6,
                  width: `${cat.percentage}%`,
                  backgroundColor: moduleColors.body.base,
                  borderRadius: radii.full,
                }}
              />
            </View>
          </Pressable>
        ))}
      </View>

      {/* 착용 빈도 */}
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        착용 빈도
      </Text>
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {MOCK_WEAR_STATS.map((stat, index) => (
          <View
            key={stat.label}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
              borderLeftWidth: 3,
              borderLeftColor: getWearColor(index),
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                  {stat.label}
                </Text>
                <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                  {stat.description}
                </Text>
              </View>
              <Text style={{ fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: getWearColor(index) }}>
                {stat.count}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* 안 입는 옷 정리 CTA */}
      <Pressable
        accessibilityLabel="안 입는 옷 정리하기"
        onPress={() => router.push('/(closet)/gallery')}
        style={{
          backgroundColor: brand.primary,
          borderRadius: radii.lg,
          paddingVertical: spacing.smx,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: brand.primaryForeground,
          }}
        >
          안 입는 옷 정리하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}
