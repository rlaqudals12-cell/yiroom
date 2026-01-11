'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';
import { QuickQuestions } from './QuickQuestions';
import { CoachHeader } from './CoachHeader';
import type { CoachMessage, UserContext } from '@/lib/coach/client';
import { QUICK_QUESTIONS_BY_CATEGORY, summarizeContext } from '@/lib/coach/client';

interface ChatInterfaceProps {
  userContext: UserContext | null;
  onSendMessage: (
    message: string,
    history: CoachMessage[]
  ) => Promise<{ message: string; suggestedQuestions?: string[] }>;
  /** 스트리밍 응답 사용 여부 (기본: false) */
  useStreaming?: boolean;
}

export function ChatInterface({
  userContext,
  onSendMessage,
  useStreaming = false,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // 스트리밍 중인 메시지 내용
  const [streamingContent, setStreamingContent] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] =
    useState<keyof typeof QUICK_QUESTIONS_BY_CATEGORY>('general');
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 스트리밍 중단을 위한 AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  // 메시지 영역 스크롤
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // 스트리밍 API를 통한 메시지 전송
  const handleStreamingSend = useCallback(
    async (messageText: string, currentMessages: CoachMessage[]) => {
      // 이전 요청 중단
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/coach/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            chatHistory: currentMessages,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Stream request failed');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No reader available');
        }

        const decoder = new TextDecoder();
        let accumulatedContent = '';

        // SSE 이벤트 파싱 및 처리
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'chunk') {
                  accumulatedContent += data.content;
                  setStreamingContent(accumulatedContent);
                } else if (data.type === 'done') {
                  // 스트리밍 완료 - 최종 메시지 저장
                  const assistantMessage: CoachMessage = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                  setStreamingContent('');

                  if (data.suggestedQuestions) {
                    setSuggestedQuestions(data.suggestedQuestions);
                  }
                } else if (data.type === 'error') {
                  throw new Error(data.message);
                }
              } catch {
                // JSON 파싱 실패 시 무시 (불완전한 청크일 수 있음)
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // 사용자가 중단한 경우
          return;
        }
        throw error;
      }
    },
    []
  );

  // 메시지 전송
  const handleSend = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || loading) return;

      const userMessage: CoachMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: messageText.trim(),
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput('');
      setLoading(true);
      setShowQuickQuestions(false);

      try {
        if (useStreaming) {
          // 스트리밍 모드
          await handleStreamingSend(messageText, updatedMessages);
        } else {
          // 일반 모드
          const response = await onSendMessage(messageText, updatedMessages);

          const assistantMessage: CoachMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response.message,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMessage]);

          if (response.suggestedQuestions) {
            setSuggestedQuestions(response.suggestedQuestions);
          }
        }
      } catch (error) {
        console.error('[Coach] 메시지 전송 오류:', error);
        setStreamingContent('');
        const errorMessage: CoachMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '죄송해요, 잠시 문제가 생겼어요. 다시 시도해주세요.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, onSendMessage, useStreaming, handleStreamingSend]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleQuickQuestion = (question: string) => {
    handleSend(question);
  };

  const categories = [
    { key: 'general' as const, label: '일반', icon: '💡' },
    { key: 'workout' as const, label: '운동', icon: '💪' },
    { key: 'nutrition' as const, label: '영양', icon: '🥗' },
    { key: 'skin' as const, label: '피부', icon: '✨' },
    { key: 'hair' as const, label: '헤어', icon: '💇' },
    { key: 'makeup' as const, label: '메이크업', icon: '💄' },
  ];

  const contextSummary = userContext ? summarizeContext(userContext) : undefined;

  return (
    <div data-testid="coach-chat-interface" className="flex flex-col h-full bg-background">
      {/* 헤더 */}
      <CoachHeader contextSummary={contextSummary} />

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 초기 인사 */}
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-6">
              안녕하세요! 저는 이룸 웰니스 코치예요.
              <br />
              운동, 영양, 피부, 헤어, 메이크업에 대해 무엇이든 물어보세요.
            </p>

            {/* 카테고리 탭 */}
            <div className="flex justify-center flex-wrap gap-2 mb-4 px-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1',
                    activeCategory === cat.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 빠른 질문 */}
            <div className="max-w-md mx-auto">
              <QuickQuestions
                questions={QUICK_QUESTIONS_BY_CATEGORY[activeCategory]}
                onSelect={handleQuickQuestion}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* 대화 내역 */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* 스트리밍 메시지 표시 */}
        {streamingContent && (
          <div className="flex gap-2 items-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
              <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
            </div>
          </div>
        )}

        {/* 로딩 인디케이터 (스트리밍 중이 아닐 때만) */}
        {loading && !streamingContent && (
          <div className="flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
              <p className="text-sm text-muted-foreground">생각 중...</p>
            </div>
          </div>
        )}

        {/* 추천 질문 */}
        {!loading && suggestedQuestions.length > 0 && messages.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">이런 것도 물어보세요</p>
            <QuickQuestions
              questions={suggestedQuestions}
              onSelect={handleQuickQuestion}
              variant="compact"
            />
          </div>
        )}

        {/* 빠른 질문 토글 (대화 중) */}
        {messages.length > 0 && (
          <button
            onClick={() => setShowQuickQuestions(!showQuickQuestions)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto"
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', showQuickQuestions && 'rotate-180')}
            />
            빠른 질문 {showQuickQuestions ? '숨기기' : '보기'}
          </button>
        )}

        {showQuickQuestions && messages.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1',
                    activeCategory === cat.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
            <QuickQuestions
              questions={QUICK_QUESTIONS_BY_CATEGORY[activeCategory]}
              onSelect={handleQuickQuestion}
              disabled={loading}
              variant="compact"
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문을 입력하세요..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">
          AI 답변은 참고용이에요. 전문적인 조언은 전문가와 상담하세요.
        </p>
      </div>
    </div>
  );
}
