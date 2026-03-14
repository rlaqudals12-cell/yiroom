/**
 * 이미지 품질 검증 헬퍼 테스트
 * @description lib/api/image-quality.ts의 validateImageForAnalysis, imageQualityErrorResponse 테스트
 * @see SDD-CIE-1-IMAGE-QUALITY.md
 */
import { describe, it, expect, vi } from 'vitest';

// image-engine 모킹
const mockValidateImageQuality = vi.fn();
const mockFromBase64 = vi.fn();

vi.mock('@/lib/image-engine', () => ({
  validateImageQuality: (...args: unknown[]) => mockValidateImageQuality(...args),
  fromBase64: (...args: unknown[]) => mockFromBase64(...args),
}));

import {
  validateImageForAnalysis,
  imageQualityErrorResponse,
  type ImageQualityError,
} from '@/lib/api/image-quality';

// 공통 테스트 헬퍼: 정상 CIE1Output 생성
function createCIE1Output(overrides: Record<string, unknown> = {}) {
  return {
    isAcceptable: true,
    overallScore: 75,
    primaryIssue: null,
    allIssues: [],
    sharpness: { score: 80, verdict: 'accepted' },
    exposure: { verdict: 'normal' },
    colorTemperature: { kelvin: 5500, verdict: 'normal' },
    confidence: 0.85,
    resolution: { isValid: true },
    ...overrides,
  };
}

// 공통 테스트 헬퍼: 실패 CIE1Output 생성
function createFailedCIE1Output(overrides: Record<string, unknown> = {}) {
  return {
    isAcceptable: false,
    overallScore: 20,
    primaryIssue: 'sharpness_rejected',
    allIssues: ['이미지가 흐릿합니다'],
    sharpness: { score: 15, verdict: 'rejected' },
    exposure: { verdict: 'normal' },
    colorTemperature: { kelvin: 5500, verdict: 'normal' },
    confidence: 0.3,
    resolution: { isValid: true },
    ...overrides,
  };
}

describe('validateImageForAnalysis', () => {
  describe('정상 케이스 (품질 통과)', () => {
    it('이미지 품질이 충분하면 성공을 반환한다', async () => {
      const mockImageData = { data: new Uint8Array(100), width: 512, height: 512 };
      mockFromBase64.mockResolvedValue(mockImageData);
      mockValidateImageQuality.mockReturnValue(createCIE1Output());

      const result = await validateImageForAnalysis('data:image/jpeg;base64,abc123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.imageData).toEqual(mockImageData);
        expect(result.qualityResult.overallScore).toBe(75);
      }
    });

    it('isAcceptable=true이면 점수와 관계없이 성공한다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 100, height: 100 });
      mockValidateImageQuality.mockReturnValue(
        createCIE1Output({ isAcceptable: true, overallScore: 30 })
      );

      const result = await validateImageForAnalysis('data:image/jpeg;base64,abc');

      expect(result.success).toBe(true);
    });

    it('allowWarnings=true이고 점수가 minScore 이상이면 성공한다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 100, height: 100 });
      mockValidateImageQuality.mockReturnValue(
        createCIE1Output({ isAcceptable: false, overallScore: 50 })
      );

      const result = await validateImageForAnalysis('data:image/jpeg;base64,abc', {
        allowWarnings: true,
        minScore: 40,
      });

      expect(result.success).toBe(true);
    });

    it('커스텀 minScore 옵션이 적용된다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 100, height: 100 });
      mockValidateImageQuality.mockReturnValue(
        createCIE1Output({ isAcceptable: false, overallScore: 55 })
      );

      // minScore=60이면 55점은 실패
      const result = await validateImageForAnalysis('data:image/jpeg;base64,abc', {
        minScore: 60,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('품질 실패 케이스', () => {
    it('선명도 거부 시 적절한 에러 메시지를 반환한다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 100, height: 100 });
      mockValidateImageQuality.mockReturnValue(
        createFailedCIE1Output({
          sharpness: { score: 10, verdict: 'rejected' },
        })
      );

      const result = await validateImageForAnalysis('data:image/jpeg;base64,abc');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('IMAGE_QUALITY_ERROR');
        expect(result.error.userMessage).toContain('흐릿');
        expect(result.error.details.sharpnessScore).toBe(10);
      }
    });

    it('노출 부족 시 적절한 에러 메시지를 반환한다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 100, height: 100 });
      mockValidateImageQuality.mockReturnValue(
        createFailedCIE1Output({
          sharpness: { score: 50, verdict: 'accepted' },
          exposure: { verdict: 'underexposed' },
        })
      );

      const result = await validateImageForAnalysis('data:image/jpeg;base64,abc');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.userMessage).toContain('어둡');
      }
    });

    it('과노출 시 적절한 에러 메시지를 반환한다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 100, height: 100 });
      mockValidateImageQuality.mockReturnValue(
        createFailedCIE1Output({
          sharpness: { score: 50, verdict: 'accepted' },
          exposure: { verdict: 'overexposed' },
        })
      );

      const result = await validateImageForAnalysis('data:image/jpeg;base64,abc');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.userMessage).toContain('밝');
      }
    });

    it('색온도가 너무 따뜻하면 적절한 메시지를 반환한다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 100, height: 100 });
      mockValidateImageQuality.mockReturnValue(
        createFailedCIE1Output({
          sharpness: { score: 50, verdict: 'accepted' },
          colorTemperature: { kelvin: 7000, verdict: 'too_warm' },
        })
      );

      const result = await validateImageForAnalysis('data:image/jpeg;base64,abc');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.userMessage).toContain('따뜻');
      }
    });

    it('색온도가 너무 차가우면 적절한 메시지를 반환한다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 100, height: 100 });
      mockValidateImageQuality.mockReturnValue(
        createFailedCIE1Output({
          sharpness: { score: 50, verdict: 'accepted' },
          colorTemperature: { kelvin: 3000, verdict: 'too_cool' },
        })
      );

      const result = await validateImageForAnalysis('data:image/jpeg;base64,abc');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.userMessage).toContain('차갑');
      }
    });

    it('해상도 부족 시 적절한 메시지를 반환한다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 50, height: 50 });
      mockValidateImageQuality.mockReturnValue(
        createFailedCIE1Output({
          sharpness: { score: 50, verdict: 'accepted' },
          resolution: { isValid: false },
        })
      );

      const result = await validateImageForAnalysis('data:image/jpeg;base64,abc');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.userMessage).toContain('해상도');
      }
    });

    it('알 수 없는 이슈 시 기본 메시지를 반환한다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 100, height: 100 });
      mockValidateImageQuality.mockReturnValue(
        createFailedCIE1Output({
          sharpness: { score: 50, verdict: 'accepted' },
          exposure: { verdict: 'normal' },
          colorTemperature: { kelvin: 5000, verdict: 'normal' },
          resolution: { isValid: true },
        })
      );

      const result = await validateImageForAnalysis('data:image/jpeg;base64,abc');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.userMessage).toContain('적합하지 않습니다');
      }
    });

    it('에러 details에 모든 품질 정보가 포함된다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 100, height: 100 });
      mockValidateImageQuality.mockReturnValue(
        createFailedCIE1Output({
          overallScore: 25,
          primaryIssue: 'sharpness_rejected',
          allIssues: ['흐릿함', '어두움'],
          sharpness: { score: 12, verdict: 'rejected' },
          exposure: { verdict: 'underexposed' },
          colorTemperature: { kelvin: 4000, verdict: 'normal' },
        })
      );

      const result = await validateImageForAnalysis('data:image/jpeg;base64,abc');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details.overallScore).toBe(25);
        expect(result.error.details.primaryIssue).toBe('sharpness_rejected');
        expect(result.error.details.allIssues).toEqual(['흐릿함', '어두움']);
        expect(result.error.details.sharpnessScore).toBe(12);
        expect(result.error.details.exposureVerdict).toBe('underexposed');
        expect(result.error.details.cctKelvin).toBe(4000);
      }
    });
  });

  describe('이미지 파싱 에러', () => {
    it('Base64 파싱 실패 시 파싱 에러를 반환한다', async () => {
      mockFromBase64.mockRejectedValue(new Error('Invalid base64 string'));

      const result = await validateImageForAnalysis('invalid-data');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('IMAGE_QUALITY_ERROR');
        expect(result.error.message).toContain('Invalid base64');
        expect(result.error.userMessage).toContain('처리할 수 없습니다');
        expect(result.error.details.overallScore).toBe(0);
        expect(result.error.details.primaryIssue).toBe('parse_error');
      }
    });

    it('비 Error 객체 throw 시에도 폴백 메시지를 반환한다', async () => {
      mockFromBase64.mockRejectedValue('unexpected error');

      const result = await validateImageForAnalysis('data:image/jpeg;base64,bad');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to parse image');
        expect(result.error.details.sharpnessScore).toBe(0);
        expect(result.error.details.cctKelvin).toBe(0);
      }
    });
  });

  describe('옵션 테스트', () => {
    it('skipResolution 옵션이 validateImageQuality에 전달된다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 100, height: 100 });
      mockValidateImageQuality.mockReturnValue(createCIE1Output());

      await validateImageForAnalysis('data:image/jpeg;base64,abc', {
        skipResolution: true,
      });

      expect(mockValidateImageQuality).toHaveBeenCalledWith(expect.anything(), undefined, true);
    });

    it('allowWarnings=false이면 isAcceptable 기준만 사용한다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 100, height: 100 });
      mockValidateImageQuality.mockReturnValue(
        createCIE1Output({ isAcceptable: false, overallScore: 60 })
      );

      const result = await validateImageForAnalysis('data:image/jpeg;base64,abc', {
        allowWarnings: false,
      });

      // isAcceptable=false이고 allowWarnings=false이면
      // overallScore >= minScore 조건이 무시됨
      expect(result.success).toBe(false);
    });

    it('기본 옵션값이 올바르게 적용된다', async () => {
      mockFromBase64.mockResolvedValue({ data: new Uint8Array(10), width: 100, height: 100 });
      mockValidateImageQuality.mockReturnValue(createCIE1Output());

      await validateImageForAnalysis('data:image/jpeg;base64,abc');

      // skipResolution 기본값 false
      expect(mockValidateImageQuality).toHaveBeenCalledWith(expect.anything(), undefined, false);
    });
  });
});

describe('imageQualityErrorResponse', () => {
  it('422 상태 코드로 에러 응답을 생성한다', async () => {
    const error: ImageQualityError['error'] = {
      code: 'IMAGE_QUALITY_ERROR',
      message: 'sharpness_rejected',
      userMessage: '이미지가 너무 흐릿합니다.',
      details: {
        overallScore: 20,
        primaryIssue: 'sharpness_rejected',
        allIssues: ['흐릿함'],
        sharpnessScore: 10,
        exposureVerdict: 'normal',
        cctKelvin: 5500,
      },
    };

    const response = imageQualityErrorResponse(error);

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('IMAGE_QUALITY_ERROR');
    expect(body.error.userMessage).toContain('흐릿');
  });

  it('에러 details를 그대로 포함한다', async () => {
    const error: ImageQualityError['error'] = {
      code: 'IMAGE_QUALITY_ERROR',
      message: 'test',
      userMessage: 'test message',
      details: {
        overallScore: 35,
        primaryIssue: 'underexposed',
        allIssues: ['어두움', '흐릿함'],
        sharpnessScore: 30,
        exposureVerdict: 'underexposed',
        cctKelvin: 4200,
      },
    };

    const response = imageQualityErrorResponse(error);
    const body = await response.json();

    expect(body.error.details.overallScore).toBe(35);
    expect(body.error.details.allIssues).toHaveLength(2);
  });
});
