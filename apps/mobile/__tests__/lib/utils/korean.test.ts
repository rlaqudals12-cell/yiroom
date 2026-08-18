import {
  hasBatchim,
  objectParticle,
  subjectParticle,
  topicParticle,
  withSubjectParticle,
  withTopicParticle,
} from '../../../lib/utils/korean';

describe('한국어 조사 유틸', () => {
  it('마지막 한글 음절의 받침 유무를 판정한다', () => {
    expect(hasBatchim('신발')).toBe(true);
    expect(hasBatchim('상의')).toBe(false);
    expect(hasBatchim('')).toBe(false);
  });

  it('받침에 맞는 주격·보조사를 붙인다', () => {
    expect(subjectParticle('신발')).toBe('이');
    expect(subjectParticle('상의')).toBe('가');
    expect(topicParticle('신발')).toBe('은');
    expect(topicParticle('상의')).toBe('는');
    expect(withSubjectParticle('아우터, 신발')).toBe('아우터, 신발이');
    expect(withTopicParticle('상의')).toBe('상의는');
  });

  it('목적격 조사는 끝의 괄호·숫자를 건너뛰고 마지막 한글 음절을 본다', () => {
    expect(objectParticle('복합성 피부 (컨디션 72점)')).toBe('을');
    expect(objectParticle('AI 2026')).toBe('를');
  });
});
