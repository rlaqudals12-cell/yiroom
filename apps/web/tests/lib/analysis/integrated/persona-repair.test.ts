import { describe, it, expect } from 'vitest';
import {
  repairLegacyPersonaText,
  repairLegacyPersona,
} from '@/lib/analysis/integrated/internal/persona-repair';

describe('repairLegacyPersonaText — 구버전 저장 문구 교정', () => {
  it('원시 영문 피부타입을 정본 한국어 라벨로 바꾼다', () => {
    expect(repairLegacyPersonaText('당신은 combination 피부를 가진 사람이에요.')).toBe(
      '당신은 복합성 피부를 가진 사람이에요.'
    );
  });

  it('"바이탈리티" 전문용어를 소비자 라벨로 바꾼다', () => {
    expect(repairLegacyPersonaText('combination 피부 (바이탈리티 72점)')).toBe(
      '복합성 피부 (피부 컨디션 점수 72점)'
    );
  });

  it('"을(를)" 병기를 앞 문구 받침에 맞는 조사로 확정한다 — 괄호 끝 케이스 포함', () => {
    // "…72점)" — 마지막 한글 "점"(받침 ㅁ) → "을"
    expect(
      repairLegacyPersonaText('당신은 combination 피부 (바이탈리티 72점)을(를) 가진 사람이에요.')
    ).toBe('당신은 복합성 피부 (피부 컨디션 점수 72점)을 가진 사람이에요.');
    // "피부" — 받침 없음 → "를"
    expect(repairLegacyPersonaText('건성 피부을(를) 가진')).toBe('건성 피부를 가진');
  });

  it('원시 체형값 + 실루엣 표기를 한국어로 바꾼다', () => {
    expect(repairLegacyPersonaText('straight 실루엣')).toBe('스트레이트 실루엣');
  });

  it('신버전(정본 라벨) 문구는 그대로 둔다 (no-op)', () => {
    const modern = '당신은 복합성 피부 (피부 컨디션 점수 72점), 스트레이트 체형을 가진 사람이에요.';
    expect(repairLegacyPersonaText(modern)).toBe(modern);
  });
});

describe('repairLegacyPersona — persona 전체 교정', () => {
  it('oneLine·narrative·keyInsights를 모두 교정한 사본을 반환한다', () => {
    const repaired = repairLegacyPersona({
      oneLine: '당신만의 색을 가진 사람',
      narrative: '당신은 oily 피부 (바이탈리티 60점)을(를) 가진 사람이에요.',
      keyInsights: ['dry 피부에는 보습이 중요해요.'],
      usedFallback: true,
    });
    expect(repaired?.narrative).toBe('당신은 지성 피부 (피부 컨디션 점수 60점)을 가진 사람이에요.');
    expect(repaired?.keyInsights[0]).toBe('건성 피부에는 보습이 중요해요.');
    expect(repaired?.usedFallback).toBe(true);
  });

  it('null은 null 그대로 반환한다', () => {
    expect(repairLegacyPersona(null)).toBeNull();
  });
});
