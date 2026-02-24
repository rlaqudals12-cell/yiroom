/**
 * SkinProfileCard — 피부 분석 요약 카드
 *
 * 최신 피부 분석 결과를 한눈에 표시.
 * ScoreGauge로 전체 점수, 피부 타입 + 고민 배지.
 */
import { Droplets } from 'lucide-react-native';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Badge } from '../ui/Badge';
import { ScoreGauge } from '../ui/ScoreGauge';
import { useTheme } from '../../lib/theme';
import { TIMING } from '../../lib/animations';

const SKIN_TYPE_LABELS: Record<string, string> = {
  dry: '건성',
  oily: '지성',
  combination: '복합성',
  normal: '중성',
  sensitive: '민감성',
};

interface SkinProfileCardProps {
  skinType: string;
  overallScore: number;
  concerns: string[];
  createdAt: Date;
  style?: ViewStyle;
  testID?: string;
}

export function SkinProfileCard({
  skinType,
  overallScore,
  concerns,
  createdAt,
  style,
  testID,
}: SkinProfileCardProps): React.JSX.Element {
  const { colors, spacing, radii, typography, module: moduleColors, shadows } = useTheme();

  const skinLabel = SKIN_TYPE_LABELS[skinType] ?? skinType;
  const dateStr = `${createdAt.getMonth() + 1}/${createdAt.getDate()} 분석`;

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      testID={testID}
      accessibilityLabel={`피부 프로필: ${skinLabel}, 점수 ${overallScore}점`}
      style={[
        styles.card,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderColor: colors.border,
          padding: spacing.md,
        },
        style,
      ]}
    >
      {/* 헤더: 아이콘 + 타이틀 + 날짜 */}
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: moduleColors.skin.light + '30' }]}>
          <Droplets size={18} color={moduleColors.skin.dark} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
            }}
          >
            피부 프로필
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
            {dateStr}
          </Text>
        </View>
      </View>

      {/* 중앙: ScoreGauge + 피부타입 */}
      <View style={[styles.scoreRow, { marginTop: spacing.md }]}>
        <ScoreGauge
          score={overallScore}
          max={100}
          color={moduleColors.skin.base}
          label="피부 점수"
          size={88}
          strokeWidth={8}
          unit="점"
          animated
          delay={200}
          testID={testID ? `${testID}-gauge` : undefined}
        />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text
            style={{
              fontSize: typography.size.xl,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            {skinLabel}
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              marginTop: 2,
            }}
          >
            전체 점수 {overallScore}점
          </Text>
        </View>
      </View>

      {/* 고민 배지 */}
      {concerns.length > 0 && (
        <View style={[styles.concernsRow, { marginTop: spacing.sm + 4 }]}>
          {concerns.slice(0, 4).map((concern) => (
            <Badge
              key={concern}
              variant="outline"
              style={{ marginRight: 6, marginBottom: 4 }}
            >
              {concern}
            </Badge>
          ))}
          {concerns.length > 4 && (
            <Badge
              variant="outline"
              style={{ marginBottom: 4 }}
            >
              {`+${concerns.length - 4}`}
            </Badge>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  concernsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
