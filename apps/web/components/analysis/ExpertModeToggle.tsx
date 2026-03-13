'use client';

import { FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface ExpertModeToggleProps {
  isExpert: boolean;
  onToggle: () => void;
  className?: string;
}

/** 전문가 모드 토글 버튼 — 결과 페이지 헤더에 배치 */
export function ExpertModeToggle({ isExpert, onToggle, className }: ExpertModeToggleProps) {
  const t = useTranslations('analysis');

  return (
    <Button
      variant={isExpert ? 'default' : 'ghost'}
      size="sm"
      onClick={onToggle}
      className={cn('gap-1.5 text-xs', className)}
      aria-pressed={isExpert}
      aria-label={t('expertMode')}
      data-testid="expert-mode-toggle"
    >
      <FlaskConical className="w-3.5 h-3.5" />
      {t('expertMode')}
    </Button>
  );
}
