/**
 * H-1 헤어 분석 — 결과 V2
 *
 * ResultLayout 3탭 구조:
 *  요약: 모발 유형 + 핵심 점수 4개
 *  상세: RadarChart 4축 + 주요 고민
 *  추천: 케어 루틴 + 추천 헤어스타일
 */
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  AnalysisLoadingState,
  AnalysisErrorState,
  ResultLayout,
  MetricBar,
  useAnalysisStyles,
} from '@/components/analysis';
import { RadarChart, type RadarDataItem } from '@/components/charts';
import { GradientCard, CelebrationEffect, BadgeDrop } from '@/components/ui';
import {
  analyzeHair as analyzeWithGemini,
  imageToBase64,
  type HairAnalysisResult,
} from '@/lib/gemini';
import { useUser } from '@clerk/clerk-expo';

import { AIBadge } from '@/components/common/AIBadge';
import { saveHairResult } from '@/lib/analysis';
import { captureError } from '@/lib/monitoring/sentry';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { TIMING } from '@/lib/animations';
import { typography, radii , spacing } from '@/lib/theme';

// 한국어 라벨 매핑
const TEXTURE_LABELS: Record<HairAnalysisResult['texture'], string> = {
  straight: '직모',
  wavy: '웨이브',
  curly: '컬리',
  coily: '코일리',
};

const THICKNESS_LABELS: Record<HairAnalysisResult['thickness'], string> = {
  fine: '가는 모발',
  medium: '보통 모발',
  thick: '굵은 모발',
};

const SCALP_LABELS: Record<HairAnalysisResult['scalpCondition'], string> = {
  dry: '건성 두피',
  oily: '지성 두피',
  normal: '정상 두피',
  sensitive: '민감성 두피',
};

export default function HairResultScreen() {
  const { module, colors, isDark } = useAnalysisStyles();
  const accent = module.hair;
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const { imageUri, imageBase64 } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<HairAnalysisResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const analyzeHair = useCallback(async () => {
    setIsLoading(true);
    setUsedFallback(false);
    try {
      let base64Data = imageBase64;
      if (!base64Data && imageUri) {
        base64Data = await imageToBase64(imageUri);
      }
      if (!base64Data) throw new Error('이미지 데이터가 없습니다.');

      const response = await analyzeWithGemini(base64Data);
      setUsedFallback(response.usedFallback);
      setResult(response.result);
      setShowCelebration(true);

      // DB 저장 (실패해도 분석 결과는 표시)
      if (user?.id) {
        saveHairResult(supabase, user.id, response.result, imageUri);
      }
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'hair-result',
        tags: { module: 'H-1', action: 'analyze' },
      });
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [imageUri, imageBase64]);

  useEffect(() => {
    analyzeHair();
  }, [analyzeHair]);

  const handleProductRecommendation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/products', params: { category: 'haircare' } });
  };

  if (isLoading) {
    return (
      <AnalysisLoadingState message="헤어 상태를 분석 중이에요..." testID="hair-loading" />
    );
  }

  if (!result) {
    return (
      <AnalysisErrorState
        message="분석에 실패했어요. 다시 시도해 주세요."
        onRetry={() => router.replace('/(analysis)/hair')}
        onGoHome={() => router.replace('/(tabs)')}
        testID="hair-error"
      />
    );
  }

  // RadarChart 데이터 (4축)
  const radarData: RadarDataItem[] = [
    { label: '윤기', value: result.scores.shine, maxValue: 100 },
    { label: '탄력', value: result.scores.elasticity, maxValue: 100 },
    { label: '밀도', value: result.scores.density, maxValue: 100 },
    { label: '두피', value: result.scores.scalpHealth, maxValue: 100 },
  ];

  // 평균 점수
  const avgScore = Math.round(
    (result.scores.shine + result.scores.elasticity + result.scores.density + result.scores.scalpHealth) / 4
  );

  // --- 헤더 콘텐츠 ---
  const headerContent = (
    <View style={localStyles.headerContent}>
      <AIBadge variant="small" />
      <Text style={[localStyles.typeName, { color: accent.base }]}>
        {TEXTURE_LABELS[result.texture]} / {THICKNESS_LABELS[result.thickness]}
      </Text>
      <Text style={[localStyles.subInfo, { color: colors.mutedForeground }]}>
        {SCALP_LABELS[result.scalpCondition]} · 손상도 {result.damageLevel}%
      </Text>
      <View style={[localStyles.scoreBadge, { backgroundColor: accent.base }]}>
        <Text style={[localStyles.scoreBadgeText, { color: colors.card }]}>종합 {avgScore}점</Text>
      </View>
    </View>
  );

  // --- 요약 탭 ---
  const summaryTab = (
    <View style={localStyles.tabContent}>
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>모발 점수</Text>
        <View style={localStyles.metricsGap}>
          <MetricBar label="윤기" value={result.scores.shine} />
          <MetricBar label="탄력" value={result.scores.elasticity} />
          <MetricBar label="밀도" value={result.scores.density} />
          <MetricBar label="두피 건강" value={result.scores.scalpHealth} />
        </View>
      </Animated.View>

      {result.mainConcerns.length > 0 && (
        <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>주요 고민</Text>
          <GradientCard variant="hair" style={localStyles.tipsCard}>
            {result.mainConcerns.map((concern, i) => (
              <View key={i} style={localStyles.tipItem}>
                <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
                <Text style={[localStyles.tipText, { color: colors.foreground }]}>{concern}</Text>
              </View>
            ))}
          </GradientCard>
        </Animated.View>
      )}
    </View>
  );

  // --- 상세 탭 ---
  const detailTab = (
    <View style={localStyles.tabContent}>
      <Animated.View
        entering={FadeInUp.duration(TIMING.normal)}
        style={localStyles.chartContainer}
      >
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
          모발 밸런스 차트
        </Text>
        <RadarChart
          data={radarData}
          size={220}
          animated
          fillColor={accent.base}
          strokeColor={accent.base}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(150).duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>손상 정도</Text>
        <MetricBar label={`손상도 ${result.damageLevel}%`} value={result.damageLevel} />
      </Animated.View>
    </View>
  );

  // --- 추천 탭 ---
  const recommendTab = (
    <View style={localStyles.tabContent}>
      {result.careRoutine.length > 0 && (
        <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            추천 케어 루틴
          </Text>
          <GradientCard variant="hair" style={localStyles.tipsCard}>
            {result.careRoutine.map((routine, i) => (
              <View key={i} style={localStyles.tipItem}>
                <Text style={[localStyles.stepNum, { color: accent.base }]}>{i + 1}.</Text>
                <Text style={[localStyles.tipText, { color: colors.foreground }]}>{routine}</Text>
              </View>
            ))}
          </GradientCard>
        </Animated.View>
      )}

      {result.recommendedStyles.length > 0 && (
        <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            추천 헤어스타일
          </Text>
          <View style={localStyles.tagContainer}>
            {result.recommendedStyles.map((style, i) => (
              <View
                key={i}
                style={[
                  localStyles.tag,
                  { backgroundColor: isDark ? `${accent.dark}20` : `${accent.light}30` },
                ]}
              >
                <Text style={[localStyles.tagText, { color: accent.base }]}>{style}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );

  return (
    <>
    <CelebrationEffect
      type="analysis_complete"
      visible={showCelebration}
      onComplete={() => {
        setShowCelebration(false);
        setShowBadge(true);
      }}
    />
    <BadgeDrop
      badge={{ icon: '💇', name: '헤어 전문가', description: '헤어 분석 완료!' }}
      visible={showBadge}
      onDismiss={() => setShowBadge(false)}
    />
    <ResultLayout
      moduleKey="hair"
      title="헤어 분석 결과"
      imageUri={imageUri}
      imageStyle={localStyles.hairImage}
      headerContent={headerContent}
      trustBadgeType={usedFallback ? 'questionnaire' : 'ai'}
      usedFallback={usedFallback}
      summaryTab={summaryTab}
      detailTab={detailTab}
      recommendTab={recommendTab}
      primaryActionText="💇 헤어 제품 추천"
      onPrimaryAction={handleProductRecommendation}
      retryPath="/(analysis)/hair"
      testID="hair-analysis-result"
    />
    </>
  );
}

const localStyles = StyleSheet.create({
  headerContent: {
    alignItems: 'center',
    gap: 6,
  },
  typeName: {
    fontSize: 22,
    fontWeight: '700',
  },
  subInfo: {
    fontSize: typography.size.sm,
  },
  scoreBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.xl,
    marginTop: spacing.xs,
  },
  scoreBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  hairImage: {
    width: 160,
    height: 200,
    borderRadius: radii.xl,
    borderWidth: 3,
  },
  tabContent: {
    gap: spacing.mlg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: '700',
    marginBottom: spacing.smx,
  },
  metricsGap: {
    gap: 14,
  },
  chartContainer: {
    alignItems: 'center',
  },
  tipsCard: {
    padding: spacing.md,
    gap: spacing.smd,
  },
  tipItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tipBullet: {
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  stepNum: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    lineHeight: 22,
    minWidth: 20,
  },
  tipText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
    flex: 1,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.circle,
  },
  tagText: {
    fontSize: typography.size.sm,
    fontWeight: '500',
  },
});
