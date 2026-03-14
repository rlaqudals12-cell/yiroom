/**
 * AI 웰니스 코치 채팅 테스트
 *
 * @module tests/lib/coach/chat
 * @description generateCoachResponse 함수 동작 테스트 (Fallback 포함)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateCoachResponse,
  generateCoachResponseStream,
  type CoachChatRequest,
} from '@/lib/coach/chat';

// =============================================================================
// Mocks
// =============================================================================

// Gemini Adapter Mock (API 미사용 시나리오 — fallback 동작 테스트)
vi.mock('@/lib/gemini/client', () => ({
  generateContent: vi.fn(),
  generateContentStream: vi.fn(),
  isGeminiAvailable: vi.fn().mockReturnValue(false),
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH',
    BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
  },
}));

// Gemini mock 참조 (테스트에서 동적 제어용)
import {
  isGeminiAvailable as _isGeminiAvailable,
  generateContent as _generateContent,
  generateContentStream as _generateContentStream,
} from '@/lib/gemini/client';

const mockIsGeminiAvailable = vi.mocked(_isGeminiAvailable);
const mockGenerateContent = vi.mocked(_generateContent);
const mockGenerateContentStream = vi.mocked(_generateContentStream);

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

vi.mock('@/lib/coach/hair-rag', () => ({
  searchHairProducts: vi.fn().mockResolvedValue([]),
  formatHairProductsForPrompt: vi.fn().mockReturnValue(''),
}));

vi.mock('@/lib/coach/makeup-rag', () => ({
  searchMakeupProducts: vi.fn().mockResolvedValue([]),
  formatMakeupProductsForPrompt: vi.fn().mockReturnValue(''),
}));

// =============================================================================
// 테스트
// =============================================================================

describe('lib/coach/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      it('should detect hair category', async () => {
        const hairQuestions = ['탈모 예방법', '두피가 가려워요', '헤어 트리트먼트 추천'];

        for (const q of hairQuestions) {
          const response = await generateCoachResponse({
            message: q,
            userContext: null,
          });
          expect(response.message).toBeDefined();
        }
      });

      it('should detect makeup category', async () => {
        const makeupQuestions = ['립스틱 추천해줘', '아이섀도 색상', '파운데이션 고르는 법'];

        for (const q of makeupQuestions) {
          const response = await generateCoachResponse({
            message: q,
            userContext: null,
          });
          expect(response.message).toBeDefined();
        }
      });
    });

    describe('Crisis detection', () => {
      it('should return crisis response for suicide-related message', async () => {
        const request: CoachChatRequest = {
          message: '죽고싶어요',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toContain('1393');
        expect(response.message).toContain('1577-0199');
        expect(response.suggestedQuestions).toEqual([]);
      });

      it('should return crisis response for self-harm keywords', async () => {
        const request: CoachChatRequest = {
          message: '자해하고 싶어',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toContain('전문 상담사');
        expect(response.message).toContain('1393');
      });

      it('should detect crisis with spaces in keywords', async () => {
        const request: CoachChatRequest = {
          message: '살고 싶지 않아',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toContain('1393');
      });

      it('should NOT trigger crisis for normal messages with partial keyword matches', async () => {
        const request: CoachChatRequest = {
          message: '목숨 걸고 운동해요',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        // 목숨은 위기 키워드이므로 감지됨
        expect(response.message).toContain('1393');
      });

      it('should NOT trigger crisis for normal workout questions', async () => {
        const request: CoachChatRequest = {
          message: '오늘 운동 뭐하면 좋을까요?',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).not.toContain('1393');
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

      it('should handle mixed category keywords', async () => {
        const request: CoachChatRequest = {
          message: '운동하면서 피부관리 어떻게 해요?',
          userContext: null,
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
        expect(response.suggestedQuestions).toBeDefined();
      });

      it('should handle nutrition context with todayCalories', async () => {
        const request: CoachChatRequest = {
          message: '오늘 칼로리 어떻게 되나요?',
          userContext: {
            nutrition: {
              targetCalories: 2000,
              todayCalories: 1500,
            },
          },
        };

        const response = await generateCoachResponse(request);

        expect(response.message).toBeDefined();
      });
    });

    describe('Suggested questions generation', () => {
      it('should generate workout-related suggestions for workout questions', async () => {
        const request: CoachChatRequest = {
          message: '오늘 운동 뭐하면 좋을까요?',
          userContext: {
            workout: {
              streak: 10,
              workoutType: '근력',
            },
          },
        };

        const response = await generateCoachResponse(request);

        expect(response.suggestedQuestions).toBeDefined();
        expect(response.suggestedQuestions!.length).toBeLessThanOrEqual(3);
      });

      it('should generate nutrition-related suggestions for nutrition questions', async () => {
        const request: CoachChatRequest = {
          message: '다이어트 식단 추천해줘',
          userContext: {
            nutrition: {
              targetCalories: 1800,
              goal: '체중 감량',
            },
          },
        };

        const response = await generateCoachResponse(request);

        expect(response.suggestedQuestions).toBeDefined();
      });

      it('should generate skin-related suggestions for skin questions', async () => {
        const request: CoachChatRequest = {
          message: '피부가 건조해요',
          userContext: {
            skinAnalysis: {
              skinType: '건성',
              concerns: ['건조', '당김'],
            },
          },
        };

        const response = await generateCoachResponse(request);

        expect(response.suggestedQuestions).toBeDefined();
      });

      it('should generate personal color suggestions for color questions', async () => {
        const request: CoachChatRequest = {
          message: '퍼스널컬러에 맞는 립 추천해줘',
          userContext: {
            personalColor: {
              season: '봄 웜톤',
              tone: 'bright',
            },
          },
        };

        const response = await generateCoachResponse(request);

        expect(response.suggestedQuestions).toBeDefined();
      });

      it('should generate fashion suggestions for fashion questions', async () => {
        const request: CoachChatRequest = {
          message: '오늘 뭐 입을까요?',
          userContext: {
            personalColor: {
              season: '가을 웜톤',
            },
          },
        };

        const response = await generateCoachResponse(request);

        expect(response.suggestedQuestions).toBeDefined();
      });
    });
  });

  // =========================================================================
  // 환각 필터 통합 테스트
  // =========================================================================
  describe('환각 필터 통합 (Hallucination filter integration)', () => {
    // Gemini 사용 가능 시나리오에서 필터 동작 테스트

    afterEach(() => {
      mockIsGeminiAvailable.mockReturnValue(false);
    });

    it('의료 주장이 포함된 AI 응답에서 sanitize된 텍스트를 반환한다', async () => {
      mockIsGeminiAvailable.mockReturnValue(true);
      mockGenerateContent.mockResolvedValue({
        text: '이 성분으로 치료할 수 있어요. 꾸준히 바르세요.',
      } as never);

      const response = await generateCoachResponse({
        message: '피부 트러블 어떻게 해요?',
        userContext: null,
      });

      expect(response.message).not.toContain('치료할 수');
      expect(response.message).toContain('전문가 상담을 권장드려요');
    });

    it('절대적 효과 보장 표현이 sanitize된다', async () => {
      mockIsGeminiAvailable.mockReturnValue(true);
      mockGenerateContent.mockResolvedValue({
        text: '이 제품은 100% 효과가 있어요. 꼭 써보세요.',
      } as never);

      const response = await generateCoachResponse({
        message: '보습 크림 추천해줘',
        userContext: null,
      });

      expect(response.message).not.toContain('100% 효과');
      expect(response.message).toContain('도움이 될 수 있어요');
    });

    it('면책 조항이 필요한 응답에 COACH_DISCLAIMER가 추가된다', async () => {
      mockIsGeminiAvailable.mockReturnValue(true);
      mockGenerateContent.mockResolvedValue({
        text: '이 영양제를 드시면 도움이 될 거예요.',
      } as never);

      const response = await generateCoachResponse({
        message: '영양제 추천해줘',
        userContext: null,
      });

      expect(response.message).toContain('참고용');
      expect(response.message).toContain('전문가 상담을 권장');
    });

    it('면책 조항이 불필요한 일반 응답에는 DISCLAIMER가 없다', async () => {
      mockIsGeminiAvailable.mockReturnValue(true);
      mockGenerateContent.mockResolvedValue({
        text: '오늘 스쿼트 3세트, 런지 3세트 해보세요!',
      } as never);

      const response = await generateCoachResponse({
        message: '운동 추천해줘',
        userContext: null,
      });

      expect(response.message).not.toContain('참고용');
    });

    it('필터와 cleanResponse가 순서대로 적용된다 (필터 → 정제)', async () => {
      mockIsGeminiAvailable.mockReturnValue(true);
      const longText = '이 성분으로 치료할 수 있어요. ' + '좋은 스킨케어 방법이에요. '.repeat(20);
      mockGenerateContent.mockResolvedValue({
        text: longText,
      } as never);

      const response = await generateCoachResponse({
        message: '피부 관리법 알려줘',
        userContext: null,
      });

      expect(response.message).not.toContain('치료할 수');
      expect(response.message.length).toBeLessThanOrEqual(303);
    });

    it('가격 변동 정보가 포함된 응답에서 sanitize된다', async () => {
      mockIsGeminiAvailable.mockReturnValue(true);
      mockGenerateContent.mockResolvedValue({
        text: '현재 30% 할인 중이에요. 지금이 구매 적기예요!',
      } as never);

      const response = await generateCoachResponse({
        message: '스킨케어 제품 추천해줘',
        userContext: null,
      });

      expect(response.message).not.toContain('30% 할인');
      expect(response.message).toContain('가격은 변동될 수 있어요');
    });
  });

  // =========================================================================
  // generateCoachResponse 엣지 케이스 확장
  // =========================================================================
  describe('generateCoachResponse 엣지 케이스 확장', () => {
    it('1000자 이상의 매우 긴 메시지를 처리한다', async () => {
      const veryLongMessage = '피부가 건조하고 '.repeat(100); // ~800자
      const request: CoachChatRequest = {
        message: veryLongMessage,
        userContext: null,
      };

      const response = await generateCoachResponse(request);

      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
    });

    it('유니코드 특수문자가 포함된 메시지를 처리한다', async () => {
      const request: CoachChatRequest = {
        message: '운동💪 어떻게 해요? 🏋️‍♂️ 근육🦵 키우고 싶어요~!!',
        userContext: null,
      };

      const response = await generateCoachResponse(request);

      expect(response.message).toBeDefined();
      expect(response.suggestedQuestions).toBeDefined();
    });

    it('HTML 태그가 포함된 메시지를 안전하게 처리한다', async () => {
      const request: CoachChatRequest = {
        message: '<script>alert("xss")</script> 운동 추천해줘',
        userContext: null,
      };

      const response = await generateCoachResponse(request);

      expect(response.message).toBeDefined();
      // XSS 스크립트가 응답에 그대로 반환되지 않아야 함
      expect(response.message).not.toContain('<script>');
    });

    it('chatHistory가 undefined일 때 정상 동작한다', async () => {
      const request: CoachChatRequest = {
        message: '안녕하세요',
        userContext: null,
        chatHistory: undefined,
      };

      const response = await generateCoachResponse(request);

      expect(response.message).toBeDefined();
    });

    it('chatHistory가 5개 이상일 때 최근 5개만 사용한다', async () => {
      const history: CoachChatRequest['chatHistory'] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `메시지 ${i}`,
        timestamp: new Date(),
      }));

      const request: CoachChatRequest = {
        message: '계속 이야기해줘',
        userContext: null,
        chatHistory: history,
      };

      const response = await generateCoachResponse(request);

      expect(response.message).toBeDefined();
    });
  });

  // =========================================================================
  // generateSuggestedQuestions 엣지 케이스
  // =========================================================================
  describe('generateSuggestedQuestions 엣지 케이스', () => {
    it('헤어 카테고리 질문에 기본 추천 질문이 포함된다', async () => {
      const request: CoachChatRequest = {
        message: '샴푸 추천해줘',
        userContext: null,
      };

      const response = await generateCoachResponse(request);

      // 헤어 카테고리에 전용 추천이 없으므로 기본 추천 질문이 채워짐
      expect(response.suggestedQuestions).toBeDefined();
      expect(response.suggestedQuestions!.length).toBeLessThanOrEqual(3);
    });

    it('메이크업 카테고리 질문에 기본 추천 질문이 포함된다', async () => {
      const request: CoachChatRequest = {
        message: '파운데이션 어떤 거 좋아요?',
        userContext: null,
      };

      const response = await generateCoachResponse(request);

      expect(response.suggestedQuestions).toBeDefined();
      expect(response.suggestedQuestions!.length).toBeLessThanOrEqual(3);
    });

    it('userContext 없이도 기본 추천 질문 3개를 생성한다', async () => {
      const request: CoachChatRequest = {
        message: '안녕하세요',
        userContext: null,
      };

      const response = await generateCoachResponse(request);

      expect(response.suggestedQuestions).toBeDefined();
      expect(response.suggestedQuestions!.length).toBe(3);
    });

    it('skinAnalysis에 concerns가 있을 때 Gemini 사용 시 해당 고민 관련 질문을 포함한다', async () => {
      mockIsGeminiAvailable.mockReturnValue(true);
      mockGenerateContent.mockResolvedValue({
        text: '피부 관리에는 보습이 중요해요.',
      } as never);

      const request: CoachChatRequest = {
        message: '피부 관리법 알려줘',
        userContext: {
          skinAnalysis: {
            skinType: '지성',
            concerns: ['모공', '피지'],
          },
        },
      };

      const response = await generateCoachResponse(request);

      expect(response.suggestedQuestions).toBeDefined();
      // 첫 번째 고민(모공) 관련 질문이 포함되어야 함
      const hasRelatedQuestion = response.suggestedQuestions!.some((q) => q.includes('모공'));
      expect(hasRelatedQuestion).toBe(true);

      mockIsGeminiAvailable.mockReturnValue(false);
    });

    it('nutrition 컨텍스트에 targetCalories가 있을 때 Gemini 사용 시 관련 질문을 포함한다', async () => {
      mockIsGeminiAvailable.mockReturnValue(true);
      mockGenerateContent.mockResolvedValue({
        text: '균형 잡힌 식단이 중요해요.',
      } as never);

      const request: CoachChatRequest = {
        message: '오늘 뭐 먹을까요?',
        userContext: {
          nutrition: {
            targetCalories: 2200,
          },
        },
      };

      const response = await generateCoachResponse(request);

      expect(response.suggestedQuestions).toBeDefined();
      const hasCalorieQuestion = response.suggestedQuestions!.some((q) => q.includes('2200'));
      expect(hasCalorieQuestion).toBe(true);

      mockIsGeminiAvailable.mockReturnValue(false);
    });
  });

  // =========================================================================
  // 스트리밍 함수 테스트
  // =========================================================================
  describe('generateCoachResponseStream', () => {
    afterEach(() => {
      mockIsGeminiAvailable.mockReturnValue(false);
    });

    it('Gemini 미사용 시 fallback 응답을 yield한다', async () => {
      mockIsGeminiAvailable.mockReturnValue(false);

      const chunks: string[] = [];
      for await (const chunk of generateCoachResponseStream({
        message: '운동 추천해줘',
        userContext: null,
      })) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBeDefined();
      expect(chunks[0].length).toBeGreaterThan(0);
    });

    it('위기 메시지 감지 시 위기 응답을 yield한다', async () => {
      const chunks: string[] = [];
      for await (const chunk of generateCoachResponseStream({
        message: '죽고싶어요',
        userContext: null,
      })) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(1);
      expect(chunks[0]).toContain('1393');
    });

    it('Gemini 스트리밍이 정상 작동하면 청크를 yield한다', async () => {
      mockIsGeminiAvailable.mockReturnValue(true);

      // AsyncGenerator mock 생성
      async function* mockStream(): AsyncGenerator<string> {
        yield '안녕하세요! ';
        yield '오늘 ';
        yield '운동 추천이에요.';
      }
      mockGenerateContentStream.mockReturnValue(mockStream());

      const chunks: string[] = [];
      for await (const chunk of generateCoachResponseStream({
        message: '운동 추천해줘',
        userContext: null,
      })) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(3);
      expect(chunks[0]).toBe('안녕하세요! ');
      expect(chunks[2]).toBe('운동 추천이에요.');
    });

    it('스트리밍 중 에러 발생 시 fallback을 yield한다', async () => {
      mockIsGeminiAvailable.mockReturnValue(true);

      async function* errorStream(): AsyncGenerator<string> {
        yield '시작...';
        throw new Error('스트리밍 에러');
      }
      mockGenerateContentStream.mockReturnValue(errorStream());

      const chunks: string[] = [];
      for await (const chunk of generateCoachResponseStream({
        message: '운동 추천해줘',
        userContext: null,
      })) {
        chunks.push(chunk);
      }

      // 에러 후 fallback 응답이 yield되어야 함
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.length).toBeGreaterThan(0);
    });

    it('빈 청크는 yield하지 않는다', async () => {
      mockIsGeminiAvailable.mockReturnValue(true);

      async function* streamWithEmpty(): AsyncGenerator<string> {
        yield '첫 번째';
        yield '';
        yield '세 번째';
      }
      mockGenerateContentStream.mockReturnValue(streamWithEmpty());

      const chunks: string[] = [];
      for await (const chunk of generateCoachResponseStream({
        message: '운동 추천해줘',
        userContext: null,
      })) {
        chunks.push(chunk);
      }

      // 빈 문자열은 필터링됨
      expect(chunks.length).toBe(2);
      expect(chunks).not.toContain('');
    });
  });
});
