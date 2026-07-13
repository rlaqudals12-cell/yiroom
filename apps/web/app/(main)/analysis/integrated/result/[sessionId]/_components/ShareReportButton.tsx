'use client';

/**
 * 스타일 리포트 공유 버튼 — 공개 링크 생성 후 공유/복사
 *
 * 링크는 사진·식별 정보가 없는 공개 리포트(/share/report/[token])로 연결.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Share2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareReportButtonProps {
  sessionId: string;
}

export function ShareReportButton({ sessionId }: ShareReportButtonProps) {
  const t = useTranslations('analysis.integratedResult');
  const [state, setState] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle');

  const handleShare = async () => {
    if (state === 'loading') return;
    setState('loading');
    try {
      const res = await fetch('/api/share/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error?.userMessage ?? 'failed');

      // Web Share 우선 (모바일), 미지원이면 클립보드
      if (navigator.share) {
        try {
          await navigator.share({
            title: t('shareReport.shareTitle'),
            text: t('shareReport.shareText'),
            url: data.url,
          });
          setState('idle');
          return;
        } catch {
          /* 사용자가 공유 시트 닫음 — 클립보드로 폴백하지 않고 종료 */
          setState('idle');
          return;
        }
      }
      await navigator.clipboard.writeText(data.url);
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch (e) {
      console.error('[ShareReport] 실패:', e);
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleShare}
      disabled={state === 'loading'}
      data-testid="share-report-button"
    >
      {state === 'loading' ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : state === 'copied' ? (
        <Check className="w-4 h-4 mr-2 text-emerald-500" />
      ) : (
        <Share2 className="w-4 h-4 mr-2" />
      )}
      {state === 'copied'
        ? t('shareReport.copied')
        : state === 'error'
          ? t('shareReport.error')
          : t('shareReport.idle')}
    </Button>
  );
}
