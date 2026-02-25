/**
 * GradientCard 컴포넌트
 *
 * 모듈별 그라디언트 배경을 가진 카드. 솔리드 카드 배경 위에
 * 저투명도 LinearGradient 오버레이를 적용하여 은은한 모듈 색상 틴트를 표현.
 * iOS에서는 모듈 색상 기반 글로우 섀도우, Android에서는 elevation 사용.
 *
 * @example
 * <GradientCard variant="skin">
 *   <Text>피부 분석 카드</Text>
 * </GradientCard>
 *
 * <GradientCard variant="personalColor" padding={24}>
 *   <Text>퍼스널컬러 카드 (커스텀 패딩)</Text>
 * </GradientCard>
 */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { gradients, type GradientKey } from '../../lib/theme/gradients';
import { brand, moduleColors } from '../../lib/theme/tokens';
import { useTheme } from '../../lib/theme';

/** GradientCard가 지원하는 모듈 variant */
export type GradientCardVariant =
  | 'brand'
  | 'skin'
  | 'body'
  | 'personalColor'
  | 'face'
  | 'hair'
  | 'makeup'
  | 'posture'
  | 'oralHealth'
  | 'workout'
  | 'nutrition'
  | 'professional';

interface GradientCardProps {
  children: ReactNode;
  /** 모듈별 그라디언트 프리셋. 기본 'brand' */
  variant?: GradientCardVariant;
  style?: ViewStyle;
  testID?: string;
  /** 내부 패딩. 기본 spacing.md (16) */
  padding?: number;
}

/**
 * variant에 대응하는 글로우 섀도우 기본 색상을 반환.
 * moduleColors에 없는 brand/professional은 별도 처리.
 */
function getGlowColor(variant: GradientCardVariant): string {
  if (variant === 'brand') return brand.primary;
  if (variant === 'professional') return '#2D4A7A';
  return moduleColors[variant].base;
}

/**
 * variant에 대응하는 보더 색상을 반환.
 * 글로우 색상과 동일 기본 색상 사용.
 */
function getBorderColor(variant: GradientCardVariant, isDark: boolean): string {
  const base = getGlowColor(variant);
  // rgba 변환: 라이트 0.15, 다크 0.20
  const opacity = isDark ? 0.2 : 0.15;
  return hexToRgba(base, opacity);
}

/** hex 색상을 rgba 문자열로 변환 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function GradientCard({
  children,
  variant = 'brand',
  style,
  testID,
  padding,
}: GradientCardProps): React.JSX.Element {
  const { isDark, colors, radii, shadows, spacing } = useTheme();

  const config = gradients[variant as GradientKey];
  const glowColor = getGlowColor(variant);
  const borderColor = getBorderColor(variant, isDark);

  // 그라디언트 투명도: 라이트 0.15 / 다크 0.25 (콘텐츠 가독성 유지)
  const gradientOpacity = isDark ? 0.25 : 0.15;

  const contentPadding = padding ?? spacing.md;

  // iOS: 모듈 색상 기반 글로우 섀도우 (큰 오프셋 + 넓은 반지름)
  // Android: elevation 기반 (shadowColor 미지원)
  const glowShadow: ViewStyle =
    Platform.OS === 'ios'
      ? {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.15,
          shadowRadius: 50,
        }
      : {
          ...shadows.lg,
          elevation: 6,
        };

  return (
    <View
      testID={testID}
      style={[
        staticStyles.container,
        glowShadow,
        {
          backgroundColor: colors.card,
          borderColor,
          borderRadius: radii.xl,
        },
        style,
      ]}
    >
      {/* 그라디언트 오버레이 — 카드 배경 위에 은은한 틴트 */}
      <LinearGradient
        colors={[...config.colors]}
        start={config.start}
        end={config.end}
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: gradientOpacity,
            borderRadius: radii.xl,
          },
        ]}
      />

      {/* 콘텐츠 레이어 — 그라디언트 위에 렌더링 */}
      <View style={[staticStyles.content, { padding: contentPadding }]}>
        {children}
      </View>
    </View>
  );
}

const staticStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    zIndex: 1,
  },
});
