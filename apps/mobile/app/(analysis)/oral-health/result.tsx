/**
 * OH-1 구강건강 분석 - 결과 화면
 */
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnalysisLoadingState,
  AnalysisErrorState,
  AnalysisTrustBadge,
  AnalysisResultButtons,
  MetricBar,
  useAnalysisStyles,
} from '@/components/analysis';
import {
  analyzeOralHealth as analyzeWithGemini,
  imageToBase64,
  type OralHealthAnalysisResult,
} from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';

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
  const { styles, module, isDark } = useAnalysisStyles();
  const accent = module.oralHealth;

  const { imageUri, imageBase64 } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<OralHealthAnalysisResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

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

  const handleRetry = () => router.replace('/(analysis)/oral-health');
  const handleGoHome = () => router.replace('/(tabs)');
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
        message="분석에 실패했습니다."
        onRetry={handleRetry}
        onGoHome={handleGoHome}
        testID="oral-health-error"
      />
    );
  }

  return (
    <SafeAreaView
      testID="analysis-oral-health-result-screen"
      style={styles.container}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={[localStyles.resultImage, { borderColor: accent.base }]}
            />
          </View>
        )}

        {/* 주요 결과 */}
        <View style={styles.resultCard}>
          <AnalysisTrustBadge
            type={usedFallback ? 'questionnaire' : 'ai'}
            testID="oral-health-trust-badge"
          />
          <Text style={styles.label}>구강건강 종합 점수</Text>
          <Text style={[localStyles.scoreText, { color: accent.base }]}>
            {result.overallScore}점
          </Text>
          <Text style={styles.subLabel}>
            치아 색조 {result.toothShade} · {GUM_HEALTH_LABELS[result.gumHealth]}
          </Text>
        </View>

        {/* 점수 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>세부 점수</Text>
          <MetricBar label="치아 밝기" value={result.scores.whiteness} />
          <MetricBar label="정렬도" value={result.scores.alignment} />
          <MetricBar label="잇몸 상태" value={result.scores.gumCondition} />
          <MetricBar label="구강 위생" value={result.scores.hygiene} />
        </View>

        {/* 미백 가능성 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>미백 가능성</Text>
          <View
            style={[
              localStyles.whiteningBadge,
              { backgroundColor: isDark ? accent.dark + '20' : accent.light + '30' },
            ]}
          >
            <Text style={[localStyles.whiteningText, { color: accent.base }]}>
              {WHITENING_LABELS[result.whiteningPotential]}
            </Text>
          </View>
        </View>

        {/* 주요 고민 */}
        {result.concerns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>발견된 문제</Text>
            {result.concerns.map((concern, i) => (
              <Text key={i} style={styles.listItem}>
                · {concern}
              </Text>
            ))}
          </View>
        )}

        {/* 추천 */}
        {result.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>관리 추천</Text>
            {result.recommendations.map((rec, i) => (
              <Text key={i} style={styles.listItem}>
                {i + 1}. {rec}
              </Text>
            ))}
          </View>
        )}

        <AnalysisResultButtons
          primaryText="🦷 구강관리 제품 추천"
          onPrimaryPress={handleProductRecommendation}
          onGoHome={handleGoHome}
          onRetry={handleRetry}
          testID="oral-health-result-buttons"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  resultImage: {
    width: 250,
    height: 180,
    borderRadius: 16,
    borderWidth: 4,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  whiteningBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  whiteningText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
