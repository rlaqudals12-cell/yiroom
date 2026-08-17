/**
 * 한국어 조사 유틸 테스트
 *
 * 배경: 안내 문구가 조사를 하드코딩해 "상의은 1벌뿐이에요" 같은 비문이 나갔다.
 * 받침 판정은 한 곳에서만 하고, 각 문구는 이 유틸을 통해 조사를 고른다.
 */
import { describe, it, expect } from 'vitest';
import {
  hasBatchim,
  subjectParticle,
  topicParticle,
  withSubjectParticle,
  withTopicParticle,
} from '@/lib/utils/korean';

describe('hasBatchim', () => {
  it('받침 있는 한글은 true', () => {
    expect(hasBatchim('신발')).toBe(true);
    expect(hasBatchim('상학')).toBe(true);
  });

  it('받침 없는 한글은 false', () => {
    expect(hasBatchim('상의')).toBe(false);
    expect(hasBatchim('아우터')).toBe(false);
  });

  it('한글이 아닌 끝문자·빈 문자열은 false (기본 조사로 폴백)', () => {
    expect(hasBatchim('ZARA')).toBe(false);
    expect(hasBatchim('')).toBe(false);
  });
});

describe('조사 선택', () => {
  it('주격 조사는 받침에 따라 이/가', () => {
    expect(subjectParticle('신발')).toBe('이');
    expect(subjectParticle('상의')).toBe('가');
  });

  it('보조사는 받침에 따라 은/는', () => {
    expect(topicParticle('신발')).toBe('은');
    expect(topicParticle('상의')).toBe('는');
  });

  it('단어에 조사를 붙여 반환한다', () => {
    expect(withSubjectParticle('신발')).toBe('신발이');
    expect(withSubjectParticle('상의')).toBe('상의가');
    expect(withTopicParticle('신발')).toBe('신발은');
    expect(withTopicParticle('상의')).toBe('상의는');
  });

  it('쉼표로 이어붙인 목록은 마지막 이름의 받침을 따른다', () => {
    expect(withSubjectParticle('아우터, 신발')).toBe('아우터, 신발이');
    expect(withTopicParticle('신발, 상의')).toBe('신발, 상의는');
  });
});
