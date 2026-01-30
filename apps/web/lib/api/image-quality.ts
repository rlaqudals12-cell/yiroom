/**
 * API용 이미지 품질 검증 헬퍼
 *
 * CIE-1 모듈을 API 라우트에서 쉽게 사용할 수 있도록 래핑
 *
 * @module lib/api/image-quality
 * @see docs/specs/SDD-CIE-1-IMAGE-QUALITY.md
 */

import { NextResponse } from 'next/server';
import {
  validateImageQuality,
  fromBase64,
  type CIE1Output,
  type RGBImageData,
} from '@/lib/image-engine';

// 검증 실패 시 반환 타입
export interface ImageQualityError {
  success: false;
  error: {
    code: 'IMAGE_QUALITY_ERROR';
    message: string;
    userMessage: string;
    details: {
      overallScore: number;
      primaryIssue: string | null;
      allIssues: string[];
      sharpnessScore: number;
      exposureVerdict: string;
      cctKelvin: number;
    };
  };
}

// 검증 성공 시 반환 타입
export interface ImageQualitySuccess {
  success: true;
  imageData: RGBImageData;
  qualityResult: CIE1Output;
}

export type ImageQualityResult = ImageQualitySuccess | ImageQualityError;

// 최소 허용 품질 점수
const MIN_ACCEPTABLE_SCORE = 40;

// 품질 검증 피드백 메시지 (한국어)
const USER_MESSAGES: Record<string, string> = {
  sharpness_rejected: '이미지가 너무 흐릿합니다. 더 선명한 사진을 사용해주세요.',
  sharpness_warning: '이미지가 약간 흐릿합니다. 가능하면 더 선명한 사진을 권장합니다.',
  underexposed: '이미지가 너무 어둡습니다. 밝은 조명에서 다시 촬영해주세요.',
  overexposed: '이미지가 너무 밝습니다. 조명을 조절하고 다시 촬영해주세요.',
  too_warm: '조명이 너무 따뜻합니다(노란빛). 자연광이나 형광등 아래에서 촬영해주세요.',
  too_cool: '조명이 너무 차갑습니다(파란빛). 자연광이나 따뜻한 조명에서 촬영해주세요.',
  resolution_low: '이미지 해상도가 너무 낮습니다. 더 높은 해상도의 사진을 사용해주세요.',
  default: '이미지 품질이 분석에 적합하지 않습니다. 다른 사진을 사용해주세요.',
};

/**
 * Base64 이미지의 품질 검증
 *
 * @param imageBase64 - Base64 인코딩된 이미지 (data:image/...;base64,... 형식)
 * @param options - 검증 옵션
 * @returns 검증 결과 또는 에러
 */
export async function validateImageForAnalysis(
  imageBase64: string,
  options: {
    minScore?: number;
    skipResolution?: boolean;
    allowWarnings?: boolean;
  } = {}
): Promise<ImageQualityResult> {
  const {
    minScore = MIN_ACCEPTABLE_SCORE,
    skipResolution = false,
    allowWarnings = true,
  } = options;

  try {
    // Base64 → RGBImageData 변환
    const imageData = await fromBase64(imageBase64);

    // CIE-1 품질 검증 실행
    const qualityResult = validateImageQuality(imageData, undefined, skipResolution);

    // 검증 통과 여부 판단
    const isAcceptable =
      qualityResult.isAcceptable ||
      (allowWarnings && qualityResult.overallScore >= minScore);

    if (!isAcceptable) {
      // 주요 이슈에 따른 사용자 메시지 선택
      const userMessage = getUserMessage(qualityResult);

      return {
        success: false,
        error: {
          code: 'IMAGE_QUALITY_ERROR',
          message: qualityResult.primaryIssue || 'Image quality insufficient',
          userMessage,
          details: {
            overallScore: qualityResult.overallScore,
            primaryIssue: qualityResult.primaryIssue,
            allIssues: qualityResult.allIssues,
            sharpnessScore: qualityResult.sharpness.score,
            exposureVerdict: qualityResult.exposure.verdict,
            cctKelvin: qualityResult.colorTemperature.kelvin,
          },
        },
      };
    }

    return {
      success: true,
      imageData,
      qualityResult,
    };
  } catch (error) {
    // 이미지 파싱 실패
    return {
      success: false,
      error: {
        code: 'IMAGE_QUALITY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to parse image',
        userMessage: '이미지를 처리할 수 없습니다. 올바른 이미지 파일인지 확인해주세요.',
        details: {
          overallScore: 0,
          primaryIssue: 'parse_error',
          allIssues: ['이미지 파싱 실패'],
          sharpnessScore: 0,
          exposureVerdict: 'unknown',
          cctKelvin: 0,
        },
      },
    };
  }
}

/**
 * 품질 검증 실패 시 NextResponse 생성
 */
export function imageQualityErrorResponse(error: ImageQualityError['error']): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: 422 } // Unprocessable Entity
  );
}

/**
 * CIE1Output에서 사용자 메시지 추출
 */
function getUserMessage(result: CIE1Output): string {
  // 선명도 문제
  if (result.sharpness.verdict === 'rejected') {
    return USER_MESSAGES.sharpness_rejected;
  }
  if (result.sharpness.verdict === 'warning') {
    return USER_MESSAGES.sharpness_warning;
  }

  // 노출 문제
  if (result.exposure.verdict === 'underexposed') {
    return USER_MESSAGES.underexposed;
  }
  if (result.exposure.verdict === 'overexposed') {
    return USER_MESSAGES.overexposed;
  }

  // 색온도 문제
  if (result.colorTemperature.verdict === 'too_warm') {
    return USER_MESSAGES.too_warm;
  }
  if (result.colorTemperature.verdict === 'too_cool') {
    return USER_MESSAGES.too_cool;
  }

  // 해상도 문제
  if (result.resolution && !result.resolution.isValid) {
    return USER_MESSAGES.resolution_low;
  }

  // 기본 메시지
  return USER_MESSAGES.default;
}

/**
 * 품질 검증 결과 로깅 (개발용)
 */
export function logQualityResult(
  module: string,
  result: CIE1Output,
  imageSize?: { width: number; height: number }
): void {
  const sizeStr = imageSize ? `${imageSize.width}x${imageSize.height}` : 'unknown';

  console.log(
    `[${module}] Image quality: score=${result.overallScore}, ` +
    `acceptable=${result.isAcceptable}, size=${sizeStr}, ` +
    `sharpness=${result.sharpness.score.toFixed(0)}, ` +
    `exposure=${result.exposure.verdict}, ` +
    `cct=${result.colorTemperature.kelvin}K`
  );

  if (result.allIssues.length > 0) {
    console.log(`[${module}] Issues: ${result.allIssues.join(', ')}`);
  }
}
