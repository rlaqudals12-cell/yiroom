'use client';

/**
 * K-4 영양 고도화: 영양소 시너지/길항 카드 컴포넌트
 *
 * @description 영양소 간 상호작용 시각화 및 섭취 가이드
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 5
 * @see lib/nutrition/nutrient-synergy.ts
 */

import { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus, Info, ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getInteractionFactor,
  getInteractionType,
  getSynergyNutrients,
  getAntagonistNutrients,
  getInteractionInfo,
  NUTRIENT_INTERACTION_MATRIX,
  type InteractionType,
} from '@/lib/nutrition/nutrient-synergy';

// 영양소 한글 라벨
const NUTRIENT_LABELS: Record<string, string> = {
  vitaminA: '비타민 A',
  vitaminC: '비타민 C',
  vitaminD: '비타민 D',
  vitaminE: '비타민 E',
  vitaminK: '비타민 K',
  calcium: '칼슘',
  iron: '철분',
  zinc: '아연',
  magnesium: '마그네슘',
  selenium: '셀레늄',
  copper: '구리',
  omega3: '오메가-3',
  collagen: '콜라겐',
  hyaluronicAcid: '히알루론산',
  tea: '녹차/탄닌',
};

// 상호작용 타입별 스타일
const INTERACTION_STYLES: Record<InteractionType, { icon: typeof ArrowUp; color: string; bg: string; label: string }> = {
  synergy: {
    icon: ArrowUp,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    label: '시너지',
  },
  independent: {
    icon: Minus,
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    label: '독립',
  },
  antagonist: {
    icon: ArrowDown,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    label: '길항',
  },
};

interface NutrientSynergyCardProps {
  /** 선택된 영양소 (영문 키) */
  selectedNutrient?: string;
  /** 클래스명 */
  className?: string;
  /** 컴팩트 모드 */
  compact?: boolean;
}

/**
 * 영양소 상호작용 아이템
 */
function InteractionItem({
  nutrient1,
  nutrient2,
  isExpanded,
  onToggle,
}: {
  nutrient1: string;
  nutrient2: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const info = getInteractionInfo(nutrient1, nutrient2);
  const style = INTERACTION_STYLES[info.type];
  const Icon = style.icon;

  const factorPercent = Math.round((info.factor - 1) * 100);
  const factorLabel = factorPercent > 0 ? `+${factorPercent}%` : `${factorPercent}%`;

  return (
    <div className={cn('rounded-lg overflow-hidden border', style.bg)}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', style.bg)}>
            <Icon className={cn('w-4 h-4', style.color)} />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {NUTRIENT_LABELS[nutrient2] || nutrient2}
            </p>
            <p className="text-xs text-muted-foreground">{style.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-bold', style.color)}>
            {info.type !== 'independent' ? factorLabel : '-'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && info.description && (
        <div className="px-3 pb-3 border-t border-current/10">
          <div className="flex items-start gap-2 pt-3">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 영양소 시너지/길항 카드 메인 컴포넌트
 */
export function NutrientSynergyCard({
  selectedNutrient,
  className,
  compact = false,
}: NutrientSynergyCardProps) {
  const [activeNutrient, setActiveNutrient] = useState<string>(selectedNutrient || 'vitaminC');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // 현재 영양소의 시너지/길항 목록
  const synergyNutrients = useMemo(() => getSynergyNutrients(activeNutrient), [activeNutrient]);
  const antagonistNutrients = useMemo(() => getAntagonistNutrients(activeNutrient), [activeNutrient]);

  // 사용 가능한 영양소 목록
  const availableNutrients = useMemo(
    () => Object.keys(NUTRIENT_INTERACTION_MATRIX),
    []
  );

  const toggleItem = (nutrient: string) => {
    setExpandedItem((prev) => (prev === nutrient ? null : nutrient));
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden',
        className
      )}
      data-testid="nutrient-synergy-card"
    >
      {/* 헤더 */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">영양소 상호작용</h3>
            <p className="text-sm text-muted-foreground">
              함께 먹으면 좋은/피해야 할 조합
            </p>
          </div>
        </div>

        {/* 영양소 선택 */}
        {!compact && (
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              영양소 선택
            </label>
            <select
              value={activeNutrient}
              onChange={(e) => {
                setActiveNutrient(e.target.value);
                setExpandedItem(null);
              }}
              className="w-full px-4 py-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {availableNutrients.map((nutrient) => (
                <option key={nutrient} value={nutrient}>
                  {NUTRIENT_LABELS[nutrient] || nutrient}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 시너지 섹션 */}
      {synergyNutrients.length > 0 && (
        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
          <h4 className="font-semibold text-sm text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
            <ArrowUp className="w-4 h-4" />
            함께 섭취하면 좋아요
          </h4>
          <div className="space-y-2">
            {(compact ? synergyNutrients.slice(0, 2) : synergyNutrients).map((nutrient) => (
              <InteractionItem
                key={nutrient}
                nutrient1={activeNutrient}
                nutrient2={nutrient}
                isExpanded={expandedItem === nutrient}
                onToggle={() => toggleItem(nutrient)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 길항 섹션 */}
      {antagonistNutrients.length > 0 && (
        <div className="p-5">
          <h4 className="font-semibold text-sm text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            따로 섭취하세요
          </h4>
          <div className="space-y-2">
            {(compact ? antagonistNutrients.slice(0, 2) : antagonistNutrients).map((nutrient) => (
              <InteractionItem
                key={nutrient}
                nutrient1={activeNutrient}
                nutrient2={nutrient}
                isExpanded={expandedItem === nutrient}
                onToggle={() => toggleItem(nutrient)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 팁 */}
      {!compact && (
        <div className="px-5 pb-5">
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-emerald-600" />
              <p className="font-medium text-sm text-emerald-800 dark:text-emerald-300">
                섭취 팁
              </p>
            </div>
            <ul className="space-y-1 text-sm text-emerald-700 dark:text-emerald-200">
              <li>• 시너지 영양소는 같은 식사에서 함께 섭취하세요.</li>
              <li>• 길항 영양소는 2시간 이상 간격을 두세요.</li>
              <li>• 보충제보다 자연 식품에서 섭취하는 것이 흡수율이 높습니다.</li>
            </ul>
          </div>
        </div>
      )}

      {/* 면책조항 */}
      <div className="px-5 pb-4">
        <p className="text-xs text-muted-foreground text-center">
          ※ 참고용 정보입니다. 개인별 건강 상태에 따라 다를 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export default NutrientSynergyCard;
