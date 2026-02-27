/**
 * BottomSheet — 하단 시트 컴포넌트
 *
 * Modal + Gesture API (v2) + Reanimated 기반.
 * 스냅 포인트 지원, 드래그하여 닫기, 키보드 대응.
 * 외부 라이브러리(@gorhom/bottom-sheet) 없이 기존 의존성만 사용.
 */
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 스프링 애니메이션 설정
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

interface BottomSheetProps {
  /** 시트 표시 여부 */
  isVisible: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 스냅 포인트 배열 (화면 높이 비율, 예: ['25%', '50%', '90%']) */
  snapPoints?: string[];
  /** 초기 스냅 인덱스 (기본: 0) */
  initialSnap?: number;
  /** 시트 내부 콘텐츠 */
  children: React.ReactNode;
  /** 시트 상단 제목 */
  title?: string;
  /** 테스트 ID */
  testID?: string;
}

/** 퍼센트 문자열을 픽셀 높이로 변환 */
function parseSnapPoint(snap: string): number {
  const percent = parseFloat(snap.replace('%', ''));
  return (percent / 100) * SCREEN_HEIGHT;
}

export function BottomSheet({
  isVisible,
  onClose,
  snapPoints = ['50%'],
  initialSnap = 0,
  children,
  title,
  testID = 'bottom-sheet',
}: BottomSheetProps): React.JSX.Element | null {
  const { colors, spacing, radii, typography, shadows } = useTheme();

  // 스냅 포인트를 픽셀 높이로 변환 (높이순 정렬)
  const snapHeights = useMemo(
    () => snapPoints.map(parseSnapPoint).sort((a, b) => a - b),
    [snapPoints]
  );

  // 초기 시트 높이
  const initialHeight = snapHeights[Math.min(initialSnap, snapHeights.length - 1)] ?? snapHeights[0];

  // 현재 시트의 translateY (0 = 최대 높이 위치, SCREEN_HEIGHT = 완전히 숨김)
  const translateY = useSharedValue(SCREEN_HEIGHT);
  // 드래그 시작 시점의 translateY 저장
  const contextY = useSharedValue(0);
  // 배경 오파시티
  const backdropOpacity = useSharedValue(0);

  // 시트가 보이면 열기 애니메이션
  useEffect(() => {
    if (isVisible) {
      const targetY = SCREEN_HEIGHT - initialHeight;
      translateY.value = withSpring(targetY, SPRING_CONFIG);
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible, initialHeight, translateY, backdropOpacity]);

  // 키보드 표시 시 시트를 위로 올림
  useEffect(() => {
    if (!isVisible) return;

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const keyboardHeight = e.endCoordinates.height;
        const maxSnapHeight = snapHeights[snapHeights.length - 1];
        const adjustedY = SCREEN_HEIGHT - maxSnapHeight - keyboardHeight;
        translateY.value = withSpring(Math.max(adjustedY, 40), SPRING_CONFIG);
      }
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        const targetY = SCREEN_HEIGHT - initialHeight;
        translateY.value = withSpring(targetY, SPRING_CONFIG);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [isVisible, initialHeight, snapHeights, translateY]);

  const handleClose = useCallback((): void => {
    onClose();
  }, [onClose]);

  // Gesture API v2 — Pan 제스처
  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      // 아래로만 드래그 허용 (위로는 최대 스냅 이상 못감)
      const maxSnapHeight = snapHeights[snapHeights.length - 1];
      const minY = SCREEN_HEIGHT - maxSnapHeight;
      const newY = contextY.value + event.translationY;
      translateY.value = Math.max(newY, minY);
    })
    .onEnd((event) => {
      const currentHeight = SCREEN_HEIGHT - translateY.value;

      // 빠르게 아래로 스와이프하면 닫기
      if (event.velocityY > 500 || currentHeight < snapHeights[0] * 0.5) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(handleClose)();
        return;
      }

      // 가장 가까운 스냅 포인트 찾기
      let closestSnap = snapHeights[0];
      let minDist = Math.abs(currentHeight - snapHeights[0]);
      for (let i = 1; i < snapHeights.length; i++) {
        const dist = Math.abs(currentHeight - snapHeights[i]);
        if (dist < minDist) {
          minDist = dist;
          closestSnap = snapHeights[i];
        }
      }

      translateY.value = withSpring(SCREEN_HEIGHT - closestSnap, SPRING_CONFIG);
    });

  // 시트 애니메이션 스타일
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // 배경 오파시티 스타일
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      backdropOpacity.value,
      [0, 1],
      [0, 0.5],
      Extrapolation.CLAMP
    ),
  }));

  if (!isVisible) return null;

  const handleBarStyle: ViewStyle = {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.mutedForeground,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    opacity: 0.4,
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      testID={testID}
    >
      {/* 반투명 배경 — 탭하면 닫기 */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        testID={`${testID}-backdrop`}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#000000' },
            backdropAnimatedStyle,
          ]}
        />
      </Pressable>

      {/* 시트 본체 — GestureDetector로 드래그 처리 */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              ...shadows.lg,
            },
            sheetAnimatedStyle,
          ]}
          testID={`${testID}-content`}
        >
          {/* 핸들 인디케이터 */}
          <View style={handleBarStyle} testID={`${testID}-handle`} />

          {/* 제목 (선택) */}
          {title && (
            <View style={[styles.titleContainer, { paddingHorizontal: spacing.md }]}>
              <Text
                style={{
                  fontSize: typography.size.lg,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  textAlign: 'center',
                }}
                testID={`${testID}-title`}
              >
                {title}
              </Text>
              <View
                style={[
                  styles.titleDivider,
                  {
                    backgroundColor: colors.border,
                    marginTop: spacing.sm,
                  },
                ]}
              />
            </View>
          )}

          {/* 콘텐츠 */}
          <View style={[styles.content, { paddingHorizontal: spacing.md, paddingBottom: spacing.lg }]}>
            {children}
          </View>
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT,
  },
  titleContainer: {
    paddingTop: 4,
  },
  titleDivider: {
    height: StyleSheet.hairlineWidth,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
});
