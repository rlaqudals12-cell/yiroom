'use client';

/**
 * 성별 적응형 악세서리 추천 컴포넌트
 * @description K-1 성별 중립화: 퍼스널컬러 결과에서 성별에 맞는 악세서리 추천
 */

import { useState } from 'react';
import { Watch, Glasses, Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SeasonType } from '@/lib/mock/personal-color';
import {
  getAccessoryRecommendations,
  type GenderPreference,
  type AccessoryRecommendation,
} from '@/lib/content/gender-adaptive';

interface GenderAdaptiveAccessoriesProps {
  seasonType: SeasonType;
  className?: string;
}

// 카테고리별 아이콘
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  watch: <Watch className="w-4 h-4" />,
  sunglasses: <Glasses className="w-4 h-4" />,
  tie: <Shirt className="w-4 h-4" />,
  belt: <Shirt className="w-4 h-4" />,
  jewelry: <span className="text-sm">💎</span>,
  scarf: <span className="text-sm">🧣</span>,
  bag: <span className="text-sm">👜</span>,
};

export function GenderAdaptiveAccessories({
  seasonType,
  className,
}: GenderAdaptiveAccessoriesProps) {
  const [selectedGender, setSelectedGender] = useState<GenderPreference>('neutral');

  const accessories = getAccessoryRecommendations(seasonType, {
    gender: selectedGender,
    stylePreference:
      selectedGender === 'male' ? 'masculine' : selectedGender === 'female' ? 'feminine' : 'unisex',
  });

  // 카테고리별 그룹핑
  const groupedAccessories = accessories.reduce(
    (acc, item) => {
      const category = item.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, AccessoryRecommendation[]>
  );

  return (
    <div
      className={cn('bg-card rounded-xl border border-border p-4', className)}
      data-testid="gender-adaptive-accessories"
    >
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-lg">✨</span>
        맞춤 악세서리 추천
      </h3>

      {/* 성별 선택 탭 */}
      <div className="flex gap-2 mb-4">
        {(['neutral', 'male', 'female'] as GenderPreference[]).map((gender) => (
          <button
            key={gender}
            onClick={() => setSelectedGender(gender)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full transition-colors',
              selectedGender === gender
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
            data-testid={`gender-tab-${gender}`}
          >
            {gender === 'neutral' && '전체'}
            {gender === 'male' && '남성'}
            {gender === 'female' && '여성'}
          </button>
        ))}
      </div>

      {/* 악세서리 목록 */}
      <div className="space-y-4">
        {Object.entries(groupedAccessories).map(([category, items]) => (
          <div key={category}>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              {CATEGORY_ICONS[category]}
              {category === 'watch' && '시계'}
              {category === 'sunglasses' && '선글라스'}
              {category === 'tie' && '넥타이'}
              {category === 'belt' && '벨트'}
              {category === 'jewelry' && '주얼리'}
              {category === 'scarf' && '스카프'}
              {category === 'bag' && '가방'}
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {items.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                  {/* 색상 미리보기 */}
                  <div
                    className="w-8 h-8 rounded-full border border-border flex-shrink-0"
                    style={{ backgroundColor: item.hex }}
                    title={item.colorName}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.easyDescription}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 브랜드 힌트 */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        추천 브랜드는 참고용이에요. 비슷한 색상의 제품을 찾아보세요!
      </p>
    </div>
  );
}
