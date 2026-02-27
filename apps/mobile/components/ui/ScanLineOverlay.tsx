/**
 * ScanLineOverlay — 분석 로딩 스캔 라인
 *
 * 웹의 scan-line keyframe (top 0→100%, opacity 변화) 대응.
 * AI 분석 진행 중 이미지 위에 스캔 라인 애니메이션.
 *
 * @example
 * <View style={styles.imageContainer}>
 *   <Image source={{ uri }} style={styles.image} />
 *   <ScanLineOverlay active={isAnalyzing} />
 * </View>
 */
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface ScanLineOverlayProps {
  /** 스캔 활성화 여부 */
  active: boolean;
  /** 컨테이너 높이 (px). 기본 300 */
  height?: number;
  /** 스캔 라인 색상. 기본 핑크 (#F8C8DC) */
  color?: string;
  /** 테스트 ID */
  testID?: string;
}

export function ScanLineOverlay({
  active,
  height = 300,
  color = '#F8C8DC',
  testID,
}: ScanLineOverlayProps): React.JSX.Element | null {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (active && !reducedMotion) {
      translateY.value = 0;
      translateY.value = withRepeat(
        withTiming(height - SCAN_LINE_HEIGHT, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // 무한 반복
        true // reverse
      );
    } else {
      cancelAnimation(translateY);
      translateY.value = 0;
    }
    return () => cancelAnimation(translateY);
  }, [active, height, reducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!active) return null;

  return (
    <Animated.View
      testID={testID}
      style={[styles.container, { height }]}
      pointerEvents="none"
      accessibilityLabel="분석 진행 중"
    >
      <AnimatedLinearGradient
        colors={['transparent', `${color}60`, color, `${color}60`, 'transparent']}
        style={[styles.scanLine, animatedStyle]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </Animated.View>
  );
}

const SCAN_LINE_HEIGHT = 4;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCAN_LINE_HEIGHT,
  },
});
