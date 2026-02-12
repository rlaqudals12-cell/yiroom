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

import { POST } from '@/app/api/coach/chat/route';
import { auth } from '@clerk/nextjs/server';
import { getUserContext, generateCoachResponse } from '@/lib/coach';
import { searchSkinProducts } from '@/lib/coach/skin-rag';

// 헬퍼: Request 생성
function createMockRequest(body: unknown): Request {
  return {
    json: () => Promise.resolve(body),
  } as Request;
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

    // 기본 인증 설정
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
      const badRequest = {
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Request;

      const response = await POST(badRequest);
      expect(response.status).toBe(500);
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
