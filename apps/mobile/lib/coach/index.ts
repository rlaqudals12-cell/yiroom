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
  general: [
    '오늘 컨디션 체크해줘',
    '스트레스 해소법 알려줘',
    '숙면을 위한 팁 있어?',
  ],
  workout: [
    '오늘 운동 뭐하면 좋을까?',
    '스트레칭 루틴 추천해줘',
    '운동 후 회복에 좋은 음식은?',
  ],
  nutrition: [
    '건강한 간식 추천해줘',
    '하루에 물 얼마나 마셔야 해?',
    '단백질 보충 어떻게 하면 좋아?',
  ],
  skin: [
    '스킨케어 루틴 알려줘',
    '자외선 차단 팁 있어?',
    '피부에 좋은 음식 추천해줘',
  ],
};

export type QuestionCategory = keyof typeof QUICK_QUESTIONS;

// ============================================
// API 함수
// ============================================

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://yiroom.vercel.app';

/**
 * AI 코치에게 메시지 전송
 */
export async function sendCoachMessage(
  message: string,
  chatHistory: CoachMessage[],
  authToken?: string
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

/**
 * 질문 카테고리 감지
 */
function detectQuestionCategory(
  question: string
): 'workout' | 'nutrition' | 'skin' | 'default' {
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
 * Mock 응답 생성
 */
export function getMockResponse(message: string): CoachChatResponse {
  const category = detectQuestionCategory(message);
  return {
    message: FALLBACK_RESPONSES[category],
    suggestedQuestions: [
      '오늘 운동 뭐하면 좋을까요?',
      '건강한 간식 추천해줘',
      '스킨케어 루틴 알려줘',
    ],
  };
}
