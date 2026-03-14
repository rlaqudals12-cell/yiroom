import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getFriends, getFriendStats, getReceivedRequests } from '@/lib/friends';
import { FriendList } from '@/components/friends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Users, Inbox } from 'lucide-react';

export const metadata: Metadata = {
  title: '친구 | 이룸',
  description: '친구를 추가하고 함께 건강해지세요',
};

export default async function FriendsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const supabase = createClerkSupabaseClient();

  // 데이터 조회 (에러 시 빈 값 폴백)
  let friends: Awaited<ReturnType<typeof getFriends>> = [];
  let stats: Awaited<ReturnType<typeof getFriendStats>> = {
    totalFriends: 0,
    pendingRequests: 0,
    sentRequests: 0,
  };
  let requests: Awaited<ReturnType<typeof getReceivedRequests>> = [];

  try {
    [friends, stats, requests] = await Promise.all([
      getFriends(supabase, userId),
      getFriendStats(supabase, userId),
      getReceivedRequests(supabase, userId),
    ]);
  } catch (error) {
    console.error('[FriendsPage] 데이터 조회 실패:', error);
  }

  return (
    <div className="container max-w-2xl py-6 space-y-6" data-testid="friends-page">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard" aria-label="대시보드로 이동">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">친구</h1>
        </div>
        <Button asChild>
          <Link href="/friends/search">
            <UserPlus className="h-4 w-4 mr-2" />
            친구 추가
          </Link>
        </Button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{stats.totalFriends}</div>
            <div className="text-sm text-muted-foreground">친구</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Inbox className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <div className="text-sm text-muted-foreground">받은 요청</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <UserPlus className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{stats.sentRequests}</div>
            <div className="text-sm text-muted-foreground">보낸 요청</div>
          </CardContent>
        </Card>
      </div>

      {/* 받은 요청 */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              받은 친구 요청
              <span className="text-sm font-normal text-muted-foreground">
                ({requests.length}건)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{request.requesterName}</div>
                    <div className="text-sm text-muted-foreground">Lv.{request.requesterLevel}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      거절
                    </Button>
                    <Button size="sm">수락</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 친구 목록 */}
      <FriendList friends={friends} />
    </div>
  );
}
