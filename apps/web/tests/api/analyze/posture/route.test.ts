/**
 * PST-1 자세 분석 API 테스트
 * @description POST/GET /api/analyze/posture 테스트 (AI 자세 분석, Mock Fallback)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock 모듈 설정
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
  analyzePosture: vi.fn(),
}));

vi.mock('@/lib/mock/posture-analysis', () => ({
  generateMockPostureAnalysis: vi.fn(),
  POSTURE_TYPES: {
    ideal: { label: '이상적인 자세', description: '균형 잡힌 자세', emoji: '✨' },
    forward_head: { label: '거북목', description: '목이 앞으로 나온 자세', emoji: '🐢' },
    rounded_shoulder: { label: '라운드 숄더', description: '어깨가 앞으로 말린 자세', emoji: '🔄' },
  },
}));

vi.mock('@/lib/gamification', () => ({
  awardAnalysisBadge: vi.fn().mockResolvedValue(null),
  addXp: vi.fn().mockResolvedValue(undefined),
}));

// Rate Limit 모킹 - 기본: 항상 통과
vi.mock('@/lib/security/rate-limit', () => ({
  applyRateLimit: vi.fn().mockReturnValue({ success: true }),
}));

// 이미지 동의 확인 모킹
vi.mock('@/lib/api/image-consent', () => ({
  checkConsentAndUploadImages: vi.fn().mockResolvedValue({
    hasConsent: false,
    consentId: null,
    uploadedImages: { front: null, side: null },
  }),
}));

import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzePosture } from '@/lib/gemini';
import { generateMockPostureAnalysis } from '@/lib/mock/posture-analysis';
import { awardAnalysisBadge, addXp } from '@/lib/gamification';
import { applyRateLimit } from '@/lib/security/rate-limit';
import { checkConsentAndUploadImages } from '@/lib/api/image-consent';

const { POST, GET } = await import('@/app/api/analyze/posture/route');

// Mock 요청 헬퍼
function createMockPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/analyze/posture', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Mock 분석 결과 (generateMockPostureAnalysis 반환값)
const mockPostureResult = {
  postureType: 'forward_head',
  postureTypeLabel: '거북목',
  postureTypeDescription: '머리가 앞으로 나온 자세',
  overallScore: 65,
  confidence: 85,
  frontAnalysis: {
    shoulderSymmetry: {
      name: '어깨 대칭',
      value: 45,
      status: 'warning',
      description: '약간 비대칭',
    },
    pelvisSymmetry: { name: '골반 대칭', value: 50, status: 'good', description: '양호' },
    kneeAlignment: { name: '무릎 정렬', value: 48, status: 'good', description: '양호' },
    footAngle: { name: '발 각도', value: 52, status: 'good', description: '양호' },
  },
  sideAnalysis: {
    headForwardAngle: {
      name: '머리 전방 각도',
      value: 35,
      status: 'alert',
      description: '심한 거북목',
    },
    thoracicKyphosis: { name: '흉추 굴곡', value: 55, status: 'warning', description: '약간 굽음' },
    lumbarLordosis: { name: '요추 만곡', value: 50, status: 'good', description: '양호' },
    pelvicTilt: { name: '골반 기울기', value: 48, status: 'good', description: '양호' },
  },
  concerns: ['거북목 자세가 심합니다', '어깨가 비대칭입니다'],
  stretchingRecommendations: [
    {
      name: '턱 당기기',
      targetArea: '목 앞쪽',
      duration: '10초',
      frequency: '하루 10회',
      description: '턱을 뒤로 당기기',
      difficulty: 'easy',
    },
  ],
  insight: 'AI 인사이트 테스트',
  analyzedAt: new Date(),
  bodyTypeCorrelation: undefined,
};

// Real AI 분석 결과 (analyzePosture 반환값)
const mockAiResult = {
  postureType: 'rounded_shoulder',
  postureTypeLabel: '라운드 숄더',
  postureTypeDescription: '어깨가 앞으로 말린 자세',
  overallScore: 70,
  confidence: 92,
  frontAnalysis: {
    shoulderSymmetry: { name: '어깨 대칭', value: 40, status: 'warning', description: '비대칭' },
    pelvisSymmetry: { name: '골반 대칭', value: 50, status: 'good', description: '양호' },
    kneeAlignment: { name: '무릎 정렬', value: 50, status: 'good', description: '양호' },
    footAngle: { name: '발 각도', value: 50, status: 'good', description: '양호' },
  },
  sideAnalysis: {
    headForwardAngle: {
      name: '머리 전방 각도',
      value: 42,
      status: 'warning',
      description: '약간 거북목',
    },
    thoracicKyphosis: { name: '흉추 굴곡', value: 60, status: 'alert', description: '심한 굽음' },
    lumbarLordosis: { name: '요추 만곡', value: 50, status: 'good', description: '양호' },
    pelvicTilt: { name: '골반 기울기', value: 50, status: 'good', description: '양호' },
  },
  concerns: ['라운드 숄더', '흉추 과굴곡'],
  stretchingRecommendations: [],
  insight: 'AI가 분석한 인사이트',
  imageQuality: {
    angle: 'front',
    fullBodyVisible: true,
    clothingFit: 'fitted',
    analysisReliability: 'medium',
  },
  analysisEvidence: null,
  bodyTypeCorrelation: null,
};

describe('POST /api/analyze/posture', () => {
  // Supabase 체인 메서드 구성
  const mockUpload = vi.fn();
  const mockSelectSingle = vi.fn();
  const mockInsertSingle = vi.fn();

  const mockLimit = vi.fn(() => ({ single: mockSelectSingle }));
  const mockOrder = vi.fn(() => ({ limit: mockLimit }));
  const mockEq = vi.fn(() => ({ order: mockOrder }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockInsertSelect = vi.fn(() => ({ single: mockInsertSingle }));
  const mockInsert = vi.fn(() => ({ select: mockInsertSelect }));

  const mockSupabase = {
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
      })),
    },
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as never);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as never);
    vi.mocked(generateMockPostureAnalysis).mockReturnValue(mockPostureResult as never);
    vi.mocked(applyRateLimit).mockReturnValue({ success: true } as never);
    vi.mocked(addXp).mockResolvedValue(undefined as never);
    vi.mocked(awardAnalysisBadge).mockResolvedValue(null);

    // Supabase 기본값
    mockUpload.mockResolvedValue({ data: { path: 'test/path.jpg' }, error: null });
    mockSelectSingle.mockResolvedValue({ data: null, error: null });
    mockInsertSingle.mockResolvedValue({ data: { id: 'analysis-1' }, error: null });
  });

  describe('인증', () => {
    it('비로그인 시 401 반환', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as never);

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('인증이 필요합니다.');
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('인증된 사용자는 정상 처리', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limit', () => {
    it('Rate Limit 초과 시 에러 응답 반환', async () => {
      const rateLimitResponse = {
        status: 429,
        json: async () => ({ error: '요청이 너무 많습니다.' }),
      };
      vi.mocked(applyRateLimit).mockReturnValue({
        success: false,
        response: rateLimitResponse,
      } as never);

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
      });

      const response = await POST(req);
      expect(response.status).toBe(429);
    });
  });

  describe('입력 검증', () => {
    it('frontImageBase64 누락 시 400 반환', async () => {
      const req = createMockPostRequest({});

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('정면 이미지가 필요합니다.');
      expect(data.code).toBe('BAD_REQUEST');
    });

    it('frontImageBase64가 빈 문자열이면 400 반환', async () => {
      const req = createMockPostRequest({ frontImageBase64: '' });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('정면 이미지가 필요합니다.');
    });

    it('정면 이미지만 있어도 정상 처리', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.imagesAnalyzed.front).toBe(true);
      expect(data.imagesAnalyzed.side).toBe(false);
    });
  });

  describe('Mock 모드', () => {
    it('useMock=true 시 Mock 결과 반환, usedMock=true', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.usedMock).toBe(true);
      expect(data.result.postureType).toBe('forward_head');
      expect(data.result.overallScore).toBe(65);
      expect(analyzePosture).not.toHaveBeenCalled();
      expect(generateMockPostureAnalysis).toHaveBeenCalled();
    });

    it('useMock=true + bodyType 전달 시 Mock에 bodyType 전달', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        bodyType: 'S',
        useMock: true,
      });

      await POST(req);

      expect(generateMockPostureAnalysis).toHaveBeenCalledWith('S');
    });
  });

  describe('AI 분석 (Real Gemini)', () => {
    it('analyzePosture 성공 시 결과 반환, usedMock=false', async () => {
      vi.mocked(analyzePosture).mockResolvedValue(mockAiResult as never);

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.usedMock).toBe(false);
      expect(data.result.postureType).toBe('rounded_shoulder');
      expect(data.result.overallScore).toBe(70);
      expect(data.result.confidence).toBe(92);
      expect(analyzePosture).toHaveBeenCalledWith(
        'data:image/jpeg;base64,abc',
        undefined,
        undefined
      );
    });

    it('AI 성공 시 generateMockPostureAnalysis 호출하지 않음', async () => {
      vi.mocked(analyzePosture).mockResolvedValue(mockAiResult as never);

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
      });

      await POST(req);

      expect(generateMockPostureAnalysis).not.toHaveBeenCalled();
    });

    it('AI 실패 시 Mock Fallback 사용, usedMock=true', async () => {
      vi.mocked(analyzePosture).mockRejectedValue(new Error('Gemini API timeout'));

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.usedMock).toBe(true);
      expect(data.result.postureType).toBe('forward_head');
      expect(generateMockPostureAnalysis).toHaveBeenCalled();
    });

    it('AI에 sideImageBase64 전달', async () => {
      vi.mocked(analyzePosture).mockResolvedValue(mockAiResult as never);

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,front',
        sideImageBase64: 'data:image/jpeg;base64,side',
      });

      await POST(req);

      expect(analyzePosture).toHaveBeenCalledWith(
        'data:image/jpeg;base64,front',
        'data:image/jpeg;base64,side',
        undefined
      );
    });

    it('AI에 bodyType 전달', async () => {
      vi.mocked(analyzePosture).mockResolvedValue(mockAiResult as never);

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        bodyType: 'H',
      });

      await POST(req);

      expect(analyzePosture).toHaveBeenCalledWith('data:image/jpeg;base64,abc', undefined, 'H');
    });
  });

  describe('정면+측면 이미지 분석', () => {
    it('측면 이미지 포함 시 imagesAnalyzed.side=true', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,front',
        sideImageBase64: 'data:image/jpeg;base64,side',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data.imagesAnalyzed.front).toBe(true);
      expect(data.imagesAnalyzed.side).toBe(true);
    });

    it('측면 이미지 없으면 imagesAnalyzed.side=false', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,front',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data.imagesAnalyzed.front).toBe(true);
      expect(data.imagesAnalyzed.side).toBe(false);
    });

    it('다각도 분석(2장) AI 성공 시 analysisReliability=high 보정', async () => {
      const aiResultWithImageQuality = {
        ...mockAiResult,
        imageQuality: {
          angle: 'both',
          fullBodyVisible: true,
          clothingFit: 'fitted',
          analysisReliability: 'medium',
        },
      };
      vi.mocked(analyzePosture).mockResolvedValue(aiResultWithImageQuality as never);

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,front',
        sideImageBase64: 'data:image/jpeg;base64,side',
      });

      const response = await POST(req);
      const data = await response.json();

      // 2장 분석 시 신뢰도 'high'로 보정 (route.ts 라인 110-112)
      expect(data.result.imageQuality.analysisReliability).toBe('high');
    });
  });

  describe('체형(C-1) 연동', () => {
    it('bodyType 파라미터 제공 시 C-1 조회하지 않고 그대로 사용', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        bodyType: 'S',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data.bodyType).toBe('S');
    });

    it('bodyType 없으면 C-1에서 최근 체형 조회', async () => {
      mockSelectSingle.mockResolvedValue({
        data: { body_type: 'W' },
        error: null,
      });

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data.bodyType).toBe('W');
      // body_analyses 테이블 조회 확인
      expect(mockSupabase.from).toHaveBeenCalledWith('body_analyses');
    });

    it('C-1 데이터 없으면 bodyType=null', async () => {
      mockSelectSingle.mockResolvedValue({ data: null, error: null });

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      // bodyType이 null/undefined
      expect(data.bodyType).toBeFalsy();
    });
  });

  describe('DB 저장', () => {
    it('분석 결과를 posture_analyses 테이블에 저장', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      await POST(req);

      expect(mockSupabase.from).toHaveBeenCalledWith('posture_analyses');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('DB 저장 실패 시 500 반환', async () => {
      mockInsertSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST204', message: 'Database insert failed' },
      });

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('DB_ERROR');
      expect(data.error).toBe('분석 결과 저장에 실패했습니다.');
    });
  });

  describe('이미지 동의 및 업로드', () => {
    it('checkConsentAndUploadImages 호출 확인', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,front',
        sideImageBase64: 'data:image/jpeg;base64,side',
        useMock: true,
      });

      await POST(req);

      expect(checkConsentAndUploadImages).toHaveBeenCalledWith(
        mockSupabase,
        'user_test123',
        'posture',
        'posture-images',
        {
          front: 'data:image/jpeg;base64,front',
          side: 'data:image/jpeg;base64,side',
        }
      );
    });

    it('이미지 업로드 성공 시 front_image_url 저장', async () => {
      vi.mocked(checkConsentAndUploadImages).mockResolvedValue({
        hasConsent: true,
        consentId: 'consent-1',
        uploadedImages: { front: 'https://storage/front.jpg', side: null },
      } as never);

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      await POST(req);

      // insert 호출 시 front_image_url이 업로드 URL인지 확인
      expect(mockInsert).toHaveBeenCalled();
      const insertCallArgs = mockInsert.mock.calls[0] as unknown[];
      const insertPayload = insertCallArgs[0] as Record<string, unknown>;
      expect(insertPayload.front_image_url).toBe('https://storage/front.jpg');
    });
  });

  describe('게이미피케이션 연동', () => {
    it('분석 완료 시 XP 10점 추가', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(addXp).toHaveBeenCalledWith(mockSupabase, 'user_test123', 10);
      expect(data.gamification.xpAwarded).toBe(10);
    });

    it('자세 분석 완료 배지 수여', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      await POST(req);

      expect(awardAnalysisBadge).toHaveBeenCalledWith(mockSupabase, 'user_test123', 'posture');
    });

    it('배지 결과가 있으면 gamification.badgeResults에 포함', async () => {
      const badgeResult = {
        badgeId: 'posture_first',
        badgeName: '자세 분석 첫 걸음',
        isNew: true,
      };
      vi.mocked(awardAnalysisBadge).mockResolvedValue(badgeResult as never);

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data.gamification.badgeResults).toContainEqual(badgeResult);
    });

    it('게이미피케이션 실패 시에도 분석 응답은 정상', async () => {
      vi.mocked(addXp).mockRejectedValue(new Error('XP service unavailable'));
      vi.mocked(awardAnalysisBadge).mockRejectedValue(new Error('Badge service down'));

      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      // 게이미피케이션 에러는 catch되고, 분석 결과는 정상 반환
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.postureType).toBe('forward_head');
    });
  });

  describe('응답 데이터 구조', () => {
    it('성공 응답에 필수 필드 포함', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('result');
      expect(data).toHaveProperty('imagesAnalyzed');
      expect(data).toHaveProperty('usedMock');
      expect(data).toHaveProperty('gamification');
    });

    it('result에 analyzedAt 타임스탬프 포함', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data.result.analyzedAt).toBeDefined();
      // ISO 형식 문자열인지 확인
      expect(() => new Date(data.result.analyzedAt)).not.toThrow();
    });

    it('result에 postureTypeLabel, postureTypeDescription 포함', async () => {
      const req = createMockPostRequest({
        frontImageBase64: 'data:image/jpeg;base64,abc',
        useMock: true,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data.result.postureTypeLabel).toBeDefined();
      expect(data.result.postureTypeDescription).toBeDefined();
    });
  });

  describe('엣지 케이스', () => {
    it('JSON 파싱 실패 시 500 반환', async () => {
      const req = new NextRequest('http://localhost/api/analyze/posture', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(req);
      expect(response.status).toBe(500);
    });
  });
});

describe('GET /api/analyze/posture', () => {
  // Supabase 체인 메서드 구성 (GET 전용)
  const mockLimit = vi.fn();
  const mockOrder = vi.fn(() => ({ limit: mockLimit }));
  const mockEq = vi.fn(() => ({ order: mockOrder }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));

  const mockGetSupabase = {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as never);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockGetSupabase as never);
    mockLimit.mockResolvedValue({ data: [], error: null });
  });

  describe('인증', () => {
    it('비로그인 시 401 반환', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as never);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('인증이 필요합니다.');
      expect(data.code).toBe('UNAUTHORIZED');
    });
  });

  describe('정상 조회', () => {
    it('분석 결과 목록 반환', async () => {
      const mockData = [
        { id: '1', posture_type: 'ideal', overall_score: 85, created_at: '2026-02-13T00:00:00Z' },
        {
          id: '2',
          posture_type: 'forward_head',
          overall_score: 65,
          created_at: '2026-02-12T00:00:00Z',
        },
      ];

      mockLimit.mockResolvedValue({ data: mockData, error: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockData);
      expect(data.count).toBe(2);
    });

    it('데이터 없을 때 빈 배열 반환', async () => {
      mockLimit.mockResolvedValue({ data: [], error: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.count).toBe(0);
    });

    it('data가 null이면 빈 배열 반환', async () => {
      mockLimit.mockResolvedValue({ data: null, error: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.count).toBe(0);
    });

    it('최신순 정렬, 10개 제한으로 조회', async () => {
      await GET();

      expect(mockGetSupabase.from).toHaveBeenCalledWith('posture_analyses');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('clerk_user_id', 'user_test123');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(10);
    });
  });

  describe('DB 조회 실패', () => {
    it('DB 에러 시 500 반환', async () => {
      mockLimit.mockResolvedValue({
        data: null,
        error: { code: 'PGRST301', message: 'Connection refused' },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('DB_ERROR');
      expect(data.error).toBe('분석 기록 조회에 실패했습니다.');
    });
  });
});
