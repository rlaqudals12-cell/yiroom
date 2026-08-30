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
import {
  buildBodyTopActions,
  finiteNumber,
  loadStoredAnalysisRecord,
  storedRecord,
  stringArray,
} from '@/lib/analysis';
import { StoredResultError } from '@/lib/analysis/stored-result-loader';
import { BodyApiError, requestBodyAnalysis, type BodyAnalysisApiResult } from '@/lib/api/body';
import { downscaleToBase64 } from '@/lib/image/downscale';
import { captureError } from '@/lib/monitoring/sentry';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { radii, spacing, typography } from '@/lib/theme';

const BMI_CAVEAT = 'BMI는 근육량에 따라 실제와 다를 수 있어요';
const DEFAULT_ERROR_MESSAGE = '분석에 실패했어요. 다시 시도해 주세요.';

export default function BodyResultScreen(): React.JSX.Element {
  const { getToken } = useAuth();
  const supabase = useClerkSupabaseClient();
  const { height, weight, imageUri, historyId } = useLocalSearchParams<{
    height?: string;
    weight?: string;
    imageUri?: string;
    historyId?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<BodyAnalysisApiResult | null>(null);
  const [storedMeasurements, setStoredMeasurements] = useState<{
    height?: number;
    weight?: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>(DEFAULT_ERROR_MESSAGE);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const analyzeBody = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setAnalysis(null);
    setStoredMeasurements(null);

    try {
      const hasFreshImage = Boolean(imageUri);
      if (!hasFreshImage) {
        const stored = await loadStoredAnalysisRecord(supabase, 'body', historyId);
        const row = stored.row;
        const bodyType = normalizeStoredBodyType(row.body_type);
        if (!bodyType) {
          throw new StoredResultError('저장된 체형 분석 결과를 해석하지 못했어요.');
        }
        const styleData = storedRecord(row.style_recommendations);
        const heightValue = finiteNumber(row.height);
        const weightValue = finiteNumber(row.weight);
        const bmi =
          heightValue && heightValue > 0 && weightValue
            ? weightValue / (heightValue / 100) ** 2
            : undefined;

        setStoredMeasurements({ height: heightValue, weight: weightValue });
        setAnalysis({
          bodyType,
          bodyTypeLabel: STORED_BODY_LABELS[bodyType],
          bodyTypeDescription: '',
          strengths: stringArray(row.strengths),
          avoidStyles: stringArray(styleData.avoid),
          styleRecommendations: parseStoredBodyRecommendations(styleData),
          insight: typeof styleData.insight === 'string' ? styleData.insight : undefined,
          bmi,
          usedMock: stored.usedFallback === true,
          dbSaveFailed: false,
          analysisId: typeof row.id === 'string' ? row.id : undefined,
          analyzedAt: typeof row.created_at === 'string' ? row.created_at : undefined,
        });
        return;
      }

      const base64Data = imageUri ? await downscaleToBase64(imageUri, 1024) : '';
      if (!base64Data) throw new Error('이미지 데이터가 없습니다.');

      const token = await getToken();
      if (!token) {
        throw new BodyApiError('로그인이 필요해요. 다시 로그인해주세요.', 401, 'AUTH_ERROR');
      }

      const result = await requestBodyAnalysis(
        {
          imageBase64: base64Data,
          height: parseFloat(height ?? ''),
          weight: parseFloat(weight ?? ''),
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
      setErrorMessage(
        error instanceof BodyApiError || error instanceof StoredResultError
          ? error.message
          : DEFAULT_ERROR_MESSAGE
      );
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, height, historyId, imageUri, supabase, weight]);

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

  const heightNumber = storedMeasurements?.height ?? parseFloat(height ?? '');
  const weightNumber = storedMeasurements?.weight ?? parseFloat(weight ?? '');
  const derivedBmi =
    Number.isFinite(heightNumber) && heightNumber > 0 && Number.isFinite(weightNumber)
      ? weightNumber / (heightNumber / 100) ** 2
      : null;
  const bmi = analysis?.bmi ?? derivedBmi;

  if (!analysis) {
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
            {Number.isFinite(heightNumber) ? (
              <ReportAttrRow label="키" value={`${heightNumber}cm`} />
            ) : null}
            {Number.isFinite(weightNumber) ? (
              <ReportAttrRow label="체중" value={`${weightNumber}kg`} />
            ) : null}
            {bmi !== null ? (
              <>
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
              </>
            ) : (
              <ReportAttrRow label="측정값" value="저장된 키·체중 값이 없어요" />
            )}
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
        reportTargetId={
          historyId ??
          (!analysis.dbSaveFailed ? analysis.analysisId : undefined) ??
          `unsaved:body:${analysis.analyzedAt ?? 'time-unavailable'}`
        }
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

const STORED_BODY_LABELS: Record<BodyAnalysisApiResult['bodyType'], string> = {
  S: '스트레이트',
  W: '웨이브',
  N: '내추럴',
};

function normalizeStoredBodyType(value: unknown): BodyAnalysisApiResult['bodyType'] | null {
  return value === 'S' || value === 'W' || value === 'N' ? value : null;
}

function parseStoredBodyRecommendations(
  value: Record<string, unknown>
): BodyAnalysisApiResult['styleRecommendations'] {
  if (Array.isArray(value.items)) {
    return value.items.flatMap((item) => {
      const record = storedRecord(item);
      return typeof record.item === 'string'
        ? [
            {
              item: record.item,
              reason: typeof record.reason === 'string' ? record.reason : '',
            },
          ]
        : [];
    });
  }

  return [...stringArray(value.tops), ...stringArray(value.bottoms)].map((item) => ({
    item,
    reason: '',
  }));
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
