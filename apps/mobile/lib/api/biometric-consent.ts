/** 생체정보 동의 철회 HTTP 클라이언트 (웹 API가 파기 정본). */
import { getApiBaseUrl } from './base-url';
import { toUserMessage } from './error-text';

export interface BiometricWithdrawalResult {
  consentRevoked: true;
  imagesDeleted: number;
  /** 정리된 DB 대상 단계 수이며 삭제 행 수는 아니다. */
  databaseTargetsCleared: number;
  fullyPurged: true;
}

export interface PartialBiometricWithdrawalResult {
  consentRevoked: boolean;
  imagesDeleted: number;
  databaseTargetsCleared: number;
  fullyPurged: false;
}

export class BiometricConsentApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;
  public readonly partialResult: PartialBiometricWithdrawalResult | undefined;

  constructor(
    message: string,
    status: number,
    code?: string,
    partialResult?: PartialBiometricWithdrawalResult
  ) {
    super(message);
    this.name = 'BiometricConsentApiError';
    this.status = status;
    this.code = code;
    this.partialResult = partialResult;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parsePartialResult(value: unknown): PartialBiometricWithdrawalResult | undefined {
  if (!isRecord(value)) return undefined;
  if (
    typeof value.consentRevoked !== 'boolean' ||
    typeof value.imagesDeleted !== 'number' ||
    typeof value.databaseTargetsCleared !== 'number' ||
    value.fullyPurged !== false
  ) {
    return undefined;
  }
  return {
    consentRevoked: value.consentRevoked,
    imagesDeleted: value.imagesDeleted,
    databaseTargetsCleared: value.databaseTargetsCleared,
    fullyPurged: false,
  };
}

function parseSuccessResult(value: unknown): BiometricWithdrawalResult | undefined {
  if (!isRecord(value)) return undefined;
  if (
    value.consentRevoked !== true ||
    typeof value.imagesDeleted !== 'number' ||
    typeof value.databaseTargetsCleared !== 'number' ||
    value.fullyPurged !== true
  ) {
    return undefined;
  }
  return {
    consentRevoked: true,
    imagesDeleted: value.imagesDeleted,
    databaseTargetsCleared: value.databaseTargetsCleared,
    fullyPurged: true,
  };
}

/**
 * 글로벌 생체 수집 동의를 철회하고 서버에 선택 저장된 분석 이미지를 파기한다.
 * 부분 실패 응답은 `partialResult`가 있는 Error로 던져 UI가 성공으로 오인하지 않게 한다.
 */
export async function revokeBiometricConsent(
  clerkToken: string,
  baseUrl?: string
): Promise<BiometricWithdrawalResult> {
  const url = getApiBaseUrl(baseUrl);
  let response: Response;
  try {
    response = await fetch(`${url}/api/agreement/biometric`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify({ confirm: true }),
    });
  } catch {
    throw new BiometricConsentApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = undefined;
  }

  if (response.ok && isRecord(json) && json.success === true) {
    const result = parseSuccessResult(json.data);
    if (result) return result;
  }

  const error = isRecord(json) && isRecord(json.error) ? json.error : undefined;
  const partialResult = parsePartialResult(error?.details);
  throw new BiometricConsentApiError(
    toUserMessage(error?.userMessage, '생체정보 동의 철회를 완료하지 못했어요.'),
    response.status,
    typeof error?.code === 'string' ? error.code : undefined,
    partialResult
  );
}
