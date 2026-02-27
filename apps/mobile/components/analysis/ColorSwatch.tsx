/**
 * ColorSwatch — 단일 색상 칩 컴포넌트
 *
 * 원형 색상 칩 + 컬러명 + press 시 hex 복사 + 햅틱.
 * ColorPalette의 단위 컴포넌트.
 */
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ColorSwatchProps {
  /** 색상 hex 코드 (예: #FF5733) */
  color: string;
  /** 색상 이름 (예: "코랄 핑크") */
  name?: string;
  /** 크기 (기본 48) */
  size?: number;
  /** 이름 표시 여부 (기본 true) */
  showName?: boolean;
  /** hex 복사 활성화 (기본 true) */
  copyOnPress?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function ColorSwatch({
  color,
  name,
  size = 48,
  showName = true,
  copyOnPress = true,
  style,
  testID,
}: ColorSwatchProps): React.JSX.Element {
  const { colors, typography, radii } = useTheme();
  const [copied, setCopied] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(async () => {
    if (!copyOnPress) return;

    Haptics.selectionAsync();
    scale.value = withSpring(0.85, { damping: 12, stiffness: 300 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    }, 150);

    await Clipboard.setStringAsync(color);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [color, copyOnPress, scale]);

  // 색상이 어두운지 판별 (보더 표시용)
  const isLight = isLightColor(color);

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.container, animatedStyle, style]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={name ? `${name} ${color}` : color}
    >
      {/* 색상 원 */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            borderColor: isLight ? colors.border : 'transparent',
            borderWidth: isLight ? 1 : 0,
          },
        ]}
      />

      {/* 이름/hex */}
      {showName && (
        <Text
          style={[
            styles.name,
            {
              color: colors.foreground,
              fontSize: typography.size.xs,
              maxWidth: size + 16,
            },
          ]}
          numberOfLines={1}
        >
          {copied ? '복사됨!' : name ?? color}
        </Text>
      )}
    </AnimatedPressable>
  );
}

/** 간단한 밝은 색상 판별 (hex → luminance) */
function isLightColor(hex: string): boolean {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  // 상대 밝기 (간이 공식)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.75;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  name: {
    textAlign: 'center',
  },
});
