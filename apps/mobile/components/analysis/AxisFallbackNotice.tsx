/**
 * 축별 Mock Fallback 정직 고지 (웹 AxisFallbackNotice의 RN 미러)
 *
 * 웹 통합 결과는 세션의 used_fallback을 읽어 "샘플(예시) 결과로 대체된 축"을
 * 명시하는데, 모바일은 persona.usedFallback 한 줄뿐이라 축 단위 폴백이 숨겨져
 * 있었다. design-contracts §3(AI 폴백은 정직하게 노출) 모바일 미충족 봉합.
 *
 * 문구는 웹 ko 카피(analysis.integratedResult.fallback.*)를 그대로 옮겼다.
 * (모바일은 ko 단독 선공개라 i18n 레이어 없이 상수로 둔다)
 *
 * @see apps/web/app/(main)/analysis/integrated/result/[sessionId]/_components/AxisFallbackNotice.tsx
 * @see docs/adr/ADR-007-mock-fallback-strategy.md
 */

import { AlertTriangle } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import type { AxisCode } from '@/lib/api';
import { useTheme, typography, radii, spacing } from '@/lib/theme';

// AxisCode → 축 라벨. 알 수 없는 코드는 키가 없어 걸러진다.
const AXIS_LABEL: Record<AxisCode, string> = {
  personal_color: '퍼스널컬러',
  skin: '피부',
  body: '체형',
  hair: '헤어',
  makeup: '메이크업',
};

// 웹 messages/ko.json analysis.integratedResult.fallback.* 원문 (변형 금지 — 고지 문구)
const FALLBACK_TITLE = '일부 축은 샘플 결과예요';
const FALLBACK_BODY_AFTER_LABELS =
  '축은 AI 분석 서비스를 일시적으로 이용할 수 없어 샘플(예시) 결과를 표시하고 있어요. 실제 분석 결과가 아니므로 참고용으로만 봐주세요.';
const FALLBACK_RETRY_HINT = '잠시 후 해당 축을 다시 분석하시면 정확한 결과를 받으실 수 있어요.';

export interface AxisFallbackNoticeProps {
  /** Mock Fallback이 적용된 축 코드 배열 (세션 used_fallback) */
  usedFallback: AxisCode[] | undefined;
  testID?: string;
}

/**
 * Mock Fallback 축이 하나라도 있으면 샘플 고지를 표시한다.
 * (없으면 null — 정상 분석만 있으면 미노출)
 *
 * 왜 방어적으로 받나: 결과가 payload 쿼리(JSON.parse)로도 들어와 런타임 형상이
 * 타입과 어긋날 수 있다. 배열이 아니거나 알 수 없는 축 코드면 조용히 걸러낸다.
 */
export function AxisFallbackNotice({
  usedFallback,
  testID = 'axis-fallback-notice',
}: AxisFallbackNoticeProps): React.JSX.Element | null {
  const { colors, isDark } = useTheme();

  const labels = (Array.isArray(usedFallback) ? usedFallback : [])
    .map((axis) => AXIS_LABEL[axis])
    .filter((label): label is string => Boolean(label));

  if (labels.length === 0) return null;

  // 톤 절제(웹 배치 D와 동일): amber 벽면 대신 카드 지면 + 아이콘만 상태색
  // — verdict(나 프로필) 아래로 격하된 보조 고지라 카드 문법에 맞춘다.
  const iconColor = isDark ? '#FBBF24' : '#D97706';

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID={testID}
      accessibilityRole="alert"
    >
      <View style={styles.row}>
        <AlertTriangle size={16} color={iconColor} style={styles.icon} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.foreground }]}>{FALLBACK_TITLE}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            <Text style={styles.labels}>{labels.join(', ')}</Text> {FALLBACK_BODY_AFTER_LABELS}
          </Text>
          <Text style={[styles.retryHint, { color: colors.mutedForeground }]}>
            {FALLBACK_RETRY_HINT}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  icon: {
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  body: {
    fontSize: typography.size.xs,
    lineHeight: typography.size.xs * 1.5,
  },
  labels: {
    fontWeight: '700',
  },
  retryHint: {
    fontSize: typography.size.xs,
    lineHeight: typography.size.xs * 1.5,
  },
});
