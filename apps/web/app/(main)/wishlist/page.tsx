import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { WishlistPageClient } from './WishlistPageClient';

export const metadata: Metadata = {
  title: '위시리스트 | 이룸',
  description: '관심 있는 제품들을 모아보세요',
};

export default async function WishlistPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in?redirect=/wishlist');
  }

  return <WishlistPageClient clerkUserId={userId} />;
}
