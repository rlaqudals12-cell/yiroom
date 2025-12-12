'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { FileBarChart, Dumbbell, UtensilsCrossed, Sparkles, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 빈 상태 타입별 프리셋
type EmptyStatePreset = 'nutrition' | 'workout' | 'report' | 'analysis' | 'custom';

interface EmptyStatePresetConfig {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

const presetConfigs: Record<Exclude<EmptyStatePreset, 'custom'>, EmptyStatePresetConfig> = {
  nutrition: {
    icon: UtensilsCrossed,
    iconColor: 'text-module-nutrition-dark',
    iconBgColor: 'bg-module-nutrition-light dark:bg-module-nutrition-light/50',
    title: '식단 기록이 없어요',
    description: '오늘 먹은 음식을 기록하고 영양 분석을 받아보세요.',
    actionLabel: '식단 기록하기',
    actionHref: '/nutrition',
  },
  workout: {
    icon: Dumbbell,
    iconColor: 'text-module-workout-dark',
    iconBgColor: 'bg-module-workout-light dark:bg-module-workout-light/50',
    title: '운동 기록이 없어요',
    description: '운동을 시작하고 건강한 습관을 만들어보세요.',
    actionLabel: '운동 시작하기',
    actionHref: '/workout',
  },
  report: {
    icon: FileBarChart,
    iconColor: 'text-primary',
    iconBgColor: 'bg-primary/10 dark:bg-primary/20',
    title: '기록이 없어요',
    description: '식단이나 운동 기록이 있어야 리포트를 볼 수 있어요.',
    actionLabel: '기록하러 가기',
    actionHref: '/nutrition',
  },
  analysis: {
    icon: Sparkles,
    iconColor: 'text-module-personal-color-dark',
    iconBgColor: 'bg-module-personal-color-light dark:bg-module-personal-color-light/50',
    title: '분석 결과가 없어요',
    description: '퍼스널 컬러 진단부터 시작해보세요.',
    actionLabel: '분석 시작하기',
    actionHref: '/analysis/personal-color',
  },
};

interface EmptyStateCardProps {
  // 프리셋 사용
  preset?: EmptyStatePreset;
  // 커스텀 설정 (프리셋 덮어쓰기 가능)
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  // 추가 옵션
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

/**
 * 통합 빈 상태 UI 컴포넌트
 * - 프리셋으로 빠르게 사용 가능
 * - 커스텀 설정으로 유연하게 변경 가능
 */
export function EmptyStateCard({
  preset = 'custom',
  icon: customIcon,
  iconColor: customIconColor,
  iconBgColor: customIconBgColor,
  title: customTitle,
  description: customDescription,
  actionLabel: customActionLabel,
  actionHref: customActionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  children,
  className = '',
  'data-testid': testId,
}: EmptyStateCardProps) {
  // 프리셋 설정 가져오기
  const config = preset !== 'custom' ? presetConfigs[preset] : null;

  // 커스텀 값 우선, 없으면 프리셋 값 사용
  const Icon = customIcon || config?.icon || FileBarChart;
  const iconColor = customIconColor || config?.iconColor || 'text-muted-foreground';
  const iconBgColor = customIconBgColor || config?.iconBgColor || 'bg-muted dark:bg-muted/50';
  const title = customTitle || config?.title || '데이터가 없어요';
  const description = customDescription || config?.description || '';
  const actionLabel = customActionLabel || config?.actionLabel;
  const actionHref = customActionHref || config?.actionHref;

  const hasAction = actionLabel && (actionHref || onAction);
  const hasSecondaryAction = secondaryActionLabel && (secondaryActionHref || onSecondaryAction);

  return (
    <Card className={className} data-testid={testId || 'empty-state-card'}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {/* 아이콘 */}
        <div className={`w-16 h-16 rounded-full ${iconBgColor} flex items-center justify-center mb-4`}>
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>

        {/* 설명 */}
        {description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
            {description}
          </p>
        )}

        {/* 커스텀 콘텐츠 */}
        {children}

        {/* 액션 버튼 */}
        {(hasAction || hasSecondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {hasAction && (
              actionHref ? (
                <Link href={actionHref}>
                  <Button>{actionLabel}</Button>
                </Link>
              ) : (
                <Button onClick={onAction}>{actionLabel}</Button>
              )
            )}

            {hasSecondaryAction && (
              secondaryActionHref ? (
                <Link href={secondaryActionHref}>
                  <Button variant="outline">{secondaryActionLabel}</Button>
                </Link>
              ) : (
                <Button variant="outline" onClick={onSecondaryAction}>
                  {secondaryActionLabel}
                </Button>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
