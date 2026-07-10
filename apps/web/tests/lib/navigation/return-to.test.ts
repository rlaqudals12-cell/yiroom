/**
 * returnTo 체인 유틸리티 테스트
 * 오픈 리다이렉트 방지 검증 — 내부 경로만 허용
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  RETURN_TO_PARAM,
  isSafeInternalPath,
  sanitizeReturnTo,
  withReturnTo,
  currentDestination,
  readReturnToFromLocation,
} from '@/lib/navigation';

describe('isSafeInternalPath', () => {
  it('내부 경로를 허용한다', () => {
    expect(isSafeInternalPath('/')).toBe(true);
    expect(isSafeInternalPath('/home')).toBe(true);
    expect(isSafeInternalPath('/analysis/integrated?onboarding=1')).toBe(true);
    expect(isSafeInternalPath('/analysis/integrated?onboarding=1&a=b#hash')).toBe(true);
  });

  it('절대 URL을 거부한다 (오픈 리다이렉트 방지)', () => {
    expect(isSafeInternalPath('https://evil.com')).toBe(false);
    // eslint-disable-next-line sonarjs/no-clear-text-protocols -- 공격 벡터 거부 테스트용 문자열
    expect(isSafeInternalPath('http://evil.com/home')).toBe(false);
    // eslint-disable-next-line sonarjs/code-eval -- 공격 벡터 거부 테스트용 문자열 (실행 아님)
    expect(isSafeInternalPath('javascript:alert(1)')).toBe(false);
  });

  it('프로토콜 상대 URL(//host)을 거부한다', () => {
    expect(isSafeInternalPath('//evil.com')).toBe(false);
    expect(isSafeInternalPath('//evil.com/home')).toBe(false);
  });

  it('백슬래시 변형(/\\host)을 거부한다', () => {
    expect(isSafeInternalPath('/\\evil.com')).toBe(false);
    expect(isSafeInternalPath('/\\/evil.com')).toBe(false);
  });

  it('빈 값·null·undefined·상대 경로를 거부한다', () => {
    expect(isSafeInternalPath('')).toBe(false);
    expect(isSafeInternalPath(null)).toBe(false);
    expect(isSafeInternalPath(undefined)).toBe(false);
    expect(isSafeInternalPath('home')).toBe(false);
    expect(isSafeInternalPath('../home')).toBe(false);
  });
});

describe('sanitizeReturnTo', () => {
  it('유효한 내부 경로는 그대로 반환한다', () => {
    expect(sanitizeReturnTo('/analysis/integrated?onboarding=1')).toBe(
      '/analysis/integrated?onboarding=1'
    );
  });

  it('위험한 값은 null을 반환한다', () => {
    expect(sanitizeReturnTo('https://evil.com')).toBeNull();
    expect(sanitizeReturnTo('//evil.com')).toBeNull();
    expect(sanitizeReturnTo(null)).toBeNull();
    expect(sanitizeReturnTo('')).toBeNull();
  });
});

describe('withReturnTo', () => {
  it('유효한 목적지를 인코딩해 returnTo 쿼리로 붙인다', () => {
    expect(withReturnTo('/agreement', '/analysis/integrated?onboarding=1')).toBe(
      `/agreement?${RETURN_TO_PARAM}=${encodeURIComponent('/analysis/integrated?onboarding=1')}`
    );
  });

  it('위험한 목적지는 붙이지 않고 basePath만 반환한다', () => {
    expect(withReturnTo('/agreement', 'https://evil.com')).toBe('/agreement');
    expect(withReturnTo('/complete-profile', '//evil.com')).toBe('/complete-profile');
    expect(withReturnTo('/agreement', null)).toBe('/agreement');
  });
});

describe('currentDestination', () => {
  afterEach(() => {
    // jsdom location 원복
    window.history.replaceState({}, '', '/');
  });

  it('pathname과 window.location.search를 결합한다', () => {
    window.history.replaceState({}, '', '/analysis/integrated?onboarding=1');
    expect(currentDestination('/analysis/integrated')).toBe('/analysis/integrated?onboarding=1');
  });

  it('pathname이 null이면 "/"로 폴백한다', () => {
    window.history.replaceState({}, '', '/');
    expect(currentDestination(null)).toBe('/');
  });
});

describe('readReturnToFromLocation', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('유효한 returnTo 파라미터를 디코딩해 반환한다', () => {
    window.history.replaceState(
      {},
      '',
      `/agreement?${RETURN_TO_PARAM}=${encodeURIComponent('/analysis/integrated?onboarding=1')}`
    );
    expect(readReturnToFromLocation()).toBe('/analysis/integrated?onboarding=1');
  });

  it('returnTo가 없으면 null을 반환한다', () => {
    window.history.replaceState({}, '', '/agreement');
    expect(readReturnToFromLocation()).toBeNull();
  });

  it('외부 URL returnTo는 null을 반환한다 (오픈 리다이렉트 방지)', () => {
    window.history.replaceState(
      {},
      '',
      `/agreement?${RETURN_TO_PARAM}=${encodeURIComponent('https://evil.com')}`
    );
    expect(readReturnToFromLocation()).toBeNull();

    window.history.replaceState(
      {},
      '',
      `/agreement?${RETURN_TO_PARAM}=${encodeURIComponent('//evil.com')}`
    );
    expect(readReturnToFromLocation()).toBeNull();
  });
});
