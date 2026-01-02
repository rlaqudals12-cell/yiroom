'use client';

import type { Milestone } from '@/lib/milestones';
import { cn } from '@/lib/utils';

interface MilestoneToastProps {
  milestone: Milestone;
}

// 타입별 배경 색상
const TYPE_COLORS: Record<Milestone['type'], string> = {
  workout: 'bg-orange-100 border-orange-200',
  nutrition: 'bg-green-100 border-green-200',
  closet: 'bg-purple-100 border-purple-200',
  personal_record: 'bg-blue-100 border-blue-200',
};

/**
 * 마일스톤 달성 알림용 Toast 컴포넌트
 * sonner의 custom toast로 사용
 */
export function MilestoneToast({ milestone }: MilestoneToastProps) {
  return (
    <div data-testid="milestone-toast" className="flex items-center gap-3 p-1">
      {/* 아이콘 */}
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full text-2xl',
          'shadow-lg border-2',
          TYPE_COLORS[milestone.type]
        )}
      >
        {milestone.icon}
      </div>

      {/* 텍스트 */}
      <div className="flex flex-col">
        <span className="text-xs font-medium text-primary">축하해요!</span>
        <span className="font-semibold">{milestone.title}</span>
        <span className="text-xs text-muted-foreground">{milestone.description}</span>
      </div>
    </div>
  );
}

export default MilestoneToast;
