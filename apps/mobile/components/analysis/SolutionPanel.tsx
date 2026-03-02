/**
 * 솔루션 패널
 *
 * 분석 결과 기반 추천 솔루션을 단계별로 표시
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, spacing, radii, typography } from '../../lib/theme';

export interface SolutionStep {
  id: string;
  /** 단계 번호 */
  step: number;
  title: string;
  description: string;
  /** 카테고리 아이콘 */
  icon?: string;
  /** 추천 강도 */
  priority?: 'high' | 'medium' | 'low';
}

export interface SolutionPanelProps {
  title?: string;
  steps: SolutionStep[];
  /** 특정 솔루션 클릭 */
  onStepPress?: (step: SolutionStep) => void;
}

export function SolutionPanel({
  title = '맞춤 솔루션',
  steps,
  onStepPress,
}: SolutionPanelProps): React.ReactElement {
  const { colors, brand, status, typography } = useTheme();

  const priorityColors = {
    high: colors.destructive,
    medium: status.warning,
    low: status.info,
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="solution-panel"
      accessibilityLabel={`${title}: ${steps.length}단계`}
    >
      <Text style={[styles.title, { color: colors.foreground, fontSize: typography.size.lg }]}>
        {title}
      </Text>

      {steps.map((step, index) => (
        <Pressable
          key={step.id}
          style={[
            styles.stepCard,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
            index === steps.length - 1 && styles.lastStep,
          ]}
          onPress={() => onStepPress?.(step)}
          accessibilityRole="button"
          accessibilityLabel={`${step.step}단계: ${step.title}. ${step.description}`}
        >
          {/* 단계 번호 */}
          <View style={[styles.stepNumber, { backgroundColor: `${brand.primary}20` }]}>
            <Text style={[styles.stepNumberText, { color: brand.primary, fontSize: typography.size.sm }]}>
              {step.step}
            </Text>
          </View>

          {/* 내용 */}
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              {step.icon && <Text style={styles.stepIcon}>{step.icon}</Text>}
              <Text style={[styles.stepTitle, { color: colors.foreground, fontSize: typography.size.sm }]}>
                {step.title}
              </Text>
              {step.priority && (
                <View style={[styles.priorityBadge, { backgroundColor: `${priorityColors[step.priority]}15` }]}>
                  <Text style={[styles.priorityText, { color: priorityColors[step.priority], fontSize: typography.size.xs }]}>
                    {step.priority === 'high' ? '필수' : step.priority === 'medium' ? '권장' : '참고'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
              {step.description}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  title: {
    fontWeight: '700',
    marginBottom: spacing.smx,
  },
  stepCard: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.smx,
    marginBottom: spacing.sm,
  },
  lastStep: {
    marginBottom: 0,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: radii.xlg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.smx,
  },
  stepNumberText: {
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepIcon: {
    fontSize: typography.size.sm,
    marginRight: 6,
  },
  stepTitle: {
    flex: 1,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: spacing.xxs,
    borderRadius: radii.md,
    marginLeft: spacing.sm,
  },
  priorityText: {
    fontWeight: '600',
  },
  stepDesc: {
    lineHeight: 18,
  },
});
