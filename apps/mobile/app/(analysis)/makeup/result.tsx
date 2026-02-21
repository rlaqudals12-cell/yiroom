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
  commonAnalysisStyles,
  ANALYSIS_COLORS,
} from '@/components/analysis';
import {
  analyzeMakeup as analyzeWithGemini,
  imageToBase64,
  type MakeupAnalysisResult,
} from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';
import { useTheme } from '@/lib/theme';

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
  const { isDark } = useTheme();
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
        isDark={isDark}
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
        isDark={isDark}
        testID="makeup-error"
      />
    );
  }

  return (
    <SafeAreaView
      testID="analysis-makeup-result-screen"
      style={[commonAnalysisStyles.container, isDark && commonAnalysisStyles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={commonAnalysisStyles.content}>
        {imageUri && (
          <View style={commonAnalysisStyles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
          </View>
        )}

        {/* 주요 결과 */}
        <View style={[styles.resultCard, isDark && commonAnalysisStyles.cardDark]}>
          <AnalysisTrustBadge
            type={usedFallback ? 'questionnaire' : 'ai'}
            testID="makeup-trust-badge"
          />
          <Text style={[styles.label, isDark && commonAnalysisStyles.textMuted]}>
            얼굴형 · 톤 분석 결과
          </Text>
          <Text style={[styles.mainResult, isDark && commonAnalysisStyles.textLight]}>
            {FACE_SHAPE_LABELS[result.faceShape]} / {UNDERTONE_LABELS[result.undertone]}
          </Text>
          <Text style={[styles.subLabel, isDark && commonAnalysisStyles.textMuted]}>
            {EYE_SHAPE_LABELS[result.eyeShape]} · {LIP_SHAPE_LABELS[result.lipShape]}
          </Text>
        </View>

        {/* 점수 */}
        <View style={[commonAnalysisStyles.section, isDark && commonAnalysisStyles.cardDark]}>
          <Text
            style={[commonAnalysisStyles.sectionTitle, isDark && commonAnalysisStyles.textLight]}
          >
            메이크업 밸런스
          </Text>
          <MetricBar label="스킨톤" value={result.scores.skinTone} isDark={isDark} />
          <MetricBar label="아이 밸런스" value={result.scores.eyeBalance} isDark={isDark} />
          <MetricBar label="립 밸런스" value={result.scores.lipBalance} isDark={isDark} />
          <MetricBar label="종합" value={result.scores.overall} isDark={isDark} />
        </View>

        {/* 맞춤 추천 */}
        <View style={[commonAnalysisStyles.section, isDark && commonAnalysisStyles.cardDark]}>
          <Text
            style={[commonAnalysisStyles.sectionTitle, isDark && commonAnalysisStyles.textLight]}
          >
            맞춤 메이크업 추천
          </Text>
          {(Object.keys(result.recommendations) as (keyof MakeupAnalysisResult['recommendations'])[]).map(
            (key) => (
              <View key={key} style={styles.recommendationItem}>
                <Text style={[styles.recommendationLabel, isDark && commonAnalysisStyles.textLight]}>
                  {RECOMMENDATION_LABELS[key]}
                </Text>
                <Text style={[styles.recommendationText, isDark && commonAnalysisStyles.textMuted]}>
                  {result.recommendations[key]}
                </Text>
              </View>
            )
          )}
        </View>

        {/* 추천 컬러 */}
        {result.bestColors.length > 0 && (
          <View style={[commonAnalysisStyles.section, isDark && commonAnalysisStyles.cardDark]}>
            <Text
              style={[commonAnalysisStyles.sectionTitle, isDark && commonAnalysisStyles.textLight]}
            >
              추천 컬러 팔레트
            </Text>
            <View style={styles.colorPalette}>
              {result.bestColors.map((color, i) => (
                <View key={i} style={styles.colorChip}>
                  <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                  <Text style={[styles.colorLabel, isDark && commonAnalysisStyles.textMuted]}>
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

const styles = StyleSheet.create({
  resultImage: {
    width: 200,
    height: 250,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: ANALYSIS_COLORS.primary,
  },
  resultCard: {
    backgroundColor: ANALYSIS_COLORS.cardBackground,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  label: { fontSize: 14, color: ANALYSIS_COLORS.textSecondary, marginBottom: 8 },
  mainResult: { fontSize: 24, fontWeight: '700', color: ANALYSIS_COLORS.primary, marginBottom: 8 },
  subLabel: { fontSize: 15, color: ANALYSIS_COLORS.textSecondary },
  recommendationItem: { marginBottom: 16 },
  recommendationLabel: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 4 },
  recommendationText: { fontSize: 14, color: '#666', lineHeight: 22 },
  colorPalette: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorChip: { alignItems: 'center', gap: 6 },
  colorSwatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#e0e0e0' },
  colorLabel: { fontSize: 11, color: '#999' },
});
