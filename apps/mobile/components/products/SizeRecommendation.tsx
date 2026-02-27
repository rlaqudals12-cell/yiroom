/**
 * 사이즈 추천 컴포넌트
 * 제품 상세 페이지에서 맞춤 사이즈 추천 표시
 */

import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';

import { useNetworkStatus } from '../../lib/offline';
import type {
  ClothingCategory,
  SizeRecommendation as SizeRecommendationType,
} from '../../lib/smart-matching';
import {
  useSizeRecommendation,
  getMockSizeRecommendation,
} from '../../lib/smart-matching/useSizeRecommendation';
import { useTheme, typography, radii , spacing } from '../../lib/theme';

interface SizeRecommendationProps {
  brandId: string;
  brandName: string;
  category: ClothingCategory;
  productId?: string;
  onSizeSelect?: (size: string) => void;
}

/**
 * 사이즈 추천 카드 컴포넌트
 */
export function SizeRecommendation({
  brandId,
  brandName,
  category,
  productId,
  onSizeSelect,
}: SizeRecommendationProps) {
  const { colors, brand, status, typography } = useTheme();
  const { isConnected } = useNetworkStatus();

  const { recommendation, isLoading, error, confidenceLabel, basisDescription, refetch } =
    useSizeRecommendation({
      brandId,
      brandName,
      category,
      productId,
      enabled: isConnected,
    });

  // 오프라인 시 Mock 데이터 사용
  const displayRecommendation: SizeRecommendationType | null = isConnected
    ? recommendation
    : getMockSizeRecommendation(category);

  const handleSizePress = (size: string) => {
    Haptics.selectionAsync();
    onSizeSelect?.(size);
  };

  // 신뢰도 배경색
  const getConfidenceBg = (color: 'green' | 'yellow' | 'gray'): string => {
    const map: Record<string, string> = {
      green: status.success,
      yellow: status.warning,
      gray: colors.secondary,
    };
    return map[color];
  };

  // 테마 기반 동적 스타일
  const themed = useMemo(
    () => ({
      container: { backgroundColor: colors.card },
      loadingText: { color: colors.mutedForeground },
      errorText: { color: colors.mutedForeground },
      retryBtn: { backgroundColor: brand.primary },
      retryBtnText: { color: brand.primaryForeground },
      title: { color: colors.foreground },
      subtitle: { color: colors.mutedForeground },
      badgeText: { color: colors.foreground },
      sizeBox: { backgroundColor: brand.primary },
      sizeText: { color: brand.primaryForeground },
      sizeLabel: { color: brand.primaryForeground },
      barTrack: { backgroundColor: colors.border },
      barFill: { backgroundColor: brand.primary },
      barText: { color: colors.mutedForeground },
      altTitle: { color: colors.mutedForeground },
      altItem: { backgroundColor: colors.secondary },
      altSize: { color: colors.foreground },
      altNote: { color: colors.mutedForeground },
      noteBox: { backgroundColor: colors.accent },
      noteText: { color: colors.mutedForeground },
      offlineBox: { backgroundColor: colors.secondary },
      offlineText: { color: colors.mutedForeground },
    }),
    [colors, brand]
  );

  if (isLoading) {
    return (
      <View style={[styles.container, themed.container]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={brand.primary} />
          <Text style={[styles.loadingText, themed.loadingText]}>사이즈 분석 중...</Text>
        </View>
      </View>
    );
  }

  if (error && isConnected) {
    return (
      <View style={[styles.container, themed.container]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, themed.errorText]}>{error}</Text>
          <Pressable onPress={refetch} style={[styles.retryButton, themed.retryBtn]}>
            <Text style={[styles.retryButtonText, themed.retryBtnText]}>다시 시도</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!displayRecommendation) {
    return null;
  }

  return (
    <View testID="size-recommendation" style={[styles.container, themed.container]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📏</Text>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, themed.title]}>맞춤 사이즈 추천</Text>
          <Text style={[styles.headerSubtitle, themed.subtitle]}>
            {basisDescription || '일반적인 사이즈 추정'}
          </Text>
        </View>
        {confidenceLabel && (
          <View
            style={[
              styles.confidenceBadge,
              { backgroundColor: getConfidenceBg(confidenceLabel.color) },
            ]}
          >
            <Text style={[styles.confidenceBadgeText, themed.badgeText]}>
              {confidenceLabel.label}
            </Text>
          </View>
        )}
      </View>

      {/* 추천 사이즈 */}
      <View style={styles.mainRecommendation}>
        <Pressable
          style={[styles.recommendedSize, themed.sizeBox]}
          onPress={() => handleSizePress(displayRecommendation.recommendedSize)}
        >
          <Text style={[styles.recommendedSizeText, themed.sizeText]}>
            {displayRecommendation.recommendedSize}
          </Text>
          <Text style={[styles.recommendedLabel, themed.sizeLabel]}>추천</Text>
        </Pressable>

        {/* 신뢰도 바 */}
        <View style={styles.confidenceBar}>
          <View style={[styles.confidenceBarTrack, themed.barTrack]}>
            <View
              style={[
                styles.confidenceBarFill,
                themed.barFill,
                { width: `${displayRecommendation.confidence}%` },
              ]}
            />
          </View>
          <Text style={[styles.confidenceText, themed.barText]}>
            {displayRecommendation.confidence}% 정확도
          </Text>
        </View>
      </View>

      {/* 대안 사이즈 */}
      {displayRecommendation.alternatives.length > 0 && (
        <View style={styles.alternatives}>
          <Text style={[styles.alternativesTitle, themed.altTitle]}>다른 옵션</Text>
          <View style={styles.alternativesList}>
            {displayRecommendation.alternatives.map((alt, index) => (
              <Pressable
                key={index}
                style={[styles.alternativeItem, themed.altItem]}
                onPress={() => handleSizePress(alt.size)}
              >
                <Text style={[styles.alternativeSize, themed.altSize]}>{alt.size}</Text>
                <Text style={[styles.alternativeNote, themed.altNote]}>{alt.note}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* 브랜드 노트 */}
      {displayRecommendation.brandInfo?.sizeNote && (
        <View style={[styles.brandNote, themed.noteBox]}>
          <Text style={[styles.brandNoteText, themed.noteText]}>
            💡 {displayRecommendation.brandInfo.sizeNote}
          </Text>
        </View>
      )}

      {/* 오프라인 알림 */}
      {!isConnected && (
        <View style={[styles.offlineNote, themed.offlineBox]}>
          <Text style={[styles.offlineNoteText, themed.offlineText]}>
            📴 오프라인 모드 - 온라인 시 정확한 추천 제공
          </Text>
        </View>
      )}
    </View>
  );
}

// 레이아웃 관련 정적 스타일 (색상은 themed에서 오버라이드)
const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    padding: spacing.md,
    marginVertical: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    padding: spacing.md,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: typography.weight.semibold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: typography.weight.semibold,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  confidenceBadgeText: {
    fontSize: 12,
    fontWeight: typography.weight.semibold,
  },
  mainRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recommendedSize: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedSizeText: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
  },
  recommendedLabel: {
    fontSize: 11,
    opacity: 0.8,
    marginTop: 2,
  },
  confidenceBar: {
    flex: 1,
    gap: 6,
  },
  confidenceBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
  },
  alternatives: {
    marginTop: spacing.md,
  },
  alternativesTitle: {
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  alternativesList: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  alternativeItem: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  alternativeSize: {
    fontSize: 18,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  alternativeNote: {
    fontSize: 11,
  },
  brandNote: {
    marginTop: spacing.md,
    borderRadius: radii.md,
    padding: 12,
  },
  brandNoteText: {
    fontSize: 12,
    lineHeight: 18,
  },
  offlineNote: {
    marginTop: 12,
    borderRadius: radii.md,
    padding: 10,
    alignItems: 'center',
  },
  offlineNoteText: {
    fontSize: 11,
  },
});
