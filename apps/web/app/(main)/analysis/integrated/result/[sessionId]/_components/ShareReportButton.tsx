'use client';

/**
 * 스타일 리포트 공유 버튼 — 공개 링크 생성 후 공유/복사
 *
 * 링크는 사진·식별 정보가 없는 공개 리포트(/share/report/[token])로 연결.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Link2, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackReportShareCreated } from '@/lib/analytics/tracker';
import { shareToKakao } from '@/lib/share/social';
import { copyToClipboard } from '@/lib/share/shareUtils';
import { withReportReferral, type ReportShareReferral } from '@/lib/share/report-funnel';

interface ShareReportButtonProps {
  sessionId: string;
}

export function ShareReportButton({ sessionId }: ShareReportButtonProps) {
  const t = useTranslations('analysis.integratedResult');
  const tShare = useTranslations('share');
  const [state, setState] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle');
  const [loadingChannel, setLoadingChannel] = useState<ReportShareReferral | null>(null);

  const createShareUrl = async (channel: ReportShareReferral): Promise<string> => {
    if (state === 'loading') throw new Error('share already in progress');
    setState('loading');
    setLoadingChannel(channel);
    try {
      const res = await fetch('/api/share/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error?.userMessage ?? 'failed');

      // 계측 지연·실패가 실제 공유를 막지 않도록 큐 적재만 시작하고 기다리지 않는다.
      void trackReportShareCreated(channel);
      return data.url as string;
    } catch (error) {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
      throw error;
    } finally {
      setLoadingChannel(null);
    }
  };

  const handleKakaoShare = async (): Promise<void> => {
    try {
      const url = await createShareUrl('kakao');
      const shared = await shareToKakao({
        title: t('shareReport.shareTitle'),
        description: t('shareReport.shareText'),
        url,
        referralCode: 'kakao',
      });
      if (!shared) {
        setState('error');
        setTimeout(() => setState('idle'), 2000);
        return;
      }
      setState('idle');
    } catch (error) {
      console.error('[ShareReport] 카카오 공유 실패:', error);
    }
  };

  const handleCopy = async (): Promise<void> => {
    try {
      const url = await createShareUrl('link');
      const copied = await copyToClipboard(withReportReferral(url, 'link'));
      if (!copied) throw new Error('copy failed');
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch (error) {
      console.error('[ShareReport] 링크 복사 실패:', error);
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  let copyIcon = <Link2 className="mr-2 h-4 w-4" />;
  if (loadingChannel === 'link') {
    copyIcon = <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
  } else if (state === 'copied') {
    copyIcon = <Check className="mr-2 h-4 w-4 text-emerald-600" />;
  }

  return (
    <section
      className="space-y-3 rounded-2xl border bg-card p-4"
      data-testid="share-report-actions"
    >
      <p className="text-sm font-semibold text-foreground">{t('shareReport.idle')}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleKakaoShare}
          disabled={state === 'loading'}
          aria-label={tShare('shareOnKakao')}
          data-testid="share-report-kakao-button"
        >
          {loadingChannel === 'kakao' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="mr-2 h-4 w-4" />
          )}
          {tShare('shareOnKakao')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          disabled={state === 'loading'}
          aria-label={tShare('copyLink')}
          data-testid="share-report-copy-button"
        >
          {copyIcon}
          {tShare('copyLink')}
        </Button>
      </div>
      {(state === 'copied' || state === 'error') && (
        <p className="text-xs text-muted-foreground" role="status">
          {state === 'copied' ? t('shareReport.copied') : t('shareReport.error')}
        </p>
      )}
    </section>
  );
}
