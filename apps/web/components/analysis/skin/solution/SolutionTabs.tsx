'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Droplets, Sparkles } from 'lucide-react';
import { CleansingGuide } from './CleansingGuide';
import type { SkinType } from '@/lib/mock/cleanser-types';

interface SolutionTabsProps {
  userSkinType?: SkinType;
  className?: string;
}

/**
 * 피부 상세 솔루션 컴포넌트
 * 현재: 클렌징 가이드 제공 (추후 스킨케어 순서, 성분, 루틴 확장 예정)
 */
export function SolutionTabs({ userSkinType, className }: SolutionTabsProps) {
  return (
    <div className={cn('', className)} data-testid="solution-tabs">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            피부 상세 솔루션
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">클렌징 가이드</h3>
          </div>
          <CleansingGuide userSkinType={userSkinType} />

          <p className="text-xs text-muted-foreground text-center mt-6">
            스킨케어 순서, 성분 사전, 나만의 루틴은 곧 추가될 예정이에요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default SolutionTabs;
