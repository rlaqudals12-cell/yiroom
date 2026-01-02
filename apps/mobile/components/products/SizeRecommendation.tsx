/**
 * 사이즈 추천 컴포넌트
 * 제품 상세 페이지에서 맞춤 사이즈 추천 표시
 */

import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';

import { useNetworkStatus } from '../../lib/offline/useNetworkStatus';
import type {
  ClothingCategory,
  SizeRecommendation as SizeRecommendationType,
} from '../../lib/smart-matching';
import {
  useSizeRecommendation,
  getMockSizeRecommendation,
} from '../../lib/smart-matching/useSizeRecommendation';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isConnected } = useNetworkStatus();

  const {
    recommendation,
    isLoading,
    error,
    confidenceLabel,
    basisDescription,
    refetch,
  } = useSizeRecommendation({
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

  if (isLoading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#8b5cf6" />
          <Text style={[styles.loadingText, isDark && styles.textMuted]}>
            사이즈 분석 중...
          </Text>
        </View>
      </View>
    );
  }

  if (error && isConnected) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isDark && styles.textMuted]}>
            {error}
          </Text>
          <TouchableOpacity onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!displayRecommendation) {
    return null;
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📏</Text>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, isDark && styles.textLight]}>
            맞춤 사이즈 추천
          </Text>
          <Text style={[styles.headerSubtitle, isDark && styles.textMuted]}>
            {basisDescription || '일반적인 사이즈 추정'}
          </Text>
        </View>
        {confidenceLabel && (
          <View
            style={[
              styles.confidenceBadge,
              {
                backgroundColor: getConfidenceColor(
                  confidenceLabel.color,
                  isDark
                ),
              },
            ]}
          >
            <Text style={styles.confidenceBadgeText}>
              {confidenceLabel.label}
            </Text>
          </View>
        )}
      </View>

      {/* 추천 사이즈 */}
      <View style={styles.mainRecommendation}>
        <TouchableOpacity
          style={[styles.recommendedSize, isDark && styles.recommendedSizeDark]}
          onPress={() => handleSizePress(displayRecommendation.recommendedSize)}
        >
          <Text style={styles.recommendedSizeText}>
            {displayRecommendation.recommendedSize}
          </Text>
          <Text style={[styles.recommendedLabel, isDark && styles.textMuted]}>
            추천
          </Text>
        </TouchableOpacity>

        {/* 신뢰도 바 */}
        <View style={styles.confidenceBar}>
          <View style={styles.confidenceBarTrack}>
            <View
              style={[
                styles.confidenceBarFill,
                { width: `${displayRecommendation.confidence}%` },
              ]}
            />
          </View>
          <Text style={[styles.confidenceText, isDark && styles.textMuted]}>
            {displayRecommendation.confidence}% 정확도
          </Text>
        </View>
      </View>

      {/* 대안 사이즈 */}
      {displayRecommendation.alternatives.length > 0 && (
        <View style={styles.alternatives}>
          <Text style={[styles.alternativesTitle, isDark && styles.textMuted]}>
            다른 옵션
          </Text>
          <View style={styles.alternativesList}>
            {displayRecommendation.alternatives.map((alt, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.alternativeItem,
                  isDark && styles.alternativeItemDark,
                ]}
                onPress={() => handleSizePress(alt.size)}
              >
                <Text
                  style={[styles.alternativeSize, isDark && styles.textLight]}
                >
                  {alt.size}
                </Text>
                <Text
                  style={[styles.alternativeNote, isDark && styles.textMuted]}
                >
                  {alt.note}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 브랜드 노트 */}
      {displayRecommendation.brandInfo?.sizeNote && (
        <View style={[styles.brandNote, isDark && styles.brandNoteDark]}>
          <Text style={[styles.brandNoteText, isDark && styles.textMuted]}>
            💡 {displayRecommendation.brandInfo.sizeNote}
          </Text>
        </View>
      )}

      {/* 오프라인 알림 */}
      {!isConnected && (
        <View style={styles.offlineNote}>
          <Text style={styles.offlineNoteText}>
            📴 오프라인 모드 - 온라인 시 정확한 추천 제공
          </Text>
        </View>
      )}
    </View>
  );
}

// 신뢰도 색상 헬퍼
function getConfidenceColor(
  color: 'green' | 'yellow' | 'gray',
  isDark: boolean
): string {
  const colors = {
    green: isDark ? '#166534' : '#dcfce7',
    yellow: isDark ? '#854d0e' : '#fef9c3',
    gray: isDark ? '#374151' : '#f3f4f6',
  };
  return colors[color];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    fontWeight: '600',
    color: '#111',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  mainRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recommendedSize: {
    width: 72,
    height: 72,
    backgroundColor: '#8b5cf6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedSizeDark: {
    backgroundColor: '#7c3aed',
  },
  recommendedSizeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  recommendedLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  confidenceBar: {
    flex: 1,
    gap: 6,
  },
  confidenceBarTrack: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
  },
  alternatives: {
    marginTop: 16,
  },
  alternativesTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  alternativesList: {
    flexDirection: 'row',
    gap: 8,
  },
  alternativeItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
  },
  alternativeItemDark: {
    backgroundColor: '#2a2a2a',
  },
  alternativeSize: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  alternativeNote: {
    fontSize: 11,
    color: '#666',
  },
  brandNote: {
    marginTop: 16,
    backgroundColor: '#f5f3ff',
    borderRadius: 8,
    padding: 12,
  },
  brandNoteDark: {
    backgroundColor: '#1a1a2e',
  },
  brandNoteText: {
    fontSize: 12,
    color: '#6b21a8',
    lineHeight: 18,
  },
  offlineNote: {
    marginTop: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  offlineNoteText: {
    fontSize: 11,
    color: '#92400e',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
