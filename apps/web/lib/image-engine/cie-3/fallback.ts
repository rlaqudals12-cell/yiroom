/**
 * CIE-3: Fallback 데이터 생성
 *
 * @module lib/image-engine/cie-3/fallback
 * @description 에러/타임아웃 시 Mock 데이터 반환
 * @see docs/specs/SDD-CIE-3-AWB-CORRECTION.md
 */

import type { CIE3Output, AWBCorrectionResult } from '../types';

/**
 * 기본 AWB 보정 Fallback 결과
 */
export function generateAWBCorrectionFallback(): AWBCorrectionResult {
  return {
    correctedImage: {
      data: new Uint8Array(0),
      width: 0,
      height: 0,
      channels: 3,
    },
    gains: { r: 1, g: 1, b: 1 },
    originalCCT: 6500,
    correctedCCT: 6500,
    method: 'none',
    confidence: 0.5,
  };
}

/**
 * CIE-3 전체 Fallback 결과 생성
 *
 * @param processingTime - 처리 시간 (ms)
 * @returns CIE-3 Fallback 출력
 */
export function generateCIE3Fallback(processingTime = 0): CIE3Output {
  return {
    success: true,
    correctionApplied: false,
    result: null,
    skinDetection: {
      detected: false,
      coverage: 0,
      mask: null,
    },
    metadata: {
      processingTime,
      methodUsed: 'fallback',
      confidence: 0.5,
    },
  };
}

/**
 * 보정 성공 Fallback (실제 이미지 데이터 없이)
 *
 * @param originalCCT - 원본 CCT
 * @param processingTime - 처리 시간
 * @returns 보정 성공 CIE-3 출력
 */
export function generateCorrectedFallback(
  originalCCT: number,
  processingTime = 0
): CIE3Output {
  return {
    success: true,
    correctionApplied: true,
    result: {
      correctedImage: {
        data: new Uint8Array(0),
        width: 0,
        height: 0,
        channels: 3,
      },
      gains: { r: 1.1, g: 1.0, b: 0.9 },
      originalCCT,
      correctedCCT: 6500,
      method: 'gray_world',
      confidence: 0.7,
    },
    skinDetection: {
      detected: true,
      coverage: 0.15,
      mask: null,
    },
    metadata: {
      processingTime,
      methodUsed: 'gray_world',
      confidence: 0.7,
    },
  };
}

/**
 * 에러 상태 Fallback
 *
 * @param errorMessage - 에러 메시지
 * @param processingTime - 처리 시간
 * @returns 에러 상태 CIE-3 출력
 */
export function generateErrorCIE3Fallback(
  errorMessage: string,
  processingTime = 0
): CIE3Output {
  return {
    success: false,
    correctionApplied: false,
    result: null,
    skinDetection: {
      detected: false,
      coverage: 0,
      mask: null,
    },
    metadata: {
      processingTime,
      methodUsed: 'error',
      confidence: 0,
    },
  };
}

/**
 * 랜덤 Mock 데이터 생성 (테스트용)
 *
 * @returns 랜덤화된 CIE-3 출력
 */
export function generateRandomCIE3Mock(): CIE3Output {
  const correctionApplied = Math.random() > 0.3;
  const originalCCT = 4000 + Math.floor(Math.random() * 4000);
  const skinCoverage = Math.random() * 0.4;

  const methods = ['gray_world', 'von_kries', 'skin_aware', 'none'] as const;
  const method = methods[Math.floor(Math.random() * methods.length)];

  return {
    success: true,
    correctionApplied,
    result: correctionApplied
      ? {
          correctedImage: {
            data: new Uint8Array(0),
            width: 0,
            height: 0,
            channels: 3,
          },
          gains: {
            r: 0.8 + Math.random() * 0.4,
            g: 0.9 + Math.random() * 0.2,
            b: 0.8 + Math.random() * 0.4,
          },
          originalCCT,
          correctedCCT: 6500 + (Math.random() - 0.5) * 500,
          method,
          confidence: 0.6 + Math.random() * 0.4,
        }
      : null,
    skinDetection: {
      detected: skinCoverage > 0.05,
      coverage: skinCoverage,
      mask: null,
    },
    metadata: {
      processingTime: Math.random() * 300,
      methodUsed: method,
      confidence: 0.6 + Math.random() * 0.4,
    },
  };
}
