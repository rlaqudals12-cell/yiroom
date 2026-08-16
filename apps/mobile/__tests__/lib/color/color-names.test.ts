/**
 * getKoreanColorName 테스트
 *
 * 드레이핑 색 라벨(#hex → 색명)의 근거 유틸.
 * 웹 `apps/web/lib/utils/color-names.ts`와 동일 경계값이어야 웹·앱 라벨이 일치한다.
 */

import { getKoreanColorName } from '../../../lib/utils/color-names';

describe('getKoreanColorName', () => {
  describe('무채색', () => {
    it('검정은 차콜로 표기해야 한다', () => {
      expect(getKoreanColorName('#000000')).toBe('차콜');
    });

    it('흰색은 화이트로 표기해야 한다', () => {
      expect(getKoreanColorName('#FFFFFF')).toBe('화이트');
    });

    it('중간 회색은 그레이로 표기해야 한다', () => {
      expect(getKoreanColorName('#808080')).toBe('그레이');
    });

    it('밝은 회색은 라이트 그레이로 표기해야 한다', () => {
      expect(getKoreanColorName('#CCCCCC')).toBe('라이트 그레이');
    });
  });

  describe('유채색 — 색상(Hue) 매핑', () => {
    // 경계값은 웹 getKoreanColorName과 1:1 (h=240·300이 다음 구간으로 넘어가는 quirk까지 동일)
    it.each([
      ['#FF0000', '레드'],
      ['#FF7A33', '코랄'],
      ['#00A000', '딥 그린'],
      ['#3AA0FF', '블루'],
      ['#800080', '딥 핑크'],
    ])('%s → %s', (hex, expected) => {
      expect(getKoreanColorName(hex)).toBe(expected);
    });

    it('밝은 색에는 라이트 접두사가 붙어야 한다', () => {
      expect(getKoreanColorName('#FFDAA3')).toBe('라이트 오렌지');
    });

    it('어두운 색에는 딥 접두사가 붙어야 한다', () => {
      expect(getKoreanColorName('#4B0082')).toBe('딥 바이올렛');
    });
  });

  describe('입력 형식', () => {
    it('# 없는 hex도 처리해야 한다', () => {
      expect(getKoreanColorName('FF0000')).toBe('레드');
    });

    it('3자리 축약 hex를 6자리로 확장해야 한다', () => {
      expect(getKoreanColorName('#F00')).toBe(getKoreanColorName('#FF0000'));
    });

    it('잘못된 문자열은 예외 없이 무채색으로 폴백해야 한다', () => {
      expect(getKoreanColorName('#ZZZZZZ')).toBe('차콜');
    });
  });
});
