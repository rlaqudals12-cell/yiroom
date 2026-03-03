/**
 * 체형 분석 비교 화면
 *
 * 체형 분석 결과의 비포/애프터를 비교한다.
 */
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { useTheme } from '@/lib/theme';

interface CompareMetric {
  label: string;
  before: string;
  after: string;
  improved: boolean;
}

// 예시 데이터 — 실제로는 분석 기록에서 가져옴
const MOCK_METRICS: CompareMetric[] = [
  { label: '어깨 비율', before: '1.3', after: '1.35', improved: true },
  { label: '허리-엉덩이 비율', before: '0.85', after: '0.82', improved: true },
  { label: '상체-하체 비율', before: '0.95', after: '0.97', improved: true },
  { label: '자세 점수', before: '72', after: '78', improved: true },
];

export default function BodyCompareScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, brand, spacing, radii, typography, status, module: moduleColors } = useTheme();

  return (
    <ScrollView
      testID="body-compare-screen"
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
        체형 변화 비교
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        이전 분석 결과와 비교합니다
      </Text>

      {/* 지표 비교 카드 */}
      <View style={{ gap: spacing.sm }}>
        {MOCK_METRICS.map((metric, index) => (
          <View
            key={index}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.xl,
              padding: spacing.md,
              borderLeftWidth: 3,
              borderLeftColor: moduleColors.body.base,
            }}
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.sm,
              }}
            >
              {metric.label}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginBottom: spacing.xxs }}>이전</Text>
                <Text style={{ fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.mutedForeground }}>{metric.before}</Text>
              </View>

              <Text style={{ fontSize: typography.size.lg, color: metric.improved ? status.success : status.error, marginHorizontal: spacing.sm }}>
                {metric.improved ? '▲' : '▼'}
              </Text>

              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginBottom: spacing.xxs }}>현재</Text>
                <Text style={{ fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.foreground }}>{metric.after}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* 다시 분석 버튼 */}
      <Pressable
        accessibilityLabel="체형 다시 분석하기"
        onPress={() => router.push('/(analysis)/body')}
        style={{
          backgroundColor: brand.primary,
          borderRadius: radii.xl,
          paddingVertical: spacing.smx,
          alignItems: 'center',
          marginTop: spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: brand.primaryForeground,
          }}
        >
          다시 분석하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}
