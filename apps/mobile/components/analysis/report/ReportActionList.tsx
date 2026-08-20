import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TopAction } from '@/lib/analysis';
import { spacing, typography } from '@/lib/theme';

import { ReportDivider } from './ReportDivider';
import { ReportInkNumber } from './ReportInkNumber';
import { REPORT_COLORS } from './tokens';

export interface ReportActionListProps {
  actions: TopAction[];
  heading?: string;
  testID?: string;
}

/** 데이터가 실제로 준 행동만 진단지 처방 행으로 노출한다. */
export function ReportActionList({
  actions,
  heading = '먼저 해볼 일',
  testID = 'report-action-list',
}: ReportActionListProps): React.JSX.Element | null {
  const visible = actions.filter((action) => action.title.trim().length > 0).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.heading}>{heading}</Text>
      {visible.map((action, index) => {
        const content = (
          <View style={styles.row}>
            <ReportInkNumber
              accessibilityLabel={`${index + 1}번째 행동`}
              testID={`${testID}-number-${index}`}
              value={String(index + 1).padStart(2, '0')}
            />
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{action.title}</Text>
                {action.swatches && action.swatches.length > 0 ? (
                  <View style={styles.swatches}>
                    {action.swatches.slice(0, 3).map((swatch) => (
                      <View
                        accessibilityLabel={swatch.name}
                        key={`${swatch.hex}-${swatch.name}`}
                        style={[styles.swatch, { backgroundColor: swatch.hex }]}
                        testID={`${testID}-swatch`}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
              {action.detail ? <Text style={styles.detail}>{action.detail}</Text> : null}
              {action.href ? (
                <Text style={styles.linkLabel}>{action.hrefLabel ?? '보러가기'}</Text>
              ) : null}
            </View>
            {action.href ? <ChevronRight color={REPORT_COLORS.mutedInk} size={16} /> : null}
          </View>
        );

        return (
          <View key={`${action.title}-${index}`}>
            {index > 0 ? <ReportDivider testID={`${testID}-divider-${index}`} /> : null}
            {action.href ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={action.hrefLabel ?? action.title}
                onPress={() => router.push(action.href as never)}
                testID={`${testID}-link-${index}`}
              >
                {content}
              </Pressable>
            ) : (
              content
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  heading: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.smd,
    minHeight: 56,
    paddingVertical: spacing.smd,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    color: REPORT_COLORS.ink,
    flexShrink: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    lineHeight: 21,
  },
  detail: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  linkLabel: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.xs,
    textDecorationLine: 'underline',
  },
  swatches: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  swatch: {
    borderColor: REPORT_COLORS.rule,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    height: 16,
    width: 16,
  },
});
