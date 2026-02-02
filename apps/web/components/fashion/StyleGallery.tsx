'use client';

/**
 * StyleGallery 컴포넌트
 *
 * 스타일 카테고리별 갤러리 뷰
 * - 스타일 카테고리 필터링
 * - 퍼스널컬러/시즌/상황별 필터링
 * - 정렬 옵션 (트렌드, 이름순 등)
 * - 그리드/리스트 뷰 전환
 *
 * @module components/fashion/StyleGallery
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md K-2
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Grid3X3,
  List,
  Filter,
  Sparkles,
  Calendar,
  Briefcase,
  SortAsc,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { Best10Card, Best10List } from './Best10Card';
import {
  getStyleBest10,
  filterByPersonalColor,
  filterBySeason,
  filterByOccasion,
  STYLE_CATEGORY_LABELS,
  type StyleCategory,
  type OutfitRecommendation,
} from '@/lib/fashion';
import type { PersonalColorSeason } from '@/lib/color-recommendations';
import type { Season, Occasion } from '@/types/inventory';

// 정렬 옵션
type SortOption = 'default' | 'name' | 'trending';

// 한국어 라벨
const SEASON_LABELS: Record<Season, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

const OCCASION_LABELS: Record<Occasion, string> = {
  casual: '캐주얼',
  formal: '포멀',
  date: '데이트',
  workout: '운동',
  travel: '여행',
};

const PERSONAL_COLOR_LABELS: Record<PersonalColorSeason, string> = {
  Spring: '봄 웜톤',
  Summer: '여름 쿨톤',
  Autumn: '가을 웜톤',
  Winter: '겨울 쿨톤',
};

interface StyleGalleryProps {
  /** 사용자 퍼스널컬러 (매칭 하이라이트용) */
  userPersonalColor?: PersonalColorSeason | null;
  /** 초기 선택 스타일 카테고리 */
  initialCategory?: StyleCategory;
  /** 코디 선택 시 콜백 */
  onOutfitSelect?: (outfit: OutfitRecommendation) => void;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 스타일 갤러리 컴포넌트
 */
export function StyleGallery({
  userPersonalColor,
  initialCategory = 'casual',
  onOutfitSelect,
  className,
}: StyleGalleryProps) {
  // 상태
  const [selectedCategory, setSelectedCategory] = useState<StyleCategory>(initialCategory);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // 필터 상태
  const [filterSeason, setFilterSeason] = useState<Season | null>(null);
  const [filterOccasion, setFilterOccasion] = useState<Occasion | null>(null);
  const [filterPersonalColor, setFilterPersonalColor] = useState<PersonalColorSeason | null>(null);

  // 스타일 데이터 가져오기
  const styleBest10 = useMemo(() => getStyleBest10(selectedCategory), [selectedCategory]);

  // 필터링된 코디 목록
  const filteredOutfits = useMemo(() => {
    let outfits = [...styleBest10.outfits];

    // 시즌 필터
    if (filterSeason) {
      outfits = filterBySeason(outfits, filterSeason);
    }

    // 상황 필터
    if (filterOccasion) {
      outfits = filterByOccasion(outfits, filterOccasion);
    }

    // 퍼스널컬러 필터
    if (filterPersonalColor) {
      outfits = filterByPersonalColor(outfits, filterPersonalColor);
    }

    // 정렬
    switch (sortOption) {
      case 'name':
        outfits.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        break;
      case 'trending':
        // 트렌드 아이템이 있는 코디를 앞으로
        outfits.sort((a, b) => {
          const aHasTrend = a.items.some((i) => i.tags?.includes('트렌드'));
          const bHasTrend = b.items.some((i) => i.tags?.includes('트렌드'));
          if (aHasTrend && !bHasTrend) return -1;
          if (!aHasTrend && bHasTrend) return 1;
          return 0;
        });
        break;
      default:
        // 기본 순서 유지
        break;
    }

    return outfits;
  }, [styleBest10.outfits, filterSeason, filterOccasion, filterPersonalColor, sortOption]);

  // 필터 초기화
  const clearFilters = useCallback(() => {
    setFilterSeason(null);
    setFilterOccasion(null);
    setFilterPersonalColor(null);
  }, []);

  // 활성 필터 개수
  const activeFilterCount = [filterSeason, filterOccasion, filterPersonalColor].filter(
    Boolean
  ).length;

  return (
    <div className={cn('space-y-4', className)} data-testid="style-gallery">
      {/* 스타일 카테고리 탭 */}
      <Tabs
        value={selectedCategory}
        onValueChange={(v) => setSelectedCategory(v as StyleCategory)}
        className="w-full"
      >
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {(Object.keys(STYLE_CATEGORY_LABELS) as StyleCategory[]).map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm"
              data-testid={`category-tab-${category}`}
            >
              {STYLE_CATEGORY_LABELS[category]}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 필터 및 정렬 컨트롤 */}
        <div className="flex items-center justify-between gap-2 mt-4">
          <div className="flex items-center gap-2">
            {/* 필터 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" />
                  필터
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {/* 시즌 필터 */}
                <DropdownMenuLabel className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  시즌
                </DropdownMenuLabel>
                {(Object.keys(SEASON_LABELS) as Season[]).map((season) => (
                  <DropdownMenuCheckboxItem
                    key={season}
                    checked={filterSeason === season}
                    onCheckedChange={(checked) => setFilterSeason(checked ? season : null)}
                  >
                    {SEASON_LABELS[season]}
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator />

                {/* 상황 필터 */}
                <DropdownMenuLabel className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  상황
                </DropdownMenuLabel>
                {(Object.keys(OCCASION_LABELS) as Occasion[]).map((occasion) => (
                  <DropdownMenuCheckboxItem
                    key={occasion}
                    checked={filterOccasion === occasion}
                    onCheckedChange={(checked) => setFilterOccasion(checked ? occasion : null)}
                  >
                    {OCCASION_LABELS[occasion]}
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator />

                {/* 퍼스널컬러 필터 */}
                <DropdownMenuLabel className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  퍼스널컬러
                </DropdownMenuLabel>
                {(Object.keys(PERSONAL_COLOR_LABELS) as PersonalColorSeason[]).map((color) => (
                  <DropdownMenuCheckboxItem
                    key={color}
                    checked={filterPersonalColor === color}
                    onCheckedChange={(checked) => setFilterPersonalColor(checked ? color : null)}
                  >
                    {PERSONAL_COLOR_LABELS[color]}
                  </DropdownMenuCheckboxItem>
                ))}

                {activeFilterCount > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center text-destructive hover:text-destructive"
                      onClick={clearFilters}
                    >
                      필터 초기화
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 정렬 옵션 */}
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
              <SelectTrigger className="w-32 h-9">
                <SortAsc className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">기본 순서</SelectItem>
                <SelectItem value="name">이름순</SelectItem>
                <SelectItem value="trending">트렌드순</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 뷰 모드 토글 */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('grid')}
              aria-label="그리드 보기"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('list')}
              aria-label="리스트 보기"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 스타일 설명 */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{styleBest10.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{styleBest10.description}</p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {filteredOutfits.length}개 코디
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 코디 목록 */}
        {(Object.keys(STYLE_CATEGORY_LABELS) as StyleCategory[]).map((category) => (
          <TabsContent
            key={category}
            value={category}
            className="mt-4"
            data-testid={`category-content-${category}`}
          >
            {filteredOutfits.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    필터 조건에 맞는 코디가 없습니다.
                    <br />
                    <Button
                      variant="link"
                      onClick={clearFilters}
                      className="text-primary p-0 h-auto"
                    >
                      필터 초기화
                    </Button>
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOutfits.map((outfit, index) => (
                  <Best10Card
                    key={outfit.id}
                    recommendation={outfit}
                    rank={index + 1}
                    styleCategory={selectedCategory}
                    onItemClick={onOutfitSelect}
                  />
                ))}
              </div>
            ) : (
              <Best10List
                recommendations={filteredOutfits}
                styleCategory={selectedCategory}
                onItemClick={onOutfitSelect}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default StyleGallery;
