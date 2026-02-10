/**
 * S-1 피부 분석 - 결과 화면
 *
 * CircularProgress와 ScoreChangeBadge를 활용한 피부 분석 결과 시각화
 */
import type { SkinType } from '@yiroom/shared';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CircularProgress,
  ScoreChangeBadge,
  MetricBar,
  AnalysisLoadingState,
  AnalysisErrorState,
  AnalysisTrustBadge,
  AnalysisResultButtons,
} from '@/components/analysis';
import {
  analyzeSkin as analyzeWithGemini,
  imageToBase64,
  type SkinAnalysisResult,
} from '@/lib/gemini';

import { SKIN_TYPE_DATA } from './constants';
import type { SkinMetrics, SkinMetricsDelta } from './types';

export default function SkinResultScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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

      // lib/gemini.ts의 analyzeSkin 호출
      const analysisResult: SkinAnalysisResult =
        await analyzeWithGemini(base64Data);

      // 결과 매핑
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

      // Mock fallback 감지 (기본 Mock 값인 경우)
      if (analysisResult.metrics.moisture === 65) {
        setUsedFallback(true);
      }

      // Mock 이전 분석 데이터 (실제 구현 시 DB에서 가져옴)
      const hasPreviousAnalysis = Math.random() > 0.5;
      const mockPreviousScore = hasPreviousAnalysis
        ? Math.floor(Math.random() * 30) + 50
        : null;

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
      console.error('[S-1] Analysis error:', error);
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
      <AnalysisLoadingState
        message="피부 상태를 분석 중이에요..."
        testID="skin-analysis-loading"
      />
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
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* AI 분석 신뢰도 표시 */}
        <AnalysisTrustBadge
          type={usedFallback ? 'fallback' : 'ai'}
          testID="skin-analysis-trust-badge"
        />

        {/* 종합 점수 카드 */}
        <View style={[styles.scoreCard, isDark && styles.cardDark]}>
          <View style={styles.scoreHeader}>
            <Text style={[styles.scoreLabel, isDark && styles.textMuted]}>
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
          <View style={styles.scoreContent}>
            {/* 결과 이미지 (작은 원형) */}
            {imageUri && (
              <View style={styles.smallImageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.smallResultImage}
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
        <View style={[styles.resultCard, isDark && styles.cardDark]}>
          <Text style={[styles.typeLabel, isDark && styles.textMuted]}>
            당신의 피부 타입은
          </Text>
          <Text style={[styles.typeName, isDark && styles.textLight]}>
            {typeData.name}
          </Text>
          <Text style={[styles.description, isDark && styles.textMuted]}>
            {typeData.description}
          </Text>
        </View>

        {/* 피부 지표 */}
        <View style={[styles.section, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            피부 분석 지표
          </Text>
          <View style={styles.metricsContainer}>
            <MetricBar
              label="수분도"
              value={metrics.moisture}
              delta={delta?.moisture}
              isDark={isDark}
            />
            <MetricBar
              label="유분도"
              value={metrics.oil}
              delta={delta?.oil}
              isDark={isDark}
            />
            <MetricBar
              label="모공"
              value={metrics.pores}
              delta={delta?.pores}
              isDark={isDark}
            />
            <MetricBar
              label="탄력"
              value={metrics.elasticity}
              delta={delta?.elasticity}
              isDark={isDark}
            />
            <MetricBar
              label="색소침착"
              value={metrics.pigmentation}
              delta={delta?.pigmentation}
              isDark={isDark}
            />
            <MetricBar
              label="민감도"
              value={metrics.sensitivity}
              delta={delta?.sensitivity}
              isDark={isDark}
            />
          </View>
        </View>

        {/* 스킨케어 팁 */}
        <View style={[styles.section, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            스킨케어 팁
          </Text>
          <View style={styles.tipsList}>
            {typeData.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, isDark && styles.textMuted]}>
                  {tip}
                </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
  },
  scoreCard: {
    backgroundColor: '#fff',
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
    color: '#333',
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
    borderColor: '#22c55e',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardDark: {
    backgroundColor: '#1a1a1a',
  },
  typeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  typeName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
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
    color: '#2e5afa',
    fontSize: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
