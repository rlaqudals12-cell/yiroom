/**
 * DrapingPreview — 퍼스널 컬러 드레이핑 시뮬레이터 (간소화)
 *
 * 사용자 사진 위에 반투명 컬러 오버레이.
 * 하단 색상 팔레트 터치로 색상 선택.
 */
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme, radii, spacing, typography } from '../../lib/theme';

interface DrapingPreviewProps {
  /** 사용자 사진 URI */
  imageUri: string;
  /** 추천 색상 팔레트 (hex) */
  palette: string[];
  /** 시즌명 */
  seasonName?: string;
  /** 시즌 설명 */
  seasonDescription?: string;
  /** 이미지 높이 */
  imageHeight?: number;
  style?: ViewStyle;
  testID?: string;
}

export function DrapingPreview({
  imageUri,
  palette,
  seasonName,
  seasonDescription,
  imageHeight = 300,
  style,
  testID = 'draping-preview',
}: DrapingPreviewProps): React.JSX.Element {
  const { colors, brand, spacing, typography, radii } = useTheme();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const handleColorPress = useCallback((color: string) => {
    Haptics.selectionAsync();
    setSelectedColor((prev) => (prev === color ? null : color));
  }, []);

  return (
    <View testID={testID} style={style}>
      {/* 시즌 정보 */}
      {seasonName && (
        <View style={styles.seasonInfo}>
          <Text style={[styles.seasonName, { color: colors.foreground, fontSize: typography.size.base }]}>
            {seasonName}
          </Text>
          {seasonDescription && (
            <Text style={[styles.seasonDesc, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
              {seasonDescription}
            </Text>
          )}
        </View>
      )}

      {/* 사진 + 오버레이 */}
      <View style={[styles.imageContainer, { height: imageHeight, borderRadius: radii.lg }]}>
        <Image
          source={{ uri: imageUri }}
          style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]}
          contentFit="cover"
          accessibilityLabel="사용자 사진"
        />

        {/* 컬러 오버레이 */}
        {selectedColor && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[
              StyleSheet.absoluteFill,
              styles.colorOverlay,
              { backgroundColor: selectedColor, borderRadius: radii.lg },
            ]}
            accessibilityLabel={`${selectedColor} 색상 드레이핑`}
          />
        )}

        {/* 선택된 색상명 */}
        {selectedColor && (
          <View style={[styles.colorLabel, { backgroundColor: `${colors.background}CC` }]}>
            <View style={[styles.colorDot, { backgroundColor: selectedColor }]} />
            <Text style={[styles.colorLabelText, { color: colors.foreground }]}>{selectedColor}</Text>
          </View>
        )}
      </View>

      {/* 안내 텍스트 */}
      <Text style={[styles.hint, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
        색상을 터치하여 드레이핑 효과를 확인하세요
      </Text>

      {/* 색상 팔레트 */}
      <View style={styles.paletteContainer}>
        {palette.map((color) => (
          <Pressable
            key={color}
            onPress={() => handleColorPress(color)}
            style={({ pressed }) => [
              styles.paletteItem,
              {
                backgroundColor: color,
                borderColor: selectedColor === color ? colors.foreground : 'transparent',
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: selectedColor === color ? 1.15 : 1 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${color} 색상 선택`}
            accessibilityState={{ selected: selectedColor === color }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  seasonInfo: {
    marginBottom: spacing.smd,
    gap: spacing.xxs,
  },
  seasonName: {
    fontWeight: '700',
  },
  seasonDesc: {
    lineHeight: 18,
  },
  imageContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  colorOverlay: {
    opacity: 0.3,
  },
  colorLabel: {
    position: 'absolute',
    bottom: spacing.smd,
    left: spacing.smd,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.smd,
    paddingVertical: 5,
    borderRadius: radii.md,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: radii.sm,
  },
  colorLabelText: {
    fontSize: typography.size.xs,
    fontWeight: '600',
  },
  hint: {
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  paletteContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.smd,
    paddingVertical: spacing.xs,
  },
  paletteItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
  },
});
