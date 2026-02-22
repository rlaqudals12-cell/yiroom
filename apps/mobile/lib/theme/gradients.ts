/**
 * 이룸 모바일 그라디언트 시스템
 *
 * 웹 globals.css의 --gradient-* 변수를 LinearGradient props로 변환.
 * 모든 그라디언트는 135도(좌상→우하) 방향이 기본.
 *
 * @example
 * import { gradients } from '@/lib/theme';
 * <LinearGradient {...gradients.brand} style={styles.header} />
 */
import { brand, moduleColors, professionalColors } from './tokens';

/** LinearGradient에 전달할 props 타입 */
export interface GradientConfig {
  colors: readonly [string, string, ...string[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

// 웹 135deg → start(0,0) end(1,1)
const DIAGONAL: Pick<GradientConfig, 'start' | 'end'> = {
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

// 수직 그라디언트
const VERTICAL: Pick<GradientConfig, 'start' | 'end'> = {
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

/** 브랜드/모듈 그라디언트 — 웹 globals.css 그라디언트와 1:1 대응 */
export const gradients = {
  // 브랜드 기본 (핑크)
  brand: {
    colors: [brand.gradientStart, brand.gradientEnd] as const,
    ...DIAGONAL,
  },

  // 브랜드 확장 (핑크→보라)
  brandExtended: {
    colors: ['#F8C8DC', '#E879F9', '#A855F7'] as const,
    ...DIAGONAL,
  },

  // 모듈별 그라디언트 (base → dark)
  workout: {
    colors: [moduleColors.workout.base, moduleColors.workout.dark] as const,
    ...DIAGONAL,
  },
  nutrition: {
    colors: [moduleColors.nutrition.base, moduleColors.nutrition.dark] as const,
    ...DIAGONAL,
  },
  skin: {
    colors: [moduleColors.skin.base, moduleColors.skin.dark] as const,
    ...DIAGONAL,
  },
  body: {
    colors: [moduleColors.body.base, moduleColors.body.dark] as const,
    ...DIAGONAL,
  },
  personalColor: {
    colors: [moduleColors.personalColor.base, moduleColors.personalColor.dark] as const,
    ...DIAGONAL,
  },
  face: {
    colors: [moduleColors.face.base, moduleColors.face.dark] as const,
    ...DIAGONAL,
  },
  hair: {
    colors: [moduleColors.hair.base, moduleColors.hair.dark] as const,
    ...DIAGONAL,
  },
  makeup: {
    colors: [moduleColors.makeup.base, moduleColors.makeup.dark] as const,
    ...DIAGONAL,
  },
  posture: {
    colors: [moduleColors.posture.base, moduleColors.posture.dark] as const,
    ...DIAGONAL,
  },
  oralHealth: {
    colors: [moduleColors.oralHealth.base, moduleColors.oralHealth.dark] as const,
    ...DIAGONAL,
  },

  // 전문성 (다크 블루 → 틸)
  professional: {
    colors: [professionalColors.primary, professionalColors.accent] as const,
    ...DIAGONAL,
  },

  // 히어로 (수직, 반투명 오버레이용)
  heroOverlay: {
    colors: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)'] as const,
    ...VERTICAL,
  },
} as const;

/** 모듈 키로 그라디언트 가져오기 */
export type GradientKey = keyof typeof gradients;

export function getModuleGradient(
  moduleKey: keyof typeof moduleColors
): GradientConfig {
  const mod = moduleColors[moduleKey];
  return {
    colors: [mod.base, mod.dark],
    ...DIAGONAL,
  };
}
