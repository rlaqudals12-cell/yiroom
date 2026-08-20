import { Children, Fragment, type ComponentType, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/lib/theme';

import { ReportDivider } from './ReportDivider';
import { REPORT_COLORS } from './tokens';

interface ReportLineIconProps {
  color?: string;
  size?: number;
  strokeWidth?: number;
}

export interface ReportAttrRowProps {
  icon?: ComponentType<ReportLineIconProps>;
  label: string;
  value: ReactNode;
  enHint?: string;
  accessibilityLabel?: string;
  testID?: string;
}

/** 웹 AttrRow의 88px 라벨-값 기하를 RN에 옮긴 진단 속성행. */
export function ReportAttrRow({
  icon: Icon,
  label,
  value,
  enHint,
  accessibilityLabel,
  testID = 'report-attr-row',
}: ReportAttrRowProps): React.JSX.Element {
  const valueText = typeof value === 'string' || typeof value === 'number' ? String(value) : '';

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? `${label}, ${valueText}`.trim()}
      style={styles.row}
      testID={testID}
    >
      {Icon ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.iconAnchor}
        >
          <Icon color={REPORT_COLORS.mutedInk} size={14} strokeWidth={1.75} />
        </View>
      ) : null}
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueArea}>
        {typeof value === 'string' || typeof value === 'number' ? (
          <Text style={styles.value}>
            {value}
            {enHint ? <Text style={styles.enHint}> ({enHint})</Text> : null}
          </Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

export interface ReportRowTableProps {
  children: ReactNode;
  testID?: string;
}

/** 카드나 차트 대신 헤어라인으로만 묶는 진단 속성표. */
export function ReportRowTable({
  children,
  testID = 'report-row-table',
}: ReportRowTableProps): React.JSX.Element {
  const rows = Children.toArray(children);

  return (
    <View style={styles.table} testID={testID}>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <ReportDivider testID={`${testID}-divider-${index}`} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    width: '100%',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.smd,
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  iconAnchor: {
    alignItems: 'center',
    backgroundColor: REPORT_COLORS.wash,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  label: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    width: 84,
  },
  valueArea: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    lineHeight: 21,
  },
  enHint: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.normal,
  },
});
