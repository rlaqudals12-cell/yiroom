import { ImageStorageUnavailableNotice } from '@/components/analysis/consent/ImageStorageUnavailableNotice';
import type { IntegratedStoredImageAccessState } from '@/lib/analysis/integrated/types';

interface IntegratedImageStorageNoticeProps {
  consentGiven: boolean | null;
  wasPurged: boolean;
  storageFailure?: string | null;
  accessState?: IntegratedStoredImageAccessState;
}

function getUnavailableReason(
  consentGiven: boolean | null,
  wasPurged: boolean,
  accessState: IntegratedStoredImageAccessState
): 'renewal_required' | 'purged' | 'purge_pending' | 'missing' | 'no_consent' | 'unknown' {
  if (accessState === 'purge_pending') return 'purge_pending';
  if (accessState === 'no_session_consent') return 'no_consent';
  if (accessState === 'biometric_revoked') return 'renewal_required';
  if (accessState === 'agreement_unavailable' || accessState === 'invalid_path') return 'unknown';
  if (wasPurged) return 'purged';
  if (consentGiven === true) return 'missing';
  if (consentGiven === false) return 'no_consent';
  return 'unknown';
}

/** 통합 회차의 저장 동의와 실제 파기 표식을 분리해 드레이핑 잠금 원인을 고지한다. */
export function IntegratedImageStorageNotice({
  consentGiven,
  wasPurged,
  storageFailure = null,
  accessState = 'allowed',
}: IntegratedImageStorageNoticeProps): React.JSX.Element {
  const reason = getUnavailableReason(consentGiven, wasPurged, accessState);
  let customMessage: string | undefined;
  if (accessState === 'biometric_revoked') {
    customMessage = '생체정보 동의가 철회되어 저장 사진을 표시하지 않았어요.';
  } else if (storageFailure && accessState === 'allowed') {
    customMessage =
      '사진 저장에 실패했지만 분석은 완료됐어요. 이번 결과에서는 드레이핑 비교를 표시하지 않았어요.';
  }

  return (
    <ImageStorageUnavailableNotice
      analysisHref="/analysis/integrated"
      featureLabel="드레이핑 비교"
      reason={reason}
      testId="integrated-image-storage-notice"
    >
      {customMessage}
    </ImageStorageUnavailableNotice>
  );
}
