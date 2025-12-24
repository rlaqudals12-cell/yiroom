import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { FriendSearchClient } from './FriendSearchClient';

export const metadata: Metadata = {
  title: '친구 검색 | 이룸',
  description: '친구를 검색하고 추가하세요',
};

export default async function FriendSearchPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

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
            <UserPlus className="h-6 w-6" />
            친구 추가
          </h1>
          <p className="text-sm text-muted-foreground">
            이름으로 친구를 검색하세요
          </p>
        </div>
      </div>

      {/* 검색 (클라이언트 컴포넌트) */}
      <FriendSearchClient />
    </div>
  );
}
