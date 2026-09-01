/** PC-1 퍼스널 컬러 결과 — ADR-120 진단지 문법. */
import { useAuth } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import {
  AnalysisErrorState,
  AnalysisLoadingState,
  ColorHarmonyGuide,
  DrapingPreview,
  ReportActionList,
  ReportAttrRow,
  ReportColorBand,
  ReportDivider,
  ReportResultLayout,
  ReportRowTable,
  ReportTextList,
  type ReportSection,
} from '@/components/analysis';
import { BiometricResultRouteGate } from '@/components/analysis/BiometricRouteGate';
import {
  PersonalColorResultShare,
  getPersonalColorMakeupRows,
  personalColorResultStyles as styles,
} from '@/components/analysis/personal-color/PersonalColorResultSupport';
import { BadgeDrop, CelebrationEffect } from '@/components/ui';
import {
  buildPersonalColorTopActions,
  finiteNumber,
  loadStoredAnalysisRecord,
  storedRecord,
} from '@/lib/analysis';
import {
  PERSONAL_COLOR_REPORT_DATA,
  type PersonalColorReportSeasonInfo,
} from '@/lib/analysis/personal-color-report-data';
import {
  TWELVE_TONE_LABELS,
  getAdjacentTones,
  resolveTwelveTone,
} from '@/lib/analysis/personal-color-v2';
import { StoredResultError } from '@/lib/analysis/stored-result-loader';
import {
  getPersonalColorSubtypeLabel,
  normalizePersonalColorAnalysisEvidence,
  normalizePersonalColorHexes,
  normalizePersonalColorImageQuality,
  normalizePersonalColorSubtype,
  parsePersonalColorSelfReport,
  PersonalColorApiError,
  requestPersonalColorAnalysis,
  type PersonalColorApiResult,
} from '@/lib/api/personalColor';
import { downscaleToBase64 } from '@/lib/image/downscale';
import { captureError } from '@/lib/monitoring/sentry';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { withSubjectParticle } from '@/lib/utils/korean';

const DEFAULT_ERROR_MESSAGE = '분석에 실패했어요.';
const TONE_EXPLANATION: Record<PersonalColorReportSeasonInfo['tone'], string> = {
  warm: '피부 아래에 노란 기운이 도는 타입으로, 금색 주얼리와 따뜻한 색조가 잘 어울려요.',
  cool: '피부 아래에 파란 기운이 도는 타입으로, 은색 주얼리와 시원한 색조가 잘 어울려요.',
};
const VEIN_LABELS = {
  blue: '파란색',
  purple: '보라색',
  green: '녹색',
  olive: '올리브색',
  mixed: '혼합',
  unknown: '확인 어려움',
} as const;
const UNDERTONE_LABELS = {
  yellow: '노란 기',
  pink: '핑크 기',
  olive: '올리브',
  neutral: '중립',
} as const;
const CONTRAST_LABELS = {
  low: '낮음',
  medium: '중간',
  high: '높음',
  very_high: '매우 높음',
} as const;
const EYE_LABELS = {
  light_brown: '밝은 갈색',
  brown: '갈색',
  dark_brown: '진한 갈색',
  black: '검정색',
} as const;
const LIP_LABELS = { coral: '코랄', pink: '핑크', neutral: '중립' } as const;
const LIGHTING_LABELS = {
  natural: '자연광',
  artificial: '실내 조명',
  mixed: '혼합 조명',
} as const;

export default function PersonalColorResultScreen(): React.JSX.Element {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();

  return (
    <BiometricResultRouteGate imageUri={imageUri}>
      <PersonalColorResultContent />
    </BiometricResultRouteGate>
  );
}

function PersonalColorResultContent(): React.JSX.Element {
  const { getToken } = useAuth();
  const supabase = useClerkSupabaseClient();
  const { imageUri, historyId, answers } = useLocalSearchParams<{
    imageUri?: string;
    historyId?: string;
    answers?: string;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<PersonalColorApiResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState(DEFAULT_ERROR_MESSAGE);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const analyzePersonalColor = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setUsedFallback(false);
    setResult(null);

    try {
      const hasFreshImage = Boolean(imageUri);
      if (!hasFreshImage) {
        const stored = await loadStoredAnalysisRecord(supabase, 'personal-color', historyId);
        const row = stored.row;
        const season = normalizeStoredSeason(row.season);
        const confidence = finiteNumber(row.confidence);
        if (!season || confidence === undefined) {
          throw new StoredResultError('저장된 퍼스널 컬러 결과를 해석하지 못했어요.');
        }
        const imageAnalysis = storedRecord(row.image_analysis);
        const response: PersonalColorApiResult = {
          season,
          seasonSubtype: normalizePersonalColorSubtype(row.season_subtype),
          confidence: confidence > 1 ? confidence / 100 : confidence,
          description: typeof imageAnalysis.insight === 'string' ? imageAnalysis.insight : '',
          bestColors: normalizePersonalColorHexes(row.best_colors),
          worstColors: normalizePersonalColorHexes(row.worst_colors),
          usedMock: stored.usedFallback === true,
          dbSaveFailed: false,
          analysisId: typeof row.id === 'string' ? row.id : undefined,
          analyzedAt: typeof row.created_at === 'string' ? row.created_at : undefined,
          analysisEvidence: normalizePersonalColorAnalysisEvidence(imageAnalysis.analysisEvidence),
          imageQuality: normalizePersonalColorImageQuality(imageAnalysis.imageQuality),
        };
        const usesStaticDiagnosisFallback =
          response.seasonSubtype === null ||
          response.bestColors.length === 0 ||
          response.worstColors.length === 0;
        setUsedFallback(response.usedMock || usesStaticDiagnosisFallback);
        setResult(response);
        return;
      }

      const base64Data = imageUri ? await downscaleToBase64(imageUri, 1024) : '';
      if (!base64Data) throw new Error('이미지 데이터가 없습니다.');

      const token = await getToken();
      if (!token) {
        throw new PersonalColorApiError(
          '로그인이 필요해요. 다시 로그인해주세요.',
          401,
          'AUTH_ERROR'
        );
      }

      const selfReport = parsePersonalColorSelfReport(answers);
      const response = await requestPersonalColorAnalysis(
        {
          imageBase64: base64Data,
          ...(selfReport ? { selfReport } : {}),
        },
        token
      );
      const usesStaticDiagnosisFallback =
        response.seasonSubtype === null ||
        response.bestColors.length === 0 ||
        response.worstColors.length === 0;
      setUsedFallback(response.usedMock || usesStaticDiagnosisFallback);
      setResult(response);
      setShowCelebration(true);
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'personal-color-result',
        tags: { module: 'PC-1', action: 'analyze' },
      });
      setErrorMessage(
        error instanceof PersonalColorApiError || error instanceof StoredResultError
          ? error.message
          : DEFAULT_ERROR_MESSAGE
      );
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [answers, getToken, historyId, imageUri, supabase]);

  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void analyzePersonalColor();
  }, [analyzePersonalColor]);

  const handleProductRecommendation = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/products',
      params: { season: result?.season || '', category: 'makeup' },
    });
  }, [result?.season]);

  if (isLoading) {
    return (
      <AnalysisLoadingState
        message="퍼스널 컬러를 분석 중이에요..."
        testID="personal-color-loading"
      />
    );
  }

  if (!result) {
    return (
      <AnalysisErrorState
        message={errorMessage}
        onGoHome={() => router.replace('/(tabs)')}
        onRetry={() => router.replace('/(analysis)/personal-color')}
        testID="personal-color-error"
      />
    );
  }

  const fallbackSeason = PERSONAL_COLOR_REPORT_DATA[result.season];
  const season: PersonalColorReportSeasonInfo = {
    ...fallbackSeason,
    subType: result.seasonSubtype
      ? getPersonalColorSubtypeLabel(result.seasonSubtype)
      : fallbackSeason.subType,
    bestColors: result.bestColors.length > 0 ? result.bestColors : fallbackSeason.bestColors,
    worstColors: result.worstColors.length > 0 ? result.worstColors : fallbackSeason.worstColors,
  };
  const description = result.description || season.description;
  const twelveTone = resolveTwelveTone(result.season.toLowerCase(), result.seasonSubtype);
  const adjacentTone = twelveTone ? getAdjacentTones(twelveTone, 1)[0] : undefined;
  const adjacentToneSentence =
    twelveTone && adjacentTone
      ? `현재 판정은 ${TWELVE_TONE_LABELS[twelveTone]}에 가깝고, ${withSubjectParticle(TWELVE_TONE_LABELS[adjacentTone])} 차선이에요.`
      : null;
  const evidenceRows: { label: string; value: string }[] = [];
  if (!usedFallback) {
    const evidence = result.analysisEvidence;
    const imageQuality = result.imageQuality;
    if (evidence?.veinColor) {
      evidenceRows.push({ label: '혈관 색', value: VEIN_LABELS[evidence.veinColor] });
    }
    if (evidence?.skinUndertone) {
      evidenceRows.push({ label: '언더톤', value: UNDERTONE_LABELS[evidence.skinUndertone] });
    }
    if (evidence?.skinHairContrast) {
      evidenceRows.push({
        label: '명암 대비',
        value: CONTRAST_LABELS[evidence.skinHairContrast],
      });
    }
    if (evidence?.eyeColor) {
      evidenceRows.push({ label: '눈동자', value: EYE_LABELS[evidence.eyeColor] });
    }
    if (evidence?.lipNaturalColor) {
      evidenceRows.push({ label: '입술 자연색', value: LIP_LABELS[evidence.lipNaturalColor] });
    }
    if (imageQuality?.lightingCondition) {
      evidenceRows.push({
        label: '조명',
        value: LIGHTING_LABELS[imageQuality.lightingCondition],
      });
    }
    if (imageQuality?.makeupDetected !== undefined) {
      evidenceRows.push({
        label: '메이크업 감지',
        value: imageQuality.makeupDetected ? '감지됨' : '감지되지 않음',
      });
    }
  }
  const makeupRows = getPersonalColorMakeupRows(season.tone);
  const topActions = buildPersonalColorTopActions({
    bestColors: season.bestColors,
    toneLabel: season.name,
    stylingTips: season.stylingTips,
  }).filter((action) => !action.swatches);
  const sections: ReportSection[] = [
    {
      key: 'basis',
      title: '판정 근거',
      summary: description,
      content: (
        <View style={styles.evidenceGroup}>
          <ReportTextList
            items={[description, TONE_EXPLANATION[season.tone]]}
            testID="pc-basis-list"
          />
          {evidenceRows.length > 0 ? (
            <>
              <ReportDivider testID="pc-evidence-divider" />
              <ReportRowTable testID="pc-evidence-rows">
                {evidenceRows.map((row) => (
                  <ReportAttrRow key={row.label} label={row.label} value={row.value} />
                ))}
              </ReportRowTable>
            </>
          ) : null}
        </View>
      ),
    },
    {
      key: 'avoid-colors',
      title: '피하면 좋은 색',
      summary: `${season.worstColors.length}가지 색을 확인해보세요`,
      content: (
        <ReportColorBand colors={season.worstColors} testID="pc-worst-colors" title="회피 색" />
      ),
    },
    {
      key: 'harmony',
      title: '배색 가이드',
      summary: '대표 색을 기준으로 계산한 조합이에요',
      content: <ColorHarmonyGuide baseHex={season.bestColors[0]} testID="pc-color-harmony-guide" />,
    },
    ...(imageUri
      ? [
          {
            key: 'draping',
            title: '드레이핑 비교',
            summary: '얼굴 아래 색천을 바꿔 차이를 비교해보세요',
            content: (
              <DrapingPreview
                avoidPalette={season.worstColors}
                imageUri={imageUri}
                onRetry={() => router.replace('/(analysis)/personal-color')}
                palette={season.bestColors}
                seasonDescription={`${season.tone === 'warm' ? '웜톤' : '쿨톤'} ${season.subType}`}
                seasonName={season.name}
                tone={twelveTone ?? undefined}
                testID="draping-preview"
              />
            ),
          },
        ]
      : []),
    {
      key: 'styling',
      title: '스타일링 참고',
      summary: season.stylingTips[0],
      content: (
        <View style={styles.evidenceGroup}>
          <ReportTextList
            heading="스타일링 팁"
            items={season.stylingTips}
            testID="pc-styling-tips"
          />
          <ReportDivider testID="pc-celebrity-divider" />
          <ReportTextList heading="참고 인물" items={season.celebrities} testID="pc-celebrities" />
        </View>
      ),
    },
    {
      key: 'makeup',
      title: '메이크업 포인트',
      summary: makeupRows[0].value,
      content: (
        <ReportRowTable testID="pc-makeup-rows">
          {makeupRows.map((row) => (
            <ReportAttrRow key={row.label} label={row.label} value={row.value} />
          ))}
        </ReportRowTable>
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
        badge={{ icon: '🎨', name: '컬러 전문가', description: '퍼스널 컬러 진단 완료!' }}
        onDismiss={() => setShowBadge(false)}
        visible={showBadge}
      />
      <ReportResultLayout
        attributes={
          <ReportRowTable testID="pc-report-attrs">
            <ReportAttrRow label="세부 톤" value={season.subType} />
            <ReportAttrRow label="언더톤" value={season.tone === 'warm' ? '웜' : '쿨'} />
          </ReportRowTable>
        }
        conclusion={
          <View style={styles.conclusion}>
            {adjacentToneSentence ? (
              <ReportTextList items={[adjacentToneSentence]} testID="pc-adjacent-tone" />
            ) : null}
            <ReportColorBand colors={season.bestColors} testID="pc-best-colors" title="대표 색" />
            {topActions.length > 0 ? (
              <>
                <ReportDivider testID="pc-action-divider" />
                <ReportActionList actions={topActions} testID="pc-report-actions" />
              </>
            ) : null}
          </View>
        }
        confidence={usedFallback ? undefined : result.confidence}
        eyebrow="퍼스널 컬러 진단 결과"
        imageStyle={styles.resultImage}
        imageUri={imageUri}
        moduleKey="personalColor"
        onPrimaryAction={handleProductRecommendation}
        onSaveRetry={() => router.replace('/(analysis)/personal-color')}
        primaryActionText="내 색상에 맞는 제품 보기"
        reproducibilityText="같은 사진이면 같은 판정을 목표로 합니다."
        retryPath="/(analysis)/personal-color"
        reportTargetId={
          historyId ??
          (!result.dbSaveFailed ? result.analysisId : undefined) ??
          `unsaved:personal-color:${result.analyzedAt ?? 'time-unavailable'}`
        }
        saveFailed={result.dbSaveFailed}
        sections={sections}
        shareContent={
          <PersonalColorResultShare
            description={description}
            season={season}
            usedFallback={usedFallback}
          />
        }
        testID="analysis-personal-color-result-screen"
        usedFallback={usedFallback}
        verdict={season.name}
      />
    </>
  );
}

function normalizeStoredSeason(value: unknown): PersonalColorApiResult['season'] | null {
  if (typeof value !== 'string') return null;
  const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return ['Spring', 'Summer', 'Autumn', 'Winter'].includes(normalized)
    ? (normalized as PersonalColorApiResult['season'])
    : null;
}
