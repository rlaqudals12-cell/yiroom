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
import { buildMakeupTopActions } from '@/lib/analysis';
import {
  MakeupApiError,
  requestMakeupAnalysis,
  type MakeupAnalysisApiResult,
} from '@/lib/api/makeup';
import { imageToBase64 } from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';
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
  const { imageUri, imageBase64 } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<MakeupAnalysisApiResult | null>(null);
  const [errorMessage, setErrorMessage] = useState(DEFAULT_ERROR_MESSAGE);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const analyzeMakeup = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setResult(null);

    try {
      let base64Data = imageBase64;
      if (!base64Data && imageUri) base64Data = await imageToBase64(imageUri);
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
      setErrorMessage(error instanceof MakeupApiError ? error.message : DEFAULT_ERROR_MESSAGE);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, imageBase64, imageUri]);

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
  const recommendationKeys = Object.keys(
    result.recommendations
  ) as (keyof MakeupAnalysisApiResult['recommendations'])[];
  const sections: ReportSection[] = [
    {
      key: 'recommendations',
      title: '부위별 맞춤 추천',
      summary: result.recommendations.base,
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
    },
    {
      key: 'application',
      title: '적용 팁',
      summary: result.recommendations.contour,
      content: (
        <ReportTextList
          items={[
            `${FACE_SHAPE_LABELS[result.faceShape]}은 ${result.recommendations.contour}`,
            `${EYE_SHAPE_LABELS[result.eyeShape]}에는 ${result.recommendations.eye}`,
            `${LIP_SHAPE_LABELS[result.lipShape]}에는 ${result.recommendations.lip}`,
          ]}
          testID="makeup-application-tips"
        />
      ),
    },
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
            <ReportAttrRow label="눈매" value={EYE_SHAPE_LABELS[result.eyeShape]} />
            <ReportAttrRow label="입술" value={LIP_SHAPE_LABELS[result.lipShape]} />
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
            badges={[
              { label: '눈매', value: EYE_SHAPE_LABELS[result.eyeShape] },
              { label: '입술', value: LIP_SHAPE_LABELS[result.lipShape] },
            ]}
            heading="내 메이크업 카드"
            oneLine={result.recommendations.base}
            palette={result.bestColors}
            usedFallback={result.usedMock}
            verdict={`${FACE_SHAPE_LABELS[result.faceShape]} · ${UNDERTONE_LABELS[result.undertone]}`}
          />
        }
        testID="makeup-analysis-result"
        usedFallback={result.usedMock}
        verdict={`${FACE_SHAPE_LABELS[result.faceShape]} · ${UNDERTONE_LABELS[result.undertone]}`}
      />
    </>
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
