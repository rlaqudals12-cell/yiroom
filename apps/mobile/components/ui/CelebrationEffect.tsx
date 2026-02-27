/**
 * CelebrationEffect — 성취 순간 축하 효과
 *
 * 분석 완료, 뱃지 획득, 목표 달성 등에 파티클 + 아이콘 스케일 애니메이션.
 * 웹 CelebrationEffect.tsx의 네이티브 대응.
 *
 * @example
 * <CelebrationEffect
 *   type="analysis_complete"
 *   visible={showCelebration}
 *   onComplete={() => setShowCelebration(false)}
 * />
 */
import { useCallback, useEffect, useMemo } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';

// 축하 타입별 설정 (웹 CelebrationEffect와 동일한 5종)
const CELEBRATION_CONFIG = {
  workout_complete: {
    icon: '✅',
    title: '운동 완료!',
    particleCount: 12,
    duration: 2000,
    colors: ['#22C55E', '#86EFAC', '#4ADE80', '#16A34A'],
  },
  goal_achieved: {
    icon: '🎯',
    title: '목표 달성!',
    particleCount: 16,
    duration: 2500,
    colors: ['#F59E0B', '#FCD34D', '#FBBF24', '#D97706'],
  },
  streak: {
    icon: '🔥',
    title: '연속 기록!',
    particleCount: 8,
    duration: 1500,
    colors: ['#EF4444', '#FB923C', '#F97316', '#DC2626'],
  },
  analysis_complete: {
    icon: '✨',
    title: '분석 완료!',
    particleCount: 14,
    duration: 2500,
    colors: ['#F8C8DC', '#FFB6C1', '#E879F9', '#A855F7'],
  },
  badge_earned: {
    icon: '🏅',
    title: '뱃지 획득!',
    particleCount: 16,
    duration: 3000,
    colors: ['#F8C8DC', '#FFD700', '#FF6B6B', '#4ECDC4'],
  },
} as const;

export type CelebrationType = keyof typeof CELEBRATION_CONFIG;

interface CelebrationEffectProps {
  type: CelebrationType;
  visible: boolean;
  onComplete?: () => void;
  /** 자동 dismiss 비활성화 (수동 탭으로만 닫기) */
  autoDismiss?: boolean;
}

interface ParticleData {
  id: number;
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  rotation: number;
  size: number;
  delay: number;
}

// 파티클 개별 애니메이션
function Particle({ data }: { data: ParticleData }): React.JSX.Element {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    progress.value = withDelay(
      data.delay,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
    return () => cancelAnimation(progress);
  }, [progress, data.delay, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3,
      transform: [
        { translateX: data.startX + (data.endX - data.startX) * p },
        { translateY: data.startY + (data.endY - data.startY) * p + 80 * p * p },
        { rotate: `${data.rotation * p}deg` },
        { scale: 1 - p * 0.3 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: data.size,
          height: data.size,
          borderRadius: data.size / 2,
          backgroundColor: data.color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function CelebrationEffect({
  type,
  visible,
  onComplete,
  autoDismiss = true,
}: CelebrationEffectProps): React.JSX.Element | null {
  const { colors, spacing, typography, radii } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const config = CELEBRATION_CONFIG[type];

  // 애니메이션 값
  const overlayOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);

  // 파티클 데이터 생성
  const particles = useMemo<ParticleData[]>(() => {
    if (reducedMotion) return [];
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2 - 60;
    return Array.from({ length: config.particleCount }, (_, i) => {
      const angle = (Math.PI * 2 * i) / config.particleCount + (Math.random() - 0.5) * 0.5;
      const distance = 80 + Math.random() * 120;
      return {
        id: i,
        color: config.colors[i % config.colors.length],
        startX: centerX,
        startY: centerY,
        endX: centerX + Math.cos(angle) * distance,
        endY: centerY + Math.sin(angle) * distance - 40,
        rotation: (Math.random() - 0.5) * 720,
        size: 6 + Math.random() * 8,
        delay: Math.random() * 300,
      };
    });
  }, [config, screenWidth, screenHeight, reducedMotion]);

  const dismiss = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 200 });
    iconScale.value = withTiming(0, { duration: 200 });
    titleOpacity.value = withTiming(0, { duration: 200 });
    if (onComplete) {
      setTimeout(onComplete, 250);
    }
  }, [overlayOpacity, iconScale, titleOpacity, onComplete]);

  useEffect(() => {
    if (!visible) return;

    // 햅틱 피드백
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 오버레이 + 아이콘 진입
    overlayOpacity.value = withTiming(1, { duration: 300 });
    iconScale.value = withSequence(
      withTiming(1.3, { duration: 300, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 200 })
    );
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));

    // 자동 dismiss
    if (autoDismiss) {
      const timer = setTimeout(() => {
        dismiss();
      }, config.duration);
      return () => clearTimeout(timer);
    }
  }, [visible, config, overlayOpacity, iconScale, titleOpacity, autoDismiss, dismiss]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={dismiss}
        accessibilityLabel="축하 효과 닫기"
        accessibilityRole="button"
      >
        {/* 배경 오버레이 */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.4)' },
            overlayStyle,
          ]}
        />

        {/* 파티클 */}
        {particles.map((p) => (
          <Particle key={p.id} data={p} />
        ))}

        {/* 중앙 아이콘 + 텍스트 */}
        <View style={styles.centerContainer}>
          <Animated.View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.card, borderRadius: radii.full },
              iconStyle,
            ]}
          >
            <Text style={styles.iconText}>{config.icon}</Text>
          </Animated.View>
          <Animated.View style={titleStyle}>
            <Text
              style={[
                styles.titleText,
                {
                  color: colors.card,
                  fontSize: typography.size.xl,
                  fontWeight: typography.weight.bold,
                  marginTop: spacing.md,
                },
              ]}
            >
              {config.title}
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
  iconContainer: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconText: {
    fontSize: 48,
  },
  titleText: {
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
