'use client';

import { useState, useCallback, useEffect } from 'react';
import { Users, Loader2, Check, Clock, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { Friend } from '@/types/friends';
import type { ChallengeTeam, TeamMember } from '@/types/challenges';

interface InviteFriendSheetProps {
  /** 팀 정보 */
  team: ChallengeTeam;
  /** 기존 팀 멤버 목록 */
  members: TeamMember[];
  /** 친구 목록 */
  friends: Friend[];
  /** 시트 트리거 */
  trigger?: React.ReactNode;
  /** 초대 전송 핸들러 */
  onInvite?: (friendId: string) => Promise<boolean>;
  /** 초대 완료 콜백 */
  onInviteSent?: () => void;
  'data-testid'?: string;
}

/**
 * 친구 초대 시트 컴포넌트
 * - 친구 목록에서 검색
 * - 이미 참여 중인 멤버 표시
 * - 초대 전송
 */
export function InviteFriendSheet({
  team,
  members,
  friends,
  trigger,
  onInvite,
  onInviteSent,
  'data-testid': testId,
}: InviteFriendSheetProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  // 이미 팀에 있는 사용자 ID 목록
  const existingMemberIds = new Set(members.map((m) => m.clerkUserId));

  // 필터링된 친구 목록
  const filteredFriends = friends.filter((friend) => {
    // 검색어 필터
    if (query) {
      const searchLower = query.toLowerCase();
      if (!friend.displayName.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  // 초대 전송
  const handleInvite = async (friendId: string) => {
    if (!onInvite) return;

    setSendingTo(friendId);
    try {
      const success = await onInvite(friendId);
      if (success) {
        setInvitedIds((prev) => new Set([...prev, friendId]));
        onInviteSent?.();
      }
    } catch (error) {
      console.error('[InviteFriendSheet] Invite error:', error);
    } finally {
      setSendingTo(null);
    }
  };

  // 시트 닫을 때 초기화
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setQuery('');
    }
  };

  // 친구 상태 확인
  const getFriendStatus = (
    friendId: string
  ): 'member' | 'invited' | 'available' => {
    if (existingMemberIds.has(friendId)) return 'member';
    if (invitedIds.has(friendId)) return 'invited';
    return 'available';
  };

  // 남은 자리 수
  const remainingSlots = team.maxMembers - members.length;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            친구 초대
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[70vh]"
        data-testid={testId || 'invite-friend-sheet'}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            친구 초대
          </SheetTitle>
          <SheetDescription>
            {team.name}에 친구를 초대하세요 (남은 자리: {remainingSlots}명)
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* 검색 입력 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="친구 이름 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              data-testid="friend-search-input"
            />
          </div>

          {/* 친구 목록 */}
          <div className="space-y-2 max-h-[45vh] overflow-y-auto">
            {filteredFriends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {query ? '검색 결과가 없습니다' : '초대할 수 있는 친구가 없습니다'}
              </p>
            ) : (
              filteredFriends.map((friend) => {
                const status = getFriendStatus(friend.userId);

                return (
                  <div
                    key={friend.userId}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    data-testid={`friend-item-${friend.userId}`}
                  >
                    {/* 아바타 */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.avatarUrl ?? undefined} />
                      <AvatarFallback>
                        {friend.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {friend.displayName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Lv.{friend.level} · {friend.tier}
                      </div>
                    </div>

                    {/* 상태 버튼 */}
                    <InviteButton
                      status={status}
                      isSending={sendingTo === friend.userId}
                      onInvite={() => handleInvite(friend.userId)}
                      disabled={remainingSlots <= 0}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * 초대 버튼 컴포넌트
 */
function InviteButton({
  status,
  isSending,
  onInvite,
  disabled,
}: {
  status: 'member' | 'invited' | 'available';
  isSending: boolean;
  onInvite: () => void;
  disabled: boolean;
}) {
  if (status === 'member') {
    return (
      <Button variant="ghost" size="sm" disabled className="text-green-600">
        <Check className="h-4 w-4 mr-1" />
        팀원
      </Button>
    );
  }

  if (status === 'invited') {
    return (
      <Button variant="ghost" size="sm" disabled className="text-yellow-600">
        <Clock className="h-4 w-4 mr-1" />
        초대됨
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={onInvite}
      disabled={isSending || disabled}
      data-testid="invite-button"
    >
      {isSending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        '초대'
      )}
    </Button>
  );
}

export default InviteFriendSheet;
