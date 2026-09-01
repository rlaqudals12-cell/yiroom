/**
 * assembleBriefing 테스트 (ADR-118) — 웹 홈·모바일이 공유하는 조립 정본.
 * 문장 + 스와치 + 배색 + 시간대가 입력 데이터에 정직하게 대응하는지 검증.
 */

import { describe, it, expect } from 'vitest';
import { assembleBriefing } from '@/lib/briefing';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import type { ClothingCategory, InventoryItem, Season } from '@/types/inventory';

const MORNING = new Date('2026-07-10T09:00:00');

function pc(bestColors?: Array<{ name: string; hex: string }>): AnalysisSummary {
  return {
    id: 'pc-1',
    type: 'personal-color',
    createdAt: MORNING,
    summary: '봄 웜톤',
    seasonType: 'spring',
    ...(bestColors ? { bestColors } : {}),
  } as AnalysisSummary;
}

function closetItem(
  id: string,
  subCategory: ClothingCategory,
  seasons: Season[] = ['spring', 'summer', 'autumn', 'winter']
): InventoryItem {
  return {
    id,
    clerkUserId: 'user-1',
    category: 'closet',
    subCategory,
    name: `${subCategory}-${id}`,
    imageUrl: `https://signed.example/${id}.jpg?token=private`,
    originalImageUrl: null,
    brand: null,
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata: {
      color: ['코랄'],
      season: seasons,
      occasion: [],
      pattern: 'solid',
      material: [],
    },
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  };
}

describe('assembleBriefing', () => {
  it('분석이 없으면 인사/맺음말만 있고 스와치·배색은 없다(정직성 가드)', () => {
    const p = assembleBriefing([], { userName: '지민', now: MORNING });
    expect(p.hasAnalyses).toBe(false);
    expect(p.myColors).toBeNull();
    expect(p.todayStyle.outfit).toBeNull();
    expect(p.briefing.greeting).toContain('지민');
    expect(p.briefing.closing.length).toBeGreaterThan(0);
    expect(p.timeSlot).toBe('morning');
  });

  it('PC 베스트 컬러가 있으면 스와치와 5블록 배색을 조립한다', () => {
    const colors = [
      { name: '코랄', hex: '#FF7F50' },
      { name: '골드', hex: '#FFD700' },
    ];
    const p = assembleBriefing([pc(colors)], { userName: '지민', now: MORNING });
    expect(p.myColors?.analysisId).toBe('pc-1');
    expect(p.myColors?.colors).toHaveLength(2);
    expect(p.todayStyle.outfit?.colors).toHaveLength(5);
  });

  it('베스트 컬러가 없는 PC 분석은 스와치를 만들지 않는다', () => {
    const p = assembleBriefing([pc()], { now: MORNING });
    expect(p.myColors).toBeNull();
    expect(p.todayStyle.outfit).toBeNull();
    expect(p.hasAnalyses).toBe(true);
  });

  it('옷장이 있으면 기존 매처가 고른 서명 사진 3~4장을 브리핑 코디로 투영한다', () => {
    const closetItems = [
      closetItem('top-1', 'top'),
      closetItem('bottom-1', 'bottom'),
      closetItem('shoes-1', 'shoes'),
      closetItem('bag-1', 'bag'),
    ];

    const p = assembleBriefing([pc([{ name: '코랄', hex: '#FF7F50' }])], {
      now: MORNING,
      weatherTemp: 22,
      closetItems,
    });

    expect(p.todayStyle.closetItemCount).toBe(4);
    expect(p.todayStyle.closetOutfit?.items).toHaveLength(4);
    expect(p.todayStyle.closetOutfit?.items.map((item) => item.role)).toEqual([
      '상의',
      '하의',
      '신발',
      '가방',
    ]);
    expect(p.todayStyle.closetOutfit?.items[0].imageUrl).toContain('token=private');
  });

  it('실제 빈 옷장은 0벌로 표식하되 기존 퍼스널컬러 팔레트를 유지한다', () => {
    const p = assembleBriefing([pc([{ name: '코랄', hex: '#FF7F50' }])], {
      now: MORNING,
      closetItems: [],
    });

    expect(p.todayStyle.closetItemCount).toBe(0);
    expect(p.todayStyle.closetOutfit).toBeNull();
    expect(p.todayStyle.outfit?.colors).toHaveLength(5);
  });

  it('실제 추천 슬롯이 3개보다 적으면 사진을 복제하지 않고 구성 부족으로 폴백한다', () => {
    const p = assembleBriefing([pc([{ name: '코랄', hex: '#FF7F50' }])], {
      now: MORNING,
      closetItems: [closetItem('top-only', 'top'), closetItem('bottom-only', 'bottom')],
    });

    expect(p.todayStyle.closetItemCount).toBe(2);
    expect(p.todayStyle.closetOutfit).toBeNull();
    expect(p.todayStyle.closetNeedsMoreItems).toBe(true);
    expect(p.todayStyle.outfit?.colors).toHaveLength(5);
  });

  it('서명 실패로 남은 비공개 스토리지 경로는 브리핑 사진에 싣지 않는다', () => {
    const unsignedTop = {
      ...closetItem('top-unsigned', 'top'),
      imageUrl: 'user-1/closet/top-unsigned.jpg',
    };
    const p = assembleBriefing([pc()], {
      now: MORNING,
      closetItems: [
        unsignedTop,
        closetItem('bottom-signed', 'bottom'),
        closetItem('shoes-signed', 'shoes'),
        closetItem('bag-signed', 'bag'),
      ],
    });

    expect(p.todayStyle.closetOutfit?.items).toHaveLength(3);
    expect(p.todayStyle.closetOutfit?.items.map((item) => item.imageUrl)).not.toContain(
      'user-1/closet/top-unsigned.jpg'
    );
  });

  it('옷장 조회 입력이 없으면 실패를 빈 옷장으로 가장하지 않는다', () => {
    const p = assembleBriefing([pc()], { now: MORNING });
    expect(p.todayStyle.closetItemCount).toBeNull();
    expect(p.todayStyle.closetOutfit).toBeNull();
  });

  it('계절 조건을 완화한 코디는 기존 매처의 경고를 보존한다', () => {
    const winterOnly = [
      closetItem('top-winter', 'top', ['winter']),
      closetItem('bottom-winter', 'bottom', ['winter']),
      closetItem('shoes-winter', 'shoes', ['winter']),
    ];

    const p = assembleBriefing([pc()], {
      now: MORNING,
      weatherTemp: 27,
      closetItems: winterOnly,
    });

    expect(p.todayStyle.closetOutfit?.warnings.join(' ')).toContain('계절이 안 맞지만');
  });

  it('피부 추이가 있으면 관찰 문장에 근거 수치(±점)를 포함한다', () => {
    const skin: AnalysisSummary = {
      id: 'skin-1',
      type: 'skin',
      createdAt: MORNING,
      summary: '82점',
      skinScore: 82,
      skinDelta: 2,
      skinTrend: 'up',
    };
    const p = assembleBriefing([skin], { now: MORNING });
    expect(p.briefing.observation).toBeDefined();
    expect(p.briefing.observation).toContain('점');
  });

  it('날씨 패션 팁은 오늘의 스타일에, 피부 팁은 브리핑 조언에 배분한다', () => {
    const p = assembleBriefing([pc()], {
      now: MORNING,
      weatherSkinTip: 'SPF50 선크림 필수',
      weatherFashionTip: '가벼운 아우터',
    });
    expect(p.todayStyle.fashionTip).toBe('가벼운 아우터');
    expect(p.briefing.advice).toContain('SPF50 선크림 필수');
  });

  it('제품함 후속·오늘 캡슐 우선을 화법으로 전달한다 ("기억한다" 배선)', () => {
    // 피부 추이가 없어야 제품함 후속이 관찰로 노출된다(관찰 우선순위)
    const p = assembleBriefing([pc()], {
      now: MORNING,
      recentProduct: { name: '수분 앰플', addedDaysAgo: 3 },
      capsulePriority: { name: '약산성 클렌저', reason: '장벽 회복 중' },
    });
    expect(p.briefing.observation).toContain('수분 앰플');
    expect(p.briefing.advice.some((line) => line.includes('약산성 클렌저'))).toBe(true);
  });

  it('제품함 후속에 이전 응답(긍정)이 있으면 회고 문장으로 조립한다(폐루프 v1)', () => {
    const p = assembleBriefing([pc()], {
      now: MORNING,
      recentProduct: { name: '수분 앰플', shelfItemId: 'shelf-1', feedback: 'positive' },
    });
    expect(p.briefing.observation).toContain('수분 앰플');
    expect(p.briefing.observation).toContain('잘 맞는다고');
    // 응답이 있으면 재질문(버튼) 없음
    expect(p.briefing.shelfFollowup).toBeUndefined();
  });

  it('제품함 후속이 미응답이면 응답 버튼용 후속 정보를 페이로드에 싣는다(폐루프 v1)', () => {
    const p = assembleBriefing([pc()], {
      now: MORNING,
      recentProduct: { name: '수분 앰플', shelfItemId: 'shelf-1' },
    });
    expect(p.briefing.observation).toContain('잘 맞고 있어요?');
    expect(p.briefing.shelfFollowup).toEqual({ shelfItemId: 'shelf-1', productName: '수분 앰플' });
  });

  it('제품함·캡슐 데이터가 없으면 주입하지 않는다(정직성 가드)', () => {
    const p = assembleBriefing([pc()], { now: MORNING });
    // recentProduct/capsulePriority 미주입 → 관찰 없음(오래된 분석도 아님), 조언 빈 배열
    expect(p.briefing.observation).toBeUndefined();
    expect(p.briefing.advice).toEqual([]);
  });

  it('hour(사용자 타임존 시)를 주입하면 now.getHours() 대신 시간대를 결정한다', () => {
    // now는 아침(09시)이지만 hour=23(밤)을 주입 → 밤 시간대로 인사
    const p = assembleBriefing([], { now: MORNING, hour: 23 });
    expect(p.timeSlot).toBe('night');
    expect(p.briefing.greeting).toContain('고생');
  });
});
