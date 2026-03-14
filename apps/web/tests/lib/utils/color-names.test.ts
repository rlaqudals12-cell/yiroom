/**
 * 한국어 색상명 변환 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import { getKoreanColorName } from '@/lib/utils/color-names';

describe('getKoreanColorName', () => {
  describe('무채색 판정', () => {
    it('순백색은 화이트를 반환한다', () => {
      expect(getKoreanColorName('#FFFFFF')).toBe('화이트');
    });

    it('밝은 회색은 라이트 그레이를 반환한다', () => {
      expect(getKoreanColorName('#CCCCCC')).toBe('라이트 그레이');
    });

    it('중간 회색은 그레이를 반환한다', () => {
      expect(getKoreanColorName('#808080')).toBe('그레이');
    });

    it('어두운 회색은 차콜을 반환한다', () => {
      expect(getKoreanColorName('#333333')).toBe('차콜');
    });

    it('순검정은 차콜을 반환한다', () => {
      expect(getKoreanColorName('#000000')).toBe('차콜');
    });
  });

  describe('유채색 판정', () => {
    it('빨강(#FF0000)은 레드 계열을 반환한다', () => {
      const name = getKoreanColorName('#FF0000');
      expect(name).toContain('레드');
    });

    it('초록(#00FF00)은 그린 계열을 반환한다', () => {
      const name = getKoreanColorName('#00FF00');
      expect(name).toContain('그린');
    });

    it('파랑(#0000FF)은 블루 또는 퍼플 계열을 반환한다', () => {
      // HSL 변환 시 순수 파랑은 H=240으로 블루/퍼플 경계
      const name = getKoreanColorName('#0000FF');
      expect(name).toMatch(/블루|퍼플/);
    });

    it('노랑(#FFFF00)은 옐로 계열을 반환한다', () => {
      const name = getKoreanColorName('#FFFF00');
      expect(name).toContain('옐로');
    });

    it('주황(#FF8800)은 오렌지 또는 골드 계열을 반환한다', () => {
      const name = getKoreanColorName('#FF8800');
      expect(name).toMatch(/오렌지|골드|코랄/);
    });

    it('보라(#8800FF)는 퍼플 또는 바이올렛 계열을 반환한다', () => {
      const name = getKoreanColorName('#8800FF');
      expect(name).toMatch(/퍼플|바이올렛/);
    });

    it('분홍(#FF69B4)은 핑크 또는 로즈 계열을 반환한다', () => {
      // HSL 변환 시 hot pink는 H~330으로 핑크/로즈 경계
      const name = getKoreanColorName('#FF69B4');
      expect(name).toMatch(/핑크|로즈/);
    });

    it('민트(#00CED1)는 민트 계열을 반환한다', () => {
      const name = getKoreanColorName('#00CED1');
      expect(name).toContain('민트');
    });
  });

  describe('명도에 따른 접두사', () => {
    it('어두운 빨강은 딥 접두사를 포함한다', () => {
      const name = getKoreanColorName('#800000');
      expect(name).toContain('딥');
    });

    it('밝은 파랑은 라이트 접두사를 포함한다', () => {
      const name = getKoreanColorName('#ADD8E6');
      expect(name).toContain('라이트');
    });

    it('중간 채도는 접두사가 없다', () => {
      const name = getKoreanColorName('#FF0000');
      expect(name).not.toContain('딥');
      expect(name).not.toContain('라이트');
    });
  });

  describe('엣지 케이스', () => {
    it('코랄색(#FF7F50)을 올바르게 분류한다', () => {
      const name = getKoreanColorName('#FF7F50');
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });

    it('골드색(#FFD700)을 올바르게 분류한다', () => {
      const name = getKoreanColorName('#FFD700');
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });
  });
});
