'use client';

import { useState, useCallback, useEffect } from 'react';
import { UserPlus, Loader2, Check, Clock, Ban } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FriendSearchInput } from './FriendSearchInput';
import type { UserSearchResult } from '@/types/friends';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { searchUsers } from '@/lib/friends/queries';
import { sendFriendRequest } from '@/lib/friends/mutations';
import { useAuth } from '@clerk/nextjs';
import { useDebounce } from '@/hooks/useDebounce';

interface AddFriendSheetProps {
  trigger?: React.ReactNode;
  onFriendRequestSent?: () => void;
}

export function AddFriendSheet({ trigger, onFriendRequestSent }: AddFriendSheetProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const supabase = useClerkSupabaseClient();
  const { userId } = useAuth();
  const debouncedQuery = useDebounce(query, 300);

  // 검색 실행
  const performSearch = useCallback(async () => {
    if (!userId || !debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await searchUsers(supabase, userId, debouncedQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('[AddFriendSheet] Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [supabase, userId, debouncedQuery]);

  // 디바운스된 검색어가 변경되면 검색 실행
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // 친구 요청 보내기
  const handleSendRequest = async (targetUserId: string) => {
    if (!userId) return;

    setSendingTo(targetUserId);
    try {
      const result = await sendFriendRequest(supabase, userId, targetUserId);
      if (result.success) {
        // 결과 목록 업데이트 (요청 보낸 상태로)
        setResults((prev) =>
          prev.map((user) =>
            user.userId === targetUserId
              ? { ...user, isPending: true }
              : user
          )
        );
        onFriendRequestSent?.();
      }
    } catch (error) {
      console.error('[AddFriendSheet] Send request error:', error);
    } finally {
      setSendingTo(null);
    }
  };

  // 시트 닫을 때 초기화
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setQuery('');
      setResults([]);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            친구 추가
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]" data-testid="add-friend-sheet">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            친구 추가
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* 검색 입력 */}
          <FriendSearchInput
            value={query}
            onChange={setQuery}
            onClear={() => setResults([])}
            isLoading={isSearching}
            autoFocus
          />

          {/* 검색 힌트 */}
          {query.length > 0 && query.length < 2 && (
            <p className="text-sm text-muted-foreground text-center">
              2글자 이상 입력해주세요
            </p>
          )}

          {/* 검색 결과 */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {results.length === 0 && debouncedQuery.length >= 2 && !isSearching && (
              <p className="text-sm text-muted-foreground text-center py-8">
                검색 결과가 없습니다
              </p>
            )}

            {results.map((user) => (
              <div
                key={user.userId}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                data-testid="search-result-item"
              >
                {/* 아바타 */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback>
                    {user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{user.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    Lv.{user.level} · {user.tier}
                  </div>
                </div>

                {/* 상태 버튼 */}
                <SearchResultButton
                  user={user}
                  onSendRequest={handleSendRequest}
                  isSending={sendingTo === user.userId}
                />
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// 검색 결과 상태별 버튼
function SearchResultButton({
  user,
  onSendRequest,
  isSending,
}: {
  user: UserSearchResult;
  onSendRequest: (userId: string) => void;
  isSending: boolean;
}) {
  if (user.isBlocked) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Ban className="h-4 w-4 mr-1" />
        차단됨
      </Button>
    );
  }

  if (user.isFriend) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-green-600">
        <Check className="h-4 w-4 mr-1" />
        친구
      </Button>
    );
  }

  if (user.isPending) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-yellow-600">
        <Clock className="h-4 w-4 mr-1" />
        대기중
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => onSendRequest(user.userId)}
      disabled={isSending}
    >
      {isSending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          추가
        </>
      )}
    </Button>
  );
}

export default AddFriendSheet;
