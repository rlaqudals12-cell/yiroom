/**
 * PC-1 퍼스널 컬러 진단 — 결과 화면 V2
 *
 * ResultLayout 기반 3탭 구성:
 *  요약: 시즌 타입 + 대표 컬러 팔레트 + 같은 타입 연예인
 *  상세: 웜/쿨 분석 + 피해야 할 색상
 *  추천: 스타일링 팁 + 메이크업 포인트
 */
import type { PersonalColorSeason } from '@yiroom/shared';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  AnalysisLoadingState,
  AnalysisErrorState,
  ResultLayout,
  ColorPalette,
  MetricBar,
  DrapingPreview,
  useAnalysisStyles,
} from '@/components/analysis';
import { GradientCard, CelebrationEffect, BadgeDrop } from '@/components/ui';
import {
  analyzePersonalColor as analyzeWithGemini,
  imageToBase64,
  type PersonalColorAnalysisResult,
} from '@/lib/gemini';
import { useUser } from '@clerk/clerk-expo';

import { AIBadge } from '@/components/common/AIBadge';
import { savePersonalColorResult } from '@/lib/analysis';
import { captureError } from '@/lib/monitoring/sentry';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useTheme, typography, spacing } from '@/lib/theme';
import { TIMING } from '@/lib/animations';

// --- 정적 데이터 ---

interface SeasonInfo {
  name: string;
  subType: string;
  tone: 'warm' | 'cool';
  description: string;
  bestColors: string[];
  worstColors: string[];
  celebrities: string[];
  stylingTips: string[];
}

const SEASON_DATA: Record<PersonalColorSeason, SeasonInfo> = {
  Spring: {
    name: '봄 웜톤',
    subType: '밝고 화사한 웜 언더톤',
    tone: 'warm',
    description:
      '밝고 화사한 색상이 잘 어울리는 타입이에요. 코랄, 피치, 아이보리 등 따뜻하고 맑은 색상이 피부를 환하게 밝혀줘요.',
    bestColors: ['#FFB6C1', '#FFDAB9', '#FFA07A', '#F0E68C', '#98FB98', '#FFD700'],
    worstColors: ['#000000', '#808080', '#4B0082', '#191970'],
    celebrities: ['아이유', '수지', '윤아'],
    stylingTips: [
      '코랄 립과 피치 블러셔로 생기 있는 메이크업을 해보세요',
      '골드 주얼리가 피부톤을 더 따뜻하게 해줘요',
      '크림화이트, 아이보리 같은 웜한 밝은 색상이 최적이에요',
    ],
  },
  Summer: {
    name: '여름 쿨톤',
    subType: '부드럽고 우아한 쿨 언더톤',
    tone: 'cool',
    description:
      '부드럽고 차분한 색상이 잘 어울리는 타입이에요. 라벤더, 로즈핑크, 스카이블루 등 시원하고 우아한 색상을 추천드려요.',
    bestColors: ['#E6E6FA', '#DDA0DD', '#B0C4DE', '#87CEEB', '#FFC0CB', '#C8A2C8'],
    worstColors: ['#FF4500', '#FF8C00', '#DAA520', '#8B4513'],
    celebrities: ['블랙핑크 제니', '김태희', '손예진'],
    stylingTips: [
      '로즈핑크 립과 라벤더 아이섀도가 피부를 맑게 해줘요',
      '실버 주얼리가 쿨톤 피부와 자연스럽게 어울려요',
      '파스텔 블루, 라일락 같은 차분한 색상으로 우아함을 연출하세요',
    ],
  },
  Autumn: {
    name: '가을 웜톤',
    subType: '깊고 풍부한 웜 언더톤',
    tone: 'warm',
    description:
      '깊고 풍부한 색상이 잘 어울리는 타입이에요. 버건디, 머스타드, 카키 등 차분하고 고급스러운 색상을 추천드려요.',
    bestColors: ['#8B4513', '#DAA520', '#BC8F8F', '#CD853F', '#556B2F', '#A0522D'],
    worstColors: ['#FF69B4', '#00BFFF', '#E6E6FA', '#F0FFFF'],
    celebrities: ['제니퍼 로페즈', '김희선', '공효진'],
    stylingTips: [
      '브릭레드 립과 테라코타 블러셔로 깊이감을 더하세요',
      '골드, 브론즈 주얼리가 가을 웜톤과 완벽한 조화를 이뤄요',
      '카키, 올리브, 버건디 등 깊은 색상으로 고급스러움을 연출하세요',
    ],
  },
  Winter: {
    name: '겨울 쿨톤',
    subType: '선명하고 강렬한 쿨 언더톤',
    tone: 'cool',
    description:
      '선명하고 대비가 강한 색상이 잘 어울리는 타입이에요. 블랙, 화이트, 로열블루 등 강렬하고 세련된 색상을 추천드려요.',
    bestColors: ['#000000', '#FFFFFF', '#4169E1', '#DC143C', '#800080', '#008B8B'],
    worstColors: ['#FFDAB9', '#F5DEB3', '#FFE4C4', '#DEB887'],
    celebrities: ['김연아', '전지현', '송혜교'],
    stylingTips: [
      '레드, 베리 립으로 선명한 인상을 만들어보세요',
      '실버, 플래티넘 주얼리가 겨울 쿨톤의 세련됨을 강조해요',
      '블랙, 네이비, 화이트 같은 고대비 조합이 가장 잘 어울려요',
    ],
  },
};

// --- 메인 컴포넌트 ---

export default function PersonalColorResultScreen(): React.JSX.Element {
  const { module } = useAnalysisStyles();
  const { colors, typography } = useTheme();
  const accent = module.personalColor;
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const { imageUri, imageBase64, answers } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
    answers: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<PersonalColorAnalysisResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const analyzePersonalColor = useCallback(async () => {
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

      const parsedAnswers: Record<number, string> = JSON.parse(answers || '{}');
      const response = await analyzeWithGemini(base64Data, parsedAnswers);

      setUsedFallback(response.usedFallback);
      setResult(response.result);
      setShowCelebration(true);

      // DB 저장 (실패해도 분석 결과는 표시)
      if (user?.id) {
        savePersonalColorResult(supabase, user.id, response.result, parsedAnswers, imageUri);
      }
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'personal-color-result',
        tags: { module: 'PC-1', action: 'analyze' },
      });
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [imageUri, imageBase64, answers]);

  useEffect(() => {
    analyzePersonalColor();
  }, [analyzePersonalColor]);

  const handleProductRecommendation = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        message="분석에 실패했어요."
        onRetry={() => router.replace('/(analysis)/personal-color')}
        onGoHome={() => router.replace('/(tabs)')}
        testID="personal-color-error"
      />
    );
  }

  const season = SEASON_DATA[result.season];

  // 웜/쿨 분석 점수 (confidence 기반)
  const warmScore =
    season.tone === 'warm'
      ? Math.round(result.confidence * 100)
      : Math.round((1 - result.confidence) * 100);
  const coolScore = 100 - warmScore;

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
      badge={{ icon: '🎨', name: '컬러 전문가', description: '퍼스널 컬러 진단 완료!' }}
      visible={showBadge}
      onDismiss={() => setShowBadge(false)}
    />
    <ResultLayout
      moduleKey="personalColor"
      title="퍼스널 컬러 진단"
      imageUri={imageUri}
      imageStyle={localStyles.resultImage}
      trustBadgeType={usedFallback ? 'questionnaire' : 'ai'}
      confidence={usedFallback ? undefined : result.confidence}
      usedFallback={usedFallback}
      headerContent={
        <>
          <AIBadge variant="small" />
          <HeaderContent
            seasonName={season.name}
            subType={season.subType}
            accentColor={accent.base}
            description={result.description || season.description}
            textColor={colors.mutedForeground}
          />
        </>
      }
      summaryTab={
        <SummaryTab season={season} accent={accent} colors={colors} />
      }
      detailTab={
        <DetailTab
          warmScore={warmScore}
          coolScore={coolScore}
          season={season}
          accent={accent}
          colors={colors}
        />
      }
      recommendTab={
        <RecommendTab season={season} accent={accent} colors={colors} imageUri={imageUri} />
      }
      primaryActionText="💄 내 색상에 맞는 제품"
      onPrimaryAction={handleProductRecommendation}
      retryPath="/(analysis)/personal-color"
      testID="analysis-personal-color-result-screen"
    />
    </>
  );
}

// --- 서브 컴포넌트 ---

function HeaderContent({
  seasonName,
  subType,
  accentColor,
  description,
  textColor,
}: {
  seasonName: string;
  subType: string;
  accentColor: string;
  description: string;
  textColor: string;
}): React.JSX.Element {
  return (
    <View style={localStyles.headerContent}>
      <Text style={[localStyles.seasonName, { color: accentColor }]}>{seasonName}</Text>
      <Text style={[localStyles.subType, { color: textColor }]}>{subType}</Text>
      <Text style={[localStyles.description, { color: textColor }]}>{description}</Text>
    </View>
  );
}

interface TabProps {
  season: SeasonInfo;
  accent: { base: string; light: string; dark: string };
  colors: ReturnType<typeof useTheme>['colors'];
}

/** 요약 탭: 대표 팔레트 + 같은 타입 연예인 */
function SummaryTab({ season, accent, colors }: TabProps): React.JSX.Element {
  const { isDark } = useTheme();
  const bestColorItems = season.bestColors.map((hex, i) => ({
    color: hex,
    name: `Color ${i + 1}`,
  }));

  return (
    <View style={localStyles.tabContent}>
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <GradientCard variant="personalColor" style={localStyles.sectionCard}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            추천 컬러 팔레트
          </Text>
          <ColorPalette colors={bestColorItems} columns={3} animated testID="pc-best-colors" />
        </GradientCard>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <GradientCard variant="personalColor" style={localStyles.sectionCard}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            같은 타입의 연예인
          </Text>
          <View style={localStyles.tagRow}>
            {season.celebrities.map((name, i) => (
              <View
                key={i}
                style={[
                  localStyles.tag,
                  { backgroundColor: isDark ? `${accent.dark}20` : `${accent.light}30` },
                ]}
              >
                <Text style={[localStyles.tagText, { color: accent.base }]}>{name}</Text>
              </View>
            ))}
          </View>
        </GradientCard>
      </Animated.View>
    </View>
  );
}

/** 상세 탭: 웜/쿨 분석 + 피해야 할 색상 */
function DetailTab({
  warmScore,
  coolScore,
  season,
  colors,
}: TabProps & { warmScore: number; coolScore: number }): React.JSX.Element {
  const worstColorItems = season.worstColors.map((hex, i) => ({
    color: hex,
    name: `Avoid ${i + 1}`,
  }));

  return (
    <View style={localStyles.tabContent}>
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <GradientCard variant="personalColor" style={localStyles.sectionCard}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            웜톤/쿨톤 분석
          </Text>
          <View style={localStyles.metricsContainer}>
            <MetricBar label="웜톤 (Warm)" value={warmScore} testID="pc-warm-score" />
            <MetricBar label="쿨톤 (Cool)" value={coolScore} testID="pc-cool-score" />
          </View>
        </GradientCard>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <GradientCard variant="personalColor" style={localStyles.sectionCard}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            피해야 할 색상
          </Text>
          <Text style={[localStyles.sectionDescription, { color: colors.mutedForeground }]}>
            다음 색상은 피부 톤을 칙칙하게 보이게 할 수 있어요
          </Text>
          <ColorPalette colors={worstColorItems} columns={4} animated testID="pc-worst-colors" />
        </GradientCard>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(TIMING.normal)}>
        <GradientCard variant="personalColor" style={localStyles.sectionCard}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            {season.tone === 'warm' ? '웜톤이란?' : '쿨톤이란?'}
          </Text>
          <Text style={[localStyles.sectionDescription, { color: colors.mutedForeground }]}>
            {season.tone === 'warm'
              ? '피부 아래에 노란 기운이 도는 타입이에요. 금색 주얼리, 따뜻한 색조의 옷이 얼굴을 환하게 밝혀줘요.'
              : '피부 아래에 파란 기운이 도는 타입이에요. 은색 주얼리, 시원한 색조의 옷이 피부를 맑게 보이게 해줘요.'}
          </Text>
        </GradientCard>
      </Animated.View>
    </View>
  );
}

/** 추천 탭: 스타일링 팁 + 메이크업 포인트 */
function RecommendTab({ season, accent, colors, imageUri }: TabProps & { imageUri?: string }): React.JSX.Element {
  return (
    <View style={localStyles.tabContent}>
      {/* 드레이핑 프리뷰 — 내 사진에 색상 입혀보기 */}
      {imageUri && (
        <Animated.View entering={FadeInUp.delay(50).duration(TIMING.normal)}>
          <GradientCard variant="personalColor" style={localStyles.sectionCard}>
            <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
              이 색상 입혀보기
            </Text>
            <DrapingPreview
              imageUri={imageUri}
              palette={season.bestColors}
              seasonName={season.name}
              seasonDescription={`${season.tone === 'warm' ? '웜톤' : '쿨톤'} ${season.subType}`}
              testID="draping-preview"
            />
          </GradientCard>
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.delay(imageUri ? 150 : 100).duration(TIMING.normal)}>
        <GradientCard variant="personalColor" style={localStyles.sectionCard}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            맞춤 스타일링 팁
          </Text>
          {season.stylingTips.map((tip, i) => (
            <View key={i} style={localStyles.tipItem}>
              <View style={[localStyles.tipBullet, { backgroundColor: accent.base }]} />
              <Text style={[localStyles.tipText, { color: colors.mutedForeground }]}>{tip}</Text>
            </View>
          ))}
        </GradientCard>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(imageUri ? 250 : 200).duration(TIMING.normal)}>
        <GradientCard variant="personalColor" style={localStyles.sectionCard}>
          <Text style={[localStyles.sectionTitle, { color: colors.foreground }]}>
            메이크업 포인트
          </Text>
          <View style={localStyles.makeupGrid}>
            <MakeupTip
              label="립 컬러"
              value={season.tone === 'warm' ? '코랄, 피치 계열' : '로즈, 베리 계열'}
              accentColor={accent.base}
              subTextColor={colors.mutedForeground}
            />
            <MakeupTip
              label="아이섀도"
              value={season.tone === 'warm' ? '골드, 브론즈 계열' : '실버, 라벤더 계열'}
              accentColor={accent.base}
              subTextColor={colors.mutedForeground}
            />
            <MakeupTip
              label="블러셔"
              value={season.tone === 'warm' ? '피치, 살구 계열' : '핑크, 로즈 계열'}
              accentColor={accent.base}
              subTextColor={colors.mutedForeground}
            />
            <MakeupTip
              label="주얼리"
              value={season.tone === 'warm' ? '골드, 로즈골드' : '실버, 플래티넘'}
              accentColor={accent.base}
              subTextColor={colors.mutedForeground}
            />
          </View>
        </GradientCard>
      </Animated.View>
    </View>
  );
}

function MakeupTip({
  label,
  value,
  accentColor,
  subTextColor,
}: {
  label: string;
  value: string;
  accentColor: string;
  subTextColor: string;
}): React.JSX.Element {
  return (
    <View style={localStyles.makeupTipItem}>
      <Text style={[localStyles.makeupTipLabel, { color: accentColor }]}>{label}</Text>
      <Text style={[localStyles.makeupTipValue, { color: subTextColor }]}>{value}</Text>
    </View>
  );
}

// --- 스타일 ---

const localStyles = StyleSheet.create({
  resultImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
  },
  headerContent: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
  },
  seasonName: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
  },
  subType: {
    fontSize: typography.size.sm,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  tabContent: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionCard: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: typography.weight.semibold,
    marginBottom: 14,
  },
  sectionDescription: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginBottom: 14,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  tagText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  metricsContainer: {
    gap: 14,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: typography.size.sm,
    lineHeight: 22,
  },
  makeupGrid: {
    gap: 12,
  },
  makeupTipItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  makeupTipLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  makeupTipValue: {
    fontSize: typography.size.sm,
  },
});
