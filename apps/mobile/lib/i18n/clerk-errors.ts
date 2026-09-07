import { authLogger } from '@/lib/utils/logger';

const CLERK_ERROR_KEYS: Readonly<Record<string, string>> = {
  form_password_incorrect: 'auth.mobileClerkErrors.passwordIncorrect',
  // 열거 방지 인스턴스의 로그인 실패 정본 코드 — 이메일/비밀번호 어느 쪽인지 서버가 알려주지 않는다
  form_password_or_identifier_incorrect: 'auth.mobileClerkErrors.credentialsIncorrect',
  form_identifier_not_found: 'auth.mobileClerkErrors.identifierNotFound',
  form_identifier_exists: 'auth.mobileClerkErrors.identifierExists',
  form_param_format_invalid: 'auth.mobileClerkErrors.invalidInput',
  form_code_incorrect: 'auth.mobileClerkErrors.codeIncorrect',
  form_password_pwned: 'auth.mobileClerkErrors.passwordUnsafe',
  form_password_length_too_short: 'auth.mobileSignUp.passwordTooShort',
  too_many_requests: 'auth.mobileClerkErrors.tooManyRequests',
  signup_rate_limit_exceeded: 'auth.mobileClerkErrors.tooManyRequests',
};

/** Clerk 원문은 언어·민감 정보를 보장하지 않으므로 알려진 코드만 번역 키로 변환한다. */
export function getClerkErrorKey(error: unknown, fallbackKey: string): string {
  if (!error || typeof error !== 'object') return fallbackKey;
  // ClerkRuntimeError(네트워크 등)는 errors 배열 없이 최상위 code만 갖는다 — 원인을 버리지 않는다
  if (!('errors' in error)) {
    const runtimeCode = 'code' in error ? error.code : undefined;
    if (runtimeCode === 'network_error') return 'auth.mobileAgeVerification.networkError';
    logUnknownClerkError(runtimeCode, fallbackKey);
    return fallbackKey;
  }
  if (!Array.isArray(error.errors)) return fallbackKey;

  const firstError: unknown = error.errors[0];
  if (!firstError || typeof firstError !== 'object' || !('code' in firstError)) {
    return fallbackKey;
  }
  const { code } = firstError;
  // 외부 코드가 Object.prototype의 이름과 같아도 번역 키로 취급하지 않는다.
  if (typeof code === 'string' && Object.prototype.hasOwnProperty.call(CLERK_ERROR_KEYS, code)) {
    return CLERK_ERROR_KEYS[code];
  }
  logUnknownClerkError(code, fallbackKey);
  return fallbackKey;
}

/** 일반 문구로 뭉개지는 미지 코드는 개발 빌드에서 반드시 드러낸다 — 매핑 누락을 조용히 삼키지 않기 위해. */
function logUnknownClerkError(code: unknown, fallbackKey: string): void {
  if (!__DEV__) return;
  authLogger.warn('매핑되지 않은 Clerk 오류 코드 — 일반 문구로 폴백', { code, fallbackKey });
}
