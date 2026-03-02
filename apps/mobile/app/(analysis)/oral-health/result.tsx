/**
 * OH-1 구강건강 분석 — 결과 V2
 *
 * ResultLayout 3탭 구조:
 *  요약: 종합 점수(CircularProgress) + 핵심 지표
 *  상세: RadarChart 4축 + 미백 가능성 + 치아 색조
 *  추천: 발견된 문제 + 관리 추천
 */
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { FadeInUp, type AnimatedStyle } from 'react-native-reanimated';

import {
  CircularProgress,
  AnalysisLoadingState,
  AnalysisErrorState,
  ResultLayout,
  MetricBar,
  useAnalysisStyles,
} from '@/components/analysis';
import { RadarChart, type RadarDataItem } from '@/components/charts';
import { GradientCard, CelebrationEffect, BadgeDrop } from '@/components/ui';
import {
  analyzeOralHealth as analyzeWithGemini,
  imageToBase64,
  type OralHealthAnalysisResult,
} from '@/lib/gemini';
import { AIBadge } from '@/components/common/AIBadge';
import { captureError } from '@/lib/monitoring/sentry';
import { TIMING, usePulseGlow } from '@/lib/animations';
import { typography, radii , spacing } from '@/lib/theme';

// 한국어 라벨 매핑
const GUM_HEALTH_LABELS: Record<OralHealthAnalysisResult['gumHealth'], string> = {
  healthy: '건강한 잇몸',
  mild_inflammation: '경미한 염증',
  moderate_inflammation: '중등도 염증',
  severe: '심한 염증',
};

const WHITENING_LABELS: Record<OralHealthAnalysisResult['whiteningPotential'], string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export default function OralHealthResultScreen() {
  const { module, colors, status, isDark } = useAnalysisStyles();
  const accent = module.oralHealth;

  const { imageUri, imageBase64 } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<OralHealthAnalysisResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  // 높은 점수(>=70) 시 CircularProgress 펄스 글로우
  const pulseGlowStyle = usePulseGlow(accent.base, 0.2);

  const analyzeOralHealth = useCallback(async () => {
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
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'oral-health-result',
        tags: { module: 'OH-1', action: 'analyze' },
      });
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [imageUri, imageBase64]);

  useEffect(() => {
    analyzeOralHealth();
  }, [analyzeOralHealth]);

  const handleProductRecommendation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/products', params: { category: 'oral-care' } });
  };

  if (isLoading) {
    return (
      <AnalysisLoadingState
        message="구강 상태를 분석 중이에요..."
        testID="oral-health-loading"
      />
    );
  }

  if (!result) {
    return (
      <AnalysisErrorState
        message="분석에 실패했어요. 다시 시도해 주세요."
        onRetry={() => router.replace('/(analysis)/oral-health')}
        onGoHome={() => router.replace('/(tabs)')}
        testID="oral-health-error"
      />
    );
  }

  // RadarChart 데이터 (4축)
  const radarData: RadarDataItem[] = [
    { label: '밝기', value: result.scores.whiteness, maxValue: 100 },
    { label: '정렬', value: result.scores.alignment, maxValue: 100 },
    { label: '잇몸', value: result.scores.gumCondition, maxValue: 100 },
    { label: '위생', value: result.scores.hygiene, maxValue: 100 },
  ];

  // --- 헤더 콘텐츠 ---
  const headerContent = (
    <View style={localStyles.headerContent}>
      <AIBadge variant="small" />
      <Animated.View style={result.overallScore >= 70 ? (pulseGlowStyle as AnimatedStyle<ViewStyle>) : undefined}>
        <CircularProgress
          score={result.overallScore}
          size="lg"
          animate
          showScore
          showGradeLabel
        />
      </Animated.View>
      <Text style={[localStyles.subInfo, { color: colors.mutedForeground }]}>
        치아 색조 {result.toothShade} · {GUM_HEALTH_LABELS[result.gumHealth]}
      </Text>
    </View>
  );

  // --- 요약 탭 ---
  const summaryTab = (
    <View style={localStyles.tabContent}>
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>세부 점수</Text>
        <View style={localStyles.metricsGap}>
          <MetricBar label="치아 밝기" value={result.scores.whiteness} />
          <MetricBar label="정렬도" value={result.scores.alignment} />
          <MetricBar label="잇몸 상태" value={result.scores.gumCondition} />
          <MetricBar label="구강 위생" value={result.scores.hygiene} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>미백 가능성</Text>
        <View
          style={[
            localStyles.whiteningBadge,
            { backgroundColor: isDark ? `${accent.dark}20` : `${accent.light}30` },
          ]}
        >
          <Text style={[localStyles.whiteningText, { color: accent.base }]}>
            {WHITENING_LABELS[result.whiteningPotential]}
          </Text>
        </View>
      </Animated.View>
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
          구강건강 차트
        </Text>
        <RadarChart
          data={radarData}
          size={220}
          animated
          fillColor={accent.base}
          strokeColor={accent.base}
        />
      </Animated.View>

      {/* 발견된 문제 */}
      {result.concerns.length > 0 && (
        <Animated.View entering={FadeInUp.delay(150).duration(TIMING.normal)}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            발견된 문제
          </Text>
          <GradientCard variant="oralHealth" style={localStyles.tipsCard}>
            {result.concerns.map((concern, i) => (
              <View key={i} style={localStyles.tipItem}>
                <Text style={[localStyles.tipBullet, { color: status.error }]}>
                  !
                </Text>
                <Text style={[localStyles.tipText, { color: colors.foreground }]}>{concern}</Text>
              </View>
            ))}
          </GradientCard>
        </Animated.View>
      )}
    </View>
  );

  // --- 추천 탭 ---
  const recommendTab = (
    <View style={localStyles.tabContent}>
      {result.recommendations.length > 0 && (
        <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            관리 추천
          </Text>
          <GradientCard variant="oralHealth" style={localStyles.tipsCard}>
            {result.recommendations.map((rec, i) => (
              <View key={i} style={localStyles.tipItem}>
                <Text style={[localStyles.stepNum, { color: accent.base }]}>{i + 1}.</Text>
                <Text style={[localStyles.tipText, { color: colors.foreground }]}>{rec}</Text>
              </View>
            ))}
          </GradientCard>
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <GradientCard variant="oralHealth" style={localStyles.tipsCard}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground, marginBottom: spacing.xs }]}>
            일반 관리 팁
          </Text>
          <View style={localStyles.tipItem}>
            <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
            <Text style={[localStyles.tipText, { color: colors.foreground }]}>
              하루 3번, 식후 3분 이내 양치하기
            </Text>
          </View>
          <View style={localStyles.tipItem}>
            <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
            <Text style={[localStyles.tipText, { color: colors.foreground }]}>
              치실은 매일 사용하기
            </Text>
          </View>
          <View style={localStyles.tipItem}>
            <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
            <Text style={[localStyles.tipText, { color: colors.foreground }]}>
              6개월마다 스케일링 받기
            </Text>
          </View>
        </GradientCard>
      </Animated.View>
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
      badge={{ icon: '🦷', name: '구강건강 전문가', description: '구강건강 분석 완료!' }}
      visible={showBadge}
      onDismiss={() => setShowBadge(false)}
    />
    <ResultLayout
      moduleKey="oralHealth"
      title="구강건강 분석 결과"
      imageUri={imageUri}
      imageStyle={localStyles.oralImage}
      headerContent={headerContent}
      trustBadgeType={usedFallback ? 'questionnaire' : 'ai'}
      usedFallback={usedFallback}
      summaryTab={summaryTab}
      detailTab={detailTab}
      recommendTab={recommendTab}
      primaryActionText="🦷 구강관리 제품 추천"
      onPrimaryAction={handleProductRecommendation}
      retryPath="/(analysis)/oral-health"
      testID="oral-health-analysis-result"
    />
    </>
  );
}

const localStyles = StyleSheet.create({
  headerContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  subInfo: {
    fontSize: typography.size.sm,
  },
  oralImage: {
    width: 200,
    height: 150,
    borderRadius: radii.xl,
    borderWidth: 3,
  },
  tabContent: {
    gap: spacing.mlg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.smx,
  },
  metricsGap: {
    gap: 14,
  },
  chartContainer: {
    alignItems: 'center',
  },
  whiteningBadge: {
    paddingHorizontal: spacing.mlg,
    paddingVertical: spacing.smd,
    borderRadius: radii.circle,
    alignSelf: 'flex-start',
  },
  whiteningText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
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
    fontWeight: typography.weight.bold,
  },
  stepNum: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    lineHeight: 22,
    minWidth: 20,
  },
  tipText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
    flex: 1,
  },
});
