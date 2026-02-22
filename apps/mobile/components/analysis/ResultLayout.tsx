/**
 * ResultLayout — 모든 분석 결과 화면의 공통 레이아웃 셸
 *
 * 구조:
 *  GradientHeader (모듈별 accent + 이미지 + 핵심 점수/타입)
 *  └── AnalysisTrustBadge
 *  TabView (3탭: 요약 / 상세 / 추천)
 *  AnalysisResultButtons (하단 액션)
 *
 * 각 분석 모듈은 ResultLayout에 탭 콘텐츠만 주입하여 사용.
 */
import { useCallback, type ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  type ImageStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useTheme } from '@/lib/theme';
import { brand, moduleColors } from '@/lib/theme/tokens';
import { TIMING } from '@/lib/animations';
import { TabView, type TabItem } from '../ui/TabView';
import { AnalysisTrustBadge, type TrustBadgeType } from './AnalysisTrustBadge';
import { AnalysisResultButtons } from './AnalysisResultButtons';

/** 모듈 키에 따른 악센트 색상 가져오기 */
type ModuleKey = keyof typeof moduleColors;

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
  summaryTab,
  detailTab,
  recommendTab,
  primaryActionText,
  onPrimaryAction,
  retryPath,
  testID = 'analysis-result-layout',
}: ResultLayoutProps): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const accent = moduleColors[moduleKey];

  // 그라디언트 색상: 모듈별 accent → 투명
  const gradientColors: readonly [string, string] = isDark
    ? [`${accent.dark}40`, 'transparent']
    : [`${accent.light}60`, 'transparent'];

  const handleGoHome = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  const handleRetry = useCallback(() => {
    router.replace(retryPath as never);
  }, [retryPath]);

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
        {/* 그라디언트 헤더 */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.header}
        >
          {/* 제목 */}
          <Animated.Text
            entering={FadeIn.duration(TIMING.normal)}
            style={[styles.title, { color: colors.foreground }]}
          >
            {title}
          </Animated.Text>

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
        </LinearGradient>

        {/* 3탭 뷰 */}
        <View style={styles.tabContainer}>
          <TabView
            tabs={tabs}
            tabBarStyle={{ ...styles.tabBar, backgroundColor: colors.card }}
            testID={`${testID}-tabs`}
          />
        </View>

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
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  fallbackBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  fallbackText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  imageContainer: {
    marginTop: 4,
  },
  defaultImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
  },
  tabContainer: {
    paddingHorizontal: 16,
    minHeight: 300,
  },
  tabBar: {
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
});
