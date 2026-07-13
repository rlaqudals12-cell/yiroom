/**
 * C-1 체형 분석 — 결과 V2 (웹 API 정본, ADR-118 thin client)
 *
 * ResultLayout 3탭 구조:
 *  요약: 체형 타입 + BMI 게이지 + 설명
 *  상세: 추천 이유 + BMI 해석
 *  추천: 추천 스타일 + 피하면 좋은 스타일
 *
 * 분석·저장은 전부 웹 POST /api/analyze/body가 수행한다 (실 AI + body_analyses
 * 저장 + 연령/생체 게이트). 이전의 로컬 lib/gemini 경로는 클라이언트에 키가 없어
 * 항상 Mock 폴백 + 저장 실패였다 — 홈 5축 집계에 절대 반영되지 않던 근본 원인.
 */
import { useAuth } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  AnalysisLoadingState,
  AnalysisErrorState,
  ResultLayout,
  MetricBar,
  TopActionsCard,
  useAnalysisStyles,
} from '@/components/analysis';
import {
  StylingPrinciplesCard,
  OutfitExamplesCard,
  ClosetPromptCard,
} from '@/components/analysis/body';
import { AIBadge } from '@/components/common/AIBadge';
import { ProgressiveDisclosure } from '@/components/common/ProgressiveDisclosure';
import { GradientCard, CelebrationEffect, BadgeDrop } from '@/components/ui';
import { buildBodyTopActions } from '@/lib/analysis';
import { TIMING } from '@/lib/animations';
import { requestBodyAnalysis, BodyApiError, type BodyAnalysisApiResult } from '@/lib/api/body';
import { imageToBase64 } from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';
import { typography, radii, spacing } from '@/lib/theme';

// BMI는 참고 수치일 뿐 — 근육량 등에 따라 실제 체성분과 다를 수 있어
// '과체중/비만' 같은 낙인 라벨 대신 숫자만 "참고 수치"로 제시한다. (웹 W4 정합)
const BMI_CAVEAT = 'BMI는 근육량에 따라 실제와 다를 수 있어요';

const DEFAULT_ERROR_MESSAGE = '분석에 실패했어요. 다시 시도해 주세요.';

export default function BodyResultScreen() {
  const { module, colors } = useAnalysisStyles();
  const accent = module.body;
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

  const analyzeBody = useCallback(async () => {
    setIsLoading(true);
    setAnalysis(null);

    try {
      let base64Data = imageBase64;
      if (!base64Data && imageUri) {
        base64Data = await imageToBase64(imageUri);
      }

      if (!base64Data) {
        throw new Error('이미지 데이터가 없습니다.');
      }

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
      // 게이트(연령·생체 동의)·검증 에러는 서버의 한국어 메시지를 그대로 보여준다
      setErrorMessage(error instanceof BodyApiError ? error.message : DEFAULT_ERROR_MESSAGE);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, [height, weight, imageUri, imageBase64, getToken]);

  // 분석은 화면 진입당 정확히 1회만 실행한다.
  // clerk-expo의 getToken은 렌더마다 참조가 바뀌어 analyzeBody 의존성 배열만으로는
  // effect가 무한 재발화한다 (실측: 체형 분석 요청 폭풍 → 서버 11행 중복 저장 + 429).
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    analyzeBody();
  }, [analyzeBody]);

  // ADR-098: W-1 UI 숨김에 따라 운동 추천 CTA 제거.
  // 5축 정체성 맥락에서 다음 단계는 "퍼스널 컬러"(색 정체성) 유도 —
  // 체형(표현)과 색(정체성)을 함께 알아야 시각 정체성 프로필이 완성된다.
  const handleNextAxis = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(analysis)/personal-color');
  };

  if (isLoading) {
    return (
      <AnalysisLoadingState message="체형을 분석 중이에요..." testID="body-analysis-loading" />
    );
  }

  // 서버 BMI 우선, 없으면 입력값에서 파생 (분석 실패와 무관한 산술값)
  const heightNum = parseFloat(height);
  const weightNum = parseFloat(weight);
  const derivedBmi =
    Number.isFinite(heightNum) && heightNum > 0 && Number.isFinite(weightNum)
      ? weightNum / (heightNum / 100) ** 2
      : null;
  const bmi = analysis?.bmi ?? derivedBmi;

  if (!analysis || bmi === null) {
    return (
      <AnalysisErrorState
        message={errorMessage}
        onRetry={() => router.replace('/(analysis)/body')}
        onGoHome={() => router.replace('/(tabs)')}
        testID="body-analysis-error"
      />
    );
  }

  const recommendationItems = analysis.styleRecommendations.map((rec) => rec.item);

  // BMI 바 값 (0-40 범위를 0-100으로 정규화)
  const bmiNormalized = Math.min(100, Math.round((bmi / 40) * 100));

  // --- 헤더 콘텐츠 ---
  const headerContent = (
    <View style={localStyles.headerContent}>
      <AIBadge variant="small" />
      <Text style={[localStyles.typeName, { color: accent.base }]}>{analysis.bodyTypeLabel}</Text>
      <View style={localStyles.bmiRow}>
        <Text style={[localStyles.bmiLabel, { color: colors.mutedForeground }]}>BMI</Text>
        <Text style={[localStyles.bmiNumber, { color: colors.foreground }]}>{bmi.toFixed(1)}</Text>
        <View style={[localStyles.bmiBadge, { backgroundColor: colors.muted }]}>
          <Text style={[localStyles.bmiBadgeText, { color: colors.mutedForeground }]}>
            참고 수치
          </Text>
        </View>
      </View>
      <Text style={[localStyles.bodyInfo, { color: colors.mutedForeground }]}>
        키 {height}cm / 체중 {weight}kg
      </Text>
      <Text style={[localStyles.bmiCaveat, { color: colors.mutedForeground }]}>{BMI_CAVEAT}</Text>
    </View>
  );

  // 결론 액션(ADR-111 표현 원칙 1) — 서버 분석 결과에서 규칙 조립 (새 fetch/AI 없음)
  const topActions = buildBodyTopActions({
    recommendations: recommendationItems,
    avoidItems: analysis.avoidStyles,
  });

  // --- 요약 탭 (결론 먼저: 액션 → 시그니처 → 상세는 접기) ---
  const summaryTab = (
    <View style={localStyles.tabContent}>
      {/* ① 그래서, 이렇게 하세요 */}
      <TopActionsCard actions={topActions} />

      {/* ② 시그니처 — 체형 설명 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <GradientCard variant="body" style={localStyles.descCard}>
          <Text style={[localStyles.descText, { color: colors.foreground }]}>
            {analysis.bodyTypeDescription || `${analysis.bodyTypeLabel} 골격이에요.`}
          </Text>
          {analysis.insight ? (
            <Text style={[localStyles.insightText, { color: colors.mutedForeground }]}>
              {analysis.insight}
            </Text>
          ) : null}
        </GradientCard>
      </Animated.View>

      {/* ③ BMI + 체형 강점 — 접기 (정보 삭제 아님, 접기만) */}
      <ProgressiveDisclosure
        expandLabel="BMI·체형 강점 자세히 보기"
        collapseLabel="접기"
        summary={
          <Text style={[localStyles.discloseSummary, { color: colors.mutedForeground }]}>
            BMI {bmi.toFixed(1)} (참고 수치)
            {analysis.strengths.length > 0 ? ` · 체형 강점 ${analysis.strengths.length}개` : ''}
          </Text>
        }
        detail={
          <View style={localStyles.discloseBody}>
            <View>
              <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>BMI 지수</Text>
              <MetricBar label={`${bmi.toFixed(1)} (참고 수치)`} value={bmiNormalized} />
              <Text style={[localStyles.bmiGuide, { color: colors.mutedForeground }]}>
                일반 참고 범위: 18.5 ~ 22.9 · {BMI_CAVEAT}
              </Text>
            </View>
            {analysis.strengths.length > 0 && (
              <View>
                <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
                  체형 강점
                </Text>
                <GradientCard variant="body" style={localStyles.tipsCard}>
                  {analysis.strengths.map((strength, index) => (
                    <View key={index} style={localStyles.tipItem}>
                      <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
                      <Text style={[localStyles.tipText, { color: colors.foreground }]}>
                        {strength}
                      </Text>
                    </View>
                  ))}
                </GradientCard>
              </View>
            )}
          </View>
        }
      />
    </View>
  );

  // --- 상세 탭 ---
  const detailTab = (
    <View style={localStyles.tabContent}>
      {/* 추천 이유 — 서버 분석의 아이템별 근거 */}
      {analysis.styleRecommendations.length > 0 && (
        <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            추천 스타일과 이유
          </Text>
          <GradientCard variant="body" style={localStyles.tipsCard}>
            {analysis.styleRecommendations.map((rec, index) => (
              <View key={index} style={localStyles.tipItem}>
                <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
                <Text style={[localStyles.tipText, { color: colors.foreground }]}>
                  {rec.item}
                  {rec.reason ? ` — ${rec.reason}` : ''}
                </Text>
              </View>
            ))}
          </GradientCard>
        </Animated.View>
      )}

      {/* BMI 상세 해석 */}
      <Animated.View entering={FadeInUp.delay(150).duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>BMI 상세</Text>
        <GradientCard variant="body" style={localStyles.descCard}>
          <View style={localStyles.bmiDetailRow}>
            <Text style={[localStyles.bmiDetailLabel, { color: colors.mutedForeground }]}>키</Text>
            <Text style={[localStyles.bmiDetailValue, { color: colors.foreground }]}>
              {height}cm
            </Text>
          </View>
          <View style={localStyles.bmiDetailRow}>
            <Text style={[localStyles.bmiDetailLabel, { color: colors.mutedForeground }]}>
              체중
            </Text>
            <Text style={[localStyles.bmiDetailValue, { color: colors.foreground }]}>
              {weight}kg
            </Text>
          </View>
          <View style={localStyles.bmiDetailRow}>
            <Text style={[localStyles.bmiDetailLabel, { color: colors.mutedForeground }]}>BMI</Text>
            <Text style={[localStyles.bmiDetailValue, { color: colors.foreground }]}>
              {bmi.toFixed(1)} (참고 수치)
            </Text>
          </View>
          <Text style={[localStyles.bmiCaveat, { color: colors.mutedForeground }]}>
            {BMI_CAVEAT}
          </Text>
        </GradientCard>
      </Animated.View>
    </View>
  );

  // --- 추천 탭 — ADR-098 C-1 3섹션 구조 (원칙 + 코디 + 옷장 CTA) ---
  // 서버가 3타입(S/W/N)을 직접 반환하므로 8→3 재분류 매핑이 필요 없다
  const recommendTab = (
    <View style={localStyles.tabContent}>
      {/* 섹션 1: 스타일링 원칙 (장기 기준, 쇼핑 시 판단 기준) */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <StylingPrinciplesCard
          bodyType={analysis.bodyType}
          bodyTypeLabel={analysis.bodyTypeLabel}
        />
      </Animated.View>

      {/* 섹션 2: 추천 코디 3세트 (단기 실행, 오늘 따라 입기) */}
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <OutfitExamplesCard bodyType={analysis.bodyType} personalColorSeason={null} />
      </Animated.View>

      {/* 섹션 3: 옷장 조합 CTA (무료 경로, Phase 1.5) */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <ClosetPromptCard />
      </Animated.View>
    </View>
  );

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
        badge={{ icon: '💪', name: '체형 분석가', description: '체형 분석 완료!' }}
        visible={showBadge}
        onDismiss={() => setShowBadge(false)}
      />
      <ResultLayout
        moduleKey="body"
        title="체형 분석 결과"
        imageUri={imageUri}
        imageStyle={localStyles.bodyImage}
        headerContent={headerContent}
        trustBadgeType={analysis.usedMock ? 'fallback' : 'ai'}
        usedFallback={analysis.usedMock}
        summaryTab={summaryTab}
        detailTab={detailTab}
        recommendTab={recommendTab}
        primaryActionText="🎨 퍼스널 컬러로 내 색 찾기"
        onPrimaryAction={handleNextAxis}
        retryPath="/(analysis)/body"
        testID="body-analysis-result"
      />
    </>
  );
}

const localStyles = StyleSheet.create({
  headerContent: {
    alignItems: 'center',
    gap: 6,
  },
  typeName: {
    fontSize: 22,
    fontWeight: typography.weight.bold,
  },
  bmiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bmiLabel: {
    fontSize: typography.size.sm,
  },
  bmiNumber: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
  },
  bmiBadge: {
    paddingHorizontal: spacing.smd,
    paddingVertical: 3,
    borderRadius: radii.xl,
  },
  bmiBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  bodyInfo: {
    fontSize: typography.size.sm,
  },
  bmiCaveat: {
    fontSize: typography.size.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  bodyImage: {
    width: 120,
    height: 160,
    borderRadius: radii.xl,
    borderWidth: 3,
  },
  tabContent: {
    gap: spacing.mlg,
    paddingBottom: spacing.sm,
  },
  descCard: {
    padding: spacing.md,
  },
  descText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
  },
  insightText: {
    fontSize: typography.size.xs,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.smx,
  },
  bmiGuide: {
    fontSize: typography.size.xs,
    marginTop: 6,
  },
  discloseSummary: {
    fontSize: typography.size.sm,
  },
  discloseBody: {
    gap: spacing.mlg,
  },
  bmiDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.smd,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  bmiDetailLabel: {
    fontSize: typography.size.sm,
  },
  bmiDetailValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  tipsCard: {
    padding: spacing.md,
    gap: spacing.smd,
  },
  tipItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tipBullet: {
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  tipText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
    flex: 1,
  },
});
