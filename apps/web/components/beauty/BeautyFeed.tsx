'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Star,
  Verified,
  Camera,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/**
 * 피드 아이템 타입 (올리브영 셔터 스타일)
 */
interface FeedItem {
  id: string;
  type: 'review' | 'routine' | 'tip';
  user: {
    id: string;
    name: string;
    avatar: string;
    skinType: string;
    verified: boolean;
    followers: number;
  };
  content: {
    text: string;
    images: string[];
    products?: {
      id: string;
      name: string;
      brand: string;
      rating: number;
      imageUrl: string;
    }[];
  };
  stats: {
    likes: number;
    comments: number;
    saves: number;
  };
  tags: string[];
  createdAt: string;
  isLiked: boolean;
  isSaved: boolean;
}

/**
 * 피드 컴포넌트 Props
 */
interface BeautyFeedProps {
  className?: string;
  limit?: number;
}

// Mock 피드 데이터
const MOCK_FEED_ITEMS: FeedItem[] = [
  {
    id: 'feed-1',
    type: 'review',
    user: {
      id: 'u1',
      name: '뷰티덕후',
      avatar: 'https://placehold.co/40x40/fce7f3/fce7f3',
      skinType: '건성',
      verified: true,
      followers: 12500,
    },
    content: {
      text: '이 세럼 진짜 대박이에요! 건조한 피부가 촉촉해지고 결이 정리되는 느낌? 2주 사용 후기인데 피부톤도 밝아진 것 같아요',
      images: [
        'https://placehold.co/400x400/fce7f3/fce7f3',
        'https://placehold.co/400x400/dbeafe/dbeafe',
      ],
      products: [
        {
          id: 'p1',
          name: '히알루론산 세럼',
          brand: '토리든',
          rating: 4.8,
          imageUrl: 'https://placehold.co/60x60/d1fae5/d1fae5',
        },
      ],
    },
    stats: { likes: 234, comments: 45, saves: 89 },
    tags: ['건성피부', '세럼추천', '수분케어'],
    createdAt: '2시간 전',
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'feed-2',
    type: 'routine',
    user: {
      id: 'u2',
      name: '스킨케어마스터',
      avatar: 'https://placehold.co/40x40/dbeafe/dbeafe',
      skinType: '지성',
      verified: true,
      followers: 45000,
    },
    content: {
      text: '지성피부 여름철 모닝 루틴 공유합니다! 클렌징 → 토너 → 세럼 → 수분크림 → 선크림 순서로 사용하고 있어요. 피지 컨트롤이 핵심!',
      images: ['https://placehold.co/400x400/d1fae5/d1fae5'],
      products: [
        {
          id: 'p2',
          name: 'BHA 토너',
          brand: '코스알엑스',
          rating: 4.7,
          imageUrl: 'https://placehold.co/60x60/fef3c7/fef3c7',
        },
        {
          id: 'p3',
          name: '워터 젤 크림',
          brand: '벨리프',
          rating: 4.6,
          imageUrl: 'https://placehold.co/60x60/ede9fe/ede9fe',
        },
      ],
    },
    stats: { likes: 567, comments: 123, saves: 234 },
    tags: ['지성피부', '모닝루틴', '피지관리'],
    createdAt: '5시간 전',
    isLiked: true,
    isSaved: false,
  },
  {
    id: 'feed-3',
    type: 'tip',
    user: {
      id: 'u3',
      name: '피부과전문의',
      avatar: 'https://placehold.co/40x40/d1fae5/d1fae5',
      skinType: '복합성',
      verified: true,
      followers: 128000,
    },
    content: {
      text: '레티놀 사용 팁!\n1. 저농도부터 시작\n2. 밤에만 사용\n3. 선크림 필수\n4. 보습은 충분히\n5. 피부 적응 기간 필요\n\n초보자는 0.025%부터 시작하세요!',
      images: ['https://placehold.co/400x400/fef3c7/fef3c7'],
    },
    stats: { likes: 1234, comments: 89, saves: 567 },
    tags: ['레티놀', '안티에이징', '피부과팁'],
    createdAt: '1일 전',
    isLiked: false,
    isSaved: true,
  },
];

/**
 * SNS형 뷰티 피드 (올리브영 셔터 스타일)
 * - 리뷰, 루틴, 팁 게시물
 * - 좋아요, 댓글, 저장 기능
 * - 연관 제품 태그
 */
export function BeautyFeed({ className, limit }: BeautyFeedProps) {
  const t = useTranslations('beauty');
  const router = useRouter();
  const [feedItems, setFeedItems] = useState<FeedItem[]>(
    limit ? MOCK_FEED_ITEMS.slice(0, limit) : MOCK_FEED_ITEMS
  );

  // 좋아요 토글
  const handleLike = useCallback((id: string) => {
    setFeedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isLiked: !item.isLiked,
              stats: {
                ...item.stats,
                likes: item.isLiked ? item.stats.likes - 1 : item.stats.likes + 1,
              },
            }
          : item
      )
    );
  }, []);

  // 저장 토글
  const handleSave = useCallback((id: string) => {
    setFeedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isSaved: !item.isSaved,
              stats: {
                ...item.stats,
                saves: item.isSaved ? item.stats.saves - 1 : item.stats.saves + 1,
              },
            }
          : item
      )
    );
  }, []);

  // 타입별 라벨
  const getTypeLabel = (type: FeedItem['type']) => {
    switch (type) {
      case 'review':
        return t('feedType.review');
      case 'routine':
        return t('feedType.routine');
      case 'tip':
        return t('feedType.tip');
      default:
        return '';
    }
  };

  // 타입별 색상
  const getTypeColor = (type: FeedItem['type']) => {
    switch (type) {
      case 'review':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300';
      case 'routine':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'tip':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <section className={cn('space-y-4', className)} data-testid="beauty-feed">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="w-5 h-5 text-pink-500" aria-hidden="true" />
          {t('feedTitle')}
        </h2>
        <button
          onClick={() => router.push('/beauty/feed')}
          className="text-sm text-primary flex items-center gap-0.5 hover:underline"
        >
          {t('viewAll')}
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* 피드 리스트 */}
      <div className="space-y-4">
        {feedItems.map((item) => (
          <article key={item.id} className="bg-card rounded-2xl border overflow-hidden">
            {/* 유저 정보 */}
            <div className="p-4 flex items-center justify-between">
              <button
                onClick={() => router.push(`/profile/${item.user.id}`)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                {/* 아바타 */}
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.user.avatar}
                    alt={item.user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm">{item.user.name}</span>
                    {item.user.verified && (
                      <Verified
                        className="w-3.5 h-3.5 text-primary fill-primary"
                        aria-label={t('verified')}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.user.skinType}</span>
                    <span>•</span>
                    <span>{item.createdAt}</span>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-2">
                {/* 타입 배지 */}
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    getTypeColor(item.type)
                  )}
                >
                  {getTypeLabel(item.type)}
                </span>
                <button
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={t('more')}
                >
                  <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* 이미지 */}
            {item.content.images.length > 0 && (
              <div className="relative">
                <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                  {item.content.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-full flex-shrink-0 snap-center aspect-square bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`${item.user.name}의 이미지 ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
                {/* 이미지 인디케이터 */}
                {item.content.images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {item.content.images.map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          idx === 0 ? 'bg-white' : 'bg-white/50'
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="px-4 py-3 flex items-center justify-between border-b">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(item.id)}
                  className={cn(
                    'flex items-center gap-1.5 transition-colors',
                    item.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label={item.isLiked ? t('unlikeAria') : t('likeAria')}
                >
                  <Heart
                    className={cn('w-5 h-5', item.isLiked && 'fill-current')}
                    aria-hidden="true"
                  />
                  <span className="text-sm">{item.stats.likes.toLocaleString()}</span>
                </button>
                <button
                  onClick={() => router.push(`/beauty/feed/${item.id}#comments`)}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={t('commentsAria')}
                >
                  <MessageCircle className="w-5 h-5" aria-hidden="true" />
                  <span className="text-sm">{item.stats.comments}</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSave(item.id)}
                  className={cn(
                    'transition-colors',
                    item.isSaved ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label={item.isSaved ? t('unsaveAria') : t('saveAria')}
                >
                  <Bookmark
                    className={cn('w-5 h-5', item.isSaved && 'fill-current')}
                    aria-hidden="true"
                  />
                </button>
                <button
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={t('shareAria')}
                >
                  <Share2 className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* 본문 */}
            <div className="px-4 py-3">
              <p className="text-sm whitespace-pre-wrap">{item.content.text}</p>

              {/* 태그 */}
              <div className="flex flex-wrap gap-2 mt-3">
                {item.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => router.push(`/beauty/feed?tag=${tag}`)}
                    className="text-xs text-primary hover:underline"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 연관 제품 */}
            {item.content.products && item.content.products.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  {t('relatedProducts')}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {item.content.products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => router.push(`/beauty/${product.id}`)}
                      className="flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors shrink-0"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                        <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                        <div className="flex items-center gap-1">
                          <Star
                            className="w-3 h-3 fill-yellow-400 text-yellow-400"
                            aria-hidden="true"
                          />
                          <span className="text-xs">{product.rating}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* 더보기 버튼 */}
      {!limit && (
        <button
          onClick={() => {
            // 더 많은 피드 로드
          }}
          className="w-full py-3 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          {t('loadMore')}
        </button>
      )}
    </section>
  );
}

export default BeautyFeed;
