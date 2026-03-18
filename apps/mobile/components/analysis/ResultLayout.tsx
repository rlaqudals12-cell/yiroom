/**
 * ResultLayout — 모든 분석 결과 화면의 공통 레이아웃 셸
 *
 * 구조:
 *  GradientHeader (모듈별 accent + 이미지 + 핵심 점수/타입)
 *  └── AnalysisTrustBadge + GradeDisplay
 *  TabView (3탭: 요약 / 상세 / 추천)
 *  NextAnalysisCard (다음 분석 추천)
 *  ExpertCTA (전문가 상담 카드)
 *  AnalysisResultButtons (하단 액션)
 *
 * D2-2: GradeDisplay 통합, 그라디언트 깊이 강화, 전문가 CTA 추가
 * D3: 적응형 애니메이션 + 다음 분석 추천 카드 추가
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, type ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Pressable,
  type ImageStyle,
} from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TIMING, useAdaptiveAnimation } from '@/lib/animations';
import { useTheme, typography, radii, borderGlow, spacing, trustColors } from '@/lib/theme';
import { brand, moduleColors } from '@/lib/theme/tokens';

import { AnalysisResultButtons } from './AnalysisResultButtons';
import { AnalysisTrustBadge, type TrustBadgeType } from './AnalysisTrustBadge';
import { GradeDisplay } from './GradeDisplay';
import { AITransparencyNotice } from '../common/AITransparencyNotice';
import { MockDataNotice } from '../common/MockDataNotice';
import { GradientCard } from '../ui/GradientCard';
import { GradientText, type GradientTextVariant } from '../ui/GradientText';
import { TabView, type TabItem } from '../ui/TabView';

/** 모듈 키에 따른 악센트 색상 가져오기 */
type ModuleKey = keyof typeof moduleColors;

/** GradientCard variant 매핑 (moduleKey → GradientCard variant) */
const MODULE_TO_VARIANT: Record<string, string> = {
  skin: 'skin',
  body: 'body',
  personalColor: 'personalColor',
  hair: 'hair',
  makeup: 'makeup',
  posture: 'posture',
  oralHealth: 'oralHealth',
  face: 'face',
  workout: 'workout',
  nutrition: 'nutrition',
};

/** GradientText variant 매핑 (moduleKey → GradientText variant) */
const MODULE_TO_GRADIENT_TEXT: Record<string, GradientTextVariant> = {
  skin: 'skin',
  body: 'body',
  personalColor: 'personalColor',
  hair: 'hair',
  makeup: 'makeup',
  posture: 'brand',
  oralHealth: 'oralHealth',
  workout: 'workout',
  nutrition: 'nutrition',
};

/**
 * 분석 완료 후 다음 행동 안내 매핑
 * 도메인별로 다음 추천 분석 모듈과 CTA 메시지를 정의
 */
const NEXT_ACTION_MAP: Record<
  string,
  { message: string; nextModule: string; emoji: string; route: string }
> = {
  personalColor: {
    message: '컬러에 맞는 메이크업을 찾아볼까요?',
    nextModule: '피부 분석도 해보세요!',
    emoji: '💧',
    route: '/(analysis)/skin',
  },
  skin: {
    message: '피부에 맞는 스킨케어 루틴을 확인해요',
    nextModule: '체형 분석도 추천해요!',
    emoji: '✨',
    route: '/(analysis)/body',
  },
  body: {
    message: '체형에 맞는 스타일을 찾아볼까요?',
    nextModule: '헤어 분석도 해보세요!',
    emoji: '💇',
    route: '/(analysis)/hair',
  },
  hair: {
    message: '헤어에 맞는 스타일링을 확인해요',
    nextModule: '메이크업 분석도 해보세요!',
    emoji: '💄',
    route: '/(analysis)/makeup',
  },
  makeup: {
    message: '메이크업 스타일을 완성했어요',
    nextModule: '퍼스널컬러 분석으로 시작해보세요!',
    emoji: '🎨',
    route: '/(analysis)/personal-color',
  },
  posture: {
    message: '자세 교정 루틴을 확인해요',
    nextModule: '체형 분석도 해보세요!',
    emoji: '✨',
    route: '/(analysis)/body',
  },
  oralHealth: {
    message: '구강 건강 관리 루틴을 확인해요',
    nextModule: '피부 분석도 해보세요!',
    emoji: '💧',
    route: '/(analysis)/skin',
  },
};

export interface ResultLayoutProps {
  /** 모듈 키 (moduleColors에서 accent 결정) */
  moduleKey: ModuleKey;
  /** 결과 화면 제목 (헤더 표시) */
  title: string;
  /** 분석한 이미지 URI */
  imageUri?: string;
  /** 이미지 스타일 (원형, 직사각형 등 모듈별 다름) */
  imageStyle?: ImageStyle;
  /** 헤더 중앙 콘텐츠 — 점수, 타입 배지 등 */
  headerContent?: ReactNode;
  /** 신뢰도 배지 타입 */
  trustBadgeType: TrustBadgeType;
  /** AI 신뢰도 (0-1) */
  confidence?: number;
  /** Mock 데이터 사용 여부 */
  usedFallback?: boolean;
  /** GradeDisplay 표시 여부 (기본 true — confidence > 0일 때만 렌더) */
  showGrade?: boolean;
  /** 3탭 콘텐츠 */
  summaryTab: ReactNode;
  detailTab: ReactNode;
  recommendTab: ReactNode;
  /** 주 액션 버튼 텍스트 */
  primaryActionText: string;
  /** 주 액션 핸들러 */
  onPrimaryAction: () => void;
  /** 재분석 경로 (router.replace) */
  retryPath: string;
  /** 테스트 ID */
  testID?: string;
}

export function ResultLayout({
  moduleKey,
  title,
  imageUri,
  imageStyle,
  headerContent,
  trustBadgeType,
  confidence,
  usedFallback,
  showGrade = true,
  summaryTab,
  detailTab,
  recommendTab,
  primaryActionText,
  onPrimaryAction,
  retryPath,
  testID = 'analysis-result-layout',
}: ResultLayoutProps): React.JSX.Element {
  const { colors, isDark, spacing, radii, typography, brand } = useTheme();
  const accent = moduleColors[moduleKey];

  // 접근성: 동작 줄이기 설정 시 entering 애니메이션 생략
  const { shouldAnimate } = useAdaptiveAnimation();

  // 다음 분석 추천 데이터
  const nextAction = NEXT_ACTION_MAP[moduleKey];

  // 강화된 그라디언트: 2단계 (모듈 accent → brand accent → 투명)
  const gradientColors: readonly [string, string, string] = isDark
    ? [`${accent.dark}50`, `${accent.dark}20`, 'transparent']
    : [`${accent.light}70`, `${accent.light}30`, 'transparent'];

  // GradeDisplay에 사용할 신뢰도 퍼센트 (0-1 → 0-100)
  const confidencePercent = confidence !== undefined ? Math.round(confidence * 100) : undefined;

  // GradientCard variant 매핑
  const cardVariant = (MODULE_TO_VARIANT[moduleKey] ||
    'brand') as import('../ui/GradientCard').GradientCardVariant;

  const handleGoHome = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  const handleRetry = useCallback(() => {
    router.replace(retryPath as never);
  }, [retryPath]);

  const handleExpertCta = useCallback(() => {
    router.push('/(coach)');
  }, []);

  const handleNextAnalysis = useCallback(() => {
    if (nextAction) {
      router.push(nextAction.route as never);
    }
  }, [nextAction]);

  // 3탭 구성
  const tabs: TabItem[] = [
    { key: 'summary', title: '요약', content: summaryTab },
    { key: 'detail', title: '상세', content: detailTab },
    { key: 'recommend', title: '추천', content: recommendTab },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      testID={testID}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 강화된 그라디언트 헤더 (더 깊은 모듈 악센트) */}
        {/* 높은 신뢰도(>80%)에 borderGlow 강조 */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.header, confidence !== undefined && confidence > 0.8 && borderGlow.pink]}
        >
          {/* 제목 — 모듈별 그래디언트 텍스트 */}
          <Animated.View entering={shouldAnimate ? FadeIn.duration(TIMING.normal) : undefined}>
            <GradientText
              variant={MODULE_TO_GRADIENT_TEXT[moduleKey] ?? 'brand'}
              fontSize={22}
              fontWeight={typography.weight.bold}
            >
              {title}
            </GradientText>
          </Animated.View>

          {/* 신뢰도 배지 */}
          <Animated.View entering={shouldAnimate ? FadeIn.delay(100).duration(TIMING.normal) : undefined}>
            <AnalysisTrustBadge type={trustBadgeType} confidence={confidence} />
          </Animated.View>

          {/* Mock 경고 — MockDataNotice 컴포넌트 (AI 투명성) */}
          {usedFallback && (
            <Animated.View
              entering={shouldAnimate ? FadeIn.delay(200).duration(TIMING.normal) : undefined}
              style={styles.fallbackContainer}
            >
              <MockDataNotice compact />
            </Animated.View>
          )}

          {/* 이미지 */}
          {imageUri && (
            <Animated.View
              entering={shouldAnimate ? FadeInUp.delay(150).duration(TIMING.slow) : undefined}
              style={styles.imageContainer}
            >
              <Image
                source={{ uri: imageUri }}
                style={[styles.defaultImage, { borderColor: accent.base }, imageStyle]}
                resizeMode="cover"
              />
            </Animated.View>
          )}

          {/* 헤더 콘텐츠 (점수, 타입 배지 등) */}
          {headerContent && (
            <Animated.View entering={shouldAnimate ? FadeInUp.delay(300).duration(TIMING.slow) : undefined}>
              {headerContent}
            </Animated.View>
          )}

          {/* GradeDisplay — 신뢰도 시각화 (confidence 있을 때만) */}
          {showGrade && confidencePercent !== undefined && confidencePercent > 0 && (
            <Animated.View
              entering={shouldAnimate ? FadeInUp.delay(400).duration(TIMING.slow) : undefined}
              style={styles.gradeContainer}
            >
              <GradeDisplay confidence={confidencePercent} testID={`${testID}-grade`} />
            </Animated.View>
          )}
        </LinearGradient>

        {/* 3탭 뷰 */}
        <View style={styles.tabContainer}>
          <TabView
            tabs={tabs}
            tabBarStyle={{ ...styles.tabBar, backgroundColor: colors.card }}
            testID={`${testID}-tabs`}
          />
        </View>

        {/* AI 기술 사용 안내 (AI 기본법 제31조 준수) */}
        <Animated.View
          entering={shouldAnimate ? FadeInUp.delay(150).duration(TIMING.normal) : undefined}
          style={styles.transparencyContainer}
        >
          <AITransparencyNotice compact />
        </Animated.View>

        {/* 다음 분석 추천 카드 */}
        {nextAction && (
          <Animated.View
            entering={shouldAnimate ? FadeInUp.delay(180).duration(TIMING.normal) : undefined}
            style={styles.nextAnalysisContainer}
          >
            <GradientCard
              variant={cardVariant}
              testID={`${testID}-next-analysis`}
            >
              <Pressable
                onPress={handleNextAnalysis}
                style={styles.nextAnalysisContent}
                accessibilityRole="button"
                accessibilityLabel={nextAction.nextModule}
                accessibilityHint="다음 분석 모듈로 이동해요"
              >
                <View style={[styles.nextAnalysisIcon, { backgroundColor: `${accent.base}20` }]}>
                  <Text style={{ fontSize: 22 }}>{nextAction.emoji}</Text>
                </View>
                <View style={styles.nextAnalysisTextArea}>
                  <Text
                    style={[
                      styles.nextAnalysisTitle,
                      { color: colors.foreground, fontSize: typography.size.base },
                    ]}
                  >
                    {nextAction.nextModule}
                  </Text>
                  <Text
                    style={[
                      styles.nextAnalysisSubtitle,
                      { color: colors.mutedForeground, fontSize: typography.size.sm },
                    ]}
                  >
                    {nextAction.message}
                  </Text>
                </View>
                <Text style={[styles.nextAnalysisArrow, { color: accent.base }]}>→</Text>
              </Pressable>
            </GradientCard>
          </Animated.View>
        )}

        {/* 전문가 상담 CTA 카드 */}
        <Animated.View
          entering={shouldAnimate ? FadeInUp.delay(250).duration(TIMING.normal) : undefined}
          style={styles.ctaContainer}
        >
          <GradientCard
            variant={cardVariant}
            style={borderGlow.pink}
            testID={`${testID}-expert-cta`}
          >
            <View style={styles.ctaContent}>
              <View style={styles.ctaTextArea}>
                <Text
                  style={[
                    styles.ctaTitle,
                    { color: colors.foreground, fontSize: typography.size.base },
                  ]}
                >
                  더 자세한 분석이 궁금하다면?
                </Text>
                <Text
                  style={[
                    styles.ctaSubtitle,
                    { color: colors.mutedForeground, fontSize: typography.size.sm },
                  ]}
                >
                  AI 웰니스 코치와 1:1 상담을 받아보세요
                </Text>
              </View>
              <Pressable
                onPress={handleExpertCta}
                style={[styles.ctaButton, { backgroundColor: accent.base, borderRadius: radii.xl }]}
                testID={`${testID}-expert-cta-button`}
              >
                <Text
                  style={[
                    styles.ctaButtonText,
                    { fontSize: typography.size.sm, color: brand.primaryForeground },
                  ]}
                >
                  상담하기
                </Text>
              </Pressable>
            </View>
          </GradientCard>
        </Animated.View>

        {/* 하단 버튼 */}
        <View style={styles.buttonsContainer}>
          <AnalysisResultButtons
            primaryText={primaryActionText}
            onPrimaryPress={onPrimaryAction}
            onGoHome={handleGoHome}
            onRetry={handleRetry}
            testID={`${testID}-buttons`}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.mlg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: typography.weight.bold,
  },
  fallbackContainer: {
    alignSelf: 'stretch',
  },
  transparencyContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  imageContainer: {
    marginTop: spacing.sm,
  },
  defaultImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
  },
  gradeContainer: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tabContainer: {
    paddingHorizontal: spacing.md,
    minHeight: 300,
    marginTop: spacing.sm,
  },
  tabBar: {
    borderRadius: radii.xl,
    marginBottom: spacing.mlg,
  },
  nextAnalysisContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.mlg,
  },
  nextAnalysisContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smx,
  },
  nextAnalysisIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextAnalysisTextArea: {
    flex: 1,
    gap: spacing.xxs,
  },
  nextAnalysisTitle: {
    fontWeight: typography.weight.semibold,
  },
  nextAnalysisSubtitle: {
    lineHeight: 20,
  },
  nextAnalysisArrow: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
  },
  ctaContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smx,
  },
  ctaTextArea: {
    flex: 1,
    gap: spacing.xs,
  },
  ctaTitle: {
    fontWeight: typography.weight.semibold,
  },
  ctaSubtitle: {
    lineHeight: 20,
  },
  ctaButton: {
    paddingHorizontal: spacing.mlg,
    paddingVertical: spacing.smx,
  },
  ctaButtonText: {
    fontWeight: typography.weight.semibold,
  },
  buttonsContainer: {
    paddingHorizontal: spacing.mlg,
    marginTop: spacing.md,
  },
});
