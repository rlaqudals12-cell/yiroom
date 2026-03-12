/**
 * Virtual Try-On API 테스트
 * @description POST /api/fitting/try-on 테스트
 *   sharp SVG compositing 기반 메이크업/헤어 컬러 시뮬레이션
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 모듈 설정
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// sharp mock: 체이닝 패턴 재현
const mockToBuffer = vi.fn();
const mockJpeg = vi.fn();
const mockComposite = vi.fn();
const mockResize = vi.fn();
const mockMetadata = vi.fn();

vi.mock('sharp', () => {
  const sharpFn = vi.fn(() => ({
    metadata: mockMetadata,
    resize: mockResize,
  }));
  return { default: sharpFn };
});

// import는 mock 선언 이후
import { POST } from '@/app/api/fitting/try-on/route';
import { auth } from '@clerk/nextjs/server';
import sharp from 'sharp';
import { NextRequest } from 'next/server';

// Mock 요청 헬퍼
function createMockPostRequest(body: unknown): NextRequest {
  const url = 'http://localhost/api/fitting/try-on';
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// 유효한 요청 데이터
const validBody = {
  imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==',
  type: 'lip' as const,
  color: { r: 200, g: 50, b: 80, a: 0.8 },
};

// sharp 체이닝 결과 버퍼
const RESULT_BUFFER = Buffer.from('fake-jpeg-result');

describe('POST /api/fitting/try-on', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 인증 mock
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<
      ReturnType<typeof auth>
    >);

    // sharp 체이닝 mock 초기화
    mockMetadata.mockResolvedValue({ width: 512, height: 683 });
    mockResize.mockReturnValue({ composite: mockComposite });
    mockComposite.mockReturnValue({ jpeg: mockJpeg });
    mockJpeg.mockReturnValue({ toBuffer: mockToBuffer });
    mockToBuffer.mockResolvedValue(RESULT_BUFFER);
  });

  // ────────────────────────────────────────
  // 인증
  // ────────────────────────────────────────
  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await POST(createMockPostRequest(validBody));
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('AUTH_ERROR');
      expect(json.error.userMessage).toBe('로그인이 필요합니다.');
    });
  });

  // ────────────────────────────────────────
  // 입력 검증
  // ────────────────────────────────────────
  describe('입력 검증', () => {
    it('imageBase64가 없으면 400을 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({ type: 'lip', color: { r: 200, g: 50, b: 80, a: 0.8 } })
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('imageBase64가 빈 문자열이면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({ ...validBody, imageBase64: '' }));

      expect(response.status).toBe(400);
    });

    it('유효하지 않은 type이면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({ ...validBody, type: 'tattoo' }));

      expect(response.status).toBe(400);
    });

    it('type이 없으면 400을 반환한다', async () => {
      const bodyWithoutType = { imageBase64: validBody.imageBase64, color: validBody.color };
      const response = await POST(createMockPostRequest(bodyWithoutType));

      expect(response.status).toBe(400);
    });

    it('color가 없으면 400을 반환한다', async () => {
      const bodyWithoutColor = { imageBase64: validBody.imageBase64, type: validBody.type };
      const response = await POST(createMockPostRequest(bodyWithoutColor));

      expect(response.status).toBe(400);
    });

    it('color.r이 범위 밖이면 400을 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({ ...validBody, color: { r: 300, g: 50, b: 80, a: 0.8 } })
      );

      expect(response.status).toBe(400);
    });

    it('color.g가 음수이면 400을 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({ ...validBody, color: { r: 200, g: -1, b: 80, a: 0.8 } })
      );

      expect(response.status).toBe(400);
    });

    it('color.a가 1을 초과하면 400을 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({ ...validBody, color: { r: 200, g: 50, b: 80, a: 1.5 } })
      );

      expect(response.status).toBe(400);
    });

    it('opacity가 범위 밖이면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({ ...validBody, opacity: 2.0 }));

      expect(response.status).toBe(400);
    });
  });

  // ────────────────────────────────────────
  // 타입별 성공 케이스
  // ────────────────────────────────────────
  describe('타입별 성공 케이스', () => {
    it('lip 타입 요청에 200과 결과 이미지를 반환한다', async () => {
      const response = await POST(createMockPostRequest({ ...validBody, type: 'lip' }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.type).toBe('lip');
      expect(json.data.resultBase64).toContain('data:image/jpeg;base64,');
    });

    it('blush 타입 요청에 200을 반환한다', async () => {
      const response = await POST(createMockPostRequest({ ...validBody, type: 'blush' }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.type).toBe('blush');
    });

    it('eyeshadow 타입 요청에 200을 반환한다', async () => {
      const response = await POST(createMockPostRequest({ ...validBody, type: 'eyeshadow' }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.type).toBe('eyeshadow');
    });

    it('foundation 타입 요청에 200을 반환한다', async () => {
      const response = await POST(createMockPostRequest({ ...validBody, type: 'foundation' }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.type).toBe('foundation');
    });

    it('hair-color 타입 요청에 200을 반환한다', async () => {
      const response = await POST(createMockPostRequest({ ...validBody, type: 'hair-color' }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.type).toBe('hair-color');
    });
  });

  // ────────────────────────────────────────
  // opacity 처리
  // ────────────────────────────────────────
  describe('opacity 처리', () => {
    it('opacity가 제공되면 커스텀 값을 사용한다', async () => {
      const response = await POST(createMockPostRequest({ ...validBody, opacity: 0.9 }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      // sharp가 호출됐는지 확인 (SVG 내부에 opacity 0.9가 포함됨)
      expect(vi.mocked(sharp)).toHaveBeenCalled();
    });

    it('opacity가 생략되면 타입별 기본값을 사용한다', async () => {
      const response = await POST(createMockPostRequest(validBody));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('opacity가 0이면 유효하다', async () => {
      const response = await POST(createMockPostRequest({ ...validBody, opacity: 0 }));

      expect(response.status).toBe(200);
    });

    it('opacity가 1이면 유효하다', async () => {
      const response = await POST(createMockPostRequest({ ...validBody, opacity: 1 }));

      expect(response.status).toBe(200);
    });
  });

  // ────────────────────────────────────────
  // 응답 형식
  // ────────────────────────────────────────
  describe('응답 형식', () => {
    it('성공 응답에 필수 필드가 모두 포함된다', async () => {
      const response = await POST(createMockPostRequest(validBody));
      const json = await response.json();

      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('data');
      expect(json.data).toHaveProperty('resultBase64');
      expect(json.data).toHaveProperty('processingTimeMs');
      expect(json.data).toHaveProperty('type');
    });

    it('resultBase64가 data:image/jpeg;base64, 접두사를 포함한다', async () => {
      const response = await POST(createMockPostRequest(validBody));
      const json = await response.json();

      expect(json.data.resultBase64).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('processingTimeMs가 0 이상의 숫자이다', async () => {
      const response = await POST(createMockPostRequest(validBody));
      const json = await response.json();

      expect(typeof json.data.processingTimeMs).toBe('number');
      expect(json.data.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('type이 요청의 type과 일치한다', async () => {
      const response = await POST(createMockPostRequest({ ...validBody, type: 'blush' }));
      const json = await response.json();

      expect(json.data.type).toBe('blush');
    });

    it('에러 응답에 code, message, userMessage가 포함된다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await POST(createMockPostRequest(validBody));
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error).toHaveProperty('code');
      expect(json.error).toHaveProperty('message');
      expect(json.error).toHaveProperty('userMessage');
    });
  });

  // ────────────────────────────────────────
  // sharp 연동
  // ────────────────────────────────────────
  describe('sharp 연동', () => {
    it('sharp에 base64 디코딩된 Buffer를 전달한다', async () => {
      await POST(createMockPostRequest(validBody));

      // sharp가 Buffer로 호출됐는지 확인
      expect(vi.mocked(sharp)).toHaveBeenCalledWith(expect.any(Buffer));
    });

    it('base64 접두사를 제거한 후 디코딩한다', async () => {
      const bodyWithPrefix = {
        ...validBody,
        imageBase64: 'data:image/png;base64,dGVzdA==',
      };

      await POST(createMockPostRequest(bodyWithPrefix));

      // sharp 첫 호출의 첫 인자 (metadata 호출)
      const firstCallArg = vi.mocked(sharp).mock.calls[0][0] as Buffer;
      // 'dGVzdA==' = 'test' in base64
      expect(firstCallArg.toString()).toBe('test');
    });

    it('metadata에서 width/height가 없으면 기본값 512x683을 사용한다', async () => {
      mockMetadata.mockResolvedValue({ width: undefined, height: undefined });

      const response = await POST(createMockPostRequest(validBody));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('composite에 SVG buffer와 blend:over를 전달한다', async () => {
      await POST(createMockPostRequest(validBody));

      expect(mockComposite).toHaveBeenCalledWith([{ input: expect.any(Buffer), blend: 'over' }]);
    });

    it('jpeg quality 85로 인코딩한다', async () => {
      await POST(createMockPostRequest(validBody));

      expect(mockJpeg).toHaveBeenCalledWith({ quality: 85 });
    });
  });

  // ────────────────────────────────────────
  // 에러 핸들링
  // ────────────────────────────────────────
  describe('에러 핸들링', () => {
    it('sharp metadata 에러 시 500을 반환한다', async () => {
      mockMetadata.mockRejectedValue(new Error('Invalid image'));

      const response = await POST(createMockPostRequest(validBody));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INTERNAL_ERROR');
      expect(json.error.userMessage).toBe('시뮬레이션 처리 중 오류가 발생했습니다.');
    });

    it('sharp composite 에러 시 500을 반환한다', async () => {
      mockComposite.mockReturnValue({
        jpeg: vi.fn().mockReturnValue({
          toBuffer: vi.fn().mockRejectedValue(new Error('Composite failed')),
        }),
      });

      const response = await POST(createMockPostRequest(validBody));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INTERNAL_ERROR');
    });

    it('body 파싱 실패 시 500을 반환한다', async () => {
      const url = 'http://localhost/api/fitting/try-on';
      const req = new NextRequest(url, {
        method: 'POST',
        body: 'not valid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INTERNAL_ERROR');
    });
  });

  // ────────────────────────────────────────
  // 엣지 케이스
  // ────────────────────────────────────────
  describe('엣지 케이스', () => {
    it('접두사 없는 순수 base64도 처리한다', async () => {
      const response = await POST(
        createMockPostRequest({
          ...validBody,
          imageBase64: '/9j/4AAQSkZJRgABAQ==',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('color 경계값 (0,0,0,0)이 유효하다', async () => {
      const response = await POST(
        createMockPostRequest({ ...validBody, color: { r: 0, g: 0, b: 0, a: 0 } })
      );

      expect(response.status).toBe(200);
    });

    it('color 경계값 (255,255,255,1)이 유효하다', async () => {
      const response = await POST(
        createMockPostRequest({ ...validBody, color: { r: 255, g: 255, b: 255, a: 1 } })
      );

      expect(response.status).toBe(200);
    });

    it('소수점 color.r은 400을 반환한다 (정수만 허용)', async () => {
      const response = await POST(
        createMockPostRequest({ ...validBody, color: { r: 200.5, g: 50, b: 80, a: 0.8 } })
      );

      expect(response.status).toBe(400);
    });
  });
});
