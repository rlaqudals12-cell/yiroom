/**
 * AI 웰니스 코치 채팅 테스트
 *
 * @module tests/lib/coach/chat
 * @description generateCoachResponse 함수 동작 테스트 (Fallback 포함)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCoachResponse, type CoachChatRequest } from '@/lib/coach/chat';

// =============================================================================
// Mocks
// =============================================================================

// Gemini API Mock (API 키 없음 시나리오)
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => null),
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH',
    BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            contains: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock('@/lib/utils/logger', () => ({
  coachLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// RAG 모듈들 Mock
vi.mock('@/lib/coach/skin-rag', () => ({
  searchSkinProducts: vi.fn().mockResolvedValue([]),
  formatSkinProductsForPrompt: vi.fn().mockReturnValue(''),
}));

vi.mock('@/lib/coach/personal-color-rag', () => ({
  searchByPersonalColor: vi.fn().mockResolvedValue(null),
  formatPersonalColorForPrompt: vi.fn().mockReturnValue(''),
}));

vi.mock('@/lib/coach/fashion-rag', () => ({
  searchFashionItems: vi.fn().mockResolvedValue(null),
  formatFashionForPrompt: vi.fn().mockReturnValue(''),
}));

vi.mock('@/lib/coach/nutrition-rag', () => ({
  searchNutritionItems: vi.fn().mockResolvedValue(null),
  formatNutritionForPrompt: vi.fn().mockReturnValue(''),
}));

vi.mock('@/lib/coach/workout-rag', () => ({
  searchWorkoutItems: vi.fn().mockResolvedValue(null),
  formatWorkoutForPrompt: vi.fn().mockReturnValue(''),
}));

// =============================================================================
// 테스트
// =============================================================================

describe('lib/coach/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 환경변수 제거하여 fallback 동작 테스트
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  });

  describe('generateCoachResponse', () => {
    describe('Fallback responses (without API key)', () => {
      it('should return workout fallback for workout questions', async () => {
        const request: CoachChatRequest = {
          message: '오늘 운동 뭐하면 좋을까요?',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
        expect(response.message.length).toBeGreaterThan(0);
        expect(response.suggestedQuestions).toBeDefined();
        expect(response.suggestedQuestions?.length).toBeLessThanOrEqual(3);
      });

      it('should return nutrition fallback for food questions', async () => {
        const request: CoachChatRequest = {
          message: '다이어트할 때 뭐 먹어요?',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
        expect(response.suggestedQuestions).toBeDefined();
      });

      it('should return skin fallback for skincare questions', async () => {
        const request: CoachChatRequest = {
          message: '피부가 건조해요 어떻게 해요?',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
        expect(response.suggestedQuestions).toBeDefined();
      });

      it('should return personalColor fallback for color questions', async () => {
        const request: CoachChatRequest = {
          message: '내 퍼스널컬러에 맞는 색 알려줘',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
        expect(response.suggestedQuestions).toBeDefined();
      });

      it('should return fashion fallback for clothing questions', async () => {
        const request: CoachChatRequest = {
          message: '오늘 뭐 입을까요?',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
        expect(response.suggestedQuestions).toBeDefined();
      });

      it('should return default fallback for general questions', async () => {
        const request: CoachChatRequest = {
          message: '안녕하세요',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
        expect(response.suggestedQuestions).toBeDefined();
      });
    });

    describe('Response structure', () => {
      it('should return message and suggestedQuestions', async () => {
        const request: CoachChatRequest = {
          message: '운동 추천해줘',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response).toHaveProperty('message');
        expect(response).toHaveProperty('suggestedQuestions');
        expect(typeof response.message).toBe('string');
        expect(Array.isArray(response.suggestedQuestions)).toBe(true);
      });

      it('should return at most 3 suggested questions', async () => {
        const request: CoachChatRequest = {
          message: '뭐든 추천해줘',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.suggestedQuestions).toBeDefined();
        expect(response.suggestedQuestions!.length).toBeLessThanOrEqual(3);
      });
    });

    describe('With user context', () => {
      it('should handle user context without errors', async () => {
        const request: CoachChatRequest = {
          message: '운동 추천해줘',
          userContext: {
            personalColor: {
              season: '봄 웜톤',
              tone: 'bright',
            },
            skinAnalysis: {
              skinType: '복합성',
              concerns: ['모공', '피지'],
            },
            workout: {
              workoutType: '근력 운동',
              goal: '근육 증가',
              streak: 10,
            },
          },
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
        expect(response.suggestedQuestions).toBeDefined();
      });

      it('should handle partial user context', async () => {
        const request: CoachChatRequest = {
          message: '피부 관리법 알려줘',
          userContext: {
            skinAnalysis: {
              skinType: '건성',
            },
          },
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
      });
    });

    describe('With chat history', () => {
      it('should handle chat history without errors', async () => {
        const request: CoachChatRequest = {
          message: '더 알려줘',
          userContext: null,
          chatHistory: [
            {
              id: '1',
              role: 'user',
              content: '운동 추천해줘',
              timestamp: new Date(),
            },
            {
              id: '2',
              role: 'assistant',
              content: '스쿼트를 추천드려요!',
              timestamp: new Date(),
            },
          ],
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
        expect(response.suggestedQuestions).toBeDefined();
      });

      it('should handle empty chat history', async () => {
        const request: CoachChatRequest = {
          message: '안녕',
          userContext: null,
          chatHistory: [],
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
      });
    });

    describe('Question category detection', () => {
      it('should detect workout category', async () => {
        const workoutQuestions = ['헬스 하러 가요', '근육 키우고 싶어요', '스트레칭 방법 알려줘'];

        for (const q of workoutQuestions) {
          const response = await generateCoachResponse({
            message: q,
            userContext: null,
          });
          expect(response.message).toBeDefined();
        }
      });

      it('should detect nutrition category', async () => {
        const nutritionQuestions = ['칼로리 계산법', '다이어트 식단', '단백질 섭취량'];

        for (const q of nutritionQuestions) {
          const response = await generateCoachResponse({
            message: q,
            userContext: null,
          });
          expect(response.message).toBeDefined();
        }
      });

      it('should detect skin category', async () => {
        const skinQuestions = ['스킨케어 루틴', '보습 크림 추천', '화장품 성분'];

        for (const q of skinQuestions) {
          const response = await generateCoachResponse({
            message: q,
            userContext: null,
          });
          expect(response.message).toBeDefined();
        }
      });

      it('should detect personal color category', async () => {
        const colorQuestions = ['웜톤 색상', '쿨톤 메이크업', '시즌별 컬러'];

        for (const q of colorQuestions) {
          const response = await generateCoachResponse({
            message: q,
            userContext: null,
          });
          expect(response.message).toBeDefined();
        }
      });

      it('should detect fashion category', async () => {
        const fashionQuestions = ['코디 추천', '패션 스타일', '오늘 뭐 입지'];

        for (const q of fashionQuestions) {
          const response = await generateCoachResponse({
            message: q,
            userContext: null,
          });
          expect(response.message).toBeDefined();
        }
      });
    });

    describe('Edge cases', () => {
      it('should handle empty message', async () => {
        const request: CoachChatRequest = {
          message: '',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
      });

      it('should handle very long message', async () => {
        const longMessage = '운동 '.repeat(100);
        const request: CoachChatRequest = {
          message: longMessage,
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
      });

      it('should handle special characters in message', async () => {
        const request: CoachChatRequest = {
          message: '운동!!! 어떻게? @#$%',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
      });
    });
  });
});
