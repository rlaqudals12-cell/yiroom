/**
 * GradientText — 그래디언트 텍스트
 *
 * 웹의 bg-clip-text + bg-gradient-brand 효과를 네이티브로.
 * react-native-svg 기반 (MaskedView 불필요).
 *
 * @example
 * <GradientText variant="brand" fontSize={24}>온전한 나는?</GradientText>
 */
import { useState } from 'react';
import { View, Text, type TextStyle, type ViewStyle } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useReducedMotion } from 'react-native-reanimated';

import { useTheme } from '@/lib/theme';
import { brand, moduleColors } from '@/lib/theme/tokens';

// 그래디언트 프리셋
const GRADIENT_PRESETS = {
  brand: [brand.gradientStart, brand.gradientEnd],
  extended: [brand.primary, '#C084FC'], // 핑크→퍼플
  skin: [moduleColors.skin.light, moduleColors.skin.base],
  body: [moduleColors.body.light, moduleColors.body.base],
  personalColor: [moduleColors.personalColor.light, moduleColors.personalColor.base],
  hair: [moduleColors.hair.light, moduleColors.hair.base],
  makeup: [moduleColors.makeup.light, moduleColors.makeup.base],
  oralHealth: [moduleColors.oralHealth.light, moduleColors.oralHealth.base],
  posture: [moduleColors.posture.light, moduleColors.posture.base],
  workout: [moduleColors.workout.light, moduleColors.workout.base],
  nutrition: [moduleColors.nutrition.light, moduleColors.nutrition.base],
} as const;

export type GradientTextVariant = keyof typeof GRADIENT_PRESETS;

interface GradientTextProps {
  children: string;
  variant?: GradientTextVariant;
  colors?: [string, string];
  fontSize?: number;
  fontWeight?: TextStyle['fontWeight'];
  style?: ViewStyle;
  testID?: string;
}

export function GradientText({
  children,
  variant = 'brand',
  colors: customColors,
  fontSize = 22,
  fontWeight = '700',
  style,
  testID,
}: GradientTextProps): React.JSX.Element {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);

  const gradientColors = customColors ?? GRADIENT_PRESETS[variant];

  // 접근성: 모션 감소 또는 폴백 — 단색 텍스트
  if (reducedMotion || width === 0) {
    // width 측정 전에는 보이지 않는 Text로 측정, 측정 후에는 SVG로 전환
  }

  // SVG 높이 (lineHeight 근사)
  const svgHeight = fontSize * 1.4;
  // 다크모드: 밝기 10% 올림 (SVG Stop 색상)
  const c0 = isDark ? lighten(gradientColors[0], 0.1) : gradientColors[0];
  const c1 = isDark ? lighten(gradientColors[1], 0.1) : gradientColors[1];

  return (
    <View
      testID={testID}
      style={style}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="text"
      accessibilityLabel={children}
    >
      {width > 0 ? (
        <Svg height={svgHeight} width={width}>
          <Defs>
            <SvgGradient id="textGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={c0} stopOpacity="1" />
              <Stop offset="1" stopColor={c1} stopOpacity="1" />
            </SvgGradient>
          </Defs>
          <SvgText
            fill="url(#textGrad)"
            fontSize={fontSize}
            fontWeight={numericWeight(fontWeight)}
            y={fontSize}
            x="0"
          >
            {children}
          </SvgText>
        </Svg>
      ) : (
        // 초기 측정용 투명 텍스트 (width 확보)
        <Text
          style={{
            fontSize,
            fontWeight,
            opacity: 0,
            position: 'absolute',
          }}
        >
          {children}
        </Text>
      )}
    </View>
  );
}

// 색상 밝기 조정 (hex → hex, 0.1 = 10% 밝게)
function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// fontWeight 문자열 → 숫자 (SVG fontWeight는 숫자만 지원)
function numericWeight(weight: TextStyle['fontWeight']): string {
  if (typeof weight === 'number') return String(weight);
  const map: Record<string, string> = {
    normal: '400',
    bold: '700',
    '100': '100',
    '200': '200',
    '300': '300',
    '400': '400',
    '500': '500',
    '600': '600',
    '700': '700',
    '800': '800',
    '900': '900',
  };
  return map[weight ?? 'bold'] ?? '700';
}
