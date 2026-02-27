/**
 * CollapsibleHeader — 스크롤에 따라 축소되는 헤더
 *
 * Instagram/Spotify 패턴. 스크롤 시 확장 → 축소 전환.
 * Animated.ScrollView + interpolate로 부드러운 보간 처리.
 */
import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';

interface CollapsibleHeaderProps {
  /** 헤더 타이틀 */
  title: string;
  /** 확장 높이 (기본: 200) */
  expandedHeight?: number;
  /** 축소 높이 (기본: 60) */
  collapsedHeight?: number;
  /** 확장 영역에 표시할 콘텐츠 */
  children?: ReactNode;
  /** 스크롤 영역 콘텐츠 */
  scrollContent: ReactNode;
  /** 확장 영역 배경 (예: 이미지, 그라디언트) */
  renderBackground?: () => ReactNode;
  /** 테스트 ID */
  testID?: string;
  /** 스크롤 영역 추가 스타일 */
  scrollContentStyle?: ViewStyle;
}

export function CollapsibleHeader({
  title,
  expandedHeight = 200,
  collapsedHeight = 60,
  children,
  scrollContent,
  renderBackground,
  testID = 'collapsible-header',
  scrollContentStyle,
}: CollapsibleHeaderProps): React.JSX.Element {
  const { colors, spacing, typography, shadows } = useTheme();

  // 스크롤 오프셋 추적
  const scrollY = useSharedValue(0);
  const scrollRange = expandedHeight - collapsedHeight;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // 헤더 높이 애니메이션 (확장 → 축소)
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, scrollRange],
      [expandedHeight, collapsedHeight],
      Extrapolation.CLAMP
    );
    return { height };
  });

  // 확장 콘텐츠 페이드아웃
  const expandedContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, scrollRange * 0.6],
      [1, 0],
      Extrapolation.CLAMP
    );
    const translateYVal = interpolate(
      scrollY.value,
      [0, scrollRange],
      [0, -20],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY: translateYVal }],
    };
  });

  // 축소 상태 타이틀 페이드인
  const collapsedTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [scrollRange * 0.6, scrollRange],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // 배경 스케일 효과 (overscroll 시 약간 확대)
  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.3, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID={testID}>
      {/* 고정 헤더 영역 */}
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: colors.card, ...shadows.sm },
          headerAnimatedStyle,
        ]}
        testID={`${testID}-header`}
      >
        {/* 배경 레이어 */}
        {renderBackground && (
          <Animated.View style={[StyleSheet.absoluteFill, backgroundAnimatedStyle]}>
            {renderBackground()}
          </Animated.View>
        )}

        {/* 확장 콘텐츠 (스크롤 시 페이드아웃) */}
        <Animated.View
          style={[
            styles.expandedContent,
            {
              paddingHorizontal: spacing.md,
              paddingTop: spacing.md,
              paddingBottom: spacing.sm,
            },
            expandedContentStyle,
          ]}
          testID={`${testID}-expanded`}
        >
          <Text
            style={{
              fontSize: typography.size['2xl'],
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginBottom: spacing.sm,
            }}
            testID={`${testID}-title-expanded`}
          >
            {title}
          </Text>
          {children}
        </Animated.View>

        {/* 축소 상태 타이틀 (스크롤 시 페이드인) */}
        <Animated.View
          style={[
            styles.collapsedTitle,
            { height: collapsedHeight },
            collapsedTitleStyle,
          ]}
          testID={`${testID}-collapsed`}
        >
          <Text
            style={{
              fontSize: typography.size.lg,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
            }}
            testID={`${testID}-title-collapsed`}
          >
            {title}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* 스크롤 콘텐츠 */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            paddingTop: expandedHeight,
            paddingBottom: spacing.xxl,
          },
          scrollContentStyle,
        ]}
        testID={`${testID}-scroll`}
      >
        {scrollContent}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  expandedContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  collapsedTitle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
});
