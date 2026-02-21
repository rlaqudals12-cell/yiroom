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
  commonAnalysisStyles,
  ANALYSIS_COLORS,
} from '@/components/analysis';
import {
  analyzeHair as analyzeWithGemini,
  imageToBase64,
  type HairAnalysisResult,
} from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';
import { useTheme } from '@/lib/theme';

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
  const { isDark } = useTheme();
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
        isDark={isDark}
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
        isDark={isDark}
        testID="hair-error"
      />
    );
  }

  return (
    <SafeAreaView
      testID="analysis-hair-result-screen"
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
            testID="hair-trust-badge"
          />
          <Text style={[styles.label, isDark && commonAnalysisStyles.textMuted]}>
            모발 유형 분석 결과
          </Text>
          <Text style={[styles.mainResult, isDark && commonAnalysisStyles.textLight]}>
            {TEXTURE_LABELS[result.texture]} / {THICKNESS_LABELS[result.thickness]}
          </Text>
          <Text style={[styles.scalpLabel, isDark && commonAnalysisStyles.textMuted]}>
            {SCALP_LABELS[result.scalpCondition]} · 손상도 {result.damageLevel}%
          </Text>
        </View>

        {/* 점수 */}
        <View style={[commonAnalysisStyles.section, isDark && commonAnalysisStyles.cardDark]}>
          <Text
            style={[commonAnalysisStyles.sectionTitle, isDark && commonAnalysisStyles.textLight]}
          >
            모발 점수
          </Text>
          <MetricBar label="윤기" value={result.scores.shine} isDark={isDark} />
          <MetricBar label="탄력" value={result.scores.elasticity} isDark={isDark} />
          <MetricBar label="밀도" value={result.scores.density} isDark={isDark} />
          <MetricBar label="두피 건강" value={result.scores.scalpHealth} isDark={isDark} />
        </View>

        {/* 주요 고민 */}
        {result.mainConcerns.length > 0 && (
          <View style={[commonAnalysisStyles.section, isDark && commonAnalysisStyles.cardDark]}>
            <Text
              style={[commonAnalysisStyles.sectionTitle, isDark && commonAnalysisStyles.textLight]}
            >
              주요 고민
            </Text>
            {result.mainConcerns.map((concern, i) => (
              <Text key={i} style={[styles.listItem, isDark && commonAnalysisStyles.textMuted]}>
                · {concern}
              </Text>
            ))}
          </View>
        )}

        {/* 케어 루틴 */}
        {result.careRoutine.length > 0 && (
          <View style={[commonAnalysisStyles.section, isDark && commonAnalysisStyles.cardDark]}>
            <Text
              style={[commonAnalysisStyles.sectionTitle, isDark && commonAnalysisStyles.textLight]}
            >
              추천 케어 루틴
            </Text>
            {result.careRoutine.map((routine, i) => (
              <Text key={i} style={[styles.listItem, isDark && commonAnalysisStyles.textMuted]}>
                {i + 1}. {routine}
              </Text>
            ))}
          </View>
        )}

        {/* 추천 스타일 */}
        {result.recommendedStyles.length > 0 && (
          <View style={[commonAnalysisStyles.section, isDark && commonAnalysisStyles.cardDark]}>
            <Text
              style={[commonAnalysisStyles.sectionTitle, isDark && commonAnalysisStyles.textLight]}
            >
              추천 헤어스타일
            </Text>
            <View style={styles.styleTags}>
              {result.recommendedStyles.map((style, i) => (
                <View key={i} style={styles.styleTag}>
                  <Text style={styles.styleTagText}>{style}</Text>
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
  scalpLabel: { fontSize: 15, color: ANALYSIS_COLORS.textSecondary },
  listItem: { fontSize: 15, color: '#444', lineHeight: 26 },
  styleTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  styleTag: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  styleTagText: { color: ANALYSIS_COLORS.primary, fontSize: 14, fontWeight: '500' },
});
