'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  ArrowLeft,
  Heart,
  Sparkles,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Shirt,
} from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

/**
 * 코디 상세 페이지
 * - 코디 이미지 + 아이템 태그
 * - 내 프로필 매칭 (체형·퍼스널컬러 일치 기반 근사치)
 * - 코디 아이템 리스트 (실데이터만 — 없으면 정직한 빈 상태)
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
          // 정본 컬럼은 season("Spring")/undertone — 기존 result_season/result_tone은 유령 컬럼
          supabase
            .from('personal_color_assessments')
            .select('season, undertone')
            .eq('clerk_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (bodyResult.data) {
          setUserBodyTypeRaw(bodyResult.data.body_type);
          setUserBodyType(bodyTypeMap[bodyResult.data.body_type] || bodyResult.data.body_type);
        }

        if (pcResult.data?.season) {
          // season 값 형식은 "Spring" 등 — lookbook_posts.personal_color와 동일 형식
          setUserPersonalColorRaw(pcResult.data.season);
          setUserPersonalColor(seasonMap[pcResult.data.season] || pcResult.data.season);
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

  // 표시용 아이템 목록 — 실데이터만 (가짜 폴백 아이템 제거, 2026-07-08)
  const displayItems = useMemo(() => {
    if (!lookbookPost || lookbookPost.outfit_items.length === 0) {
      return [];
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
    }));
  }, [lookbookPost]);

  // 분석 결과가 하나라도 있어야 매칭률 표시 (없으면 베이스 50%는 무의미)
  const hasProfile = Boolean(userBodyTypeRaw || userPersonalColorRaw);

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
    <div className="min-h-screen bg-background pb-8" data-testid="outfit-detail">
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
          </div>
        </div>
      </header>

      {/* 본문 */}
      <div className="px-4 py-4 space-y-6">
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

        {/* 프로필 매칭 — 체형·퍼스널컬러 일치 여부 기반 근사치 (분석 결과 있을 때만) */}
        {hasProfile && (
          <FadeInUp delay={1}>
            <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-600" />내 프로필 매칭
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
                {[
                  userBodyTypeRaw ? `${userBodyType} 체형` : null,
                  userPersonalColorRaw ? userPersonalColor : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                과 이 코디의 체형·컬러 태그 일치 여부로 계산한 근사치예요
              </p>
            </section>
          </FadeInUp>
        )}

        {/* 코디 아이템 — 실데이터만, 없으면 정직한 빈 상태 */}
        <FadeInUp delay={2}>
          <section className="bg-card rounded-2xl border p-4">
            <h3 className="font-semibold text-foreground mb-4">코디 아이템</h3>
            {displayItems.length === 0 ? (
              <div className="text-center py-8">
                <Shirt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  이 코디에는 아직 아이템 정보가 등록되지 않았어요
                </p>
              </div>
            ) : (
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
                      {item.brand && <p className="text-sm text-muted-foreground">{item.brand}</p>}
                    </div>

                    {/* 가격 + 링크 (실데이터 있을 때만) */}
                    <div className="text-right flex-shrink-0">
                      {item.price > 0 && (
                        <p className="font-semibold text-foreground">
                          {item.price.toLocaleString()}원
                        </p>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center justify-end gap-1 mt-1"
                        >
                          보기 <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </FadeInUp>
      </div>
    </div>
  );
}
