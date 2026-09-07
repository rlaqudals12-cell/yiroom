import { getClerkErrorKey } from '../../lib/i18n';

jest.mock('@/lib/i18n', () => jest.requireActual('@/lib/i18n'));

describe('getClerkErrorKey', () => {
  const fallback = 'auth.mobileSignIn.signInFailure';

  it.each([
    ['form_password_incorrect', 'auth.mobileClerkErrors.passwordIncorrect'],
    ['form_identifier_not_found', 'auth.mobileClerkErrors.identifierNotFound'],
    ['form_identifier_exists', 'auth.mobileClerkErrors.identifierExists'],
    ['form_param_format_invalid', 'auth.mobileClerkErrors.invalidInput'],
    ['form_code_incorrect', 'auth.mobileClerkErrors.codeIncorrect'],
    ['form_password_or_identifier_incorrect', 'auth.mobileClerkErrors.credentialsIncorrect'],
    ['form_password_pwned', 'auth.mobileClerkErrors.passwordUnsafe'],
    ['form_password_length_too_short', 'auth.mobileSignUp.passwordTooShort'],
    ['too_many_requests', 'auth.mobileClerkErrors.tooManyRequests'],
    ['signup_rate_limit_exceeded', 'auth.mobileClerkErrors.tooManyRequests'],
  ])('%s 코드를 번역 키로 변환한다', (code, key) => {
    expect(getClerkErrorKey({ errors: [{ code, message: 'Raw server message' }] }, fallback)).toBe(
      key
    );
  });

  it.each([
    null,
    undefined,
    'Raw error',
    42,
    {},
    new Error('Raw error'),
    { errors: null },
    { errors: {} },
    { errors: [] },
    { errors: [null] },
    { errors: ['Raw error'] },
    { errors: [{ message: 'Raw error' }] },
    { errors: [{ code: 42 }] },
    { errors: [{ code: 'unknown_code' }] },
    { errors: [{ code: '__proto__' }] },
    { errors: [{ code: 'constructor' }] },
    { errors: [{ code: 'toString' }] },
  ])('알 수 없는 오류는 화면의 일반 키로 폴백한다: %p', (error) => {
    expect(getClerkErrorKey(error, fallback)).toBe(fallback);
  });

  it('첫 번째 오류만 선택하고 뒤의 원문으로 폴백하지 않는다', () => {
    expect(
      getClerkErrorKey({ errors: [{ code: 'unknown' }, { code: 'form_code_incorrect' }] }, fallback)
    ).toBe(fallback);
  });
});
