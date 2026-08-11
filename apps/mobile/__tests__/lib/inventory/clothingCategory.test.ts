/**
 * 의류 대분류 정규화 테스트
 * 웹 tests/lib/inventory/clothingCategory.test.ts 대응 포팅
 */

import { resolveClothingCategory } from '../../../lib/inventory/clothingCategory';

describe('resolveClothingCategory', () => {
  describe('한글 세부종류 형상 (실데이터 — sub_category에 한글 저장)', () => {
    it('한글 세부종류를 영문 대분류로 역매핑해야 한다', () => {
      expect(resolveClothingCategory({ subCategory: '티셔츠' })).toBe('top');
      expect(resolveClothingCategory({ subCategory: '청바지' })).toBe('bottom');
      expect(resolveClothingCategory({ subCategory: '코트' })).toBe('outer');
      expect(resolveClothingCategory({ subCategory: '원피스' })).toBe('dress');
      expect(resolveClothingCategory({ subCategory: '스니커즈' })).toBe('shoes');
      expect(resolveClothingCategory({ subCategory: '토트백' })).toBe('bag');
      expect(resolveClothingCategory({ subCategory: '모자' })).toBe('accessory');
    });

    it('앞뒤 공백이 있어도 역매핑되어야 한다', () => {
      expect(resolveClothingCategory({ subCategory: ' 티셔츠 ' })).toBe('top');
    });
  });

  describe('영문 대분류 형상 (구 폴백 행 호환)', () => {
    it('sub_category가 이미 영문 대분류면 그대로 반환해야 한다', () => {
      expect(resolveClothingCategory({ subCategory: 'top' })).toBe('top');
      expect(resolveClothingCategory({ subCategory: 'bottom' })).toBe('bottom');
      expect(resolveClothingCategory({ subCategory: 'accessory' })).toBe('accessory');
    });
  });

  describe('미지정/미매핑 형상', () => {
    it('목록 밖 한글(AI 자유 응답)은 null을 반환해야 한다', () => {
      expect(resolveClothingCategory({ subCategory: '후드티' })).toBeNull();
    });

    it('subCategory가 null이면 null을 반환해야 한다', () => {
      expect(resolveClothingCategory({ subCategory: null })).toBeNull();
    });

    it('빈 문자열이면 null을 반환해야 한다', () => {
      expect(resolveClothingCategory({ subCategory: '' })).toBeNull();
    });
  });

  describe('metadata.clothingCategory 우선순위 (신규 저장 경로)', () => {
    it('metadata.clothingCategory가 있으면 sub_category보다 우선해야 한다', () => {
      // AI가 목록 밖 한글('후드티')을 반환해도 폼에서 고른 대분류가 생존
      expect(
        resolveClothingCategory({
          subCategory: '후드티',
          metadata: { clothingCategory: 'top' },
        })
      ).toBe('top');
    });

    it('metadata.clothingCategory가 유효하지 않으면 무시하고 폴백해야 한다', () => {
      // JSONB라 임의 값이 들어올 수 있음 — 형태 검증 실패 시 역매핑으로 폴백
      expect(
        resolveClothingCategory({
          subCategory: '티셔츠',
          metadata: { clothingCategory: '이상한값' },
        })
      ).toBe('top');
      expect(
        resolveClothingCategory({
          subCategory: '후드티',
          metadata: { clothingCategory: 123 },
        })
      ).toBeNull();
    });

    it('metadata가 없거나 null이어도 동작해야 한다', () => {
      expect(resolveClothingCategory({ subCategory: '티셔츠', metadata: null })).toBe('top');
      expect(resolveClothingCategory({ subCategory: '티셔츠', metadata: undefined })).toBe('top');
    });
  });
});
