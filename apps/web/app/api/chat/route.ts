/**
 * AI 채팅 API
 * POST /api/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type { ChatRequest, ChatMessage } from '@/types/chat';
import {
  generateChatResponse,
  generateMockResponse,
  fetchUserContext,
  isGeminiConfigured,
  detectRelatedAnalysis,
} from '@/lib/chat';

// 세션 메모리 저장소 (실제 구현에서는 Redis 또는 DB 사용)
const sessionStore = new Map<string, ChatMessage[]>();

// 세션 ID 생성
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 요청 파싱
    const body = (await request.json()) as ChatRequest;
    const { message, sessionId } = body;

    // 메시지 검증
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '메시지를 입력해주세요' },
        { status: 400 }
      );
    }

    // 메시지 길이 제한
    if (message.length > 1000) {
      return NextResponse.json(
        { success: false, error: '메시지가 너무 깁니다 (최대 1000자)' },
        { status: 400 }
      );
    }

    // 세션 ID 결정
    const currentSessionId = sessionId || generateSessionId();

    // 대화 히스토리 조회
    const history = sessionStore.get(currentSessionId) || [];

    // 사용자 메시지 생성
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    // 히스토리에 추가
    history.push(userMessage);

    // 사용자 컨텍스트 조회
    const context = await fetchUserContext(userId);

    // AI 응답 생성
    let response;

    if (isGeminiConfigured()) {
      response = await generateChatResponse(message, context, history.slice(0, -1));
    } else {
      // Gemini 미설정 시 Mock 응답
      console.log('[Chat API] Gemini not configured, using mock response');
      response = generateMockResponse(message);
    }

    // 관련 분석 유형 감지
    const relatedAnalysis = detectRelatedAnalysis(message);
    if (relatedAnalysis && response.message.metadata) {
      response.message.metadata.relatedAnalysis = relatedAnalysis;
    } else if (relatedAnalysis) {
      response.message.metadata = { relatedAnalysis };
    }

    // AI 응답을 히스토리에 추가
    history.push(response.message);

    // 히스토리 저장 (최대 20개 유지)
    sessionStore.set(currentSessionId, history.slice(-20));

    return NextResponse.json({
      success: true,
      data: {
        message: response.message,
        sessionId: currentSessionId,
        productRecommendations: response.productRecommendations,
      },
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      { success: false, error: '채팅 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
