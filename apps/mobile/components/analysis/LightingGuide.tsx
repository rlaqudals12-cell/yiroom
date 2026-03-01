/**
 * 조명 가이드
 *
 * 촬영 전 환경 체크 (밝기, 균일성, 그림자)
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

export type BrightnessLevel = 'low' | 'ok' | 'high';
export type UniformityLevel = 'uneven' | 'ok';

export interface LightingGuideProps {
  brightness?: BrightnessLevel;
  uniformity?: UniformityLevel;
  hasShadow?: boolean;
  recommendation?: string;
}

interface CheckItem {
  id: string;
  label: string;
  passed: boolean;
  icon: string;
}

export function LightingGuide({
  brightness = 'ok',
  uniformity = 'ok',
  hasShadow = false,
  recommendation,
}: LightingGuideProps): React.ReactElement {
  const { colors, status, typography } = useTheme();

  const checkItems: CheckItem[] = useMemo(() => [
    {
      id: 'brightness',
      label: brightness === 'ok' ? '밝기 충분' : brightness === 'low' ? '밝기 부족' : '밝기 과다',
      passed: brightness === 'ok',
      icon: brightness === 'low' ? '🌙' : '☀️',
    },
    {
      id: 'uniformity',
      label: uniformity === 'ok' ? '균일한 조명' : '조명 불균일',
      passed: uniformity === 'ok',
      icon: '💡',
    },
    {
      id: 'shadow',
      label: hasShadow ? '그림자가 있어요' : '그림자 없음',
      passed: !hasShadow,
      icon: '🌤️',
    },
  ], [brightness, uniformity, hasShadow]);

  const allPassed = checkItems.every((item) => item.passed);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="lighting-guide"
      accessibilityLabel={`조명 가이드: ${allPassed ? '모든 항목 통과' : '일부 항목 미통과'}`}
    >
      <Text style={[styles.title, { color: colors.foreground, fontSize: typography.size.base }]}>
        촬영 환경 체크
      </Text>

      {/* 체크 항목 */}
      {checkItems.map((item) => (
        <View key={item.id} style={styles.checkRow}>
          <Text style={styles.checkIcon}>{item.icon}</Text>
          <Text
            style={[
              styles.checkLabel,
              {
                color: item.passed ? status.success : status.warning,
                fontSize: typography.size.sm,
              },
            ]}
          >
            {item.label}
          </Text>
          <Text style={[styles.statusMark, { color: item.passed ? status.success : status.warning }]}>
            {item.passed ? '✓' : '!'}
          </Text>
        </View>
      ))}

      {/* 종합 결과 */}
      {allPassed ? (
        <View style={[styles.resultBox, { backgroundColor: `${status.success}10` }]}>
          <Text style={[styles.resultText, { color: status.success, fontSize: typography.size.sm }]}>
            촬영 환경이 좋아요! 정확한 분석이 가능해요
          </Text>
        </View>
      ) : recommendation ? (
        <View style={[styles.resultBox, { backgroundColor: `${status.warning}10` }]}>
          <Text style={[styles.resultText, { color: status.warning, fontSize: typography.size.sm }]}>
            {recommendation}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  checkLabel: {
    flex: 1,
    fontWeight: '500',
  },
  statusMark: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultBox: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  resultText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});
