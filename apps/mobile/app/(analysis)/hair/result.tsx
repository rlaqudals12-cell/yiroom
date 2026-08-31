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
import { BiometricResultRouteGate } from '@/components/analysis/BiometricRouteGate';
import { AxisResultShareSection } from '@/components/share';
import { BadgeDrop, CelebrationEffect } from '@/components/ui';
import {
  buildHairTopActions,
  finiteNumber,
  getHairCautionIngredients,
  getScalpConcernNotice,
  loadStoredAnalysisRecord,
  storedRecord,
  stringArray,
} from '@/lib/analysis';
import { StoredResultError } from '@/lib/analysis/stored-result-loader';
import { HairApiError, requestHairAnalysis, type HairAnalysisApiResult } from '@/lib/api/hair';
import { downscaleToBase64 } from '@/lib/image/downscale';
import { captureError } from '@/lib/monitoring/sentry';
import { useClerkSupabaseClient } from '@/lib/supabase';
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
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();

  return (
    <BiometricResultRouteGate imageUri={imageUri}>
      <HairResultContent />
    </BiometricResultRouteGate>
  );
}

function HairResultContent(): React.JSX.Element {
  const { getToken } = useAuth();
  const supabase = useClerkSupabaseClient();
  const { imageUri, historyId } = useLocalSearchParams<{
    imageUri?: string;
    historyId?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<HairAnalysisApiResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [availableScores, setAvailableScores] = useState<
    (keyof HairAnalysisApiResult['scores'])[] | null
  >(null);
  const [hasDamageReading, setHasDamageReading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>(DEFAULT_ERROR_MESSAGE);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const analyzeHair = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setUsedFallback(false);
    setAvailableScores(null);
    setHasDamageReading(true);
    try {
      const hasFreshImage = Boolean(imageUri);
      if (!hasFreshImage) {
        const stored = await loadStoredAnalysisRecord(supabase, 'hair', historyId);
        const row = stored.row;
        const texture = normalizeStoredHairTexture(row.hair_type);
        const thickness = normalizeStoredHairThickness(row.hair_thickness);
        const scalpCondition = normalizeStoredScalpType(row.scalp_type);
        if (!texture || !thickness || !scalpCondition) {
          throw new StoredResultError('저장된 헤어 분석 결과를 해석하지 못했어요.');
        }

        const recommendations = storedRecord(row.recommendations);
        const scoreColumns: {
          key: keyof HairAnalysisApiResult['scores'];
          column: string;
        }[] = [
          { key: 'shine', column: 'shine' },
          { key: 'elasticity', column: 'elasticity' },
          { key: 'density', column: 'density' },
          { key: 'scalpHealth', column: 'scalp_health' },
        ];
        const available = scoreColumns
          .filter(({ column }) => finiteNumber(row[column]) !== undefined)
          .map(({ key }) => key);
        const score = (column: string): number => finiteNumber(row[column]) ?? 0;
        const storedDamageHealth = finiteNumber(row.damage_level);

        setAvailableScores(available);
        setHasDamageReading(storedDamageHealth !== undefined);
        setUsedFallback(stored.usedFallback === true);
        setResult({
          texture,
          thickness,
          scalpCondition,
          damageLevel:
            storedDamageHealth === undefined
              ? 0
              : Math.max(0, Math.min(100, 100 - storedDamageHealth)),
          scores: {
            shine: score('shine'),
            elasticity: score('elasticity'),
            density: score('density'),
            scalpHealth: score('scalp_health'),
          },
          mainConcerns: normalizeStoredHairConcerns(row.concerns),
          careRoutine: stringArray(recommendations.careTips),
          recommendedStyles: normalizeStoredHairStyles(recommendations.styleRecommendations),
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
      setErrorMessage(
        error instanceof HairApiError || error instanceof StoredResultError
          ? error.message
          : DEFAULT_ERROR_MESSAGE
      );
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, historyId, imageUri, supabase]);

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

  const allScoreRows: {
    key: keyof HairAnalysisApiResult['scores'];
    label: string;
  }[] = [
    { key: 'shine', label: '윤기' },
    { key: 'elasticity', label: '탄력' },
    { key: 'density', label: '밀도' },
    { key: 'scalpHealth', label: '두피 건강' },
  ];
  const scoreRows = allScoreRows.filter(
    ({ key }) => availableScores === null || availableScores.includes(key)
  );
  if (scoreRows.length > 0) {
    sections.push({
      key: 'condition',
      title: '항목별 컨디션',
      summary: scoreRows.map(({ label }) => label).join('·'),
      content: (
        <ReportRowTable testID="hair-condition-rows">
          {scoreRows.map(({ key, label }) => (
            <ReportAttrRow key={key} label={label} value={String(result.scores[key])} />
          ))}
        </ReportRowTable>
      ),
    });
  }

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
            {hasDamageReading ? (
              <ReportAttrRow
                label="손상도"
                value={`${result.damageLevel}% · 높을수록 손상이 큰 값`}
              />
            ) : null}
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
        reportTargetId={
          historyId ??
          (!result.dbSaveFailed ? result.analysisId : undefined) ??
          `unsaved:hair:${result.analyzedAt ?? 'time-unavailable'}`
        }
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

const STORED_HAIR_CONCERN_LABELS: Record<string, string> = {
  hairloss: '탈모',
  dandruff: '비듬',
  frizz: '푸석함',
  damage: '손상',
  'oily-scalp': '지성 두피',
  'dry-scalp': '건조 두피',
  'split-ends': '끝갈라짐',
  'lack-volume': '볼륨 부족',
};

function normalizeStoredHairTexture(value: unknown): HairAnalysisApiResult['texture'] | null {
  return ['straight', 'wavy', 'curly', 'coily'].includes(String(value))
    ? (value as HairAnalysisApiResult['texture'])
    : null;
}

function normalizeStoredHairThickness(value: unknown): HairAnalysisApiResult['thickness'] | null {
  if (value === 'thin') return 'fine';
  return ['fine', 'medium', 'thick'].includes(String(value))
    ? (value as HairAnalysisApiResult['thickness'])
    : null;
}

function normalizeStoredScalpType(value: unknown): HairAnalysisApiResult['scalpCondition'] | null {
  return ['dry', 'oily', 'normal', 'sensitive'].includes(String(value))
    ? (value as HairAnalysisApiResult['scalpCondition'])
    : null;
}

function normalizeStoredHairConcerns(value: unknown): string[] {
  return stringArray(value).map((concern) => STORED_HAIR_CONCERN_LABELS[concern] ?? concern);
}

function normalizeStoredHairStyles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string') return [item];
    const record = storedRecord(item);
    return typeof record.name === 'string' ? [record.name] : [];
  });
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
