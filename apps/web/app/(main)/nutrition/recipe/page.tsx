'use client';

import { useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Search,
  Clock,
  Flame,
  ChefHat,
  Loader2,
  AlertCircle,
  UtensilsCrossed,
  Heart,
  Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 레시피 카테고리
const CATEGORIES = [
  { id: 'all', label: '전체', icon: UtensilsCrossed },
  { id: 'diet', label: '다이어트', icon: Flame },
  { id: 'protein', label: '고단백', icon: Star },
  { id: 'skin', label: '피부미용', icon: Heart },
  { id: 'quick', label: '간편식', icon: Clock },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

// 레시피 데이터
interface Recipe {
  id: string;
  title: string;
  category: CategoryId;
  calories: number;
  cookTime: number;
  difficulty: '쉬움' | '보통' | '어려움';
  imageEmoji: string;
  rating: number;
  isFavorite: boolean;
}

const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: '닭가슴살 샐러드',
    category: 'diet',
    calories: 280,
    cookTime: 15,
    difficulty: '쉬움',
    imageEmoji: '🥗',
    rating: 4.5,
    isFavorite: false,
  },
  {
    id: '2',
    title: '그릭 요거트 볼',
    category: 'protein',
    calories: 350,
    cookTime: 5,
    difficulty: '쉬움',
    imageEmoji: '🫐',
    rating: 4.8,
    isFavorite: true,
  },
  {
    id: '3',
    title: '연어 아보카도 포케',
    category: 'skin',
    calories: 420,
    cookTime: 20,
    difficulty: '보통',
    imageEmoji: '🍣',
    rating: 4.7,
    isFavorite: false,
  },
  {
    id: '4',
    title: '두부 스크램블',
    category: 'protein',
    calories: 220,
    cookTime: 10,
    difficulty: '쉬움',
    imageEmoji: '🍳',
    rating: 4.2,
    isFavorite: false,
  },
  {
    id: '5',
    title: '고구마 닭가슴살 볼',
    category: 'diet',
    calories: 310,
    cookTime: 25,
    difficulty: '보통',
    imageEmoji: '🍠',
    rating: 4.4,
    isFavorite: true,
  },
  {
    id: '6',
    title: '아사이 스무디',
    category: 'skin',
    calories: 180,
    cookTime: 5,
    difficulty: '쉬움',
    imageEmoji: '🫐',
    rating: 4.6,
    isFavorite: false,
  },
  {
    id: '7',
    title: '참치 김밥',
    category: 'quick',
    calories: 380,
    cookTime: 15,
    difficulty: '보통',
    imageEmoji: '🍙',
    rating: 4.3,
    isFavorite: false,
  },
  {
    id: '8',
    title: '프로틴 팬케이크',
    category: 'protein',
    calories: 290,
    cookTime: 10,
    difficulty: '쉬움',
    imageEmoji: '🥞',
    rating: 4.1,
    isFavorite: false,
  },
  {
    id: '9',
    title: '콜라겐 뼈육수',
    category: 'skin',
    calories: 150,
    cookTime: 60,
    difficulty: '어려움',
    imageEmoji: '🍲',
    rating: 4.9,
    isFavorite: true,
  },
  {
    id: '10',
    title: '컵라면 대체 곤약면',
    category: 'quick',
    calories: 120,
    cookTime: 5,
    difficulty: '쉬움',
    imageEmoji: '🍜',
    rating: 4.0,
    isFavorite: false,
  },
];

export default function RecipePage(): React.ReactElement {
  const { user, isLoaded } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>(MOCK_RECIPES);

  // 필터링된 레시피
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
      const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [recipes, selectedCategory, searchQuery]);

  // 즐겨찾기 토글
  const toggleFavorite = (id: string): void => {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)));
  };

  // 로딩 상태
  if (!isLoaded) {
    return (
      <div
        data-testid="recipe-page-loading"
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">레시피를 불러오고 있어요...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 (미로그인)
  if (!user) {
    return (
      <div
        data-testid="recipe-page-error"
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-lg font-semibold mb-1">로그인이 필요해요</p>
          <p className="text-muted-foreground">레시피를 보려면 먼저 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="recipe-page" className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ChefHat className="w-7 h-7 text-primary" />
          레시피
        </h1>
        <p className="text-muted-foreground mt-1">건강한 식단을 위한 레시피를 찾아보세요</p>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="레시피 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <Button
              key={cat.id}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0 gap-1.5"
              onClick={() => setSelectedCategory(cat.id)}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </Button>
          );
        })}
      </div>

      {/* 빈 상태 */}
      {filteredRecipes.length === 0 ? (
        <div data-testid="recipe-empty" className="text-center py-16">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">검색 결과가 없어요</p>
          <p className="text-sm text-muted-foreground/70 mt-1">다른 키워드로 검색해보세요</p>
        </div>
      ) : (
        /* 레시피 그리드 */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{recipe.imageEmoji}</span>
                    <div>
                      <h3 className="font-semibold">{recipe.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" />
                          {recipe.calories}kcal
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {recipe.cookTime}분
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(recipe.id);
                    }}
                    className="p-1"
                    aria-label={recipe.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        recipe.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                    {recipe.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span>{recipe.rating}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
