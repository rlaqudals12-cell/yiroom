import { RefreshCw } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING } from '@/lib/animations';
import { useTheme } from '@/lib/theme';

import { styles } from './recommend.styles';
import { GlassCard, ScreenContainer, SuccessCheckmark } from '../../components/ui';
import type { RecommendationSummary } from '../../lib/inventory/useClosetMatcher';

export function RecommendLoadingState() {
  const { colors, module: moduleTheme } = useTheme();

  return (
    <ScreenContainer testID="closet-recommend-screen" edges={['bottom']}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={moduleTheme.body.dark} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          코디를 준비하고 있어요...
        </Text>
      </View>
    </ScreenContainer>
  );
}

interface RecommendEmptyStateProps {
  isFromIntegrated: boolean;
  onPress: () => void;
}

export function RecommendEmptyState({ isFromIntegrated, onPress }: RecommendEmptyStateProps) {
  const { colors, module: moduleTheme } = useTheme();
  const title = isFromIntegrated ? '옷장을 먼저 등록해주세요' : '옷장에 아이템이 없어요';
  const detail = isFromIntegrated
    ? '분석한 체형과 컬러에 맞춰\n가지고 있는 옷으로 코디를 제안할게요'
    : '옷장에 아이템을 추가하면\n코디 추천을 받을 수 있어요';
  const cta = isFromIntegrated ? '먼저 옷장 등록하기' : '옷장으로 가기';

  return (
    <ScreenContainer testID="closet-recommend-screen" edges={['bottom']}>
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>👗</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{title}</Text>
        <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>{detail}</Text>
        <Pressable
          style={[styles.emptyButton, { backgroundColor: moduleTheme.body.dark }]}
          onPress={onPress}
          testID="closet-empty-cta"
        >
          <Text style={[styles.emptyButtonText, { color: colors.card }]}>{cta}</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

export function RecommendSummaryCard({ summary }: { summary: RecommendationSummary }) {
  const { colors, status } = useTheme();
  const neutral = summary.total - summary.wellMatched - summary.needsImprovement;

  return (
    <Animated.View entering={FadeInUp.delay(160).duration(TIMING.normal)}>
      <GlassCard shadowSize="md" style={{ ...styles.summaryCard }}>
        <Text style={[styles.summaryTitle, { color: colors.foreground }]}>내 옷장 분석</Text>
        <Text
          testID="closet-summary-total"
          style={[styles.summaryTotal, { color: colors.mutedForeground }]}
        >
          전체 {summary.total}벌
        </Text>
        <View style={styles.summaryRow}>
          <SummaryValue value={summary.wellMatched} label="잘 어울림" color={status.success} />
          <SummaryValue
            value={neutral}
            label="무난"
            color={colors.foreground}
            testID="closet-summary-neutral"
          />
          <SummaryValue value={summary.needsImprovement} label="개선 필요" color={status.warning} />
        </View>
        <Text
          testID="closet-summary-basis"
          style={[styles.summaryBasis, { color: colors.mutedForeground }]}
        >
          퍼스널컬러·체형 기준이에요
        </Text>
        {summary.suggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { borderTopColor: colors.border }]}>
            {summary.suggestions.map((suggestion, index) => (
              <View key={`${suggestion}-${index}`} style={styles.suggestionRow}>
                <Text
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  style={[styles.suggestionText, { color: colors.mutedForeground }]}
                >
                  •
                </Text>
                <Text style={[styles.suggestionText, { color: colors.mutedForeground }]}>
                  {suggestion}
                </Text>
              </View>
            ))}
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

function SummaryValue({
  value,
  label,
  color,
  testID,
}: {
  value: number;
  label: string;
  color: string;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.summaryItem}>
      <Text testID={testID} style={[styles.summaryValue, { color }]}>
        {value}
      </Text>
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

interface RecommendFloatingActionsProps {
  isRefreshing: boolean;
  showSuccess: boolean;
  onRefresh: () => void;
  onSuccessComplete: () => void;
}

export function RecommendFloatingActions({
  isRefreshing,
  showSuccess,
  onRefresh,
  onSuccessComplete,
}: RecommendFloatingActionsProps) {
  const { colors, module: moduleTheme } = useTheme();
  return (
    <>
      <Pressable
        style={[styles.refreshButton, { backgroundColor: moduleTheme.body.dark }]}
        onPress={onRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color={colors.card} />
        ) : (
          <RefreshCw size={24} color={colors.card} />
        )}
      </Pressable>
      {showSuccess && (
        <View style={styles.successOverlay}>
          <SuccessCheckmark visible size={80} onComplete={onSuccessComplete} />
        </View>
      )}
    </>
  );
}
