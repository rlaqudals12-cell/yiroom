'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, X, TrendingUp, Clock, Sparkles, SearchX } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from '@/components/ui/skeleton';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

/**
 * 검색 페이지 - UX 리스트럭처링
 * - 최근 검색어
 * - 인기 검색어
 * - 맞춤 추천 검색
 * - 검색 결과 (탭: 전체/뷰티/스타일/성분)
 */

type SearchTab = 'all' | 'beauty' | 'style' | 'ingredient';

const tabs: { id: SearchTab; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'beauty', label: '뷰티' },
  { id: 'style', label: '스타일' },
  { id: 'ingredient', label: '성분' },
];

// 로컬 스토리지 키
const RECENT_SEARCHES_KEY = 'yiroom_recent_searches';

// 임시 데이터
const popularSearches = [
  '레티놀',
  '선크림',
  '하이웨스트',
  '비타민C',
  '토너패드',
  '웨이브 코디',
  '나이아신아마이드',
  '세럼',
  '와이드팬츠',
  '크림',
];

const defaultRecentSearches = ['비타민C 세럼', '하이웨스트', '레티놀'];

const recommendedSearches = [
  { query: '수분크림', reason: '내 피부에 맞는' },
  { query: '니트', reason: '웨이브 체형 추천' },
];

// 자동완성용 전체 검색어 데이터베이스
const allSearchTerms = [
  ...popularSearches,
  '비타민C 세럼',
  '레티놀 크림',
  '나이아신아마이드 세럼',
  '하이웨스트 팬츠',
  '크롭 니트',
  'A라인 스커트',
  '수분 크림',
  '선크림 SPF50',
  '클렌징 오일',
  '웜톤 립스틱',
  '쿨톤 블러셔',
  '체형 커버',
];

// 검색 결과 타입
interface SearchProduct {
  id: string;
  name: string;
  brand: string;
  matchRate: number;
  imageUrl: string;
}

interface IngredientResult {
  name: string;
  effects: string[];
}

interface SearchResults {
  beauty: SearchProduct[];
  style: SearchProduct[];
  ingredient: IngredientResult[];
}

// 이미지 placeholder 생성 (브랜드별 파스텔 컬러)
function getProductImageUrl(imageUrl: string | null | undefined, brand: string): string {
  if (imageUrl) return imageUrl;
  const colors = ['fce7f3', 'dbeafe', 'd1fae5', 'fef3c7', 'ede9fe', 'ffedd5'];
  const colorIndex = brand.charCodeAt(0) % colors.length;
  return `https://placehold.co/200x200/${colors[colorIndex]}/888?text=`;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useClerkSupabaseClient();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [searches, setSearches] = useState<string[]>(defaultRecentSearches);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    beauty: [],
    style: [],
    ingredient: [],
  });

  // 디바운스된 검색어
  const debouncedQuery = useDebounce(query, 300);

  // 자동완성 제안
  const suggestions = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) return [];
    const lowercaseQuery = debouncedQuery.toLowerCase();
    return allSearchTerms.filter((term) => term.toLowerCase().includes(lowercaseQuery)).slice(0, 5);
  }, [debouncedQuery]);

  // 로컬 스토리지에서 최근 검색어 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        try {
          setSearches(JSON.parse(stored));
        } catch {
          // 파싱 실패 시 기본값 유지
        }
      }
    }
  }, []);

  // 최근 검색어 저장
  const saveSearches = useCallback((newSearches: string[]) => {
    setSearches(newSearches);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
    }
  }, []);

  // 검색 실행
  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setQuery(searchQuery);
      setIsSearching(true);
      setIsLoading(true);
      setShowSuggestions(false);

      // 최근 검색어에 추가 (중복 제거)
      const filtered = searches.filter((s) => s !== searchQuery);
      const newSearches = [searchQuery, ...filtered].slice(0, 10);
      saveSearches(newSearches);

      // URL 업데이트
      router.replace(`/search?q=${encodeURIComponent(searchQuery)}`);

      try {
        // 화장품 검색
        const { data: cosmeticData } = await supabase
          .from('cosmetic_products')
          .select('id, name, brand, rating, image_url')
          .eq('is_active', true)
          .or(
            `name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,key_ingredients.cs.{${searchQuery}}`
          )
          .order('rating', { ascending: false })
          .limit(6);

        const beautyResults: SearchProduct[] = (cosmeticData || []).map((row, index) => ({
          id: row.id,
          name: row.name,
          brand: row.brand,
          matchRate: Math.max(85, 98 - index * 3),
          imageUrl: getProductImageUrl(row.image_url, row.brand),
        }));

        // 성분 정보 (key_ingredients에서 매칭)
        const ingredientResults: IngredientResult[] = [];
        const ingredientKeywords = [
          '비타민',
          '레티놀',
          '나이아신',
          '히알루론',
          '세라마이드',
          'AHA',
          'BHA',
          '시카',
        ];
        const matchedIngredient = ingredientKeywords.find(
          (k) =>
            searchQuery.toLowerCase().includes(k.toLowerCase()) ||
            k.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (matchedIngredient) {
          const effectsMap: Record<string, string[]> = {
            비타민: ['항산화', '미백', '콜라겐 합성'],
            레티놀: ['주름 개선', '피부 재생', '모공 축소'],
            나이아신: ['미백', '피지 조절', '장벽 강화'],
            히알루론: ['보습', '수분 공급', '탄력'],
            세라마이드: ['장벽 강화', '보습', '진정'],
            AHA: ['각질 제거', '피부결 개선', '톤업'],
            BHA: ['모공 케어', '각질 제거', '피지 조절'],
            시카: ['진정', '재생', '민감 케어'],
          };
          ingredientResults.push({
            name: `${matchedIngredient} (${searchQuery} 관련 성분)`,
            effects: effectsMap[matchedIngredient] || ['피부 개선'],
          });
        }

        setSearchResults({
          beauty: beautyResults,
          style: [], // 스타일 검색은 추후 구현
          ingredient: ingredientResults,
        });
      } catch (err) {
        console.error('[Search] 검색 오류:', err);
        setSearchResults({ beauty: [], style: [], ingredient: [] });
      } finally {
        setIsLoading(false);
      }
    },
    [router, searches, saveSearches, supabase]
  );

  // 검색어 삭제
  const handleClearSearch = () => {
    setQuery('');
    setIsSearching(false);
    setShowSuggestions(false);
    router.replace('/search');
  };

  // 최근 검색어 전체 삭제
  const handleClearAllRecent = () => {
    saveSearches([]);
  };

  // 최근 검색어 개별 삭제
  const handleRemoveRecent = (searchQuery: string) => {
    const filtered = searches.filter((s) => s !== searchQuery);
    saveSearches(filtered);
  };

  // 초기 검색어가 있으면 검색 실행
  useEffect(() => {
    if (initialQuery) {
      setIsSearching(true);
    }
  }, [initialQuery]);

  // 입력 중일 때 자동완성 표시
  useEffect(() => {
    if (query && !isSearching) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [query, isSearching]);

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="search-page">
      {/* 페이지 제목 (스크린리더용) */}
      <h1 className="sr-only">통합 검색 - 뷰티, 스타일, 성분</h1>

      {/* 검색 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="제품, 성분, 코디 검색..."
              className="w-full pl-10 pr-10 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              aria-label="검색어 입력"
              aria-autocomplete="list"
              role="combobox"
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-controls="search-suggestions"
            />
            {query && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label="검색어 지우기"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* 자동완성 드롭다운 */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                id="search-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-full mt-1 bg-card border rounded-xl shadow-lg z-50 overflow-hidden"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSearch(suggestion)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors',
                      index < suggestions.length - 1 && 'border-b'
                    )}
                  >
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {isSearching && (
            <button
              onClick={handleClearSearch}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              취소
            </button>
          )}
        </div>

        {/* 검색 결과 탭 */}
        {isSearching && (
          <nav className="flex gap-2 px-4 py-2 overflow-x-auto" aria-label="검색 결과 필터">
            <div className="flex gap-2" role="tablist" aria-label="검색 결과 카테고리">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`search-panel-${tab.id}`}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <div className="px-4 py-4">
        {!isSearching && (
          // 검색 전 화면
          <div className="space-y-6">
            {/* 최근 검색어 */}
            {searches.length > 0 && (
              <FadeInUp>
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      최근 검색
                    </h2>
                    <button
                      onClick={handleClearAllRecent}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      전체 삭제
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searches.map((search) => (
                      <div
                        key={search}
                        className="flex items-center gap-1 pl-3 pr-1 py-1.5 bg-muted rounded-full"
                      >
                        <button
                          onClick={() => handleSearch(search)}
                          className="text-sm text-foreground"
                        >
                          {search}
                        </button>
                        <button
                          onClick={() => handleRemoveRecent(search)}
                          className="p-0.5 text-muted-foreground hover:text-foreground"
                          aria-label={`${search} 검색어 삭제`}
                        >
                          <X className="w-3 h-3" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </FadeInUp>
            )}

            {/* 인기 검색어 */}
            <FadeInUp delay={1}>
              <section aria-label="인기 검색어">
                <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-red-500" aria-hidden="true" />
                  인기 검색어
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {popularSearches.map((search, index) => (
                    <button
                      key={search}
                      onClick={() => handleSearch(search)}
                      className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors text-left"
                    >
                      <span
                        className={cn(
                          'w-5 text-center font-bold',
                          index < 3 ? 'text-red-500' : 'text-muted-foreground'
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm">{search}</span>
                    </button>
                  ))}
                </div>
              </section>
            </FadeInUp>

            {/* 맞춤 추천 검색 */}
            <FadeInUp delay={2}>
              <section aria-label="맞춤 추천 검색">
                <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                  추천 검색
                </h2>
                <div className="space-y-2">
                  {recommendedSearches.map((item) => (
                    <button
                      key={item.query}
                      onClick={() => handleSearch(item.query)}
                      className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-colors text-left"
                    >
                      <span className="text-sm text-muted-foreground">{item.reason}</span>
                      <span className="font-medium text-foreground">&quot;{item.query}&quot;</span>
                    </button>
                  ))}
                </div>
              </section>
            </FadeInUp>
          </div>
        )}
        {isSearching && isLoading && (
          // 로딩 중 스켈레톤
          <div className="space-y-6">
            <div>
              <Skeleton className="h-6 w-32 mb-3" />
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-xl border p-3">
                    <Skeleton className="h-3 w-8 mb-1" />
                    <Skeleton className="w-full aspect-square rounded-lg mb-2" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-full mt-1" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-6 w-28 mb-3" />
              <div className="grid grid-cols-3 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-card rounded-xl border p-3">
                    <Skeleton className="h-3 w-8 mb-1" />
                    <Skeleton className="w-full aspect-square rounded-lg mb-2" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-full mt-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {isSearching && !isLoading && (
          // 검색 결과 화면
          <div className="space-y-6">
            {/* 결과 없음 */}
            {searchResults.beauty.length === 0 &&
              searchResults.style.length === 0 &&
              searchResults.ingredient.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <SearchX className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">검색 결과가 없습니다</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    &quot;{query}&quot;에 대한 결과를 찾을 수 없어요.
                    <br />
                    다른 검색어로 시도해 보세요.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearSearch}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                    >
                      새로운 검색
                    </button>
                  </div>
                </div>
              )}

            {/* 뷰티 제품 결과 */}
            {(activeTab === 'all' || activeTab === 'beauty') && searchResults.beauty.length > 0 && (
              <FadeInUp>
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-foreground">
                      💄 뷰티 제품 ({searchResults.beauty.length}개)
                    </h2>
                    {activeTab === 'all' && (
                      <button
                        onClick={() => setActiveTab('beauty')}
                        className="text-sm text-primary hover:underline"
                      >
                        더보기
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {searchResults.beauty.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => router.push(`/beauty/${product.id}`)}
                        className="bg-card rounded-xl border p-3 text-left hover:shadow-md transition-shadow"
                      >
                        <div className="text-xs font-bold text-primary mb-1">
                          {product.matchRate}%
                        </div>
                        <div className="w-full aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                        <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </FadeInUp>
            )}

            {/* 스타일 제품 결과 */}
            {(activeTab === 'all' || activeTab === 'style') && searchResults.style.length > 0 && (
              <FadeInUp delay={1}>
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-foreground">
                      👕 스타일 ({searchResults.style.length}개)
                    </h2>
                    {activeTab === 'all' && (
                      <button
                        onClick={() => setActiveTab('style')}
                        className="text-sm text-primary hover:underline"
                      >
                        더보기
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {searchResults.style.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => router.push(`/style/${product.id}`)}
                        className="bg-card rounded-xl border p-3 text-left hover:shadow-md transition-shadow"
                      >
                        <div className="text-xs font-bold text-primary mb-1">
                          {product.matchRate}%
                        </div>
                        <div className="w-full aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                        <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </FadeInUp>
            )}

            {/* 성분 정보 결과 */}
            {(activeTab === 'all' || activeTab === 'ingredient') &&
              searchResults.ingredient.length > 0 && (
                <FadeInUp delay={2}>
                  <section>
                    <h2 className="font-semibold text-foreground mb-3">🧪 성분 정보</h2>
                    {searchResults.ingredient.map((ingredient, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          router.push(`/ingredients/${encodeURIComponent(ingredient.name)}`)
                        }
                        className="w-full bg-card rounded-xl border p-4 text-left hover:shadow-md transition-shadow"
                      >
                        <p className="font-medium text-foreground">{ingredient.name}</p>
                        <div className="flex gap-2 mt-2">
                          {ingredient.effects.map((effect) => (
                            <span
                              key={effect}
                              className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                            >
                              {effect}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </section>
                </FadeInUp>
              )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
