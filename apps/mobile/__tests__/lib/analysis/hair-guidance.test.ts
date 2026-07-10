/**
 * H-1 헤어 두피 주의 성분 + 고민 안내 회귀 방지 테스트
 *
 * 대상: lib/analysis/hair-guidance.ts (웹 lib/mock/hair-analysis.ts 포팅)
 */
import {
  getHairCautionIngredients,
  getScalpConcernNotice,
} from '../../../lib/analysis/hair-guidance';

describe('getHairCautionIngredients', () => {
  it('두피 타입별로 주의 성분을 반환한다', () => {
    (['dry', 'oily', 'normal', 'sensitive'] as const).forEach((scalp) => {
      const result = getHairCautionIngredients(scalp);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  it('두피 타입 미상이면 공통 주의 성분을 반환한다', () => {
    const result = getHairCautionIngredients(undefined);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getScalpConcernNotice', () => {
  it('탈모·비듬 등 의료 상담 필요 고민이면 안내 문구를 반환한다', () => {
    const notice = getScalpConcernNotice(['탈모 경향']);
    expect(notice).not.toBeNull();
    // 진단이 아닌 "전문의 상담 권유"만 (경계 준수)
    expect(notice).toContain('전문의');
    expect(notice).toContain('진단이 아니에요');
  });

  it('비듬 키워드도 안내 대상이다', () => {
    expect(getScalpConcernNotice(['심한 비듬'])).not.toBeNull();
  });

  it('일반 고민(건조·끝갈라짐)은 안내하지 않는다 (진단 아님)', () => {
    expect(getScalpConcernNotice(['모발 건조', '끝 갈라짐'])).toBeNull();
  });

  it('고민이 없으면 null', () => {
    expect(getScalpConcernNotice([])).toBeNull();
  });
});
