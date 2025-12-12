'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Info, ChevronDown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  analyzeIngredients,
  type IngredientInteraction,
  type InteractionAnalysis,
} from '@/lib/nutrition/ingredient-interaction';

interface InteractionWarningProps {
  ingredients: string[];
  type?: 'supplement' | 'cosmetic';
  showSynergies?: boolean;
}

export function InteractionWarning({
  ingredients,
  type = 'supplement',
  showSynergies = true,
}: InteractionWarningProps) {
  const [expanded, setExpanded] = useState(false);

  const analysis: InteractionAnalysis = useMemo(() => {
    return analyzeIngredients(ingredients, type);
  }, [ingredients, type]);

  const hasWarnings = analysis.warnings.length > 0;
  const hasSynergies = analysis.synergies.length > 0;

  if (analysis.interactions.length === 0) {
    return null;
  }

  return (
    <Card
      className={cn(
        'border-l-4',
        hasWarnings ? 'border-l-yellow-400 bg-yellow-50/50' : 'border-l-green-400 bg-green-50/50'
      )}
    >
      <CardHeader className="pb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            {hasWarnings ? (
              <>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-800">성분 상호작용 주의</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-800">좋은 조합이에요</span>
              </>
            )}
          </CardTitle>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-500 transition-transform',
              expanded && 'rotate-180'
            )}
          />
        </button>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-xs text-gray-600 mb-2">{analysis.summary}</p>

        {expanded && (
          <div className="space-y-3 pt-2 border-t border-gray-200/50">
            {/* 경고 목록 */}
            {analysis.warnings.map((interaction, idx) => (
              <InteractionItem key={`warning-${idx}`} interaction={interaction} />
            ))}

            {/* 타이밍 주의 */}
            {analysis.interactions
              .filter((i) => i.type === 'timing')
              .map((interaction, idx) => (
                <InteractionItem key={`timing-${idx}`} interaction={interaction} />
              ))}

            {/* 시너지 */}
            {showSynergies &&
              analysis.synergies.map((interaction, idx) => (
                <InteractionItem key={`synergy-${idx}`} interaction={interaction} />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface InteractionItemProps {
  interaction: IngredientInteraction;
}

function InteractionItem({ interaction }: InteractionItemProps) {
  const typeConfig = {
    avoid: {
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      label: '피해야 함',
      badgeColor: 'bg-red-100 text-red-700',
    },
    caution: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      label: '주의 필요',
      badgeColor: 'bg-yellow-100 text-yellow-700',
    },
    timing: {
      icon: Info,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      label: '시간차 권장',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    synergy: {
      icon: Sparkles,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      label: '좋은 조합',
      badgeColor: 'bg-green-100 text-green-700',
    },
  };

  const config = typeConfig[interaction.type];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-lg p-3', config.bgColor)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium text-sm text-gray-800">
              {interaction.ingredients[0]} + {interaction.ingredients[1]}
            </span>
            <Badge variant="secondary" className={cn('text-xs', config.badgeColor)}>
              {config.label}
            </Badge>
            {interaction.severity === 'high' && (
              <Badge variant="destructive" className="text-xs">
                중요
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-600 mb-1">{interaction.description}</p>
          <p className="text-xs text-gray-800 font-medium">
            💡 {interaction.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 간단한 인라인 경고 버전
 */
interface InteractionBadgeProps {
  ingredients: string[];
  type?: 'supplement' | 'cosmetic';
}

export function InteractionBadge({ ingredients, type = 'supplement' }: InteractionBadgeProps) {
  const analysis = useMemo(() => {
    return analyzeIngredients(ingredients, type);
  }, [ingredients, type]);

  if (analysis.warnings.length === 0) {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className="bg-yellow-100 text-yellow-700 gap-1"
      title={analysis.summary}
    >
      <AlertTriangle className="h-3 w-3" />
      {analysis.warnings.length}개 주의
    </Badge>
  );
}
