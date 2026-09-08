import { describe, it, expect } from 'vitest';
import { detectQuestionCategory, isHiddenCoachContent } from '@/lib/coach/intent';
import fixtures from './consultation-fixture.json';

describe('§A 60문항 분류 회귀', () => {
  it.each(fixtures)('$question ($locale)', ({ question, locale }) => {
    const category = detectQuestionCategory(question);
    if (locale !== 'ko') expect(category).toBe('default');
    else expect(['skin', 'default']).toContain(category);
  });
  it.each([
    '내 피부 타입은 뭐야?',
    '광과민 약 먹는데 써도 돼?',
    '살리실산 매일 써도 돼?',
    '면도하고 따가워요',
  ])('피부 동의어를 우선한다: %s', (question) => {
    expect(detectQuestionCategory(question)).toBe('skin');
  });
  it.each([
    ['옷 추천해줘', 'fashion'],
    ['뭐 입을까요?', 'fashion'],
    ['단백질 식단은?', 'nutrition'],
    ['샴푸 추천해줘', 'hair'],
    ['립스틱 추천해줘', 'makeup'],
  ])('명시 토큰 %s', (question, category) => {
    expect(detectQuestionCategory(question)).toBe(category);
  });
  it('숨김 본문과 후속 질문을 서버에서 차단한다', () => {
    expect(isHiddenCoachContent('매일 운동 30분을 권장해요')).toBe(true);
    expect(isHiddenCoachContent('다이어트 간식 추천해줘')).toBe(true);
    expect(isHiddenCoachContent('보습 크림을 확인해주세요')).toBe(false);
  });
});
