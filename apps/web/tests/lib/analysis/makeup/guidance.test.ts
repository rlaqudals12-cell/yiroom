/**
 * M-1 메이크업 초보자 가이던스 테스트 (W2 창업자 피드백)
 */

import { describe, it, expect } from 'vitest';
import {
  extractGlossaryTerms,
  buildSituationalTips,
  detectMakeupShelfCategory,
  MAKEUP_TERM_GLOSSARY,
} from '@/lib/analysis/makeup/guidance';
import {
  generateKnownUndertoneResult,
  generateMockMakeupAnalysisResult,
} from '@/lib/mock/makeup-analysis';

describe('extractGlossaryTerms (전문 용어 쉬운 풀이)', () => {
  it('"뉴트럴"이 포함된 텍스트에서 쉬운 풀이를 반환한다', () => {
    const hits = extractGlossaryTerms('뉴트럴한 이목구비가 매력적이에요');
    const terms = hits.map((h) => h.term);
    expect(terms).toContain('뉴트럴');
    const neutral = hits.find((h) => h.term === '뉴트럴');
    expect(neutral?.easy).toContain('중간 톤');
  });

  it('용어가 없으면 빈 배열을 반환한다', () => {
    expect(extractGlossaryTerms('오늘 날씨가 좋아요')).toEqual([]);
  });

  it('null/undefined 입력을 안전하게 처리한다', () => {
    expect(extractGlossaryTerms(null)).toEqual([]);
    expect(extractGlossaryTerms(undefined)).toEqual([]);
  });

  it('여러 용어를 등장 순서대로 반환한다', () => {
    const hits = extractGlossaryTerms('웜톤에 어울리는 그라데이션 립을 추천해요');
    const terms = hits.map((h) => h.term);
    expect(terms.indexOf('웜톤')).toBeLessThan(terms.indexOf('그라데이션'));
  });

  it('설명이 같은 중복 용어(컨투어/컨투어링)는 한 번만 노출한다', () => {
    const hits = extractGlossaryTerms('컨투어링과 컨투어 기법');
    const easies = hits.map((h) => h.easy);
    expect(new Set(easies).size).toBe(easies.length);
  });

  it('모든 글로서리 항목은 비어있지 않은 설명을 가진다', () => {
    for (const [term, easy] of Object.entries(MAKEUP_TERM_GLOSSARY)) {
      expect(term.length).toBeGreaterThan(0);
      expect(easy.length).toBeGreaterThan(0);
    }
  });
});

describe('buildSituationalTips (데일리 / 풀메이크업)', () => {
  const result = generateKnownUndertoneResult('warm', []);

  it('daily와 full 두 상황을 모두 반환한다', () => {
    const tips = buildSituationalTips(result);
    expect(tips.daily.length).toBeGreaterThan(0);
    expect(tips.full.length).toBeGreaterThan(0);
  });

  it('데일리는 베이스를 가볍게 안내한다', () => {
    const tips = buildSituationalTips(result);
    const baseGroup = tips.daily[0];
    expect(baseGroup.category).toContain('가볍게');
    expect(baseGroup.tips.join(' ')).toMatch(/톤업|가볍게|얇게/);
  });

  it('데일리는 립 중심 포인트를 포함한다', () => {
    const tips = buildSituationalTips(result);
    const pointGroup = tips.daily.find((g) => g.category.includes('립'));
    expect(pointGroup).toBeDefined();
    expect(pointGroup!.tips.join(' ')).toContain('립');
  });

  it('풀메이크업은 베이스 커버와 아이 강조를 포함한다', () => {
    const tips = buildSituationalTips(result);
    const categories = tips.full.map((g) => g.category).join(' ');
    expect(categories).toContain('커버');
    expect(categories).toContain('강조');
  });

  it('추천 색상 이름을 팁 문구에 반영한다 (기존 데이터 재사용)', () => {
    const tips = buildSituationalTips(result);
    const lipName = result.colorRecommendations.find((c) => c.category === 'lip')?.colors[0]?.name;
    if (lipName) {
      const allText = [...tips.daily, ...tips.full].flatMap((g) => g.tips).join(' ');
      expect(allText).toContain(lipName);
    }
  });

  it('색상 추천이 없어도 기본 문구로 안전하게 동작한다', () => {
    const empty = { ...generateMockMakeupAnalysisResult(), colorRecommendations: [] };
    const tips = buildSituationalTips(empty);
    expect(tips.daily.length).toBeGreaterThan(0);
    expect(tips.full.length).toBeGreaterThan(0);
  });
});

describe('detectMakeupShelfCategory (보유 화장품 감지)', () => {
  it('립스틱 제품명을 lip으로 감지한다', () => {
    expect(detectMakeupShelfCategory({ productName: '롬앤 쥬시래스팅 틴트' })).toBe('lip');
    expect(detectMakeupShelfCategory({ productName: 'MAC 립스틱 루비우' })).toBe('lip');
  });

  it('아이섀도 제품명을 eyeshadow로 감지한다', () => {
    expect(detectMakeupShelfCategory({ productName: '클리오 프로 아이 팔레트' })).toBe('eyeshadow');
    expect(detectMakeupShelfCategory({ productName: 'Eyeshadow Palette' })).toBe('eyeshadow');
  });

  it('블러셔/파운데이션/컨투어를 각각 감지한다', () => {
    expect(detectMakeupShelfCategory({ productName: '페리페라 블러셔' })).toBe('blush');
    expect(detectMakeupShelfCategory({ productName: '에스티로더 쿠션 파운데이션' })).toBe(
      'foundation'
    );
    expect(detectMakeupShelfCategory({ productName: '베네피트 하이라이터' })).toBe('contour');
  });

  it('메이크업이 아닌 제품(토너 등)은 null을 반환한다', () => {
    expect(detectMakeupShelfCategory({ productName: '토리든 다이브인 토너' })).toBeNull();
    expect(detectMakeupShelfCategory({ productName: '' })).toBeNull();
    expect(detectMakeupShelfCategory({})).toBeNull();
  });
});
