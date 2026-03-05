'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Loader2, Refrigerator, ArrowRight, Package, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { PantryMetadata } from '@/types/inventory';

/**
 * 냉장고 재료 추가 페이지
 * M-1-2: 재료 관리 페이지 구현
 */

// 보관 위치 타입
type StorageType = 'refrigerator' | 'freezer' | 'room';

// 단위 타입
type UnitType = 'g' | 'ml' | '개' | '팩';

// 보관 위치 옵션
const STORAGE_OPTIONS: { value: StorageType; label: string; icon: string }[] = [
  { value: 'refrigerator', label: '냉장', icon: '🧊' },
  { value: 'freezer', label: '냉동', icon: '❄️' },
  { value: 'room', label: '상온', icon: '🏠' },
];

// 단위 옵션
const UNIT_OPTIONS: { value: UnitType; label: string }[] = [
  { value: 'g', label: 'g' },
  { value: 'ml', label: 'ml' },
  { value: '개', label: '개' },
  { value: '팩', label: '팩' },
];

export default function AddPantryItemPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 입력 상태
  const [name, setName] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<UnitType>('g');
  const [storageType, setStorageType] = useState<StorageType>('refrigerator');
  const [expiryDate, setExpiryDate] = useState<string>('');
  // 선택적 이미지 업로드는 추후 구현 (setter는 추후 이미지 업로드 기능 구현 시 사용)
  const [_imageUrl] = useState<string>('');

  // 유효성 검사
  const isValid = useMemo(() => {
    const nameValid = name.trim().length > 0;
    const quantityValid = parseFloat(quantity) > 0;
    return nameValid && quantityValid;
  }, [name, quantity]);

  // 저장
  const handleSubmit = async () => {
    if (!isValid) {
      toast.error('필수 항목을 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      // PantryMetadata 구성
      const metadata: PantryMetadata = {
        unit,
        quantity: parseFloat(quantity),
        storageType,
        purchaseDate: new Date().toISOString().split('T')[0], // 오늘 날짜
      };

      // API 호출
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'pantry',
          name: name.trim(),
          brand: brand.trim() || null,
          imageUrl: _imageUrl || '/placeholder-pantry.png', // 기본 이미지
          expiryDate: expiryDate || null,
          metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '저장에 실패했어요');
      }

      toast.success('재료가 추가되었어요');
      router.push('/inventory/pantry');
    } catch (err) {
      console.error('[AddPantryItem] Submit error:', err);
      toast.error('재료 추가 중 오류가 발생했어요');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 미로그인
  if (!isSignedIn) {
    router.replace('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="add-pantry-page">
      {/* 헤더 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* 타이틀 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Refrigerator className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">재료 추가</h1>
            <p className="text-muted-foreground mt-2">냉장고 재료를 등록하고 관리하세요</p>
          </div>

          {/* 입력 폼 */}
          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
            {/* 재료명 (필수) */}
            <div>
              <Label htmlFor="name" className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                재료명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="예: 닭가슴살"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
                data-testid="name-input"
              />
            </div>

            {/* 브랜드 (선택) */}
            <div>
              <Label htmlFor="brand" className="flex items-center gap-2">
                브랜드 <span className="text-xs text-muted-foreground">- 선택</span>
              </Label>
              <Input
                id="brand"
                type="text"
                placeholder="예: 하림"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-2"
                data-testid="brand-input"
              />
            </div>

            {/* 수량 + 단위 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="quantity">
                  수량 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min={0}
                  step="0.1"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-2"
                  data-testid="quantity-input"
                />
              </div>
              <div>
                <Label htmlFor="unit">
                  단위 <span className="text-destructive">*</span>
                </Label>
                <Select value={unit} onValueChange={(value) => setUnit(value as UnitType)}>
                  <SelectTrigger id="unit" className="mt-2 w-full" data-testid="unit-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 보관 위치 (필수) */}
            <div>
              <Label className="block mb-3">
                보관 위치 <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {STORAGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStorageType(option.value)}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all text-center',
                      storageType === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                    data-testid={`storage-${option.value}`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <p className="text-sm font-medium">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 유통기한 (선택) */}
            <div>
              <Label htmlFor="expiryDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                유통기한 <span className="text-xs text-muted-foreground">- 선택</span>
              </Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-2"
                data-testid="expiry-date-input"
              />
              <p className="text-xs text-muted-foreground mt-2">
                유통기한을 입력하면 만료 전 알림을 받을 수 있어요
              </p>
            </div>
          </div>

          {/* 안내 */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            등록한 재료로 레시피를 추천받을 수 있어요
          </p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <div className="max-w-md mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 h-12 text-base font-semibold"
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="flex-1 h-12 text-base font-semibold"
            data-testid="submit-button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                추가 중...
              </>
            ) : (
              <>
                추가하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
