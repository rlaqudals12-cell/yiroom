/**
 * AI 웰니스 코치 스트리밍 API 테스트
 * POST /api/coach/stream (SSE)
 *
 * @see app/api/coach/stream/route.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Clerk mock
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Coach 모듈 mock
vi.mock('@/lib/coach', () => ({
  getUserContext: vi.fn(),
  generateCoachResponseStream: vi.fn(),
}));

// Safety mock
vi.mock('@/lib/safety', () => ({
  detectCrisis: vi.fn().mockReturnValue(false),
  CRISIS_RESPONSE_MESSAGE: '지금 많이 힘드시군요. 자살예방상담전화 1393',
}));

import { POST } from '@/app/api/coach/stream/route';
import { auth } from '@clerk/nextjs/server';
import { getUserContext, generateCoachResponseStream } from '@/lib/coach';
import { detectCrisis } from '@/lib/safety';

type AuthReturnType = ReturnType<typeof auth> extends Promise<infer T> ? T : never;

// 헬퍼: Request 생성
function createMockRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/coach/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// 헬퍼: SSE 응답 파싱
async function parseSSEResponse(
  response: Response
): Promise<Array<{ type: string; [key: string]: unknown }>> {
  const text = await response.text();
  return text
    .split('\n\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => JSON.parse(line.replace('data: ', '')));
}

// Mock 비동기 제너레이터 팩토리
function createMockGenerator() {
  return (async function* () {
    yield '안녕하세요, ';
    yield '도움이 필요하시군요.';
  })();
}

// Mock 데이터
const mockUserContext = {
  skinType: 'combination',
  skinConcerns: ['acne', 'pore'],
  personalColor: { season: 'spring' },
  bodyType: 'rectangle',
};

describe('POST /api/coach/stream', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 mock 설정
    vi.mocked(detectCrisis).mockReturnValue(false);
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as AuthReturnType);
    vi.mocked(getUserContext).mockResolvedValue(mockUserContext);
    vi.mocked(generateCoachResponseStream).mockReturnValue(createMockGenerator());
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
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('입력 검증', () => {
    it('message가 없으면 400을 반환한다', async () => {
      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('message가 문자열이 아니면 400을 반환한다', async () => {
      const request = createMockRequest({ message: 123 });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('message가 빈 문자열이면 400을 반환한다', async () => {
      const request = createMockRequest({ message: '' });
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

    it('JSON 파싱 실패 시 500을 반환한다', async () => {
      const badRequest = new Request('http://localhost:3000/api/coach/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json {{{',
      });

      const response = await POST(badRequest);
      expect(response.status).toBe(500);
    });
  });

  describe('위기 감지', () => {
    it('위기 감지 시 SSE 형식으로 전문 상담 안내를 반환한다', async () => {
      vi.mocked(detectCrisis).mockReturnValue(true);

      const request = createMockRequest({ message: '죽고싶어요' });
      const response = await POST(request);
      const events = await parseSSEResponse(response);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(events.length).toBe(2);
      expect(events[0].type).toBe('chunk');
      expect(events[1].type).toBe('done');
      expect(events[1].suggestedQuestions).toEqual([]);
    });

    it('위기 감지 시 응답에 1393이 포함된다', async () => {
      vi.mocked(detectCrisis).mockReturnValue(true);

      const request = createMockRequest({ message: '죽고싶어요' });
      const response = await POST(request);
      const events = await parseSSEResponse(response);

      expect(events[0].content).toContain('1393');
    });

    it('위기 감지 시 AI 호출을 하지 않는다', async () => {
      vi.mocked(detectCrisis).mockReturnValue(true);

      const request = createMockRequest({ message: '죽고싶어요' });
      await POST(request);

      expect(vi.mocked(generateCoachResponseStream)).not.toHaveBeenCalled();
      expect(vi.mocked(getUserContext)).not.toHaveBeenCalled();
    });
  });

  describe('정상 스트리밍', () => {
    it('SSE 헤더가 올바르게 설정된다', async () => {
      const request = createMockRequest({ message: '운동 추천해줘' });
      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
    });

    it('정상 응답은 chunk와 done 이벤트를 포함한다', async () => {
      const request = createMockRequest({ message: '운동 추천해줘' });
      const response = await POST(request);
      const events = await parseSSEResponse(response);

      // 제너레이터에서 2개 chunk + 1개 done
      const chunks = events.filter((e) => e.type === 'chunk');
      const doneEvents = events.filter((e) => e.type === 'done');

      expect(chunks.length).toBe(2);
      expect(chunks[0].content).toBe('안녕하세요, ');
      expect(chunks[1].content).toBe('도움이 필요하시군요.');
      expect(doneEvents.length).toBe(1);
    });

    it('done 이벤트에 suggestedQuestions가 포함된다', async () => {
      const request = createMockRequest({ message: '운동 추천해줘' });
      const response = await POST(request);
      const events = await parseSSEResponse(response);

      const doneEvent = events.find((e) => e.type === 'done');
      expect(doneEvent).toBeDefined();
      expect(doneEvent!.suggestedQuestions).toBeDefined();
      expect(Array.isArray(doneEvent!.suggestedQuestions)).toBe(true);
      expect((doneEvent!.suggestedQuestions as string[]).length).toBeGreaterThan(0);
    });

    it('운동 관련 질문은 운동 관련 추천 질문을 반환한다', async () => {
      const request = createMockRequest({ message: '운동 루틴 알려줘' });
      const response = await POST(request);
      const events = await parseSSEResponse(response);

      const doneEvent = events.find((e) => e.type === 'done');
      const questions = doneEvent!.suggestedQuestions as string[];

      // 운동 카테고리 추천 질문 확인
      expect(questions.some((q) => q.includes('운동'))).toBe(true);
    });

    it('피부 관련 질문은 피부 관련 추천 질문을 반환한다', async () => {
      const request = createMockRequest({ message: '피부 관리법 알려줘' });
      const response = await POST(request);
      const events = await parseSSEResponse(response);

      const doneEvent = events.find((e) => e.type === 'done');
      const questions = doneEvent!.suggestedQuestions as string[];

      expect(
        questions.some(
          (q) => q.includes('스킨케어') || q.includes('선크림') || q.includes('트러블')
        )
      ).toBe(true);
    });

    it('음식 관련 질문은 영양 관련 추천 질문을 반환한다', async () => {
      const request = createMockRequest({ message: '다이어트 음식 추천해줘' });
      const response = await POST(request);
      const events = await parseSSEResponse(response);

      const doneEvent = events.find((e) => e.type === 'done');
      const questions = doneEvent!.suggestedQuestions as string[];

      expect(
        questions.some((q) => q.includes('단백질') || q.includes('물') || q.includes('야식'))
      ).toBe(true);
    });

    it('chatHistory를 generateCoachResponseStream에 전달한다', async () => {
      const chatHistory = [
        { role: 'user', content: '안녕' },
        { role: 'assistant', content: '안녕하세요!' },
      ];

      const request = createMockRequest({ message: '운동 추천해줘', chatHistory });
      await POST(request);

      expect(vi.mocked(generateCoachResponseStream)).toHaveBeenCalledWith(
        expect.objectContaining({ chatHistory })
      );
    });
  });

  describe('에러 처리', () => {
    it('generateCoachResponseStream 실패 시 error 이벤트를 전송한다', async () => {
      vi.mocked(generateCoachResponseStream).mockReturnValue(
        (async function* () {
          yield ''; // ESLint: generator must have yield
          throw new Error('Gemini API timeout');
        })()
      );

      const request = createMockRequest({ message: '안녕하세요' });
      const response = await POST(request);
      const events = await parseSSEResponse(response);

      // SSE 스트림 내부 에러 → error 이벤트
      const errorEvent = events.find((e) => e.type === 'error');
      expect(errorEvent).toBeDefined();
      expect(errorEvent!.message).toBeDefined();
    });

    it('getUserContext 실패 시 500을 반환한다', async () => {
      vi.mocked(getUserContext).mockRejectedValue(new Error('DB Error'));

      const request = createMockRequest({ message: '안녕하세요' });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
