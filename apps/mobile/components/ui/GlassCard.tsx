/**
 * GlassCard 컴포넌트
 *
 * 웹의 Glass morphism (backdrop-blur + bg-white/80 + border-white/20) 패턴을
 * 네이티브로 구현. BlurView + 반투명 배경 + 미세 보더.
 *
 * @example
 * <GlassCard>
 *   <Text>Blurred background card</Text>
 * </GlassCard>
 */
import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

interface GlassCardProps {
  children: ReactNode;
  /** blur 강도 (0-100). 기본 40 */
  intensity?: number;
  style?: ViewStyle;
  testID?: string;
}

export function GlassCard({
  children,
  intensity = 40,
  style,
  testID,
}: GlassCardProps): React.JSX.Element {
  const { isDark, colors, radii, shadows } = useTheme();

  // Android에서 BlurView 성능 이슈 시 반투명 배경 폴백
  if (Platform.OS === 'android') {
    return (
      <View
        testID={testID}
        style={[
          styles.container,
          shadows.card,
          {
            backgroundColor: isDark ? 'rgba(26,26,26,0.85)' : 'rgba(255,255,255,0.85)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)',
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
        shadows.card,
        {
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)',
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
            backgroundColor: isDark ? 'rgba(26,26,26,0.3)' : 'rgba(255,255,255,0.4)',
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
