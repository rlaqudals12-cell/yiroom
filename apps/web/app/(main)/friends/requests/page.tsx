import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getReceivedRequests } from '@/lib/friends';
import { FriendRequestsClient } from './FriendRequestsClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Inbox } from 'lucide-react';

export const metadata: Metadata = {
  title: '받은 친구 요청 | 이룸',
  description: '받은 친구 요청을 확인하세요',
};

export default async function FriendRequestsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const supabase = createClerkSupabaseClient();
  const requests = await getReceivedRequests(supabase, userId);

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/friends" aria-label="친구 목록으로 이동">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6" />
            받은 친구 요청
          </h1>
          <p className="text-sm text-muted-foreground">
            {requests.length}건의 요청이 있습니다
          </p>
        </div>
      </div>

      {/* 요청 목록 (클라이언트 컴포넌트) */}
      <FriendRequestsClient initialRequests={requests} />
    </div>
  );
}
