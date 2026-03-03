/**
 * GlassCard 컴포넌트
 *
 * 웹의 Glass morphism (backdrop-blur + bg-white/60 + border-white/50) 패턴을
 * 네이티브로 구현. BlurView + 반투명 배경 + 미세 보더.
 *
 * @example
 * <GlassCard>
 *   <Text>Blurred background card</Text>
 * </GlassCard>
 *
 * <GlassCard shadowSize="xl" glowColor={moduleColors.skin.base}>
 *   <Text>Module-colored glow card</Text>
 * </GlassCard>
 */
import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

type GlassCardShadowSize = 'md' | 'lg' | 'xl';

interface GlassCardProps {
  children: ReactNode;
  /** blur 강도 (0-100). 기본 60 */
  intensity?: number;
  /** 그림자 크기 (기본 md). 웹 shadow-xl 등 매칭 */
  shadowSize?: GlassCardShadowSize;
  /** 모듈별 컬러 글로우 색상 (선택적, iOS만) */
  glowColor?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * shadowSize에 따른 그림자 스타일 반환 (glowColor 적용 시 컬러 글로우)
 */
function getShadowStyle(
  size: GlassCardShadowSize,
  shadows: ReturnType<typeof useTheme>['shadows'],
  glowColor?: string,
  isDark?: boolean,
): ViewStyle {
  if (isDark) return {};

  // 글로우 색상이 지정되면 iOS에서 컬러 쉐도우 적용
  if (glowColor && Platform.OS === 'ios') {
    const configs: Record<GlassCardShadowSize, { offset: number; opacity: number; radius: number }> = {
      md: { offset: 4, opacity: 0.12, radius: 12 },
      lg: { offset: 6, opacity: 0.15, radius: 20 },
      xl: { offset: 8, opacity: 0.18, radius: 28 },
    };
    const c = configs[size];
    return {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: c.offset },
      shadowOpacity: c.opacity,
      shadowRadius: c.radius,
    };
  }

  // 기본 그림자 (테마 토큰 사용)
  return shadows[size === 'xl' ? 'lg' : size];
}

export function GlassCard({
  children,
  intensity = 60,
  shadowSize = 'md',
  glowColor,
  style,
  testID,
}: GlassCardProps): React.JSX.Element {
  const { isDark, radii, shadows } = useTheme();

  const shadowStyle = getShadowStyle(shadowSize, shadows, glowColor, isDark);

  // Android에서 BlurView 성능 이슈 시 반투명 배경 폴백
  if (Platform.OS === 'android') {
    return (
      <View
        testID={testID}
        style={[
          styles.container,
          shadowStyle,
          {
            backgroundColor: isDark ? 'rgba(26,26,26,0.88)' : 'rgba(255,255,255,0.88)',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.40)',
            borderRadius: radii.xl,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        shadowStyle,
        {
          borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.40)',
          borderRadius: radii.xl,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      {/* 반투명 오버레이 (blur 위에 색상 틴트) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark ? 'rgba(26,26,26,0.25)' : 'rgba(255,255,255,0.35)',
          },
        ]}
      />
      {/* 실제 콘텐츠 */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  content: {
    // BlurView가 absoluteFill이므로 콘텐츠를 위에 렌더링
    zIndex: 1,
  },
});
