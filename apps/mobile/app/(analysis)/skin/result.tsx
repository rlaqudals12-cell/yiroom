/**
 * S-1 피부 분석 — 결과 V2
 *
 * ResultLayout 3탭 구조:
 *  요약: 피부 타입 + 핵심 지표 3개
 *  상세: RadarChart 6축 + 전체 MetricBar + 변화량
 *  추천: 스킨케어 팁 + 추천/주의 성분
 */
import type { SkinType } from '@yiroom/shared';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  CircularProgress,
  ScoreChangeBadge,
  MetricBar,
  AnalysisLoadingState,
  AnalysisErrorState,
  ResultLayout,
  useAnalysisStyles,
} from '@/components/analysis';
import { RadarChart, type RadarDataItem } from '@/components/charts';
import { GlassCard } from '@/components/ui';
import {
  analyzeSkin as analyzeWithGemini,
  imageToBase64,
  type SkinAnalysisResult,
} from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';
import { TIMING } from '@/lib/animations';

import { SKIN_TYPE_DATA, SCORE_WEIGHTS } from './_utils/constants';
import type { SkinMetrics, SkinMetricsDelta } from './_utils/types';

// 피부 타입별 성분 추천/주의 데이터
const INGREDIENT_DATA: Record<SkinType, { good: string[]; avoid: string[] }> = {
  dry: {
    good: ['히알루론산', '세라마이드', '스쿠알란', '시어버터', '글리세린'],
    avoid: ['알코올', '레티놀(고농도)', '살리실산'],
  },
  oily: {
    good: ['나이아신아마이드', '살리실산', '녹차추출물', '아연', '시카'],
    avoid: ['미네랄오일', '코코넛오일', '바셀린'],
  },
  combination: {
    good: ['히알루론산', '나이아신아마이드', '판테놀', '알로에', '센텔라'],
    avoid: ['고농도 오일', '강한 계면활성제', '인공향료'],
  },
  sensitive: {
    good: ['센텔라', '판테놀', '알란토인', '마데카소사이드', '오트밀'],
    avoid: ['알코올', '인공향료', '에센셜오일', 'AHA/BHA(고농도)'],
  },
  normal: {
    good: ['비타민C', '레티놀', '히알루론산', '펩타이드', '나이아신아마이드'],
    avoid: ['과도한 필링', '강한 계면활성제'],
  },
};

export default function SkinResultScreen() {
  const { module, colors, isDark } = useAnalysisStyles();
  const accent = module.skin;

  const { imageUri, imageBase64 } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [skinType, setSkinType] = useState<SkinType | null>(null);
  const [metrics, setMetrics] = useState<SkinMetrics | null>(null);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [delta, setDelta] = useState<SkinMetricsDelta | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  // 피부 분석 (lib/gemini 연동)
  const analyzeSkin = useCallback(async () => {
    setIsLoading(true);
    setUsedFallback(false);

    try {
      let base64Data = imageBase64;
      if (!base64Data && imageUri) {
        base64Data = await imageToBase64(imageUri);
      }

      if (!base64Data) {
        throw new Error('이미지 데이터가 없습니다.');
      }

      const response = await analyzeWithGemini(base64Data);
      const analysisResult = response.result;

      setUsedFallback(response.usedFallback);
      setSkinType(analysisResult.skinType);
      setMetrics(analysisResult.metrics);

      // 종합 점수 (가중 평균)
      const score = Math.round(
        analysisResult.metrics.moisture * SCORE_WEIGHTS.moisture +
          analysisResult.metrics.elasticity * SCORE_WEIGHTS.elasticity +
          analysisResult.metrics.pores * SCORE_WEIGHTS.pores +
          analysisResult.metrics.wrinkles * SCORE_WEIGHTS.wrinkles +
          analysisResult.metrics.pigmentation * SCORE_WEIGHTS.pigmentation +
          analysisResult.metrics.oil * SCORE_WEIGHTS.oil +
          (100 - analysisResult.metrics.sensitivity) * SCORE_WEIGHTS.sensitivity
      );
      setOverallScore(score);

      // Mock 이전 분석 데이터 (실제 구현 시 DB에서 가져옴)
      const hasPreviousAnalysis = Math.random() > 0.5;
      const mockPreviousScore = hasPreviousAnalysis ? Math.floor(Math.random() * 30) + 50 : null;

      const mockDelta: SkinMetricsDelta = {
        moisture: Math.floor(Math.random() * 10) - 5,
        oil: Math.floor(Math.random() * 10) - 5,
        pores: Math.floor(Math.random() * 8) - 4,
        wrinkles: Math.floor(Math.random() * 6) - 3,
        pigmentation: Math.floor(Math.random() * 8) - 4,
        sensitivity: Math.floor(Math.random() * 10) - 5,
        elasticity: Math.floor(Math.random() * 8) - 4,
        overall: mockPreviousScore ? score - mockPreviousScore : 0,
      };

      setDelta(mockDelta);
      setPreviousScore(mockPreviousScore);
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'skin-result',
        tags: { module: 'S-1', action: 'analyze' },
      });
      setSkinType(null);
    } finally {
      setIsLoading(false);
    }
  }, [imageUri, imageBase64]);

  useEffect(() => {
    analyzeSkin();
  }, [analyzeSkin]);

  const handleProductRecommendation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/products',
      params: { skinType: skinType || '', category: 'skincare' },
    });
  };

  if (isLoading) {
    return (
      <AnalysisLoadingState
        message="피부 상태를 분석 중이에요..."
        testID="skin-analysis-loading"
      />
    );
  }

  if (!skinType || !metrics) {
    return (
      <AnalysisErrorState
        message="분석에 실패했어요. 다시 시도해 주세요."
        onRetry={() => router.replace('/(analysis)/skin')}
        testID="skin-analysis-error"
      />
    );
  }

  const typeData = SKIN_TYPE_DATA[skinType];
  const ingredients = INGREDIENT_DATA[skinType];

  // RadarChart 데이터 (6축)
  const radarData: RadarDataItem[] = [
    { label: '수분', value: metrics.moisture, maxValue: 100 },
    { label: '유분', value: metrics.oil, maxValue: 100 },
    { label: '모공', value: metrics.pores, maxValue: 100 },
    { label: '탄력', value: metrics.elasticity, maxValue: 100 },
    { label: '색소', value: metrics.pigmentation, maxValue: 100 },
    { label: '민감', value: 100 - metrics.sensitivity, maxValue: 100 },
  ];

  // --- 헤더 콘텐츠 ---
  const headerContent = (
    <View style={localStyles.headerContent}>
      <CircularProgress
        score={overallScore}
        size="lg"
        animate
        showScore
        showGradeLabel
        isDark={isDark}
      />
      {delta && delta.overall !== 0 && (
        <ScoreChangeBadge
          delta={delta.overall}
          size="sm"
          previousScore={previousScore || undefined}
          showPreviousScore={previousScore !== null}
          isDark={isDark}
        />
      )}
      <Text style={[localStyles.typeName, { color: accent.base }]}>{typeData.name}</Text>
    </View>
  );

  // --- 요약 탭 ---
  const summaryTab = (
    <View style={localStyles.tabContent}>
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <GlassCard style={localStyles.descCard}>
          <Text style={[localStyles.descText, { color: colors.foreground }]}>
            {typeData.description}
          </Text>
        </GlassCard>
      </Animated.View>

      {/* 핵심 지표 3개 */}
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>핵심 지표</Text>
        <View style={localStyles.metricsGap}>
          <MetricBar label="수분도" value={metrics.moisture} delta={delta?.moisture} />
          <MetricBar label="탄력" value={metrics.elasticity} delta={delta?.elasticity} />
          <MetricBar label="민감도" value={metrics.sensitivity} delta={delta?.sensitivity} />
        </View>
      </Animated.View>
    </View>
  );

  // --- 상세 탭 ---
  const detailTab = (
    <View style={localStyles.tabContent}>
      {/* RadarChart */}
      <Animated.View
        entering={FadeInUp.duration(TIMING.normal)}
        style={localStyles.chartContainer}
      >
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
          피부 밸런스 차트
        </Text>
        <RadarChart
          data={radarData}
          size={240}
          animated
          fillColor={accent.base}
          strokeColor={accent.base}
        />
      </Animated.View>

      {/* 전체 MetricBar */}
      <Animated.View entering={FadeInUp.delay(150).duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>세부 지표</Text>
        <View style={localStyles.metricsGap}>
          <MetricBar label="수분도" value={metrics.moisture} delta={delta?.moisture} />
          <MetricBar label="유분도" value={metrics.oil} delta={delta?.oil} />
          <MetricBar label="모공" value={metrics.pores} delta={delta?.pores} />
          <MetricBar label="탄력" value={metrics.elasticity} delta={delta?.elasticity} />
          <MetricBar label="색소침착" value={metrics.pigmentation} delta={delta?.pigmentation} />
          <MetricBar label="민감도" value={metrics.sensitivity} delta={delta?.sensitivity} />
        </View>
      </Animated.View>
    </View>
  );

  // --- 추천 탭 ---
  const recommendTab = (
    <View style={localStyles.tabContent}>
      {/* 스킨케어 팁 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>스킨케어 팁</Text>
        <GlassCard style={localStyles.tipsCard}>
          {typeData.tips.map((tip, index) => (
            <View key={index} style={localStyles.tipItem}>
              <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
              <Text style={[localStyles.tipText, { color: colors.foreground }]}>{tip}</Text>
            </View>
          ))}
        </GlassCard>
      </Animated.View>

      {/* 추천 성분 */}
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>추천 성분</Text>
        <View style={localStyles.tagContainer}>
          {ingredients.good.map((item, index) => (
            <View
              key={index}
              style={[localStyles.tag, { backgroundColor: isDark ? '#16A34A20' : '#DCFCE7' }]}
            >
              <Text style={[localStyles.tagText, { color: isDark ? '#4ADE80' : '#16A34A' }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* 주의 성분 */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>주의 성분</Text>
        <View style={localStyles.tagContainer}>
          {ingredients.avoid.map((item, index) => (
            <View
              key={index}
              style={[localStyles.tag, { backgroundColor: isDark ? '#B91C1C20' : '#FEE2E2' }]}
            >
              <Text style={[localStyles.tagText, { color: isDark ? '#F87171' : '#B91C1C' }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );

  return (
    <ResultLayout
      moduleKey="skin"
      title="피부 분석 결과"
      imageUri={imageUri}
      imageStyle={localStyles.skinImage}
      headerContent={headerContent}
      trustBadgeType={usedFallback ? 'fallback' : 'ai'}
      usedFallback={usedFallback}
      summaryTab={summaryTab}
      detailTab={detailTab}
      recommendTab={recommendTab}
      primaryActionText="🧴 피부 맞춤 제품 보기"
      onPrimaryAction={handleProductRecommendation}
      retryPath="/(analysis)/skin"
      testID="skin-analysis-result"
    />
  );
}

const localStyles = StyleSheet.create({
  headerContent: {
    alignItems: 'center',
    gap: 8,
  },
  typeName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  skinImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  tabContent: {
    gap: 20,
    paddingBottom: 8,
  },
  descCard: {
    padding: 16,
  },
  descText: {
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  metricsGap: {
    gap: 14,
  },
  chartContainer: {
    alignItems: 'center',
  },
  tipsCard: {
    padding: 16,
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 8,
  },
  tipBullet: {
    fontSize: 16,
    lineHeight: 22,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
