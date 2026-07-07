'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Loader2, ChevronDown, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';
import { QuickQuestions } from './QuickQuestions';
import { CoachHeader } from './CoachHeader';
import type { CoachMessage, UserContext } from '@/lib/coach/client';
import { QUICK_QUESTIONS_BY_CATEGORY, summarizeContext } from '@/lib/coach/client';
import { FEATURE_FLAGS } from '@yiroom/shared';

interface ChatInterfaceProps {
  userContext: UserContext | null;
  onSendMessage: (
    message: string,
    history: CoachMessage[]
  ) => Promise<{ message: string; suggestedQuestions?: string[] }>;
  /** 스트리밍 응답 사용 여부 (기본: false) */
  useStreaming?: boolean;
  /** 진입 시 자동 전송할 질문 (분석 결과 CTA의 ?q= 배선) */
  initialQuestion?: string;
  /** 진입 시 선택할 카테고리 (?category= 배선) */
  initialCategory?: keyof typeof QUICK_QUESTIONS_BY_CATEGORY;
}

// 이미지 전송 전 클라이언트 리사이즈 (긴 변 1024px, JPEG 80%)
async function fileToResizedDataUrl(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

export function ChatInterface({
  userContext,
  onSendMessage,
  useStreaming = false,
  initialQuestion,
  initialCategory,
}: ChatInterfaceProps) {
  const t = useTranslations('coach');
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // 스트리밍 중인 메시지 내용
  const [streamingContent, setStreamingContent] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<keyof typeof QUICK_QUESTIONS_BY_CATEGORY>(
    initialCategory ?? 'general'
  );
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  // 첨부 대기 이미지 (dataURL) — "이 옷 어울려?" 사진 판정
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 스트리밍 중단을 위한 AbortController
  const abortControllerRef = useRef<AbortController | null>(null);
  // 초기 질문 자동 전송 1회 가드
  const initialSentRef = useRef(false);

  // 메시지 영역 스크롤
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // 스트리밍 API를 통한 메시지 전송
  const handleStreamingSend = useCallback(
    // eslint-disable-next-line sonarjs/cognitive-complexity -- complex business logic
    async (messageText: string, currentMessages: CoachMessage[], imageBase64?: string) => {
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
            // 히스토리에서 이미지 dataURL은 제외 (본문 크기 폭증 방지 — 텍스트 맥락만)
            chatHistory: currentMessages.map(({ imageUrl: _omit, ...rest }) => rest),
            ...(imageBase64 ? { imageBase64 } : {}),
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
      const image = pendingImage;
      // 이미지만 첨부하고 텍스트가 없으면 기본 질문으로
      const text = messageText.trim() || (image ? '이 사진 속 아이템, 저에게 어울릴까요?' : '');
      if (!text || loading) return;

      const userMessage: CoachMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date(),
        ...(image ? { imageUrl: image } : {}),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput('');
      setPendingImage(null);
      setLoading(true);
      setShowQuickQuestions(false);

      try {
        if (useStreaming) {
          // 스트리밍 모드
          await handleStreamingSend(text, updatedMessages, image ?? undefined);
        } else {
          // 일반 모드
          const response = await onSendMessage(text, updatedMessages);

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
          content: t('errorMessage'),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, onSendMessage, useStreaming, handleStreamingSend, pendingImage]
  );

  // 분석 결과 CTA(?q=)에서 넘어온 초기 질문 1회 자동 전송
  useEffect(() => {
    if (initialQuestion && !initialSentRef.current && messages.length === 0 && !loading) {
      initialSentRef.current = true;
      handleSend(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 직후 1회만
  }, [initialQuestion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleQuickQuestion = (question: string) => {
    handleSend(question);
  };

  // ADR-098: 운동/영양 카테고리는 W/N 숨김 (WELLNESS_PHASE2)
  const categories = [
    { key: 'general' as const, label: t('category.general') },
    ...(FEATURE_FLAGS.WELLNESS_PHASE2
      ? [
          { key: 'workout' as const, label: t('category.workout') },
          { key: 'nutrition' as const, label: t('category.nutrition') },
        ]
      : []),
    { key: 'skin' as const, label: t('category.skin') },
    { key: 'hair' as const, label: t('category.hair') },
    { key: 'makeup' as const, label: t('category.makeup') },
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
              {t('greeting')}
              <br />
              {t('greetingSubtitle')}
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
              <p className="text-sm text-muted-foreground">{t('thinking')}</p>
            </div>
          </div>
        )}

        {/* 추천 질문 */}
        {!loading && suggestedQuestions.length > 0 && messages.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">{t('suggestedQuestions')}</p>
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
            {showQuickQuestions ? t('quickQuestionsHide') : t('quickQuestionsShow')}
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
        {/* 첨부 이미지 미리보기 */}
        {pendingImage && (
          <div className="flex items-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- dataURL 미리보기 */}
            <img
              src={pendingImage}
              alt="첨부 예정"
              className="h-14 w-14 rounded-lg object-cover border"
            />
            <span className="text-xs text-muted-foreground flex-1">
              사진과 함께 질문해요 — 비워두면 &quot;어울릴까요?&quot;로 물어볼게요
            </span>
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="p-1 rounded-full bg-muted"
              aria-label="첨부 취소"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try {
                setPendingImage(await fileToResizedDataUrl(file));
              } catch {
                /* 손상 파일 무시 */
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            aria-label="사진 첨부 — 이 옷 어울릴지 물어보기"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={pendingImage ? '이 사진에 대해 물어보세요' : t('inputPlaceholder')}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || (!input.trim() && !pendingImage)} size="icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">{t('disclaimer')}</p>
      </div>
    </div>
  );
}
