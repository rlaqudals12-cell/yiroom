/**
 * 현실적 After 시뮬레이션 모듈
 * @description PC-1+ / S-1+ 시각적 변화 시뮬레이션
 *
 * 드레이프 색상이 피부에 자연스럽게 반사되는 효과를 시뮬레이션합니다.
 * α=0.3~0.5 블렌딩으로 과장되지 않은 현실적인 결과를 제공합니다.
 *
 * 물리적 원리:
 * - 드레이프의 반사광이 피부에 미치는 영향
 * - 피부 하층(hemoglobin)과 상층(melanin)의 광학적 상호작용
 * - 조명 조건에 따른 색온도 변화
 */

import type { DrapeOpticalProperties } from './drape-palette';
import {
  createOptimizedContext,
  rgbaToHsl,
  hslToRgba,
  getConstrainedCanvasSize,
} from './canvas-utils';

// ============================================
// 타입 정의
// ============================================

/** After 시뮬레이션 설정 */
export interface AfterSimulationConfig {
  /** 블렌딩 강도 (0.0~1.0, 권장: 0.3~0.5) */
  alpha: number;
  /** 밝기 보정 (-50~+50) */
  brightnessAdjust: number;
  /** 채도 보정 (-50~+50) */
  saturationAdjust: number;
  /** 반사광 영역 확장 (0.0~1.0) */
  reflectionSpread: number;
}

/** 시뮬레이션 결과 */
export interface AfterSimulationResult {
  /** After 이미지 데이터 URL */
  afterImageUrl: string;
  /** 적용된 설정 */
  config: AfterSimulationConfig;
  /** 처리 시간 (ms) */
  processingTime: number;
}

/** 프리셋 타입 */
export type SimulationPreset = 'subtle' | 'natural' | 'enhanced';

// ============================================
// 프리셋 설정
// ============================================

/** 시뮬레이션 프리셋 */
export const SIMULATION_PRESETS: Record<SimulationPreset, AfterSimulationConfig> = {
  /** 미묘한 변화 (α=0.25) - 보수적인 시뮬레이션 */
  subtle: {
    alpha: 0.25,
    brightnessAdjust: 3,
    saturationAdjust: 2,
    reflectionSpread: 0.3,
  },
  /** 자연스러운 변화 (α=0.35) - 권장 기본값 */
  natural: {
    alpha: 0.35,
    brightnessAdjust: 5,
    saturationAdjust: 5,
    reflectionSpread: 0.5,
  },
  /** 강조된 변화 (α=0.5) - 차이를 명확히 보여줌 */
  enhanced: {
    alpha: 0.5,
    brightnessAdjust: 8,
    saturationAdjust: 8,
    reflectionSpread: 0.7,
  },
};

/** 기본 설정 */
export const DEFAULT_CONFIG: AfterSimulationConfig = SIMULATION_PRESETS.natural;

// ============================================
// 핵심 시뮬레이션 함수
// ============================================

/**
 * 피부에 드레이프 반사 효과 적용
 *
 * 물리적 모델:
 * - 드레이프 색상의 반사광이 피부 표면에 영향
 * - 반사광 강도는 거리에 따라 감소 (상단으로 갈수록 약해짐)
 * - 피부 고유 색상과 블렌딩
 */
export function applyDrapeReflection(
  ctx: CanvasRenderingContext2D,
  faceMask: Uint8Array,
  drape: DrapeOpticalProperties,
  config: AfterSimulationConfig = DEFAULT_CONFIG
): void {
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  // 드레이프 RGB
  const drapeR = drape.rgb.r;
  const drapeG = drape.rgb.g;
  const drapeB = drape.rgb.b;

  // 드레이프 반사율 및 웜톤 계수
  const { reflectance, warmth, saturationBoost } = drape;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;

      // 마스크 영역만 처리
      if (faceMask[i] === 0) continue;

      const idx = i * 4;

      // 원본 RGB
      const origR = data[idx];
      const origG = data[idx + 1];
      const origB = data[idx + 2];

      // 반사광 강도 계산 (하단에서 상단으로 감소)
      // normalizedY: 0 (상단) ~ 1 (하단)
      const normalizedY = y / height;
      const reflectionIntensity = calculateReflectionIntensity(
        normalizedY,
        config.reflectionSpread,
        reflectance
      );

      // 실제 블렌딩 알파 (설정 알파 × 반사 강도)
      const effectiveAlpha = config.alpha * reflectionIntensity;

      // 드레이프 색상과 블렌딩
      let newR = origR * (1 - effectiveAlpha) + drapeR * effectiveAlpha;
      let newG = origG * (1 - effectiveAlpha) + drapeG * effectiveAlpha;
      let newB = origB * (1 - effectiveAlpha) + drapeB * effectiveAlpha;

      // 웜톤/쿨톤 보정
      if (warmth !== 0) {
        const warmthFactor = warmth * effectiveAlpha * 0.5;
        newR = Math.min(255, newR * (1 + warmthFactor * 0.1));
        newB = Math.max(0, newB * (1 - warmthFactor * 0.05));
      }

      // 채도 부스트 적용
      if (saturationBoost !== 0 || config.saturationAdjust !== 0) {
        const { h, s, l } = rgbaToHsl(newR, newG, newB);
        const totalSatBoost = saturationBoost * effectiveAlpha + config.saturationAdjust / 100;
        const newS = Math.max(0, Math.min(1, s + totalSatBoost * 0.3));
        const newL = Math.max(0, Math.min(1, l + (config.brightnessAdjust / 100) * effectiveAlpha));
        const adjusted = hslToRgba(h, newS, newL);
        newR = adjusted.r;
        newG = adjusted.g;
        newB = adjusted.b;
      }

      // 최종 값 적용
      data[idx] = Math.round(Math.max(0, Math.min(255, newR)));
      data[idx + 1] = Math.round(Math.max(0, Math.min(255, newG)));
      data[idx + 2] = Math.round(Math.max(0, Math.min(255, newB)));
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * 반사광 강도 계산
 *
 * 하단(드레이프 근처)에서 강하고, 상단으로 갈수록 약해짐
 * 지수 감쇠 모델 사용
 */
function calculateReflectionIntensity(
  normalizedY: number,
  spread: number,
  reflectance: number
): number {
  // 드레이프 영역 시작점 (하단 30%)
  const drapeStart = 0.7;

  if (normalizedY >= drapeStart) {
    // 드레이프 영역: 최대 강도
    return reflectance;
  }

  // 얼굴 영역: 거리에 따른 지수 감쇠
  const distance = drapeStart - normalizedY;
  const decayRate = 3 * (1 - spread); // spread가 높을수록 천천히 감쇠
  const intensity = reflectance * Math.exp(-distance * decayRate);

  return Math.max(0, intensity);
}

// ============================================
// 피부톤 보정 시뮬레이션
// ============================================

/**
 * 피부톤 개선 시뮬레이션 (S-1+ 스킨케어 효과)
 *
 * 사용처: 스킨케어 제품 사용 후 예상 효과 시뮬레이션
 */
export function applySkinToneCorrection(
  ctx: CanvasRenderingContext2D,
  faceMask: Uint8Array,
  correction: {
    /** 수분 개선 (-1~1) - 양수면 촉촉해보임 */
    hydration: number;
    /** 홍조 완화 (-1~1) - 양수면 홍조 감소 */
    rednessReduction: number;
    /** 브라이트닝 (-1~1) - 양수면 밝아짐 */
    brightening: number;
  },
  alpha: number = 0.4
): void {
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let i = 0; i < faceMask.length; i++) {
    if (faceMask[i] === 0) continue;

    const idx = i * 4;
    const { h, s, l } = rgbaToHsl(data[idx], data[idx + 1], data[idx + 2]);

    const newH = h;
    let newS = s;
    let newL = l;

    // 수분 개선: 채도 약간 낮추고 밝기 올림 (촉촉한 느낌)
    if (correction.hydration !== 0) {
      const hydrationEffect = correction.hydration * alpha * 0.1;
      newS = Math.max(0, Math.min(1, newS - hydrationEffect * 0.5));
      newL = Math.max(0, Math.min(1, newL + hydrationEffect));
    }

    // 홍조 완화: 빨간색 영역의 채도 감소
    if (correction.rednessReduction !== 0 && h < 0.1) {
      // Hue가 빨간색 범위
      const reductionEffect = correction.rednessReduction * alpha * 0.15;
      newS = Math.max(0, Math.min(1, newS - reductionEffect));
    }

    // 브라이트닝: 밝기 증가
    if (correction.brightening !== 0) {
      const brighteningEffect = correction.brightening * alpha * 0.12;
      newL = Math.max(0, Math.min(1, newL + brighteningEffect));
    }

    const { r, g, b } = hslToRgba(newH, newS, newL);
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
  }

  ctx.putImageData(imageData, 0, 0);
}

// ============================================
// 전체 시뮬레이션 파이프라인
// ============================================

/**
 * After 이미지 생성 (전체 파이프라인)
 *
 * @param originalImage - 원본 이미지
 * @param faceMask - 얼굴 마스크
 * @param drape - 적용할 드레이프
 * @param preset - 시뮬레이션 프리셋
 * @returns After 이미지 URL 및 메타데이터
 */
export async function generateAfterImage(
  originalImage: HTMLImageElement,
  faceMask: Uint8Array,
  drape: DrapeOpticalProperties,
  preset: SimulationPreset = 'natural'
): Promise<AfterSimulationResult> {
  const startTime = performance.now();

  // 캔버스 생성 (크기 제한으로 레이아웃 overflow 방지)
  const canvas = document.createElement('canvas');
  const { width, height } = getConstrainedCanvasSize(
    originalImage.naturalWidth || originalImage.width,
    originalImage.naturalHeight || originalImage.height
  );
  canvas.width = width;
  canvas.height = height;

  const ctx = createOptimizedContext(canvas, { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 컨텍스트 생성 실패');
  }

  // 원본 이미지 그리기 (스케일 적용)
  ctx.drawImage(originalImage, 0, 0, width, height);

  // 프리셋 설정 가져오기
  const config = SIMULATION_PRESETS[preset];

  // 드레이프 반사 효과 적용
  applyDrapeReflection(ctx, faceMask, drape, config);

  // Data URL로 변환
  const afterImageUrl = canvas.toDataURL('image/jpeg', 0.9);

  // 캔버스 정리
  canvas.width = 0;
  canvas.height = 0;

  const processingTime = performance.now() - startTime;

  return {
    afterImageUrl,
    config,
    processingTime,
  };
}

/**
 * 실시간 프리뷰용 (Canvas에 직접 렌더링)
 * - requestAnimationFrame과 함께 사용
 * - 메모리 효율적
 */
export function renderAfterPreview(
  targetCanvas: HTMLCanvasElement,
  originalImage: HTMLImageElement,
  faceMask: Uint8Array,
  drape: DrapeOpticalProperties,
  config: AfterSimulationConfig
): void {
  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // 크기 맞추기 (제한된 크기 사용)
  const { width, height } = getConstrainedCanvasSize(
    originalImage.naturalWidth || originalImage.width,
    originalImage.naturalHeight || originalImage.height
  );
  if (targetCanvas.width !== width || targetCanvas.height !== height) {
    targetCanvas.width = width;
    targetCanvas.height = height;
  }

  // 원본 그리기 (스케일 적용)
  ctx.drawImage(originalImage, 0, 0, width, height);

  // 효과 적용
  applyDrapeReflection(ctx, faceMask, drape, config);
}

// ============================================
// 슬라이더용 분할 렌더링
// ============================================

/**
 * Before/After 분할 렌더링
 *
 * @param canvas - 타겟 캔버스
 * @param beforeImage - Before 이미지
 * @param afterImage - After 이미지
 * @param splitPosition - 분할 위치 (0.0~1.0)
 * @param direction - 분할 방향
 */
export function renderSplitView(
  canvas: HTMLCanvasElement,
  beforeImage: HTMLImageElement | HTMLCanvasElement,
  afterImage: HTMLImageElement | HTMLCanvasElement,
  splitPosition: number,
  direction: 'horizontal' | 'vertical' = 'horizontal'
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;

  // 캔버스 클리어
  ctx.clearRect(0, 0, width, height);

  if (direction === 'horizontal') {
    // 수평 분할: 왼쪽 Before, 오른쪽 After
    const splitX = Math.round(width * splitPosition);

    // Before (왼쪽)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, height);
    ctx.clip();
    ctx.drawImage(beforeImage, 0, 0, width, height);
    ctx.restore();

    // After (오른쪽)
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, width - splitX, height);
    ctx.clip();
    ctx.drawImage(afterImage, 0, 0, width, height);
    ctx.restore();

    // 분할선
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, height);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    // 수직 분할: 상단 Before, 하단 After
    const splitY = Math.round(height * splitPosition);

    // Before (상단)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, splitY);
    ctx.clip();
    ctx.drawImage(beforeImage, 0, 0, width, height);
    ctx.restore();

    // After (하단)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, splitY, width, height - splitY);
    ctx.clip();
    ctx.drawImage(afterImage, 0, 0, width, height);
    ctx.restore();

    // 분할선
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(0, splitY);
    ctx.lineTo(width, splitY);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

// ============================================
// 유틸리티
// ============================================

/**
 * 프리셋에서 설정 가져오기
 */
export function getPresetConfig(preset: SimulationPreset): AfterSimulationConfig {
  return { ...SIMULATION_PRESETS[preset] };
}

/**
 * 커스텀 설정 생성
 */
export function createCustomConfig(
  base: SimulationPreset,
  overrides: Partial<AfterSimulationConfig>
): AfterSimulationConfig {
  return { ...SIMULATION_PRESETS[base], ...overrides };
}

/**
 * 알파 값 유효성 검사
 */
export function validateAlpha(alpha: number): number {
  return Math.max(0, Math.min(1, alpha));
}
