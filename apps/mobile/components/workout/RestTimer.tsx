/**
 * 휴식 타이머
 *
 * 세트 간 휴식 시간 카운트다운
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

export interface RestTimerProps {
  /** 초 단위 */
  initialSeconds: number;
  onComplete: () => void;
  onSkip?: () => void;
  /** 조절 단위 (초) */
  adjustStep?: number;
}

export function RestTimer({
  initialSeconds, onComplete, onSkip, adjustStep = 10,
}: RestTimerProps): React.ReactElement {
  const { colors, module, status, typography, radii, spacing } = useTheme();
  const [remaining, setRemaining] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baseColor = module.workout.base;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = remaining / initialSeconds;
  const isWarning = remaining <= 10;

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onComplete]);

  const handleAdjust = useCallback((delta: number) => {
    setRemaining((prev) => Math.max(0, Math.min(300, prev + delta)));
  }, []);

  const handleReset = useCallback(() => {
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  return (
    <View
      testID="rest-timer"
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.lg, borderColor: colors.border, padding: spacing.lg }]}
      accessibilityLabel={`휴식 타이머 ${minutes}분 ${seconds}초 남음`}
    >
      <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm, textAlign: 'center' }}>
        휴식 시간
      </Text>

      {/* 시간 표시 */}
      <Text style={{
        color: isWarning ? status.error : baseColor,
        fontSize: typography.size['4xl'],
        fontWeight: '700',
        textAlign: 'center',
        marginVertical: spacing.sm,
      }}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </Text>

      {/* 진행 바 */}
      <View style={[styles.progressBar, { backgroundColor: colors.secondary, borderRadius: radii.full }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: isWarning ? status.error : baseColor,
              borderRadius: radii.full,
            },
          ]}
        />
      </View>

      {/* 시간 조절 */}
      <View style={[styles.adjustRow, { marginTop: spacing.md }]}>
        <Pressable
          onPress={() => handleAdjust(-adjustStep)}
          style={[styles.adjustBtn, { backgroundColor: colors.secondary, borderRadius: radii.md }]}
          accessibilityRole="button"
          accessibilityLabel={`${adjustStep}초 줄이기`}
        >
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm }}>-{adjustStep}s</Text>
        </Pressable>
        <Pressable
          onPress={handleReset}
          style={[styles.adjustBtn, { backgroundColor: colors.secondary, borderRadius: radii.md }]}
          accessibilityRole="button"
          accessibilityLabel="타이머 리셋"
        >
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm }}>리셋</Text>
        </Pressable>
        <Pressable
          onPress={() => handleAdjust(adjustStep)}
          style={[styles.adjustBtn, { backgroundColor: colors.secondary, borderRadius: radii.md }]}
          accessibilityRole="button"
          accessibilityLabel={`${adjustStep}초 늘리기`}
        >
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm }}>+{adjustStep}s</Text>
        </Pressable>
      </View>

      {/* 건너뛰기 */}
      {onSkip && (
        <Pressable
          onPress={onSkip}
          style={[styles.skipBtn, { marginTop: spacing.sm }]}
          accessibilityRole="button"
          accessibilityLabel="휴식 건너뛰기"
        >
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm }}>건너뛰기</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, alignItems: 'center' },
  progressBar: { height: 6, width: '100%' },
  progressFill: { height: 6 },
  adjustRow: { flexDirection: 'row', gap: 10 },
  adjustBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  skipBtn: { paddingVertical: 8 },
});
