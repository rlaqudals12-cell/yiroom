/**
 * Posture 자세 분석 - 결과 화면
 */
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

import { ScreenContainer } from '@/components/ui';

import {
  AnalysisLoadingState,
  AnalysisErrorState,
  AnalysisTrustBadge,
  AnalysisResultButtons,
  MetricBar,
  useAnalysisStyles,
} from '@/components/analysis';
import {
  analyzePosture as analyzeWithGemini,
  imageToBase64,
  type PostureAnalysisResult,
} from '@/lib/gemini';
import { CelebrationEffect, BadgeDrop } from '@/components/ui';
import { captureError } from '@/lib/monitoring/sentry';
import { typography } from '@/lib/theme';

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
  const { styles, module, colors } = useAnalysisStyles();
  const accent = module.posture;

  const { imageUri, imageBase64 } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<PostureAnalysisResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

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
      setShowCelebration(true);
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
        testID="posture-error"
      />
    );
  }

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
      badge={{ icon: '🧘', name: '자세 교정사', description: '자세 분석 완료!' }}
      visible={showBadge}
      onDismiss={() => setShowBadge(false)}
    />
    <ScreenContainer
      testID="analysis-posture-result-screen"
      style={styles.container}
      contentContainerStyle={styles.content}
      edges={['bottom']}
    >
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
            testID="posture-trust-badge"
          />
          <Text style={styles.label}>자세 유형 분석 결과</Text>
          <Text style={[localStyles.mainResult, { color: accent.base }]}>
            {POSTURE_TYPE_LABELS[result.postureType]}
          </Text>
          <Text style={styles.subLabel}>종합 점수 {result.overallScore}점</Text>
        </View>

        {/* 점수 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>정렬 점수</Text>
          <MetricBar label="머리 정렬" value={result.scores.headAlignment} />
          <MetricBar label="어깨 균형" value={result.scores.shoulderBalance} />
          <MetricBar label="척추 정렬" value={result.scores.spineAlignment} />
          <MetricBar label="골반 정렬" value={result.scores.hipAlignment} />
        </View>

        {/* 발견된 문제 */}
        {result.issues.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>발견된 문제</Text>
            {result.issues.map((issue, i) => (
              <Text key={i} style={styles.listItem}>
                · {issue}
              </Text>
            ))}
          </View>
        )}

        {/* 교정 운동 */}
        {result.exercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>추천 교정 운동</Text>
            {result.exercises.map((exercise, i) => (
              <View key={i} style={localStyles.exerciseCard}>
                <Text style={[localStyles.exerciseName, { color: colors.foreground }]}>
                  {i + 1}. {exercise.name}
                </Text>
                <Text style={[localStyles.exerciseDesc, { color: colors.mutedForeground }]}>
                  {exercise.description}
                </Text>
                <Text style={[localStyles.exerciseDuration, { color: colors.mutedForeground }]}>
                  {exercise.duration}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 생활 습관 팁 */}
        {result.dailyTips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>생활 습관 조언</Text>
            {result.dailyTips.map((tip, i) => (
              <Text key={i} style={styles.listItem}>
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
    </ScreenContainer>
    </>
  );
}

const localStyles = StyleSheet.create({
  resultImage: {
    width: 160,
    height: 300,
    borderRadius: 16,
    borderWidth: 4,
  },
  mainResult: {
    fontSize: typography.size['2xl'],
    fontWeight: '700',
    marginBottom: 8,
  },
  exerciseCard: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: typography.size.base,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseDesc: {
    fontSize: typography.size.sm,
    lineHeight: 22,
    marginBottom: 4,
  },
  exerciseDuration: {
    fontSize: 13,
  },
});
