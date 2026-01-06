/**
 * 얼굴 이미지 검증 API 테스트
 * @description POST /api/validate/face-image 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 모듈 설정
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
  validateFaceImage: vi.fn(),
}));

import { POST } from '@/app/api/validate/face-image/route';
import { auth } from '@clerk/nextjs/server';
import { validateFaceImage } from '@/lib/gemini';

// Mock 요청 헬퍼
function createMockRequest(body: unknown): Request {
  return {
    url: 'http://localhost/api/validate/face-image',
    json: () => Promise.resolve(body),
  } as Request;
}

// Mock 검증 결과
const mockValidationSuccess = {
  suitable: true,
  detectedAngle: 'front' as const,
  quality: {
    lighting: 'good' as const,
    makeupDetected: false,
    faceDetected: true,
    blur: false,
  },
};

const mockValidationFailure = {
  suitable: false,
  reason: '정면 사진이 필요해요',
  detectedAngle: 'left' as const,
  quality: {
    lighting: 'good' as const,
    makeupDetected: false,
    faceDetected: true,
    blur: false,
  },
};

describe('POST /api/validate/face-image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<
      ReturnType<typeof auth>
    >);
    vi.mocked(validateFaceImage).mockResolvedValue(mockValidationSuccess);
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await POST(
        createMockRequest({
          imageBase64: 'test',
          expectedAngle: 'front',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('입력 검증', () => {
    it('이미지가 없으면 400을 반환한다', async () => {
      const response = await POST(
        createMockRequest({
          expectedAngle: 'front',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Image is required');
    });

    it('expectedAngle이 없으면 400을 반환한다', async () => {
      const response = await POST(
        createMockRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Valid expectedAngle is required (front, left, right)');
    });

    it('유효하지 않은 expectedAngle은 400을 반환한다', async () => {
      const response = await POST(
        createMockRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          expectedAngle: 'invalid',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Valid expectedAngle is required (front, left, right)');
    });
  });

  describe('검증 성공', () => {
    it('정면 사진 검증 성공 시 suitable: true를 반환한다', async () => {
      const response = await POST(
        createMockRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          expectedAngle: 'front',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.suitable).toBe(true);
      expect(json.detectedAngle).toBe('front');
      expect(validateFaceImage).toHaveBeenCalledWith('data:image/jpeg;base64,/9j/test', 'front');
    });

    it('좌측 사진 검증 성공 시 결과를 반환한다', async () => {
      vi.mocked(validateFaceImage).mockResolvedValue({
        ...mockValidationSuccess,
        detectedAngle: 'left',
      });

      const response = await POST(
        createMockRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          expectedAngle: 'left',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.suitable).toBe(true);
      expect(json.detectedAngle).toBe('left');
    });

    it('우측 사진 검증 성공 시 결과를 반환한다', async () => {
      vi.mocked(validateFaceImage).mockResolvedValue({
        ...mockValidationSuccess,
        detectedAngle: 'right',
      });

      const response = await POST(
        createMockRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          expectedAngle: 'right',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.suitable).toBe(true);
      expect(json.detectedAngle).toBe('right');
    });
  });

  describe('검증 실패', () => {
    it('각도 불일치 시 suitable: false와 reason을 반환한다', async () => {
      vi.mocked(validateFaceImage).mockResolvedValue(mockValidationFailure);

      const response = await POST(
        createMockRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          expectedAngle: 'front',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.suitable).toBe(false);
      expect(json.reason).toBe('정면 사진이 필요해요');
      expect(json.detectedAngle).toBe('left');
    });

    it('얼굴 미감지 시 faceDetected: false를 반환한다', async () => {
      vi.mocked(validateFaceImage).mockResolvedValue({
        suitable: false,
        reason: '얼굴이 명확하게 보이지 않아요',
        detectedAngle: 'unknown',
        quality: {
          lighting: 'good',
          makeupDetected: false,
          faceDetected: false,
          blur: false,
        },
      });

      const response = await POST(
        createMockRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          expectedAngle: 'front',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.suitable).toBe(false);
      expect(json.quality.faceDetected).toBe(false);
    });

    it('어두운 조명 시 lighting: dark를 반환한다', async () => {
      vi.mocked(validateFaceImage).mockResolvedValue({
        suitable: false,
        reason: '조명이 너무 어두워요',
        detectedAngle: 'front',
        quality: {
          lighting: 'dark',
          makeupDetected: false,
          faceDetected: true,
          blur: false,
        },
      });

      const response = await POST(
        createMockRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          expectedAngle: 'front',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.suitable).toBe(false);
      expect(json.quality.lighting).toBe('dark');
    });
  });

  describe('품질 정보', () => {
    it('메이크업 감지 시 makeupDetected: true를 반환한다', async () => {
      vi.mocked(validateFaceImage).mockResolvedValue({
        suitable: true,
        detectedAngle: 'front',
        quality: {
          lighting: 'good',
          makeupDetected: true,
          faceDetected: true,
          blur: false,
        },
      });

      const response = await POST(
        createMockRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          expectedAngle: 'front',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.suitable).toBe(true); // 메이크업이어도 적합 가능
      expect(json.quality.makeupDetected).toBe(true);
    });

    it('흐림 감지 시 blur: true를 반환한다', async () => {
      vi.mocked(validateFaceImage).mockResolvedValue({
        suitable: false,
        reason: '사진이 흐릿해요',
        detectedAngle: 'front',
        quality: {
          lighting: 'good',
          makeupDetected: false,
          faceDetected: true,
          blur: true,
        },
      });

      const response = await POST(
        createMockRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          expectedAngle: 'front',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.suitable).toBe(false);
      expect(json.quality.blur).toBe(true);
    });
  });

  describe('에러 처리', () => {
    it('AI 함수 에러 시 500을 반환한다', async () => {
      vi.mocked(validateFaceImage).mockRejectedValue(new Error('AI Error'));

      const response = await POST(
        createMockRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          expectedAngle: 'front',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });
});
