/**
 * BadgeDrop — 뱃지 획득 시 메달 떨어지기 애니메이션
 *
 * 상단에서 떨어지는 메달 + 바운스 + confetti 연동.
 * 웹 BadgeDrop.tsx의 네이티브 대응.
 *
 * @example
 * <BadgeDrop
 *   badge={{ icon: '🏅', name: '첫 분석', description: '첫 AI 분석 완료!' }}
 *   visible={showBadge}
 *   onDismiss={() => setShowBadge(false)}
 * />
 */
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';

export interface BadgeInfo {
  icon: string;
  name: string;
  description: string;
}

interface BadgeDropProps {
  badge: BadgeInfo;
  visible: boolean;
  onDismiss?: () => void;
}

export function BadgeDrop({
  badge,
  visible,
  onDismiss,
}: BadgeDropProps): React.JSX.Element | null {
  const { colors, spacing, typography, radii, shadows } = useTheme();
  const reducedMotion = useReducedMotion();

  const overlayOpacity = useSharedValue(0);
  const badgeTranslateY = useSharedValue(-600);
  const badgeRotation = useSharedValue(0);
  const badgeScale = useSharedValue(1);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    // 오버레이
    overlayOpacity.value = withTiming(1, { duration: 200 });

    if (reducedMotion) {
      // 접근성: 모션 줄임 — 단순 페이드
      badgeTranslateY.value = withTiming(0, { duration: 300 });
      textOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
      return;
    }

    // 4단계 시퀀스 (웹 medal-drop 대응)
    // 1. Drop (0-400ms): -600 → 20px, 360도 회전
    // 2. Bounce (400-600ms): 20px → -10px
    // 3. Settle (600-700ms): -10px → 0
    badgeTranslateY.value = withSequence(
      withTiming(20, {
        duration: 400,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      }),
      withTiming(-10, { duration: 150, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 100, easing: Easing.out(Easing.ease) })
    );

    badgeRotation.value = withSequence(
      withTiming(360, { duration: 400, easing: Easing.out(Easing.cubic) }),
      withTiming(380, { duration: 150 }),
      withTiming(360, { duration: 100 })
    );

    // 바운스 시점에 햅틱
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 400);

    // 텍스트 페이드인 (바운스 후)
    textOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));

    // 3초 후 자동 dismiss
    const timer = setTimeout(() => {
      handleDismiss();
    }, 3000);

    return () => {
      clearTimeout(timer);
      cancelAnimation(badgeTranslateY);
      cancelAnimation(badgeRotation);
      cancelAnimation(textOpacity);
      cancelAnimation(overlayOpacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleDismiss = (): void => {
    badgeScale.value = withTiming(0.9, { duration: 200 });
    overlayOpacity.value = withTiming(0, { duration: 300 });
    textOpacity.value = withTiming(0, { duration: 200 });
    if (onDismiss) {
      setTimeout(onDismiss, 350);
    }
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: badgeTranslateY.value },
      { rotate: `${badgeRotation.value}deg` },
      { scale: badgeScale.value },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handleDismiss}
        accessibilityLabel="뱃지 닫기"
        accessibilityRole="button"
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.5)' },
            overlayStyle,
          ]}
        />
        <View style={styles.centerContainer}>
          {/* 메달 */}
          <Animated.View
            style={[
              styles.badgeContainer,
              {
                backgroundColor: colors.card,
                borderRadius: radii.full,
                ...shadows.lg,
              },
              badgeStyle,
            ]}
          >
            <Text style={styles.badgeIcon}>{badge.icon}</Text>
          </Animated.View>

          {/* 이름 + 설명 */}
          <Animated.View style={[{ alignItems: 'center' }, textStyle]}>
            <Text
              style={[
                styles.badgeName,
                {
                  color: colors.card,
                  fontSize: typography.size.xl,
                  fontWeight: typography.weight.bold,
                  marginTop: spacing.lg,
                },
              ]}
            >
              {badge.name}
            </Text>
            <Text
              style={[
                styles.badgeDescription,
                {
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.normal,
                  marginTop: spacing.xs,
                },
              ]}
            >
              {badge.description}
            </Text>
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 64,
  },
  badgeName: {
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  badgeDescription: {
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
