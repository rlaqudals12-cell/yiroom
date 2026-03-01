/**
 * ColorPalette — 색상 팔레트 그리드
 *
 * 퍼스널컬러 분석 결과에서 추천/피해야 할 색상 팔레트 표시.
 * - 4열 그리드 레이아웃
 * - 카테고리별 그룹핑
 * - 순차 진입 애니메이션
 */
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme , spacing } from '../../lib/theme';
import { ColorSwatch, type ColorSwatchProps } from './ColorSwatch';

export interface ColorItem {
  color: string;
  name?: string;
}

export interface ColorGroup {
  /** 그룹 제목 (예: "추천 색상", "피해야 할 색상") */
  title: string;
  /** 색상 목록 */
  colors: ColorItem[];
}

interface ColorPaletteProps {
  /** 단일 목록 모드 */
  colors?: ColorItem[];
  /** 그룹 모드 (카테고리별) */
  groups?: ColorGroup[];
  /** 열 수 (기본 4) */
  columns?: number;
  /** 스와치 크기 (기본 48) */
  swatchSize?: number;
  /** 진입 애니메이션 (기본 true) */
  animated?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function ColorPalette({
  colors: singleColors,
  groups,
  columns = 4,
  swatchSize = 48,
  animated = true,
  style,
  testID,
}: ColorPaletteProps): React.JSX.Element {
  const { colors: themeColors, typography, spacing } = useTheme();

  // 그룹 모드
  if (groups && groups.length > 0) {
    return (
      <View style={[styles.container, style]} testID={testID}>
        {groups.map((group, groupIdx) => (
          <View key={group.title} style={groupIdx > 0 ? { marginTop: spacing.lg } : undefined}>
            <Text
              style={[
                styles.groupTitle,
                {
                  color: themeColors.foreground,
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                },
              ]}
              accessibilityRole="header"
            >
              {group.title}
            </Text>
            <ColorGrid
              items={group.colors}
              columns={columns}
              swatchSize={swatchSize}
              animated={animated}
              baseIndex={groupIdx * 8}
            />
          </View>
        ))}
      </View>
    );
  }

  // 단일 목록 모드
  if (singleColors && singleColors.length > 0) {
    return (
      <View style={[styles.container, style]} testID={testID}>
        <ColorGrid
          items={singleColors}
          columns={columns}
          swatchSize={swatchSize}
          animated={animated}
          baseIndex={0}
        />
      </View>
    );
  }

  return <View />;
}

// --- 내부 그리드 ---

interface ColorGridProps {
  items: ColorItem[];
  columns: number;
  swatchSize: number;
  animated: boolean;
  baseIndex: number;
}

function ColorGrid({
  items,
  columns,
  swatchSize,
  animated,
  baseIndex,
}: ColorGridProps): React.JSX.Element {
  return (
    <View style={styles.grid}>
      {items.map((item, idx) => {
        const Wrapper = animated ? Animated.View : View;
        const enteringProp = animated
          ? { entering: FadeInUp.delay((baseIndex + idx) * 60).duration(400) }
          : {};

        return (
          <Wrapper
            key={`${item.color}-${idx}`}
            {...enteringProp}
            style={[styles.gridItem, { width: `${100 / columns}%` }]}
          >
            <ColorSwatch
              color={item.color}
              name={item.name}
              size={swatchSize}
              showName={!!item.name}
            />
          </Wrapper>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  groupTitle: {
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
});
