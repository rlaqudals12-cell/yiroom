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
});
