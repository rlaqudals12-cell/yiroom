'use client';

import { useState, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Search, Flame, Loader2, AlertCircle, TrendingUp, Apple, Plus, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 음식 데이터
interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

// 인기 검색어
const POPULAR_SEARCHES = [
  '닭가슴살',
  '현미밥',
  '고구마',
  '바나나',
  '두부',
  '연어',
  '아보카도',
  '계란',
  '그릭 요거트',
  '브로콜리',
];

// 음식 데이터베이스
const FOOD_DATABASE: FoodItem[] = [
  {
    id: '1',
    name: '닭가슴살 (구운것)',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    serving: '100g',
  },
  {
    id: '2',
    name: '현미밥',
    calories: 172,
    protein: 3.5,
    carbs: 36,
    fat: 1.2,
    serving: '1공기 (210g)',
  },
  {
    id: '3',
    name: '고구마 (찐것)',
    calories: 130,
    protein: 1.5,
    carbs: 30,
    fat: 0.1,
    serving: '1개 (150g)',
  },
  {
    id: '4',
    name: '바나나',
    calories: 93,
    protein: 1.1,
    carbs: 24,
    fat: 0.2,
    serving: '1개 (100g)',
  },
  {
    id: '5',
    name: '두부 (부침용)',
    calories: 84,
    protein: 9,
    carbs: 1.5,
    fat: 4.8,
    serving: '100g',
  },
  {
    id: '6',
    name: '연어 (구운것)',
    calories: 208,
    protein: 20,
    carbs: 0,
    fat: 13,
    serving: '100g',
  },
  {
    id: '7',
    name: '아보카도',
    calories: 187,
    protein: 2,
    carbs: 2,
    fat: 19,
    serving: '1/2개 (100g)',
  },
  {
    id: '8',
    name: '계란 (삶은것)',
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    serving: '2개 (100g)',
  },
  {
    id: '9',
    name: '그릭 요거트 (무가당)',
    calories: 59,
    protein: 10,
    carbs: 3.6,
    fat: 0.7,
    serving: '100g',
  },
  {
    id: '10',
    name: '브로콜리 (찐것)',
    calories: 35,
    protein: 2.4,
    carbs: 7,
    fat: 0.4,
    serving: '100g',
  },
  {
    id: '11',
    name: '흰쌀밥',
    calories: 210,
    protein: 3.5,
    carbs: 46,
    fat: 0.3,
    serving: '1공기 (210g)',
  },
  {
    id: '12',
    name: '사과',
    calories: 57,
    protein: 0.3,
    carbs: 15,
    fat: 0.2,
    serving: '1개 (150g)',
  },
  {
    id: '13',
    name: '프로틴 쉐이크',
    calories: 120,
    protein: 25,
    carbs: 3,
    fat: 1,
    serving: '1스쿱 (30g)',
  },
  {
    id: '14',
    name: '아몬드',
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
    serving: '한 줌 (28g)',
  },
  {
    id: '15',
    name: '김치',
    calories: 15,
    protein: 1.1,
    carbs: 2.4,
    fat: 0.5,
    serving: '1접시 (50g)',
  },
];

export default function FoodSearchPage(): React.ReactElement {
  const { user, isLoaded } = useUser();
  const [query, setQuery] = useState('');

  // 검색 결과
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return FOOD_DATABASE.filter((food) => food.name.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  // 인기 검색어 클릭
  const handlePopularSearch = useCallback((term: string): void => {
    setQuery(term);
  }, []);

  // 검색 입력 핸들러
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setQuery(e.target.value);
  }, []);

  // 음식 추가 (식단 기록에 추가)
  const addToMeal = useCallback((food: FoodItem): void => {
    // 실제로는 Supabase에 저장
    alert(`${food.name}을(를) 식단에 추가했어요!`);
  }, []);

  // 로딩 상태
  if (!isLoaded) {
    return (
      <div
        data-testid="food-search-loading"
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">준비하고 있어요...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 (미로그인)
  if (!user) {
    return (
      <div
        data-testid="food-search-error"
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-lg font-semibold mb-1">로그인이 필요해요</p>
          <p className="text-muted-foreground">음식 검색을 하려면 먼저 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  const hasQuery = query.trim().length > 0;

  return (
    <div data-testid="food-search-page" className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="w-7 h-7 text-primary" />
          음식 검색
        </h1>
        <p className="text-muted-foreground mt-1">
          음식의 영양 정보를 검색하고 식단에 추가해보세요
        </p>
      </div>

      {/* 검색 Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="음식 이름을 입력해주세요..."
          value={query}
          onChange={handleSearchChange}
          className="pl-10 h-12 text-base"
          autoFocus
        />
      </div>

      {/* 인기 검색어 (검색 전) */}
      {!hasQuery && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4 h-4" />
            인기 검색어
          </h2>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <Button
                key={term}
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => handlePopularSearch(term)}
              >
                {term}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 검색 결과 */}
      {hasQuery && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {searchResults.length > 0 ? `${searchResults.length}개의 결과` : '검색 결과가 없어요'}
          </p>

          {searchResults.length === 0 ? (
            <div data-testid="food-search-empty" className="text-center py-12">
              <Apple className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">&quot;{query}&quot;에 대한 결과가 없어요</p>
              <p className="text-sm text-muted-foreground/70 mt-1">다른 이름으로 검색해보세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((food) => (
                <Card key={food.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{food.name}</h3>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {food.serving}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1 font-medium text-orange-600">
                            <Flame className="w-3.5 h-3.5" />
                            {food.calories}kcal
                          </span>
                          <span className="text-muted-foreground">탄 {food.carbs}g</span>
                          <span className="text-muted-foreground">단 {food.protein}g</span>
                          <span className="text-muted-foreground">지 {food.fat}g</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-3 gap-1"
                        onClick={() => addToMeal(food)}
                      >
                        <Plus className="w-4 h-4" />
                        추가
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 도움말 */}
      {!hasQuery && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">영양 정보 안내</p>
                <p>
                  표시되는 칼로리와 영양소는 일반적인 기준이에요. 실제 섭취량은 조리 방법이나
                  브랜드에 따라 달라질 수 있어요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
