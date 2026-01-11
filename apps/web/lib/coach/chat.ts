/**
 * AI 웰니스 코치 채팅 로직
 * @description Gemini 기반 맞춤 웰니스 조언 채팅 + RAG 연동
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { coachLogger } from '@/lib/utils/logger';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { UserContext } from './context';
import { buildCoachSystemPrompt, getQuestionHint } from './prompts';
import { searchSkinProducts, formatSkinProductsForPrompt } from './skin-rag';
import { searchByPersonalColor, formatPersonalColorForPrompt } from './personal-color-rag';
import { searchFashionItems, formatFashionForPrompt } from './fashion-rag';
import { searchNutritionItems, formatNutritionForPrompt } from './nutrition-rag';
import { searchWorkoutItems, formatWorkoutForPrompt } from './workout-rag';

// API 키 검증
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// 안전 설정
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

/**
 * 채팅 메시지 타입
 */
export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * 채팅 요청 타입
 */
export interface CoachChatRequest {
  message: string;
  userContext: UserContext | null;
  chatHistory?: CoachMessage[];
}

/**
 * 채팅 응답 타입
 */
export interface CoachChatResponse {
  message: string;
  suggestedQuestions?: string[];
}

/**
 * Fallback 응답 (AI 실패 시)
 */
const FALLBACK_RESPONSES: Record<string, string> = {
  workout:
    '운동에 관해 궁금하시군요! 일반적으로 주 3-4회 30분 이상의 운동을 권장해요. 구체적인 조언을 위해 운동 분석을 진행해보시는 건 어떨까요?',
  nutrition:
    '영양에 대한 질문이시네요! 균형 잡힌 식단과 충분한 수분 섭취가 중요해요. 더 맞춤화된 조언을 위해 영양 목표를 설정해보세요.',
  skin: '피부 관련 질문이시군요! 기본적으로 클렌징, 보습, 자외선 차단이 중요해요. 피부 분석 결과를 바탕으로 더 상세한 조언을 드릴 수 있어요.',
  // Phase K: 퍼스널 컬러 상담
  personalColor:
    '퍼스널 컬러에 관한 질문이시군요! 퍼스널 컬러 분석 결과를 바탕으로 어울리는 색상 조합을 추천해드릴 수 있어요. 먼저 분석을 진행해보시는 건 어떨까요?',
  // Phase K: 패션 상담
  fashion:
    '패션에 대한 질문이시네요! 체형과 퍼스널 컬러를 고려한 스타일링 조언을 드릴 수 있어요. 분석 결과를 바탕으로 맞춤 코디를 추천받아보세요.',
  default:
    '좋은 질문이에요! 정확한 답변을 드리기 어려운 상황이에요. 잠시 후 다시 시도해주시거나, 더 구체적인 질문을 해주시면 도움이 될 거예요.',
};

/**
 * 질문 카테고리 타입
 */
type QuestionCategory = 'workout' | 'nutrition' | 'skin' | 'personalColor' | 'fashion' | 'default';

/**
 * 질문 카테고리 감지
 */
function detectQuestionCategory(question: string): QuestionCategory {
  const lowerQ = question.toLowerCase();

  // Phase K: 퍼스널 컬러 관련 (패션보다 우선)
  if (
    lowerQ.includes('퍼스널컬러') ||
    lowerQ.includes('퍼스널 컬러') ||
    lowerQ.includes('웜톤') ||
    lowerQ.includes('쿨톤') ||
    lowerQ.includes('시즌') ||
    (lowerQ.includes('어울리는') && lowerQ.includes('색'))
  ) {
    return 'personalColor';
  }

  // Phase K: 패션/코디 관련
  if (
    lowerQ.includes('옷') ||
    lowerQ.includes('코디') ||
    lowerQ.includes('스타일') ||
    lowerQ.includes('패션') ||
    (lowerQ.includes('뭐') && lowerQ.includes('입'))
  ) {
    return 'fashion';
  }

  if (
    lowerQ.includes('운동') ||
    lowerQ.includes('헬스') ||
    lowerQ.includes('근육') ||
    lowerQ.includes('스트레칭')
  ) {
    return 'workout';
  }
  if (
    lowerQ.includes('먹') ||
    lowerQ.includes('음식') ||
    lowerQ.includes('칼로리') ||
    lowerQ.includes('다이어트') ||
    lowerQ.includes('단백질')
  ) {
    return 'nutrition';
  }
  if (
    lowerQ.includes('피부') ||
    lowerQ.includes('화장품') ||
    lowerQ.includes('스킨케어') ||
    lowerQ.includes('보습')
  ) {
    return 'skin';
  }

  return 'default';
}

/**
 * 피부 상담 질문인지 확인 (Phase D)
 */
function isSkinConsultationQuestion(question: string): boolean {
  const lowerQ = question.toLowerCase();

  // 피부 고민 상담 키워드
  const skinConcernKeywords = [
    '피부',
    '트러블',
    '여드름',
    '건조',
    '지성',
    '민감',
    '주름',
    '모공',
    '홍조',
    '각질',
    '잡티',
    '다크서클',
    '탄력',
    '미백',
    '보습',
  ];

  // 스킨케어/루틴 키워드
  const routineKeywords = ['스킨케어', '루틴', '클렌징', '세안', '토너', '세럼', '크림', '선크림'];

  // 성분 관련 키워드
  const ingredientKeywords = [
    '레티놀',
    '비타민',
    '나이아신',
    '히알루론',
    '세라마이드',
    'aha',
    'bha',
  ];

  return (
    skinConcernKeywords.some((kw) => lowerQ.includes(kw)) ||
    routineKeywords.some((kw) => lowerQ.includes(kw)) ||
    ingredientKeywords.some((kw) => lowerQ.includes(kw))
  );
}

/**
 * 퍼스널 컬러 상담 질문인지 확인 (Phase K)
 */
function isPersonalColorQuestion(question: string): boolean {
  const lowerQ = question.toLowerCase();

  const personalColorKeywords = [
    '퍼스널컬러',
    '퍼스널 컬러',
    '웜톤',
    '쿨톤',
    '시즌',
    '어울리는 색',
    '안 어울리는 색',
    '립 색상',
    '염색',
    '헤어 컬러',
    '색 조합',
  ];

  return personalColorKeywords.some((kw) => lowerQ.includes(kw));
}

/**
 * 패션 상담 질문인지 확인 (Phase K)
 */
function isFashionQuestion(question: string): boolean {
  const lowerQ = question.toLowerCase();

  const fashionKeywords = [
    '옷',
    '코디',
    '스타일',
    '패션',
    '입',
    '면접룩',
    '데이트룩',
    '출근룩',
    '옷장',
    '상의',
    '하의',
    '아우터',
  ];

  return fashionKeywords.some((kw) => lowerQ.includes(kw));
}

/**
 * 영양/레시피 상담 질문인지 확인 (Phase K)
 */
function isNutritionQuestion(question: string): boolean {
  const lowerQ = question.toLowerCase();

  const nutritionKeywords = [
    '레시피',
    '요리',
    '만들',
    '냉장고',
    '식재료',
    '유통기한',
    '밥',
    '식사',
    '점심',
    '저녁',
    '아침',
    '간식',
    '야식',
    '다이어트',
    '벌크업',
    '식단',
    '칼로리',
    '단백질',
  ];

  return nutritionKeywords.some((kw) => lowerQ.includes(kw));
}

/**
 * 운동 상담 질문인지 확인 (Phase K)
 */
function isWorkoutQuestion(question: string): boolean {
  const lowerQ = question.toLowerCase();

  const workoutKeywords = [
    '운동',
    '헬스',
    '근육',
    '스트레칭',
    '웨이트',
    '런닝',
    '유산소',
    '홈트',
    '맨몸',
    '스쿼트',
    '플랭크',
    '덤벨',
    '요가',
    '필라테스',
    '살빼',
    '체력',
  ];

  return workoutKeywords.some((kw) => lowerQ.includes(kw));
}

/**
 * 제품 추천이 필요한 질문인지 확인
 */
function needsProductRecommendation(
  question: string
): 'cosmetic' | 'supplement' | 'equipment' | null {
  const lowerQ = question.toLowerCase();

  // 화장품/스킨케어 추천 (더 넓은 범위로 확장)
  if (
    (lowerQ.includes('추천') || lowerQ.includes('어떤') || lowerQ.includes('뭐가 좋')) &&
    (lowerQ.includes('화장품') ||
      lowerQ.includes('스킨케어') ||
      lowerQ.includes('세럼') ||
      lowerQ.includes('크림') ||
      lowerQ.includes('토너') ||
      lowerQ.includes('로션') ||
      lowerQ.includes('제품'))
  ) {
    return 'cosmetic';
  }

  // 영양제/건강식품 추천
  if (
    (lowerQ.includes('추천') || lowerQ.includes('어떤') || lowerQ.includes('뭐가 좋')) &&
    (lowerQ.includes('영양제') ||
      lowerQ.includes('비타민') ||
      lowerQ.includes('보충제') ||
      lowerQ.includes('유산균') ||
      lowerQ.includes('오메가'))
  ) {
    return 'supplement';
  }

  // 운동기구 추천
  if (
    (lowerQ.includes('추천') || lowerQ.includes('어떤') || lowerQ.includes('뭐가 좋')) &&
    (lowerQ.includes('운동기구') ||
      lowerQ.includes('덤벨') ||
      lowerQ.includes('매트') ||
      lowerQ.includes('홈트') ||
      lowerQ.includes('기구'))
  ) {
    return 'equipment';
  }

  return null;
}

/**
 * RAG: 제품 DB에서 관련 제품 검색
 */
async function searchRelatedProducts(
  productType: 'cosmetic' | 'supplement' | 'equipment',
  userContext: UserContext | null,
  limit = 3
): Promise<string> {
  try {
    const supabase = createClerkSupabaseClient();
    let contextStr = '';

    if (productType === 'cosmetic') {
      // 사용자 피부 타입/고민에 맞는 화장품 검색
      let query = supabase
        .from('cosmetic_products')
        .select('name, brand, category, key_ingredients, skin_types, concerns, price_krw')
        .eq('is_active', true)
        .limit(limit);

      // 피부 타입 필터
      if (userContext?.skinAnalysis?.skinType) {
        query = query.contains('skin_types', [userContext.skinAnalysis.skinType]);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        contextStr = '\n\n## 추천 제품 정보\n';
        data.forEach((p, i) => {
          contextStr += `${i + 1}. ${p.brand} ${p.name} (${p.category})\n`;
          contextStr += `   - 주요 성분: ${(p.key_ingredients as string[] | null)?.slice(0, 3).join(', ') || '정보 없음'}\n`;
          contextStr += `   - 가격: ${p.price_krw?.toLocaleString() || '미정'}원\n`;
        });
      }
    } else if (productType === 'supplement') {
      const { data } = await supabase
        .from('supplement_products')
        .select('name, brand, category, main_ingredients, benefits, price_krw')
        .eq('is_active', true)
        .limit(limit);

      if (data && data.length > 0) {
        contextStr = '\n\n## 추천 영양제 정보\n';
        data.forEach((p, i) => {
          const ingredients = p.main_ingredients as Array<{ name: string }> | null;
          contextStr += `${i + 1}. ${p.brand} ${p.name}\n`;
          contextStr += `   - 주요 성분: ${
            ingredients
              ?.slice(0, 3)
              .map((ing) => ing.name)
              .join(', ') || '정보 없음'
          }\n`;
          contextStr += `   - 효능: ${(p.benefits as string[] | null)?.slice(0, 2).join(', ') || '정보 없음'}\n`;
        });
      }
    } else if (productType === 'equipment') {
      const { data } = await supabase
        .from('workout_equipment')
        .select('name, brand, category, target_muscles, difficulty_level, price_krw')
        .eq('is_active', true)
        .limit(limit);

      if (data && data.length > 0) {
        contextStr = '\n\n## 추천 운동기구 정보\n';
        data.forEach((p, i) => {
          contextStr += `${i + 1}. ${p.brand} ${p.name} (${p.category})\n`;
          contextStr += `   - 타겟 부위: ${(p.target_muscles as string[] | null)?.join(', ') || '정보 없음'}\n`;
          contextStr += `   - 난이도: ${p.difficulty_level || '정보 없음'}\n`;
        });
      }
    }

    return contextStr;
  } catch (error) {
    coachLogger.error('RAG search error:', error);
    return '';
  }
}

/**
 * 채팅 히스토리를 프롬프트 형식으로 변환
 */
function formatChatHistory(history: CoachMessage[]): string {
  if (!history || history.length === 0) return '';

  // 최근 5개 대화만 사용 (컨텍스트 길이 제한)
  const recentHistory = history.slice(-5);

  const formatted = recentHistory
    .map((msg) => {
      const role = msg.role === 'user' ? '사용자' : '코치';
      return `${role}: ${msg.content}`;
    })
    .join('\n');

  return `\n\n## 대화 기록\n${formatted}\n`;
}

/**
 * AI 코치 응답 생성
 */
export async function generateCoachResponse(request: CoachChatRequest): Promise<CoachChatResponse> {
  const { message, userContext, chatHistory } = request;

  // AI 서비스 사용 불가 시 Fallback
  if (!genAI) {
    coachLogger.warn('Gemini API key not configured, using fallback');
    const category = detectQuestionCategory(message);
    return {
      message: FALLBACK_RESPONSES[category],
      suggestedQuestions: [
        '오늘 운동 뭐하면 좋을까요?',
        '다이어트 간식 추천해줘',
        '물 얼마나 마셔야 해요?',
      ],
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      safetySettings,
    });

    // 시스템 프롬프트 구성
    const systemPrompt = buildCoachSystemPrompt(userContext);
    const questionHint = getQuestionHint(message);
    const historySection = formatChatHistory(chatHistory || []);

    // RAG: 도메인별 RAG 검색
    let ragContext = '';
    const productType = needsProductRecommendation(message);

    // Phase K: 퍼스널 컬러 상담 질문이면 personal-color-rag 사용
    if (isPersonalColorQuestion(message)) {
      const colorMatch = await searchByPersonalColor(userContext, message);
      ragContext = formatPersonalColorForPrompt(colorMatch);
    }
    // Phase K: 패션 상담 질문이면 fashion-rag 사용
    else if (isFashionQuestion(message)) {
      const fashionResult = await searchFashionItems(userContext, message);
      ragContext = formatFashionForPrompt(fashionResult);
    }
    // Phase K: 영양/레시피 상담 질문이면 nutrition-rag 사용
    else if (isNutritionQuestion(message)) {
      const nutritionResult = await searchNutritionItems(userContext, message);
      ragContext = formatNutritionForPrompt(nutritionResult);
    }
    // Phase K: 운동 상담 질문이면 workout-rag 사용
    else if (isWorkoutQuestion(message)) {
      const workoutResult = await searchWorkoutItems(userContext, message);
      ragContext = formatWorkoutForPrompt(workoutResult);
    }
    // Phase D: 피부 상담 질문이면 skin-rag 사용
    else if (isSkinConsultationQuestion(message)) {
      const skinProducts = await searchSkinProducts(userContext, message);
      ragContext = formatSkinProductsForPrompt(skinProducts);
    } else if (productType) {
      ragContext = await searchRelatedProducts(productType, userContext);
    }

    const fullPrompt = `${systemPrompt}${historySection}${ragContext}

${questionHint ? `참고: ${questionHint}\n` : ''}
## 사용자 질문
"${message}"

위 질문에 대해 200자 이내로 친근하고 간결하게 답변해주세요.${ragContext ? ' 추천 제품 정보가 있다면 활용해서 구체적으로 추천해주세요.' : ''}`;

    // Gemini 호출 (타임아웃 3초)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 3000);
    });

    const resultPromise = model.generateContent(fullPrompt);
    const result = await Promise.race([resultPromise, timeoutPromise]);

    const response = await result.response;
    const text = response.text();

    // 응답 정제 (이모지 개수 제한, 길이 제한)
    const cleanedResponse = cleanResponse(text);

    // 추천 질문 생성
    const suggestedQuestions = generateSuggestedQuestions(message, userContext);

    return {
      message: cleanedResponse,
      suggestedQuestions,
    };
  } catch (error) {
    coachLogger.error('Gemini error, falling back to mock:', error);
    const category = detectQuestionCategory(message);
    return {
      message: FALLBACK_RESPONSES[category],
      suggestedQuestions: [
        '오늘 운동 뭐하면 좋을까요?',
        '다이어트 간식 추천해줘',
        '물 얼마나 마셔야 해요?',
      ],
    };
  }
}

/**
 * 응답 정제 (이모지 제한, 길이 제한)
 */
function cleanResponse(text: string): string {
  let cleaned = text.trim();

  // 300자 초과 시 자르기
  if (cleaned.length > 300) {
    cleaned = cleaned.slice(0, 297) + '...';
  }

  // 이모지 개수 세기 및 제한 (2개 초과 시 제거)
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  const emojis = cleaned.match(emojiRegex) || [];

  if (emojis.length > 2) {
    // 처음 2개만 유지
    let emojiCount = 0;
    cleaned = cleaned.replace(emojiRegex, (match) => {
      emojiCount++;
      return emojiCount <= 2 ? match : '';
    });
  }

  return cleaned;
}

/**
 * 추천 질문 생성
 */
function generateSuggestedQuestions(
  currentQuestion: string,
  userContext: UserContext | null
): string[] {
  const suggestions: string[] = [];
  const category = detectQuestionCategory(currentQuestion);

  // 카테고리별 추천 질문
  if (category === 'workout') {
    suggestions.push('운동 후에 뭘 먹으면 좋아요?');
    if (userContext?.workout?.streak) {
      suggestions.push('연속 운동 기록을 유지하려면 어떻게 해요?');
    }
  } else if (category === 'nutrition') {
    suggestions.push('하루에 물 얼마나 마셔야 해요?');
    if (userContext?.nutrition?.targetCalories) {
      suggestions.push(`${userContext.nutrition.targetCalories}kcal 맞추려면 뭘 먹어야 해요?`);
    }
  } else if (category === 'skin') {
    suggestions.push('스킨케어 루틴 추천해줘');
    if (userContext?.skinAnalysis?.concerns?.length) {
      const concern = userContext.skinAnalysis.concerns[0];
      suggestions.push(`${concern} 개선하려면 어떻게 해요?`);
    }
  } else if (category === 'personalColor') {
    // Phase K: 퍼스널 컬러 추천 질문
    suggestions.push('내 시즌에 맞는 립 색상 추천해줘');
    if (userContext?.personalColor?.season) {
      suggestions.push(`${userContext.personalColor.season}에 피해야 할 색은?`);
    }
    suggestions.push('염색하려는데 어떤 색이 어울려?');
  } else if (category === 'fashion') {
    // Phase K: 패션 추천 질문
    suggestions.push('내 체형에 맞는 옷 추천해줘');
    if (userContext?.personalColor?.season) {
      suggestions.push('내 퍼스널컬러에 맞는 코디 알려줘');
    }
    suggestions.push('계절별로 어떤 스타일이 좋아요?');
  }

  // 기본 추천 질문 추가
  if (suggestions.length < 3) {
    const defaults = [
      '오늘 운동 뭐하면 좋을까요?',
      '건강한 간식 추천해줘',
      '수면의 질을 높이려면?',
    ];
    for (const q of defaults) {
      if (!suggestions.includes(q) && suggestions.length < 3) {
        suggestions.push(q);
      }
    }
  }

  return suggestions.slice(0, 3);
}

/**
 * 스트리밍 응답 생성 (향후 확장용)
 */
export async function* generateCoachResponseStream(
  request: CoachChatRequest
): AsyncGenerator<string, void, unknown> {
  if (!genAI) {
    yield FALLBACK_RESPONSES[detectQuestionCategory(request.message)];
    return;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      safetySettings,
    });

    const systemPrompt = buildCoachSystemPrompt(request.userContext);
    const fullPrompt = `${systemPrompt}\n\n## 사용자 질문\n"${request.message}"\n\n위 질문에 대해 200자 이내로 친근하고 간결하게 답변해주세요.`;

    const result = await model.generateContentStream(fullPrompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    coachLogger.error('Streaming error:', error);
    yield FALLBACK_RESPONSES[detectQuestionCategory(request.message)];
  }
}
