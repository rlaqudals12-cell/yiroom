import Link from 'next/link';

export type ImageStorageUnavailableReason =
  | 'no_consent'
  | 'expired'
  | 'purged'
  | 'purge_pending'
  | 'reconciliation_pending'
  | 'renewal_required'
  | 'missing'
  | 'loading'
  | 'unknown'
  | 'unsupported';

interface ImageStorageUnavailableNoticeProps {
  analysisHref?: string;
  analysisLinkLabel?: string;
  children?: React.ReactNode;
  consentRequiredMessage?: string;
  featureLabel: string;
  reason: ImageStorageUnavailableReason;
  testId?: string;
}

export function getImageStorageUnavailableMessage({
  featureLabel,
  reason,
}: {
  featureLabel: string;
  reason: ImageStorageUnavailableReason;
}): string {
  switch (reason) {
    case 'no_consent':
      return `사진 저장에 동의한 뒤 다시 분석하면 ${featureLabel}를 볼 수 있어요.`;
    case 'expired':
      return `보관 기한이 지나 저장 사진이 파기되어 ${featureLabel}를 표시하지 않았어요.`;
    case 'purged':
      return `저장 사진이 파기되어 ${featureLabel}를 표시하지 않았어요.`;
    case 'purge_pending':
      return '사진 저장 동의는 철회됐지만 일부 사진 삭제를 마치지 못했어요. 개인정보 설정에서 삭제를 다시 시도해 주세요.';
    case 'reconciliation_pending':
      return '사진 삭제 확인을 마무리하고 있어요. 확인이 끝나면 개인정보 설정에서 사진 저장에 다시 동의할 수 있어요.';
    case 'renewal_required':
      return `사진 저장 동의를 다시 확인한 뒤 분석하면 ${featureLabel}를 볼 수 있어요.`;
    case 'missing':
      return `저장 사진이 없어 ${featureLabel}를 표시하지 않았어요.`;
    case 'loading':
      return '사진 저장 상태를 확인하고 있어요.';
    case 'unsupported':
      return `체형 분석의 새 사진 저장 선택은 현재 지원하지 않아요. 저장 사진을 확인할 수 없어 ${featureLabel}는 표시하지 않았어요.`;
    case 'unknown':
    default:
      return `사진을 확인할 수 없어 ${featureLabel}를 표시하지 않았어요.`;
  }
}

export function getDrapingUnavailableMessage({
  consentGiven,
  wasPurged = false,
}: {
  consentGiven: boolean;
  wasPurged?: boolean;
}): string {
  let reason: ImageStorageUnavailableReason = consentGiven ? 'missing' : 'no_consent';
  if (wasPurged) reason = 'purged';

  return getImageStorageUnavailableMessage({
    featureLabel: '드레이핑 비교',
    reason,
  });
}

function canRestoreThroughConsent(reason: ImageStorageUnavailableReason): boolean {
  return (
    reason === 'no_consent' ||
    reason === 'expired' ||
    reason === 'purged' ||
    reason === 'renewal_required'
  );
}

/** 저장 사진이 없어 후속 기능이 잠길 때, 확인된 원인과 실제 복구 동선만 남긴다. */
export function ImageStorageUnavailableNotice({
  analysisHref,
  analysisLinkLabel = '사진 저장 동의하고 다시 분석',
  children,
  consentRequiredMessage,
  featureLabel,
  reason,
  testId = 'image-storage-unavailable-notice',
}: ImageStorageUnavailableNoticeProps): React.JSX.Element {
  const showConsentRecovery = canRestoreThroughConsent(reason) && Boolean(analysisHref);
  const showPurgeRetry = reason === 'purge_pending';
  const showReconciliationStatus = reason === 'reconciliation_pending';
  const message =
    children ??
    (consentRequiredMessage && canRestoreThroughConsent(reason)
      ? consentRequiredMessage
      : getImageStorageUnavailableMessage({ featureLabel, reason }));

  return (
    <aside
      aria-live="polite"
      className="space-y-2 border-y border-border py-3 text-sm"
      data-testid={testId}
      role="note"
    >
      <p className="text-muted-foreground">{message}</p>
      {showConsentRecovery && analysisHref && (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link
            className="font-medium text-foreground underline underline-offset-4"
            href={analysisHref}
          >
            {analysisLinkLabel}
          </Link>
          <Link
            className="text-muted-foreground underline underline-offset-4"
            href="/settings/privacy"
          >
            개인정보 설정
          </Link>
        </div>
      )}
      {showPurgeRetry && (
        <Link
          className="font-medium text-foreground underline underline-offset-4"
          href="/settings/privacy"
        >
          개인정보 설정에서 사진 삭제 다시 시도
        </Link>
      )}
      {showReconciliationStatus && (
        <Link
          className="font-medium text-foreground underline underline-offset-4"
          href="/settings/privacy"
        >
          개인정보 설정에서 상태 확인
        </Link>
      )}
    </aside>
  );
}
