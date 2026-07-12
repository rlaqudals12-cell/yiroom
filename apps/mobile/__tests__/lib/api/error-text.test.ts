/**
 * 에러 메시지 정규화 테스트
 *
 * @see lib/api/error-text.ts
 */

import { toUserMessage } from '@/lib/api/error-text';

describe('toUserMessage', () => {
  const FALLBACK = '문제가 발생했어요.';

  it('유효한 문자열은 그대로(트림) 반환', () => {
    expect(toUserMessage('만 14세 이상만 이용할 수 있어요.', FALLBACK)).toBe(
      '만 14세 이상만 이용할 수 있어요.'
    );
    expect(toUserMessage('  앞뒤 공백  ', FALLBACK)).toBe('앞뒤 공백');
  });

  it('객체는 fallback으로 대체 (근본 방어 — "[object Object]" 차단)', () => {
    expect(toUserMessage({ message: 'x' }, FALLBACK)).toBe(FALLBACK);
    expect(toUserMessage(['a', 'b'], FALLBACK)).toBe(FALLBACK);
  });

  it('문자열 "[object Object]" 자체도 fallback으로 대체', () => {
    expect(toUserMessage('[object Object]', FALLBACK)).toBe(FALLBACK);
  });

  it('빈 문자열·null·undefined·숫자는 fallback', () => {
    expect(toUserMessage('', FALLBACK)).toBe(FALLBACK);
    expect(toUserMessage('   ', FALLBACK)).toBe(FALLBACK);
    expect(toUserMessage(null, FALLBACK)).toBe(FALLBACK);
    expect(toUserMessage(undefined, FALLBACK)).toBe(FALLBACK);
    expect(toUserMessage(500, FALLBACK)).toBe(FALLBACK);
  });
});
