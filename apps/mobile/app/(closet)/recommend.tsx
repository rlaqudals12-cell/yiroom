/**
 * 오늘의 코디 추천 페이지
 * 퍼스널컬러, 체형, 날씨 기반 코디 추천
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { RefreshCw, Thermometer } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';

import {
  useClosetMatcher,
  type OutfitSuggestion,
  type PersonalColorSeason,
  type BodyType3,
} from '../../lib/inventory/useClosetMatcher';

export default function RecommendScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // TODO: 실제 사용자 프로필에서 가져오기
  const [personalColor] = useState<PersonalColorSeason>('Spring');
  const [bodyType] = useState<BodyType3>('S');
  // Mock 날씨 데이터 (실제 앱에서는 날씨 API 연동)
  const [temp, setTemp] = useState<number>(15);
  const locationName = '서울';

  const { items, isLoading, summary, getOutfitSuggestion, refetch } = useClosetMatcher({
    personalColor,
    bodyType,
  });

  const [outfit, setOutfit] = useState<OutfitSuggestion | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // generateOutfit을 먼저 정의 (useEffect에서 사용)
  const generateOutfit = useCallback(() => {
    const suggestion = getOutfitSuggestion({ temp });
    setOutfit(suggestion);
  }, [getOutfitSuggestion, temp]);

  // Mock 날씨 설정 (계절에 맞는 온도)
  useEffect(() => {
    const month = new Date().getMonth();
    // 계절별 평균 온도 설정
    if (month >= 2 && month <= 4)
      setTemp(15); // 봄
    else if (month >= 5 && month <= 7)
      setTemp(27); // 여름
    else if (month >= 8 && month <= 10)
      setTemp(18); // 가을
    else setTemp(3); // 겨울
  }, []);

  // 코디 추천
  useEffect(() => {
    if (!isLoading && items.length > 0) {
      generateOutfit();
    }
  }, [isLoading, items, generateOutfit]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefreshing(true);
    await refetch();
    generateOutfit();
    setIsRefreshing(false);
  };

  const handleItemPress = (id: string) => {
    Haptics.selectionAsync();
    router.push(`/(closet)/${id}`);
  };

  const renderOutfitItem = (label: string, item: OutfitSuggestion['top'] | undefined) => {
    if (!item) return null;

    return (
      <TouchableOpacity
        style={[styles.outfitItem, isDark && styles.outfitItemDark]}
        onPress={() => handleItemPress(item.item.id)}
      >
        <View style={styles.outfitImageContainer}>
          {item.item.imageUrl ? (
            <Image
              source={{ uri: item.item.imageUrl }}
              style={styles.outfitImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.outfitPlaceholder, isDark && styles.placeholderDark]}>
              <Text style={styles.placeholderText}>👕</Text>
            </View>
          )}
        </View>
        <View style={styles.outfitItemInfo}>
          <Text style={[styles.outfitItemLabel, isDark && styles.textMuted]}>{label}</Text>
          <Text style={[styles.outfitItemName, isDark && styles.textLight]} numberOfLines={1}>
            {item.item.name}
          </Text>
          <View style={styles.scoreContainer}>
            <View
              style={[
                styles.scoreBar,
                { width: `${item.score.total}%` },
                item.score.total >= 70 && styles.scoreBarHigh,
                item.score.total >= 50 && item.score.total < 70 && styles.scoreBarMid,
                item.score.total < 50 && styles.scoreBarLow,
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={[styles.loadingText, isDark && styles.textMuted]}>
            코디를 준비하고 있어요...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👗</Text>
          <Text style={[styles.emptyText, isDark && styles.textMuted]}>옷장에 아이템이 없어요</Text>
          <Text style={[styles.emptySubtext, isDark && styles.textMuted]}>
            옷장에 아이템을 추가하면{'\n'}코디 추천을 받을 수 있어요
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(closet)')}>
            <Text style={styles.emptyButtonText}>옷장으로 가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 날씨 정보 */}
        <View style={[styles.weatherCard, isDark && styles.weatherCardDark]}>
          <View style={styles.weatherRow}>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherIcon}>📍</Text>
              <Text style={[styles.weatherText, isDark && styles.textMuted]}>{locationName}</Text>
            </View>
            <View style={styles.weatherItem}>
              <Thermometer size={16} color={isDark ? '#999' : '#666'} />
              <Text style={[styles.weatherText, isDark && styles.textMuted]}>{temp}°C</Text>
            </View>
          </View>
          <View style={styles.weatherTags}>
            <View style={[styles.tag, { backgroundColor: '#8b5cf620' }]}>
              <Text style={[styles.tagText, { color: '#8b5cf6' }]}>{personalColor}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#3b82f620' }]}>
              <Text style={[styles.tagText, { color: '#3b82f6' }]}>
                {bodyType === 'S' ? '스트레이트' : bodyType === 'W' ? '웨이브' : '내추럴'}
              </Text>
            </View>
          </View>
        </View>

        {/* 코디 추천 */}
        {outfit ? (
          <View style={styles.outfitSection}>
            <View style={styles.outfitHeader}>
              <Text style={[styles.outfitTitle, isDark && styles.textLight]}>오늘의 추천 코디</Text>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreCircleText}>{outfit.totalScore}</Text>
              </View>
            </View>

            <View style={styles.outfitGrid}>
              {renderOutfitItem('아우터', outfit.outer)}
              {renderOutfitItem('상의', outfit.top)}
              {renderOutfitItem('하의', outfit.bottom)}
              {renderOutfitItem('신발', outfit.shoes)}
              {renderOutfitItem('가방', outfit.bag)}
              {renderOutfitItem('악세서리', outfit.accessory)}
            </View>

            {/* 코디 팁 */}
            {outfit.tips.length > 0 && (
              <View style={[styles.tipsCard, isDark && styles.tipsCardDark]}>
                <Text style={[styles.tipsTitle, isDark && styles.textLight]}>💡 코디 팁</Text>
                {outfit.tips.map((tip, index) => (
                  <Text key={index} style={[styles.tipText, isDark && styles.textMuted]}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noOutfitContainer}>
            <Text style={[styles.noOutfitText, isDark && styles.textMuted]}>
              추천할 코디를 찾지 못했어요
            </Text>
            <Text style={[styles.noOutfitSubtext, isDark && styles.textMuted]}>
              상의와 하의가 필요해요
            </Text>
          </View>
        )}

        {/* 옷장 요약 */}
        <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
          <Text style={[styles.summaryTitle, isDark && styles.textLight]}>내 옷장 분석</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{summary.wellMatched}</Text>
              <Text style={[styles.summaryLabel, isDark && styles.textMuted]}>잘 어울림</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
                {summary.needsImprovement}
              </Text>
              <Text style={[styles.summaryLabel, isDark && styles.textMuted]}>개선 필요</Text>
            </View>
          </View>
          {summary.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {summary.suggestions.map((suggestion, index) => (
                <Text key={index} style={[styles.suggestionText, isDark && styles.textMuted]}>
                  📌 {suggestion}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 새로고침 버튼 */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={handleRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <RefreshCw size={24} color="#fff" />
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#666',
    marginTop: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  weatherCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  weatherCardDark: {
    backgroundColor: '#1a1a1a',
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherText: {
    fontSize: 14,
    color: '#666',
  },
  weatherIcon: {
    fontSize: 14,
  },
  weatherTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  outfitSection: {
    marginBottom: 16,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  outfitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  outfitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  outfitItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  outfitItemDark: {
    backgroundColor: '#1a1a1a',
  },
  outfitImageContainer: {
    width: '100%',
    aspectRatio: 1,
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  outfitPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderDark: {
    backgroundColor: '#2a2a2a',
  },
  placeholderText: {
    fontSize: 32,
  },
  outfitItemInfo: {
    padding: 10,
  },
  outfitItemLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  outfitItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 6,
  },
  scoreContainer: {
    height: 4,
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 2,
  },
  scoreBarHigh: {
    backgroundColor: '#22c55e',
  },
  scoreBarMid: {
    backgroundColor: '#f59e0b',
  },
  scoreBarLow: {
    backgroundColor: '#ef4444',
  },
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  tipsCardDark: {
    backgroundColor: '#1a1a1a',
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  noOutfitContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noOutfitText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  noOutfitSubtext: {
    fontSize: 13,
    color: '#999',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  summaryCardDark: {
    backgroundColor: '#1a1a1a',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  suggestionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  suggestionText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  refreshButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
