/**
 * ScanCamera -- 바코드 스캔 카메라 뷰파인더 UI
 *
 * 실제 카메라 권한/제어는 상위 화면에서 처리하고,
 * 이 컴포넌트는 뷰파인더 오버레이(가이드 프레임, 스캔 라인 애니메이션,
 * 안내 텍스트)를 렌더링하는 UI 플레이스홀더.
 */
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme, spacing, radii, typography } from '../../lib/theme';
import { brand } from '../../lib/theme/tokens';

interface ScanCameraProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  style?: ViewStyle;
}

const SCAN_AREA_WIDTH = 280;
const SCAN_AREA_HEIGHT = 160;
const SCAN_LINE_HEIGHT = 2;

export function ScanCamera({
  onScan,
  onClose,
  style,
}: ScanCameraProps): React.JSX.Element {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);

  // 스캔 라인 애니메이션
  useEffect(() => {
    if (!reducedMotion) {
      translateY.value = 0;
      translateY.value = withRepeat(
        withTiming(SCAN_AREA_HEIGHT - SCAN_LINE_HEIGHT, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }
    return () => cancelAnimation(translateY);
  }, [reducedMotion, translateY]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View
      testID="scan-camera"
      style={[styles.container, { backgroundColor: '#000000' }, style]}
      accessibilityLabel="바코드 스캔 카메라"
    >
      {/* 카메라 프리뷰 영역 (실제 카메라는 상위 화면에서 렌더링) */}
      <View style={styles.overlay}>
        {/* 상단 어두운 오버레이 */}
        <View style={styles.overlayDark} />

        {/* 스캔 영역 행 */}
        <View style={styles.middleRow}>
          <View style={styles.overlayDark} />

          {/* 스캔 프레임 */}
          <View
            style={[
              styles.scanArea,
              {
                width: SCAN_AREA_WIDTH,
                height: SCAN_AREA_HEIGHT,
                borderColor: brand.primary,
                borderRadius: radii.lg,
              },
            ]}
          >
            {/* 코너 마커 — 좌상 */}
            <View style={[styles.corner, styles.cornerTopLeft, { borderColor: brand.primary }]} />
            {/* 코너 마커 — 우상 */}
            <View style={[styles.corner, styles.cornerTopRight, { borderColor: brand.primary }]} />
            {/* 코너 마커 — 좌하 */}
            <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: brand.primary }]} />
            {/* 코너 마커 — 우하 */}
            <View style={[styles.corner, styles.cornerBottomRight, { borderColor: brand.primary }]} />

            {/* 스캔 라인 */}
            <Animated.View
              style={[
                styles.scanLine,
                { backgroundColor: brand.primary },
                scanLineStyle,
              ]}
              pointerEvents="none"
            />
          </View>

          <View style={styles.overlayDark} />
        </View>

        {/* 하단 어두운 오버레이 */}
        <View style={styles.overlayDark} />
      </View>

      {/* 안내 텍스트 */}
      <View style={[styles.guideContainer, { bottom: 140 }]}>
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.semibold,
            color: '#FFFFFF',
            textAlign: 'center',
            textShadowColor: 'rgba(0,0,0,0.6)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}
        >
          바코드를 스캔해주세요
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            marginTop: spacing.xs,
            textShadowColor: 'rgba(0,0,0,0.6)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}
        >
          제품의 바코드를 프레임 안에 맞춰주세요
        </Text>
      </View>

      {/* 닫기 버튼 */}
      <Pressable
        testID="scan-camera-close"
        style={({ pressed }) => [
          styles.closeButton,
          {
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: radii.full,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="스캔 닫기"
      >
        <Text style={styles.closeIcon}>{'×'}</Text>
      </Pressable>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_BORDER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayDark: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  middleRow: {
    flexDirection: 'row',
  },
  scanArea: {
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: CORNER_BORDER_WIDTH,
    borderLeftWidth: CORNER_BORDER_WIDTH,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: CORNER_BORDER_WIDTH,
    borderRightWidth: CORNER_BORDER_WIDTH,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: CORNER_BORDER_WIDTH,
    borderLeftWidth: CORNER_BORDER_WIDTH,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: CORNER_BORDER_WIDTH,
    borderRightWidth: CORNER_BORDER_WIDTH,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    height: SCAN_LINE_HEIGHT,
    borderRadius: 1,
  },
  guideContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.xxl + spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
