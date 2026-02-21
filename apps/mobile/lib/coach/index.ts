/**
 * AI 웰니스 코치 API 클라이언트
 * 웹 API를 호출하여 AI 코치 기능 제공
 */

// ============================================
// 타입 정의
// ============================================

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UserContext {
  personalColor?: {
    season: string;
    tone?: string;
  };
  skinAnalysis?: {
    skinType: string;
    concerns?: string[];
  };
  bodyAnalysis?: {
    bodyType: string;
    bmi?: number;
  };
  workout?: {
    workoutType?: string;
    goal?: string;
    streak?: number;
  };
  nutrition?: {
    goal?: string;
    targetCalories?: number;
    streak?: number;
  };
}

export interface CoachChatResponse {
  message: string;
  suggestedQuestions?: string[];
}

// ============================================
// 빠른 질문
// ============================================

export const QUICK_QUESTIONS = {
  general: ['오늘 컨디션 체크해줘', '스트레스 해소법 알려줘', '숙면을 위한 팁 있어?'],
  workout: ['오늘 운동 뭐하면 좋을까?', '스트레칭 루틴 추천해줘', '운동 후 회복에 좋은 음식은?'],
  nutrition: [
    '건강한 간식 추천해줘',
    '하루에 물 얼마나 마셔야 해?',
    '단백질 보충 어떻게 하면 좋아?',
  ],
  skin: ['스킨케어 루틴 알려줘', '자외선 차단 팁 있어?', '피부에 좋은 음식 추천해줘'],
};

export type QuestionCategory = keyof typeof QUICK_QUESTIONS;

// ============================================
// API 함수
// ============================================

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://yiroom.vercel.app';

/**
 * AI 코치에게 메시지 전송
 */
export async function sendCoachMessage(
  message: string,
  chatHistory: CoachMessage[],
  authToken?: string,
  userContext?: UserContext
): Promise<CoachChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/coach/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({
      message,
      chatHistory: chatHistory.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      })),
      ...(userContext ? { userContext } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Coach API error: ${response.status}`);
  }

  return response.json();
}

// ============================================
// Mock 응답 (오프라인/에러 시)
// ============================================

const FALLBACK_RESPONSES: Record<string, string> = {
  workout:
    '운동에 관해 궁금하시군요! 일반적으로 주 3-4회 30분 이상의 운동을 권장해요. 구체적인 조언을 위해 운동 분석을 진행해보시는 건 어떨까요?',
  nutrition:
    '영양에 대한 질문이시네요! 균형 잡힌 식단과 충분한 수분 섭취가 중요해요. 더 맞춤화된 조언을 위해 영양 목표를 설정해보세요.',
  skin: '피부 관련 질문이시군요! 기본적으로 클렌징, 보습, 자외선 차단이 중요해요. 피부 분석 결과를 바탕으로 더 상세한 조언을 드릴 수 있어요.',
  default:
    '좋은 질문이에요! 정확한 답변을 드리기 어려운 상황이에요. 잠시 후 다시 시도해주시거나, 더 구체적인 질문을 해주시면 도움이 될 거예요.',
};

// 분석 결과 기반 맞춤 응답
const PERSONALIZED_RESPONSES: Record<string, (ctx: UserContext) => string> = {
  workout: (ctx) => {
    const parts = ['운동에 관해 궁금하시군요!'];
    if (ctx.workout?.streak && ctx.workout.streak > 0) {
      parts.push(`${ctx.workout.streak}일 연속 운동 중이시네요, 대단해요!`);
    }
    if (ctx.bodyAnalysis?.bodyType) {
      const bodyTips: Record<string, string> = {
        hourglass: '모래시계형 체형에는 코어 강화 운동이 좋아요.',
        pear: '하체 중심이라면 상체 밸런스를 위한 운동을 추천해요.',
        apple: '유산소와 코어 운동을 병행하면 효과적이에요.',
        rectangle: '전체 근력 운동으로 실루엣을 만들어보세요.',
        inverted_triangle: '하체 운동을 강화하면 균형 잡힌 체형이 될 수 있어요.',
      };
      const tip = bodyTips[ctx.bodyAnalysis.bodyType];
      if (tip) parts.push(tip);
    }
    if (parts.length === 1) {
      parts.push('주 3-4회 30분 이상 운동을 권장해요.');
    }
    return parts.join(' ');
  },
  nutrition: (ctx) => {
    const parts = ['영양에 대한 질문이시네요!'];
    if (ctx.nutrition?.targetCalories) {
      parts.push(`하루 목표 칼로리 ${ctx.nutrition.targetCalories}kcal에 맞춰 식단을 구성해보세요.`);
    }
    if (ctx.nutrition?.streak && ctx.nutrition.streak > 0) {
      parts.push(`${ctx.nutrition.streak}일 연속 식단 기록 중이시네요!`);
    }
    if (parts.length === 1) {
      parts.push('균형 잡힌 식단과 충분한 수분 섭취가 중요해요.');
    }
    return parts.join(' ');
  },
  skin: (ctx) => {
    const parts = ['피부 관련 질문이시군요!'];
    if (ctx.skinAnalysis?.skinType) {
      const skinTips: Record<string, string> = {
        dry: '건성 피부는 보습이 핵심이에요. 세라마이드 성분의 크림을 추천해요.',
        oily: '지성 피부는 가벼운 수분 크림과 클레이 마스크가 도움이 돼요.',
        combination: '복합성 피부는 T존과 U존을 나눠 관리하는 게 좋아요.',
        sensitive: '민감성 피부는 저자극 제품과 진정 성분(시카, 판테놀)이 좋아요.',
        normal: '정상 피부라도 자외선 차단과 기본 보습은 꾸준히 해주세요.',
      };
      const tip = skinTips[ctx.skinAnalysis.skinType];
      if (tip) parts.push(tip);
    }
    if (ctx.personalColor?.season) {
      const seasonColor: Record<string, string> = {
        Spring: '봄 웜톤',
        Summer: '여름 쿨톤',
        Autumn: '가을 웜톤',
        Winter: '겨울 쿨톤',
      };
      const label = seasonColor[ctx.personalColor.season] ?? ctx.personalColor.season;
      parts.push(`${label}에 어울리는 메이크업 색조도 함께 고려해보세요!`);
    }
    if (parts.length === 1) {
      parts.push('클렌징, 보습, 자외선 차단이 기본이에요.');
    }
    return parts.join(' ');
  },
};

/**
 * 질문 카테고리 감지
 */
function detectQuestionCategory(question: string): 'workout' | 'nutrition' | 'skin' | 'default' {
  const lowerQ = question.toLowerCase();

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
 * Mock 응답 생성 (분석 결과 기반 맞춤 응답)
 */
// 히스토리 관련 re-export
export { getCoachSessions, deleteCoachSession, type CoachSession } from './history';

export function getMockResponse(message: string, userContext?: UserContext): CoachChatResponse {
  const category = detectQuestionCategory(message);

  // 사용자 컨텍스트가 있으면 맞춤 응답 생성
  let responseMessage: string;
  const personalizedFn = PERSONALIZED_RESPONSES[category];
  if (userContext && personalizedFn) {
    responseMessage = personalizedFn(userContext);
  } else {
    responseMessage = FALLBACK_RESPONSES[category];
  }

  // 카테고리별 맞춤 추천 질문
  const suggestedByCategory: Record<string, string[]> = {
    workout: ['오늘 운동 루틴 추천해줘', '스트레칭 방법 알려줘', '근육통 회복법이 궁금해'],
    nutrition: ['건강한 간식 추천해줘', '단백질 많은 음식 알려줘', '다이어트 식단 구성법은?'],
    skin: ['스킨케어 루틴 알려줘', '피부에 좋은 음식은?', '여드름 관리법 알려줘'],
    default: ['오늘 운동 뭐하면 좋을까?', '건강한 간식 추천해줘', '스킨케어 루틴 알려줘'],
  };

  return {
    message: responseMessage,
    suggestedQuestions: suggestedByCategory[category] ?? suggestedByCategory.default,
  };
}
