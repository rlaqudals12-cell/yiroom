/**
 * AI 웰니스 코치 채팅 로직
 * @description Gemini 기반 맞춤 웰니스 조언 채팅 + RAG 연동
 */

import { isFeatureEnabled } from '@yiroom/shared';
import { generateContent, isGeminiAvailable, formatImageForGemini } from '@/lib/gemini/client';
import { reserveCoachTurn, settleCoachTurn } from '@/lib/security';
import { PINNED_VERDICT_MODEL } from '@/lib/gemini/model-contract';
import type { OutputLocale, GeminiResponse } from '@/lib/gemini/client';
import { detectQuestionCategory, isHiddenCoachContent } from './intent';
import { coachLogger } from '@/lib/utils/logger';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { UserContext } from './context';
import { buildCoachSystemPrompt, getQuestionHint } from './prompts';
import { searchSkinProducts, formatSkinProductsForPrompt } from './skin-rag';
import { searchByPersonalColor, formatPersonalColorForPrompt } from './personal-color-rag';
import { searchFashionItems, formatFashionForPrompt } from './fashion-rag';
import { searchNutritionItems, formatNutritionForPrompt } from './nutrition-rag';
import { searchWorkoutItems, formatWorkoutForPrompt } from './workout-rag';
import { searchHairProducts, formatHairProductsForPrompt } from './hair-rag';
import { searchMakeupProducts, formatMakeupProductsForPrompt } from './makeup-rag';
import { filterCoachResponse, needsDisclaimer, COACH_DISCLAIMER } from './hallucination-filter';

/**
 * 채팅 메시지 타입
 */
export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  usedFallback?: boolean;
  confidence?: 'normal' | 'low';
  fallbackReason?: 'model_unavailable' | 'timeout' | 'error';
}

/**
 * 채팅 요청 타입
 */
export interface CoachChatRequest {
  message: string;
  userContext: UserContext | null;
  chatHistory?: CoachMessage[];
  /** 첨부 이미지 (dataURL/base64) — 있으면 멀티모달 판정 모드 */
  imageBase64?: string;
  /**
   * Clerk 사용자 ID — 옷장 RAG 등 개인 데이터 검색용.
   * 반드시 서버에서 auth()로 주입한다 (클라이언트 요청 본문 신뢰 금지).
   * 없으면 개인 옷장 검색을 건너뛴다 (기존 요청 계약 하위호환).
   */
  userId?: string;
  locale?: OutputLocale;
  signal?: AbortSignal;
}

/**
 * 채팅 응답 타입
 */
export interface CoachChatResponse {
  message: string;
  suggestedQuestions?: string[];
  usedFallback: boolean;
  confidence: 'normal' | 'low';
  fallbackReason?: 'model_unavailable' | 'timeout' | 'error';
}

// 위기 감지는 공유 모듈 사용 (Coach, Chat 공통)
import { detectCrisis, CRISIS_RESPONSE_MESSAGE } from '@/lib/safety';

const CRISIS_RESPONSE: CoachChatResponse = {
  message: CRISIS_RESPONSE_MESSAGE,
  usedFallback: false,
  confidence: 'normal',
  suggestedQuestions: [],
};

/**
 * Fallback 응답 (AI 실패 시)
 */
const SCOPE_MESSAGE =
  '피부·퍼스널컬러·체형·헤어·메이크업과 스타일링을 도와드리고 있어요. 궁금한 뷰티 질문을 알려주세요.';

// 숨김 모듈(W-1 운동·N-1 영양)은 폴백 본문에서도 안내하지 않는다(ADR-098).
// 해당 화면이 존재하지 않으므로 '운동 분석을 진행해보세요' 같은 유도는 갈 곳 없는 안내가 된다.
const FALLBACK_RESPONSES: Record<string, string> = {
  workout: SCOPE_MESSAGE,
  nutrition: SCOPE_MESSAGE,
  skin: '피부 관련 질문이시군요! 기본적으로 클렌징, 보습, 자외선 차단이 중요해요. 피부 분석 결과를 바탕으로 더 상세한 조언을 드릴 수 있어요.',
  // Phase K: 퍼스널 컬러 상담
  personalColor:
    '퍼스널 컬러에 관한 질문이시군요! 퍼스널 컬러 분석 결과를 바탕으로 어울리는 색상 조합을 추천해드릴 수 있어요. 먼저 분석을 진행해보시는 건 어떨까요?',
  // Phase K: 패션 상담
  fashion:
    '패션에 대한 질문이시네요! 체형과 퍼스널 컬러를 고려한 스타일링 조언을 드릴 수 있어요. 분석 결과를 바탕으로 맞춤 코디를 추천받아보세요.',
  // 헤어/두피 상담
  hair: '헤어에 관한 질문이시군요! 두피 타입과 모발 상태에 맞는 케어 방법을 안내해드릴 수 있어요. 헤어 분석을 진행해보시는 건 어떨까요?',
  // 메이크업 상담
  makeup:
    '메이크업에 대한 질문이시네요! 퍼스널 컬러와 얼굴형을 고려한 메이크업 팁을 드릴 수 있어요. 먼저 분석을 진행해보세요.',
  default:
    '좋은 질문이에요! 정확한 답변을 드리기 어려운 상황이에요. 잠시 후 다시 시도해주시거나, 더 구체적인 질문을 해주시면 도움이 될 거예요.',
};

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

// 도메인별 RAG 컨텍스트 라우팅
async function resolveRagContext(
  message: string,
  userContext: UserContext | null,
  userId?: string
): Promise<string> {
  if (detectQuestionCategory(message) === 'personalColor') {
    const colorMatch = await searchByPersonalColor(userContext, message);
    return formatPersonalColorForPrompt(colorMatch);
  }
  if (detectQuestionCategory(message) === 'fashion') {
    // 옷장(user_inventory)은 뷰티 — WELLNESS_PHASE2와 무관하게 항상 유지.
    // userId가 있어야 실검색 — 없으면 일반 팁만 (지어내지 않음)
    const fashionResult = await searchFashionItems(userContext, message, userId);
    return formatFashionForPrompt(fashionResult);
  }
  // W-1 운동·N-1 영양 RAG는 숨김 모듈(ADR-098). 뷰티 전속 코치라 오프차터 도메인
  // 지식을 주입하지 않는다 — 게이팅 시 해당 질문은 아래 제품추천/빈 컨텍스트로 흐른다.
  // 플래그 재활성 시 복원(하드룰: 코드 유지).
  if (isFeatureEnabled('WELLNESS_PHASE2') && detectQuestionCategory(message) === 'nutrition') {
    const nutritionResult = await searchNutritionItems(userContext, message);
    return formatNutritionForPrompt(nutritionResult);
  }
  if (isFeatureEnabled('WELLNESS_PHASE2') && detectQuestionCategory(message) === 'workout') {
    const workoutResult = await searchWorkoutItems(userContext, message);
    return formatWorkoutForPrompt(workoutResult);
  }
  if (detectQuestionCategory(message) === 'skin') {
    const skinProducts = await searchSkinProducts(userContext, message);
    return formatSkinProductsForPrompt(skinProducts);
  }
  if (detectQuestionCategory(message) === 'hair') {
    const hairProducts = await searchHairProducts(userContext, message);
    return formatHairProductsForPrompt(hairProducts);
  }
  if (detectQuestionCategory(message) === 'makeup') {
    const makeupProducts = await searchMakeupProducts(userContext, message);
    return formatMakeupProductsForPrompt(makeupProducts);
  }
  const productType = needsProductRecommendation(message);
  if (productType && productType !== 'cosmetic' && !isFeatureEnabled('WELLNESS_PHASE2')) return '';
  if (productType) {
    return searchRelatedProducts(productType, userContext);
  }
  return '';
}

/** RAG와 모델이 같은 예산을 나눠 쓰므로 타이머는 한 번만 만든다. */
export const COACH_DEADLINE_MS = 12_000;
const BEAUTY_QUESTIONS = [
  '스킨케어 루틴을 알려주세요',
  '내 퍼스널컬러에 맞는 색은?',
  '헤어 관리 방법을 알려주세요',
];

function fallbackResponse(
  message: string,
  reason: NonNullable<CoachChatResponse['fallbackReason']>
): CoachChatResponse {
  return {
    message: FALLBACK_RESPONSES[detectQuestionCategory(message)],
    suggestedQuestions: BEAUTY_QUESTIONS,
    usedFallback: true,
    confidence: 'low',
    fallbackReason: reason,
  };
}

export async function generateCoachResponse(request: CoachChatRequest): Promise<CoachChatResponse> {
  const { message, userContext, chatHistory, userId, imageBase64, locale = 'ko' } = request;
  if (detectCrisis(message)) return CRISIS_RESPONSE;
  if (isHiddenCoachContent(message))
    return {
      message: SCOPE_MESSAGE,
      suggestedQuestions: BEAUTY_QUESTIONS,
      usedFallback: false,
      confidence: 'normal',
    };
  if (!isGeminiAvailable()) return fallbackResponse(message, 'model_unavailable');
  // 인증된 서버 사용자 없이 호출 예산을 우회할 수 없도록 경계에서도 닫는다.
  if (!userId) return fallbackResponse(message, 'error');
  const controller = new AbortController();
  const abort = (): void => controller.abort();
  request.signal?.addEventListener('abort', abort, { once: true });
  if (request.signal?.aborted) controller.abort();
  const timer = setTimeout(abort, COACH_DEADLINE_MS);
  let reservation: Awaited<ReturnType<typeof reserveCoachTurn>> | undefined;
  let modelCalled = false;
  let result: GeminiResponse | undefined;
  let rejectDeadline: (() => void) | undefined;
  const expired = new Promise<never>((_, reject) => {
    rejectDeadline = () => reject(new Error('Coach deadline exceeded'));
    controller.signal.addEventListener('abort', rejectDeadline, { once: true });
    if (controller.signal.aborted) rejectDeadline();
  });
  try {
    const work = async (): Promise<CoachChatResponse> => {
      const ragContext = await resolveRagContext(message, userContext, userId);
      if (controller.signal.aborted) throw new Error('Coach deadline exceeded');
      const prompt = `${buildCoachSystemPrompt(userContext, locale)}${formatChatHistory(chatHistory || [])}${ragContext}
${getQuestionHint(message)}
## 사용자 질문
${message}
200자 이내로 간결하게 답변해주세요. 사진이 불명확하면 추측하지 마세요.`;
      const contents = imageBase64 ? [{ text: prompt }, formatImageForGemini(imageBase64)] : prompt;
      if (userId) {
        reservation = await reserveCoachTurn(userId, { signal: controller.signal });
        if (controller.signal.aborted) {
          await settleCoachTurn(reservation, { modelCalled: false });
          throw new Error('Coach deadline exceeded');
        }
        if (!reservation.allowed) {
          // 한도 소진과 저장소 장애를 같은 문구로 뭉개지 않는다.
          // 전자는 의도된 정책이라 정상 안내지만, 후자는 인프라 실패라서 폴백으로 정직하게 표시한다.
          const isPolicyLimit =
            reservation.reason === 'daily_limit' || reservation.reason === 'monthly_limit';
          if (!isPolicyLimit) {
            coachLogger.error('Coach turn reservation unavailable:', reservation.reason);
          }
          return isPolicyLimit
            ? {
                message:
                  '오늘은 기본 뷰티 안내를 이용하실 수 있어요. 루틴을 열어 현재 관리 단계를 확인해주세요.',
                suggestedQuestions: BEAUTY_QUESTIONS,
                usedFallback: false,
                confidence: 'normal',
              }
            : {
                message:
                  '지금은 상담을 준비하지 못했어요. 잠시 후 다시 시도해 주세요. 그동안 루틴에서 현재 관리 단계를 확인하실 수 있어요.',
                suggestedQuestions: BEAUTY_QUESTIONS,
                usedFallback: true,
                confidence: 'low',
                fallbackReason: 'error',
              };
        }
      }
      modelCalled = true;
      result = await generateContent({
        model: PINNED_VERDICT_MODEL,
        contents,
        config: {
          thinkingConfig: { thinkingLevel: 'minimal' },
          maxOutputTokens: 250,
          abortSignal: controller.signal,
        },
      });
      const filtered = filterCoachResponse(result.text);
      const cleaned = cleanResponse(filtered.sanitizedText);
      // 안전 차단(finishReason=SAFETY)이나 출력 토큰 소진으로 본문이 비면
      // 빈 말풍선을 배지 없이 내보내지 않는다.
      if (!cleaned.trim()) {
        coachLogger.error('Coach model returned empty text. usage:', result.usage);
        return fallbackResponse(message, 'error');
      }
      // 범위 밖 응답은 대체하되, 모델을 이미 호출했으므로 정직하게 폴백으로 표시한다.
      if (isHiddenCoachContent(cleaned)) {
        return {
          message: SCOPE_MESSAGE,
          suggestedQuestions: BEAUTY_QUESTIONS,
          usedFallback: true,
          confidence: 'low',
          fallbackReason: 'error',
        };
      }
      return {
        message: needsDisclaimer(cleaned) ? `${cleaned}\n\n${COACH_DISCLAIMER}` : cleaned,
        suggestedQuestions: generateSuggestedQuestions(message, userContext),
        usedFallback: false,
        confidence: 'normal',
      };
    };
    return await Promise.race([work(), expired]);
  } catch (error) {
    coachLogger.error('Coach generation failed:', error);
    return fallbackResponse(message, controller.signal.aborted ? 'timeout' : 'error');
  } finally {
    if (reservation) {
      // 예약은 이미 소진 상태다. 정산 지연이 사용자 deadline을 늘리지 않게 한다.
      const settlement = settleCoachTurn(reservation, {
        modelCalled,
        usage: result?.usage,
        modelVersion: result?.modelVersion,
      }).catch(() => undefined);
      if (!controller.signal.aborted)
        await Promise.race([settlement, expired]).catch(() => undefined);
    }
    clearTimeout(timer);
    request.signal?.removeEventListener('abort', abort);
    if (rejectDeadline) controller.signal.removeEventListener('abort', rejectDeadline);
  }
}

/**
 * 응답 정제 (이모지 제한, 길이 제한)
 */
function cleanResponse(text: string): string {
  let cleaned = text.trim();

  // 표시용 300자 절단은 과금 상한이 아니다. 호출 토큰 상한으로 비용을 제한한다.
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
// eslint-disable-next-line sonarjs/cognitive-complexity -- complex business logic
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
      suggestions.push(`${userContext.personalColor.season}에 주의할 색은?`);
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
    const defaults = [...BEAUTY_QUESTIONS];
    for (const q of defaults) {
      if (!suggestions.includes(q) && suggestions.length < 3) {
        suggestions.push(q);
      }
    }
  }

  return suggestions.filter((q) => !isHiddenCoachContent(q)).slice(0, 3);
}

/**
 * 스트리밍 응답 생성 (RAG, 히스토리, 힌트 포함)
 *
 * generateCoachResponse와 동일한 기능 제공:
 * - 도메인별 RAG 컨텍스트 (skin, personal-color, fashion, nutrition, workout)
 * - 채팅 히스토리 컨텍스트
 * - 질문 힌트
 */
export async function* generateCoachResponseStream(
  request: CoachChatRequest
): AsyncGenerator<string, void, unknown> {
  // 미검열 토큰은 회수할 수 없으므로 완성·검열한 본문만 전달한다.
  const response = await generateCoachResponse(request);
  yield response.message;
}
