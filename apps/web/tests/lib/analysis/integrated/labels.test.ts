/**
 * 소비자 눈높이 라벨 헬퍼 테스트
 *
 * @see lib/analysis/integrated/labels.ts
 */

import { describe, it, expect } from 'vitest';
import {
  seasonKo,
  seasonShortKo,
  undertoneKo,
  skinTypeKo,
  faceShapeKo,
  bodyDescKo,
  toneKo,
  finishKo,
  coverageKo,
} from '@/lib/analysis/integrated/labels';

describe('integrated/labels', () => {
  it('seasonKo: 원시 영문 시즌 → 한국어 (대소문자 무관)', () => {
    expect(seasonKo('spring')).toBe('봄 웜톤');
    expect(seasonKo('Summer')).toBe('여름 쿨톤');
    expect(seasonKo('AUTUMN')).toBe('가을 웜톤');
    expect(seasonKo('winter')).toBe('겨울 쿨톤');
  });

  it('undertoneKo: warm/cool/neutral → 한국어', () => {
    expect(undertoneKo('warm')).toBe('웜톤');
    expect(undertoneKo('Cool')).toBe('쿨톤');
    expect(undertoneKo('neutral')).toBe('뉴트럴');
  });

  it('skinTypeKo: 영문 피부타입 → 한국어', () => {
    expect(skinTypeKo('combination')).toBe('복합성');
    expect(skinTypeKo('OILY')).toBe('지성');
  });

  it('faceShapeKo: 영문 얼굴형 → 한국어(형 포함)', () => {
    expect(faceShapeKo('oval')).toBe('계란형');
    expect(faceShapeKo('heart')).toBe('하트형');
  });

  it('seasonShortKo: 계절만 짧게', () => {
    expect(seasonShortKo('autumn')).toBe('가을');
  });

  it('bodyDescKo: 골격 라벨 → 풀이 병기', () => {
    expect(bodyDescKo('웨이브')).toBe('곡선이 부드러운 웨이브');
  });

  it('toneKo: 12톤 원시값 → PC 결과 페이지와 동일한 한국어 정본 (true-spring이 아니라 트루 스프링)', () => {
    expect(toneKo('true-spring')).toBe('트루 스프링');
    expect(toneKo('light-spring')).toBe('라이트 스프링');
    expect(toneKo('True-Summer')).toBe('트루 서머'); // 대소문자 무관
    // 원시 영문값이 그대로 새어나오지 않는다
    expect(toneKo('true-spring')).not.toMatch(/spring/i);
  });

  it('finishKo: 메이크업 피니시 원시값 → 한국어', () => {
    expect(finishKo('semi-matte')).toBe('세미매트');
    expect(finishKo('dewy')).toBe('듀이');
    expect(finishKo('matte')).toBe('매트');
    expect(finishKo('satin')).toBe('사틴');
  });

  it('coverageKo: 커버력 원시값 → 한국어', () => {
    expect(coverageKo('medium')).toBe('미디엄');
    expect(coverageKo('light')).toBe('라이트');
    expect(coverageKo('full')).toBe('풀');
  });

  it('매칭 실패/빈값은 안전하게 처리 (원본 반환 또는 빈 문자열)', () => {
    expect(seasonKo(null)).toBe('');
    expect(seasonKo(undefined)).toBe('');
    expect(undertoneKo('')).toBe('');
    // 알 수 없는 값은 원본 유지 (누수보다 낫고, 상위에서 폴백 처리)
    expect(seasonKo('unknown-season')).toBe('unknown-season');
    expect(faceShapeKo('triangle')).toBe('triangle');
  });
});
