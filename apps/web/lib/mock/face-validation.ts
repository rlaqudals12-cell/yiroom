/**
 * 얼굴 이미지 검증 Mock
 * @description 다각도 촬영 시스템의 이미지 검증 Mock Fallback
 */

import type {
  FaceAngle,
  ValidateFaceImageResponse,
  FaceImageQuality,
  LightingQuality,
} from '@/types/visual-analysis';

/**
 * Mock 얼굴 이미지 검증 결과 생성
 * @param expectedAngle 기대하는 촬영 각도
 * @returns 검증 결과
 */
export function generateMockFaceValidation(expectedAngle: FaceAngle): ValidateFaceImageResponse {
  // 80% 확률로 적합, 20% 확률로 부적합 (현실적 시뮬레이션)
  const isSuitable = Math.random() > 0.2;

  // 각도 감지 (적합 시 기대 각도, 부적합 시 랜덤)
  const detectedAngle: FaceAngle | 'unknown' = isSuitable
    ? expectedAngle
    : getRandomAngle(expectedAngle);

  // 품질 정보 생성
  const quality = generateMockQuality(isSuitable);

  // 부적합 사유 결정
  const reason = !isSuitable ? getReasonMessage(expectedAngle, detectedAngle, quality) : undefined;

  return {
    suitable: isSuitable,
    reason,
    detectedAngle,
    quality,
  };
}

/**
 * 랜덤 각도 반환 (기대 각도 제외)
 */
function getRandomAngle(exclude: FaceAngle): FaceAngle | 'unknown' {
  const angles: (FaceAngle | 'unknown')[] = ['front', 'left', 'right', 'unknown'];
  const filtered = angles.filter((a) => a !== exclude);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Mock 품질 정보 생성
 */
function generateMockQuality(isSuitable: boolean): FaceImageQuality {
  if (isSuitable) {
    return {
      lighting: 'good',
      makeupDetected: Math.random() > 0.7, // 30% 확률로 메이크업
      faceDetected: true,
      blur: false,
    };
  }

  // 부적합 케이스 - 랜덤하게 문제 발생
  const problems = Math.random();

  if (problems < 0.25) {
    // 얼굴 미감지
    return {
      lighting: 'good',
      makeupDetected: false,
      faceDetected: false,
      blur: false,
    };
  } else if (problems < 0.5) {
    // 조명 문제
    const lightingOptions: LightingQuality[] = ['dark', 'bright', 'uneven'];
    return {
      lighting: lightingOptions[Math.floor(Math.random() * 3)],
      makeupDetected: false,
      faceDetected: true,
      blur: false,
    };
  } else if (problems < 0.75) {
    // 흐림
    return {
      lighting: 'good',
      makeupDetected: false,
      faceDetected: true,
      blur: true,
    };
  } else {
    // 각도 불일치 (품질은 양호)
    return {
      lighting: 'good',
      makeupDetected: false,
      faceDetected: true,
      blur: false,
    };
  }
}

/**
 * 부적합 사유 메시지 생성
 */
function getReasonMessage(
  expected: FaceAngle,
  detected: FaceAngle | 'unknown',
  quality: FaceImageQuality
): string {
  // 얼굴 미감지
  if (!quality.faceDetected) {
    return '얼굴이 명확하게 보이지 않아요';
  }

  // 조명 문제
  if (quality.lighting === 'dark') {
    return '조명이 너무 어두워요';
  }
  if (quality.lighting === 'bright') {
    return '조명이 너무 밝아요';
  }
  if (quality.lighting === 'uneven') {
    return '조명이 고르지 않아요';
  }

  // 흐림
  if (quality.blur) {
    return '사진이 흐릿해요. 카메라를 고정해주세요';
  }

  // 각도 불일치
  const angleLabels: Record<FaceAngle | 'unknown', string> = {
    front: '정면',
    left: '좌측',
    right: '우측',
    unknown: '알 수 없는',
  };

  return `${angleLabels[expected]} 사진이 필요해요 (현재: ${angleLabels[detected]})`;
}

/**
 * 항상 적합한 결과 반환 (테스트용)
 */
export function generateMockFaceValidationSuccess(
  expectedAngle: FaceAngle
): ValidateFaceImageResponse {
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
 * 항상 부적합한 결과 반환 (테스트용)
 */
export function generateMockFaceValidationFailure(
  expectedAngle: FaceAngle,
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
