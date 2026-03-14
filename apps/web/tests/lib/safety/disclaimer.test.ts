import { describe, it, expect } from 'vitest';
import { getDisclaimer, DISCLAIMER_GLOBAL } from '@/lib/safety/disclaimer';

describe('getDisclaimer', () => {
  describe('정상 케이스', () => {
    it('Level 0 (경고 없음)일 때 글로벌 면책 문구를 반환한다', () => {
      const result = getDisclaimer(0);
      expect(result).toBe(DISCLAIMER_GLOBAL);
      expect(result).toContain('참고용');
    });

    it('Level 1 (알레르겐 교차반응)일 때 BLOCK 면책 문구를 반환한다', () => {
      const result = getDisclaimer(1);
      expect(result).toContain('알레르기 교차반응 위험');
      expect(result).toContain('알레르기 전문의');
      // 글로벌 면책 문구도 포함
      expect(result).toContain('참고용');
    });

    it('Level 2 (금기사항)일 때 WARN 면책 문구를 반환한다', () => {
      const result = getDisclaimer(2);
      expect(result).toContain('주의가 필요한 성분');
      expect(result).toContain('피부과 전문의 또는 약사');
      expect(result).toContain('참고용');
    });

    it('Level 3 (EWG 일반 안전성)일 때 INFORM 면책 문구를 반환한다', () => {
      const result = getDisclaimer(3);
      expect(result).toContain('참고 정보를 제공');
      expect(result).toContain('참고용');
    });
  });

  describe('면책 문구 계층 구조', () => {
    it('Level 1이 가장 강력한 경고를 포함한다', () => {
      const l1 = getDisclaimer(1);
      expect(l1).toContain('강력히 권장');
    });

    it('Level 2는 상담 권장을 포함한다', () => {
      const l2 = getDisclaimer(2);
      expect(l2).toContain('상담해주세요');
    });

    it('Level 3은 정보 제공만 한다', () => {
      const l3 = getDisclaimer(3);
      expect(l3).toContain('ℹ️');
      expect(l3).not.toContain('강력히');
    });
  });

  describe('각 레벨이 서로 다른 문구를 반환한다', () => {
    it('모든 레벨의 결과가 서로 다르다', () => {
      const results = [0, 1, 2, 3].map((l) => getDisclaimer(l as 0 | 1 | 2 | 3));
      const unique = new Set(results);
      expect(unique.size).toBe(4);
    });
  });
});

describe('DISCLAIMER_GLOBAL', () => {
  it('참고용 안내 문구를 포함한다', () => {
    expect(DISCLAIMER_GLOBAL).toContain('참고용');
    expect(DISCLAIMER_GLOBAL).toContain('의학적 진단이나 치료를 대체하지 않');
  });

  it('전문가 상담 안내를 포함한다', () => {
    expect(DISCLAIMER_GLOBAL).toContain('전문가와 상담');
  });
});
