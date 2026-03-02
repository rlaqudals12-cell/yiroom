/**
 * 오늘의 코디 추천 페이지
 * 퍼스널컬러, 체형, 날씨 기반 코디 추천
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Bookmark, RefreshCw, Thermometer, CloudRain, Sun, Cloud } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useUserAnalyses } from '@/hooks/useUserAnalyses';
import { ScreenContainer, SuccessCheckmark } from '../../components/ui';
import { useTheme, typography, radii , spacing } from '@/lib/theme';

import type { Season as ClothingSeason } from '../../lib/inventory/types';
import { useSavedOutfits } from '../../lib/inventory/useInventory';
import {
  useClosetMatcher,
  type OutfitSuggestion,
  type PersonalColorSeason,
  type BodyType3,
} from '../../lib/inventory/useClosetMatcher';
import { useWeather } from '../../lib/weather';

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

// 날씨 아이콘 컴포넌트
function WeatherIcon({ condition, color }: { condition: string; color: string }): React.JSX.Element {
  if (condition.includes('비') || condition.includes('소나기')) {
    return <CloudRain size={16} color={color} />;
  }
  if (condition.includes('맑') || condition.includes('쾌청')) {
    return <Sun size={16} color={color} />;
  }
  return <Cloud size={16} color={color} />;
}

export default function RecommendScreen() {
  const { colors, module: moduleTheme, status, typography, spacing} = useTheme();
  const router = useRouter();

  // 실제 사용자 분석 결과에서 가져오기
  const { personalColor: pcResult, bodyAnalysis } = useUserAnalyses();
  const personalColor = mapSeason(pcResult?.season);
  const bodyType = mapBodyType(bodyAnalysis?.bodyType);

  // 날씨 서비스 연동
  const { temp, locationName, weather, isLoading: weatherLoading } = useWeather({
    region: 'seoul',
  });

  const { items, isLoading, summary, getOutfitSuggestion, refetch } = useClosetMatcher({
    personalColor,
    bodyType,
  });
  const { saveOutfit, outfits: savedOutfits } = useSavedOutfits();

  const [outfit, setOutfit] = useState<OutfitSuggestion | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // generateOutfit을 먼저 정의 (useEffect에서 사용)
  const generateOutfit = useCallback(() => {
    const suggestion = getOutfitSuggestion({ temp });
    setOutfit(suggestion);
  }, [getOutfitSuggestion, temp]);

  // 날씨 데이터 준비되면 코디 추천
  useEffect(() => {
    if (!isLoading && !weatherLoading && items.length > 0) {
      generateOutfit();
    }
  }, [isLoading, weatherLoading, items, generateOutfit]);

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

  // 현재 코디의 아이템 ID 수집
  const getOutfitItemIds = useCallback((): string[] => {
    if (!outfit) return [];
    const ids: string[] = [];
    if (outfit.top) ids.push(outfit.top.item.id);
    if (outfit.bottom) ids.push(outfit.bottom.item.id);
    if (outfit.outer) ids.push(outfit.outer.item.id);
    if (outfit.shoes) ids.push(outfit.shoes.item.id);
    if (outfit.bag) ids.push(outfit.bag.item.id);
    if (outfit.accessory) ids.push(outfit.accessory.item.id);
    return ids;
  }, [outfit]);

  // 현재 코디가 이미 저장되었는지 확인
  const isOutfitAlreadySaved = useCallback((): boolean => {
    const currentIds = getOutfitItemIds().sort().join(',');
    if (!currentIds) return false;
    return savedOutfits.some((saved) => saved.itemIds.sort().join(',') === currentIds);
  }, [getOutfitItemIds, savedOutfits]);

  // 현재 시즌 → Season[] 변환
  const getCurrentSeasons = useCallback((): ClothingSeason[] => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return ['spring'];
    if (month >= 5 && month <= 7) return ['summer'];
    if (month >= 8 && month <= 10) return ['autumn'];
    return ['winter'];
  }, []);

  const handleSaveOutfit = async () => {
    if (!outfit || isSaving) return;

    if (isOutfitAlreadySaved()) {
      Alert.alert('알림', '이미 저장된 코디예요.');
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const itemIds = getOutfitItemIds();
    const today = new Date().toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    });

    const result = await saveOutfit({
      name: `${today} 추천 코디`,
      description: `${personalColor} / ${bodyType === 'S' ? '스트레이트' : bodyType === 'W' ? '웨이브' : '내추럴'} / ${temp}°C`,
      itemIds,
      collageImageUrl: null,
      occasion: 'casual',
      season: getCurrentSeasons(),
      wearCount: 0,
      lastWornAt: null,
    });

    setIsSaving(false);

    if (result) {
      setShowSuccess(true);
    } else {
      Alert.alert('오류', '코디 저장에 실패했어요.');
    }
  };

  const renderOutfitItem = (label: string, item: OutfitSuggestion['top'] | undefined) => {
    if (!item) return null;

    return (
      <Pressable
        style={[styles.outfitItem, { backgroundColor: colors.card }]}
        onPress={() => handleItemPress(item.item.id)}
      >
        <View style={styles.outfitImageContainer}>
          {item.item.imageUrl ? (
            <Image
              source={{ uri: item.item.imageUrl }}
              style={styles.outfitImage}
              contentFit="cover"
              transition={200}
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
      </Pressable>
    );
  };

  if (isLoading) {
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

  if (items.length === 0) {
    return (
      <ScreenContainer testID="closet-recommend-screen" edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👗</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            옷장에 아이템이 없어요
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            옷장에 아이템을 추가하면{'\n'}코디 추천을 받을 수 있어요
          </Text>
          <Pressable
            style={[styles.emptyButton, { backgroundColor: moduleTheme.body.dark }]}
            onPress={() => router.push('/(closet)')}
          >
            <Text style={[styles.emptyButtonText, { color: colors.card }]}>옷장으로 가기</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      testID="closet-recommend-screen"
      edges={['bottom']}
      contentPadding={0}
    >
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
            {weather?.current && (
              <View style={styles.weatherItem}>
                <WeatherIcon condition={weather.current.description} color={colors.mutedForeground} />
                <Text style={[styles.weatherText, { color: colors.mutedForeground }]}>
                  {weather.current.description}
                </Text>
              </View>
            )}
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

            {/* 코디 저장 버튼 */}
            <Pressable
              style={[
                styles.saveOutfitButton,
                {
                  backgroundColor: isOutfitAlreadySaved()
                    ? colors.muted
                    : moduleTheme.body.dark,
                },
                isSaving && styles.saveOutfitButtonDisabled,
              ]}
              onPress={handleSaveOutfit}
              disabled={isSaving || isOutfitAlreadySaved()}
              testID="save-outfit-button"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.card} />
              ) : (
                <>
                  <Bookmark
                    size={18}
                    color={isOutfitAlreadySaved() ? colors.mutedForeground : colors.card}
                    fill={isOutfitAlreadySaved() ? colors.mutedForeground : 'none'}
                  />
                  <Text
                    style={[
                      styles.saveOutfitButtonText,
                      {
                        color: isOutfitAlreadySaved()
                          ? colors.mutedForeground
                          : colors.card,
                      },
                    ]}
                  >
                    {isOutfitAlreadySaved() ? '저장됨' : '코디 저장'}
                  </Text>
                </>
              )}
            </Pressable>
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
      {/* 새로고침 버튼 */}
      <Pressable
        style={[styles.refreshButton, { backgroundColor: moduleTheme.body.dark }]}
        onPress={handleRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color={colors.card} />
        ) : (
          <RefreshCw size={24} color={colors.card} />
        )}
      </Pressable>

      {/* 저장 완료 애니메이션 */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <SuccessCheckmark visible size={80} onComplete={() => setShowSuccess(false)} />
        </View>
      )}
    </ScreenContainer>
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
    marginTop: spacing.smx,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  weatherCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.smx,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherText: {
    fontSize: typography.size.sm,
  },
  weatherIcon: {
    fontSize: typography.size.sm,
  },
  weatherTags: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.smx,
    paddingVertical: 6,
    borderRadius: radii.smx,
  },
  tagText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  outfitSection: {
    marginBottom: spacing.md,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  outfitTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircleText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  outfitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.smx,
  },
  outfitItem: {
    width: '48%',
    borderRadius: radii.smx,
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
    padding: spacing.smd,
  },
  outfitItemLabel: {
    fontSize: 11,
    marginBottom: spacing.xxs,
  },
  outfitItemName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
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
    borderRadius: radii.smx,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  noOutfitContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  noOutfitText: {
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  noOutfitSubtext: {
    fontSize: 13,
  },
  summaryCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  summaryTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
  },
  summaryLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing.xs,
  },
  suggestionsContainer: {
    borderTopWidth: 1,
    paddingTop: spacing.smx,
  },
  suggestionText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.smx,
    borderRadius: radii.smx,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  saveOutfitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.smx,
  },
  saveOutfitButtonDisabled: {
    opacity: 0.6,
  },
  saveOutfitButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
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
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});
