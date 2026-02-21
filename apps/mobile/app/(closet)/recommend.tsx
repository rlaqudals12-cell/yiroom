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

import { useUserAnalyses } from '@/hooks/useUserAnalyses';
import { useTheme } from '@/lib/theme';

import {
  useClosetMatcher,
  type OutfitSuggestion,
  type PersonalColorSeason,
  type BodyType3,
} from '../../lib/inventory/useClosetMatcher';

// DB 체형 → 3타입 매핑
function mapBodyType(dbBodyType: string | undefined): BodyType3 {
  const mapping: Record<string, BodyType3> = {
    hourglass: 'S',
    rectangle: 'S',
    inverted_triangle: 'S',
    pear: 'W',
    apple: 'N',
  };
  return mapping[dbBodyType ?? ''] ?? 'S';
}

// DB 시즌 → PersonalColorSeason 매핑
function mapSeason(dbSeason: string | undefined): PersonalColorSeason {
  const mapping: Record<string, PersonalColorSeason> = {
    spring: 'Spring',
    Spring: 'Spring',
    summer: 'Summer',
    Summer: 'Summer',
    autumn: 'Autumn',
    Autumn: 'Autumn',
    winter: 'Winter',
    Winter: 'Winter',
  };
  return mapping[dbSeason ?? ''] ?? 'Spring';
}

export default function RecommendScreen() {
  const { colors, module: moduleTheme, status } = useTheme();
  const router = useRouter();

  // 실제 사용자 분석 결과에서 가져오기
  const { personalColor: pcResult, bodyAnalysis } = useUserAnalyses();
  const personalColor = mapSeason(pcResult?.season);
  const bodyType = mapBodyType(bodyAnalysis?.bodyType);

  // 계절별 온도 (향후 날씨 API 연동 가능)
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
        style={[styles.outfitItem, { backgroundColor: colors.card }]}
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
            <View style={[styles.outfitPlaceholder, { backgroundColor: colors.muted }]}>
              <Text style={styles.placeholderText}>👕</Text>
            </View>
          )}
        </View>
        <View style={styles.outfitItemInfo}>
          <Text style={[styles.outfitItemLabel, { color: colors.mutedForeground }]}>{label}</Text>
          <Text style={[styles.outfitItemName, { color: colors.foreground }]} numberOfLines={1}>
            {item.item.name}
          </Text>
          <View style={[styles.scoreContainer, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.scoreBar,
                { width: `${item.score.total}%` },
                item.score.total >= 70 && { backgroundColor: status.success },
                item.score.total >= 50 &&
                  item.score.total < 70 && { backgroundColor: status.warning },
                item.score.total < 50 && { backgroundColor: status.error },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={moduleTheme.body.dark} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            코디를 준비하고 있어요...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👗</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            옷장에 아이템이 없어요
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            옷장에 아이템을 추가하면{'\n'}코디 추천을 받을 수 있어요
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: moduleTheme.body.dark }]}
            onPress={() => router.push('/(closet)')}
          >
            <Text style={[styles.emptyButtonText, { color: colors.card }]}>옷장으로 가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      testID="closet-recommend-screen"
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 날씨 정보 */}
        <View style={[styles.weatherCard, { backgroundColor: colors.card }]}>
          <View style={styles.weatherRow}>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherIcon}>📍</Text>
              <Text style={[styles.weatherText, { color: colors.mutedForeground }]}>
                {locationName}
              </Text>
            </View>
            <View style={styles.weatherItem}>
              <Thermometer size={16} color={colors.mutedForeground} />
              <Text style={[styles.weatherText, { color: colors.mutedForeground }]}>{temp}°C</Text>
            </View>
          </View>
          <View style={styles.weatherTags}>
            <View style={[styles.tag, { backgroundColor: moduleTheme.body.dark + '20' }]}>
              <Text style={[styles.tagText, { color: moduleTheme.body.dark }]}>
                {personalColor}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: status.info + '20' }]}>
              <Text style={[styles.tagText, { color: status.info }]}>
                {bodyType === 'S' ? '스트레이트' : bodyType === 'W' ? '웨이브' : '내추럴'}
              </Text>
            </View>
          </View>
        </View>

        {/* 코디 추천 */}
        {outfit ? (
          <View style={styles.outfitSection}>
            <View style={styles.outfitHeader}>
              <Text style={[styles.outfitTitle, { color: colors.foreground }]}>
                오늘의 추천 코디
              </Text>
              <View style={[styles.scoreCircle, { backgroundColor: moduleTheme.body.dark }]}>
                <Text style={[styles.scoreCircleText, { color: colors.card }]}>
                  {outfit.totalScore}
                </Text>
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
              <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.tipsTitle, { color: colors.foreground }]}>💡 코디 팁</Text>
                {outfit.tips.map((tip, index) => (
                  <Text key={index} style={[styles.tipText, { color: colors.mutedForeground }]}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noOutfitContainer}>
            <Text style={[styles.noOutfitText, { color: colors.mutedForeground }]}>
              추천할 코디를 찾지 못했어요
            </Text>
            <Text style={[styles.noOutfitSubtext, { color: colors.mutedForeground }]}>
              상의와 하의가 필요해요
            </Text>
          </View>
        )}

        {/* 옷장 요약 */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>내 옷장 분석</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: status.success }]}>
                {summary.wellMatched}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                잘 어울림
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: status.warning }]}>
                {summary.needsImprovement}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                개선 필요
              </Text>
            </View>
          </View>
          {summary.suggestions.length > 0 && (
            <View style={[styles.suggestionsContainer, { borderTopColor: colors.border }]}>
              {summary.suggestions.map((suggestion, index) => (
                <Text
                  key={index}
                  style={[styles.suggestionText, { color: colors.mutedForeground }]}
                >
                  📌 {suggestion}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 새로고침 버튼 */}
      <TouchableOpacity
        style={[styles.refreshButton, { backgroundColor: moduleTheme.body.dark }]}
        onPress={handleRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color={colors.card} />
        ) : (
          <RefreshCw size={24} color={colors.card} />
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    marginTop: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  weatherCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircleText: {
    fontSize: 16,
    fontWeight: '700',
  },
  outfitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  outfitItem: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  outfitItemInfo: {
    padding: 10,
  },
  outfitItemLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  outfitItemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  scoreContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 2,
  },
  tipsCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  noOutfitContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noOutfitText: {
    fontSize: 15,
    marginBottom: 8,
  },
  noOutfitSubtext: {
    fontSize: 13,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    marginTop: 4,
  },
  suggestionsContainer: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  suggestionText: {
    fontSize: 13,
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
