/**
 * H-1 헤어 분석 - 결과 화면
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
  analyzeHair as analyzeWithGemini,
  imageToBase64,
  type HairAnalysisResult,
} from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';

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
  const { styles, module, isDark } = useAnalysisStyles();
  const accent = module.hair;

  const { imageUri, imageBase64 } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<HairAnalysisResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

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

  const handleRetry = () => router.replace('/(analysis)/hair');
  const handleGoHome = () => router.replace('/(tabs)');
  const handleProductRecommendation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/products', params: { category: 'haircare' } });
  };

  if (isLoading) {
    return (
      <AnalysisLoadingState
        message="헤어 상태를 분석 중이에요..."
        testID="hair-loading"
      />
    );
  }

  if (!result) {
    return (
      <AnalysisErrorState
        message="분석에 실패했습니다."
        onRetry={handleRetry}
        onGoHome={handleGoHome}
        testID="hair-error"
      />
    );
  }

  return (
    <SafeAreaView
      testID="analysis-hair-result-screen"
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
            testID="hair-trust-badge"
          />
          <Text style={styles.label}>모발 유형 분석 결과</Text>
          <Text style={[localStyles.mainResult, { color: accent.base }]}>
            {TEXTURE_LABELS[result.texture]} / {THICKNESS_LABELS[result.thickness]}
          </Text>
          <Text style={styles.subLabel}>
            {SCALP_LABELS[result.scalpCondition]} · 손상도 {result.damageLevel}%
          </Text>
        </View>

        {/* 점수 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>모발 점수</Text>
          <MetricBar label="윤기" value={result.scores.shine} />
          <MetricBar label="탄력" value={result.scores.elasticity} />
          <MetricBar label="밀도" value={result.scores.density} />
          <MetricBar label="두피 건강" value={result.scores.scalpHealth} />
        </View>

        {/* 주요 고민 */}
        {result.mainConcerns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>주요 고민</Text>
            {result.mainConcerns.map((concern, i) => (
              <Text key={i} style={styles.listItem}>
                · {concern}
              </Text>
            ))}
          </View>
        )}

        {/* 케어 루틴 */}
        {result.careRoutine.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>추천 케어 루틴</Text>
            {result.careRoutine.map((routine, i) => (
              <Text key={i} style={styles.listItem}>
                {i + 1}. {routine}
              </Text>
            ))}
          </View>
        )}

        {/* 추천 스타일 */}
        {result.recommendedStyles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>추천 헤어스타일</Text>
            <View style={localStyles.styleTags}>
              {result.recommendedStyles.map((style, i) => (
                <View
                  key={i}
                  style={[
                    localStyles.styleTag,
                    { backgroundColor: isDark ? accent.dark + '20' : accent.light + '30' },
                  ]}
                >
                  <Text style={[localStyles.styleTagText, { color: accent.base }]}>{style}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <AnalysisResultButtons
          primaryText="💇 헤어 제품 추천"
          onPrimaryPress={handleProductRecommendation}
          onGoHome={handleGoHome}
          onRetry={handleRetry}
          testID="hair-result-buttons"
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
  styleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  styleTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  styleTagText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
