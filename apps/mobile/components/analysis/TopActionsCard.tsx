/**
 * TopActionsCard — "그래서, 이렇게 하세요" 결론 카드 (ADR-111 표현 원칙 1: 결론 먼저, 근거는 접기)
 *
 * @description
 *   분석 결과 화면 첫 화면에서 사용자가 취할 행동 1~3개를 먼저 보여준다.
 *   내용은 반드시 이미 존재하는 결과 데이터에서 규칙 기반으로 조립한다
 *   (새 AI 호출·새 fetch 금지 — 정직성 원칙, lib/analysis/top-actions.ts).
 *   행동이 없으면 아무것도 렌더하지 않는다 (빈 배열 = 미노출).
 */
import { router } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import type { TopAction } from '@/lib/analysis/top-actions';
import { useTheme, spacing, radii, typography } from '@/lib/theme';

export interface TopActionsCardProps {
  /** 행동 1~3개 (3개 초과분은 렌더하지 않음) */
  actions: TopAction[];
  /** 카드 제목 (기본 "그래서, 이렇게 하세요") */
  heading?: string;
  /** 테스트 ID */
  testID?: string;
}

export function TopActionsCard({
  actions,
  heading = '그래서, 이렇게 하세요',
  testID = 'top-actions-card',
}: TopActionsCardProps): React.JSX.Element | null {
  const { colors, brand, isDark } = useTheme();

  // 빈 제목 제거 + 최대 3개 (정직성: 데이터 없는 행동은 렌더하지 않음)
  const visible = actions.filter((a) => a.title.trim().length > 0).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <View
      testID={testID}
      accessibilityLabel={heading}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? `${brand.primary}18` : `${brand.primary}0F`,
          borderColor: `${brand.primary}33`,
        },
      ]}
    >
      <Text style={[styles.heading, { color: colors.foreground }]}>{heading}</Text>
      <View style={styles.list}>
        {visible.map((action, i) => (
          <View key={`${action.title}-${i}`} style={styles.item}>
            <View style={[styles.badge, { backgroundColor: brand.primary }]}>
              <Text style={[styles.badgeText, { color: brand.primaryForeground }]}>{i + 1}</Text>
            </View>
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.foreground }]}>{action.title}</Text>
                {action.swatches && action.swatches.length > 0 && (
                  <View style={styles.swatchRow}>
                    {action.swatches.slice(0, 3).map((s) => (
                      <View
                        key={s.hex + s.name}
                        accessibilityLabel={s.name}
                        style={[styles.swatch, { backgroundColor: s.hex }]}
                        testID={`${testID}-swatch`}
                      />
                    ))}
                  </View>
                )}
              </View>
              {action.detail ? (
                <Text style={[styles.detail, { color: colors.mutedForeground }]}>
                  {action.detail}
                </Text>
              ) : null}
              {action.href ? (
                <Pressable
                  onPress={() => router.push(action.href as never)}
                  accessibilityRole="button"
                  accessibilityLabel={action.hrefLabel ?? '보러가기'}
                  style={styles.linkButton}
                  testID={`${testID}-link-${i}`}
                >
                  <Text style={[styles.linkText, { color: brand.primary }]}>
                    {action.hrefLabel ?? '보러가기'} →
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  heading: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.smx,
  },
  list: {
    gap: spacing.smd,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.smd,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    flexShrink: 1,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  detail: {
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  linkButton: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  linkText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
});
