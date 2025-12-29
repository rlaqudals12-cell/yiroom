'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Heart,
  MessageCircle,
  Share2,
  Trophy,
  Flame,
  Palette,
  Dumbbell,
  ArrowLeft,
} from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';

/**
 * 피드 페이지 - UX 리스트럭처링
 * - 탭: 내 피드 / 친구 피드 / 전체
 * - 활동 카드 (배지 획득, 챌린지 완료, 분석 결과 등)
 * - 좋아요, 댓글, 공유 인터랙션
 * - 작성 버튼 (플로팅)
 */

type FeedTab = 'my' | 'friends' | 'all';

interface FeedItem {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  type: 'badge' | 'challenge' | 'analysis' | 'workout' | 'nutrition';
  content: string;
  detail?: string;
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

// 아이콘 매핑
const typeIcons = {
  badge: Trophy,
  challenge: Flame,
  analysis: Palette,
  workout: Dumbbell,
  nutrition: Flame,
};

const typeColors = {
  badge: 'bg-yellow-100 text-yellow-600',
  challenge: 'bg-orange-100 text-orange-600',
  analysis: 'bg-pink-100 text-pink-600',
  workout: 'bg-blue-100 text-blue-600',
  nutrition: 'bg-green-100 text-green-600',
};

// 임시 피드 데이터
const mockFeedItems: FeedItem[] = [
  {
    id: '1',
    userId: 'user1',
    userName: '홍길동',
    type: 'badge',
    content: '7일 연속 운동 배지 획득!',
    detail: '꾸준히 운동해서 배지를 획득했어요',
    createdAt: '2시간 전',
    likes: 12,
    comments: 3,
    isLiked: false,
  },
  {
    id: '2',
    userId: 'user2',
    userName: '김철수',
    type: 'analysis',
    content: '피부 분석 결과가 나왔어요!',
    detail: '봄 웜톤이래요! 코랄 립스틱 추천받았어요',
    createdAt: '5시간 전',
    likes: 8,
    comments: 1,
    isLiked: true,
  },
  {
    id: '3',
    userId: 'user3',
    userName: '이영희',
    type: 'challenge',
    content: '30일 물 마시기 챌린지 완료!',
    createdAt: '1일 전',
    likes: 24,
    comments: 5,
    isLiked: false,
  },
  {
    id: '4',
    userId: 'user4',
    userName: '박지민',
    type: 'workout',
    content: '오늘 운동 1시간 완료!',
    detail: '상체 운동 + 유산소로 560kcal 소모',
    createdAt: '1일 전',
    likes: 15,
    comments: 2,
    isLiked: false,
  },
  {
    id: '5',
    userId: 'me',
    userName: '나',
    type: 'nutrition',
    content: '3일 연속 영양 균형 달성!',
    createdAt: '2일 전',
    likes: 18,
    comments: 4,
    isLiked: false,
  },
];

export default function FeedPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FeedTab>('friends');
  const [feedItems, setFeedItems] = useState<FeedItem[]>(mockFeedItems);
  const [isLoading] = useState(false);

  // 탭별 필터링
  const filteredItems = feedItems.filter((item) => {
    if (activeTab === 'my') return item.userId === 'me';
    if (activeTab === 'friends') return item.userId !== 'me';
    return true;
  });

  // 좋아요 토글
  const handleLike = useCallback((itemId: string) => {
    setFeedItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              isLiked: !item.isLiked,
              likes: item.isLiked ? item.likes - 1 : item.likes + 1,
            }
          : item
      )
    );
  }, []);

  // 공유
  const handleShare = useCallback((item: FeedItem) => {
    if (typeof navigator.share === 'function') {
      navigator.share({
        title: `${item.userName}님의 활동`,
        text: item.content,
        url: window.location.href,
      }).catch(() => {});
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
            { id: 'friends', label: '친구 피드' },
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
      <main className="px-4 py-4 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">
              {activeTab === 'my'
                ? '아직 내 활동이 없어요'
                : activeTab === 'friends'
                ? '친구 활동이 없어요'
                : '활동이 없어요'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'friends'
                ? '친구를 추가하면 활동을 볼 수 있어요'
                : '운동, 영양 기록을 시작해보세요'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, index) => {
              const Icon = typeIcons[item.type];
              const colorClass = typeColors[item.type];

              return (
                <FadeInUp key={item.id} delay={Math.min(index, 5) as 0 | 1 | 2 | 3 | 4 | 5}>
                  <article className="bg-card rounded-2xl border p-4">
                    {/* 사용자 정보 */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                        {item.userName[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.userName}</p>
                        <p className="text-xs text-muted-foreground">{item.createdAt}</p>
                      </div>
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* 콘텐츠 */}
                    <div className="mb-3">
                      <p className="font-medium text-foreground">{item.content}</p>
                      {item.detail && (
                        <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>
                      )}
                    </div>

                    {/* 배지 타입일 때 특별 표시 */}
                    {item.type === 'badge' && (
                      <div className="mb-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        <span className="font-medium text-yellow-700">배지 획득!</span>
                      </div>
                    )}

                    {/* 인터랙션 */}
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <button
                        onClick={() => handleLike(item.id)}
                        className={cn(
                          'flex items-center gap-1.5 text-sm transition-colors',
                          item.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Heart className={cn('w-5 h-5', item.isLiked && 'fill-current')} />
                        {item.likes}
                      </button>
                      <button
                        onClick={() => router.push(`/feed/${item.id}`)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <MessageCircle className="w-5 h-5" />
                        {item.comments}
                      </button>
                      <button
                        onClick={() => handleShare(item)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground ml-auto"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </article>
                </FadeInUp>
              );
            })}
          </div>
        )}
      </main>

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
