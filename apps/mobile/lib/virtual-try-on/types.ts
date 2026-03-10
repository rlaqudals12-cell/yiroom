/**
 * 가상 메이크업/헤어 시뮬레이션 타입 정의
 */

/** 시뮬레이션 유형 */
export type MakeupType = 'lip' | 'blush' | 'hair-color';

/** RGBA 색상 */
export interface RgbaColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

/** 메이크업 설정 */
export interface MakeupConfig {
  type: MakeupType;
  color: RgbaColor;
  /** 블렌딩 강도 (0.0 ~ 1.0) */
  opacity: number;
  /** 경계 페더링 반경 (px) */
  featherRadius?: number;
}

/** 메이크업 시뮬레이션 결과 */
export interface MakeupResult {
  /** 결과 이미지 data URL */
  dataUrl: string;
  /** 적용된 설정 */
  config: MakeupConfig;
  /** 처리 시간 (ms) */
  processingTimeMs: number;
}

/** 립 프리셋 색상 (12색) */
export const LIP_PRESETS: { name: string; color: RgbaColor }[] = [
  { name: '코랄 핑크', color: { r: 255, g: 127, b: 110, a: 1 } },
  { name: '로즈', color: { r: 220, g: 90, b: 100, a: 1 } },
  { name: '레드', color: { r: 210, g: 40, b: 40, a: 1 } },
  { name: '와인', color: { r: 140, g: 30, b: 50, a: 1 } },
  { name: '베리', color: { r: 160, g: 40, b: 90, a: 1 } },
  { name: '누드 핑크', color: { r: 210, g: 150, b: 140, a: 1 } },
  { name: '피치', color: { r: 255, g: 160, b: 120, a: 1 } },
  { name: '오렌지', color: { r: 230, g: 100, b: 50, a: 1 } },
  { name: '브릭', color: { r: 180, g: 70, b: 50, a: 1 } },
  { name: 'MLBB', color: { r: 190, g: 110, b: 110, a: 1 } },
  { name: '플럼', color: { r: 130, g: 50, b: 80, a: 1 } },
  { name: '푸치아', color: { r: 200, g: 50, b: 120, a: 1 } },
];

/** 헤어 컬러 설정 */
export interface HairColorConfig {
  /** 타겟 HSL 색상 (h: 0-1, s: 0-1, l: 0-1) */
  targetHsl: { h: number; s: number; l: number };
  /** 변환 강도 (0.0 ~ 1.0) */
  intensity: number;
  /** 경계 페더링 반경 (px) */
  featherRadius?: number;
}

/** 헤어 컬러 시뮬레이션 결과 */
export interface HairColorResult {
  /** 결과 이미지 data URL */
  dataUrl: string;
  /** 적용된 설정 */
  config: HairColorConfig;
  /** 처리 시간 (ms) */
  processingTimeMs: number;
}

/** 헤어 컬러 프리셋 (10색) */
export const HAIR_PRESETS: {
  name: string;
  targetHsl: { h: number; s: number; l: number };
  displayColor: RgbaColor;
}[] = [
  {
    name: '자연갈색',
    targetHsl: { h: 0.07, s: 0.5, l: 0.3 },
    displayColor: { r: 120, g: 75, b: 40, a: 1 },
  },
  {
    name: '다크브라운',
    targetHsl: { h: 0.055, s: 0.6, l: 0.2 },
    displayColor: { r: 80, g: 50, b: 25, a: 1 },
  },
  {
    name: '애쉬그레이',
    targetHsl: { h: 0.56, s: 0.1, l: 0.5 },
    displayColor: { r: 120, g: 130, b: 140, a: 1 },
  },
  {
    name: '체리레드',
    targetHsl: { h: 0.97, s: 0.7, l: 0.35 },
    displayColor: { r: 150, g: 30, b: 50, a: 1 },
  },
  {
    name: '밀크브라운',
    targetHsl: { h: 0.08, s: 0.4, l: 0.45 },
    displayColor: { r: 160, g: 120, b: 75, a: 1 },
  },
  {
    name: '핑크브라운',
    targetHsl: { h: 0.94, s: 0.35, l: 0.4 },
    displayColor: { r: 140, g: 70, b: 90, a: 1 },
  },
  {
    name: '블루블랙',
    targetHsl: { h: 0.61, s: 0.5, l: 0.15 },
    displayColor: { r: 20, g: 30, b: 55, a: 1 },
  },
  {
    name: '플래티넘',
    targetHsl: { h: 0.13, s: 0.2, l: 0.75 },
    displayColor: { r: 200, g: 195, b: 160, a: 1 },
  },
  {
    name: '카키브라운',
    targetHsl: { h: 0.13, s: 0.3, l: 0.35 },
    displayColor: { r: 115, g: 100, b: 65, a: 1 },
  },
  {
    name: '버건디',
    targetHsl: { h: 0.94, s: 0.6, l: 0.25 },
    displayColor: { r: 100, g: 25, b: 45, a: 1 },
  },
];

/** 블러셔 프리셋 색상 (6색) */
export const BLUSH_PRESETS: { name: string; color: RgbaColor }[] = [
  { name: '피치', color: { r: 255, g: 180, b: 150, a: 1 } },
  { name: '코랄', color: { r: 250, g: 150, b: 120, a: 1 } },
  { name: '핑크', color: { r: 240, g: 140, b: 160, a: 1 } },
  { name: '로즈', color: { r: 210, g: 120, b: 130, a: 1 } },
  { name: '라벤더', color: { r: 200, g: 150, b: 200, a: 1 } },
  { name: '선번트', color: { r: 220, g: 140, b: 100, a: 1 } },
];
