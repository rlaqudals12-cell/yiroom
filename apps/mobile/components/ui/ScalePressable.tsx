/**
 * ScalePressable — 선택 시 스프링 스케일 애니메이션 Pressable
 *
 * 온보딩 화면의 선택 카드, 칩, 라디오 등에서 공통 사용.
 * 터치 시 0.95 스케일 + 스프링 복귀로 물리적 피드백 제공.
 */
import { useCallback } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface ScalePressableProps {
  /** 선택 상태 */
  selected: boolean;
  /** 탭 핸들러 */
  onPress: () => void;
  /** 스타일 (배열 또는 단일) */
  style: ViewStyle | ViewStyle[];
  /** 자식 요소 */
  children: React.ReactNode;
  /** 접근성 레이블 */
  accessibilityLabel: string;
  /** 비활성 상태 */
  disabled?: boolean;
  /** 테스트 ID */
  testID?: string;
}

export function ScalePressable({
  selected,
  onPress,
  style,
  children,
  accessibilityLabel,
  disabled,
  testID,
}: ScalePressableProps): React.JSX.Element {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onIn = useCallback(() => {
    if (!disabled) scale.value = withSpring(0.95, { damping: 15 });
  }, [scale, disabled]);
  const onOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15 });
  }, [scale]);

  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={style}
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled }}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
