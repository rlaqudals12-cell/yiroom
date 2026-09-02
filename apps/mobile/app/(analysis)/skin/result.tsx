/** S-1 피부 분석 결과 — ADR-120 진단지 문법. */
import { useAuth } from '@clerk/clerk-expo';
import type { SkinType } from '@yiroom/shared';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

import {
  AnalysisErrorState,
  AnalysisLoadingState,
  ReportActionList,
  ReportAttrRow,
  ReportResultLayout,
  ReportRowTable,
  ReportTextList,
  type ReportSection,
} from '@/components/analysis';
import { BiometricResultRouteGate } from '@/components/analysis/BiometricRouteGate';
import {
  SkinResultShare,
  skinResultStyles as styles,
} from '@/components/analysis/skin/SkinResultSupport';
import { BadgeDrop, CelebrationEffect } from '@/components/ui';
import {
  buildSkinTopActions,
  finiteNumber,
  formatReportReading,
  loadStoredAnalysisRecord,
} from '@/lib/analysis';
import { StoredResultError } from '@/lib/analysis/stored-result-loader';
import {
  parseSkinHomeCareBoundary,
  requestSkinAnalysis,
  SkinApiError,
  type SkinHomeCareBoundary,
} from '@/lib/api/skin';
import { downscaleToBase64 } from '@/lib/image/downscale';
import { captureError } from '@/lib/monitoring/sentry';
import { SKIN_TYPE_DATA, type SkinMetrics, type SkinMetricsDelta } from '@/lib/skincare';
import { useClerkSupabaseClient } from '@/lib/supabase';

const INGREDIENT_DATA: Record<SkinType, { good: string[]; avoid: string[] }> = {
  dry: {
    good: ['히알루론산', '세라마이드', '스쿠알란', '시어버터', '글리세린'],
    avoid: ['알코올', '레티놀(고농도)', '살리실산'],
  },
  oily: {
    good: ['나이아신아마이드', '살리실산', '녹차추출물', '아연', '시카'],
    avoid: ['미네랄오일', '코코넛오일', '바셀린'],
  },
  combination: {
    good: ['히알루론산', '나이아신아마이드', '판테놀', '알로에', '센텔라'],
    avoid: ['고농도 오일', '강한 계면활성제', '인공향료'],
  },
  sensitive: {
    good: ['센텔라', '판테놀', '알란토인', '마데카소사이드', '오트밀'],
    avoid: ['알코올', '인공향료', '에센셜오일', 'AHA/BHA(고농도)'],
  },
  normal: {
    good: ['비타민C', '레티놀', '히알루론산', '펩타이드', '나이아신아마이드'],
    avoid: ['과도한 필링', '강한 계면활성제'],
  },
};

const DEFAULT_ERROR_MESSAGE = '분석에 실패했어요. 다시 시도해 주세요.';

export default function SkinResultScreen(): React.JSX.Element {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();

  return (
    <BiometricResultRouteGate imageUri={imageUri}>
      <SkinResultContent />
    </BiometricResultRouteGate>
  );
}

function SkinResultContent(): React.JSX.Element {
  const { getToken, userId } = useAuth();
  const supabase = useClerkSupabaseClient();
  const { imageUri, historyId } = useLocalSearchParams<{
    imageUri?: string;
    historyId?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [skinType, setSkinType] = useState<SkinType | null>(null);
  const [metrics, setMetrics] = useState<SkinMetrics | null>(null);
  const [availableMetrics, setAvailableMetrics] = useState<(keyof SkinMetrics)[] | null>(null);
  const [delta, setDelta] = useState<SkinMetricsDelta | null>(null);
  const [hasPreviousAnalysis, setHasPreviousAnalysis] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const [dbSaveFailed, setDbSaveFailed] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [homeCareBoundary, setHomeCareBoundary] = useState<SkinHomeCareBoundary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>(DEFAULT_ERROR_MESSAGE);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const analyzeSkin = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setUsedFallback(false);
    setDbSaveFailed(false);
    setReportTargetId(null);
    setDelta(null);
    setHasPreviousAnalysis(false);
    setAvailableMetrics(null);
    setHomeCareBoundary(null);

    try {
      const hasFreshImage = Boolean(imageUri);
      if (!hasFreshImage) {
        const stored = await loadStoredAnalysisRecord(supabase, 'skin', historyId);
        const row = stored.row;
        const storedSkinType = normalizeStoredSkinType(row.skin_type);
        if (!storedSkinType) {
          throw new StoredResultError('저장된 피부 분석 결과를 해석하지 못했어요.');
        }

        const storedMetricColumns: {
          key: keyof SkinMetrics;
          column: string;
        }[] = [
          { key: 'moisture', column: 'hydration' },
          { key: 'oil', column: 'oil_level' },
          { key: 'pores', column: 'pores' },
          { key: 'wrinkles', column: 'wrinkles' },
          { key: 'pigmentation', column: 'pigmentation' },
          { key: 'sensitivity', column: 'sensitivity' },
        ];
        const available = storedMetricColumns
          .filter(({ column }) => finiteNumber(row[column]) !== undefined)
          .map(({ key }) => key);
        const value = (column: string): number => finiteNumber(row[column]) ?? 0;

        setSkinType(storedSkinType);
        setMetrics({
          moisture: value('hydration'),
          oil: value('oil_level'),
          pores: value('pores'),
          wrinkles: value('wrinkles'),
          pigmentation: value('pigmentation'),
          sensitivity: value('sensitivity'),
          // DB에 없는 탄력값을 만들지 않고, 저장 결과 화면에서 이 행을 숨긴다.
          elasticity: 0,
        });
        setAvailableMetrics(available);
        setUsedFallback(stored.usedFallback === true);
        const storedRecommendations =
          typeof row.recommendations === 'object' && row.recommendations !== null
            ? (row.recommendations as Record<string, unknown>)
            : null;
        setHomeCareBoundary(
          stored.usedFallback === true
            ? null
            : (parseSkinHomeCareBoundary(storedRecommendations?.homeCareBoundary) ?? null)
        );
        setReportTargetId(
          historyId ?? (typeof row.id === 'string' ? row.id : 'unsaved:skin:time-unavailable')
        );
        return;
      }

      const base64Data = imageUri ? await downscaleToBase64(imageUri, 1024) : '';
      if (!base64Data) throw new Error('이미지 데이터가 없습니다.');

      const token = await getToken();
      if (!token) {
        throw new SkinApiError('로그인이 필요해요. 다시 로그인해주세요.', 401, 'AUTH_ERROR');
      }

      const analysisResult = await requestSkinAnalysis({ imageBase64: base64Data }, token);
      setUsedFallback(analysisResult.usedMock);
      setDbSaveFailed(analysisResult.dbSaveFailed);
      setReportTargetId(
        analysisResult.dbSaveFailed
          ? `unsaved:skin:${analysisResult.analyzedAt ?? 'time-unavailable'}`
          : (analysisResult.analysisId ?? 'unsaved:skin:time-unavailable')
      );
      setSkinType(analysisResult.skinType);
      setMetrics(analysisResult.metrics);
      setHomeCareBoundary(
        analysisResult.usedMock ? null : (analysisResult.homeCareBoundary ?? null)
      );

      if (userId) {
        try {
          const { data: rows } = await supabase
            .from('skin_analyses')
            .select('id, hydration, oil_level, pores, wrinkles, pigmentation, sensitivity')
            .order('created_at', { ascending: false })
            .limit(2);
          const previous = (rows ?? []).find((row) => row.id !== analysisResult.analysisId) ?? null;

          if (previous) {
            setHasPreviousAnalysis(true);
            setDelta({
              moisture: analysisResult.metrics.moisture - (previous.hydration ?? 0),
              oil: analysisResult.metrics.oil - (previous.oil_level ?? 0),
              pores: analysisResult.metrics.pores - (previous.pores ?? 0),
              wrinkles: analysisResult.metrics.wrinkles - (previous.wrinkles ?? 0),
              pigmentation: analysisResult.metrics.pigmentation - (previous.pigmentation ?? 0),
              sensitivity: analysisResult.metrics.sensitivity - (previous.sensitivity ?? 0),
              // 현재 DB에는 탄력 컬럼이 없어 변화량을 지어내지 않는다.
              elasticity: 0,
              // 진단지에서는 여러 지표를 합친 단일 수치를 만들지 않는다.
              overall: 0,
            });
          }
        } catch {
          // 과거 기록 조회 실패는 현재 분석 결과 표시를 막지 않는다.
        }
      }

      setShowCelebration(true);
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'skin-result',
        tags: { module: 'S-1', action: 'analyze' },
      });
      setErrorMessage(
        error instanceof SkinApiError || error instanceof StoredResultError
          ? error.message
          : DEFAULT_ERROR_MESSAGE
      );
      setSkinType(null);
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, historyId, imageUri, supabase, userId]);

  // clerk-expo getToken 참조가 바뀌어도 화면 진입당 분석은 한 번만 실행한다.
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void analyzeSkin();
  }, [analyzeSkin]);

  const handleProductRecommendation = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/products',
      params: { skinType: skinType ?? '', category: 'skincare' },
    });
  }, [skinType]);

  if (isLoading) {
    return (
      <AnalysisLoadingState message="피부 상태를 분석 중이에요..." testID="skin-analysis-loading" />
    );
  }

  if (!skinType || !metrics) {
    return (
      <AnalysisErrorState
        message={errorMessage}
        onGoHome={() => router.replace('/(tabs)')}
        onRetry={() => router.replace('/(analysis)/skin')}
        testID="skin-analysis-error"
      />
    );
  }

  const typeData = SKIN_TYPE_DATA[skinType];
  const ingredients = INGREDIENT_DATA[skinType];
  const topActions = buildSkinTopActions({
    tips: typeData.tips,
    recommendedIngredients: ingredients.good,
    avoidIngredients: ingredients.avoid,
  });
  const hasMetric = (key: keyof SkinMetrics): boolean =>
    availableMetrics === null || availableMetrics.includes(key);
  const allDetailMetricRows: { key: keyof SkinMetrics; label: string }[] = [
    { key: 'pores', label: '모공' },
    { key: 'elasticity', label: '탄력' },
    { key: 'wrinkles', label: '주름' },
    { key: 'pigmentation', label: '색소침착' },
  ];
  const detailMetricRows = allDetailMetricRows.filter(({ key }) => hasMetric(key));

  const sections: ReportSection[] = [
    {
      key: 'basis',
      title: '판정 설명',
      summary: typeData.description,
      content: <Text style={styles.evidenceText}>{typeData.description}</Text>,
    },
    ...(detailMetricRows.length > 0
      ? [
          {
            key: 'metrics',
            title: '나머지 피부 지표',
            summary: detailMetricRows.map(({ label }) => label).join('·'),
            content: (
              <ReportRowTable testID="skin-detail-metrics">
                {detailMetricRows.map(({ key, label }) => (
                  <ReportAttrRow
                    key={key}
                    label={label}
                    value={formatReportReading(metrics[key], delta?.[key])}
                  />
                ))}
              </ReportRowTable>
            ),
          },
        ]
      : []),
    {
      key: 'tips',
      title: '스킨케어 팁',
      summary: typeData.tips[0],
      content: <ReportTextList items={typeData.tips} testID="skin-care-tips" />,
    },
    {
      key: 'ingredients',
      title: '성분 근거',
      summary: `추천 ${ingredients.good[0]} · 주의 ${ingredients.avoid[0]}`,
      content: (
        <ReportRowTable testID="skin-ingredient-rows">
          <ReportAttrRow label="추천 성분" value={ingredients.good.join(' · ')} />
          <ReportAttrRow label="주의 성분" value={ingredients.avoid.join(' · ')} />
        </ReportRowTable>
      ),
    },
    ...(homeCareBoundary
      ? [
          {
            key: 'home-care-boundary',
            title: '홈케어의 한계선',
            summary: '사진만으로 홈케어의 충분함이나 시술 필요 여부를 판정할 수 없어요.',
            content: <Text style={styles.evidenceText}>{homeCareBoundary.disclaimer}</Text>,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* 축하 연출은 창업자 결정 대기 범위라 이번 진단지 수리에서 유지한다. */}
      <CelebrationEffect
        onComplete={() => {
          setShowCelebration(false);
          if (!hasPreviousAnalysis) setShowBadge(true);
        }}
        type="analysis_complete"
        visible={showCelebration}
      />
      <BadgeDrop
        badge={{ icon: '🔬', name: '피부 관리사', description: '피부 분석 완료!' }}
        onDismiss={() => setShowBadge(false)}
        visible={showBadge}
      />
      <ReportResultLayout
        attributes={
          <ReportRowTable testID="skin-report-attrs">
            {hasMetric('moisture') ? (
              <ReportAttrRow
                label="수분"
                value={formatReportReading(metrics.moisture, delta?.moisture)}
              />
            ) : null}
            {hasMetric('oil') ? (
              <ReportAttrRow label="유분" value={formatReportReading(metrics.oil, delta?.oil)} />
            ) : null}
            {hasMetric('sensitivity') ? (
              <ReportAttrRow
                label="민감도"
                value={formatReportReading(metrics.sensitivity, delta?.sensitivity)}
              />
            ) : null}
          </ReportRowTable>
        }
        conclusion={<ReportActionList actions={topActions} testID="skin-report-actions" />}
        eyebrow="피부 분석 결과"
        imageStyle={styles.skinImage}
        imageUri={imageUri}
        moduleKey="skin"
        onPrimaryAction={handleProductRecommendation}
        onSaveRetry={() => router.replace('/(analysis)/skin')}
        primaryActionText="피부 맞춤 제품 보기"
        retryPath="/(analysis)/skin"
        reportTargetId={reportTargetId ?? 'unsaved:skin:time-unavailable'}
        saveFailed={dbSaveFailed}
        sections={sections}
        shareContent={
          <SkinResultShare
            description={typeData.description}
            recommendedIngredient={ingredients.good[0]}
            typeName={typeData.name}
            usedFallback={usedFallback}
          />
        }
        testID="skin-analysis-result"
        usedFallback={usedFallback}
        verdict={typeData.name}
      />
    </>
  );
}

function normalizeStoredSkinType(value: unknown): SkinType | null {
  return ['dry', 'oily', 'combination', 'sensitive', 'normal'].includes(String(value))
    ? (value as SkinType)
    : null;
}
