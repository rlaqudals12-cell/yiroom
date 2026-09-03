'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { trackSharedReportView } from '@/lib/analytics/tracker';
import { getSharedReportAnalysisHref, type ReportReferralSource } from '@/lib/share/report-funnel';

interface SharedReportFunnelProps {
  referralSource: ReportReferralSource;
}

/** 공개 리포트의 동의된 열람을 기록하고 분석 CTA에 공유 채널을 보존한다. */
export function SharedReportFunnel({ referralSource }: SharedReportFunnelProps) {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void trackSharedReportView(referralSource);
  }, [isLoaded, isSignedIn, referralSource]);

  return (
    <section
      className="space-y-3 rounded-2xl border bg-card p-5 text-center"
      data-testid="shared-report-funnel"
      data-referral-source={referralSource}
    >
      <p className="text-sm font-medium">나도 내 스타일이 궁금하다면?</p>
      <p className="text-xs text-muted-foreground">
        퍼스널컬러로 시작해 피부·체형·헤어·메이크업까지 확장해보세요
      </p>
      <Link
        href={getSharedReportAnalysisHref(referralSource)}
        className="inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        data-testid="shared-report-analysis-start"
      >
        무료로 분석받기
      </Link>
    </section>
  );
}
