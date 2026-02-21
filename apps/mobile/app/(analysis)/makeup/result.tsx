/**
 * M-1 메이크업 분석 - 결과 화면
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
  analyzeMakeup as analyzeWithGemini,
  imageToBase64,
  type MakeupAnalysisResult,
} from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';

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
  const { styles, module, colors } = useAnalysisStyles();
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

  const handleRetry = () => router.replace('/(analysis)/makeup');
  const handleGoHome = () => router.replace('/(tabs)');
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
        message="분석에 실패했습니다."
        onRetry={handleRetry}
        onGoHome={handleGoHome}
        testID="makeup-error"
      />
    );
  }

  return (
    <SafeAreaView
      testID="analysis-makeup-result-screen"
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
            testID="makeup-trust-badge"
          />
          <Text style={styles.label}>얼굴형 · 톤 분석 결과</Text>
          <Text style={[localStyles.mainResult, { color: accent.base }]}>
            {FACE_SHAPE_LABELS[result.faceShape]} / {UNDERTONE_LABELS[result.undertone]}
          </Text>
          <Text style={styles.subLabel}>
            {EYE_SHAPE_LABELS[result.eyeShape]} · {LIP_SHAPE_LABELS[result.lipShape]}
          </Text>
        </View>

        {/* 점수 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>메이크업 밸런스</Text>
          <MetricBar label="스킨톤" value={result.scores.skinTone} />
          <MetricBar label="아이 밸런스" value={result.scores.eyeBalance} />
          <MetricBar label="립 밸런스" value={result.scores.lipBalance} />
          <MetricBar label="종합" value={result.scores.overall} />
        </View>

        {/* 맞춤 추천 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>맞춤 메이크업 추천</Text>
          {(Object.keys(result.recommendations) as (keyof MakeupAnalysisResult['recommendations'])[]).map(
            (key) => (
              <View key={key} style={localStyles.recommendationItem}>
                <Text style={[localStyles.recommendationLabel, { color: colors.foreground }]}>
                  {RECOMMENDATION_LABELS[key]}
                </Text>
                <Text style={[localStyles.recommendationText, { color: colors.mutedForeground }]}>
                  {result.recommendations[key]}
                </Text>
              </View>
            )
          )}
        </View>

        {/* 추천 컬러 */}
        {result.bestColors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>추천 컬러 팔레트</Text>
            <View style={localStyles.colorPalette}>
              {result.bestColors.map((color, i) => (
                <View key={i} style={localStyles.colorChip}>
                  <View
                    style={[
                      localStyles.colorSwatch,
                      { backgroundColor: color, borderColor: colors.border },
                    ]}
                  />
                  <Text style={[localStyles.colorLabel, { color: colors.mutedForeground }]}>
                    {color}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <AnalysisResultButtons
          primaryText="💄 메이크업 제품 추천"
          onPrimaryPress={handleProductRecommendation}
          onGoHome={handleGoHome}
          onRetry={handleRetry}
          testID="makeup-result-buttons"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  resultImage: {
    width: 200,
    height: 250,
    borderRadius: 16,
    borderWidth: 4,
  },
  mainResult: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  recommendationItem: {
    marginBottom: 16,
  },
  recommendationLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 22,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorChip: {
    alignItems: 'center',
    gap: 6,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  colorLabel: {
    fontSize: 11,
  },
});
