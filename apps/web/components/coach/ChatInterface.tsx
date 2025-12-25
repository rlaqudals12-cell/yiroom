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
  onSendMessage: (message: string, history: CoachMessage[]) => Promise<{ message: string; suggestedQuestions?: string[] }>;
}

export function ChatInterface({ userContext, onSendMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<keyof typeof QUICK_QUESTIONS_BY_CATEGORY>('general');
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 영역 스크롤
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setLoading(true);
      setShowQuickQuestions(false);

      try {
        const response = await onSendMessage(messageText, [...messages, userMessage]);

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
      } catch (error) {
        console.error('[Coach] 메시지 전송 오류:', error);
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
    [loading, messages, onSendMessage]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleQuickQuestion = (question: string) => {
    handleSend(question);
  };

  const categories = [
    { key: 'general' as const, label: '일반' },
    { key: 'workout' as const, label: '운동' },
    { key: 'nutrition' as const, label: '영양' },
    { key: 'skin' as const, label: '피부' },
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
              운동, 영양, 피부 관리에 대해 무엇이든 물어보세요.
            </p>

            {/* 카테고리 탭 */}
            <div className="flex justify-center gap-2 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors',
                    activeCategory === cat.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
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

        {/* 로딩 인디케이터 */}
        {loading && (
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
                    'px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors',
                    activeCategory === cat.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
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
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">
          AI 답변은 참고용이에요. 전문적인 조언은 전문가와 상담하세요.
        </p>
      </div>
    </div>
  );
}
