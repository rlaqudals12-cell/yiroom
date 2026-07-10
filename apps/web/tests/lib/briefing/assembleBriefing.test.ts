/**
 * assembleBriefing 테스트 (ADR-118) — 웹 홈·모바일이 공유하는 조립 정본.
 * 문장 + 스와치 + 배색 + 시간대가 입력 데이터에 정직하게 대응하는지 검증.
 */

import { describe, it, expect } from 'vitest';
import { assembleBriefing } from '@/lib/briefing';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

const MORNING = new Date('2026-07-10T09:00:00');

function pc(bestColors?: Array<{ name: string; hex: string }>): AnalysisSummary {
  return {
    id: 'pc-1',
    type: 'personal-color',
    createdAt: MORNING,
    summary: '봄 웜톤',
    ...(bestColors ? { bestColors } : {}),
  } as AnalysisSummary;
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
