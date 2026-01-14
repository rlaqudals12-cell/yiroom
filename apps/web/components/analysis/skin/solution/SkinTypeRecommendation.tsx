'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sun, Moon, Calendar, AlertTriangle, Lightbulb } from 'lucide-react';
import {
  SKIN_TYPE_CLEANSER_ROUTINE,
  CLEANSER_TYPES,
  type SkinType,
} from '@/lib/mock/cleanser-types';

interface SkinTypeRecommendationProps {
  skinType: SkinType;
  className?: string;
}

/**
 * 피부 타입 라벨
 */
const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  dry: '건성 피부',
  oily: '지성 피부',
  combination: '복합성 피부',
  sensitive: '민감성 피부',
  normal: '중성 피부',
  all: '모든 피부',
};

/**
 * 피부 타입별 색상
 */
const SKIN_TYPE_COLORS: Record<SkinType, string> = {
  dry: 'bg-orange-100 dark:bg-orange-950/30 border-orange-300',
  oily: 'bg-blue-100 dark:bg-blue-950/30 border-blue-300',
  combination: 'bg-purple-100 dark:bg-purple-950/30 border-purple-300',
  sensitive: 'bg-pink-100 dark:bg-pink-950/30 border-pink-300',
  normal: 'bg-green-100 dark:bg-green-950/30 border-green-300',
  all: 'bg-gray-100 dark:bg-gray-950/30 border-gray-300',
};

/**
 * 클렌저 ID로 한글 이름 가져오기
 */
function getCleanserName(id: string): string {
  const cleanser = CLEANSER_TYPES.find((c) => c.id === id);
  return cleanser?.nameKo || id;
}

/**
 * 피부 타입별 클렌징 추천 컴포넌트
 */
export function SkinTypeRecommendation({ skinType, className }: SkinTypeRecommendationProps) {
  const routine = SKIN_TYPE_CLEANSER_ROUTINE[skinType];

  if (!routine) {
    return null;
  }

  return (
    <Card
      className={cn('border-2', SKIN_TYPE_COLORS[skinType], className)}
      data-testid={`skin-type-recommendation-${skinType}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{SKIN_TYPE_LABELS[skinType]} 클렌징 가이드</span>
          <Badge variant="secondary">{skinType === 'all' ? '기본' : '맞춤'}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 아침 루틴 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            아침 클렌징
          </h4>
          <div className="flex flex-wrap gap-2">
            {routine.morning.map((id) => (
              <Badge key={id} variant="outline" className="text-sm">
                {getCleanserName(id)}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {skinType === 'oily'
              ? '아침에도 가볍게 클렌징하여 밤사이 분비된 피지를 제거하세요.'
              : skinType === 'dry' || skinType === 'sensitive'
                ? '아침에는 순한 클렌저로 가볍게, 또는 물세안도 괜찮아요.'
                : '상태에 따라 선택하세요.'}
          </p>
        </div>

        {/* 저녁 루틴 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-500" />
            저녁 클렌징
          </h4>
          <div className="flex flex-wrap gap-2">
            {routine.evening.map((id, idx) => (
              <div key={id} className="flex items-center gap-1">
                <Badge variant="outline" className="text-sm">
                  {idx + 1}차: {getCleanserName(id)}
                </Badge>
                {idx < routine.evening.length - 1 && (
                  <span className="text-muted-foreground">→</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            메이크업이나 선크림을 사용했다면 더블 클렌징을 권장합니다.
          </p>
        </div>

        {/* 주간 케어 */}
        {routine.weekly.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              주간 케어 (주 1-2회)
            </h4>
            <div className="flex flex-wrap gap-2">
              {routine.weekly.map((id) => (
                <Badge key={id} variant="secondary" className="text-sm">
                  {getCleanserName(id)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 피해야 할 클렌저 */}
        {routine.avoid.length > 0 && (
          <div className="space-y-2 bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
            <h4 className="text-sm font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              피해야 할 클렌저
            </h4>
            <div className="flex flex-wrap gap-2">
              {routine.avoid.map((id) => (
                <Badge key={id} variant="outline" className="text-sm border-red-300 text-red-600">
                  {getCleanserName(id)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 팁 */}
        {routine.tips.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              {SKIN_TYPE_LABELS[skinType]} 클렌징 팁
            </h4>
            <ul className="space-y-1">
              {routine.tips.map((tip, idx) => (
                <li key={idx} className="text-xs text-muted-foreground">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SkinTypeRecommendation;
