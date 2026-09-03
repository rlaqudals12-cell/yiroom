/** 공개 리포트 공유 채널 — URL/계측에 허용하는 값만 보존한다. */
export const REPORT_SHARE_REFERRALS = ['kakao', 'link'] as const;

export type ReportShareReferral = (typeof REPORT_SHARE_REFERRALS)[number];
export type ReportReferralSource = ReportShareReferral | 'direct';

/** 외부 입력인 ref를 제한해 임의 문자열·개인정보가 계측 데이터로 들어가지 않게 한다. */
export function normalizeReportReferral(
  value: string | string[] | undefined
): ReportReferralSource {
  const candidate = Array.isArray(value) ? value[0] : value;
  return REPORT_SHARE_REFERRALS.includes(candidate as ReportShareReferral)
    ? (candidate as ReportShareReferral)
    : 'direct';
}

/** 채널 귀속을 공개 리포트 URL에 붙인다. */
export function withReportReferral(url: string, referral: ReportShareReferral): string {
  const target = new URL(url);
  target.searchParams.set('ref', referral);
  return target.toString();
}

/** 공개 리포트 CTA 이후에도 최초 공유 채널을 보존한다. */
export function getSharedReportAnalysisHref(referral: ReportReferralSource): string {
  const analysisPath = '/analysis/personal-color';
  return referral === 'direct' ? analysisPath : `${analysisPath}?ref=${referral}`;
}
