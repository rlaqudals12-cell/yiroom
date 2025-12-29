'use client';

import { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SKIN_TYPES,
  SKIN_CONCERNS,
  type SkinTypeId,
  type SkinConcernId,
} from '@/lib/mock/skin-analysis';

interface KnownSkinTypeInputProps {
  onSelect: (skinType: SkinTypeId, concerns: SkinConcernId[]) => void;
  onBack: () => void;
}

// 피부 타입별 스타일
const skinTypeStyles: Record<SkinTypeId, { bg: string; border: string; selected: string; accent: string }> = {
  dry: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    selected: 'border-amber-500 bg-amber-100',
    accent: 'text-amber-600',
  },
  oily: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    selected: 'border-blue-500 bg-blue-100',
    accent: 'text-blue-600',
  },
  combination: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    selected: 'border-purple-500 bg-purple-100',
    accent: 'text-purple-600',
  },
  normal: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    selected: 'border-green-500 bg-green-100',
    accent: 'text-green-600',
  },
  sensitive: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    selected: 'border-pink-500 bg-pink-100',
    accent: 'text-pink-600',
  },
};

export default function KnownSkinTypeInput({
  onSelect,
  onBack,
}: KnownSkinTypeInputProps) {
  const [selectedType, setSelectedType] = useState<SkinTypeId | null>(null);
  const [selectedConcerns, setSelectedConcerns] = useState<SkinConcernId[]>([]);

  // 피부 타입 선택 핸들러
  const handleTypeSelect = (type: SkinTypeId) => {
    setSelectedType(type);
  };

  // 피부 고민 토글 핸들러
  const handleConcernToggle = (concernId: SkinConcernId) => {
    setSelectedConcerns((prev) =>
      prev.includes(concernId)
        ? prev.filter((id) => id !== concernId)
        : [...prev, concernId]
    );
  };

  // 확인 핸들러
  const handleConfirm = () => {
    if (selectedType) {
      onSelect(selectedType, selectedConcerns);
    }
  };

  return (
    <div data-testid="known-skin-type-input" className="space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          피부 타입을 선택해주세요
        </h2>
        <p className="text-sm text-muted-foreground">
          피부 타입과 고민을 알려주시면 맞춤 솔루션을 제공해드려요
        </p>
      </div>

      {/* Step 1: 피부 타입 선택 */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">1. 피부 타입 선택</p>
        <div className="grid grid-cols-2 gap-3">
          {SKIN_TYPES.map((type) => {
            const styles = skinTypeStyles[type.id];
            const isSelected = selectedType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? styles.selected
                    : `${styles.bg} ${styles.border} hover:opacity-80`
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{type.emoji}</span>
                  {isSelected && <Check className={`w-4 h-4 ${styles.accent}`} />}
                </div>
                <div className="font-semibold text-foreground mt-1">{type.label}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: 피부 고민 선택 (피부 타입 선택 후 표시) */}
      {selectedType && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            2. 피부 고민 선택 <span className="text-muted-foreground font-normal">(복수 선택 가능)</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SKIN_CONCERNS.map((concern) => {
              const isSelected = selectedConcerns.includes(concern.id);

              return (
                <button
                  key={concern.id}
                  onClick={() => handleConcernToggle(concern.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'bg-card border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{concern.emoji}</span>
                      <span className="font-medium text-sm text-foreground">{concern.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 선택하지 않아도 된다는 안내 */}
          <p className="text-xs text-muted-foreground text-center mt-2">
            고민이 없으면 선택하지 않아도 괜찮아요
          </p>
        </div>
      )}

      {/* 선택 결과 미리보기 */}
      {selectedType && (
        <div className={`p-4 rounded-xl ${skinTypeStyles[selectedType].bg} border ${skinTypeStyles[selectedType].border}`}>
          <p className="text-sm text-foreground">
            <span className="font-medium">선택한 피부 타입: </span>
            {SKIN_TYPES.find((t) => t.id === selectedType)?.label}
          </p>
          {selectedConcerns.length > 0 && (
            <p className="text-sm text-foreground mt-1">
              <span className="font-medium">피부 고민: </span>
              {selectedConcerns
                .map((id) => SKIN_CONCERNS.find((c) => c.id === id)?.label)
                .join(', ')}
            </p>
          )}
        </div>
      )}

      {/* 안내 문구 */}
      <div className="text-center text-xs text-muted-foreground">
        <p>더 정확한 분석을 원한다면 AI 진단을 받아보세요</p>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          돌아가기
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedType}
          className="flex-1 h-12 bg-foreground hover:bg-foreground/90 text-background"
        >
          선택 완료
        </Button>
      </div>
    </div>
  );
}
