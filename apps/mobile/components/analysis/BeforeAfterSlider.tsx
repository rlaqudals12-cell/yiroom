/**
 * BeforeAfterSlider — 분석 이전/이후 비교 슬라이더
 *
 * 수평 드래그로 두 이미지 비교. Gesture Handler + Reanimated.
 * useReducedMotion 시 나란히 표시.
 */
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';

import { useTheme , spacing } from '../../lib/theme';

interface BeforeAfterSliderProps {
  /** 이전(왼쪽) 이미지 URI */
  beforeUri: string;
  /** 이후(오른쪽) 이미지 URI */
  afterUri: string;
  /** 이전 라벨 */
  beforeLabel?: string;
  /** 이후 라벨 */
  afterLabel?: string;
  /** 슬라이더 높이 */
  height?: number;
  style?: import('react-native').ViewStyle;
  testID?: string;
}

export function BeforeAfterSlider({
  beforeUri,
  afterUri,
  beforeLabel = '이전',
  afterLabel = '이후',
  height = 280,
  style,
  testID = 'before-after-slider',
}: BeforeAfterSliderProps): React.JSX.Element {
  const { colors, brand, spacing, typography, radii } = useTheme();
  const reducedMotion = useReducedMotion();

  const [containerWidth, setContainerWidth] = useState(0);
  const sliderX = useSharedValue(0.5); // 0–1 비율

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const triggerHaptic = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (containerWidth <= 0) return;
      const newRatio = Math.max(0.05, Math.min(0.95, event.x / containerWidth));
      sliderX.value = newRatio;
    })
    .onStart(() => {
      runOnJS(triggerHaptic)();
    })
    .onEnd(() => {
      // 자석 효과: 50% 근처면 스냅
      if (Math.abs(sliderX.value - 0.5) < 0.03) {
        sliderX.value = withSpring(0.5, { damping: 15 });
      }
    });

  const beforeClipStyle = useAnimatedStyle(() => ({
    width: `${sliderX.value * 100}%` as unknown as number,
  }));

  const dividerStyle = useAnimatedStyle(() => ({
    left: `${sliderX.value * 100}%` as unknown as number,
  }));

  // 접근성: 모션 감소 시 나란히 표시
  if (reducedMotion) {
    return (
      <View testID={testID} style={[styles.sideBySide, style]}>
        <View style={styles.sideBySideHalf}>
          <Image source={{ uri: beforeUri }} style={{ height, borderRadius: radii.lg }} contentFit="cover" />
          <Text style={[styles.label, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>{beforeLabel}</Text>
        </View>
        <View style={styles.sideBySideHalf}>
          <Image source={{ uri: afterUri }} style={{ height, borderRadius: radii.lg }} contentFit="cover" />
          <Text style={[styles.label, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>{afterLabel}</Text>
        </View>
      </View>
    );
  }

  return (
    <View testID={testID} style={style} onLayout={onLayout}>
      <GestureDetector gesture={panGesture}>
        <View style={[styles.container, { height, borderRadius: radii.lg }]}>
          {/* 이후 이미지 (전체 배경) */}
          <Image
            source={{ uri: afterUri }}
            style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]}
            contentFit="cover"
            accessibilityLabel={afterLabel}
          />

          {/* 이전 이미지 (클리핑) */}
          <Animated.View style={[styles.beforeClip, beforeClipStyle]}>
            <Image
              source={{ uri: beforeUri }}
              style={[styles.beforeImage, { height, width: containerWidth || 300 }]}
              contentFit="cover"
              accessibilityLabel={beforeLabel}
            />
          </Animated.View>

          {/* 구분선 + 핸들 */}
          <Animated.View style={[styles.divider, dividerStyle]}>
            <View style={[styles.dividerLine, { backgroundColor: brand.primaryForeground }]} />
            <View
              style={[
                styles.handle,
                { backgroundColor: brand.primary, borderColor: brand.primaryForeground },
              ]}
              accessibilityRole="adjustable"
              accessibilityLabel="슬라이더 핸들"
              accessibilityHint="좌우로 드래그하여 이전/이후 비교"
            >
              <Text style={[styles.handleArrows, { color: brand.primaryForeground }]}>◂ ▸</Text>
            </View>
          </Animated.View>

          {/* 라벨 */}
          <View style={[styles.labelContainer, styles.labelLeft]}>
            <Text style={[styles.overlayLabel, { backgroundColor: `${colors.background}CC` }]}>{beforeLabel}</Text>
          </View>
          <View style={[styles.labelContainer, styles.labelRight]}>
            <Text style={[styles.overlayLabel, { backgroundColor: `${colors.background}CC` }]}>{afterLabel}</Text>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  beforeClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  beforeImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  divider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -1 }],
  },
  dividerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
  },
  handle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  handleArrows: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
  },
  labelContainer: {
    position: 'absolute',
    bottom: 8,
  },
  labelLeft: {
    left: 8,
  },
  labelRight: {
    right: 8,
  },
  overlayLabel: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  sideBySide: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sideBySideHalf: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    textAlign: 'center',
  },
});
