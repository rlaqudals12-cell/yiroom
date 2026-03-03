/**
 * FastingTimer — 단식/공복 타이머
 *
 * 간헐적 단식 시간 추적 + 진행률 표시.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface FastingTimerProps {
  /** 단식 시작 시간 (ISO) */
  startTime?: string;
  /** 목표 시간 (시간 단위, 기본 16) */
  targetHours?: number;
  /** 시작/종료 콜백 */
  onToggle?: (isActive: boolean) => void;
  style?: ViewStyle;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FastingTimer({
  startTime,
  targetHours = 16,
  onToggle,
  style,
}: FastingTimerProps): React.JSX.Element {
  const { colors, module, spacing, typography, radii, shadows, status } = useTheme();

  const isActive = !!startTime;
  const targetSeconds = targetHours * 3600;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const calcElapsed = useCallback((): number => {
    if (!startTime) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
  }, [startTime]);

  const [elapsed, setElapsed] = useState(calcElapsed);

  useEffect(() => {
    if (isActive) {
      setElapsed(calcElapsed());
      intervalRef.current = setInterval(() => {
        setElapsed(calcElapsed());
      }, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    setElapsed(0);
    return undefined;
  }, [isActive, calcElapsed]);

  const progress = targetSeconds > 0 ? Math.min(elapsed / targetSeconds, 1) : 0;
  const pct = Math.round(progress * 100);
  const isComplete = elapsed >= targetSeconds;
  const remaining = Math.max(targetSeconds - elapsed, 0);

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
      testID="fasting-timer"
      accessibilityLabel={`단식 타이머${isActive ? `, ${formatDuration(elapsed)} 경과, ${pct}% 달성` : ', 시작 전'}`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          ⏱️ 단식 타이머
        </Text>
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
          }}
        >
          목표 {targetHours}시간
        </Text>
      </View>

      {/* 타이머 */}
      <Text
        style={{
          fontSize: typography.size['4xl'],
          fontWeight: typography.weight.bold,
          color: isComplete ? status.success : colors.foreground,
          textAlign: 'center',
          marginTop: spacing.md,
        }}
      >
        {formatDuration(elapsed)}
      </Text>

      {/* 프로그레스 */}
      <View
        style={[
          styles.barBg,
          {
            height: 8,
            borderRadius: radii.full,
            backgroundColor: colors.muted,
            marginTop: spacing.sm,
          },
        ]}
      >
        <View
          style={{
            width: `${pct}%` as unknown as number,
            height: '100%',
            borderRadius: radii.full,
            backgroundColor: isComplete ? status.success : module.nutrition.base,
          }}
        />
      </View>

      {/* 상태 텍스트 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          color: isComplete ? status.success : colors.mutedForeground,
          textAlign: 'center',
          marginTop: spacing.sm,
        }}
      >
        {isComplete
          ? '목표 달성!'
          : isActive
            ? `남은 시간: ${formatDuration(remaining)}`
            : '시작 버튼을 눌러주세요'}
      </Text>

      {/* 시작/종료 버튼 */}
      {onToggle && (
        <Pressable
          style={[
            styles.toggleBtn,
            {
              backgroundColor: isActive ? colors.destructive : module.nutrition.base,
              borderRadius: radii.xl,
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
          onPress={() => onToggle(!isActive)}
          accessibilityLabel={isActive ? '단식 종료' : '단식 시작'}
          accessibilityRole="button"
        >
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.overlayForeground,
              textAlign: 'center',
            }}
          >
            {isActive ? '종료' : '시작'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barBg: {
    overflow: 'hidden',
  },
  toggleBtn: {},
});
