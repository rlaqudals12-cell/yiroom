/**
 * RoutineTimeline — 루틴 타임라인
 *
 * 하루 스킨케어 루틴을 시간순으로 표시. 아침/저녁 루틴 타임라인.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface TimelineEntry {
  id: string;
  time: string;
  label: string;
  routineTime: 'morning' | 'evening';
  completed: boolean;
}

export interface RoutineTimelineProps {
  entries: TimelineEntry[];
  style?: ViewStyle;
}

export function RoutineTimeline({
  entries,
  style,
}: RoutineTimelineProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, module, status } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      testID="routine-timeline"
      accessibilityLabel={`루틴 타임라인, ${entries.length}개 항목`}
    >
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        오늘의 루틴
      </Text>

      {entries.map((entry, idx) => (
        <View
          key={entry.id}
          style={styles.entryRow}
          accessibilityLabel={`${entry.time} ${entry.label}${entry.completed ? ', 완료' : ''}`}
        >
          {/* 타임라인 라인 */}
          <View style={styles.timeline}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: entry.completed ? module.skin.base : colors.muted,
                  borderColor: entry.completed ? module.skin.base : colors.border,
                },
              ]}
            />
            {idx < entries.length - 1 && (
              <View
                style={[
                  styles.line,
                  { backgroundColor: colors.border },
                ]}
              />
            )}
          </View>

          {/* 내용 */}
          <View style={[styles.content, { marginLeft: spacing.sm, paddingBottom: spacing.sm }]}>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
              }}
            >
              {entry.time}
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.medium,
                color: entry.completed ? colors.mutedForeground : colors.foreground,
                marginTop: spacing.xxs,
              }}
            >
              {entry.routineTime === 'morning' ? '🌅' : '🌙'} {entry.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  entryRow: {
    flexDirection: 'row',
  },
  timeline: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  line: {
    width: 2,
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
