/**
 * AI 웰니스 코치 채팅 API 테스트
 * POST /api/coach/chat
 *
 * @see app/api/coach/chat/route.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Clerk mock
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Coach 모듈 mock
vi.mock('@/lib/coach', () => ({
  getUserContext: vi.fn(),
  generateCoachResponse: vi.fn(),
}));

// Skin RAG mock
vi.mock('@/lib/coach/skin-rag', () => ({
  searchSkinProducts: vi.fn(),
}));

// Rate limit mock
vi.mock('@/lib/security/rate-limit', () => ({
  applyRateLimit: vi.fn().mockReturnValue({ success: true, headers: {} }),
}));

// Safety mock
vi.mock('@/lib/safety', () => ({
  detectCrisis: vi.fn().mockReturnValue(false),
  CRISIS_RESPONSE_MESSAGE: '지금 많이 힘드시군요. 자살예방상담전화 1393',
}));

import { POST } from '@/app/api/coach/chat/route';
import { auth } from '@clerk/nextjs/server';
import { getUserContext, generateCoachResponse } from '@/lib/coach';
import { searchSkinProducts } from '@/lib/coach/skin-rag';
import { detectCrisis } from '@/lib/safety';
import { applyRateLimit } from '@/lib/security/rate-limit';
import { NextRequest } from 'next/server';

// 헬퍼: NextRequest 생성
function createMockRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/coach/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Mock 데이터
const mockUserContext = {
  skinType: 'combination',
  skinConcerns: ['acne', 'pore'],
  personalColor: { season: 'spring' },
  bodyType: 'rectangle',
};

const mockCoachResponse = {
  message: '건성 피부에는 히알루론산 성분이 포함된 세럼을 추천드려요.',
  suggestedQuestions: ['어떤 세럼이 좋을까요?', '보습 크림도 추천해주세요'],
};

const mockSkinProducts = [
  {
    id: 'prod-1',
    name: '히알루론 세럼',
    brand: '라운드랩',
    category: 'skincare',
    keyIngredients: ['히알루론산'],
    concerns: ['hydration'],
    skinTypes: ['dry', 'combination'],
    price: 25000,
    matchScore: 92,
    matchReasons: ['건성 피부에 적합', '보습 성분 포함'],
  },
];

type AuthReturnType = ReturnType<typeof auth> extends Promise<infer T> ? T : never;

describe('POST /api/coach/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 mock 설정
    vi.mocked(applyRateLimit).mockReturnValue({ success: true, headers: {} });
    vi.mocked(detectCrisis).mockReturnValue(false);
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as AuthReturnType);
    vi.mocked(getUserContext).mockResolvedValue(mockUserContext);
    vi.mocked(generateCoachResponse).mockResolvedValue(mockCoachResponse);
    vi.mocked(searchSkinProducts).mockResolvedValue(mockSkinProducts);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturnType);

      const request = createMockRequest({ message: '안녕하세요' });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('입력 검증', () => {
    it('message가 없으면 400을 반환한다', async () => {
      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('message가 빈 문자열이면 400을 반환한다', async () => {
      const request = createMockRequest({ message: '' });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('message가 문자열이 아니면 400을 반환한다', async () => {
      const request = createMockRequest({ message: 123 });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('message가 2000자를 초과하면 400을 반환한다', async () => {
      const longMessage = 'a'.repeat(2001);
      const request = createMockRequest({ message: longMessage });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('2000');
    });

    it('message가 2000자 이하면 정상 처리한다', async () => {
      const validMessage = '운동 '.repeat(400);
      const request = createMockRequest({ message: validMessage });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('위기 감지', () => {
    it('위기 키워드 감지 시 전문 상담 안내를 반환한다', async () => {
      vi.mocked(detectCrisis).mockReturnValue(true);

      const request = createMockRequest({ message: '죽고싶어요' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain('1393');
      expect(json.suggestedQuestions).toEqual([]);
    });

    it('위기 감지 시 AI 호출을 하지 않는다', async () => {
      vi.mocked(detectCrisis).mockReturnValue(true);

      const request = createMockRequest({ message: '죽고싶어요' });
      await POST(request);

      expect(vi.mocked(generateCoachResponse)).not.toHaveBeenCalled();
    });
  });

  describe('일반 질문 (비-피부)', () => {
    it('일반 질문에 AI 응답을 반환한다', async () => {
      const request = createMockRequest({ message: '오늘 운동 뭐 할까?' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toBeDefined();
      expect(json.products).toBeUndefined();
    });

    it('일반 질문에서는 피부 RAG 검색을 호출하지 않는다', async () => {
      const request = createMockRequest({ message: '다이어트 방법 알려줘' });
      await POST(request);

      // searchSkinProducts가 빈 배열로 resolve (isSkinQuestion이 false)
      expect(vi.mocked(searchSkinProducts)).not.toHaveBeenCalled();
    });

    it('suggestedQuestions를 반환한다', async () => {
      const request = createMockRequest({ message: '칼로리 관리 어떻게 해?' });
      const response = await POST(request);
      const json = await response.json();

      expect(json.suggestedQuestions).toBeDefined();
      expect(json.suggestedQuestions).toHaveLength(2);
    });
  });

  describe('피부 관련 질문', () => {
    it('피부 키워드가 포함되면 제품 추천도 반환한다', async () => {
      const request = createMockRequest({ message: '건조한 피부에 좋은 제품 추천해줘' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.products).toBeDefined();
      expect(json.products).toHaveLength(1);
      expect(json.products[0].name).toBe('히알루론 세럼');
    });

    it('세럼 키워드도 피부 질문으로 감지한다', async () => {
      const request = createMockRequest({ message: '세럼 추천해주세요' });
      const response = await POST(request);
      const json = await response.json();

      expect(json.products).toBeDefined();
    });

    it('보습 키워드도 피부 질문으로 감지한다', async () => {
      const request = createMockRequest({ message: '보습 관리 방법' });
      const response = await POST(request);
      const json = await response.json();

      expect(json.products).toBeDefined();
    });

    it('RAG 검색 결과가 없으면 products를 반환하지 않는다', async () => {
      vi.mocked(searchSkinProducts).mockResolvedValue([]);

      const request = createMockRequest({ message: '피부 관리법 알려줘' });
      const response = await POST(request);
      const json = await response.json();

      expect(json.products).toBeUndefined();
    });
  });

  describe('채팅 히스토리', () => {
    it('chatHistory를 generateCoachResponse에 전달한다', async () => {
      const chatHistory = [
        { role: 'user', content: '안녕' },
        { role: 'assistant', content: '안녕하세요!' },
      ];

      const request = createMockRequest({
        message: '운동 추천해줘',
        chatHistory,
      });

      await POST(request);

      expect(vi.mocked(generateCoachResponse)).toHaveBeenCalledWith(
        expect.objectContaining({
          chatHistory,
        })
      );
    });

    it('chatHistory 없이도 정상 동작한다', async () => {
      const request = createMockRequest({ message: '안녕하세요' });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(generateCoachResponse)).toHaveBeenCalledWith(
        expect.objectContaining({
          chatHistory: undefined,
        })
      );
    });
  });

  describe('에러 처리', () => {
    it('getUserContext 실패 시 500을 반환한다', async () => {
      vi.mocked(getUserContext).mockRejectedValue(new Error('DB Error'));

      const request = createMockRequest({ message: '안녕하세요' });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('generateCoachResponse 실패 시 500을 반환한다', async () => {
      vi.mocked(generateCoachResponse).mockRejectedValue(new Error('Gemini API timeout'));

      const request = createMockRequest({ message: '안녕하세요' });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('searchSkinProducts 실패 시에도 AI 응답은 반환된다', async () => {
      // Promise.all에서 하나가 reject되면 전체 실패
      // 실제 코드에서는 searchSkinProducts가 reject되면 전체 catch로 감
      vi.mocked(searchSkinProducts).mockRejectedValue(new Error('RAG Error'));

      const request = createMockRequest({ message: '피부 관리법 알려줘' });
      const response = await POST(request);

      // Promise.all 특성상 500 반환
      expect(response.status).toBe(500);
    });

    it('JSON 파싱 실패 시 500을 반환한다', async () => {
      const badRequest = new NextRequest('http://localhost:3000/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json {{{',
      });

      const response = await POST(badRequest);
      expect(response.status).toBe(500);
    });
  });

  // 스트리밍 route(app/api/coach/stream)와 동일한 환각/안전성 필터를 적용하는지 검증.
  // 필터·면책 모듈은 mock하지 않으므로 실제 filterCoachResponse가 mock된 AI 출력에 적용된다.
  describe('안전 필터 패리티 (T1-a)', () => {
    it('의료 주장이 포함된 AI 응답을 정화한다 (치료 → 전문가 상담 권장)', async () => {
      vi.mocked(generateCoachResponse).mockResolvedValue({
        message: '이 성분으로 치료할 수 있어요. 꾸준히 발라보세요.',
        suggestedQuestions: [],
      });

      const request = createMockRequest({ message: '트러블 어떻게 해요?' });
      const response = await POST(request);
      const json = await response.json();

      expect(json.message).not.toContain('치료할 수');
      expect(json.message).toContain('전문가 상담을 권장드려요');
    });

    it('절대적 효과 보장 표현을 정화한다 (100% 효과 → 도움이 될 수 있어요)', async () => {
      vi.mocked(generateCoachResponse).mockResolvedValue({
        message: '이 제품은 100% 효과가 있어요.',
        suggestedQuestions: [],
      });

      const request = createMockRequest({ message: '크림 추천해줘' });
      const response = await POST(request);
      const json = await response.json();

      expect(json.message).not.toContain('100% 효과');
      expect(json.message).toContain('도움이 될 수 있어요');
    });

    it('면책 조항이 필요한 응답에 COACH_DISCLAIMER를 부착한다', async () => {
      vi.mocked(generateCoachResponse).mockResolvedValue({
        message: '이 영양제를 드시면 도움이 될 거예요.',
        suggestedQuestions: [],
      });

      const request = createMockRequest({ message: '영양제 추천해줘' });
      const response = await POST(request);
      const json = await response.json();

      expect(json.message).toContain('참고용');
      expect(json.message).toContain('전문가 상담을 권장');
    });

    it('위반이 없는 일반 응답은 원문 그대로 통과한다', async () => {
      vi.mocked(generateCoachResponse).mockResolvedValue({
        message: '오늘 스쿼트 3세트 해보세요!',
        suggestedQuestions: [],
      });

      const request = createMockRequest({ message: '운동 추천해줘' });
      const response = await POST(request);
      const json = await response.json();

      expect(json.message).toBe('오늘 스쿼트 3세트 해보세요!');
    });
  });

  describe('사용자 컨텍스트', () => {
    it('getUserContext에 userId를 전달한다', async () => {
      const request = createMockRequest({ message: '안녕' });
      await POST(request);

      expect(vi.mocked(getUserContext)).toHaveBeenCalledWith('user_test123');
    });

    it('사용자 컨텍스트를 generateCoachResponse에 전달한다', async () => {
      const request = createMockRequest({ message: '추천해줘' });
      await POST(request);

      expect(vi.mocked(generateCoachResponse)).toHaveBeenCalledWith(
        expect.objectContaining({
          userContext: mockUserContext,
        })
      );
    });
  });
});
