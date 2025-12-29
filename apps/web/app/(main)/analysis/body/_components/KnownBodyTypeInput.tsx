'use client';

import { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BODY_TYPES_3,
  type BodyType3,
} from '@/lib/mock/body-analysis';

interface KnownBodyTypeInputProps {
  onSelect: (bodyType: BodyType3) => void;
  onBack: () => void;
}

// 체형 타입별 스타일
const bodyTypeStyles: Record<BodyType3, { bg: string; border: string; selected: string; accent: string }> = {
  S: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    selected: 'border-blue-500 bg-blue-100',
    accent: 'text-blue-600',
  },
  W: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    selected: 'border-pink-500 bg-pink-100',
    accent: 'text-pink-600',
  },
  N: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    selected: 'border-green-500 bg-green-100',
    accent: 'text-green-600',
  },
};

export default function KnownBodyTypeInput({
  onSelect,
  onBack,
}: KnownBodyTypeInputProps) {
  const [selectedType, setSelectedType] = useState<BodyType3 | null>(null);

  // 체형 선택 핸들러
  const handleTypeSelect = (type: BodyType3) => {
    setSelectedType(type);
  };

  // 확인 핸들러
  const handleConfirm = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  return (
    <div data-testid="known-body-type-input" className="space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          체형 타입을 선택해주세요
        </h2>
        <p className="text-sm text-muted-foreground">
          이전에 진단받은 체형 타입을 선택하세요
        </p>
      </div>

      {/* 체형 타입 선택 */}
      <div className="space-y-3">
        {(Object.keys(BODY_TYPES_3) as BodyType3[]).map((type) => {
          const info = BODY_TYPES_3[type];
          const styles = bodyTypeStyles[type];
          const isSelected = selectedType === type;

          return (
            <button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? styles.selected
                  : `${styles.bg} ${styles.border} hover:opacity-80`
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{info.emoji}</span>
                    <span className="font-semibold text-foreground">{info.label}</span>
                    <span className="text-sm text-muted-foreground">({info.labelEn})</span>
                    {isSelected && <Check className={`w-4 h-4 ${styles.accent}`} />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {info.description}
                  </p>
                  {/* 키워드 태그 */}
                  <div className="flex flex-wrap gap-1">
                    {info.keywords.slice(0, 4).map((keyword) => (
                      <span
                        key={keyword}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/70' : 'bg-white/50'
                        } text-muted-foreground`}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 선택 결과 미리보기 */}
      {selectedType && (
        <div className={`p-4 rounded-xl ${bodyTypeStyles[selectedType].bg} border ${bodyTypeStyles[selectedType].border}`}>
          <p className="text-sm font-medium text-foreground mb-2">
            선택한 체형: {BODY_TYPES_3[selectedType].label}
          </p>
          <p className="text-xs text-muted-foreground">
            {BODY_TYPES_3[selectedType].characteristics}
          </p>
        </div>
      )}

      {/* 안내 문구 */}
      <div className="text-center text-xs text-muted-foreground">
        <p>정확하지 않다면 AI 분석을 받아보세요</p>
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
