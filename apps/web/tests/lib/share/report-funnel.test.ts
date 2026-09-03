import { describe, expect, it } from 'vitest';
import {
  getSharedReportAnalysisHref,
  normalizeReportReferral,
  withReportReferral,
} from '@/lib/share/report-funnel';

describe('공개 리포트 공유 퍼널', () => {
  it('허용된 채널만 보존하고 임의 ref는 direct로 닫는다', () => {
    expect(normalizeReportReferral('kakao')).toBe('kakao');
    expect(normalizeReportReferral(['link', 'ignored'])).toBe('link');
    expect(normalizeReportReferral('user@example.com')).toBe('direct');
    expect(normalizeReportReferral(undefined)).toBe('direct');
  });

  it('공유 URL과 분석 CTA에 같은 채널 귀속을 보존한다', () => {
    expect(withReportReferral('https://yiroom.app/share/report/abc?campaign=q', 'link')).toBe(
      'https://yiroom.app/share/report/abc?campaign=q&ref=link'
    );
    expect(getSharedReportAnalysisHref('kakao')).toBe('/analysis/personal-color?ref=kakao');
    expect(getSharedReportAnalysisHref('direct')).toBe('/analysis/personal-color');
  });
});
