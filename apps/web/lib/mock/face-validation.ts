/**
 * 얼굴 이미지 검증 Mock
 * @description 다각도 촬영 시스템의 이미지 검증 Mock Fallback
 */

import type { FaceAngle, ValidateFaceImageResponse } from '@/types/visual-analysis';

/**
 * Mock 얼굴 이미지 검증 결과 생성
 * @param expectedAngle 기대하는 촬영 각도
 * @returns 검증 결과
 *
 * ⚠️ 중요: Mock은 항상 적합(suitable=true)을 반환합니다.
 * - AI 검증이 타임아웃/실패했을 때 Mock이 호출됨
 * - 이 때 랜덤 실패를 반환하면 사용자가 이유 없이 재시도해야 함
 * - 실제 이미지 품질 문제는 최종 AI 분석에서 처리됨
 */
export function generateMockFaceValidation(expectedAngle: FaceAngle): ValidateFaceImageResponse {
  // Mock은 항상 적합 반환 (AI 실패 시 사용자 블로킹 방지)
  // 실제 이미지 품질 검증은 최종 퍼스널 컬러 분석에서 수행됨
  return {
    suitable: true,
    detectedAngle: expectedAngle,
    quality: {
      lighting: 'good',
      makeupDetected: false,
      faceDetected: true,
      blur: false,
    },
  };
}

/**
 * 항상 적합한 결과 반환 (테스트용)
 * @description generateMockFaceValidation과 동일한 결과를 반환 (별칭)
 */
export function generateMockFaceValidationSuccess(
  expectedAngle: FaceAngle
): ValidateFaceImageResponse {
  return generateMockFaceValidation(expectedAngle);
}

/**
 * 항상 부적합한 결과 반환 (테스트용)
 */
export function generateMockFaceValidationFailure(
  _expectedAngle: FaceAngle,
  reason: string = '테스트 실패'
): ValidateFaceImageResponse {
  return {
    suitable: false,
    reason,
    detectedAngle: 'unknown',
    quality: {
      lighting: 'good',
      makeupDetected: false,
      faceDetected: false,
      blur: false,
    },
  };
}
