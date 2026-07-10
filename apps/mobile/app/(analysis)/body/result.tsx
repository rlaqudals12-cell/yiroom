/**
 * C-1 체형 분석 — 결과 V2
 *
 * ResultLayout 3탭 구조:
 *  요약: 체형 타입 + BMI 게이지 + 설명
 *  상세: 비율 BarChart + BMI 해석
 *  추천: 추천 스타일 + 피하면 좋은 스타일
 */
import { useUser } from '@clerk/clerk-expo';
import type { BodyType, StylingBodyType } from '@yiroom/shared';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
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
import { BarChart, type BarDataItem } from '@/components/charts';
import { AIBadge } from '@/components/common/AIBadge';
import { ProgressiveDisclosure } from '@/components/common/ProgressiveDisclosure';
import { GradientCard, CelebrationEffect, BadgeDrop } from '@/components/ui';
import { saveBodyResult, buildBodyTopActions } from '@/lib/analysis';
import { TIMING } from '@/lib/animations';
import {
  analyzeBody as analyzeWithGemini,
  imageToBase64,
  type BodyAnalysisResult,
} from '@/lib/gemini';
import { captureError } from '@/lib/monitoring/sentry';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { typography, radii, spacing } from '@/lib/theme';

// BMI는 참고 수치일 뿐 — 근육량 등에 따라 실제 체성분과 다를 수 있어
// '과체중/비만' 같은 낙인 라벨 대신 숫자만 "참고 수치"로 제시한다. (웹 W4 정합)
const BMI_CAVEAT = 'BMI는 근육량에 따라 실제와 다를 수 있어요';

/**
 * BodyType(8분류) → StylingBodyType(3분류) 매핑.
 *
 * 웹과 동일한 C-1 결과 3섹션 구조(ADR-098)를 Mobile에도 적용하기 위해
 * 기존 8타입 분석 결과를 S/W/N 3타입으로 재분류한다.
 *
 * - S (Straight): 직선적 실루엣 — Rectangle, Athletic, InvertedTriangle
 * - W (Wave): 곡선미 중심 — Hourglass, Pear, Triangle
 * - N (Natural): 프레임감 중심 — Oval, Diamond
 */
const BODY_TYPE_TO_STYLING: Record<BodyType, StylingBodyType> = {
  Rectangle: 'S',
  Athletic: 'S',
  InvertedTriangle: 'S',
  Hourglass: 'W',
  Pear: 'W',
  Triangle: 'W',
  Oval: 'N',
  Diamond: 'N',
};

// 체형 타입 데이터
const BODY_TYPE_DATA: Record<
  BodyType,
  {
    name: string;
    description: string;
    recommendations: string[];
    avoidItems: string[];
    exerciseTips: string[];
  }
> = {
  Rectangle: {
    name: '직사각형 체형',
    description:
      '어깨, 허리, 엉덩이 너비가 비슷한 체형이에요. 허리 라인을 강조하면 실루엣이 더 예뻐 보여요.',
    recommendations: ['벨트로 허리 강조', 'A라인 스커트', '페플럼 탑', '랩 원피스'],
    avoidItems: ['일자 실루엣', '박시한 상의'],
    exerciseTips: ['사이드 크런치로 허리 라인 만들기', '힙 쓰러스트로 하체 볼륨 키우기'],
  },
  Triangle: {
    name: '삼각형 체형',
    description:
      '엉덩이가 어깨보다 넓은 체형이에요. 상체를 강조하면 균형 잡힌 실루엣을 연출할 수 있어요.',
    recommendations: ['보트넥', '퍼프 소매', 'A라인 스커트', '부츠컷 팬츠'],
    avoidItems: ['스키니진', '밝은 색 하의', '힙 포켓 디테일'],
    exerciseTips: ['숄더 프레스로 어깨 라인 키우기', '푸쉬업으로 상체 탄탄하게'],
  },
  InvertedTriangle: {
    name: '역삼각형 체형',
    description: '어깨가 엉덩이보다 넓은 체형이에요. 하체에 볼륨을 주면 균형 잡힌 실루엣이 돼요.',
    recommendations: ['V넥', '래글런 소매', '플레어 스커트', '와이드 팬츠'],
    avoidItems: ['패드 있는 어깨', '보트넥', '가로 스트라이프 상의'],
    exerciseTips: ['스쿼트로 하체 볼륨 키우기', '런지로 힙업 효과'],
  },
  Hourglass: {
    name: '모래시계 체형',
    description:
      '어깨와 엉덩이가 비슷하고 허리가 잘록한 체형이에요. 곡선을 살리는 스타일이 잘 어울려요.',
    recommendations: ['허리 강조 원피스', '벨트', '바디컨 스타일', '랩 탑'],
    avoidItems: ['박시한 옷', '오버사이즈', '일자 실루엣'],
    exerciseTips: ['전신 운동으로 밸런스 유지하기', '필라테스로 코어 강화'],
  },
  Oval: {
    name: '타원형 체형',
    description: '복부가 가장 넓은 체형이에요. 세로 라인을 강조하면 슬림해 보이는 효과가 있어요.',
    recommendations: ['세로 스트라이프', 'V넥', 'A라인', '하이웨이스트'],
    avoidItems: ['벨트 강조', '타이트한 복부', '가로 스트라이프'],
    exerciseTips: ['유산소 운동으로 체지방 감소', '플랭크로 코어 강화'],
  },
  Diamond: {
    name: '다이아몬드 체형',
    description: '허리가 넓고 어깨와 엉덩이가 좁은 체형이에요. 상하체 균형을 맞추면 좋아요.',
    recommendations: ['어깨 강조', '와이드 팬츠', 'A라인', '스트럭처드 재킷'],
    avoidItems: ['타이트한 허리', '벨트 강조', '펜슬 스커트'],
    exerciseTips: ['숄더 프레스로 어깨 라인 강조', '스쿼트로 하체 볼륨 키우기'],
  },
  Pear: {
    name: '배 체형',
    description: '하체가 상체보다 넓은 체형이에요. 상체를 강조하면 밸런스 있는 실루엣이 돼요.',
    recommendations: ['보트넥', '퍼프 소매', 'A라인 스커트', '부츠컷 팬츠'],
    avoidItems: ['스키니진', '밝은 색 하의', '힙 포켓 디테일'],
    exerciseTips: ['상체 근력 운동으로 밸런스 맞추기', '힙 스트레칭으로 라인 정리'],
  },
  Athletic: {
    name: '운동선수 체형',
    description: '탄탄하고 균형 잡힌 체형이에요. 다양한 스타일을 소화할 수 있는 장점이 있어요.',
    recommendations: ['핏된 옷', '스포티 룩', '캐주얼', '미니멀'],
    avoidItems: ['과도한 레이어링', '너무 루즈한 핏'],
    exerciseTips: ['현재 운동 루틴 유지', '유연성 운동 추가'],
  },
};

export default function BodyResultScreen() {
  const { module, colors, isDark } = useAnalysisStyles();
  const accent = module.body;
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const { height, weight, imageUri, imageBase64 } = useLocalSearchParams<{
    height: string;
    weight: string;
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [bodyType, setBodyType] = useState<BodyType | null>(null);
  const [bmi, setBmi] = useState<number | null>(null);
  const [proportions, setProportions] = useState<BodyAnalysisResult['proportions'] | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const analyzeBody = useCallback(async () => {
    setIsLoading(true);
    setUsedFallback(false);

    try {
      let base64Data = imageBase64;
      if (!base64Data && imageUri) {
        base64Data = await imageToBase64(imageUri);
      }

      if (!base64Data) {
        throw new Error('이미지 데이터가 없습니다.');
      }

      const heightNum = parseFloat(height);
      const weightNum = parseFloat(weight);
      const response = await analyzeWithGemini(base64Data, heightNum, weightNum);
      const analysisResult = response.result;

      setUsedFallback(response.usedFallback);

      // BodyType 대소문자 매핑
      const bodyTypeMap: Record<string, BodyType> = {
        rectangle: 'Rectangle',
        triangle: 'Triangle',
        inverted_triangle: 'InvertedTriangle',
        hourglass: 'Hourglass',
        oval: 'Oval',
        diamond: 'Diamond',
        pear: 'Pear',
        athletic: 'Athletic',
      };

      setBodyType(bodyTypeMap[analysisResult.bodyType] || 'Rectangle');
      setBmi(analysisResult.bmi);
      setProportions(analysisResult.proportions ?? null);
      setShowCelebration(true);

      // DB 저장 (실패해도 분석 결과는 표시)
      if (user?.id) {
        saveBodyResult(supabase, user.id, analysisResult, imageUri);
      }
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'body-result',
        tags: { module: 'C-1', action: 'analyze' },
      });
      setBodyType(null);
    } finally {
      setIsLoading(false);
    }
  }, [height, weight, imageUri, imageBase64]);

  useEffect(() => {
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

  if (!bodyType || bmi === null) {
    return (
      <AnalysisErrorState
        message="분석에 실패했어요. 다시 시도해 주세요."
        onRetry={() => router.replace('/(analysis)/body')}
        onGoHome={() => router.replace('/(tabs)')}
        testID="body-analysis-error"
      />
    );
  }

  const typeData = BODY_TYPE_DATA[bodyType];

  // BMI 바 값 (0-40 범위를 0-100으로 정규화)
  const bmiNormalized = Math.min(100, Math.round((bmi / 40) * 100));

  // 체형 비율 BarChart 데이터 (비율을 100분율 시각화)
  const barData: BarDataItem[] = proportions
    ? [
        {
          label: '어깨/엉덩이',
          value: Math.round(proportions.shoulderHipRatio * 100),
          maxValue: 150,
        },
        {
          label: '허리/엉덩이',
          value: Math.round(proportions.waistHipRatio * 100),
          maxValue: 150,
        },
      ]
    : [];

  // --- 헤더 콘텐츠 ---
  const headerContent = (
    <View style={localStyles.headerContent}>
      <AIBadge variant="small" />
      <Text style={[localStyles.typeName, { color: accent.base }]}>{typeData.name}</Text>
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

  // 결론 액션(ADR-111 표현 원칙 1) — 기존 결과 데이터에서 규칙 조립 (새 fetch/AI 없음)
  const topActions = buildBodyTopActions({
    recommendations: typeData.recommendations,
    avoidItems: typeData.avoidItems,
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
            {typeData.description}
          </Text>
        </GradientCard>
      </Animated.View>

      {/* ③ BMI + 운동 팁 — 접기 (정보 삭제 아님, 접기만) */}
      <ProgressiveDisclosure
        expandLabel="BMI·운동 팁 자세히 보기"
        collapseLabel="접기"
        summary={
          <Text style={[localStyles.discloseSummary, { color: colors.mutedForeground }]}>
            BMI {bmi.toFixed(1)} (참고 수치) · 운동 팁 {typeData.exerciseTips.length}개
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
            <View>
              <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>운동 팁</Text>
              <GradientCard variant="body" style={localStyles.tipsCard}>
                {typeData.exerciseTips.map((tip, index) => (
                  <View key={index} style={localStyles.tipItem}>
                    <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
                    <Text style={[localStyles.tipText, { color: colors.foreground }]}>{tip}</Text>
                  </View>
                ))}
              </GradientCard>
            </View>
          </View>
        }
      />
    </View>
  );

  // --- 상세 탭 ---
  const detailTab = (
    <View style={localStyles.tabContent}>
      {/* 체형 비율 차트 */}
      {barData.length > 0 && (
        <Animated.View
          entering={FadeInUp.duration(TIMING.normal)}
          style={localStyles.chartContainer}
        >
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            체형 비율 분석
          </Text>
          <BarChart data={barData} animated barColor={accent.base} />
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
  const stylingBodyType: StylingBodyType | null = bodyType ? BODY_TYPE_TO_STYLING[bodyType] : null;
  const recommendTab = stylingBodyType ? (
    <View style={localStyles.tabContent}>
      {/* 섹션 1: 스타일링 원칙 (장기 기준, 쇼핑 시 판단 기준) */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <StylingPrinciplesCard bodyType={stylingBodyType} bodyTypeLabel={typeData.name} />
      </Animated.View>

      {/* 섹션 2: 추천 코디 3세트 (단기 실행, 오늘 따라 입기) */}
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <OutfitExamplesCard bodyType={stylingBodyType} personalColorSeason={null} />
      </Animated.View>

      {/* 섹션 3: 옷장 조합 CTA (무료 경로, Phase 1.5) */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <ClosetPromptCard />
      </Animated.View>
    </View>
  ) : null;

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
        trustBadgeType={usedFallback ? 'fallback' : 'ai'}
        usedFallback={usedFallback}
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
  chartContainer: {
    alignItems: 'center',
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
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.circle,
  },
  tagText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
});
