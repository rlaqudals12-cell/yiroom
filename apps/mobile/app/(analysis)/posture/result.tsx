/**
 * Posture 자세 분석 - 결과 화면
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
  analyzePosture as analyzeWithGemini,
  imageToBase64,
  type PostureAnalysisResult,
} from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';
import { useTheme } from '@/lib/theme';

// 한국어 라벨 매핑
const POSTURE_TYPE_LABELS: Record<PostureAnalysisResult['postureType'], string> = {
  normal: '정상 자세',
  forward_head: '거북목',
  rounded_shoulders: '둥근 어깨',
  swayback: '스웨이백',
  flat_back: '일자 허리',
  kyphosis: '굽은 등',
};

export default function PostureResultScreen() {
  const { isDark } = useTheme();
  const { imageUri, imageBase64 } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<PostureAnalysisResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  const analyzePosture = useCallback(async () => {
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
        screen: 'posture-result',
        tags: { module: 'Posture', action: 'analyze' },
      });
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [imageUri, imageBase64]);

  useEffect(() => {
    analyzePosture();
  }, [analyzePosture]);

  const handleRetry = () => router.replace('/(analysis)/posture');
  const handleGoHome = () => router.replace('/(tabs)');
  const handleWorkoutRecommendation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/workout');
  };

  if (isLoading) {
    return (
      <AnalysisLoadingState
        message="자세를 분석 중이에요..."
        isDark={isDark}
        testID="posture-loading"
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
        testID="posture-error"
      />
    );
  }

  return (
    <SafeAreaView
      testID="analysis-posture-result-screen"
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
            testID="posture-trust-badge"
          />
          <Text style={[styles.label, isDark && commonAnalysisStyles.textMuted]}>
            자세 유형 분석 결과
          </Text>
          <Text style={[styles.mainResult, isDark && commonAnalysisStyles.textLight]}>
            {POSTURE_TYPE_LABELS[result.postureType]}
          </Text>
          <Text style={[styles.scoreLabel, isDark && commonAnalysisStyles.textMuted]}>
            종합 점수 {result.overallScore}점
          </Text>
        </View>

        {/* 점수 */}
        <View style={[commonAnalysisStyles.section, isDark && commonAnalysisStyles.cardDark]}>
          <Text
            style={[commonAnalysisStyles.sectionTitle, isDark && commonAnalysisStyles.textLight]}
          >
            정렬 점수
          </Text>
          <MetricBar label="머리 정렬" value={result.scores.headAlignment} isDark={isDark} />
          <MetricBar label="어깨 균형" value={result.scores.shoulderBalance} isDark={isDark} />
          <MetricBar label="척추 정렬" value={result.scores.spineAlignment} isDark={isDark} />
          <MetricBar label="골반 정렬" value={result.scores.hipAlignment} isDark={isDark} />
        </View>

        {/* 발견된 문제 */}
        {result.issues.length > 0 && (
          <View style={[commonAnalysisStyles.section, isDark && commonAnalysisStyles.cardDark]}>
            <Text
              style={[commonAnalysisStyles.sectionTitle, isDark && commonAnalysisStyles.textLight]}
            >
              발견된 문제
            </Text>
            {result.issues.map((issue, i) => (
              <Text key={i} style={[styles.listItem, isDark && commonAnalysisStyles.textMuted]}>
                · {issue}
              </Text>
            ))}
          </View>
        )}

        {/* 교정 운동 */}
        {result.exercises.length > 0 && (
          <View style={[commonAnalysisStyles.section, isDark && commonAnalysisStyles.cardDark]}>
            <Text
              style={[commonAnalysisStyles.sectionTitle, isDark && commonAnalysisStyles.textLight]}
            >
              추천 교정 운동
            </Text>
            {result.exercises.map((exercise, i) => (
              <View key={i} style={styles.exerciseCard}>
                <Text style={[styles.exerciseName, isDark && commonAnalysisStyles.textLight]}>
                  {i + 1}. {exercise.name}
                </Text>
                <Text style={[styles.exerciseDesc, isDark && commonAnalysisStyles.textMuted]}>
                  {exercise.description}
                </Text>
                <Text style={[styles.exerciseDuration, isDark && commonAnalysisStyles.textMuted]}>
                  {exercise.duration}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 생활 습관 팁 */}
        {result.dailyTips.length > 0 && (
          <View style={[commonAnalysisStyles.section, isDark && commonAnalysisStyles.cardDark]}>
            <Text
              style={[commonAnalysisStyles.sectionTitle, isDark && commonAnalysisStyles.textLight]}
            >
              생활 습관 조언
            </Text>
            {result.dailyTips.map((tip, i) => (
              <Text key={i} style={[styles.listItem, isDark && commonAnalysisStyles.textMuted]}>
                {i + 1}. {tip}
              </Text>
            ))}
          </View>
        )}

        <AnalysisResultButtons
          primaryText="🏋️ 교정 운동 시작하기"
          onPrimaryPress={handleWorkoutRecommendation}
          onGoHome={handleGoHome}
          onRetry={handleRetry}
          testID="posture-result-buttons"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  resultImage: {
    width: 160,
    height: 300,
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
  scoreLabel: { fontSize: 15, color: ANALYSIS_COLORS.textSecondary },
  listItem: { fontSize: 15, color: '#444', lineHeight: 26 },
  exerciseCard: { marginBottom: 16 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 4 },
  exerciseDesc: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 4 },
  exerciseDuration: { fontSize: 13, color: '#999' },
});
