/**
 * DiaryCalendar — 피부 일기 캘린더
 *
 * 월별 캘린더로 피부 상태 기록일 표시. 날짜별 상태 아이콘/색상 표시.
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface DayEntry {
  date: number;
  condition: 'good' | 'normal' | 'bad';
}

export interface DiaryCalendarProps {
  year: number;
  month: number;
  entries: DayEntry[];
  selectedDate?: number;
  onDatePress?: (date: number) => void;
  style?: ViewStyle;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function DiaryCalendar({
  year,
  month,
  entries,
  selectedDate,
  onDatePress,
  style,
}: DiaryCalendarProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, module, status } = useTheme();

  const entryMap = useMemo(() => {
    const map = new Map<number, DayEntry['condition']>();
    for (const e of entries) {
      map.set(e.date, e.condition);
    }
    return map;
  }, [entries]);

  const { firstDay, daysInMonth } = useMemo(() => {
    const first = new Date(year, month - 1, 1).getDay();
    const days = new Date(year, month, 0).getDate();
    return { firstDay: first, daysInMonth: days };
  }, [year, month]);

  const conditionColor = (cond: DayEntry['condition']): string => {
    switch (cond) {
      case 'good': return status.success;
      case 'normal': return status.warning;
      case 'bad': return status.error;
    }
  };

  const weeks: (number | null)[][] = useMemo(() => {
    const result: (number | null)[][] = [];
    let week: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      result.push(week);
    }
    return result;
  }, [firstDay, daysInMonth]);

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
      testID="diary-calendar"
      accessibilityLabel={`${year}년 ${month}월 피부 일기, ${entries.length}일 기록`}
    >
      {/* 헤더 */}
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        {year}년 {month}월
      </Text>

      {/* 요일 헤더 */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.dayCell}>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                fontWeight: typography.weight.medium,
                textAlign: 'center',
              }}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* 날짜 그리드 */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (day === null) {
              return <View key={`empty-${di}`} style={styles.dayCell} />;
            }
            const cond = entryMap.get(day);
            const isSelected = day === selectedDate;
            return (
              <Pressable
                key={day}
                style={[
                  styles.dayCell,
                  {
                    borderRadius: radii.sm,
                    backgroundColor: isSelected ? module.skin.base : 'transparent',
                  },
                ]}
                onPress={() => onDatePress?.(day)}
                accessibilityLabel={`${month}월 ${day}일${cond ? `, 상태: ${cond === 'good' ? '좋음' : cond === 'normal' ? '보통' : '나쁨'}` : ''}`}
              >
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: isSelected ? typography.weight.bold : typography.weight.normal,
                    color: isSelected ? '#FFFFFF' : colors.foreground,
                    textAlign: 'center',
                  }}
                >
                  {day}
                </Text>
                {cond && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: conditionColor(cond) },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    minHeight: 36,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
});
