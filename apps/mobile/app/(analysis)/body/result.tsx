/** C-1 체형 분석 결과 — ADR-120 진단지 문법. */
import { useAuth } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import {
  AnalysisErrorState,
  AnalysisLoadingState,
  REPORT_COLORS,
  ReportActionList,
  ReportAttrRow,
  ReportInkNumber,
  ReportResultLayout,
  ReportRowTable,
  ReportTextList,
  type ReportSection,
} from '@/components/analysis';
import { BodyReportEvidence } from '@/components/analysis/body/BodyReportEvidence';
import { AxisResultShareSection } from '@/components/share';
import { BadgeDrop, CelebrationEffect } from '@/components/ui';
import { buildBodyTopActions } from '@/lib/analysis';
import { BodyApiError, requestBodyAnalysis, type BodyAnalysisApiResult } from '@/lib/api/body';
import { imageToBase64 } from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';
import { radii, spacing, typography } from '@/lib/theme';

const BMI_CAVEAT = 'BMI는 근육량에 따라 실제와 다를 수 있어요';
const DEFAULT_ERROR_MESSAGE = '분석에 실패했어요. 다시 시도해 주세요.';

export default function BodyResultScreen(): React.JSX.Element {
  const { getToken } = useAuth();
  const { height, weight, imageUri, imageBase64 } = useLocalSearchParams<{
    height: string;
    weight: string;
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<BodyAnalysisApiResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>(DEFAULT_ERROR_MESSAGE);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const analyzeBody = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setAnalysis(null);

    try {
      let base64Data = imageBase64;
      if (!base64Data && imageUri) {
        base64Data = await imageToBase64(imageUri);
      }
      if (!base64Data) throw new Error('이미지 데이터가 없습니다.');

      const token = await getToken();
      if (!token) {
        throw new BodyApiError('로그인이 필요해요. 다시 로그인해주세요.', 401, 'AUTH_ERROR');
      }

      const result = await requestBodyAnalysis(
        {
          imageBase64: base64Data,
          height: parseFloat(height),
          weight: parseFloat(weight),
        },
        token
      );
      setAnalysis(result);
      setShowCelebration(true);
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'body-result',
        tags: { module: 'C-1', action: 'analyze' },
      });
      setErrorMessage(error instanceof BodyApiError ? error.message : DEFAULT_ERROR_MESSAGE);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, height, imageBase64, imageUri, weight]);

  // clerk-expo getToken 참조가 바뀌어도 화면 진입당 분석은 한 번만 실행한다.
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void analyzeBody();
  }, [analyzeBody]);

  const handleNextAxis = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(analysis)/personal-color');
  }, []);

  if (isLoading) {
    return (
      <AnalysisLoadingState message="체형을 분석 중이에요..." testID="body-analysis-loading" />
    );
  }

  const heightNumber = parseFloat(height);
  const weightNumber = parseFloat(weight);
  const derivedBmi =
    Number.isFinite(heightNumber) && heightNumber > 0 && Number.isFinite(weightNumber)
      ? weightNumber / (heightNumber / 100) ** 2
      : null;
  const bmi = analysis?.bmi ?? derivedBmi;

  if (!analysis || bmi === null) {
    return (
      <AnalysisErrorState
        message={errorMessage}
        onGoHome={() => router.replace('/(tabs)')}
        onRetry={() => router.replace('/(analysis)/body')}
        testID="body-analysis-error"
      />
    );
  }

  const recommendationItems = analysis.styleRecommendations.map(
    (recommendation) => recommendation.item
  );
  const topActions = buildBodyTopActions({
    recommendations: recommendationItems,
    avoidItems: analysis.avoidStyles,
  });
  const bodyDescription = analysis.bodyTypeDescription || `${analysis.bodyTypeLabel} 골격이에요.`;

  const sections: ReportSection[] = [
    {
      key: 'basis',
      title: '체형 설명',
      summary: bodyDescription,
      content: (
        <>
          <Text style={styles.evidenceText}>{bodyDescription}</Text>
          {analysis.insight ? <Text style={styles.supportingText}>{analysis.insight}</Text> : null}
        </>
      ),
    },
  ];

  if (analysis.strengths.length > 0) {
    sections.push({
      key: 'strengths',
      title: '체형 강점',
      summary: analysis.strengths[0],
      content: <ReportTextList items={analysis.strengths} testID="body-strengths" />,
    });
  }

  if (analysis.styleRecommendations.length > 0 || analysis.avoidStyles.length > 0) {
    sections.push({
      key: 'recommendations',
      title: '추천 근거와 피할 스타일',
      summary: analysis.styleRecommendations[0]?.item ?? analysis.avoidStyles[0],
      content: (
        <ReportRowTable testID="body-recommendation-rows">
          {analysis.styleRecommendations.map((recommendation, index) => (
            <ReportAttrRow
              key={`${recommendation.item}-${index}`}
              label={`추천 ${index + 1}`}
              value={
                recommendation.reason
                  ? `${recommendation.item} — ${recommendation.reason}`
                  : recommendation.item
              }
            />
          ))}
          {analysis.avoidStyles.length > 0 ? (
            <ReportAttrRow label="피할 스타일" value={analysis.avoidStyles.join(' · ')} />
          ) : null}
        </ReportRowTable>
      ),
    });
  }

  sections.push({
    key: 'styling',
    title: '스타일 적용 예시',
    summary: '원칙·중립 색상 코디·내 옷장 연결',
    content: (
      <BodyReportEvidence bodyType={analysis.bodyType} bodyTypeLabel={analysis.bodyTypeLabel} />
    ),
  });

  return (
    <>
      {/* 축하 연출은 창업자 결정 대기 범위라 이번 진단지 수리에서 유지한다. */}
      <CelebrationEffect
        onComplete={() => {
          setShowCelebration(false);
          setShowBadge(true);
        }}
        type="analysis_complete"
        visible={showCelebration}
      />
      <BadgeDrop
        badge={{ icon: '💪', name: '체형 분석가', description: '체형 분석 완료!' }}
        onDismiss={() => setShowBadge(false)}
        visible={showBadge}
      />
      <ReportResultLayout
        attributes={
          <ReportRowTable testID="body-report-attrs">
            <ReportAttrRow label="키" value={`${height}cm`} />
            <ReportAttrRow label="체중" value={`${weight}kg`} />
            <ReportAttrRow
              accessibilityLabel={`BMI ${bmi.toFixed(1)}, 참고 수치`}
              label="BMI"
              value={
                <ReportInkNumber
                  accessibilityLabel={`BMI ${bmi.toFixed(1)}, 참고 수치`}
                  status="참고 수치"
                  testID="body-bmi-reading"
                  value={bmi.toFixed(1)}
                />
              }
            />
            <ReportAttrRow label="BMI 안내" value={BMI_CAVEAT} />
          </ReportRowTable>
        }
        conclusion={<ReportActionList actions={topActions} testID="body-report-actions" />}
        eyebrow="체형 분석 결과"
        imageStyle={styles.bodyImage}
        imageUri={imageUri}
        moduleKey="body"
        onPrimaryAction={handleNextAxis}
        onSaveRetry={() => router.replace('/(analysis)/body')}
        primaryActionText="퍼스널 컬러로 내 색 찾기"
        retryPath="/(analysis)/body"
        saveFailed={analysis.dbSaveFailed}
        sections={sections}
        shareContent={
          <AxisResultShareSection
            analysisType="body"
            badges={analysis.strengths[0] ? [{ label: '강점', value: analysis.strengths[0] }] : []}
            heading="내 체형 카드"
            oneLine={bodyDescription}
            usedFallback={analysis.usedMock}
            verdict={analysis.bodyTypeLabel}
          />
        }
        testID="body-analysis-result"
        usedFallback={analysis.usedMock}
        verdict={analysis.bodyTypeLabel}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bodyImage: {
    borderRadius: radii.lg,
    height: 168,
    width: 126,
  },
  evidenceText: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.sm,
    lineHeight: 21,
  },
  supportingText: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});
