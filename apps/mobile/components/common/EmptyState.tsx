/**
 * EmptyState 공통 컴포넌트
 * @description 빈 상태 UI — 아이콘 + 제목 + 설명 + 선택적 액션 버튼
 * 웹 EmptyState와 동일한 8개 프리셋 시스템 지원
 */

import * as Haptics from 'expo-haptics';
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useAppPreferencesStore } from '@/lib/stores';

import { useTheme, spacing } from '../../lib/theme';

// 프리셋 정의 (웹 EmptyState와 동기화)
const PRESETS = {
  workout: {
    title: '아직 운동 기록이 없어요',
    description: '첫 운동을 시작하면 여기에 기록이 쌓여요!',
    actionLabel: '운동 시작하기',
    emoji: '💪',
  },
  nutrition: {
    title: '오늘 식사를 기록해보세요',
    description: '무엇을 먹었는지 기록하면 건강 관리가 쉬워져요',
    actionLabel: '식사 기록하기',
    emoji: '🥗',
  },
  streak: {
    title: '스트릭을 시작해보세요',
    description: '매일 조금씩, 꾸준함이 변화를 만들어요',
    actionLabel: '시작하기',
    emoji: '🔥',
  },
  analysis: {
    title: '나를 알아가는 여정을 시작해요',
    description: '퍼스널 컬러, 피부, 체형 분석으로 나에게 맞는 스타일을 찾아보세요',
    actionLabel: '첫 분석 시작',
    emoji: '✨',
  },
  products: {
    title: '추천 제품을 찾아보세요',
    description: '분석 결과에 맞는 제품을 추천해드려요',
    actionLabel: '제품 둘러보기',
    emoji: '🛍️',
  },
  challenge: {
    title: '챌린지에 참여해보세요',
    description: '다른 사용자들과 함께 건강한 습관을 만들어요',
    actionLabel: '챌린지 보기',
    emoji: '🏆',
  },
  friends: {
    title: '친구를 추가해보세요',
    description: '함께하면 더 즐거운 웰니스 여정이 돼요',
    actionLabel: '친구 찾기',
    emoji: '👋',
  },
  capsule: {
    title: '오늘의 캡슐이 아직 없어요',
    description: '분석을 완료하면 맞춤 데일리 캡슐이 생성돼요',
    actionLabel: '분석 시작하기',
    emoji: '💊',
  },
} as const;

type EmptyStatePreset = keyof typeof PRESETS;

// 격려 메시지 (웹 동기화)
const ENCOURAGEMENTS = [
  '작은 시작이 큰 변화를 만들어요 ✨',
  '오늘이 가장 좋은 시작이에요 🌱',
  '한 걸음씩, 나만의 속도로 💫',
];

interface EmptyStateProps {
  /** 프리셋 타입 (사용 시 title/description/actionLabel 자동 설정) */
  type?: EmptyStatePreset;
  /** 아이콘 (React 노드 또는 이모지 텍스트) */
  icon?: React.ReactNode;
  /** 제목 */
  title?: string;
  /** 설명 */
  description?: string;
  /** 액션 버튼 라벨 */
  actionLabel?: string;
  /** 액션 버튼 핸들러 */
  onAction?: () => void;
  /** 격려 메시지 표시 여부 */
  showEncouragement?: boolean;
  /** 테스트 ID */
  testID?: string;
}

export function EmptyState({
  type,
  icon,
  title,
  description,
  actionLabel,
  onAction,
  showEncouragement = true,
  testID = 'empty-state',
}: EmptyStateProps): React.JSX.Element {
  const { colors, brand, spacing: sp, radii, typography } = useTheme();
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);

  // 프리셋 적용 (명시적 props가 우선)
  const preset = type ? PRESETS[type] : undefined;
  const resolvedTitle = title ?? preset?.title ?? '';
  const resolvedDescription = description ?? preset?.description ?? '';
  const resolvedActionLabel = actionLabel ?? preset?.actionLabel;
  const resolvedIcon = icon ?? (
    <Text style={{ fontSize: 32 }}>{preset?.emoji ?? '📋'}</Text>
  );

  // 랜덤 격려 메시지
  const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];

  return (
    <View testID={testID} style={styles.container} accessibilityRole="text">
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.secondary,
            width: sp.xl * 2,
            height: sp.xl * 2,
            borderRadius: sp.xl,
          },
        ]}
      >
        {resolvedIcon}
      </View>

      <Text
        style={[
          styles.title,
          {
            color: colors.foreground,
            fontSize: typography.size.lg,
            fontWeight: typography.weight.semibold,
          },
        ]}
      >
        {resolvedTitle}
      </Text>

      <Text
        style={[
          styles.description,
          {
            color: colors.mutedForeground,
            fontSize: typography.size.sm,
            lineHeight: typography.size.sm * typography.lineHeight.normal,
          },
        ]}
      >
        {resolvedDescription}
      </Text>

      {showEncouragement && (
        <Text
          style={[
            styles.encouragement,
            {
              color: colors.mutedForeground,
              fontSize: typography.size.xs,
              lineHeight: typography.size.xs * typography.lineHeight.normal,
            },
          ]}
        >
          {encouragement}
        </Text>
      )}

      {onAction && resolvedActionLabel && (
        <Pressable
          onPress={() => {
            if (hapticEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onAction();
          }}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: brand.primary,
              borderRadius: radii.xl,
              paddingHorizontal: sp.lg,
              paddingVertical: sp.sm + 2,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={resolvedActionLabel}
        >
          <Text
            style={[
              styles.actionText,
              {
                color: brand.primaryForeground,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
            {resolvedActionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
  },
  encouragement: {
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  actionButton: {
    marginTop: spacing.md + spacing.xs,
  },
  actionText: {
    textAlign: 'center',
  },
});
