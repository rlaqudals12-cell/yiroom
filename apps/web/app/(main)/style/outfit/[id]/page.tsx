'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  ShoppingBag,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

/**
 * 코디 상세 페이지 - UX 리스트럭처링
 * - 코디 이미지 + 아이템 태그
 * - 내 체형 매칭률
 * - 스타일 팁
 * - 코디 아이템 리스트
 * - 비슷한 체형 리뷰
 * - 전체 구매 버튼
 */

// 체형 코드 → 한글 매핑
const bodyTypeMap: Record<string, string> = {
  S: '스트레이트',
  W: '웨이브',
  N: '내추럴',
};

// 시즌 → 한글 매핑
const seasonMap: Record<string, string> = {
  Spring: '봄 웜톤',
  Summer: '여름 쿨톤',
  Autumn: '가을 웜톤',
  Winter: '겨울 쿨톤',
};

// lookbook_posts 타입
interface LookbookPost {
  id: string;
  clerk_user_id: string;
  image_url: string;
  caption: string | null;
  body_type: 'S' | 'W' | 'N' | null;
  personal_color: 'Spring' | 'Summer' | 'Autumn' | 'Winter' | null;
  outfit_items: OutfitItem[];
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  created_at: string;
}

interface OutfitItem {
  category?: string;
  description?: string;
  color?: string;
  colorHex?: string;
  brand?: string;
  price?: number;
  url?: string;
}

// 폴백 코디 아이템 (데이터가 없을 때 사용)
const fallbackOutfitItems = [
  {
    id: '1',
    category: '상의',
    name: '크롭 니트',
    brand: '무신사',
    price: 39000,
    color: '코랄',
    colorHex: '#FF6B6B',
    url: 'https://musinsa.com',
    matchNote: '봄 웜톤 추천 컬러',
  },
  {
    id: '2',
    category: '하의',
    name: '하이웨스트 슬랙스',
    brand: 'W컨셉',
    price: 59000,
    color: '베이지',
    colorHex: '#D4A574',
    url: 'https://wconcept.co.kr',
    matchNote: '웨이브 체형 추천',
  },
  {
    id: '3',
    category: '신발',
    name: '메리제인 슈즈',
    brand: '무신사',
    price: 89000,
    color: '아이보리',
    colorHex: '#FFF8E7',
    url: 'https://musinsa.com',
    matchNote: '봄 웜톤 추천 컬러',
  },
];

// 스타일 팁
const styleTips = [
  '하이웨스트 팬츠로 허리 라인을 강조해 다리가 길어 보여요',
  '크롭 니트와 하이웨스트 조합으로 상체는 짧게, 하체는 길게',
  '부드러운 니트 소재가 웨이브 체형의 곡선미를 살려줘요',
  '코랄과 베이지 조합이 봄 웜톤을 더 화사하게 만들어줘요',
];

// 비슷한 체형 리뷰
const reviews = [
  {
    id: '1',
    bodyType: '웨이브',
    height: '165cm',
    rating: 5,
    content: '저도 웨이브인데 이 조합 핏 좋아요! 허리 라인 잘 살아요.',
    helpful: 45,
  },
  {
    id: '2',
    bodyType: '웨이브',
    height: '160cm',
    rating: 5,
    content: '하이웨스트 덕분에 다리가 길어 보여요. 강추!',
    helpful: 32,
  },
  {
    id: '3',
    bodyType: '웨이브',
    height: '168cm',
    rating: 4,
    content: '색감도 예쁘고 체형 보완돼요. 니트 소재가 약간 얇아요.',
    helpful: 18,
  },
];

export default function OutfitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const outfitId = params.id as string;

  const [isLiked, setIsLiked] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [userBodyType, setUserBodyType] = useState<string>('미분석');
  const [userBodyTypeRaw, setUserBodyTypeRaw] = useState<string | null>(null);
  const [userPersonalColor, setUserPersonalColor] = useState<string>('미분석');
  const [userPersonalColorRaw, setUserPersonalColorRaw] = useState<string | null>(null);
  const [lookbookPost, setLookbookPost] = useState<LookbookPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 룩북 포스트 데이터 가져오기
  useEffect(() => {
    const fetchPost = async () => {
      if (!outfitId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('lookbook_posts')
          .select('*')
          .eq('id', outfitId)
          .eq('is_public', true)
          .single();

        if (error) {
          console.error('[OutfitDetail] Post fetch error:', error);
          return;
        }

        if (data) {
          setLookbookPost({
            ...data,
            outfit_items: (data.outfit_items as OutfitItem[]) || [],
          });
        }
      } catch (err) {
        console.error('[OutfitDetail] Post fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [outfitId, supabase]);

  // 분석 데이터 가져오기
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!isLoaded || !user?.id) return;

      try {
        const [bodyResult, pcResult] = await Promise.all([
          supabase
            .from('body_analyses')
            .select('body_type')
            .eq('clerk_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('personal_color_assessments')
            .select('result_season, result_tone')
            .eq('clerk_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (bodyResult.data) {
          setUserBodyTypeRaw(bodyResult.data.body_type);
          setUserBodyType(bodyTypeMap[bodyResult.data.body_type] || bodyResult.data.body_type);
        }

        if (pcResult.data) {
          setUserPersonalColorRaw(pcResult.data.result_season);
          setUserPersonalColor(`${pcResult.data.result_season} ${pcResult.data.result_tone}`);
        }
      } catch (err) {
        console.error('[OutfitDetail] Analysis fetch error:', err);
      }
    };

    fetchAnalysis();
  }, [isLoaded, user?.id, supabase]);

  // 매칭률 계산
  const matchRate = useMemo(() => {
    if (!lookbookPost) return 0;

    let rate = 50; // 기본 50%

    // 체형 매칭 (30%)
    if (userBodyTypeRaw && lookbookPost.body_type === userBodyTypeRaw) {
      rate += 30;
    }

    // 퍼스널컬러 매칭 (20%)
    if (userPersonalColorRaw && lookbookPost.personal_color === userPersonalColorRaw) {
      rate += 20;
    }

    return rate;
  }, [lookbookPost, userBodyTypeRaw, userPersonalColorRaw]);

  // 표시용 코디 데이터
  const displayOutfit = useMemo(() => {
    if (!lookbookPost) {
      return {
        id: '',
        title: '',
        description: '',
        matchRate: 0,
        bodyType: '',
        personalColor: '',
      };
    }

    return {
      id: lookbookPost.id,
      title: lookbookPost.caption || '코디 룩',
      description: '',
      matchRate,
      bodyType: lookbookPost.body_type ? bodyTypeMap[lookbookPost.body_type] : '',
      personalColor: lookbookPost.personal_color ? seasonMap[lookbookPost.personal_color] : '',
    };
  }, [lookbookPost, matchRate]);

  // 표시용 아이템 목록
  const displayItems = useMemo(() => {
    if (!lookbookPost || lookbookPost.outfit_items.length === 0) {
      return fallbackOutfitItems;
    }

    return lookbookPost.outfit_items.map((item, index) => ({
      id: String(index + 1),
      category: item.category || '아이템',
      name: item.description || '코디 아이템',
      brand: item.brand || '',
      price: item.price || 0,
      color: item.color || '',
      colorHex: item.colorHex || '#CCCCCC',
      url: item.url || '',
      matchNote: '',
    }));
  }, [lookbookPost]);

  const totalPrice = displayItems.reduce((sum, item) => sum + item.price, 0);

  // 로딩 중
  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-testid="outfit-detail-loading"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">코디 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 코디를 찾을 수 없음
  if (!lookbookPost) {
    return (
      <div
        className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"
        data-testid="outfit-detail-not-found"
      >
        <AlertTriangle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">코디를 찾을 수 없습니다</p>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          뒤로가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="outfit-detail">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-medium">오늘의 코디</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={isLiked ? '좋아요 취소' : '좋아요'}
            >
              <Heart className={cn('w-5 h-5', isLiked && 'fill-current')} />
            </button>
            <button
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
              aria-label="공유"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="px-4 py-4 space-y-6">
        {/* 코디 이미지 */}
        <FadeInUp>
          <div className="relative w-full aspect-[3/4] bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl flex items-center justify-center overflow-hidden">
            <span className="text-6xl">👕</span>

            {/* 아이템 태그 */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
              {displayItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item.id)}
                  className={cn(
                    'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110',
                    selectedItem === item.id
                      ? 'border-primary ring-2 ring-primary/50'
                      : 'border-white bg-white shadow-md'
                  )}
                  style={{ backgroundColor: item.colorHex }}
                  title={item.category}
                />
              ))}
            </div>
          </div>
        </FadeInUp>

        {/* 매칭률 */}
        <FadeInUp delay={1}>
          <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-600" />내 체형 매칭률
            </h3>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-3xl font-bold text-indigo-600">
                  {displayOutfit.matchRate}%
                </span>
              </div>
              <div className="h-3 bg-indigo-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${displayOutfit.matchRate}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-indigo-700">
              {userBodyType} 체형 + {userPersonalColor}에 추천!
            </p>
          </section>
        </FadeInUp>

        {/* 스타일 팁 */}
        <FadeInUp delay={2}>
          <section className="bg-card rounded-2xl border p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              스타일 팁
            </h3>
            <ul className="space-y-2">
              {styleTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </FadeInUp>

        {/* 코디 아이템 */}
        <FadeInUp delay={3}>
          <section className="bg-card rounded-2xl border p-4">
            <h3 className="font-semibold text-foreground mb-4">코디 아이템</h3>
            <div className="space-y-3">
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-4 p-3 rounded-xl border transition-colors',
                    selectedItem === item.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  )}
                  onClick={() => setSelectedItem(item.id)}
                >
                  {/* 이미지 */}
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.colorHex}20` }}
                  >
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: item.colorHex }}
                    />
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.brand}</p>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block mt-1">
                      {item.matchNote}
                    </span>
                  </div>

                  {/* 가격 + 링크 */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-foreground">{item.price.toLocaleString()}원</p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center justify-end gap-1 mt-1"
                    >
                      보기 <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </FadeInUp>

        {/* 비슷한 체형 리뷰 */}
        <FadeInUp delay={4}>
          <section className="bg-card rounded-2xl border p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-blue-500" />
              비슷한 체형 리뷰
            </h3>
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {review.bodyType}
                    </span>
                    <span className="text-xs text-muted-foreground">{review.height}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-3 h-3',
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{review.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">도움됨 {review.helpful}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push(`/style/outfit/${outfitId}/reviews`)}
              className="w-full mt-4 text-center text-sm text-primary hover:underline flex items-center justify-center gap-1"
            >
              리뷰 더보기
              <ChevronRight className="w-4 h-4" />
            </button>
          </section>
        </FadeInUp>
      </main>

      {/* 하단 구매 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <ShoppingBag className="w-5 h-5" />
          전체 구매 ({totalPrice.toLocaleString()}원)
        </button>
      </div>
    </div>
  );
}
