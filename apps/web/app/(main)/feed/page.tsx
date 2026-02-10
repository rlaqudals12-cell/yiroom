'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Users, Plus, ArrowLeft } from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { FeedCard } from '@/components/feed';
import { cn } from '@/lib/utils';
import type { FeedPostWithAuthor } from '@/lib/feed/types';

/**
 * 피드 페이지 - DB 연동
 * - 탭: 내 피드 / 전체
 * - 좋아요, 댓글, 공유 인터랙션
 * - 작성 버튼 (플로팅)
 */

type FeedTab = 'my' | 'all';

export default function FeedPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [feedPosts, setFeedPosts] = useState<FeedPostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 피드 데이터 로드
  useEffect(() => {
    const fetchFeed = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeTab === 'my' && userId) {
          params.set('user_id', userId);
        }

        const res = await fetch(`/api/feed?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          setFeedPosts(data.posts);
        }
      } catch (error) {
        console.error('Failed to fetch feed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeed();
  }, [activeTab, userId]);

  // 좋아요 토글
  const handleLike = useCallback(async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}/like`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setFeedPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  is_liked: data.liked,
                  likes_count: data.liked ? post.likes_count + 1 : post.likes_count - 1,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }, []);

  // 저장 토글
  const handleSave = useCallback(async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}/save`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setFeedPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  is_saved: data.saved,
                  saves_count: data.saved ? post.saves_count + 1 : post.saves_count - 1,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  }, []);

  // 공유
  const handleShare = useCallback((post: FeedPostWithAuthor) => {
    if (typeof navigator.share === 'function') {
      navigator
        .share({
          title: `${post.author.name}님의 글`,
          text: post.content.slice(0, 100),
          url: `${window.location.origin}/feed/post/${post.id}`,
        })
        .catch(() => {});
    }
  }, []);

  // 삭제
  const handleDelete = useCallback(async (postId: string) => {
    if (!confirm('이 글을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/feed/${postId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setFeedPosts((prev) => prev.filter((post) => post.id !== postId));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="feed-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              피드
            </h1>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 px-4 py-2">
          {[
            { id: 'my', label: '내 피드' },
            { id: 'all', label: '전체' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FeedTab)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* 본문 */}
      <div className="px-4 py-4 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">
              {activeTab === 'my' ? '아직 작성한 글이 없어요' : '피드가 비어있어요'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">첫 글을 작성해 보세요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedPosts.map((post, index) => (
              <FadeInUp key={post.id} delay={Math.min(index, 5) as 0 | 1 | 2 | 3 | 4 | 5}>
                <FeedCard
                  post={post}
                  onLike={handleLike}
                  onSave={handleSave}
                  onShare={handleShare}
                  onDelete={handleDelete}
                  isOwnPost={post.clerk_user_id === userId}
                />
              </FadeInUp>
            ))}
          </div>
        )}
      </div>

      {/* 플로팅 작성 버튼 */}
      <button
        onClick={() => router.push('/feed/create')}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="새 글 작성"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
