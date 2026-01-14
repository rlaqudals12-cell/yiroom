'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Droplets,
  Sun,
  Moon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
} from 'lucide-react';
import type { CleanserType, SkinType } from '@/lib/mock/cleanser-types';

interface CleanserTypeCardProps {
  cleanser: CleanserType;
  userSkinType?: SkinType;
  isExpanded?: boolean;
  onToggle?: () => void;
}

/**
 * 피부 타입 라벨
 */
const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  dry: '건성',
  oily: '지성',
  combination: '복합성',
  sensitive: '민감성',
  normal: '중성',
  all: '모든 피부',
};

/**
 * 사용 시점 아이콘
 */
function UsageIcon({ usage }: { usage: 'first' | 'second' | 'both' }) {
  if (usage === 'first') return <Moon className="h-4 w-4" />;
  if (usage === 'second') return <Droplets className="h-4 w-4" />;
  return <Sun className="h-4 w-4" />;
}

/**
 * 사용 시점 라벨
 */
function getUsageLabel(usage: 'first' | 'second' | 'both'): string {
  if (usage === 'first') return '1차 클렌징';
  if (usage === 'second') return '2차 클렌징';
  return '단독/복합 사용';
}

/**
 * 빈도 라벨
 */
function getFrequencyLabel(frequency: 'daily' | 'weekly' | 'as-needed'): string {
  if (frequency === 'daily') return '매일';
  if (frequency === 'weekly') return '주 1-2회';
  return '필요 시';
}

/**
 * 클렌저 유형 카드 컴포넌트
 */
export function CleanserTypeCard({
  cleanser,
  userSkinType,
  isExpanded = false,
  onToggle,
}: CleanserTypeCardProps) {
  const [localExpanded, setLocalExpanded] = useState(isExpanded);
  const expanded = onToggle ? isExpanded : localExpanded;
  const handleToggle = onToggle || (() => setLocalExpanded(!localExpanded));

  // 사용자 피부 타입에 따른 추천 여부
  const isRecommended = userSkinType
    ? cleanser.recommendedFor.includes(userSkinType) || cleanser.recommendedFor.includes('all')
    : false;
  const isNotRecommended = userSkinType ? cleanser.notRecommendedFor.includes(userSkinType) : false;

  return (
    <Card
      className={cn(
        'transition-all',
        isRecommended && 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
        isNotRecommended && 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
      )}
      data-testid={`cleanser-card-${cleanser.id}`}
    >
      <CardHeader className="pb-2">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-semibold text-base">{cleanser.nameKo}</span>
              <span className="text-xs text-muted-foreground">{cleanser.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* pH 배지 */}
            {cleanser.phRange && (
              <Badge variant="outline" className="text-xs">
                pH {cleanser.phRange}
              </Badge>
            )}

            {/* 추천/비추천 표시 */}
            {userSkinType && isRecommended && (
              <Badge className="bg-green-500 text-white text-xs">추천</Badge>
            )}
            {userSkinType && isNotRecommended && (
              <Badge className="bg-red-500 text-white text-xs">주의</Badge>
            )}

            {expanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* 간단 설명 (항상 표시) */}
        <p className="text-sm text-muted-foreground mt-2">{cleanser.description}</p>

        {/* 사용 시점 배지 */}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <UsageIcon usage={cleanser.usage} />
            {getUsageLabel(cleanser.usage)}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {getFrequencyLabel(cleanser.frequency)}
          </Badge>
        </div>
      </CardHeader>

      {/* 확장 내용 */}
      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* 작동 원리 */}
          <div>
            <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              작동 원리
            </h4>
            <p className="text-sm text-muted-foreground">{cleanser.howItWorks}</p>
          </div>

          {/* 장점 */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              장점
            </h4>
            <ul className="space-y-1">
              {cleanser.pros.map((pro, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          {/* 단점 */}
          {cleanser.cons.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-500" />
                단점
              </h4>
              <ul className="space-y-1">
                {cleanser.cons.map((con, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 추천 피부 타입 */}
          <div>
            <h4 className="text-sm font-medium mb-2">추천 피부 타입</h4>
            <div className="flex flex-wrap gap-1">
              {cleanser.recommendedFor.map((type) => (
                <Badge
                  key={type}
                  variant="outline"
                  className={cn(
                    'text-xs',
                    userSkinType === type && 'bg-green-100 dark:bg-green-900/30 border-green-500'
                  )}
                >
                  {SKIN_TYPE_LABELS[type]}
                </Badge>
              ))}
            </div>
          </div>

          {/* 비추천 피부 타입 */}
          {cleanser.notRecommendedFor.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                주의가 필요한 피부 타입
              </h4>
              <div className="flex flex-wrap gap-1">
                {cleanser.notRecommendedFor.map((type) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className={cn(
                      'text-xs border-orange-500 text-orange-600',
                      userSkinType === type && 'bg-orange-100 dark:bg-orange-900/30'
                    )}
                  >
                    {SKIN_TYPE_LABELS[type]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 사용 팁 */}
          {cleanser.tips.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                사용 팁
              </h4>
              <ul className="space-y-1">
                {cleanser.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default CleanserTypeCard;
