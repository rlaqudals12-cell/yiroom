import { describe, it, expect } from 'vitest';
import {
  filterCoachResponse,
  checkIngredientSafety,
  needsDisclaimer,
  COACH_DISCLAIMER,
} from '@/lib/coach/hallucination-filter';

describe('filterCoachResponse', () => {
  describe('정상 케이스', () => {
    it('안전한 텍스트는 isClean=true를 반환한다', () => {
      const result = filterCoachResponse('수분 크림을 꾸준히 사용해 보세요.');
      expect(result.isClean).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.sanitizedText).toBe('수분 크림을 꾸준히 사용해 보세요.');
    });
  });

  describe('의료 주장 감지', () => {
    it('"치료합니다"를 감지한다', () => {
      const result = filterCoachResponse('이 성분이 피부를 치료합니다.');
      expect(result.isClean).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({ type: 'medical_claim', matched: '치료합니다' })
      );
    });

    it('"완치해요"를 감지한다', () => {
      const result = filterCoachResponse('이 방법으로 완치해요.');
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.type === 'medical_claim')).toBe(true);
    });

    it('"처방합니다"를 감지한다', () => {
      const result = filterCoachResponse('이 제품을 처방합니다.');
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.type === 'medical_claim')).toBe(true);
    });

    it('"진단해"를 감지한다', () => {
      const result = filterCoachResponse('피부 상태를 진단해 보면요.');
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.type === 'medical_claim')).toBe(true);
    });

    it('"병원 갈 필요 없"을 감지한다', () => {
      const result = filterCoachResponse('병원에 갈 필요 없어요.');
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.type === 'medical_claim')).toBe(true);
    });

    it('"의사 필요 없"을 감지한다', () => {
      const result = filterCoachResponse('의사가 필요 없어요.');
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.type === 'medical_claim')).toBe(true);
    });

    it('"약 대신"을 감지한다', () => {
      const result = filterCoachResponse('약 대신 이 크림을 써보세요.');
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.type === 'medical_claim')).toBe(true);
    });

    it('의료 주장의 severity는 high이다', () => {
      const result = filterCoachResponse('이 성분이 피부를 치료합니다.');
      const medicalViolation = result.violations.find((v) => v.type === 'medical_claim');
      expect(medicalViolation?.severity).toBe('high');
    });
  });

  describe('절대적 효과 보장 감지', () => {
    it('"100% 효과"를 감지한다', () => {
      const result = filterCoachResponse('이 제품은 100% 효과가 있어요.');
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.type === 'absolute_promise')).toBe(true);
    });

    it('"반드시 효과"를 감지한다', () => {
      const result = filterCoachResponse('반드시 효과가 있을 거예요.');
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.type === 'absolute_promise')).toBe(true);
    });

    it('"무조건 효과"를 감지한다', () => {
      const result = filterCoachResponse('무조건 효과가 있어요.');
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.type === 'absolute_promise')).toBe(true);
    });

    it('"보장합니다"를 감지한다', () => {
      const result = filterCoachResponse('효과를 보장합니다.');
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.type === 'absolute_promise')).toBe(true);
    });

    it('절대적 효과 보장의 severity는 medium이다', () => {
      const result = filterCoachResponse('무조건 효과가 있어요.');
      const violation = result.violations.find((v) => v.type === 'absolute_promise');
      expect(violation?.severity).toBe('medium');
    });
  });

  describe('가격 주장 감지', () => {
    it('"현재 할인"을 감지한다', () => {
      const result = filterCoachResponse('현재 할인 중이에요.');
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.type === 'price_claim')).toBe(true);
    });

    it('"지금 세일"을 감지한다', () => {
      const result = filterCoachResponse('지금 세일하고 있어요.');
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.type === 'price_claim')).toBe(true);
    });

    it('"30% 할인"을 감지한다', () => {
      const result = filterCoachResponse('30% 할인된 가격이에요.');
      expect(result.isClean).toBe(false);
      expect(result.violations.some((v) => v.type === 'price_claim')).toBe(true);
    });
  });

  describe('텍스트 정화 (sanitization)', () => {
    it('의료 주장을 전문가 상담 문구로 대체한다', () => {
      const result = filterCoachResponse('이 성분이 피부를 치료합니다.');
      expect(result.sanitizedText).toContain('(전문가 상담을 권장드려요)');
      expect(result.sanitizedText).not.toContain('치료합니다');
    });

    it('절대적 효과 보장을 완화된 표현으로 대체한다', () => {
      const result = filterCoachResponse('무조건 효과가 있어요.');
      expect(result.sanitizedText).toContain('도움이 될 수 있어요');
      expect(result.sanitizedText).not.toContain('무조건 효과');
    });

    it('가격 주장을 변동 안내로 대체한다', () => {
      const result = filterCoachResponse('현재 할인 중이에요.');
      expect(result.sanitizedText).toContain('(가격은 변동될 수 있어요)');
      expect(result.sanitizedText).not.toContain('현재 할인');
    });
  });

  describe('복합 위반 감지', () => {
    it('여러 유형의 위반을 동시에 감지한다', () => {
      const text = '이 제품은 피부를 치료합니다. 100% 효과가 있고 현재 할인 중이에요.';
      const result = filterCoachResponse(text);

      expect(result.isClean).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(3);

      const types = result.violations.map((v) => v.type);
      expect(types).toContain('medical_claim');
      expect(types).toContain('absolute_promise');
      expect(types).toContain('price_claim');
    });
  });
});

describe('checkIngredientSafety', () => {
  describe('안전한 조합', () => {
    it('안전한 성분 조합은 경고를 반환하지 않는다', () => {
      const warnings = checkIngredientSafety(['히알루론산', '세라마이드', '판테놀']);
      expect(warnings).toHaveLength(0);
    });

    it('빈 배열은 경고를 반환하지 않는다', () => {
      const warnings = checkIngredientSafety([]);
      expect(warnings).toHaveLength(0);
    });

    it('단일 성분은 경고를 반환하지 않는다', () => {
      const warnings = checkIngredientSafety(['레티놀']);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('위험한 조합 감지', () => {
    it('레티놀+AHA 조합을 경고한다', () => {
      const warnings = checkIngredientSafety(['레티놀', 'AHA']);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('레티놀');
      expect(warnings[0]).toContain('AHA');
    });

    it('레티놀+BHA 조합을 경고한다', () => {
      const warnings = checkIngredientSafety(['레티놀', 'BHA']);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('레티놀');
      expect(warnings[0]).toContain('BHA');
    });

    it('레티놀+비타민C 조합을 경고한다', () => {
      const warnings = checkIngredientSafety(['레티놀', '비타민C']);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('레티놀');
      expect(warnings[0]).toContain('비타민C');
    });

    it('나이아신아마이드+AHA 조합을 경고한다', () => {
      const warnings = checkIngredientSafety(['나이아신아마이드', 'AHA']);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('나이아신아마이드');
      expect(warnings[0]).toContain('AHA');
    });
  });

  describe('대소문자 무시', () => {
    it('대소문자와 관계없이 조합을 감지한다', () => {
      const warnings = checkIngredientSafety(['레티놀', 'aha']);
      expect(warnings).toHaveLength(1);
    });

    it('대문자 BHA도 감지한다', () => {
      const warnings = checkIngredientSafety(['레티놀', 'bha']);
      expect(warnings).toHaveLength(1);
    });
  });

  describe('복수 경고', () => {
    it('여러 위험한 조합이 있으면 모두 경고한다', () => {
      const warnings = checkIngredientSafety(['레티놀', 'AHA', 'BHA', '비타민C']);
      // 레티놀+AHA, 레티놀+BHA, 레티놀+비타민C = 3개 경고
      expect(warnings).toHaveLength(3);
    });
  });
});

describe('needsDisclaimer', () => {
  describe('면책 조항 불필요', () => {
    it('일반 뷰티 텍스트에는 false를 반환한다', () => {
      expect(needsDisclaimer('수분 크림을 꾸준히 사용해 보세요.')).toBe(false);
    });

    it('빈 텍스트에는 false를 반환한다', () => {
      expect(needsDisclaimer('')).toBe(false);
    });
  });

  describe('면책 조항 필요', () => {
    const triggerWords = [
      '약',
      '영양제',
      '보충제',
      '알레르기',
      '아토피',
      '습진',
      '피부염',
      '여드름 약',
      '처방',
      '클리닉',
    ];

    triggerWords.forEach((trigger) => {
      it(`"${trigger}" 포함 시 true를 반환한다`, () => {
        expect(needsDisclaimer(`이것은 ${trigger}에 대한 이야기입니다.`)).toBe(true);
      });
    });
  });
});

describe('COACH_DISCLAIMER', () => {
  it('비어 있지 않은 문자열이다', () => {
    expect(typeof COACH_DISCLAIMER).toBe('string');
    expect(COACH_DISCLAIMER.length).toBeGreaterThan(0);
  });
});
