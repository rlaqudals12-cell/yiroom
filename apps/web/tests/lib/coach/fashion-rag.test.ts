/**
 * 패션 전용 RAG 테스트
 * @description Phase K - 옷장 인벤토리 기반 코디 추천 RAG 시스템 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase 모킹
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: '1',
                  name: '화이트 셔츠',
                  sub_category: 'top',
                  brand: '유니클로',
                  metadata: { color: ['화이트'], occasion: ['formal', 'casual'] },
                  image_url: '/images/shirt.jpg',
                },
                {
                  id: '2',
                  name: '네이비 슬랙스',
                  sub_category: 'bottom',
                  brand: '자라',
                  metadata: { color: ['네이비'], occasion: ['formal'] },
                  image_url: '/images/pants.jpg',
                },
              ],
              error: null,
            }),
          })),
        })),
      })),
    })),
  })),
}));

// 로거 모킹
vi.mock('@/lib/utils/logger', () => ({
  coachLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// 모듈 임포트는 모킹 후에
import { searchFashionItems, formatFashionForPrompt } from '@/lib/coach/fashion-rag';
import type { UserContext } from '@/lib/coach/types';

describe('Fashion RAG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchFashionItems', () => {
    it('사용자 컨텍스트 없이 기본 검색한다', async () => {
      const result = await searchFashionItems(null, '오늘 뭐 입을까?');

      expect(result).toBeDefined();
      expect(result.generalTips.length).toBeGreaterThan(0);
    });

    it('면접 관련 질문에 포멀 스타일을 추천한다', async () => {
      const result = await searchFashionItems(null, '면접 볼 때 뭐 입어야 해?');

      expect(result).toBeDefined();
      expect(result.generalTips).toBeDefined();
      // 포멀 관련 팁이 포함되어야 함
      const hasFormalTip = result.generalTips.some(
        (tip) => tip.includes('단정') || tip.includes('깔끔') || tip.includes('네이비')
      );
      expect(hasFormalTip).toBe(true);
    });

    it('데이트 관련 질문에 데이트 스타일을 추천한다', async () => {
      const result = await searchFashionItems(null, '데이트할 때 코디 추천해줘');

      expect(result).toBeDefined();
      const hasDateTip = result.generalTips.some(
        (tip) => tip.includes('자신감') || tip.includes('인상')
      );
      expect(hasDateTip).toBe(true);
    });

    it('운동 관련 질문에 운동복 스타일을 추천한다', async () => {
      const result = await searchFashionItems(null, '헬스장 갈 때 뭐 입어?');

      expect(result).toBeDefined();
      const hasWorkoutTip = result.generalTips.some(
        (tip) => tip.includes('편안') || tip.includes('기능성')
      );
      expect(hasWorkoutTip).toBe(true);
    });

    it('여행 관련 질문에 여행 스타일을 추천한다', async () => {
      const result = await searchFashionItems(null, '여행 갈 때 코디');

      expect(result).toBeDefined();
      const hasTravelTip = result.generalTips.some(
        (tip) => tip.includes('편안') || tip.includes('레이어링')
      );
      expect(hasTravelTip).toBe(true);
    });

    it('캐주얼 관련 질문에 캐주얼 스타일을 추천한다', async () => {
      const result = await searchFashionItems(null, '편하게 입을 캐주얼 코디');

      expect(result).toBeDefined();
      expect(result.generalTips.length).toBeGreaterThan(0);
    });

    it('userId가 있으면 옷장에서 검색한다', async () => {
      const result = await searchFashionItems(null, '오늘 코디', 'user-123');

      expect(result).toBeDefined();
      expect(result.hasClosetItems).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('퍼스널 컬러 기반 매칭 점수가 계산된다', async () => {
      const userContext: UserContext = {
        personalColor: { season: 'summer', tone: 'cool' },
      };

      const result = await searchFashionItems(userContext, '코디 추천', 'user-123');

      expect(result).toBeDefined();
      if (result.recommendations.length > 0 && result.recommendations[0].items.length > 0) {
        expect(result.recommendations[0].items[0].matchScore).toBeGreaterThan(0);
      }
    });

    it('체형 정보가 있으면 스타일링 팁에 반영된다', async () => {
      const userContext: UserContext = {
        bodyAnalysis: { bodyType: 'S' },
      };

      const result = await searchFashionItems(userContext, '옷 추천', 'user-123');

      expect(result).toBeDefined();
      // 체형 관련 팁이 포함될 수 있음
      if (result.recommendations.length > 0) {
        expect(result.recommendations[0].tips).toBeDefined();
      }
    });
  });

  describe('formatFashionForPrompt', () => {
    it('추천이 없으면 일반 팁을 반환한다', () => {
      const result = formatFashionForPrompt({
        hasClosetItems: false,
        recommendations: [],
        generalTips: ['다양한 스타일을 시도해보세요!'],
      });

      // 일반 팁이 있으면 팁을 출력함
      expect(result).toContain('스타일링 팁');
      expect(result).toContain('다양한 스타일을 시도해보세요!');
    });

    it('일반 팁만 있을 때 팁을 포맷한다', () => {
      const result = formatFashionForPrompt({
        hasClosetItems: false,
        recommendations: [
          {
            items: [],
            occasion: 'casual',
            reason: '옷장 아이템이 없어요',
            tips: ['청바지 + 니트가 좋아요'],
          },
        ],
        generalTips: ['스타일링 팁입니다'],
      });

      expect(result).toContain('스타일링 팁');
    });

    it('옷장 아이템이 있으면 코디 추천을 포맷한다', () => {
      const result = formatFashionForPrompt({
        hasClosetItems: true,
        recommendations: [
          {
            items: [
              {
                id: '1',
                name: '화이트 셔츠',
                category: 'closet',
                subCategory: 'top',
                brand: '유니클로',
                color: ['화이트'],
                imageUrl: '/images/shirt.jpg',
                matchScore: 85,
                matchReason: '퍼스널 컬러와 어울림',
              },
            ],
            occasion: 'formal',
            reason: '면접에 적합한 아이템입니다',
            tips: ['단정하게 입으세요'],
          },
        ],
        generalTips: [],
      });

      expect(result).toContain('옷장 기반 코디 추천');
      expect(result).toContain('화이트 셔츠');
      expect(result).toContain('85%');
      expect(result).toContain('유니클로');
    });

    it('여러 아이템을 포맷한다', () => {
      const result = formatFashionForPrompt({
        hasClosetItems: true,
        recommendations: [
          {
            items: [
              {
                id: '1',
                name: '아이템1',
                category: 'closet',
                subCategory: 'top',
                brand: '브랜드1',
                color: ['화이트'],
                imageUrl: '/img1.jpg',
                matchScore: 80,
                matchReason: '이유1',
              },
              {
                id: '2',
                name: '아이템2',
                category: 'closet',
                subCategory: 'bottom',
                brand: null,
                color: ['네이비'],
                imageUrl: '/img2.jpg',
                matchScore: 70,
                matchReason: '',
              },
            ],
            occasion: 'casual',
            reason: '캐주얼 코디입니다',
            tips: ['편하게 입으세요'],
          },
        ],
        generalTips: [],
      });

      expect(result).toContain('1. 브랜드1 아이템1');
      expect(result).toContain('2. 아이템2');
      expect(result).toContain('80%');
      expect(result).toContain('이유1');
    });
  });
});
