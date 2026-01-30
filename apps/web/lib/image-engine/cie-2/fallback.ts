/**
 * CIE-2: Fallback 데이터 생성
 *
 * @module lib/image-engine/cie-2/fallback
 * @description 에러/타임아웃 시 Mock 데이터 반환
 * @see docs/specs/SDD-CIE-2-FACE-DETECTION.md
 */

import type { CIE2Output, FrontalityResult } from '../types';
import { FEEDBACK_MESSAGES } from '../constants';

/**
 * 기본 정면성 Fallback 결과
 */
export function generateFrontalityFallback(): FrontalityResult {
  return {
    score: 85,
    isValid: true,
    angleDeviations: {
      pitch: 5,
      yaw: 5,
      roll: 3,
    },
    feedback: '얼굴 각도가 적절합니다.',
  };
}

/**
 * CIE-2 전체 Fallback 결과 생성
 *
 * @param processingTime - 처리 시간 (ms)
 * @returns CIE-2 Fallback 출력
 */
export function generateCIE2Fallback(processingTime = 0): CIE2Output {
  return {
    success: true,
    faceDetected: true,
    faceCount: 1,
    selectedFace: undefined, // Fallback에서는 얼굴 데이터 제외
    faceRegion: undefined,
    validation: {
      isAngleValid: true,
      angleFeedback: '얼굴 각도가 적절합니다.',
      frontalityResult: generateFrontalityFallback(),
    },
    metadata: {
      processingTime,
      modelVersion: 'fallback',
      confidence: 0.5,
    },
  };
}

/**
 * 얼굴 미감지 Fallback
 *
 * @param processingTime - 처리 시간
 * @returns 얼굴 미감지 CIE-2 출력
 */
export function generateNoFaceFallback(processingTime = 0): CIE2Output {
  return {
    success: true,
    faceDetected: false,
    faceCount: 0,
    validation: {
      isAngleValid: false,
      angleFeedback: FEEDBACK_MESSAGES.face.notDetected,
      frontalityResult: {
        score: 0,
        isValid: false,
        angleDeviations: { pitch: 0, yaw: 0, roll: 0 },
        feedback: FEEDBACK_MESSAGES.face.notDetected,
      },
    },
    metadata: {
      processingTime,
      modelVersion: 'fallback',
      confidence: 0,
    },
  };
}

/**
 * 에러 상태 Fallback
 *
 * @param errorMessage - 에러 메시지
 * @param processingTime - 처리 시간
 * @returns 에러 상태 CIE-2 출력
 */
export function generateErrorFallback(
  errorMessage: string,
  processingTime = 0
): CIE2Output {
  return {
    success: false,
    faceDetected: false,
    faceCount: 0,
    validation: {
      isAngleValid: false,
      angleFeedback: errorMessage,
      frontalityResult: {
        score: 0,
        isValid: false,
        angleDeviations: { pitch: 0, yaw: 0, roll: 0 },
        feedback: errorMessage,
      },
    },
    metadata: {
      processingTime,
      modelVersion: 'error',
      confidence: 0,
    },
  };
}

/**
 * 랜덤 Mock 데이터 생성 (테스트용)
 *
 * @returns 랜덤화된 CIE-2 출력
 */
export function generateRandomCIE2Mock(): CIE2Output {
  const faceDetected = Math.random() > 0.1; // 90% 감지
  const frontalityScore = 60 + Math.floor(Math.random() * 40); // 60-100
  const pitchDev = Math.random() * 15;
  const yawDev = Math.random() * 20;
  const rollDev = Math.random() * 25;

  const isValid = pitchDev < 10 && yawDev < 15 && rollDev < 20;

  return {
    success: true,
    faceDetected,
    faceCount: faceDetected ? 1 : 0,
    validation: {
      isAngleValid: isValid,
      angleFeedback: isValid
        ? '얼굴 각도가 적절합니다.'
        : '고개를 정면으로 향해주세요.',
      frontalityResult: {
        score: frontalityScore,
        isValid,
        angleDeviations: {
          pitch: pitchDev,
          yaw: yawDev,
          roll: rollDev,
        },
        feedback: isValid
          ? '얼굴 각도가 적절합니다.'
          : '고개가 기울어져 있습니다.',
      },
    },
    metadata: {
      processingTime: Math.random() * 500,
      modelVersion: 'mock',
      confidence: 0.8 + Math.random() * 0.2,
    },
  };
}
