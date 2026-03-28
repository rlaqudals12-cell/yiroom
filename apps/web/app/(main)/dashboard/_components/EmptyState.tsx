'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyState() {
  const t = useTranslations('dashboard');
  return (
    <div className="bg-muted rounded-xl border border-dashed border-border p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-module-personal-color-light flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-module-personal-color" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">{t('empty.noResults')}</h3>

      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{t('empty.pcFirstDesc')}</p>

      <Link href="/analysis/personal-color">
        <Button className="gap-2 bg-gradient-brand hover:opacity-90">
          <Sparkles className="w-4 h-4" />
          {t('empty.startPcDiagnosis')}
        </Button>
      </Link>
    </div>
  );
}
