/** H-1 헤어 분석 결과 — ADR-120 진단지 문법. */
import { useAuth } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AnalysisErrorState,
  AnalysisLoadingState,
  REPORT_COLORS,
  ReportActionList,
  ReportAttrRow,
  ReportResultLayout,
  ReportRowTable,
  ReportTextList,
  type ReportSection,
} from '@/components/analysis';
import { AxisResultShareSection } from '@/components/share';
import { BadgeDrop, CelebrationEffect } from '@/components/ui';
import {
  buildHairTopActions,
  getHairCautionIngredients,
  getScalpConcernNotice,
} from '@/lib/analysis';
import { HairApiError, requestHairAnalysis, type HairAnalysisApiResult } from '@/lib/api/hair';
import { imageToBase64 } from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';
import { radii, spacing, typography } from '@/lib/theme';

const TEXTURE_LABELS: Record<HairAnalysisApiResult['texture'], string> = {
  straight: '직모',
  wavy: '웨이브',
  curly: '컬리',
  coily: '코일리',
};

const THICKNESS_LABELS: Record<HairAnalysisApiResult['thickness'], string> = {
  fine: '가는 모발',
  medium: '보통 모발',
  thick: '굵은 모발',
};

const SCALP_LABELS: Record<HairAnalysisApiResult['scalpCondition'], string> = {
  dry: '건성 두피',
  oily: '지성 두피',
  normal: '정상 두피',
  sensitive: '민감성 두피',
};

const DEFAULT_ERROR_MESSAGE = '분석에 실패했어요. 다시 시도해 주세요.';

export default function HairResultScreen(): React.JSX.Element {
  const { getToken } = useAuth();
  const { imageUri, imageBase64 } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<HairAnalysisApiResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>(DEFAULT_ERROR_MESSAGE);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const analyzeHair = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setUsedFallback(false);
    try {
      let base64Data = imageBase64;
      if (!base64Data && imageUri) {
        base64Data = await imageToBase64(imageUri);
      }
      if (!base64Data) throw new Error('이미지 데이터가 없습니다.');

      const token = await getToken();
      if (!token) {
        throw new HairApiError('로그인이 필요해요. 다시 로그인해주세요.', 401, 'AUTH_ERROR');
      }

      const response = await requestHairAnalysis({ imageBase64: base64Data }, token);
      setUsedFallback(response.usedMock);
      setResult(response);
      setShowCelebration(true);
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'hair-result',
        tags: { module: 'H-1', action: 'analyze' },
      });
      setErrorMessage(error instanceof HairApiError ? error.message : DEFAULT_ERROR_MESSAGE);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, imageBase64, imageUri]);

  // clerk-expo getToken 참조가 바뀌어도 화면 진입당 분석은 한 번만 실행한다.
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void analyzeHair();
  }, [analyzeHair]);

  const handleProductRecommendation = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/products', params: { category: 'haircare' } });
  }, []);

  if (isLoading) {
    return <AnalysisLoadingState message="헤어 상태를 분석 중이에요..." testID="hair-loading" />;
  }

  if (!result) {
    return (
      <AnalysisErrorState
        message={errorMessage}
        onGoHome={() => router.replace('/(tabs)')}
        onRetry={() => router.replace('/(analysis)/hair')}
        testID="hair-error"
      />
    );
  }

  const topActions = buildHairTopActions({
    careRoutine: result.careRoutine,
    recommendedStyles: result.recommendedStyles,
  });
  const cautionIngredients = getHairCautionIngredients(result.scalpCondition);
  const scalpConcernNotice = getScalpConcernNotice(result.mainConcerns);

  const sections: ReportSection[] = [];
  if (result.mainConcerns.length > 0) {
    sections.push({
      key: 'concerns',
      title: '주요 고민',
      summary: result.mainConcerns[0],
      content: <ReportTextList items={result.mainConcerns} testID="hair-concerns" />,
    });
  }

  sections.push({
    key: 'condition',
    title: '항목별 컨디션',
    summary: '윤기·탄력·밀도·두피 건강',
    content: (
      <ReportRowTable testID="hair-condition-rows">
        <ReportAttrRow label="윤기" value={String(result.scores.shine)} />
        <ReportAttrRow label="탄력" value={String(result.scores.elasticity)} />
        <ReportAttrRow label="밀도" value={String(result.scores.density)} />
        <ReportAttrRow label="두피 건강" value={String(result.scores.scalpHealth)} />
      </ReportRowTable>
    ),
  });

  if (result.careRoutine.length > 0 || result.recommendedStyles.length > 0) {
    sections.push({
      key: 'care',
      title: '케어와 스타일',
      summary: result.careRoutine[0] ?? result.recommendedStyles[0],
      content: (
        <View style={styles.sectionGroups} testID="hair-care-and-style">
          {result.careRoutine.length > 0 ? (
            <ReportTextList
              heading="추천 케어 루틴"
              items={result.careRoutine}
              testID="hair-care"
            />
          ) : null}
          {result.recommendedStyles.length > 0 ? (
            <ReportTextList
              heading="추천 헤어스타일"
              items={result.recommendedStyles}
              testID="hair-styles"
            />
          ) : null}
        </View>
      ),
    });
  }

  if (cautionIngredients.length > 0 || scalpConcernNotice) {
    sections.push({
      key: 'cautions',
      title: '주의할 점',
      summary: cautionIngredients[0] ?? scalpConcernNotice ?? undefined,
      content: (
        <View style={styles.sectionGroups} testID="hair-cautions">
          {cautionIngredients.length > 0 ? (
            <ReportTextList
              heading="피하면 좋은 성분"
              items={cautionIngredients}
              testID="hair-caution-ingredients"
            />
          ) : null}
          {scalpConcernNotice ? <Text style={styles.noticeText}>{scalpConcernNotice}</Text> : null}
        </View>
      ),
    });
  }

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
        badge={{ icon: '💇', name: '헤어 전문가', description: '헤어 분석 완료!' }}
        onDismiss={() => setShowBadge(false)}
        visible={showBadge}
      />
      <ReportResultLayout
        attributes={
          <ReportRowTable testID="hair-report-attrs">
            <ReportAttrRow label="두피" value={SCALP_LABELS[result.scalpCondition]} />
            <ReportAttrRow
              label="손상도"
              value={`${result.damageLevel}% · 높을수록 손상이 큰 값`}
            />
          </ReportRowTable>
        }
        conclusion={<ReportActionList actions={topActions} testID="hair-report-actions" />}
        eyebrow="헤어 분석 결과"
        imageStyle={styles.hairImage}
        imageUri={imageUri}
        moduleKey="hair"
        onPrimaryAction={handleProductRecommendation}
        onSaveRetry={() => router.replace('/(analysis)/hair')}
        primaryActionText="헤어 제품 추천"
        retryPath="/(analysis)/hair"
        saveFailed={result.dbSaveFailed}
        sections={sections}
        shareContent={
          <AxisResultShareSection
            analysisType="hair"
            badges={[{ label: '두피', value: SCALP_LABELS[result.scalpCondition] }]}
            heading="내 헤어 카드"
            oneLine={
              result.mainConcerns[0] ?? result.careRoutine[0] ?? SCALP_LABELS[result.scalpCondition]
            }
            usedFallback={usedFallback}
            verdict={`${TEXTURE_LABELS[result.texture]} · ${THICKNESS_LABELS[result.thickness]}`}
          />
        }
        testID="hair-analysis-result"
        usedFallback={usedFallback}
        verdict={`${TEXTURE_LABELS[result.texture]} · ${THICKNESS_LABELS[result.thickness]}`}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hairImage: {
    borderRadius: radii.lg,
    height: 168,
    width: 126,
  },
  sectionGroups: {
    gap: spacing.mlg,
  },
  noticeText: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.sm,
    lineHeight: 21,
  },
});
