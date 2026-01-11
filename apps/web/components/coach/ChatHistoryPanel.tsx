'use client';

/**
 * 채팅 히스토리 패널
 * @description AI 코치 이전 대화 목록 표시 및 세션 관리
 */

import { useState, useEffect } from 'react';
import { History, Plus, Trash2, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { CoachSession } from '@/lib/coach/history';

interface ChatHistoryPanelProps {
  /** 현재 활성 세션 ID */
  activeSessionId?: string;
  /** 세션 선택 시 콜백 */
  onSelectSession: (sessionId: string) => void;
  /** 새 채팅 시작 콜백 */
  onNewChat: () => void;
  /** 세션 삭제 콜백 */
  onDeleteSession?: (sessionId: string) => void;
}

// 카테고리별 아이콘
const CATEGORY_ICONS: Record<string, string> = {
  general: '💡',
  workout: '💪',
  nutrition: '🥗',
  skin: '✨',
  hair: '💇',
  makeup: '💄',
  fashion: '👗',
  'personal-color': '🎨',
};

// 상대적 시간 표시
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

export function ChatHistoryPanel({
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: ChatHistoryPanelProps) {
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 세션 목록 로드
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/coach/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('[ChatHistory] 세션 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 패널 열릴 때 세션 로드
  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  // 세션 삭제
  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteSession) return;

    setDeletingId(sessionId);
    try {
      await onDeleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } finally {
      setDeletingId(null);
    }
  };

  // 세션 선택
  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    setIsOpen(false);
  };

  // 새 채팅
  const handleNewChat = () => {
    onNewChat();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="chat-history-trigger">
          <History className="h-4 w-4" />
          <span className="sr-only">대화 기록</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 sm:w-96 p-0" data-testid="chat-history-panel">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            대화 기록
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-60px)]">
          {/* 새 채팅 버튼 */}
          <div className="p-3 border-b">
            <Button onClick={handleNewChat} className="w-full gap-2" data-testid="new-chat-button">
              <Plus className="h-4 w-4" />새 대화 시작
            </Button>
          </div>

          {/* 세션 목록 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">아직 대화 기록이 없어요</p>
                <p className="text-xs text-muted-foreground mt-1">새 대화를 시작해보세요</p>
              </div>
            ) : (
              <ul className="divide-y" role="list" data-testid="session-list">
                {sessions.map((session) => (
                  <li key={session.id}>
                    <button
                      onClick={() => handleSelectSession(session.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors',
                        'flex items-start gap-3 group',
                        activeSessionId === session.id && 'bg-muted'
                      )}
                      data-testid={`session-item-${session.id}`}
                    >
                      {/* 카테고리 아이콘 */}
                      <span
                        className="text-lg flex-shrink-0 mt-0.5"
                        role="img"
                        aria-label={session.category}
                      >
                        {CATEGORY_ICONS[session.category] || '💬'}
                      </span>

                      {/* 세션 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.title || '새 대화'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(new Date(session.updatedAt))}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            · {session.messageCount}개 메시지
                          </span>
                        </div>
                      </div>

                      {/* 삭제 버튼 */}
                      {onDeleteSession && (
                        <button
                          onClick={(e) => handleDelete(session.id, e)}
                          disabled={deletingId === session.id}
                          className={cn(
                            'p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity',
                            'hover:bg-destructive/10 text-muted-foreground hover:text-destructive',
                            deletingId === session.id && 'opacity-100'
                          )}
                          aria-label="대화 삭제"
                        >
                          {deletingId === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 안내 문구 */}
          <div className="p-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              최근 20개의 대화가 표시됩니다
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
