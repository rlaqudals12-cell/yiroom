/**
 * SkinProfileCard — 피부 분석 요약 카드
 *
 * 최신 피부 분석 결과를 진단지 속성표로 표시한다.
 */
import { Droplets } from 'lucide-react-native';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING } from '../../lib/animations';
import { useTheme } from '../../lib/theme';
import { ReportAttrRow, ReportInkNumber, ReportRowTable } from '../analysis/report';
import { Badge } from '../ui/Badge';

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
  /** true면 저장된 결과가 AI 예시/폴백에서 왔음을 고지한다. */
  usedFallback?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function SkinProfileCard({
  skinType,
  overallScore,
  concerns,
  createdAt,
  usedFallback,
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
      accessibilityLabel={`피부 프로필: ${skinLabel}, 기록된 원값 ${overallScore}`}
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

      {/* 원형 점수 게이지 대신 진단지 속성표 + 원값을 사용한다. */}
      <View style={{ marginTop: spacing.md }}>
        <ReportRowTable testID={testID ? `${testID}-readings` : 'skin-profile-readings'}>
          <ReportAttrRow label="피부 타입" value={skinLabel} />
          <ReportAttrRow
            accessibilityLabel={`피부 상태 기록 원값 ${overallScore}`}
            label="상태 원값"
            value={
              <ReportInkNumber
                accessibilityLabel={`피부 상태 기록 원값 ${overallScore}`}
                status="분석 당시 기록"
                testID={testID ? `${testID}-raw-value` : 'skin-profile-raw-value'}
                value={String(overallScore)}
              />
            }
          />
        </ReportRowTable>
        <Text style={[styles.caveat, { color: colors.mutedForeground, marginTop: spacing.xs }]}>
          촬영 환경에 따라 값이 달라질 수 있어요.
        </Text>
      </View>

      {usedFallback ? (
        <View
          style={[
            styles.fallbackBadge,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              borderRadius: radii.full,
              marginTop: spacing.sm,
            },
          ]}
          testID={testID ? `${testID}-fallback` : 'skin-profile-fallback'}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
            예시 결과 · 낮은 신뢰도
          </Text>
        </View>
      ) : null}

      {/* 고민 배지 */}
      {concerns.length > 0 && (
        <View style={[styles.concernsRow, { marginTop: spacing.sm + 4 }]}>
          {concerns.slice(0, 4).map((concern) => (
            <Badge
              key={concern}
              variant="outline"
              style={{ marginRight: 6, marginBottom: spacing.xs }}
            >
              {concern}
            </Badge>
          ))}
          {concerns.length > 4 && (
            <Badge variant="outline" style={{ marginBottom: spacing.xs }}>
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
  caveat: {
    fontSize: 11,
    lineHeight: 16,
  },
  fallbackBadge: {
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  concernsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
