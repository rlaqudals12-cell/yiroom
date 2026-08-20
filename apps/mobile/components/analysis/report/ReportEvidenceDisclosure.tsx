import { ChevronDown } from 'lucide-react-native';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/lib/theme';

import { ReportDivider } from './ReportDivider';
import { REPORT_COLORS } from './tokens';

export interface ReportEvidenceDisclosureProps {
  title: string;
  summary?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  testID?: string;
}

/** 결론은 닫힌 상태에서도 한 줄 남기고, 근거만 기본 접힘으로 관리한다. */
export function ReportEvidenceDisclosure({
  title,
  summary,
  children,
  defaultExpanded = false,
  onToggle,
  testID = 'report-evidence-disclosure',
}: ReportEvidenceDisclosureProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    onToggle?.(next);
  }, [expanded, onToggle]);

  return (
    <View style={styles.container} testID={testID}>
      <ReportDivider testID={`${testID}-divider`} />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}${summary && !expanded ? `, ${summary}` : ''}`}
        onPress={handleToggle}
        style={styles.trigger}
        testID={`${testID}-trigger`}
      >
        <View style={styles.headingArea}>
          <Text style={styles.title}>{title}</Text>
          {summary && !expanded ? (
            <Text numberOfLines={1} style={styles.summary}>
              {summary}
            </Text>
          ) : null}
        </View>
        <ChevronDown
          accessibilityElementsHidden
          color={REPORT_COLORS.mutedInk}
          importantForAccessibility="no-hide-descendants"
          size={18}
          strokeWidth={1.75}
          style={expanded ? styles.chevronExpanded : undefined}
        />
      </Pressable>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  trigger: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: spacing.sm,
  },
  headingArea: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
    paddingRight: spacing.md,
  },
  title: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  summary: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  content: {
    borderLeftColor: REPORT_COLORS.rule,
    borderLeftWidth: 1,
    marginBottom: spacing.md,
    paddingLeft: spacing.md,
    paddingTop: spacing.sm,
  },
});
