/**
 * PC-1 퍼스널 컬러 분석 결과 조회 API 테스트
 * @description GET /api/analyze/personal-color/[id] 테스트
 * @version 1.0
 * @date 2026-02-06
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 모듈 설정 (import 전에 선언)
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

import { GET } from '@/app/api/analyze/personal-color/[id]/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// Mock 데이터: DB에서 반환되는 퍼스널 컬러 분석 결과
const mockAssessment = {
  id: 'pc-uuid-123',
  clerk_user_id: 'user_test123',
  season: 'Spring',
  undertone: 'Warm',
  confidence: 0.85,
  best_colors: ['#FFD700', '#FF6347', '#98FB98'],
  worst_colors: ['#000080', '#4B0082'],
  face_image_url: null,
  result_json: {
    seasonType: 'spring',
    tone: 'warm',
    depth: 'light',
  },
  created_at: '2026-01-15T10:00:00Z',
};

// 요청 헬퍼: GET 라우트 호출
function callGET(id: string) {
  const request = new Request('http://localhost/api/analyze/personal-color/' + id, {
    method: 'GET',
  });
  return GET(request, { params: Promise.resolve({ id }) });
}

// params가 빈 문자열인 경우를 위한 헬퍼
function callGETWithEmptyId() {
  const request = new Request('http://localhost/api/analyze/personal-color/', {
    method: 'GET',
  });
  return GET(request, { params: Promise.resolve({ id: '' }) });
}

describe('GET /api/analyze/personal-color/[id]', () => {
  // Supabase mock 체인
  const mockCreateSignedUrl = vi.fn();
  const mockSingle = vi.fn();
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: mockSingle,
    storage: {
      from: vi.fn().mockReturnValue({
        createSignedUrl: mockCreateSignedUrl,
      }),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // 기본: 인증된 사용자
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<
      ReturnType<typeof auth>
    >);

    // 기본: Supabase 클라이언트
    vi.mocked(createServiceRoleClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );

    // console.error, console.warn, console.log 억제
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  // ─── 인증 ─────────────────────────────────────────────────────
  describe('인증', () => {
    it('미인증 사용자는 401을 반환한다', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      // Act
      const response = await callGET('pc-uuid-123');
      const json = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(json.error).toBe('인증이 필요합니다.');
      expect(json.code).toBe('UNAUTHORIZED');
    });
  });

  // ─── 입력 검증 ────────────────────────────────────────────────
  describe('입력 검증', () => {
    it('ID가 빈 문자열이면 400을 반환한다', async () => {
      // Act
      const response = await callGETWithEmptyId();
      const json = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(json.error).toBe('분석 ID가 필요합니다.');
      expect(json.code).toBe('BAD_REQUEST');
    });
  });

  // ─── 데이터 조회 ──────────────────────────────────────────────
  describe('데이터 조회', () => {
    it('존재하지 않는 ID는 404를 반환한다 (PGRST116)', async () => {
      // Arrange
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      // Act
      const response = await callGET('nonexistent-id');
      const json = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(json.error).toBe('분석 결과를 찾을 수 없습니다.');
      expect(json.code).toBe('NOT_FOUND');
    });

    it('일반 DB 에러 시 500을 반환한다', async () => {
      // Arrange
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST001', message: 'Connection refused' },
      });

      // Act
      const response = await callGET('pc-uuid-123');
      const json = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(json.error).toBe('데이터 조회에 실패했습니다.');
      expect(json.code).toBe('INTERNAL_ERROR');
      expect(console.error).toHaveBeenCalledWith(
        '[PC-1] Database query error:',
        expect.objectContaining({ code: 'PGRST001' })
      );
    });

    it('성공 시 분석 결과를 반환한다', async () => {
      // Arrange
      mockSingle.mockResolvedValue({
        data: { ...mockAssessment, face_image_url: null },
        error: null,
      });

      // Act
      const response = await callGET('pc-uuid-123');
      const json = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('pc-uuid-123');
      expect(json.data.season).toBe('Spring');
      expect(json.data.clerk_user_id).toBe('user_test123');
    });

    it('clerk_user_id 필터가 적용된다 (본인 데이터만 조회)', async () => {
      // Arrange
      mockSingle.mockResolvedValue({
        data: mockAssessment,
        error: null,
      });

      // Act
      await callGET('pc-uuid-123');

      // Assert: eq가 id와 clerk_user_id 두 번 호출
      expect(mockSupabase.from).toHaveBeenCalledWith('personal_color_assessments');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'pc-uuid-123');
      expect(mockSupabase.eq).toHaveBeenCalledWith('clerk_user_id', 'user_test123');
    });
  });

  // ─── 서명 URL 변환 ────────────────────────────────────────────
  describe('서명 URL 변환', () => {
    it('face_image_url이 경로만일 때 서명된 URL로 변환한다', async () => {
      // Arrange: face_image_url이 http로 시작하지 않는 경로
      const dataWithPath = {
        ...mockAssessment,
        face_image_url: 'user_test123/1706000000.jpg',
      };
      mockSingle.mockResolvedValue({ data: dataWithPath, error: null });
      mockCreateSignedUrl.mockResolvedValue({
        data: {
          signedUrl:
            'https://supabase.co/storage/v1/signed/personal-color-images/user_test123/1706000000.jpg?token=abc',
        },
        error: null,
      });

      // Act
      const response = await callGET('pc-uuid-123');
      const json = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.face_image_url).toContain('https://supabase.co/storage');
      expect(json.data.face_image_url).toContain('token=abc');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('personal-color-images');
      expect(mockCreateSignedUrl).toHaveBeenCalledWith('user_test123/1706000000.jpg', 3600);
    });

    it('face_image_url이 http로 시작하면 변환하지 않는다', async () => {
      // Arrange: 이미 완전한 URL
      const dataWithHttpUrl = {
        ...mockAssessment,
        face_image_url: 'https://example.com/image.jpg',
      };
      mockSingle.mockResolvedValue({ data: dataWithHttpUrl, error: null });

      // Act
      const response = await callGET('pc-uuid-123');
      const json = await response.json();

      // Assert: URL이 그대로 유지, createSignedUrl 호출 없음
      expect(response.status).toBe(200);
      expect(json.data.face_image_url).toBe('https://example.com/image.jpg');
      expect(mockCreateSignedUrl).not.toHaveBeenCalled();
    });

    it('face_image_url이 null이면 변환을 시도하지 않는다', async () => {
      // Arrange
      const dataWithNullUrl = { ...mockAssessment, face_image_url: null };
      mockSingle.mockResolvedValue({ data: dataWithNullUrl, error: null });

      // Act
      const response = await callGET('pc-uuid-123');
      const json = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(json.data.face_image_url).toBeNull();
      expect(mockCreateSignedUrl).not.toHaveBeenCalled();
    });

    it('createSignedUrl 실패 시에도 원본 경로를 유지한다', async () => {
      // Arrange
      const dataWithPath = {
        ...mockAssessment,
        face_image_url: 'user_test123/1706000000.jpg',
      };
      mockSingle.mockResolvedValue({ data: dataWithPath, error: null });
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'Storage bucket not found' },
      });

      // Act
      const response = await callGET('pc-uuid-123');
      const json = await response.json();

      // Assert: 원본 경로 유지, 에러 시 경고 로깅
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.face_image_url).toBe('user_test123/1706000000.jpg');
      expect(console.warn).toHaveBeenCalledWith(
        '[PC-1] Failed to generate signed URL:',
        'Storage bucket not found'
      );
    });

    it('face_image_url이 빈 문자열이면 변환을 시도하지 않는다', async () => {
      // Arrange: 빈 문자열은 falsy이므로 변환 시도 안 함
      const dataWithEmptyUrl = { ...mockAssessment, face_image_url: '' };
      mockSingle.mockResolvedValue({ data: dataWithEmptyUrl, error: null });

      // Act
      const response = await callGET('pc-uuid-123');
      const json = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(json.data.face_image_url).toBe('');
      expect(mockCreateSignedUrl).not.toHaveBeenCalled();
    });
  });

  // ─── 예외 처리 ────────────────────────────────────────────────
  describe('예외 처리', () => {
    it('예상치 못한 에러 시 500을 반환한다', async () => {
      // Arrange: auth에서 예외 발생
      vi.mocked(auth).mockRejectedValue(new Error('Unexpected auth failure'));

      // Act
      const response = await callGET('pc-uuid-123');
      const json = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(json.error).toBe('서버 오류가 발생했습니다.');
      expect(json.code).toBe('INTERNAL_ERROR');
      expect(console.error).toHaveBeenCalledWith('[PC-1] Get by ID error:', expect.any(Error));
    });

    it('Error 인스턴스가 아닌 예외도 처리한다', async () => {
      // Arrange: 문자열 예외
      vi.mocked(auth).mockRejectedValue('string error');

      // Act
      const response = await callGET('pc-uuid-123');
      const json = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(json.error).toBe('서버 오류가 발생했습니다.');
      expect(json.code).toBe('INTERNAL_ERROR');
    });
  });
});
