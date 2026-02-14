'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { User, Palette, Eye, Shirt, Star, Sparkles, Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { MaterialFavoriteFilter } from '@/components/style/MaterialFavoriteFilter';
import { OutfitRoutineCard, type OutfitItem } from '@/components/style/OutfitRoutineCard';
import { LookbookFeed } from '@/components/style/LookbookFeed';
import type { FavoriteItem, LookbookPost } from '@/types/hybrid';

/**
 * 스타일 탭 - 룩핀 스타일 코디 피드
 * - 내 체형 프로필 표시
 * - 내 컬러 팔레트
 * - 체형 맞춤 필터 토글
 * - 카테고리 필터 (전체/상의/하의/아우터/코디)
 * - 오늘의 코디 추천
 * - 맞춤 아이템 추천
 * - 비슷한 체형 리뷰
 * - 오늘 뭐 입지? AI 추천
 */

type Category = 'all' | 'tops' | 'bottoms' | 'outer' | 'outfit';

const categories: { id: Category; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'tops', label: '상의' },
  { id: 'bottoms', label: '하의' },
  { id: 'outer', label: '아우터' },
  { id: 'outfit', label: '코디' },
];

// 임시 컬러 팔레트 (봄 웜톤)
const colorPalette = [
  { name: '코랄', color: '#FF6B6B' },
  { name: '피치', color: '#FFB4A2' },
  { name: '아이보리', color: '#FFF8E7' },
  { name: '베이지', color: '#D4A574' },
];

// 임시 제품 데이터
const mockProducts = [
  { id: '1', name: '크롭 니트', brand: '무신사', rating: 4.8, matchRate: 95, price: 39000 },
  { id: '2', name: '하이웨스트 슬랙스', brand: 'W컨셉', rating: 4.7, matchRate: 92, price: 59000 },
  { id: '3', name: '플레어 스커트', brand: '룩핀', rating: 4.6, matchRate: 90, price: 45000 },
];

export default function StylePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [category, setCategory] = useState<Category>('all');
  const [matchFilterOn, setMatchFilterOn] = useState(true);

  // 분석 결과 상태
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [personalColor, setPersonalColor] = useState<string | null>(null);
  const [height, setHeight] = useState<string | null>(null);
  const [feature, setFeature] = useState<string | null>(null);

  // L-1-2: 키/몸무게 체크 상태
  const [hasMeasurements, setHasMeasurements] = useState<boolean | null>(null);

  // L-1-2: 키/몸무게 필수 게이트 체크
  useEffect(() => {
    const checkMeasurements = async () => {
      if (!isLoaded || !user?.id) return;

      try {
        const res = await fetch('/api/user/measurements');
        const data = await res.json();

        if (!data.hasMeasurements) {
          // 키/몸무게 없으면 온보딩으로 리다이렉트
          setHasMeasurements(false);
          router.push('/style/onboarding');
          return;
        }

        setHasMeasurements(true);
      } catch (err) {
        console.error('[Style] Measurements check error:', err);
        // 에러 시에도 페이지 표시 (graceful degradation)
        setHasMeasurements(true);
      }
    };

    checkMeasurements();
  }, [isLoaded, user?.id, router]);

  // 분석 결과 가져오기 (키/몸무게 체크 후)
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!isLoaded || !user?.id || hasMeasurements !== true) return;

      try {
        const [bodyResult, pcResult] = await Promise.all([
          supabase
            .from('body_analyses')
            .select('body_type, height, concerns')
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

        const bodyData = bodyResult.data;
        const pcData = pcResult.data;

        if (bodyData || pcData) {
          setHasAnalysis(true);

          if (bodyData) {
            const bodyTypeMap: Record<string, string> = {
              S: '스트레이트',
              W: '웨이브',
              N: '내추럴',
            };
            setBodyType(bodyTypeMap[bodyData.body_type] || bodyData.body_type);
            setHeight(bodyData.height ? `${bodyData.height}cm` : null);
            // concerns 배열에서 첫 번째 항목을 특징으로 표시
            const concerns = bodyData.concerns as string[] | null;
            setFeature(concerns?.[0] || null);
          }

          if (pcData) {
            setPersonalColor(`${pcData.result_season} ${pcData.result_tone}`);
          }
        }
      } catch (err) {
        console.error('[Style] Analysis fetch error:', err);
      }
    };

    fetchAnalysis();
  }, [isLoaded, user?.id, supabase, hasMeasurements]);

  // 하이브리드 UX 상태
  const [favoriteMaterials, setFavoriteMaterials] = useState<FavoriteItem[]>([]);
  const [avoidMaterials, setAvoidMaterials] = useState<FavoriteItem[]>([]);
  const [dailyOutfit] = useState<OutfitItem[]>([
    { order: 1, category: 'top', productName: '크롭 니트', color: '아이보리', colorHex: '#FFF8E7' },
    {
      order: 2,
      category: 'bottom',
      productName: '하이웨스트 슬랙스',
      color: '베이지',
      colorHex: '#D4A574',
    },
    { order: 3, category: 'outer', productName: '숏 재킷', color: '코랄', colorHex: '#FF6B6B' },
    { order: 4, category: 'shoes', productName: '로퍼', color: '브라운', colorHex: '#8B4513' },
  ]);
  const [lookbookPosts] = useState<LookbookPost[]>([
    {
      id: '1',
      clerkUserId: 'user1',
      imageUrl: 'https://placehold.co/400x600/fff8e7/d4a574?text=Spring+Look',
      bodyType: 'W',
      personalColor: 'Spring',
      caption: '봄 웜톤에 어울리는 데일리 코디',
      outfitItems: [
        { category: 'top', description: '크롭 니트', color: '아이보리', colorHex: '#FFF8E7' },
        { category: 'bottom', description: '와이드 팬츠', color: '베이지', colorHex: '#D4A574' },
      ],
      likesCount: 234,
      commentsCount: 12,
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      clerkUserId: 'user2',
      imageUrl: 'https://placehold.co/400x600/ffb4a2/d4a574?text=Office+Look',
      bodyType: 'W',
      personalColor: 'Spring',
      caption: '웨이브 체형 출근룩',
      outfitItems: [
        { category: 'top', description: '블라우스', color: '피치', colorHex: '#FFB4A2' },
        { category: 'bottom', description: '플레어 스커트', color: '베이지', colorHex: '#D4A574' },
      ],
      likesCount: 189,
      commentsCount: 8,
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      clerkUserId: 'user3',
      imageUrl: 'https://placehold.co/400x600/e8eef8/808080?text=Minimal+Look',
      bodyType: 'S',
      personalColor: 'Summer',
      caption: '미니멀 오피스룩',
      outfitItems: [
        { category: 'top', description: '셔츠', color: '화이트', colorHex: '#FFFFFF' },
        { category: 'bottom', description: '슬랙스', color: '그레이', colorHex: '#808080' },
      ],
      likesCount: 156,
      commentsCount: 5,
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
  ]);

  // L-1-2: 키/몸무게 체크 중이면 로딩 표시
  if (hasMeasurements === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 키/몸무게 없으면 리다이렉트 중이므로 빈 화면
  if (hasMeasurements === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="style-page">
      {/* 페이지 제목 (스크린리더용) */}
      <h1 className="sr-only">스타일 - 체형 맞춤 코디 추천</h1>

      {/* 내 체형 프로필 */}
      {hasAnalysis ? (
        <FadeInUp>
          <section
            className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4 border-b"
            aria-label="내 체형 프로필"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-500" aria-hidden="true" />
                <span className="font-medium">{bodyType || '미분석'}</span>
                {personalColor && (
                  <>
                    <span className="text-muted-foreground" aria-hidden="true">
                      |
                    </span>
                    <Palette className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                    <span className="text-sm text-muted-foreground">{personalColor}</span>
                  </>
                )}
              </div>
              <button
                onClick={() => router.push('/profile/analysis')}
                className="text-xs text-primary hover:underline"
                aria-label="체형 프로필 수정"
              >
                수정
              </button>
            </div>
            {(height || feature) && (
              <div className="flex gap-2 mt-2">
                {height && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {height}
                  </span>
                )}
                {feature && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {feature}
                  </span>
                )}
              </div>
            )}
          </section>
        </FadeInUp>
      ) : (
        <FadeInUp>
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  💡 체형 분석하면 나에게 맞는 코디 추천!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI가 내 체형에 어울리는 스타일을 찾아드려요
                </p>
              </div>
              <button
                onClick={() => router.push('/onboarding/body')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
              >
                지금 분석하기
              </button>
            </div>
          </section>
        </FadeInUp>
      )}

      {/* 내 컬러 팔레트 */}
      {hasAnalysis && (
        <FadeInUp delay={1}>
          <section className="px-4 py-3 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">내 컬러 팔레트</span>
            </div>
            <div className="flex gap-2">
              {colorPalette.map((color) => (
                <div key={color.name} className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: color.color }}
                  />
                  <span className="text-xs text-muted-foreground mt-1">{color.name}</span>
                </div>
              ))}
            </div>
          </section>
        </FadeInUp>
      )}

      {/* 체형 맞춤 필터 토글 */}
      {hasAnalysis && (
        <FadeInUp delay={2}>
          <div className="px-4 py-3 border-b">
            <button
              onClick={() => setMatchFilterOn(!matchFilterOn)}
              className="flex items-center gap-2"
              role="switch"
              aria-checked={matchFilterOn}
              aria-label="내 체형 맞춤 제품만 표시"
            >
              <Shirt className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm" aria-hidden="true">
                내 체형 맞춤만 보기
              </span>
              <div
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative',
                  matchFilterOn ? 'bg-primary' : 'bg-muted'
                )}
                aria-hidden="true"
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    matchFilterOn ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </div>
            </button>
          </div>
        </FadeInUp>
      )}

      {/* 카테고리 필터 */}
      <FadeInUp delay={3}>
        <nav className="px-4 py-3 border-b overflow-x-auto" aria-label="카테고리 필터">
          <div className="flex gap-2" role="tablist" aria-label="스타일 카테고리">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                role="tab"
                aria-selected={category === cat.id}
                aria-controls={`category-panel-${cat.id}`}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  category === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </nav>
      </FadeInUp>

      {/* 소재 즐겨찾기 필터 (하이브리드 UX) */}
      <FadeInUp delay={4}>
        <section className="px-4 py-3 border-b" aria-label="소재 필터">
          <MaterialFavoriteFilter
            favorites={favoriteMaterials}
            avoids={avoidMaterials}
            onFavoritesChange={setFavoriteMaterials}
            onAvoidsChange={setAvoidMaterials}
          />
        </section>
      </FadeInUp>

      {/* 본문 */}
      <div className="px-4 py-4 space-y-6">
        {/* 오늘의 코디 추천 */}
        {hasAnalysis && (
          <FadeInUp delay={4}>
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                오늘의 코디 추천
              </h2>
              <button
                onClick={() => router.push('/style/outfit/today')}
                className="w-full bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="w-full aspect-[3/4] bg-muted rounded-xl mb-3" />
                <p className="text-sm text-muted-foreground">
                  &quot;{bodyType} 체형에 어울리는 하이웨스트&quot;
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                    상의 보기
                  </span>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                    하의 보기
                  </span>
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    전체 구매
                  </span>
                </div>
              </button>
            </section>
          </FadeInUp>
        )}

        {/* 데일리 코디 루틴 (하이브리드 UX) */}
        {hasAnalysis && (
          <FadeInUp delay={5}>
            <OutfitRoutineCard
              occasion="daily"
              items={dailyOutfit}
              matchRate={92}
              styleTips={[
                '하이웨스트로 다리가 길어 보이는 효과',
                '코랄 포인트로 봄 웜톤 강조',
                '크롭 기장으로 허리 라인 강조',
              ]}
            />
          </FadeInUp>
        )}

        {/* 맞춤 아이템 추천 */}
        <FadeInUp delay={6}>
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              🔥 {hasAnalysis ? '내 체형 맞춤 아이템' : '인기 아이템'}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {mockProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => router.push(`/style/${product.id}`)}
                  className="bg-card rounded-xl border p-3 text-left hover:shadow-md transition-shadow"
                >
                  {hasAnalysis && (
                    <div className="text-xs font-bold text-primary mb-1">{product.matchRate}%</div>
                  )}
                  <div className="w-full aspect-square bg-muted rounded-lg mb-2" />
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                  <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{product.rating}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </FadeInUp>

        {/* 비슷한 체형 리뷰 */}
        {hasAnalysis && (
          <FadeInUp delay={7}>
            <section className="bg-card rounded-2xl border p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                비슷한 체형 리뷰
              </h2>
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-sm text-foreground">
                    &quot;저도 {bodyType}인데 이 바지 핏 좋아요!&quot;
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">{bodyType}</span>
                    <span className="text-xs text-muted-foreground">|</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push('/style?tab=reviews')}
                className="mt-3 text-sm text-primary hover:underline"
              >
                리뷰 더보기 →
              </button>
            </section>
          </FadeInUp>
        )}

        {/* 룩북 피드 (하이브리드 UX) */}
        <FadeInUp delay={8}>
          <section aria-label="룩북 피드">
            <h2 className="text-lg font-semibold mb-3">룩북 피드</h2>
            <LookbookFeed
              posts={lookbookPosts}
              onPostClick={(postId) => router.push(`/style/lookbook/${postId}`)}
            />
          </section>
        </FadeInUp>

        {/* 오늘 뭐 입지? */}
        <FadeInUp delay={9}>
          <section className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-4">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-violet-600" />
              오늘 뭐 입지?
            </h2>
            <p className="text-sm text-muted-foreground">체형 + 퍼스널컬러 + 날씨 맞춤 AI 추천</p>
            <button
              onClick={() => router.push('/style/suggest')}
              className="mt-3 w-full bg-violet-600 text-white py-2 rounded-lg font-medium hover:bg-violet-700 transition-colors"
            >
              추천 받기
            </button>
          </section>
        </FadeInUp>
      </div>

      <BottomNav />
    </div>
  );
}
