/**
 * S-1 피부 분석 - 결과 화면
 *
 * CircularProgress와 ScoreChangeBadge를 활용한 피부 분석 결과 시각화
 */
import type { SkinType } from '@yiroom/shared';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';

// eslint-disable-next-line import/order
import { captureError } from '../../../lib/monitoring/sentry';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CircularProgress,
  ScoreChangeBadge,
  MetricBar,
  AnalysisLoadingState,
  AnalysisErrorState,
  AnalysisTrustBadge,
  AnalysisResultButtons,
  useAnalysisStyles,
} from '@/components/analysis';
import {
  analyzeSkin as analyzeWithGemini,
  imageToBase64,
  type SkinAnalysisResult,
} from '@/lib/gemini';

import { SKIN_TYPE_DATA } from './constants';
import type { SkinMetrics, SkinMetricsDelta } from './types';

export default function SkinResultScreen() {
  const { styles, module, colors, isDark } = useAnalysisStyles();
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

  // 피부 분석 (lib/gemini.ts 연동)
  const analyzeSkin = useCallback(async () => {
    setIsLoading(true);
    setUsedFallback(false);

    try {
      // imageBase64가 없으면 imageUri에서 변환
      let base64Data = imageBase64;
      if (!base64Data && imageUri) {
        base64Data = await imageToBase64(imageUri);
      }

      if (!base64Data) {
        throw new Error('이미지 데이터가 없습니다.');
      }

      // lib/gemini의 analyzeSkin 호출 (usedFallback 포함)
      const response = await analyzeWithGemini(base64Data);
      const analysisResult = response.result;

      setUsedFallback(response.usedFallback);
      setSkinType(analysisResult.skinType);
      setMetrics(analysisResult.metrics);

      // 종합 점수 계산 (가중 평균)
      const score = Math.round(
        analysisResult.metrics.moisture * 0.2 +
          analysisResult.metrics.elasticity * 0.2 +
          analysisResult.metrics.pores * 0.15 +
          analysisResult.metrics.wrinkles * 0.15 +
          analysisResult.metrics.pigmentation * 0.1 +
          analysisResult.metrics.oil * 0.1 +
          (100 - analysisResult.metrics.sensitivity) * 0.1
      );
      setOverallScore(score);

      // Mock 이전 분석 데이터 (실제 구현 시 DB에서 가져옴)
      const hasPreviousAnalysis = Math.random() > 0.5;
      const mockPreviousScore = hasPreviousAnalysis ? Math.floor(Math.random() * 30) + 50 : null;

      // 변화량 계산
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

  // 피부 맞춤 제품 추천으로 이동
  const handleProductRecommendation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/products',
      params: {
        skinType: skinType || '',
        category: 'skincare',
      },
    });
  };

  const handleRetry = () => {
    router.replace('/(analysis)/skin');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <AnalysisLoadingState message="피부 상태를 분석 중이에요..." testID="skin-analysis-loading" />
    );
  }

  if (!skinType || !metrics) {
    return (
      <AnalysisErrorState
        message="분석에 실패했습니다."
        onRetry={handleRetry}
        testID="skin-analysis-error"
      />
    );
  }

  const typeData = SKIN_TYPE_DATA[skinType];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* AI 분석 신뢰도 표시 */}
        <AnalysisTrustBadge
          type={usedFallback ? 'fallback' : 'ai'}
          testID="skin-analysis-trust-badge"
        />

        {/* 종합 점수 카드 */}
        <View style={[localStyles.scoreCard, { backgroundColor: colors.card }]}>
          <View style={localStyles.scoreHeader}>
            <Text style={[localStyles.scoreLabel, { color: colors.foreground }]}>
              피부 건강 점수
            </Text>
            {delta && delta.overall !== 0 && (
              <ScoreChangeBadge
                delta={delta.overall}
                size="sm"
                previousScore={previousScore || undefined}
                showPreviousScore={previousScore !== null}
                isDark={isDark}
              />
            )}
          </View>
          <View style={localStyles.scoreContent}>
            {/* 결과 이미지 (작은 원형) */}
            {imageUri && (
              <View style={localStyles.smallImageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={[localStyles.smallResultImage, { borderColor: accent.base }]}
                />
              </View>
            )}
            {/* CircularProgress */}
            <CircularProgress
              score={overallScore}
              size="lg"
              animate
              showScore
              showGradeLabel
              isDark={isDark}
            />
          </View>
        </View>

        {/* 피부 타입 결과 */}
        <View style={styles.resultCard}>
          <Text style={styles.label}>당신의 피부 타입은</Text>
          <Text style={[localStyles.typeName, { color: accent.base }]}>{typeData.name}</Text>
          <Text style={styles.description}>{typeData.description}</Text>
        </View>

        {/* 피부 지표 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>피부 분석 지표</Text>
          <View style={localStyles.metricsContainer}>
            <MetricBar label="수분도" value={metrics.moisture} delta={delta?.moisture} />
            <MetricBar label="유분도" value={metrics.oil} delta={delta?.oil} />
            <MetricBar label="모공" value={metrics.pores} delta={delta?.pores} />
            <MetricBar label="탄력" value={metrics.elasticity} delta={delta?.elasticity} />
            <MetricBar label="색소침착" value={metrics.pigmentation} delta={delta?.pigmentation} />
            <MetricBar label="민감도" value={metrics.sensitivity} delta={delta?.sensitivity} />
          </View>
        </View>

        {/* 스킨케어 팁 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>스킨케어 팁</Text>
          <View style={localStyles.tipsList}>
            {typeData.tips.map((tip, index) => (
              <View key={index} style={localStyles.tipItem}>
                <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
                <Text style={[styles.listItem, { flex: 1 }]}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 버튼 */}
        <AnalysisResultButtons
          primaryText="🧴 피부 맞춤 제품 보기"
          onPrimaryPress={handleProductRecommendation}
          onGoHome={handleGoHome}
          onRetry={handleRetry}
          testID="skin-analysis-buttons"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  scoreCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  smallImageContainer: {
    alignItems: 'center',
  },
  smallResultImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
  },
  typeName: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
  },
  metricsContainer: {
    gap: 14,
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 8,
  },
  tipBullet: {
    fontSize: 16,
  },
});
