/**
 * BodyProfileCard — 체형 분석 요약 카드
 *
 * 최신 체형 분석 결과를 진단 속성표로 표시.
 */
import { Ruler } from 'lucide-react-native';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING } from '../../lib/animations';
import { useTheme } from '../../lib/theme';
import { ReportAttrRow, ReportRowTable } from '../analysis/report';

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

interface BodyProfileCardProps {
  bodyType: string;
  height: number;
  weight: number;
  // 키/몸무게에서 파생 — 둘 중 하나라도 없으면 undefined → BMI UI를 생략한다
  bmi?: number;
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
  // BMI 파생값이 없으면(키/몸무게 미입력) BMI 관련 UI를 통째로 생략
  const bmiLabel = bmi != null ? getBmiLabel(bmi) : null;
  const bmiText = bmi != null ? bmi.toFixed(1) : null;
  const dateStr = `${createdAt.getMonth() + 1}/${createdAt.getDate()} 분석`;

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      testID={testID}
      accessibilityLabel={`체형 프로필: ${bodyLabel}${bmiText ? `, BMI ${bmiText}` : ''}`}
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

      {/* BMI는 건강 점수가 아니라 키·몸무게에서 파생된 원값이므로 채점 게이지로 바꾸지 않는다. */}
      <View style={{ marginTop: spacing.md }}>
        <ReportRowTable testID={testID ? `${testID}-attributes` : 'body-profile-attributes'}>
          <ReportAttrRow label="체형" value={bodyLabel} />
          <ReportAttrRow label="키" value={`${height}cm`} />
          <ReportAttrRow label="몸무게" value={`${weight}kg`} />
          {bmiText != null && bmiLabel != null ? (
            <ReportAttrRow label="BMI" value={`${bmiText} · ${bmiLabel}`} />
          ) : null}
        </ReportRowTable>
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
});
