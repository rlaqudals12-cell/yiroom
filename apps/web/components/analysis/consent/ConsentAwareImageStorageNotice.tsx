'use client';

import { useEffect, useState } from 'react';

import { LATEST_CONSENT_VERSION } from '@/lib/consent/version-check';
import type { AnalysisType } from './types';
import {
  ImageStorageUnavailableNotice,
  type ImageStorageUnavailableReason,
} from './ImageStorageUnavailableNotice';

interface ConsentRecord {
  consent_given?: unknown;
  consent_version?: unknown;
  retention_until?: unknown;
  withdrawal_at?: unknown;
  cleanup_reconciled_at?: unknown;
}

interface ConsentResponse {
  consent?: ConsentRecord | null;
  data?: { consent?: ConsentRecord | null };
}

interface ConsentAwareImageStorageNoticeProps {
  analysisHref: string;
  analysisLinkLabel?: string;
  analysisType: AnalysisType;
  consentRequiredMessage?: string;
  enabled?: boolean;
  featureLabel: string;
  storageChoiceSupported?: boolean;
  testId?: string;
}

export function resolveImageStorageUnavailableReason(
  consent: ConsentRecord | null,
  now = new Date()
): ImageStorageUnavailableReason {
  if (!consent) return 'no_consent';

  // 철회 표식과 기존 보관 기한이 함께 남아 있으면 파기 재시도가 필요한 중간 상태다.
  const wasWithdrawn =
    consent.consent_given !== true &&
    typeof consent.withdrawal_at === 'string' &&
    consent.withdrawal_at.trim().length > 0;

  if (
    wasWithdrawn &&
    typeof consent.retention_until === 'string' &&
    consent.retention_until.trim().length > 0
  ) {
    return 'purge_pending';
  }

  if (wasWithdrawn && consent.cleanup_reconciled_at == null) {
    return 'reconciliation_pending';
  }

  // 거부 기록을 만료로 오인하면 이미 저장됐던 사진이 파기된 것처럼 읽힌다.
  if (consent.consent_given !== true) return 'no_consent';

  const retentionUntil =
    typeof consent.retention_until === 'string' ? new Date(consent.retention_until) : null;
  if (retentionUntil && !Number.isNaN(retentionUntil.getTime()) && retentionUntil <= now) {
    return 'expired';
  }

  if (
    consent.consent_version !== LATEST_CONSENT_VERSION ||
    !retentionUntil ||
    Number.isNaN(retentionUntil.getTime())
  ) {
    return 'renewal_required';
  }

  return 'missing';
}

function readConsent(payload: ConsentResponse): ConsentRecord | null | undefined {
  if (Object.prototype.hasOwnProperty.call(payload, 'consent')) return payload.consent;
  if (payload.data && Object.prototype.hasOwnProperty.call(payload.data, 'consent')) {
    return payload.data.consent;
  }
  return undefined;
}

/**
 * 체형은 새 저장 선택을 받지 않지만, 구형 저장분의 파기 중간 상태까지 숨기면 안 된다.
 * 조회 실패는 pending 부재로 추정하지 않고 unknown으로 별도 처리한다.
 */
export function applyStorageChoiceSupport(
  reason: ImageStorageUnavailableReason,
  storageChoiceSupported: boolean
): ImageStorageUnavailableReason {
  if (storageChoiceSupported) return reason;
  if (
    reason === 'purge_pending' ||
    reason === 'reconciliation_pending' ||
    reason === 'loading' ||
    reason === 'unknown'
  ) {
    return reason;
  }
  return 'unsupported';
}

export function useImageStorageUnavailableReason({
  analysisType,
  enabled = true,
  storageChoiceSupported = true,
}: {
  analysisType: AnalysisType;
  enabled?: boolean;
  storageChoiceSupported?: boolean;
}): ImageStorageUnavailableReason {
  const stateKey = `${analysisType}:${storageChoiceSupported ? 'supported' : 'legacy'}`;
  // 미지원 축도 기존 파기 대기 행을 확인해야 하므로 조회 전에는 loading으로 둔다.
  const initialReason: ImageStorageUnavailableReason = 'loading';
  const [state, setState] = useState<{
    key: string;
    reason: ImageStorageUnavailableReason;
  }>({ key: stateKey, reason: initialReason });

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    setState({ key: stateKey, reason: 'loading' });

    void (async () => {
      try {
        const response = await fetch(`/api/consent?analysisType=${analysisType}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setState({ key: stateKey, reason: 'unknown' });
          return;
        }

        const payload = (await response.json()) as ConsentResponse;
        const consent = readConsent(payload);
        if (consent === undefined) {
          setState({ key: stateKey, reason: 'unknown' });
          return;
        }
        const resolved = resolveImageStorageUnavailableReason(consent);
        setState({
          key: stateKey,
          reason: applyStorageChoiceSupport(resolved, storageChoiceSupported),
        });
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // 조회 실패를 미동의로 판정하지 않는다.
        setState({ key: stateKey, reason: 'unknown' });
      }
    })();

    return () => controller.abort();
  }, [analysisType, enabled, stateKey, storageChoiceSupported]);

  // 탭 전환 렌더에서 이전 축의 사유가 effect보다 먼저 노출되지 않게 현재 키로 검증한다.
  return state.key === stateKey ? state.reason : initialReason;
}

export function ConsentAwareImageStorageNotice({
  analysisHref,
  analysisLinkLabel,
  analysisType,
  consentRequiredMessage,
  enabled = true,
  featureLabel,
  storageChoiceSupported = true,
  testId,
}: ConsentAwareImageStorageNoticeProps): React.JSX.Element | null {
  const reason = useImageStorageUnavailableReason({
    analysisType,
    enabled,
    storageChoiceSupported,
  });

  if (!enabled) return null;

  return (
    <ImageStorageUnavailableNotice
      analysisHref={storageChoiceSupported ? analysisHref : undefined}
      analysisLinkLabel={analysisLinkLabel}
      consentRequiredMessage={consentRequiredMessage}
      featureLabel={featureLabel}
      reason={reason}
      testId={testId}
    />
  );
}
