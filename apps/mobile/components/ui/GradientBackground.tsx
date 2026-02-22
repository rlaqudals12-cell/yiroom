/**
 * GradientBackground 컴포넌트
 *
 * 웹의 .bg-gradient-* 클래스를 네이티브로 구현.
 * LinearGradient 래퍼로 variant 하나만 지정하면 그라디언트 배경 적용.
 *
 * @example
 * <GradientBackground variant="brand" style={styles.header}>
 *   <Text>브랜드 그라디언트 헤더</Text>
 * </GradientBackground>
 */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

import { gradients, type GradientKey } from '../../lib/theme/gradients';

interface GradientBackgroundProps {
  /** 프리셋 그라디언트 키 */
  variant: GradientKey;
  children?: ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function GradientBackground({
  variant,
  children,
  style,
  testID,
}: GradientBackgroundProps): React.JSX.Element {
  const config = gradients[variant];

  return (
    <LinearGradient
      colors={[...config.colors]}
      start={config.start}
      end={config.end}
      style={style}
      testID={testID}
    >
      {children}
    </LinearGradient>
  );
}
