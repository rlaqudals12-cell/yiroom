/** 퍼스널컬러·체형·날씨를 실제 옷장 아이템과 조합하는 오늘의 코디 화면. */

import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { useUserAnalyses } from '@/hooks/useUserAnalyses';

import {
  BODY_TYPE_LABELS,
  getCurrentSeasons,
  getNoOutfitHint,
  getOutfitItemIds,
  mapBodyType,
  mapSeason,
} from './recommend.utils';
import { RecommendOutfitSection } from './RecommendOutfitSection';
import {
  RecommendEmptyState,
  RecommendFloatingActions,
  RecommendLoadingState,
  RecommendSummaryCard,
} from './RecommendScreenParts';
import { RecommendWeatherCard } from './RecommendWeatherCard';
import { ScreenContainer } from '../../components/ui';
import type { OutfitSuggestion } from '../../lib/inventory/useClosetMatcher';
import { useClosetMatcher } from '../../lib/inventory/useClosetMatcher';
import { useSavedOutfits } from '../../lib/inventory/useInventory';
import { useWeather } from '../../lib/weather';

export default function RecommendScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string; session?: string }>();
  const isFromIntegrated = params.source === 'integrated';
  const integratedSessionId = typeof params.session === 'string' ? params.session : undefined;

  const { personalColor: pcResult, bodyAnalysis } = useUserAnalyses();
  const personalColor = mapSeason(pcResult?.season);
  const bodyType = mapBodyType(bodyAnalysis?.bodyType);
  const bodyTypeLabel = bodyType ? BODY_TYPE_LABELS[bodyType] : null;
  const hasDiagnosis = personalColor !== null || bodyType !== null;

  const {
    temp,
    locationName,
    weather,
    isLoading: weatherLoading,
  } = useWeather({
    region: 'seoul',
    // 실제 위치가 아니라 서비스 기본값이므로 화면에서 "서울 기준"으로 고지한다.
    locationSource: 'default',
  });
  // 폴백 수치는 관측값이 아니므로 추천·저장 근거에서 완전히 제외한다.
  const effectiveTemp = weather?.usedFallback ? null : temp;

  const { items, isLoading, summary, getOutfitSuggestion, refetch } = useClosetMatcher({
    personalColor,
    bodyType,
  });
  const { saveOutfit, outfits: savedOutfits } = useSavedOutfits();
  const [outfit, setOutfit] = useState<OutfitSuggestion | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const generateOutfit = useCallback(() => {
    setOutfit(getOutfitSuggestion({ temp: effectiveTemp }));
  }, [effectiveTemp, getOutfitSuggestion]);

  useEffect(() => {
    if (!isLoading && !weatherLoading && items.length > 0) generateOutfit();
  }, [generateOutfit, isLoading, items, weatherLoading]);

  const outfitItemIds = useMemo(() => getOutfitItemIds(outfit), [outfit]);
  const noOutfitHint = useMemo(() => getNoOutfitHint(items), [items]);
  const isOutfitAlreadySaved = useMemo(() => {
    const currentIds = [...outfitItemIds].sort().join(',');
    if (!currentIds) return false;
    return savedOutfits.some((saved) => [...saved.itemIds].sort().join(',') === currentIds);
  }, [outfitItemIds, savedOutfits]);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefreshing(true);
    await refetch();
    generateOutfit();
    setIsRefreshing(false);
  }, [generateOutfit, refetch]);

  const handleItemPress = useCallback(
    (id: string) => {
      Haptics.selectionAsync();
      router.push(`/(closet)/${id}`);
    },
    [router]
  );

  const handleAnalyzePress = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/(analysis)/integrated' as never);
  }, [router]);

  const handleSaveOutfit = useCallback(async () => {
    if (!outfit || isSaving) return;
    if (isOutfitAlreadySaved) {
      router.push('/(closet)/outfits');
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const today = new Date().toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    });
    const result = await saveOutfit(
      {
        name: `${today} 추천 코디`,
        // 설명은 실제 추천 근거만 사용하며 없는 진단은 적지 않는다.
        description: [
          personalColor,
          bodyTypeLabel,
          effectiveTemp != null ? `${effectiveTemp}°C` : null,
        ]
          .filter(Boolean)
          .join(' · '),
        itemIds: outfitItemIds,
        collageImageUrl: null,
        occasion: 'casual',
        season: getCurrentSeasons(),
        wearCount: 0,
        lastWornAt: null,
      },
      'recommendation'
    );

    setIsSaving(false);
    if (result) setShowSuccess(true);
    else Alert.alert('오류', '코디 저장에 실패했어요.');
  }, [
    bodyTypeLabel,
    effectiveTemp,
    isOutfitAlreadySaved,
    isSaving,
    outfit,
    outfitItemIds,
    personalColor,
    router,
    saveOutfit,
  ]);

  const handleEmptyPress = useCallback(() => {
    if (!isFromIntegrated) {
      router.push('/(closet)' as never);
      return;
    }
    const query = new URLSearchParams({ source: 'integrated' });
    if (integratedSessionId) query.set('session', integratedSessionId);
    router.push(`/(closet)/add?${query.toString()}` as never);
  }, [integratedSessionId, isFromIntegrated, router]);

  if (isLoading) return <RecommendLoadingState />;
  if (items.length === 0) {
    return <RecommendEmptyState isFromIntegrated={isFromIntegrated} onPress={handleEmptyPress} />;
  }

  return (
    <ScreenContainer
      testID="closet-recommend-screen"
      backgroundGradient="style"
      edges={['bottom']}
      contentPadding={0}
    >
      <RecommendWeatherCard
        weather={weather}
        locationName={locationName}
        effectiveTemp={effectiveTemp}
        personalColor={personalColor}
        bodyTypeLabel={bodyTypeLabel}
        hasDiagnosis={hasDiagnosis}
        onAnalyzePress={handleAnalyzePress}
      />
      <RecommendOutfitSection
        outfit={outfit}
        noOutfitHint={noOutfitHint}
        isSaving={isSaving}
        isAlreadySaved={isOutfitAlreadySaved}
        onItemPress={handleItemPress}
        onSave={handleSaveOutfit}
      />
      <RecommendSummaryCard summary={summary} />
      <RecommendFloatingActions
        isRefreshing={isRefreshing}
        showSuccess={showSuccess}
        onRefresh={handleRefresh}
        onSuccessComplete={() => setShowSuccess(false)}
      />
    </ScreenContainer>
  );
}
