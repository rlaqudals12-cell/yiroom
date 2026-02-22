/**
 * M-1 메이크업 분석 — 결과 V2
 *
 * ResultLayout 3탭 구조:
 *  요약: 얼굴형/톤 + 핵심 점수
 *  상세: RadarChart 4축 + 부위별 추천
 *  추천: 추천 컬러 팔레트 + 메이크업 팁
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
  ColorPalette,
  useAnalysisStyles,
} from '@/components/analysis';
import { RadarChart, type RadarDataItem } from '@/components/charts';
import { GlassCard } from '@/components/ui';
import {
  analyzeMakeup as analyzeWithGemini,
  imageToBase64,
  type MakeupAnalysisResult,
} from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';
import { TIMING } from '@/lib/animations';

// 한국어 라벨 매핑
const FACE_SHAPE_LABELS: Record<MakeupAnalysisResult['faceShape'], string> = {
  oval: '계란형',
  round: '둥근형',
  square: '사각형',
  heart: '하트형',
  oblong: '긴 얼굴형',
  diamond: '다이아몬드형',
};

const UNDERTONE_LABELS: Record<MakeupAnalysisResult['undertone'], string> = {
  warm: '웜톤',
  cool: '쿨톤',
  neutral: '뉴트럴',
};

const EYE_SHAPE_LABELS: Record<MakeupAnalysisResult['eyeShape'], string> = {
  monolid: '무쌍',
  double: '유쌍',
  hooded: '속쌍',
  round: '동그란 눈',
  almond: '아몬드형',
};

const LIP_SHAPE_LABELS: Record<MakeupAnalysisResult['lipShape'], string> = {
  full: '도톰한 입술',
  thin: '얇은 입술',
  wide: '넓은 입술',
  bow: '큐피드 보우',
};

const RECOMMENDATION_LABELS: Record<keyof MakeupAnalysisResult['recommendations'], string> = {
  base: '베이스',
  eye: '아이 메이크업',
  lip: '립 메이크업',
  blush: '블러셔',
  contour: '컨투어링',
};

export default function MakeupResultScreen() {
  const { module, colors, isDark } = useAnalysisStyles();
  const accent = module.makeup;

  const { imageUri, imageBase64 } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<MakeupAnalysisResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  const analyzeMakeup = useCallback(async () => {
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
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'makeup-result',
        tags: { module: 'M-1', action: 'analyze' },
      });
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [imageUri, imageBase64]);

  useEffect(() => {
    analyzeMakeup();
  }, [analyzeMakeup]);

  const handleProductRecommendation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/products', params: { category: 'makeup' } });
  };

  if (isLoading) {
    return (
      <AnalysisLoadingState
        message="메이크업 스타일을 분석 중이에요..."
        testID="makeup-loading"
      />
    );
  }

  if (!result) {
    return (
      <AnalysisErrorState
        message="분석에 실패했어요. 다시 시도해 주세요."
        onRetry={() => router.replace('/(analysis)/makeup')}
        onGoHome={() => router.replace('/(tabs)')}
        testID="makeup-error"
      />
    );
  }

  // RadarChart 데이터 (4축)
  const radarData: RadarDataItem[] = [
    { label: '스킨톤', value: result.scores.skinTone, maxValue: 100 },
    { label: '아이', value: result.scores.eyeBalance, maxValue: 100 },
    { label: '립', value: result.scores.lipBalance, maxValue: 100 },
    { label: '종합', value: result.scores.overall, maxValue: 100 },
  ];

  // 추천 컬러 → ColorPalette 데이터
  const colorItems = result.bestColors.map((hex) => ({
    color: hex,
    name: hex,
  }));

  // --- 헤더 콘텐츠 ---
  const headerContent = (
    <View style={localStyles.headerContent}>
      <Text style={[localStyles.typeName, { color: accent.base }]}>
        {FACE_SHAPE_LABELS[result.faceShape]} / {UNDERTONE_LABELS[result.undertone]}
      </Text>
      <Text style={[localStyles.subInfo, { color: colors.mutedForeground }]}>
        {EYE_SHAPE_LABELS[result.eyeShape]} · {LIP_SHAPE_LABELS[result.lipShape]}
      </Text>
    </View>
  );

  // --- 요약 탭 ---
  const summaryTab = (
    <View style={localStyles.tabContent}>
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
          메이크업 밸런스
        </Text>
        <View style={localStyles.metricsGap}>
          <MetricBar label="스킨톤" value={result.scores.skinTone} />
          <MetricBar label="아이 밸런스" value={result.scores.eyeBalance} />
          <MetricBar label="립 밸런스" value={result.scores.lipBalance} />
          <MetricBar label="종합" value={result.scores.overall} />
        </View>
      </Animated.View>

      {result.bestColors.length > 0 && (
        <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            추천 컬러 팔레트
          </Text>
          <ColorPalette colors={colorItems} columns={4} animated testID="makeup-best-colors" />
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
          밸런스 차트
        </Text>
        <RadarChart
          data={radarData}
          size={220}
          animated
          fillColor={accent.base}
          strokeColor={accent.base}
        />
      </Animated.View>

      {/* 부위별 추천 */}
      <Animated.View entering={FadeInUp.delay(150).duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
          부위별 맞춤 추천
        </Text>
        {(Object.keys(result.recommendations) as (keyof MakeupAnalysisResult['recommendations'])[]).map(
          (key) => (
            <GlassCard key={key} style={localStyles.recCard}>
              <Text style={[localStyles.recLabel, { color: accent.base }]}>
                {RECOMMENDATION_LABELS[key]}
              </Text>
              <Text style={[localStyles.recText, { color: colors.foreground }]}>
                {result.recommendations[key]}
              </Text>
            </GlassCard>
          )
        )}
      </Animated.View>
    </View>
  );

  // --- 추천 탭 ---
  const recommendTab = (
    <View style={localStyles.tabContent}>
      {result.bestColors.length > 0 && (
        <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            나에게 어울리는 컬러
          </Text>
          <ColorPalette colors={colorItems} columns={3} animated testID="makeup-rec-colors" />
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>메이크업 팁</Text>
        <GlassCard style={localStyles.tipsCard}>
          <View style={localStyles.tipItem}>
            <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
            <Text style={[localStyles.tipText, { color: colors.foreground }]}>
              {FACE_SHAPE_LABELS[result.faceShape]}은 {result.recommendations.contour}
            </Text>
          </View>
          <View style={localStyles.tipItem}>
            <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
            <Text style={[localStyles.tipText, { color: colors.foreground }]}>
              {EYE_SHAPE_LABELS[result.eyeShape]}에는 {result.recommendations.eye}
            </Text>
          </View>
          <View style={localStyles.tipItem}>
            <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
            <Text style={[localStyles.tipText, { color: colors.foreground }]}>
              {LIP_SHAPE_LABELS[result.lipShape]}에는 {result.recommendations.lip}
            </Text>
          </View>
        </GlassCard>
      </Animated.View>
    </View>
  );

  return (
    <ResultLayout
      moduleKey="makeup"
      title="메이크업 분석 결과"
      imageUri={imageUri}
      imageStyle={localStyles.makeupImage}
      headerContent={headerContent}
      trustBadgeType={usedFallback ? 'questionnaire' : 'ai'}
      usedFallback={usedFallback}
      summaryTab={summaryTab}
      detailTab={detailTab}
      recommendTab={recommendTab}
      primaryActionText="💄 메이크업 제품 추천"
      onPrimaryAction={handleProductRecommendation}
      retryPath="/(analysis)/makeup"
      testID="makeup-analysis-result"
    />
  );
}

const localStyles = StyleSheet.create({
  headerContent: {
    alignItems: 'center',
    gap: 4,
  },
  typeName: {
    fontSize: 22,
    fontWeight: '700',
  },
  subInfo: {
    fontSize: 14,
  },
  makeupImage: {
    width: 140,
    height: 180,
    borderRadius: 16,
    borderWidth: 3,
  },
  tabContent: {
    gap: 20,
    paddingBottom: 8,
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
  recCard: {
    padding: 14,
    marginBottom: 10,
  },
  recLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  recText: {
    fontSize: 14,
    lineHeight: 20,
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
});
