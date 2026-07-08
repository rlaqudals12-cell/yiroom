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

  it('매칭 실패/빈값은 안전하게 처리 (원본 반환 또는 빈 문자열)', () => {
    expect(seasonKo(null)).toBe('');
    expect(seasonKo(undefined)).toBe('');
    expect(undertoneKo('')).toBe('');
    // 알 수 없는 값은 원본 유지 (누수보다 낫고, 상위에서 폴백 처리)
    expect(seasonKo('unknown-season')).toBe('unknown-season');
    expect(faceShapeKo('triangle')).toBe('triangle');
  });
});
