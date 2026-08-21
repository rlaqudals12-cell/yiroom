/** 자세 분석 결과를 ADR-120 진단지 문법으로 표시한다. */
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnalysisErrorState,
  AnalysisLoadingState,
  AnalysisResultButtons,
  ReportAttrRow,
  ReportEvidenceDisclosure,
  ReportHero,
  ReportRowTable,
  ReportTextList,
  REPORT_COLORS,
} from '@/components/analysis';
import { BadgeDrop, CelebrationEffect } from '@/components/ui';
import {
  analyzePosture as analyzeWithGemini,
  imageToBase64,
  type PostureAnalysisResult,
} from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';
import { radii, shadows, spacing, typography } from '@/lib/theme';

const POSTURE_TYPE_LABELS: Record<PostureAnalysisResult['postureType'], string> = {
  normal: '정상 자세',
  forward_head: '거북목',
  rounded_shoulders: '둥근 어깨',
  swayback: '스웨이백',
  flat_back: '일자 허리',
  kyphosis: '굽은 등',
};

export default function PostureResultScreen(): React.JSX.Element {
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
      if (!base64Data && imageUri) base64Data = await imageToBase64(imageUri);
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
  }, [imageBase64, imageUri]);

  useEffect(() => {
    void analyzePosture();
  }, [analyzePosture]);

  const handleRetry = (): void => router.replace('/(analysis)/posture');
  const handleGoHome = (): void => router.replace('/(tabs)');

  if (isLoading) {
    return <AnalysisLoadingState message="자세를 분석 중이에요..." testID="posture-loading" />;
  }

  if (!result) {
    return (
      <AnalysisErrorState
        message="분석에 실패했습니다."
        onGoHome={handleGoHome}
        onRetry={handleRetry}
        testID="posture-error"
      />
    );
  }

  const firstExercise = result.exercises[0];

  return (
    <>
      <CelebrationEffect
        onComplete={() => {
          setShowCelebration(false);
          setShowBadge(true);
        }}
        type="analysis_complete"
        visible={showCelebration}
      />
      <BadgeDrop
        badge={{ icon: '🧘', name: '자세 교정사', description: '자세 분석 완료!' }}
        onDismiss={() => setShowBadge(false)}
        visible={showBadge}
      />
      <SafeAreaView
        edges={['bottom']}
        style={styles.ground}
        testID="analysis-posture-result-screen"
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.sheet}>
            <ReportHero
              eyebrow="자세 분석 결과"
              subtitle={result.issues[0]}
              testID="posture-report-hero"
              title={POSTURE_TYPE_LABELS[result.postureType]}
            />

            {usedFallback ? (
              <View accessibilityRole="alert" style={styles.fallback} testID="posture-fallback">
                <Text style={styles.fallbackTitle}>예시 결과예요</Text>
                <Text style={styles.fallbackText}>
                  AI 분석을 이용할 수 없어 참고용 결과를 표시하고 있어요.
                </Text>
              </View>
            ) : null}

            {imageUri ? <Image source={{ uri: imageUri }} style={styles.resultImage} /> : null}

            <View style={styles.attributes}>
              <ReportRowTable testID="posture-report-attrs">
                <ReportAttrRow label="우선 확인" value={result.issues[0] ?? '특이사항 없음'} />
                <ReportAttrRow label="먼저 할 운동" value={firstExercise?.name ?? '추천 없음'} />
                {firstExercise?.duration ? (
                  <ReportAttrRow label="권장 시간" value={firstExercise.duration} />
                ) : null}
              </ReportRowTable>
            </View>

            {result.issues.length > 0 ? (
              <ReportEvidenceDisclosure
                summary={result.issues[0]}
                testID="posture-issues"
                title="발견 근거"
              >
                <ReportTextList items={result.issues} />
              </ReportEvidenceDisclosure>
            ) : null}

            {result.exercises.length > 0 ? (
              <ReportEvidenceDisclosure
                summary={firstExercise?.name}
                testID="posture-exercises"
                title="교정 운동"
              >
                <ReportTextList
                  items={result.exercises.map(
                    (exercise) =>
                      `${exercise.name} — ${exercise.description} (${exercise.duration})`
                  )}
                />
              </ReportEvidenceDisclosure>
            ) : null}

            {result.dailyTips.length > 0 ? (
              <ReportEvidenceDisclosure
                summary={result.dailyTips[0]}
                testID="posture-daily-tips"
                title="생활 습관 조언"
              >
                <ReportTextList items={result.dailyTips} />
              </ReportEvidenceDisclosure>
            ) : null}

            <Text style={styles.trustText}>
              분석 결과는 참고 정보이며, 의학적 진단을 대체하지 않아요.
            </Text>
          </View>

          <AnalysisResultButtons
            onGoHome={handleGoHome}
            onRetry={handleRetry}
            testID="posture-result-buttons"
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  ground: { backgroundColor: REPORT_COLORS.ground, flex: 1 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  sheet: {
    ...shadows.card,
    backgroundColor: REPORT_COLORS.paper,
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.mlg,
  },
  fallback: {
    backgroundColor: REPORT_COLORS.warningWash,
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.smd,
  },
  fallbackTitle: {
    color: REPORT_COLORS.warningInk,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  fallbackText: { color: REPORT_COLORS.mutedInk, fontSize: typography.size.xs, lineHeight: 18 },
  resultImage: {
    alignSelf: 'flex-start',
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.lg,
    borderWidth: 1,
    height: 240,
    marginTop: spacing.mlg,
    width: 128,
  },
  attributes: { marginVertical: spacing.mlg },
  trustText: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    lineHeight: 18,
    marginTop: spacing.md,
  },
});
