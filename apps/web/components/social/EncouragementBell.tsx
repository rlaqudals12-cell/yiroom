'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Encouragement {
  id: string;
  from_user_id: string;
  message: string;
  message_type: string;
  activity_type: string | null;
  is_read: boolean;
  created_at: string;
  from_user: {
    clerk_user_id: string;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
  } | null;
}

interface EncouragementBellProps {
  className?: string;
}

/**
 * 응원 알림 벨 컴포넌트
 * 헤더에 표시되어 받은 응원을 확인할 수 있음
 */
export function EncouragementBell({ className }: EncouragementBellProps) {
  const [encouragements, setEncouragements] = useState<Encouragement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 응원 목록 조회
  const fetchEncouragements = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/encouragements?limit=20');
      if (res.ok) {
        const data = await res.json();
        setEncouragements(data.encouragements || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('[EncouragementBell] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    fetchEncouragements();
  }, [fetchEncouragements]);

  // 팝오버 열릴 때 새로고침
  useEffect(() => {
    if (isOpen) {
      fetchEncouragements();
    }
  }, [isOpen, fetchEncouragements]);

  // 모두 읽음 처리
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/encouragements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setEncouragements((prev) => prev.map((e) => ({ ...e, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('[EncouragementBell] Mark read error:', error);
    }
  };

  // 시간 포맷
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '방금';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  // 이름 표시
  const getDisplayName = (user: Encouragement['from_user']) => {
    if (!user) return '알 수 없음';
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return '친구';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={`응원 ${unreadCount}개`}
          data-testid="encouragement-bell"
        >
          <Heart className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium">받은 응원</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
              <CheckCheck className="h-3 w-3 mr-1" />
              모두 읽음
            </Button>
          )}
        </div>

        {/* 응원 목록 */}
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : encouragements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Heart className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">아직 받은 응원이 없어요</p>
            </div>
          ) : (
            <div className="divide-y">
              {encouragements.map((e) => (
                <div
                  key={e.id}
                  className={cn('px-4 py-3 transition-colors', !e.is_read && 'bg-primary/5')}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={e.from_user?.image_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getDisplayName(e.from_user)?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{getDisplayName(e.from_user)}</span>
                        <span className="text-muted-foreground">님이 응원했어요</span>
                      </p>
                      <p className="text-sm mt-1">&ldquo;{e.message}&rdquo;</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(e.created_at)}
                      </p>
                    </div>
                    {!e.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
