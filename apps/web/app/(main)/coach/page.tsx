'use client';

import { useCallback } from 'react';
import { ChatInterface } from '@/components/coach';
import type { CoachMessage } from '@/lib/coach';

/**
 * AI 웰니스 코치 페이지
 * 사용자 컨텍스트는 서버 API에서 자동 조회됨
 */
export default function CoachPage() {
  // 메시지 전송 핸들러
  const handleSendMessage = useCallback(
    async (
      message: string,
      history: CoachMessage[]
    ): Promise<{ message: string; suggestedQuestions?: string[] }> => {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, chatHistory: history }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return {
        message: data.message,
        suggestedQuestions: data.suggestedQuestions,
      };
    },
    []
  );

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatInterface
        userContext={null}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
