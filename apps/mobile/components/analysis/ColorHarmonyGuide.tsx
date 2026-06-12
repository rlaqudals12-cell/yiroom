/**
 * ColorHarmonyGuide — 배색 가이드 (웹 ColorHarmonyGuide 포팅, ADR-105)
 *
 * 진단된 대표색에서 배색 이론(보색/유사색/삼각/톤온톤)으로
 * 코디 시 함께 쓸 색을 안내한다. "예쁜 색 박기"가 아니라 사용자 톤 기반 계산.
 *
 * @see lib/color/harmony.ts
 */
import { Palette } from 'lucide-react-native';
import { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { complementary, analogous, triadic, tonOnTone } from '../../lib/color/harmony';
import { useTheme, spacing, radii, typography } from '../../lib/theme';

export interface ColorHarmonyGuideProps {
  /** 기준 대표색 HEX (퍼스널컬러 베스트 컬러 첫 항목) */
  baseHex: string;
  /** 기준색 이름 (한국어) */
  baseName?: string;
  style?: ViewStyle;
  testID?: string;
}

/** 색상 스와치 한 칸 */
function Swatch({
  hex,
  borderColor,
  labelColor,
}: {
  hex: string;
  borderColor: string;
  labelColor: string;
}): React.JSX.Element {
  return (
    <View style={styles.swatchItem}>
      <View
        style={[styles.swatch, { backgroundColor: hex, borderColor }]}
        accessibilityLabel={hex}
      />
      <Text style={[styles.swatchLabel, { color: labelColor }]}>{hex.toUpperCase()}</Text>
    </View>
  );
}

export function ColorHarmonyGuide({
  baseHex,
  baseName,
  style,
  testID = 'color-harmony-guide',
}: ColorHarmonyGuideProps): React.JSX.Element {
  const { colors, brand } = useTheme();

  const harmony = useMemo(
    () => ({
      tonOnTone: tonOnTone(baseHex, 3),
      analogous: analogous(baseHex, 30),
      accent: complementary(baseHex),
      triadic: triadic(baseHex),
    }),
    [baseHex]
  );

  const rows: { title: string; desc: string; colors: string[] }[] = [
    {
      title: '톤온톤',
      desc: '같은 계열 명도 변화 — 안정적인 단색 코디',
      colors: harmony.tonOnTone,
    },
    {
      title: '유사색',
      desc: '대표색 양옆 — 조화로운 기본 배색',
      colors: harmony.analogous,
    },
    {
      title: '포인트 컬러',
      desc: '강한 대비 — 가방·액세서리 한 점에',
      colors: [harmony.accent],
    },
    {
      title: '삼각 배색',
      desc: '활기찬 3색 조합 — 룩에 생기를',
      colors: [baseHex, ...harmony.triadic],
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
      testID={testID}
      accessibilityLabel="배색 가이드"
    >
      <View style={styles.header}>
        <Palette size={18} color={brand.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>배색 가이드</Text>
      </View>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        {baseName ? `대표색 "${baseName}"` : '대표색'}을 기준으로 함께 쓰면 좋은 색을 색채학 배색
        이론으로 계산했어요.
      </Text>
      {rows.map((row) => (
        <View key={row.title} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{row.title}</Text>
            <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{row.desc}</Text>
          </View>
          <View style={styles.swatchRow}>
            {row.colors.map((hex, i) => (
              <Swatch
                key={`${row.title}-${i}-${hex}`}
                hex={hex}
                borderColor={colors.border}
                labelColor={colors.mutedForeground}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  description: {
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.5,
    marginBottom: spacing.md,
  },
  row: {
    marginBottom: spacing.md,
  },
  rowHeader: {
    marginBottom: spacing.xs,
  },
  rowTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  rowDesc: {
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatchItem: {
    alignItems: 'center',
    gap: 4,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  swatchLabel: {
    fontSize: 10,
  },
});

export default ColorHarmonyGuide;
