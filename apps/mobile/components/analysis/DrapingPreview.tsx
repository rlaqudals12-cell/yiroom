/**
 * DrapingPreview — 퍼스널 컬러 드레이핑 비교 (웹 DrapingSection 패리티, 2026-08)
 *
 * 왜 전면 틴트를 폐지했나: 구현 v1은 사진 전체에 반투명 색을 덮었는데(absoluteFill
 * opacity 0.3), 이는 "조명 필터"가 되어 베스트·워스트 양쪽을 같은 방향으로 왜곡한다.
 * 두 색을 나란히 놓아도 차이가 색 자체가 아니라 필터 색으로만 보여 비교가 무의미했다.
 * 웹이 같은 이유로 기각한 방식이라 앱에서도 폐지한다.
 *
 * 대신 웹과 동일하게 사진 하단(목·어깨)에만 색천 밴드를 올려 "얼굴 아래 천을 대본다"는
 * 물리 드레이핑을 재현한다. 얼굴 픽셀은 건드리지 않고, 동시대비로 혈색·그늘 차이를 본다.
 * RN에는 캔버스가 없어 웹의 픽셀 합성 대신 절대배치 그라데이션 색면으로 미러한다
 * (상수·페이드 비율은 웹 `lib/analysis/drape-reflectance.ts`와 동일값).
 */
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme, radii, spacing, typography } from '../../lib/theme';
import { getKoreanColorName } from '../../lib/utils/color-names';

// --- 드레이프 레이아웃 상수 (웹 drape-reflectance.ts와 동일값) ---
/** 색천 시작 지점 — 촬영 가이드 기준 턱끝이 프레임 ~88%라 하단 13%만 사용 */
const DRAPE_START_RATIO = 0.87;
/** 상단 경계 페이드 구간 (사진 높이 기준) */
const DRAPE_FADE_RATIO = 0.03;
/** 색천 최대 불투명도 — 좁은 밴드를 채워 '천' 느낌 */
const DRAPE_MAX_BLEND = 0.92;
/** 페이드 시작 불투명도 */
const DRAPE_MIN_BLEND = 0.2;

const BAND_HEIGHT = `${Math.round((1 - DRAPE_START_RATIO) * 1000) / 10}%` as const;
const FADE_STOP = DRAPE_FADE_RATIO / (1 - DRAPE_START_RATIO);

/** 정직 고지 — 합성(생성 아님) + 기기 내 처리 + 원본 보관 범위까지 명시 */
const HONEST_NOTE =
  '실제 천이 아닌 가상 드레이프 합성이에요. 합성은 이 기기에서만 만들어지고 저장되지 않아요 — 원본 사진은 분석 기록에 보관돼요.';
/** 관찰 지시 — 무엇을 봐야 하는지 알려주지 않으면 비교가 성립하지 않는다 */
const OBSERVE_HINT = '얼굴 혈색·눈밑 그늘·윤곽이 색에 따라 어떻게 달라지는지 살펴보세요.';

const BEST_LABEL = '베스트';
const AVOID_LABEL = '피해야 할 색';

/** HEX(#RGB·#RRGGBB) → rgba 문자열 (RN 그라데이션은 8자리 hex보다 rgba가 안전) */
function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface DrapeFigureProps {
  imageUri: string;
  /** 이 열에서 고를 수 있는 색 목록 (hex) */
  paletteColors: string[];
  selected: number;
  onSelect: (index: number) => void;
  label: string;
  tone: 'best' | 'avoid';
  maxHeight: number;
  captionColor: string;
  captionStrong: boolean;
  selectedBorderColor: string;
}

/** 사진 1장 + 하단 색천 + 색 스와치 (베스트/회피 각 1열) */
function DrapeFigure({
  imageUri,
  paletteColors,
  selected,
  onSelect,
  label,
  tone,
  maxHeight,
  captionColor,
  captionStrong,
  selectedBorderColor,
}: DrapeFigureProps): React.JSX.Element {
  const hex = paletteColors[Math.min(selected, paletteColors.length - 1)];
  const colorName = getKoreanColorName(hex);
  const caption = `${label} · ${colorName}`;

  // expo-linear-gradient는 튜플 타입을 요구한다
  const gradientColors: [string, string, string] = [
    withAlpha(hex, DRAPE_MIN_BLEND),
    withAlpha(hex, DRAPE_MAX_BLEND),
    withAlpha(hex, DRAPE_MAX_BLEND),
  ];
  const gradientLocations: [number, number, number] = [0, FADE_STOP, 1];

  return (
    <View style={styles.figure} testID={`draping-figure-${tone}`}>
      <View
        style={[styles.imageContainer, { maxHeight, borderRadius: radii.xl }]}
        testID={`draping-photo-${tone}`}
      >
        <Image
          source={{ uri: imageUri }}
          style={[StyleSheet.absoluteFill, { borderRadius: radii.xl }]}
          contentFit="cover"
          accessibilityLabel={caption}
        />
        {/* 색천 — 사진 하단 13%에만. 얼굴 영역은 원본 그대로 둔다 */}
        <Animated.View
          key={hex}
          entering={FadeIn.duration(200)}
          style={styles.bandWrap}
          pointerEvents="none"
          testID={`draping-band-wrap-${tone}`}
        >
          <LinearGradient
            colors={gradientColors}
            locations={gradientLocations}
            style={styles.band}
            testID={`draping-band-${tone}`}
          />
        </Animated.View>
      </View>

      <Text
        style={[styles.caption, { color: captionColor, fontWeight: captionStrong ? '700' : '500' }]}
        testID={`draping-caption-${tone}`}
      >
        {caption}
      </Text>

      {/* 색 스와치 — 탭해서 다른 진단 색으로 교체 */}
      <View style={styles.swatchRow} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {paletteColors.map((color, i) => (
          <Pressable
            key={`${color}-${i}`}
            onPress={() => onSelect(i)}
            style={({ pressed }) => [
              styles.swatch,
              {
                backgroundColor: color,
                borderColor: selected === i ? selectedBorderColor : 'transparent',
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: selected === i ? 1.15 : 1 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${getKoreanColorName(color)} 선택`}
            accessibilityState={{ selected: selected === i }}
            testID={`draping-swatch-${tone}-${i}`}
          />
        ))}
      </View>
    </View>
  );
}

interface DrapingPreviewProps {
  /** 사용자 사진 URI */
  imageUri: string;
  /** 진단 베스트 팔레트 (hex) */
  palette: string[];
  /** 회피 팔레트 (hex) — 있으면 베스트와 나란히 비교한다 */
  avoidPalette?: string[];
  /** 시즌명 */
  seasonName?: string;
  /** 시즌 설명 */
  seasonDescription?: string;
  /** 사진 최대 높이 (좁은 화면에서는 폭에 맞춰 3:4로 줄어든다) */
  imageHeight?: number;
  style?: ViewStyle;
  testID?: string;
}

export function DrapingPreview({
  imageUri,
  palette,
  avoidPalette = [],
  seasonName,
  seasonDescription,
  imageHeight = 300,
  style,
  testID = 'draping-preview',
}: DrapingPreviewProps): React.JSX.Element {
  const { colors, typography } = useTheme();
  const [bestIndex, setBestIndex] = useState(0);
  const [avoidIndex, setAvoidIndex] = useState(0);

  const handleBestSelect = useCallback((index: number) => {
    Haptics.selectionAsync();
    setBestIndex(index);
  }, []);

  const handleAvoidSelect = useCallback((index: number) => {
    Haptics.selectionAsync();
    setAvoidIndex(index);
  }, []);

  // 진단 색이 없으면 지어내지 않는다 (조용한 숨김 대신 사유 표기)
  if (palette.length === 0) {
    return (
      <View testID={testID} style={style}>
        <Text style={[styles.honestNote, { color: colors.mutedForeground }]} testID="draping-empty">
          진단된 색이 없어 드레이핑을 보여드릴 수 없어요.
        </Text>
      </View>
    );
  }

  return (
    <View testID={testID} style={style}>
      {/* 시즌 정보 */}
      {seasonName && (
        <View style={styles.seasonInfo}>
          <Text
            style={[
              styles.seasonName,
              { color: colors.foreground, fontSize: typography.size.base },
            ]}
          >
            {seasonName}
          </Text>
          {seasonDescription && (
            <Text
              style={[
                styles.seasonDesc,
                { color: colors.mutedForeground, fontSize: typography.size.xs },
              ]}
            >
              {seasonDescription}
            </Text>
          )}
        </View>
      )}

      {/* 관찰 지시 — 무엇을 볼지 알려준다 */}
      <Text
        style={[styles.observeHint, { color: colors.mutedForeground }]}
        testID="draping-observe-hint"
      >
        {OBSERVE_HINT}
      </Text>

      {/* 베스트 / 회피 병치 비교 */}
      <View style={styles.compareRow}>
        <DrapeFigure
          imageUri={imageUri}
          paletteColors={palette}
          selected={bestIndex}
          onSelect={handleBestSelect}
          label={BEST_LABEL}
          tone="best"
          maxHeight={imageHeight}
          captionColor={colors.foreground}
          captionStrong
          selectedBorderColor={colors.foreground}
        />
        {avoidPalette.length > 0 && (
          <DrapeFigure
            imageUri={imageUri}
            paletteColors={avoidPalette}
            selected={avoidIndex}
            onSelect={handleAvoidSelect}
            label={AVOID_LABEL}
            tone="avoid"
            maxHeight={imageHeight}
            captionColor={colors.mutedForeground}
            captionStrong={false}
            selectedBorderColor={colors.mutedForeground}
          />
        )}
      </View>

      {/* 정직 고지 — 생성이 아닌 합성 + 기기 내 처리 */}
      <Text style={[styles.honestNote, { color: colors.mutedForeground }]} testID="draping-note">
        {HONEST_NOTE}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  seasonInfo: {
    marginBottom: spacing.sm,
    gap: spacing.xxs,
  },
  seasonName: {
    fontWeight: '700',
  },
  seasonDesc: {
    lineHeight: 18,
  },
  observeHint: {
    fontSize: typography.size.xs,
    lineHeight: 18,
    marginBottom: spacing.smd,
  },
  compareRow: {
    flexDirection: 'row',
    gap: spacing.smd,
  },
  figure: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    overflow: 'hidden',
    position: 'relative',
  },
  bandWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BAND_HEIGHT,
  },
  band: {
    flex: 1,
  },
  caption: {
    fontSize: typography.size.xs,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
  },
  honestNote: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.smd,
  },
});
