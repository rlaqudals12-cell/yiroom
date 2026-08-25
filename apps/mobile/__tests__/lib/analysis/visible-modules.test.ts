import {
  VISIBLE_ANALYSIS_MODULES,
  isVisibleAnalysisModule,
  resolveVisibleAnalysisModule,
} from '../../../lib/analysis/visible-modules';

describe('visible analysis modules', () => {
  it('노출 허용 목록은 정체성 5축만 포함한다', () => {
    expect(VISIBLE_ANALYSIS_MODULES).toEqual(['personal-color', 'skin', 'body', 'hair', 'makeup']);
  });

  it.each(['posture', 'oral-health', 'unknown', undefined])(
    '숨김·미지원 값 %p은 지정한 기본 모듈로 폴백한다',
    (value) => {
      expect(isVisibleAnalysisModule(value)).toBe(false);
      expect(resolveVisibleAnalysisModule(value, 'skin')).toBe('skin');
    }
  );
});
