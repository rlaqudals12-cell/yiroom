/**
 * ResultLayout — 모든 분석 결과 화면의 공통 레이아웃 셸
 *
 * 구조:
 *  GradientHeader (모듈별 accent + 이미지 + 핵심 점수/타입)
 *  └── AnalysisTrustBadge + GradeDisplay
 *  TabView (3탭: 요약 / 상세 / 추천)
 *  ExpertCTA (전문가 상담 카드)
 *  AnalysisResultButtons (하단 액션)
 *
 * D2-2: GradeDisplay 통합, 그라디언트 깊이 강화, 전문가 CTA 추가
 */
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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useTheme, typography, radii, borderGlow, spacing } from '@/lib/theme';
import { brand, moduleColors } from '@/lib/theme/tokens';
import { TIMING } from '@/lib/animations';
import { TabView, type TabItem } from '../ui/TabView';
import { GradientCard } from '../ui/GradientCard';
import { GradientText, type GradientTextVariant } from '../ui/GradientText';
import { AnalysisTrustBadge, type TrustBadgeType } from './AnalysisTrustBadge';
import { AnalysisResultButtons } from './AnalysisResultButtons';
import { GradeDisplay } from './GradeDisplay';

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

  // 강화된 그라디언트: 2단계 (모듈 accent → brand accent → 투명)
  const gradientColors: readonly [string, string, string] = isDark
    ? [`${accent.dark}50`, `${accent.dark}20`, 'transparent']
    : [`${accent.light}70`, `${accent.light}30`, 'transparent'];

  // GradeDisplay에 사용할 신뢰도 퍼센트 (0-1 → 0-100)
  const confidencePercent =
    confidence !== undefined ? Math.round(confidence * 100) : undefined;

  // GradientCard variant 매핑
  const cardVariant = (MODULE_TO_VARIANT[moduleKey] || 'brand') as
    import('../ui/GradientCard').GradientCardVariant;

  const handleGoHome = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  const handleRetry = useCallback(() => {
    router.replace(retryPath as never);
  }, [retryPath]);

  const handleExpertCta = useCallback(() => {
    router.push('/(coach)');
  }, []);

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 강화된 그라디언트 헤더 (더 깊은 모듈 악센트) */}
        {/* 높은 신뢰도(>80%)에 borderGlow 강조 */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.header, confidence !== undefined && confidence > 0.8 && borderGlow.pink]}
        >
          {/* 제목 — 모듈별 그래디언트 텍스트 */}
          <Animated.View entering={FadeIn.duration(TIMING.normal)}>
            <GradientText
              variant={MODULE_TO_GRADIENT_TEXT[moduleKey] ?? 'brand'}
              fontSize={22}
              fontWeight={typography.weight.bold}
            >
              {title}
            </GradientText>
          </Animated.View>

          {/* 신뢰도 배지 */}
          <Animated.View entering={FadeIn.delay(100).duration(TIMING.normal)}>
            <AnalysisTrustBadge
              type={trustBadgeType}
              confidence={confidence}
            />
          </Animated.View>

          {/* Mock 경고 */}
          {usedFallback && (
            <Animated.View
              entering={FadeIn.delay(200).duration(TIMING.normal)}
              style={[styles.fallbackBanner, { backgroundColor: isDark ? '#78350F20' : '#FEF3C720' }]}
            >
              <Text style={[styles.fallbackText, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                AI 서비스 일시 제한으로 기본 분석 결과를 표시해요
              </Text>
            </Animated.View>
          )}

          {/* 이미지 */}
          {imageUri && (
            <Animated.View
              entering={FadeInUp.delay(150).duration(TIMING.slow)}
              style={styles.imageContainer}
            >
              <Image
                source={{ uri: imageUri }}
                style={[
                  styles.defaultImage,
                  { borderColor: accent.base },
                  imageStyle,
                ]}
                resizeMode="cover"
              />
            </Animated.View>
          )}

          {/* 헤더 콘텐츠 (점수, 타입 배지 등) */}
          {headerContent && (
            <Animated.View entering={FadeInUp.delay(300).duration(TIMING.slow)}>
              {headerContent}
            </Animated.View>
          )}

          {/* GradeDisplay — 신뢰도 시각화 (confidence 있을 때만) */}
          {showGrade && confidencePercent !== undefined && confidencePercent > 0 && (
            <Animated.View
              entering={FadeInUp.delay(400).duration(TIMING.slow)}
              style={styles.gradeContainer}
            >
              <GradeDisplay
                confidence={confidencePercent}
                testID={`${testID}-grade`}
              />
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

        {/* 전문가 상담 CTA 카드 */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(TIMING.normal)}
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
                style={[
                  styles.ctaButton,
                  { backgroundColor: accent.base, borderRadius: radii.lg },
                ]}
                testID={`${testID}-expert-cta-button`}
              >
                <Text style={[styles.ctaButtonText, { fontSize: typography.size.sm, color: brand.primaryForeground }]}>
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
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: 28,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: typography.weight.bold,
  },
  fallbackBanner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignSelf: 'stretch',
  },
  fallbackText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  imageContainer: {
    marginTop: spacing.xs,
  },
  defaultImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
  },
  gradeContainer: {
    alignSelf: 'stretch',
    marginTop: spacing.xs,
  },
  tabContainer: {
    paddingHorizontal: spacing.md,
    minHeight: 300,
  },
  tabBar: {
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  ctaContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  ctaButtonText: {
    fontWeight: typography.weight.semibold,
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    marginTop: spacing.sm,
  },
});
