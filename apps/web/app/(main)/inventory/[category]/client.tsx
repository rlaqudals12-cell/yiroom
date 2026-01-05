'use client';

/**
 * 인벤토리 카테고리 클라이언트 컴포넌트
 * - 아이템 목록 조회 (무한 스크롤)
 * - 검색 및 필터링
 * - 아이템 추가/수정/삭제
 */

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Plus, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { InventoryGrid } from '@/components/inventory/common/InventoryGrid';
import { ItemUploader, type UploadResult } from '@/components/inventory/common/ItemUploader';
import { ItemDetailSheet } from '@/components/inventory/common/ItemDetailSheet';
import { CategoryFilter } from '@/components/inventory/common/CategoryFilter';
import { useDebounce } from '@/hooks/useDebounce';
import type { InventoryCategory, InventoryItem } from '@/types/inventory';

// 업로드 후 아이템 생성을 위한 폼 상태
type UploadStep = 'upload' | 'form';

interface InventoryCategoryClientProps {
  category: InventoryCategory;
  title: string;
  description: string;
}

const ITEMS_PER_PAGE = 20;

// 카테고리별 서브카테고리 옵션
const categorySubOptions: Record<InventoryCategory, { value: string; label: string }[]> = {
  closet: [
    { value: 'outer', label: '아우터' },
    { value: 'top', label: '상의' },
    { value: 'bottom', label: '하의' },
    { value: 'dress', label: '원피스' },
    { value: 'shoes', label: '신발' },
    { value: 'bag', label: '가방' },
    { value: 'accessory', label: '액세서리' },
  ],
  beauty: [
    { value: 'skincare', label: '스킨케어' },
    { value: 'makeup', label: '메이크업' },
    { value: 'haircare', label: '헤어케어' },
    { value: 'bodycare', label: '바디케어' },
    { value: 'fragrance', label: '향수' },
    { value: 'tool', label: '도구' },
  ],
  equipment: [
    { value: 'weight', label: '웨이트' },
    { value: 'cardio', label: '유산소' },
    { value: 'yoga', label: '요가/필라' },
    { value: 'band', label: '밴드' },
    { value: 'mat', label: '매트' },
    { value: 'other', label: '기타' },
  ],
  supplement: [
    { value: 'vitamin', label: '비타민' },
    { value: 'mineral', label: '미네랄' },
    { value: 'protein', label: '프로틴' },
    { value: 'omega', label: '오메가' },
    { value: 'probiotic', label: '유산균' },
    { value: 'other', label: '기타' },
  ],
  pantry: [
    { value: 'vegetable', label: '채소' },
    { value: 'fruit', label: '과일' },
    { value: 'meat', label: '육류' },
    { value: 'seafood', label: '해산물' },
    { value: 'dairy', label: '유제품' },
    { value: 'grain', label: '곡물' },
    { value: 'condiment', label: '조미료' },
    { value: 'other', label: '기타' },
  ],
};

export function InventoryCategoryClient({
  category,
  title,
  description,
}: InventoryCategoryClientProps) {
  // 상태
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // 필터
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [selectedSub, setSelectedSub] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  // 모달 상태
  const [showUploader, setShowUploader] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>('upload');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // 아이템 생성 폼 상태
  const [formName, setFormName] = useState('');
  const [formSubCategory, setFormSubCategory] = useState('');

  // 아이템 목록 조회
  const fetchItems = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const newOffset = reset ? 0 : offset;
        const params = new URLSearchParams({
          category,
          limit: String(ITEMS_PER_PAGE),
          offset: String(newOffset),
        });

        if (debouncedSearch) {
          params.set('search', debouncedSearch);
        }
        if (selectedSub.length > 0) {
          params.set('subCategory', selectedSub[0]);
        }
        if (showFavorites) {
          params.set('isFavorite', 'true');
        }

        const res = await fetch(`/api/inventory?${params}`);
        const data = await res.json();

        if (data.success) {
          if (reset) {
            setItems(data.items);
            setOffset(ITEMS_PER_PAGE);
          } else {
            setItems((prev) => [...prev, ...data.items]);
            setOffset((prev) => prev + ITEMS_PER_PAGE);
          }
          setHasMore(data.items.length === ITEMS_PER_PAGE);
        }
      } catch (error) {
        console.error('[Inventory] Fetch error:', error);
      } finally {
        setLoading(false);
      }
    },
    [category, debouncedSearch, selectedSub, showFavorites, offset]
  );

  // 초기 로드 및 필터 변경 시 재조회
  useEffect(() => {
    fetchItems(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, debouncedSearch, selectedSub, showFavorites]);

  // 더 불러오기
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchItems(false);
    }
  };

  // 즐겨찾기 토글
  const handleFavoriteToggle = async (item: InventoryItem) => {
    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleFavorite' }),
      });
      const data = await res.json();

      if (data.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isFavorite: data.isFavorite } : i))
        );
      }
    } catch (error) {
      console.error('[Inventory] Toggle favorite error:', error);
    }
  };

  // 아이템 삭제
  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    } catch (error) {
      console.error('[Inventory] Delete error:', error);
    }
  };

  // 이미지 업로드 완료 → 폼 표시
  const handleUploadComplete = (result: UploadResult) => {
    setUploadResult(result);
    // AI 분류 결과가 있으면 이름 자동 채우기
    if (result.classification?.category) {
      const subOpt = categorySubOptions[category].find(
        (o) => o.value === result.classification?.category
      );
      setFormName(subOpt?.label || '');
      setFormSubCategory(result.classification.category);
    }
    setUploadStep('form');
  };

  // 아이템 생성 (API 호출)
  const handleCreateItem = async () => {
    if (!uploadResult || !formName) return;

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subCategory: formSubCategory,
          name: formName,
          imageUrl: uploadResult.processedUrl,
          originalImageUrl: uploadResult.originalUrl,
          metadata: {
            color: uploadResult.colors,
          },
        }),
      });
      const data = await res.json();

      if (data.success) {
        setItems((prev) => [data.item, ...prev]);
        // 리셋
        setShowUploader(false);
        setUploadStep('upload');
        setUploadResult(null);
        setFormName('');
        setFormSubCategory('');
      }
    } catch (error) {
      console.error('[Inventory] Create error:', error);
    }
  };

  // 업로더 취소
  const handleCancelUpload = () => {
    setShowUploader(false);
    setUploadStep('upload');
    setUploadResult(null);
    setFormName('');
    setFormSubCategory('');
  };

  // 필터 초기화
  const clearFilters = () => {
    setSearchInput('');
    setSelectedSub([]);
    setShowFavorites(false);
  };

  const hasActiveFilters = searchInput || selectedSub.length > 0 || showFavorites;

  return (
    <div className="container max-w-4xl py-4" data-testid="inventory-category-page">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/inventory">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{title}</h1>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>
        <Button onClick={() => setShowUploader(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          추가
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="검색..."
            className="pl-9"
          />
        </div>
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[60vh]">
            <SheetHeader>
              <SheetTitle>필터</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-4">
              {/* 서브카테고리 */}
              <div>
                <p className="text-sm font-medium mb-2">카테고리</p>
                <CategoryFilter
                  type="custom"
                  options={categorySubOptions[category]}
                  selected={selectedSub}
                  onChange={setSelectedSub}
                />
              </div>

              {/* 즐겨찾기만 */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">즐겨찾기만 보기</p>
                <Button
                  variant={showFavorites ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowFavorites(!showFavorites)}
                >
                  {showFavorites ? '적용됨' : '적용'}
                </Button>
              </div>

              {/* 초기화 */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    clearFilters();
                    setShowFilters(false);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  필터 초기화
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 활성 필터 표시 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedSub.map((sub) => {
            const option = categorySubOptions[category].find((o) => o.value === sub);
            return (
              <Button
                key={sub}
                variant="secondary"
                size="sm"
                onClick={() => setSelectedSub((prev) => prev.filter((s) => s !== sub))}
              >
                {option?.label}
                <X className="w-3 h-3 ml-1" />
              </Button>
            );
          })}
          {showFavorites && (
            <Button variant="secondary" size="sm" onClick={() => setShowFavorites(false)}>
              즐겨찾기
              <X className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      )}

      {/* 아이템 그리드 */}
      <InventoryGrid
        items={items}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onItemSelect={setSelectedItem}
        onFavoriteToggle={handleFavoriteToggle}
        onItemEdit={setSelectedItem}
        onItemDelete={handleDelete}
        onAddNew={() => setShowUploader(true)}
        selectable={false}
        emptyMessage="아이템이 없습니다"
        emptyAction={{
          label: '첫 아이템 추가하기',
          onClick: () => setShowUploader(true),
        }}
        columns={3}
      />

      {/* 아이템 업로더 */}
      <Sheet open={showUploader} onOpenChange={(open) => !open && handleCancelUpload()}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>{uploadStep === 'upload' ? '아이템 추가' : '아이템 정보 입력'}</SheetTitle>
          </SheetHeader>

          {uploadStep === 'upload' ? (
            <ItemUploader onUploadComplete={handleUploadComplete} onCancel={handleCancelUpload} />
          ) : (
            <div className="py-4 space-y-4">
              {/* 업로드된 이미지 미리보기 */}
              {uploadResult && (
                <div className="aspect-square max-h-[200px] mx-auto relative rounded-xl overflow-hidden bg-muted">
                  <img
                    src={uploadResult.processedUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* 이름 입력 */}
              <div>
                <label className="text-sm font-medium mb-1 block">이름 *</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="아이템 이름을 입력하세요"
                />
              </div>

              {/* 서브카테고리 선택 */}
              <div>
                <label className="text-sm font-medium mb-1 block">카테고리</label>
                <CategoryFilter
                  type="custom"
                  options={categorySubOptions[category]}
                  selected={formSubCategory ? [formSubCategory] : []}
                  onChange={(selected) => setFormSubCategory(selected[0] || '')}
                />
              </div>

              {/* 색상 표시 */}
              {uploadResult?.colors && uploadResult.colors.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1 block">감지된 색상</label>
                  <div className="flex gap-2">
                    {uploadResult.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: color.startsWith('#') ? color : undefined }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setUploadStep('upload')}
                  className="flex-1"
                >
                  다시 촬영
                </Button>
                <Button onClick={handleCreateItem} disabled={!formName} className="flex-1">
                  저장하기
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 아이템 상세 */}
      <ItemDetailSheet
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        onFavoriteToggle={handleFavoriteToggle}
        onDelete={handleDelete}
      />
    </div>
  );
}
