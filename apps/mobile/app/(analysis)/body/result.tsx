/**
 * C-1 체형 분석 — 결과 V2
 *
 * ResultLayout 3탭 구조:
 *  요약: 체형 타입 + BMI 게이지 + 설명
 *  상세: 비율 BarChart + BMI 해석
 *  추천: 추천 스타일 + 피하면 좋은 스타일
 */
import type { BodyType } from '@yiroom/shared';
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
  useAnalysisStyles,
} from '@/components/analysis';
import { BarChart, type BarDataItem } from '@/components/charts';
import { GradientCard, CelebrationEffect, BadgeDrop } from '@/components/ui';
import {
  analyzeBody as analyzeWithGemini,
  imageToBase64,
  type BodyAnalysisResult,
} from '@/lib/gemini';
import { useUser } from '@clerk/clerk-expo';

import { AIBadge } from '@/components/common/AIBadge';
import { saveBodyResult } from '@/lib/analysis';
import { captureError } from '@/lib/monitoring/sentry';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { TIMING } from '@/lib/animations';
import { typography, radii , spacing } from '@/lib/theme';

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
    description:
      '어깨가 엉덩이보다 넓은 체형이에요. 하체에 볼륨을 주면 균형 잡힌 실루엣이 돼요.',
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
    description:
      '복부가 가장 넓은 체형이에요. 세로 라인을 강조하면 슬림해 보이는 효과가 있어요.',
    recommendations: ['세로 스트라이프', 'V넥', 'A라인', '하이웨이스트'],
    avoidItems: ['벨트 강조', '타이트한 복부', '가로 스트라이프'],
    exerciseTips: ['유산소 운동으로 체지방 감소', '플랭크로 코어 강화'],
  },
  Diamond: {
    name: '다이아몬드 체형',
    description:
      '허리가 넓고 어깨와 엉덩이가 좁은 체형이에요. 상하체 균형을 맞추면 좋아요.',
    recommendations: ['어깨 강조', '와이드 팬츠', 'A라인', '스트럭처드 재킷'],
    avoidItems: ['타이트한 허리', '벨트 강조', '펜슬 스커트'],
    exerciseTips: ['숄더 프레스로 어깨 라인 강조', '스쿼트로 하체 볼륨 키우기'],
  },
  Pear: {
    name: '배 체형',
    description:
      '하체가 상체보다 넓은 체형이에요. 상체를 강조하면 밸런스 있는 실루엣이 돼요.',
    recommendations: ['보트넥', '퍼프 소매', 'A라인 스커트', '부츠컷 팬츠'],
    avoidItems: ['스키니진', '밝은 색 하의', '힙 포켓 디테일'],
    exerciseTips: ['상체 근력 운동으로 밸런스 맞추기', '힙 스트레칭으로 라인 정리'],
  },
  Athletic: {
    name: '운동선수 체형',
    description:
      '탄탄하고 균형 잡힌 체형이에요. 다양한 스타일을 소화할 수 있는 장점이 있어요.',
    recommendations: ['핏된 옷', '스포티 룩', '캐주얼', '미니멀'],
    avoidItems: ['과도한 레이어링', '너무 루즈한 핏'],
    exerciseTips: ['현재 운동 루틴 유지', '유연성 운동 추가'],
  },
};

export default function BodyResultScreen() {
  const { module, colors, status, isDark } = useAnalysisStyles();
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

  const handleWorkoutRecommendation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(workout)/onboarding',
      params: { bodyType: bodyType || '', bmi: bmi?.toString() || '', fromAnalysis: 'body' },
    });
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

  // BMI 상태
  const getBmiStatus = (bmiVal: number) => {
    if (bmiVal < 18.5) return { label: '저체중', color: status.info };
    if (bmiVal < 23) return { label: '정상', color: status.success };
    if (bmiVal < 25) return { label: '과체중', color: status.warning };
    return { label: '비만', color: status.error };
  };
  const bmiStatus = getBmiStatus(bmi);

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
        <Text style={[localStyles.bmiNumber, { color: bmiStatus.color }]}>
          {bmi.toFixed(1)}
        </Text>
        <View style={[localStyles.bmiBadge, { backgroundColor: bmiStatus.color }]}>
          <Text style={[localStyles.bmiBadgeText, { color: colors.card }]}>{bmiStatus.label}</Text>
        </View>
      </View>
      <Text style={[localStyles.bodyInfo, { color: colors.mutedForeground }]}>
        키 {height}cm / 체중 {weight}kg
      </Text>
    </View>
  );

  // --- 요약 탭 ---
  const summaryTab = (
    <View style={localStyles.tabContent}>
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <GradientCard variant="body" style={localStyles.descCard}>
          <Text style={[localStyles.descText, { color: colors.foreground }]}>
            {typeData.description}
          </Text>
        </GradientCard>
      </Animated.View>

      {/* BMI 게이지 */}
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>BMI 지수</Text>
        <MetricBar label={`${bmi.toFixed(1)} (${bmiStatus.label})`} value={bmiNormalized} />
        <Text style={[localStyles.bmiGuide, { color: colors.mutedForeground }]}>
          정상 범위: 18.5 ~ 22.9
        </Text>
      </Animated.View>

      {/* 운동 팁 미리보기 */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>운동 팁</Text>
        <GradientCard variant="body" style={localStyles.tipsCard}>
          {typeData.exerciseTips.map((tip, index) => (
            <View key={index} style={localStyles.tipItem}>
              <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
              <Text style={[localStyles.tipText, { color: colors.foreground }]}>{tip}</Text>
            </View>
          ))}
        </GradientCard>
      </Animated.View>
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
            <Text style={[localStyles.bmiDetailLabel, { color: colors.mutedForeground }]}>
              키
            </Text>
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
            <Text style={[localStyles.bmiDetailLabel, { color: colors.mutedForeground }]}>
              BMI
            </Text>
            <Text style={[localStyles.bmiDetailValue, { color: bmiStatus.color }]}>
              {bmi.toFixed(1)} ({bmiStatus.label})
            </Text>
          </View>
        </GradientCard>
      </Animated.View>
    </View>
  );

  // --- 추천 탭 ---
  const recommendTab = (
    <View style={localStyles.tabContent}>
      {/* 추천 스타일 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>추천 스타일</Text>
        <View style={localStyles.tagContainer}>
          {typeData.recommendations.map((item, index) => (
            <View
              key={index}
              style={[localStyles.tag, { backgroundColor: status.success + (isDark ? '20' : '20') }]}
            >
              <Text style={[localStyles.tagText, { color: status.success }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* 피해야 할 스타일 */}
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
          피하면 좋은 스타일
        </Text>
        <View style={localStyles.tagContainer}>
          {typeData.avoidItems.map((item, index) => (
            <View
              key={index}
              style={[localStyles.tag, { backgroundColor: status.error + '20' }]}
            >
              <Text style={[localStyles.tagText, { color: status.error }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* 운동 추천 */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>체형별 운동</Text>
        <GradientCard variant="body" style={localStyles.tipsCard}>
          {typeData.exerciseTips.map((tip, index) => (
            <View key={index} style={localStyles.tipItem}>
              <Text style={[localStyles.tipBullet, { color: accent.base }]}>•</Text>
              <Text style={[localStyles.tipText, { color: colors.foreground }]}>{tip}</Text>
            </View>
          ))}
        </GradientCard>
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
      trustBadgeType={usedFallback ? 'fallback' : 'ai'}
      usedFallback={usedFallback}
      summaryTab={summaryTab}
      detailTab={detailTab}
      recommendTab={recommendTab}
      primaryActionText="🏃 나에게 맞는 운동 추천"
      onPrimaryAction={handleWorkoutRecommendation}
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
    fontWeight: '700',
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
    fontWeight: '700',
  },
  bmiBadge: {
    paddingHorizontal: spacing.smd,
    paddingVertical: 3,
    borderRadius: radii.lg,
  },
  bmiBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: '600',
  },
  bodyInfo: {
    fontSize: typography.size.sm,
  },
  bodyImage: {
    width: 120,
    height: 160,
    borderRadius: radii.smx,
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
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: '700',
    marginBottom: spacing.smx,
  },
  bmiGuide: {
    fontSize: typography.size.xs,
    marginTop: 6,
  },
  chartContainer: {
    alignItems: 'center',
  },
  bmiDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  bmiDetailLabel: {
    fontSize: typography.size.sm,
  },
  bmiDetailValue: {
    fontSize: typography.size.sm,
    fontWeight: '600',
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
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: radii.circle,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
