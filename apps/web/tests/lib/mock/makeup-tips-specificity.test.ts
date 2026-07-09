/**
 * M-1 메이크업 팁 구체화 테스트 (W2 창업자 피드백)
 * "무엇으로" 하는지 도구/제품 종류가 팁에 명시되는지 검증
 */

import { describe, it, expect } from 'vitest';
import { generateKnownUndertoneResult } from '@/lib/mock/makeup-analysis';

describe('메이크업 베이스 팁 구체화', () => {
  it('모공 고민 시 "실리콘 베이스 포어 프라이머"로 무엇을 쓰는지 명시한다', () => {
    const result = generateKnownUndertoneResult('warm', ['large-pores']);
    const base = result.makeupTips.find((t) => t.category === '베이스');
    expect(base).toBeDefined();
    const poreTip = base!.tips.find((t) => t.includes('모공'));
    expect(poreTip).toBeDefined();
    expect(poreTip).toContain('포어 프라이머');
  });

  it('T존 유분 고민 시 "페이스 파우더" 등 제품 종류를 명시한다', () => {
    const result = generateKnownUndertoneResult('cool', ['oily-tzone']);
    const base = result.makeupTips.find((t) => t.category === '베이스')!;
    const oilTip = base.tips.find((t) => t.includes('T존'));
    expect(oilTip).toContain('페이스 파우더');
  });

  it('다크서클 고민 시 컨실러 색상·사용법을 명시한다', () => {
    const result = generateKnownUndertoneResult('neutral', ['dark-circles']);
    const base = result.makeupTips.find((t) => t.category === '베이스')!;
    const dcTip = base.tips.find((t) => t.includes('다크서클'));
    expect(dcTip).toContain('컨실러');
  });

  it('고민이 없어도 프라이머 등 기본 도구를 안내한다', () => {
    const result = generateKnownUndertoneResult('warm', []);
    const base = result.makeupTips.find((t) => t.category === '베이스')!;
    expect(base.tips.join(' ')).toContain('프라이머');
  });
});
