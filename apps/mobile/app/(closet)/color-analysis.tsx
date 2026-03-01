/**
 * 옷장 색상 분석 화면
 *
 * 옷장 아이템의 색상 분포를 분석하고 퍼스널컬러와의 조화를 확인한다.
 */
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { useTheme } from '@/lib/theme';

interface ColorGroup {
  name: string;
  hex: string;
  count: number;
  percentage: number;
  matchesPersonalColor: boolean;
}

// 예시 데이터
const MOCK_PERSONAL_COLOR = {
  season: '봄 웜톤',
  emoji: '🌸',
};

const MOCK_COLOR_GROUPS: ColorGroup[] = [
  { name: '블랙', hex: '#1A1A1A', count: 12, percentage: 28, matchesPersonalColor: false },
  { name: '화이트', hex: '#F5F5F5', count: 8, percentage: 19, matchesPersonalColor: true },
  { name: '베이지', hex: '#E8D5B7', count: 7, percentage: 17, matchesPersonalColor: true },
  { name: '네이비', hex: '#1B3A5C', count: 5, percentage: 12, matchesPersonalColor: false },
  { name: '피치', hex: '#FFDAB9', count: 4, percentage: 10, matchesPersonalColor: true },
  { name: '그레이', hex: '#9E9E9E', count: 3, percentage: 7, matchesPersonalColor: false },
  { name: '기타', hex: '#C0C0C0', count: 3, percentage: 7, matchesPersonalColor: false },
];

export default function ColorAnalysisScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, brand, spacing, radii, typography, status, module: moduleColors } = useTheme();

  const matchingCount = MOCK_COLOR_GROUPS.filter((c) => c.matchesPersonalColor).reduce((sum, c) => sum + c.count, 0);
  const totalCount = MOCK_COLOR_GROUPS.reduce((sum, c) => sum + c.count, 0);
  const matchRate = Math.round((matchingCount / totalCount) * 100);

  return (
    <ScrollView
      testID="color-analysis-screen"
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
        옷장 색상 분석
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        내 옷장의 색상 구성을 확인해보세요
      </Text>

      {/* 퍼스널컬러 매칭률 */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: spacing.lg,
          alignItems: 'center',
          marginBottom: spacing.lg,
          borderWidth: 1,
          borderColor: moduleColors.personalColor.base + '40',
        }}
      >
        <Text style={{ fontSize: 32 }}>{MOCK_PERSONAL_COLOR.emoji}</Text>
        <Text
          style={{
            fontSize: typography.size.lg,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
            marginTop: spacing.xs,
          }}
        >
          {MOCK_PERSONAL_COLOR.season}
        </Text>
        <Text
          style={{
            fontSize: typography.size['3xl'],
            fontWeight: typography.weight.bold,
            color: matchRate >= 50 ? status.success : status.warning,
            marginTop: spacing.sm,
          }}
        >
          {matchRate}%
        </Text>
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
          퍼스널컬러 조화율
        </Text>
      </View>

      {/* 색상 분포 */}
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        색상 분포
      </Text>

      {/* 색상 바 */}
      <View
        style={{
          flexDirection: 'row',
          height: 12,
          borderRadius: radii.full,
          overflow: 'hidden',
          marginBottom: spacing.md,
        }}
      >
        {MOCK_COLOR_GROUPS.map((group) => (
          <View
            key={group.name}
            style={{
              flex: group.percentage,
              backgroundColor: group.hex,
            }}
          />
        ))}
      </View>

      {/* 색상 리스트 */}
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {MOCK_COLOR_GROUPS.map((group) => (
          <View
            key={group.name}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: group.hex,
                borderWidth: 1,
                borderColor: colors.border,
                marginRight: spacing.smx,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                {group.name}
              </Text>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                {group.count}개 · {group.percentage}%
              </Text>
            </View>
            {group.matchesPersonalColor && (
              <View
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xxs,
                  borderRadius: radii.full,
                  backgroundColor: status.success + '20',
                }}
              >
                <Text style={{ fontSize: typography.size.xs, color: status.success, fontWeight: typography.weight.medium }}>
                  PC 매칭
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* 퍼스널컬러 분석 CTA */}
      <Pressable
        accessibilityLabel="퍼스널컬러 분석하기"
        onPress={() => router.push('/(analysis)/personal-color')}
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
          퍼스널컬러 다시 분석하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}
