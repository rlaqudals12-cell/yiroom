/**
 * 퍼스널 컬러 전용 RAG 테스트
 * @description Phase K - 퍼스널 컬러 기반 색상/코디 추천 RAG 시스템 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// 로거 모킹
vi.mock('@/lib/utils/logger', () => ({
  coachLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// 모듈 임포트는 모킹 후에
import {
  searchByPersonalColor,
  formatPersonalColorForPrompt,
} from '@/lib/coach/personal-color-rag';
import type { UserContext } from '@/lib/coach/types';

describe('Personal Color RAG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchByPersonalColor', () => {
    it('사용자 컨텍스트 없이 null을 반환한다', async () => {
      const result = await searchByPersonalColor(null, '립 색상 추천해줘');
      expect(result).toBeNull();
    });

    it('퍼스널컬러 정보 없으면 null을 반환한다', async () => {
      const userContext: UserContext = {
        skinAnalysis: { skinType: '건성' },
      };

      const result = await searchByPersonalColor(userContext, '내 시즌에 맞는 색');
      expect(result).toBeNull();
    });

    it('봄 웜톤 사용자에게 적절한 색상을 추천한다', async () => {
      const userContext: UserContext = {
        personalColor: { season: 'spring', tone: 'warm' },
      };

      const result = await searchByPersonalColor(userContext, '어울리는 색 추천해줘');

      expect(result).toBeDefined();
      expect(result?.seasonType).toBe('spring');
      expect(result?.recommendations.length).toBeGreaterThan(0);
      expect(result?.tips.length).toBeGreaterThan(0);
    });

    it('여름 쿨톤 사용자에게 적절한 색상을 추천한다', async () => {
      const userContext: UserContext = {
        personalColor: { season: 'summer', tone: 'cool' },
      };

      const result = await searchByPersonalColor(userContext, '립스틱 색상');

      expect(result).toBeDefined();
      expect(result?.seasonType).toBe('summer');
    });

    it('가을 웜톤 사용자에게 적절한 색상을 추천한다', async () => {
      const userContext: UserContext = {
        personalColor: { season: 'autumn' },
      };

      const result = await searchByPersonalColor(userContext, '옷 색상 추천');

      expect(result).toBeDefined();
      expect(result?.seasonType).toBe('autumn');
    });

    it('겨울 쿨톤 사용자에게 적절한 색상을 추천한다', async () => {
      const userContext: UserContext = {
        personalColor: { season: 'winter' },
      };

      const result = await searchByPersonalColor(userContext, '악세서리 색상');

      expect(result).toBeDefined();
      expect(result?.seasonType).toBe('winter');
    });

    it('한글 시즌명도 처리한다', async () => {
      const userContext: UserContext = {
        personalColor: { season: '봄' },
      };

      const result = await searchByPersonalColor(userContext, '내 시즌 색상');

      expect(result).toBeDefined();
      expect(result?.seasonType).toBe('spring');
    });

    it('립 관련 질문에 립 색상을 우선 추천한다', async () => {
      const userContext: UserContext = {
        personalColor: { season: 'spring' },
      };

      const result = await searchByPersonalColor(userContext, '립 색상 추천해줘');

      expect(result).toBeDefined();
      // 립 관련 추천이 포함되어야 함
      const hasLipRecommendation = result?.recommendations.some(
        (r) => r.useCase.includes('립') || r.useCase.includes('블러셔')
      );
      expect(hasLipRecommendation).toBe(true);
    });

    it('옷 관련 질문에 옷 색상을 우선 추천한다', async () => {
      const userContext: UserContext = {
        personalColor: { season: 'summer' },
      };

      const result = await searchByPersonalColor(userContext, '옷 색깔 뭐가 어울려?');

      expect(result).toBeDefined();
      const hasClothesRecommendation = result?.recommendations.some((r) =>
        r.useCase.includes('옷')
      );
      expect(hasClothesRecommendation).toBe(true);
    });

    it('피해야 할 색상 정보를 포함한다', async () => {
      const userContext: UserContext = {
        personalColor: { season: 'spring' },
      };

      const result = await searchByPersonalColor(userContext, '안 어울리는 색');

      expect(result).toBeDefined();
      expect(result?.avoidColors.length).toBeGreaterThan(0);
    });
  });

  describe('formatPersonalColorForPrompt', () => {
    it('null이면 빈 문자열을 반환한다', () => {
      const result = formatPersonalColorForPrompt(null);
      expect(result).toBe('');
    });

    it('퍼스널 컬러 정보를 프롬프트 형식으로 변환한다', () => {
      const match = {
        seasonType: 'spring' as const,
        recommendations: [
          {
            colorName: '코랄',
            hexCode: '#FF7F50',
            category: 'best' as const,
            useCase: '립스틱, 블러셔',
            reason: '봄 웜톤의 화사함을 살려줍니다',
          },
          {
            colorName: '블랙',
            hexCode: '#000000',
            category: 'avoid' as const,
            useCase: '전체 코디',
            reason: '얼굴이 칙칙해 보일 수 있습니다',
          },
        ],
        tips: ['밝고 따뜻한 색상이 잘 어울려요'],
        avoidColors: ['블랙', '버건디'],
      };

      const result = formatPersonalColorForPrompt(match);

      expect(result).toContain('봄 웜톤');
      expect(result).toContain('추천 색상');
      expect(result).toContain('코랄');
      expect(result).toContain('피해야 할 색상');
      expect(result).toContain('블랙');
      expect(result).toContain('스타일링 팁');
    });
  });
});
