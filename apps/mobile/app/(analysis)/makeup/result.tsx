/** M-1 메이크업 분석 결과 — ADR-120 진단지 문법. */
import { useAuth } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AnalysisErrorState,
  AnalysisLoadingState,
  ReportActionList,
  ReportAttrRow,
  ReportColorBand,
  ReportDivider,
  ReportResultLayout,
  ReportRowTable,
  ReportTextList,
  type ReportSection,
} from '@/components/analysis';
import { AxisResultShareSection } from '@/components/share';
import { BadgeDrop, CelebrationEffect } from '@/components/ui';
import {
  buildMakeupTopActions,
  finiteNumber,
  loadStoredAnalysisRecord,
  storedRecord,
  stringArray,
} from '@/lib/analysis';
import { StoredResultError } from '@/lib/analysis/stored-result-loader';
import {
  MakeupApiError,
  requestMakeupAnalysis,
  type MakeupAnalysisApiResult,
} from '@/lib/api/makeup';
import { downscaleToBase64 } from '@/lib/image/downscale';
import { captureError } from '@/lib/monitoring/sentry';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { radii, spacing } from '@/lib/theme';

const FACE_SHAPE_LABELS: Record<MakeupAnalysisApiResult['faceShape'], string> = {
  oval: '계란형',
  round: '둥근형',
  square: '사각형',
  heart: '하트형',
  oblong: '긴 얼굴형',
  diamond: '다이아몬드형',
};

const UNDERTONE_LABELS: Record<MakeupAnalysisApiResult['undertone'], string> = {
  warm: '웜톤',
  cool: '쿨톤',
  neutral: '뉴트럴',
};

const EYE_SHAPE_LABELS: Record<MakeupAnalysisApiResult['eyeShape'], string> = {
  monolid: '무쌍',
  double: '유쌍',
  hooded: '속쌍',
  round: '동그란 눈',
  almond: '아몬드형',
};

const LIP_SHAPE_LABELS: Record<MakeupAnalysisApiResult['lipShape'], string> = {
  full: '도톰한 입술',
  thin: '얇은 입술',
  wide: '넓은 입술',
  bow: '큐피드 보우',
};

const RECOMMENDATION_LABELS: Record<keyof MakeupAnalysisApiResult['recommendations'], string> = {
  base: '베이스',
  eye: '아이 메이크업',
  lip: '립 메이크업',
  blush: '블러셔',
  contour: '컨투어링',
};

const DEFAULT_ERROR_MESSAGE = '분석에 실패했어요. 다시 시도해 주세요.';

export default function MakeupResultScreen(): React.JSX.Element {
  const { getToken } = useAuth();
  const supabase = useClerkSupabaseClient();
  const { imageUri, historyId } = useLocalSearchParams<{
    imageUri?: string;
    historyId?: string;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<MakeupAnalysisApiResult | null>(null);
  const [measured, setMeasured] = useState({ faceShape: true, eyeShape: true, lipShape: true });
  const [errorMessage, setErrorMessage] = useState(DEFAULT_ERROR_MESSAGE);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const analyzeMakeup = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setResult(null);
    setMeasured({ faceShape: true, eyeShape: true, lipShape: true });

    try {
      const hasFreshImage = Boolean(imageUri);
      if (!hasFreshImage) {
        const stored = await loadStoredAnalysisRecord(supabase, 'makeup', historyId);
        const row = stored.row;
        const faceShape = normalizeStoredFaceShape(row.face_shape);
        const undertone = normalizeStoredUndertone(row.undertone);
        const eyeShape = normalizeStoredEyeShape(row.eye_shape);
        const lipShape = normalizeStoredLipShape(row.lip_shape);
        if (!faceShape || !undertone || !eyeShape || !lipShape) {
          throw new StoredResultError('저장된 메이크업 분석 결과를 해석하지 못했어요.');
        }

        const recommendationData = storedRecord(row.recommendations);
        const measuredData = storedRecord(recommendationData.measured);
        const isIntegrated = recommendationData.source === 'integrated';
        const measuredState = isIntegrated
          ? {
              faceShape: measuredData.faceShape === true,
              eyeShape: measuredData.eyeShape === true,
              lipShape: measuredData.lipShape === true,
            }
          : { faceShape: true, eyeShape: true, lipShape: true };
        const recommendations = parseStoredMakeupRecommendations(recommendationData);
        const overall = finiteNumber(row.overall_score) ?? 0;
        const skinTone = finiteNumber(row.skin_tone_uniformity) ?? overall;

        setMeasured(measuredState);
        setResult({
          faceShape,
          undertone,
          eyeShape,
          lipShape,
          scores: {
            skinTone,
            eyeBalance: overall,
            lipBalance: overall,
            overall,
          },
          recommendations,
          bestColors: collectStoredMakeupColors(recommendationData),
          usedMock: stored.usedFallback === true,
          dbSaveFailed: false,
        });
        return;
      }

      const base64Data = imageUri ? await downscaleToBase64(imageUri, 1024) : '';
      if (!base64Data) throw new Error('이미지 데이터가 없습니다.');

      const token = await getToken();
      if (!token) {
        throw new MakeupApiError('로그인이 필요해요. 다시 로그인해주세요.', 401, 'AUTH_ERROR');
      }

      const response = await requestMakeupAnalysis({ imageBase64: base64Data }, token);
      setResult(response);
      setShowCelebration(true);
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'makeup-result',
        tags: { module: 'M-1', action: 'analyze' },
      });
      setErrorMessage(
        error instanceof MakeupApiError || error instanceof StoredResultError
          ? error.message
          : DEFAULT_ERROR_MESSAGE
      );
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, historyId, imageUri, supabase]);

  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void analyzeMakeup();
  }, [analyzeMakeup]);

  const handleProductRecommendation = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/products', params: { category: 'makeup' } });
  }, []);

  if (isLoading) {
    return (
      <AnalysisLoadingState message="메이크업 스타일을 분석 중이에요..." testID="makeup-loading" />
    );
  }

  if (!result) {
    return (
      <AnalysisErrorState
        message={errorMessage}
        onGoHome={() => router.replace('/(tabs)')}
        onRetry={() => router.replace('/(analysis)/makeup')}
        testID="makeup-error"
      />
    );
  }

  const topActions = buildMakeupTopActions({
    bestColors: result.bestColors,
    eye: result.recommendations.eye,
    lip: result.recommendations.lip,
  });
  const recommendationKeys = (
    Object.keys(result.recommendations) as (keyof MakeupAnalysisApiResult['recommendations'])[]
  ).filter((key) => result.recommendations[key].trim().length > 0);
  const applicationItems = [
    ...(measured.faceShape && result.recommendations.contour
      ? [`${FACE_SHAPE_LABELS[result.faceShape]}은 ${result.recommendations.contour}`]
      : []),
    ...(measured.eyeShape && result.recommendations.eye
      ? [`${EYE_SHAPE_LABELS[result.eyeShape]}에는 ${result.recommendations.eye}`]
      : []),
    ...(measured.lipShape && result.recommendations.lip
      ? [`${LIP_SHAPE_LABELS[result.lipShape]}에는 ${result.recommendations.lip}`]
      : []),
  ];
  const sections: ReportSection[] = [];
  if (recommendationKeys.length > 0) {
    sections.push({
      key: 'recommendations',
      title: '부위별 맞춤 추천',
      summary: result.recommendations[recommendationKeys[0]],
      content: (
        <ReportRowTable testID="makeup-recommendation-rows">
          {recommendationKeys.map((key) => (
            <ReportAttrRow
              key={key}
              label={RECOMMENDATION_LABELS[key]}
              value={result.recommendations[key]}
            />
          ))}
        </ReportRowTable>
      ),
    });
  }
  if (applicationItems.length > 0) {
    sections.push({
      key: 'application',
      title: '적용 팁',
      summary: applicationItems[0],
      content: <ReportTextList items={applicationItems} testID="makeup-application-tips" />,
    });
  }
  const verdict = [
    ...(measured.faceShape ? [FACE_SHAPE_LABELS[result.faceShape]] : []),
    UNDERTONE_LABELS[result.undertone],
  ].join(' · ');
  const shareBadges = [
    ...(measured.eyeShape ? [{ label: '눈매', value: EYE_SHAPE_LABELS[result.eyeShape] }] : []),
    ...(measured.lipShape ? [{ label: '입술', value: LIP_SHAPE_LABELS[result.lipShape] }] : []),
  ];

  return (
    <>
      {/* 축하 연출 존폐는 창업자 결정 대기 범위이므로 이번 진단지 수리에서 유지한다. */}
      <CelebrationEffect
        onComplete={() => {
          setShowCelebration(false);
          setShowBadge(true);
        }}
        type="analysis_complete"
        visible={showCelebration}
      />
      <BadgeDrop
        badge={{ icon: '💄', name: '메이크업 전문가', description: '메이크업 분석 완료!' }}
        onDismiss={() => setShowBadge(false)}
        visible={showBadge}
      />
      <ReportResultLayout
        attributes={
          <ReportRowTable testID="makeup-report-attrs">
            {measured.eyeShape ? (
              <ReportAttrRow label="눈매" value={EYE_SHAPE_LABELS[result.eyeShape]} />
            ) : null}
            {measured.lipShape ? (
              <ReportAttrRow label="입술" value={LIP_SHAPE_LABELS[result.lipShape]} />
            ) : null}
          </ReportRowTable>
        }
        conclusion={
          <View style={styles.conclusion}>
            <ReportActionList actions={topActions} testID="makeup-report-actions" />
            {result.bestColors.length > 0 ? (
              <>
                <ReportDivider testID="makeup-color-divider" />
                <ReportColorBand
                  colors={result.bestColors}
                  testID="makeup-best-colors"
                  title="추천 색"
                />
              </>
            ) : null}
          </View>
        }
        eyebrow="메이크업 분석 결과"
        imageStyle={styles.makeupImage}
        imageUri={imageUri}
        moduleKey="makeup"
        onPrimaryAction={handleProductRecommendation}
        onSaveRetry={() => router.replace('/(analysis)/makeup')}
        primaryActionText="메이크업 제품 보기"
        retryPath="/(analysis)/makeup"
        saveFailed={result.dbSaveFailed}
        sections={sections}
        shareContent={
          <AxisResultShareSection
            analysisType="makeup"
            badges={shareBadges}
            heading="내 메이크업 카드"
            oneLine={result.recommendations.base}
            palette={result.bestColors}
            usedFallback={result.usedMock}
            verdict={verdict}
          />
        }
        testID="makeup-analysis-result"
        usedFallback={result.usedMock}
        verdict={verdict}
      />
    </>
  );
}

function enumValue<T extends string>(value: unknown, values: readonly T[]): T | null {
  return values.includes(value as T) ? (value as T) : null;
}

function normalizeStoredFaceShape(value: unknown): MakeupAnalysisApiResult['faceShape'] | null {
  return enumValue(value, ['oval', 'round', 'square', 'heart', 'oblong', 'diamond'] as const);
}

function normalizeStoredUndertone(value: unknown): MakeupAnalysisApiResult['undertone'] | null {
  return enumValue(value, ['warm', 'cool', 'neutral'] as const);
}

function normalizeStoredEyeShape(value: unknown): MakeupAnalysisApiResult['eyeShape'] | null {
  if (value === 'downturned') return 'almond';
  return enumValue(value, ['monolid', 'double', 'hooded', 'round', 'almond'] as const);
}

function normalizeStoredLipShape(value: unknown): MakeupAnalysisApiResult['lipShape'] | null {
  const legacyMap: Record<string, MakeupAnalysisApiResult['lipShape']> = {
    small: 'thin',
    heart: 'bow',
    asymmetric: 'wide',
  };
  if (typeof value === 'string' && legacyMap[value]) return legacyMap[value];
  return enumValue(value, ['full', 'thin', 'wide', 'bow'] as const);
}

function firstStoredMakeupTip(value: unknown, category: string): string {
  if (!Array.isArray(value)) return '';
  for (const item of value) {
    const group = storedRecord(item);
    if (group.category !== category) continue;
    return stringArray(group.tips)[0] ?? '';
  }
  return '';
}

function parseStoredMakeupRecommendations(
  value: Record<string, unknown>
): MakeupAnalysisApiResult['recommendations'] {
  const tutorialSteps = stringArray(value.tutorialSteps);
  return {
    base:
      (typeof value.baseRecommendation === 'string' ? value.baseRecommendation : '') ||
      firstStoredMakeupTip(value.tips, '베이스'),
    eye:
      firstStoredMakeupTip(value.tips, '아이 메이크업') ||
      tutorialSteps.find((step) => step.includes('아이섀도')) ||
      '',
    lip:
      firstStoredMakeupTip(value.tips, '립 메이크업') ||
      tutorialSteps.find((step) => step.includes('립 컬러')) ||
      '',
    blush: firstStoredMakeupTip(value.tips, '블러셔'),
    contour: firstStoredMakeupTip(value.tips, '컨투어링'),
  };
}

function collectStoredMakeupColors(value: Record<string, unknown>): string[] {
  const integratedColors = [
    ...stringArray(value.lipPalette),
    ...stringArray(value.eyeshadowPalette),
  ];
  const standaloneColors: string[] = [];
  if (Array.isArray(value.colors)) {
    for (const groupValue of value.colors) {
      const group = storedRecord(groupValue);
      if (!Array.isArray(group.colors)) continue;
      for (const colorValue of group.colors) {
        const color = storedRecord(colorValue);
        if (typeof color.hex === 'string') standaloneColors.push(color.hex);
      }
    }
  }
  return Array.from(new Set([...integratedColors, ...standaloneColors])).filter((color) =>
    /^#[0-9A-Fa-f]{6}$/.test(color)
  );
}

const styles = StyleSheet.create({
  conclusion: {
    gap: spacing.md,
  },
  makeupImage: {
    borderRadius: radii.lg,
    height: 168,
    width: 132,
  },
});
