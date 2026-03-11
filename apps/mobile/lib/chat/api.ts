/**
 * AI 채팅 API 클라이언트
 * 웹의 /api/chat 엔드포인트 호출
 */

import type { ChatMessage, ChatResponse } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://yiroom.vercel.app';

// 빠른 질문 카테고리
export const CHAT_QUICK_QUESTIONS = {
  general: ['오늘 뭐 하면 좋을까?', '기분 전환 방법 알려줘', '건강한 하루 루틴 추천해줘'],
  beauty: [
    '내 피부 타입에 맞는 관리법은?',
    '퍼스널 컬러 활용법 알려줘',
    '계절별 스킨케어 팁 있어?',
  ],
  wellness: ['스트레스 해소법 알려줘', '수면의 질 높이는 방법은?', '명상 초보자 가이드 알려줘'],
  lifestyle: [
    '건강한 식습관 만드는 방법은?',
    '일상에서 실천할 수 있는 운동은?',
    '자기 관리 습관 추천해줘',
  ],
};

export type ChatQuestionCategory = keyof typeof CHAT_QUICK_QUESTIONS;

/**
 * AI 채팅 메시지 전송
 */
export async function sendChatMessage(
  message: string,
  chatHistory: ChatMessage[],
  authToken?: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
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
    throw new Error(`Chat API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Mock 응답 (오프라인/에러 시)
 */
export function getChatMockResponse(message: string): ChatResponse {
  const lowerMsg = message.toLowerCase();

  let responseMessage: string;

  if (lowerMsg.includes('피부') || lowerMsg.includes('스킨케어') || lowerMsg.includes('화장품')) {
    responseMessage =
      '피부 관리에 관심이 있으시군요! 기본적으로 클렌징, 보습, 자외선 차단이 중요해요. 분석 결과를 기반으로 더 맞춤화된 조언을 받으실 수 있어요.';
  } else if (
    lowerMsg.includes('운동') ||
    lowerMsg.includes('헬스') ||
    lowerMsg.includes('스트레칭')
  ) {
    responseMessage =
      '운동에 대해 궁금하시군요! 규칙적인 운동은 몸과 마음 건강 모두에 도움이 돼요. 운동 분석을 통해 맞춤 루틴을 받아보세요.';
  } else if (lowerMsg.includes('음식') || lowerMsg.includes('영양') || lowerMsg.includes('식단')) {
    responseMessage =
      '영양에 대한 질문이시네요! 균형 잡힌 식단이 건강의 기본이에요. 영양 온보딩을 완료하면 맞춤 가이드를 받을 수 있어요.';
  } else if (lowerMsg.includes('컬러') || lowerMsg.includes('색상') || lowerMsg.includes('옷')) {
    responseMessage =
      '스타일에 관심이 있으시군요! 퍼스널 컬러와 체형 분석을 통해 나에게 어울리는 스타일을 찾아보세요.';
  } else {
    responseMessage =
      '좋은 질문이에요! 지금은 오프라인 상태라 상세한 답변이 어려워요. 인터넷에 연결되면 더 정확한 답변을 드릴 수 있어요.';
  }

  return {
    message: responseMessage,
    suggestedQuestions: ['오늘 뭐 하면 좋을까?', '건강한 간식 추천해줘', '스킨케어 루틴 알려줘'],
  };
}
