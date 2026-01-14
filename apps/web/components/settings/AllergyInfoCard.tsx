'use client';

import { useState, useCallback } from 'react';
import { AlertTriangle, X, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AllergyInfoCardProps {
  allergies: string[];
  onAllergiesChange: (allergies: string[]) => Promise<boolean>;
  isLoading?: boolean;
}

// 일반적인 알러지 목록 (식품의약품안전처 기준 21가지 중 주요 항목)
const COMMON_ALLERGIES = [
  '땅콩',
  '우유',
  '달걀',
  '밀',
  '대두',
  '갑각류',
  '생선',
  '견과류',
  '참깨',
  '아황산류',
  '복숭아',
  '토마토',
];

/**
 * 알러지 정보 카드 컴포넌트
 * 태그 형식의 알러지 입력/수정 UI
 */
export function AllergyInfoCard({
  allergies,
  onAllergiesChange,
  isLoading = false,
}: AllergyInfoCardProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 알러지 추가
  const handleAddAllergy = useCallback(
    async (allergy: string) => {
      const trimmed = allergy.trim();
      if (!trimmed) return;
      if (allergies.includes(trimmed)) return; // 중복 방지

      setIsSaving(true);
      try {
        await onAllergiesChange([...allergies, trimmed]);
        setInputValue('');
      } finally {
        setIsSaving(false);
      }
    },
    [allergies, onAllergiesChange]
  );

  // 알러지 삭제
  const handleRemoveAllergy = useCallback(
    async (allergyToRemove: string) => {
      setIsSaving(true);
      try {
        await onAllergiesChange(allergies.filter((a) => a !== allergyToRemove));
      } finally {
        setIsSaving(false);
      }
    },
    [allergies, onAllergiesChange]
  );

  // 입력 제출
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleAddAllergy(inputValue);
    },
    [inputValue, handleAddAllergy]
  );

  // 키보드 입력 (Enter 또는 쉼표로 추가)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        handleAddAllergy(inputValue);
      }
    },
    [inputValue, handleAddAllergy]
  );

  // 일반 알러지 버튼 클릭
  const handleCommonAllergyClick = useCallback(
    (allergy: string) => {
      if (allergies.includes(allergy)) {
        handleRemoveAllergy(allergy);
      } else {
        handleAddAllergy(allergy);
      }
    },
    [allergies, handleAddAllergy, handleRemoveAllergy]
  );

  const isDisabled = isLoading || isSaving;

  return (
    <Card data-testid="allergy-info-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          알러지 정보
        </CardTitle>
        <CardDescription>영양 및 제품 추천에 활용됩니다</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 등록된 알러지 태그 */}
        {allergies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allergies.map((allergy) => (
              <Badge
                key={allergy}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                {allergy}
                <button
                  onClick={() => handleRemoveAllergy(allergy)}
                  disabled={isDisabled}
                  className={cn(
                    'ml-1 hover:text-destructive transition-colors',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                  aria-label={`${allergy} 삭제`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* 알러지 입력 폼 */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="알러지 추가..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            className={cn('flex-1', isDisabled && 'opacity-50')}
          />
          <Button
            type="submit"
            size="icon"
            variant="outline"
            disabled={isDisabled || !inputValue.trim()}
          >
            <Plus className="w-4 h-4" />
            <span className="sr-only">알러지 추가</span>
          </Button>
        </form>

        {/* 일반적인 알러지 버튼 */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">일반적인 알러지</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_ALLERGIES.map((allergy) => {
              const isSelected = allergies.includes(allergy);
              return (
                <button
                  key={allergy}
                  onClick={() => handleCommonAllergyClick(allergy)}
                  disabled={isDisabled}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-full border transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {allergy}
                </button>
              );
            })}
          </div>
        </div>

        {/* 알러지 없음 안내 */}
        {allergies.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">등록된 알러지가 없습니다</p>
        )}
      </CardContent>
    </Card>
  );
}
