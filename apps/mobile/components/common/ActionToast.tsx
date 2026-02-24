/**
 * ActionToast — 토스트 알림 컴포넌트
 *
 * 하단에서 올라오는 토스트 메시지.
 * 자동 사라짐 + 선택적 액션 버튼 지원.
 */
import { useEffect, useCallback } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';

type ToastType = 'info' | 'success' | 'error';

interface ActionToastProps {
  /** 메시지 */
  message: string;
  /** 토스트 타입 */
  type?: ToastType;
  /** 자동 사라짐 시간 (ms, 기본 3000) */
  duration?: number;
  /** 액션 버튼 라벨 */
  actionLabel?: string;
  /** 액션 버튼 콜백 */
  onAction?: () => void;
  /** 사라진 후 콜백 */
  onDismiss?: () => void;
  /** 표시 여부 */
  visible: boolean;
  testID?: string;
}

export function ActionToast({
  message,
  type = 'info',
  duration = 3000,
  actionLabel,
  onAction,
  onDismiss,
  visible,
  testID,
}: ActionToastProps): React.JSX.Element | null {
  const { colors, spacing, radii, typography, status } = useTheme();

  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });

      // 자동 사라짐
      translateY.value = withDelay(
        duration,
        withTiming(100, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(dismiss)();
          }
        })
      );
      opacity.value = withDelay(duration, withTiming(0, { duration: 300 }));
    } else {
      translateY.value = withTiming(100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, duration, translateY, opacity, dismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const bgColor =
    type === 'success'
      ? status.success
      : type === 'error'
        ? status.error
        : colors.foreground;

  if (!visible) return null;

  return (
    <Animated.View
      testID={testID}
      accessibilityRole="alert"
      accessibilityLabel={message}
      style={[
        styles.container,
        animatedStyle,
        {
          backgroundColor: bgColor,
          borderRadius: radii.lg,
          marginHorizontal: spacing.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
        },
      ]}
    >
      <Text
        numberOfLines={2}
        style={{
          flex: 1,
          fontSize: typography.size.sm,
          color: colors.overlayForeground,
          fontWeight: typography.weight.medium,
        }}
      >
        {message}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [
            styles.actionButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.overlayForeground,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  actionButton: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});
