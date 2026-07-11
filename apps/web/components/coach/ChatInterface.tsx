'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Send,
  Loader2,
  ChevronDown,
  ImagePlus,
  X,
  ScanLine,
  Shirt,
  Scissors,
  Brush,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';
import { QuickQuestions } from './QuickQuestions';
import { CoachHeader } from './CoachHeader';
import { ChatHistoryPanel } from './ChatHistoryPanel';
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

// 기본(general) 화면 상황형 질문 → 아이콘 매핑. 질문 텍스트는 QUICK_QUESTIONS_BY_CATEGORY.general
// 정본과 동일해야 하며, 여기서는 카드 아이콘만 부여한다(누락 시 Sparkles 폴백).
const GENERAL_QUESTION_ICONS: Record<string, LucideIcon> = {
  '오늘 뭐 입을까요?': Shirt,
  '머리 어떻게 자를까요?': Scissors,
  '오늘 화장 어떻게 할까요?': Brush,
};

// SSE 이벤트 페이로드 — 서버(app/api/coach/stream)가 보내는 4종 이벤트
interface CoachStreamEvent {
  type?: 'chunk' | 'replace' | 'done' | 'error';
  content?: string;
  message?: string;
  suggestedQuestions?: string[];
  sessionId?: string;
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
  // 대화 세션 ID — 서버가 done 이벤트로 돌려줌, 후속 메시지가 같은 세션에 쌓임
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

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
            ...(sessionIdRef.current ? { sessionId: sessionIdRef.current } : {}),
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
            if (!line.startsWith('data: ')) continue;

            // JSON.parse만 try로 감싼다 — 불완전한 청크는 무시하되,
            // error 이벤트 처리(throw)는 catch 밖에서 실제로 전파되게 한다.
            let data: CoachStreamEvent;
            try {
              data = JSON.parse(line.slice(6)) as CoachStreamEvent;
            } catch {
              // JSON 파싱 실패 시 무시 (불완전한 청크일 수 있음)
              continue;
            }

            if (data.type === 'chunk') {
              accumulatedContent += data.content ?? '';
              setStreamingContent(accumulatedContent);
            } else if (data.type === 'replace') {
              // 서버 환각 필터가 정화본을 보냄 — 누적 원본을 교체(done 확정 전).
              accumulatedContent = data.content ?? accumulatedContent;
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
              if (data.sessionId) {
                setSessionId(data.sessionId);
                sessionIdRef.current = data.sessionId;
              }
            } else if (data.type === 'error') {
              // 서버 AI 실패 — 바깥 catch로 전파되어 handleSend가 에러 메시지를 표시
              throw new Error(data.message);
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

  // 이전 대화 이어보기 — 저장된 세션 메시지 로드
  const handleSelectSession = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/coach/sessions/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const loaded: CoachMessage[] = (data.session?.messages ?? data.messages ?? []).map(
        (m: { id: string; role: 'user' | 'assistant'; content: string; timestamp?: string }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp ?? Date.now()),
        })
      );
      setMessages(loaded);
      setSessionId(id);
      sessionIdRef.current = id;
      setSuggestedQuestions([]);
      setShowQuickQuestions(false);
    } catch (e) {
      console.error('[Coach] 세션 로드 실패:', e);
    }
  }, []);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    sessionIdRef.current = null;
    setSuggestedQuestions([]);
    setShowQuickQuestions(true);
  }, []);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await fetch(`/api/coach/sessions/${id}`, { method: 'DELETE' });
      if (sessionIdRef.current === id) handleNewChat();
    },
    [handleNewChat]
  );

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
      <CoachHeader
        contextSummary={contextSummary}
        leftAction={
          <ChatHistoryPanel
            activeSessionId={sessionId ?? undefined}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
          />
        }
      />

      {/* 메시지 영역 — 데스크톱에서 가운데 정렬(넓은 화면 흩어짐 방지) */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          {/* 초기 인사 (빈 대화) — 리치 카드 + 상황형 퀵질문 그리드 */}
          {messages.length === 0 && (
            <div className="py-6" data-testid="coach-empty-state">
              {/* 인사 카드 */}
              <div className="mb-5 rounded-2xl border border-border/60 bg-gradient-to-br from-pink-50 to-purple-50 p-5 text-center dark:from-pink-950/30 dark:to-purple-950/30">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500">
                  <span className="text-sm font-bold text-white">AI</span>
                </div>
                <p className="font-semibold text-foreground">{t('greeting')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('greetingSubtitle')}</p>
              </div>

              {/* 상황형 퀵질문 — general은 아이콘 카드 2×2, 그 외 카테고리는 칩 목록 */}
              {activeCategory === 'general' ? (
                <div className="grid grid-cols-2 gap-2.5" data-testid="coach-quick-cards">
                  {QUICK_QUESTIONS_BY_CATEGORY.general.map((question) => {
                    const Icon = GENERAL_QUESTION_ICONS[question] ?? Sparkles;
                    return (
                      <button
                        key={question}
                        onClick={() => handleQuickQuestion(question)}
                        disabled={loading}
                        className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-medium">{question}</span>
                      </button>
                    );
                  })}
                  {/* ADR-114: "이 제품 나한테 맞을까요?"는 채팅 대신 스캔(사진 판정 정본)으로 분기 */}
                  <Link
                    href="/scan"
                    className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                    data-testid="coach-scan-chip"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ScanLine className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium">이 제품 나한테 맞을까요?</span>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-2">
                  <QuickQuestions
                    questions={QUICK_QUESTIONS_BY_CATEGORY[activeCategory]}
                    onSelect={handleQuickQuestion}
                    disabled={loading}
                  />
                </div>
              )}

              {/* 사진 첨부 안내 — 하단 입력창의 사진 기능 표면화 */}
              <p
                className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"
                data-testid="coach-photo-hint"
              >
                <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                사진을 보내면 나에게 어울리는지 판정해드려요
              </p>

              {/* 카테고리 탭 (부차 위계 — 주제별로 더 물어보기) */}
              <div className="mt-5 flex flex-wrap justify-center gap-2 px-2">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors',
                      activeCategory === cat.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
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
      </div>

      {/* 입력 영역 — 메시지 영역과 동일 폭으로 가운데 정렬 */}
      <div className="border-t p-4 bg-background">
        <div className="mx-auto w-full max-w-2xl">
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
            <Button
              type="submit"
              disabled={loading || (!input.trim() && !pendingImage)}
              size="icon"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">{t('disclaimer')}</p>
        </div>
      </div>
    </div>
  );
}
