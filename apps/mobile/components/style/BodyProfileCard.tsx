/**
 * BodyProfileCard — 체형 분석 요약 카드
 *
 * 최신 체형 분석 결과를 한눈에 표시.
 * ScoreGauge로 BMI, 체형 타입 + 키/몸무게 정보.
 */
import { Ruler } from 'lucide-react-native';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Badge } from '../ui/Badge';
import { ScoreGauge } from '../ui/ScoreGauge';
import { useTheme } from '../../lib/theme';
import { TIMING } from '../../lib/animations';

const BODY_TYPE_LABELS: Record<string, string> = {
  hourglass: '모래시계형',
  pear: '서양배형',
  apple: '사과형',
  rectangle: '직사각형',
  inverted_triangle: '역삼각형',
};

// BMI 범위별 라벨
function getBmiLabel(bmi: number): string {
  if (bmi < 18.5) return '저체중';
  if (bmi < 23) return '정상';
  if (bmi < 25) return '과체중';
  return '비만';
}

// BMI를 0-100 스코어로 변환 (정상 BMI 21이 100점)
function bmiToScore(bmi: number): number {
  const deviation = Math.abs(bmi - 21);
  return Math.max(0, Math.round(100 - deviation * 8));
}

interface BodyProfileCardProps {
  bodyType: string;
  height: number;
  weight: number;
  bmi: number;
  createdAt: Date;
  style?: ViewStyle;
  testID?: string;
}

export function BodyProfileCard({
  bodyType,
  height,
  weight,
  bmi,
  createdAt,
  style,
  testID,
}: BodyProfileCardProps): React.JSX.Element {
  const { colors, spacing, radii, typography, module: moduleColors, shadows } = useTheme();

  const bodyLabel = BODY_TYPE_LABELS[bodyType] ?? bodyType;
  const bmiLabel = getBmiLabel(bmi);
  const bmiScore = bmiToScore(bmi);
  const dateStr = `${createdAt.getMonth() + 1}/${createdAt.getDate()} 분석`;

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      testID={testID}
      accessibilityLabel={`체형 프로필: ${bodyLabel}, BMI ${bmi.toFixed(1)}`}
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
        <View style={[styles.iconBadge, { backgroundColor: moduleColors.body.light + '30' }]}>
          <Ruler size={18} color={moduleColors.body.dark} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
            }}
          >
            체형 프로필
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
            {dateStr}
          </Text>
        </View>
      </View>

      {/* 중앙: ScoreGauge + 체형 */}
      <View style={[styles.scoreRow, { marginTop: spacing.md }]}>
        <ScoreGauge
          score={bmiScore}
          max={100}
          color={moduleColors.body.base}
          label="BMI"
          size={88}
          strokeWidth={8}
          formatValue={() => bmi.toFixed(1)}
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
            {bodyLabel}
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              marginTop: 2,
            }}
          >
            BMI {bmi.toFixed(1)} ({bmiLabel})
          </Text>
        </View>
      </View>

      {/* 키/몸무게 뱃지 */}
      <View style={[styles.statsRow, { marginTop: spacing.sm + 4 }]}>
        <Badge variant="outline" style={{ marginRight: 6 }}>
          {`${height}cm`}
        </Badge>
        <Badge variant="outline" style={{ marginRight: 6 }}>
          {`${weight}kg`}
        </Badge>
        <Badge variant="outline">
          {bmiLabel}
        </Badge>
      </View>
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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
