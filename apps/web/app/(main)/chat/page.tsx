'use client';

/**
 * AI 채팅 페이지
 * @description 사용자의 피부, 건강, 제품 관련 질문에 AI가 맞춤 답변 제공
 */

import { useState, useCallback } from 'react';
import { MessageCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessages, ChatInput, SuggestedQuestions } from './_components';
import type { ChatMessage } from '@/types/chat';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const sendMessage = useCallback(
    async (message: string) => {
      // 사용자 메시지 즉시 표시
      const userMessage: ChatMessage = {
        id: `temp_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setShowSuggestions(false);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            sessionId,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '응답을 받지 못했습니다');
        }

        // 세션 ID 저장
        if (result.data.sessionId) {
          setSessionId(result.data.sessionId);
        }

        // AI 응답 추가
        setMessages((prev) => [...prev, result.data.message]);
      } catch (error) {
        // 에러 메시지 표시
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content:
            error instanceof Error
              ? error.message
              : '죄송해요, 일시적인 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setShowSuggestions(true);
  };

  const handleSuggestionSelect = (question: string) => {
    sendMessage(question);
  };

  return (
    <div data-testid="chat-page" className="flex flex-col h-[calc(100vh-64px)]">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">AI 상담</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleNewChat} disabled={messages.length === 0}>
          <RotateCcw className="h-4 w-4 mr-2" />
          새 대화
        </Button>
      </div>

      {/* 메시지 영역 */}
      <ChatMessages messages={messages} isLoading={isLoading} />

      {/* 추천 질문 (첫 화면에서만) */}
      {showSuggestions && messages.length === 0 && (
        <SuggestedQuestions onSelect={handleSuggestionSelect} />
      )}

      {/* 입력 영역 */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
