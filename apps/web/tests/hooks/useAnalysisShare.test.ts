/**
 * useAnalysisShare 훅 테스트
 * 공유 카드 데이터 생성 함수 검증
 */

import { describe, it, expect } from 'vitest';
import {
  createPersonalColorShareData,
  createSkinShareData,
  createBodyShareData,
  createHairShareData,
  createMakeupShareData,
} from '@/hooks/useAnalysisShare';

describe('useAnalysisShare', () => {
  describe('createPersonalColorShareData', () => {
    it('기본 퍼스널 컬러 공유 데이터를 생성한다', () => {
      const result = createPersonalColorShareData({
        seasonType: 'spring',
        seasonLabel: '봄 웜톤',
      });

      expect(result.analysisType).toBe('personal-color');
      expect(result.title).toBe('나의 퍼스널 컬러');
      expect(result.subtitle).toBe('이룸 AI 분석 결과');
      expect(result.typeLabel).toBe('봄 웜톤');
      expect(result.typeEmoji).toBe('🌸');
    });

    it('각 시즌별 이모지를 올바르게 매핑한다', () => {
      expect(
        createPersonalColorShareData({ seasonType: 'spring', seasonLabel: '봄' }).typeEmoji
      ).toBe('🌸');
      expect(
        createPersonalColorShareData({ seasonType: 'summer', seasonLabel: '여름' }).typeEmoji
      ).toBe('🌊');
      expect(
        createPersonalColorShareData({ seasonType: 'autumn', seasonLabel: '가을' }).typeEmoji
      ).toBe('🍂');
      expect(
        createPersonalColorShareData({ seasonType: 'winter', seasonLabel: '겨울' }).typeEmoji
      ).toBe('❄️');
    });

    it('알 수 없는 시즌은 기본 이모지를 사용한다', () => {
      const result = createPersonalColorShareData({
        seasonType: 'unknown',
        seasonLabel: '알 수 없음',
      });
      expect(result.typeEmoji).toBe('🎨');
    });

    it('bestColors를 colors 배열로 변환한다', () => {
      const result = createPersonalColorShareData({
        seasonType: 'spring',
        seasonLabel: '봄',
        bestColors: [
          { hex: '#FF5733' },
          { hex: '#33FF57' },
          { hex: '#3357FF' },
          { hex: '#F3F3F3' },
          { hex: '#333333' },
          { hex: '#AAAAAA' }, // 6번째는 무시
        ],
      });

      expect(result.colors).toHaveLength(5);
      expect(result.colors).toEqual(['#FF5733', '#33FF57', '#3357FF', '#F3F3F3', '#333333']);
    });
  });

  describe('createSkinShareData', () => {
    it('기본 피부 공유 데이터를 생성한다', () => {
      const result = createSkinShareData({
        overallScore: 78,
      });

      expect(result.analysisType).toBe('skin');
      expect(result.title).toBe('피부 건강 점수');
      expect(result.subtitle).toBe('이룸 AI 분석 결과');
      expect(result.score).toBe(78);
    });

    it('metrics에서 best/worst를 추출한다', () => {
      const result = createSkinShareData({
        overallScore: 78,
        metrics: [
          { name: '수분', value: 80 },
          { name: '유분', value: 60 },
          { name: '탄력', value: 90 },
          { name: '모공', value: 40 },
        ],
      });

      expect(result.highlights).toHaveLength(2);
      expect(result.highlights![0]).toEqual({ label: 'Best', value: '탄력' }); // 90
      expect(result.highlights![1]).toEqual({ label: 'Focus', value: '모공' }); // 40
    });

    it('metrics가 없으면 highlights가 빈 배열이다', () => {
      const result = createSkinShareData({
        overallScore: 78,
      });
      expect(result.highlights).toEqual([]);
    });
  });

  describe('createBodyShareData', () => {
    it('기본 체형 공유 데이터를 생성한다', () => {
      const result = createBodyShareData({
        bodyType: 'S',
        bodyTypeLabel: 'S자형 (모래시계)',
      });

      expect(result.analysisType).toBe('body');
      expect(result.title).toBe('나의 체형 타입');
      expect(result.subtitle).toBe('이룸 AI 분석 결과');
      expect(result.typeLabel).toBe('S자형 (모래시계)');
      expect(result.typeEmoji).toBe('⏳');
    });

    it('각 체형별 이모지를 올바르게 매핑한다', () => {
      expect(createBodyShareData({ bodyType: 'S', bodyTypeLabel: 'S' }).typeEmoji).toBe('⏳');
      expect(createBodyShareData({ bodyType: 'X', bodyTypeLabel: 'X' }).typeEmoji).toBe('⌛');
      expect(createBodyShareData({ bodyType: 'A', bodyTypeLabel: 'A' }).typeEmoji).toBe('🔺');
      expect(createBodyShareData({ bodyType: 'V', bodyTypeLabel: 'V' }).typeEmoji).toBe('🔻');
      expect(createBodyShareData({ bodyType: 'H', bodyTypeLabel: 'H' }).typeEmoji).toBe('▬');
      expect(createBodyShareData({ bodyType: 'N', bodyTypeLabel: 'N' }).typeEmoji).toBe('📏');
    });

    it('알 수 없는 체형은 기본 이모지를 사용한다', () => {
      const result = createBodyShareData({
        bodyType: 'Z',
        bodyTypeLabel: '알 수 없음',
      });
      expect(result.typeEmoji).toBe('👤');
    });

    it('강점을 highlights로 변환한다', () => {
      const result = createBodyShareData({
        bodyType: 'S',
        bodyTypeLabel: 'S',
        strengths: ['균형잡힌 실루엣', '다양한 스타일 소화', '세 번째 강점'],
      });

      expect(result.highlights).toHaveLength(2); // 최대 2개
      expect(result.highlights![0]).toEqual({ label: '강점', value: '균형잡힌 실루엣' });
      expect(result.highlights![1]).toEqual({ label: '강점', value: '다양한 스타일 소화' });
    });
  });

  describe('createHairShareData', () => {
    it('기본 헤어 공유 데이터를 생성한다', () => {
      const result = createHairShareData({
        overallScore: 82,
        hairTypeLabel: '웨이브',
        hairThicknessLabel: '보통',
      });

      expect(result.analysisType).toBe('hair');
      expect(result.title).toBe('헤어 건강 점수');
      expect(result.subtitle).toBe('이룸 AI 분석 결과');
      expect(result.score).toBe(82);
      expect(result.typeLabel).toBe('웨이브 · 보통');
      expect(result.typeEmoji).toBe('💇');
    });

    it('metrics에서 best/worst를 추출한다', () => {
      const result = createHairShareData({
        overallScore: 82,
        hairTypeLabel: '직모',
        hairThicknessLabel: '굵음',
        metrics: [
          { name: '두피 건강', value: 85 },
          { name: '모발 밀도', value: 70 },
          { name: '손상도', value: 30 },
        ],
      });

      expect(result.highlights).toHaveLength(2);
      expect(result.highlights![0]).toEqual({ label: 'Best', value: '두피 건강' }); // 85
      expect(result.highlights![1]).toEqual({ label: 'Focus', value: '손상도' }); // 30
    });

    it('metrics가 없으면 highlights가 빈 배열이다', () => {
      const result = createHairShareData({
        overallScore: 82,
        hairTypeLabel: '직모',
        hairThicknessLabel: '보통',
      });
      expect(result.highlights).toEqual([]);
    });
  });

  describe('createMakeupShareData', () => {
    it('기본 메이크업 공유 데이터를 생성한다', () => {
      const result = createMakeupShareData({
        overallScore: 88,
        undertoneLabel: '웜톤',
      });

      expect(result.analysisType).toBe('makeup');
      expect(result.title).toBe('메이크업 분석 점수');
      expect(result.subtitle).toBe('이룸 AI 분석 결과');
      expect(result.score).toBe(88);
      expect(result.typeEmoji).toBe('💄');
    });

    it('undertone을 highlights로 추가한다', () => {
      const result = createMakeupShareData({
        overallScore: 88,
        undertoneLabel: '웜톤',
      });

      expect(result.highlights).toContainEqual({ label: '언더톤', value: '웜톤' });
    });

    it('styleLabel이 있으면 highlights에 추가한다', () => {
      const result = createMakeupShareData({
        overallScore: 88,
        undertoneLabel: '쿨톤',
        styleLabel: '내추럴',
      });

      expect(result.highlights).toHaveLength(2);
      expect(result.highlights).toContainEqual({ label: '언더톤', value: '쿨톤' });
      expect(result.highlights).toContainEqual({ label: '스타일', value: '내추럴' });
    });

    it('undertoneLabel이 없으면 highlights가 비어있다', () => {
      const result = createMakeupShareData({
        overallScore: 88,
        undertoneLabel: '',
      });

      expect(result.highlights).toEqual([]);
    });
  });
});
