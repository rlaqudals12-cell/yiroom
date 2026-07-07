'use client';

import { useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatInterface } from '@/components/coach';
import type { CoachMessage } from '@/lib/coach';
import { QUICK_QUESTIONS_BY_CATEGORY } from '@/lib/coach/client';

/**
 * AI 웰니스 코치 페이지
 * 사용자 컨텍스트는 서버 API에서 자동 조회됨
 *
 * ?q= / ?category= : 분석 결과 페이지 ConsultantCTA가 넘기는 쿼리.
 * (기존엔 CTA가 쿼리를 보내는데 페이지가 읽지 않아 미배선이던 결함 — 2026-07-08)
 */
function CoachPageInner() {
  const searchParams = useSearchParams();
  const initialQuestion = searchParams.get('q') ?? undefined;
  const categoryParam = searchParams.get('category');
  const initialCategory =
    categoryParam && categoryParam in QUICK_QUESTIONS_BY_CATEGORY
      ? (categoryParam as keyof typeof QUICK_QUESTIONS_BY_CATEGORY)
      : undefined;

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
    <div className="h-[calc(100vh-4rem)]" data-testid="coach-page">
      <ChatInterface
        userContext={null}
        onSendMessage={handleSendMessage}
        useStreaming={true}
        initialQuestion={initialQuestion}
        initialCategory={initialCategory}
      />
    </div>
  );
}

export default function CoachPage() {
  // useSearchParams는 Suspense 경계 필요 (Next.js CSR bailout)
  return (
    <Suspense fallback={null}>
      <CoachPageInner />
    </Suspense>
  );
}
