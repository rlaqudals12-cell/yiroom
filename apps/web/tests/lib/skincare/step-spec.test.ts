/**
 * getStepSpec — 상태 기반 성분 스펙 규칙 (U2)
 *
 * 일반 명칭을 피부타입·고민·케어단계로 구체화하는 순수 함수 검증.
 * - 타입×고민 조합별 스펙명
 * - barrier 단계 강제(진정·보습)
 * - 근거 없는 고민 = 기본 명칭(null)
 * - 법적 표현 안전(처방·치료 금지)
 */

import { describe, it, expect } from 'vitest';
import { getStepSpec } from '@/lib/skincare/step-spec';
import type { ProductCategory } from '@/types/skincare-routine';
import type { SkinConcernId } from '@/lib/mock/skin-analysis';

describe('getStepSpec — 클렌저', () => {
  it('건성 → 촉촉한 약산성 클렌저', () => {
    expect(getStepSpec('cleanser', 'dry', [])?.specName).toBe('촉촉한 약산성 클렌저');
  });
  it('지성 → 약산성 클렌저', () => {
    expect(getStepSpec('cleanser', 'oily', [])?.specName).toBe('약산성 클렌저');
  });
  it('민감성 → 약산성 클렌저', () => {
    expect(getStepSpec('cleanser', 'sensitive', [])?.specName).toBe('약산성 클렌저');
  });
  it('중성 → 약산성 클렌저 (기본도 약산성 권장)', () => {
    expect(getStepSpec('cleanser', 'normal', [])?.specName).toBe('약산성 클렌저');
  });
});

describe('getStepSpec — 토너', () => {
  it('건성 → 보습 토너', () => {
    expect(getStepSpec('toner', 'dry', [])?.specName).toBe('보습 토너');
  });
  it('지성 → 수분 토너(무유분)', () => {
    expect(getStepSpec('toner', 'oily', [])?.specName).toBe('수분 토너(무유분)');
  });
  it('민감성 → 무향 진정 토너', () => {
    expect(getStepSpec('toner', 'sensitive', [])?.specName).toBe('무향 진정 토너');
  });
  it('중성·복합성 → null (기본 토너 유지)', () => {
    expect(getStepSpec('toner', 'normal', [])).toBeNull();
    expect(getStepSpec('toner', 'combination', [])).toBeNull();
  });
});

describe('getStepSpec — 세럼 (고민 기반)', () => {
  it('색소침착 → 비타민C 세럼(아침)', () => {
    expect(getStepSpec('serum', 'normal', ['pigmentation'])?.specName).toContain('비타민C');
  });
  it('주름 → 레티놀 세럼(저녁)', () => {
    expect(getStepSpec('serum', 'normal', ['wrinkles'])?.specName).toBe('레티놀 세럼(저녁)');
  });
  it('건조 → 히알루론산 세럼', () => {
    expect(getStepSpec('serum', 'normal', ['dryness'])?.specName).toBe('히알루론산 세럼');
  });
  it('민감 → 진정 세럼(시카·판테놀)', () => {
    expect(getStepSpec('serum', 'normal', ['sensitivity'])?.specName).toBe(
      '진정 세럼(시카·판테놀)'
    );
  });
  it('여드름 → 나이아신아마이드 세럼', () => {
    expect(getStepSpec('serum', 'oily', ['acne'])?.specName).toBe('나이아신아마이드 세럼');
  });
  it('대응 고민 없음 → null (기본 세럼 유지, 지어내지 않음)', () => {
    expect(getStepSpec('serum', 'normal', [])).toBeNull();
    expect(getStepSpec('serum', 'normal', ['texture'])).toBeNull();
  });
  it('concerns 순서대로 첫 매칭 우선 (목표가 앞에 병합됨)', () => {
    // 주름이 앞 → 레티놀이 채택 (색소침착보다 우선)
    const spec = getStepSpec('serum', 'normal', ['wrinkles', 'pigmentation']);
    expect(spec?.specName).toBe('레티놀 세럼(저녁)');
  });
  it('앰플도 세럼과 동일 규칙', () => {
    expect(getStepSpec('ampoule', 'normal', ['dryness'])?.specName).toBe('히알루론산 세럼');
  });
});

describe('getStepSpec — 크림', () => {
  it('건성 → 세라마이드 크림', () => {
    expect(getStepSpec('cream', 'dry', [])?.specName).toBe('세라마이드 크림');
  });
  it('민감성 → 세라마이드 크림', () => {
    expect(getStepSpec('cream', 'sensitive', [])?.specName).toBe('세라마이드 크림');
  });
  it('지성 → 수분 젤 크림', () => {
    expect(getStepSpec('cream', 'oily', [])?.specName).toBe('수분 젤 크림');
  });
  it('중성·복합성 → null (기본 크림 유지)', () => {
    expect(getStepSpec('cream', 'normal', [])).toBeNull();
    expect(getStepSpec('cream', 'combination', [])).toBeNull();
  });
});

describe('getStepSpec — 선크림', () => {
  it('민감성 → 무기자차(민감 피부용)', () => {
    expect(getStepSpec('sunscreen', 'sensitive', [])?.specName).toBe('무기자차(민감 피부용)');
  });
  it('그 외 → SPF50+ PA+++', () => {
    expect(getStepSpec('sunscreen', 'normal', [])?.specName).toBe('SPF50+ PA+++');
    expect(getStepSpec('sunscreen', 'dry', [])?.specName).toBe('SPF50+ PA+++');
  });
  it('SPF50+/PA+++ 의미 풀이(UVA 차단)를 specReason에 담는다', () => {
    const reason = getStepSpec('sunscreen', 'normal', [])?.specReason ?? '';
    expect(reason).toContain('SPF50+');
    expect(reason).toContain('PA+++');
    expect(reason).toContain('UVA');
  });
});

describe('getStepSpec — 세럼 성분 농도 가이드', () => {
  it('비타민C 세럼은 농도 범위(10~20%)와 제품 표기 확인 안내를 담는다', () => {
    const reason = getStepSpec('serum', 'normal', ['pigmentation'])?.specReason ?? '';
    expect(reason).toContain('10~20%');
    expect(reason).toContain('제품 표기');
  });
  it('레티놀 세럼은 저농도 시작(0.1~0.3%)과 제품 표기 확인 안내를 담는다', () => {
    const reason = getStepSpec('serum', 'normal', ['wrinkles'])?.specReason ?? '';
    expect(reason).toContain('0.1~0.3%');
    expect(reason).toContain('제품 표기');
  });
});

describe('getStepSpec — barrier 단계 강제(진정·보습)', () => {
  it('barrier면 세럼 목표(색소침착)를 무시하고 보습/진정으로 강제', () => {
    // goal 단계면 비타민C, barrier면 진정·보습(히알루론산)
    expect(getStepSpec('serum', 'normal', ['pigmentation'], 'goal')?.specName).toContain('비타민C');
    expect(getStepSpec('serum', 'normal', ['pigmentation'], 'barrier')?.specName).toBe(
      '히알루론산 세럼'
    );
  });
  it('barrier + 민감(피부/고민)이면 진정 세럼으로', () => {
    expect(getStepSpec('serum', 'sensitive', [], 'barrier')?.specName).toBe(
      '진정 세럼(시카·판테놀)'
    );
    expect(getStepSpec('serum', 'normal', ['redness'], 'barrier')?.specName).toBe(
      '진정 세럼(시카·판테놀)'
    );
  });
  it('barrier면 중성 크림도 세라마이드로 강제', () => {
    expect(getStepSpec('cream', 'normal', [])).toBeNull(); // goal(미전달) = 기본
    expect(getStepSpec('cream', 'normal', [], 'barrier')?.specName).toBe('세라마이드 크림');
  });
});

describe('getStepSpec — 스펙 없는 카테고리', () => {
  it('essence·eye_cream·mask·oil·spot_treatment은 null', () => {
    const noSpec: ProductCategory[] = ['essence', 'eye_cream', 'mask', 'oil', 'spot_treatment'];
    for (const c of noSpec) {
      expect(getStepSpec(c, 'dry', ['dryness'], 'barrier')).toBeNull();
    }
  });
});

describe('getStepSpec — 법적 표현 안전', () => {
  it('모든 조합의 specName/specReason에 처방·치료·완치 단어가 없다', () => {
    const cats: ProductCategory[] = ['cleanser', 'toner', 'serum', 'ampoule', 'cream', 'sunscreen'];
    const skinTypes = ['dry', 'oily', 'combination', 'normal', 'sensitive'] as const;
    const concerns: SkinConcernId[] = [
      'pigmentation',
      'wrinkles',
      'dryness',
      'sensitivity',
      'acne',
      'excess_oil',
      'pores',
      'dullness',
      'redness',
      'fine_lines',
      'dehydration',
    ];
    const forbidden = ['처방', '치료', '완치'];

    for (const cat of cats) {
      for (const st of skinTypes) {
        for (const phase of ['goal', 'barrier'] as const) {
          for (const concern of concerns) {
            const spec = getStepSpec(cat, st, [concern], phase);
            if (!spec) continue;
            for (const word of forbidden) {
              expect(spec.specName).not.toContain(word);
              expect(spec.specReason).not.toContain(word);
            }
          }
        }
      }
    }
  });
});
