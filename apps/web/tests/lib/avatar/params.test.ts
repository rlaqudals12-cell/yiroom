/**
 * AV-1: 아바타 파라미터 도출 테스트
 *
 * prod body_analyses 7행의 실제 3가지 데이터 형태를 커버:
 * ① 최신 통합 행(body_type + ratio만) ② 구 V1 행(점수만) ③ 이론상 빈 행.
 * @see docs/specs/SDD-BODY-AVATAR-3D.md §4
 */

import { describe, it, expect } from 'vitest';
import { deriveAvatarParams } from '@/lib/avatar';
import type { BodyRowForAvatar } from '@/lib/avatar';

function emptyRow(bodyType: string | null): BodyRowForAvatar {
  return { body_type: bodyType, ratio: null, shoulder: null, waist: null, hip: null };
}

describe('deriveAvatarParams', () => {
  it('타입만 있으면 tier preset — S/W/N 프리셋이 서로 구분된다', () => {
    const s = deriveAvatarParams(emptyRow('S'));
    const w = deriveAvatarParams(emptyRow('W'));
    const n = deriveAvatarParams(emptyRow('N'));

    expect(s.tier).toBe('preset');
    expect(w.tier).toBe('preset');
    expect(n.tier).toBe('preset');

    // W = 힙 중심, S/N보다 어깨 좁음
    expect(w.morphs.hip).toBeGreaterThan(s.morphs.hip);
    expect(w.morphs.shoulder).toBeLessThan(s.morphs.shoulder);
    // N = 골격감 최대
    expect(n.morphs.frame).toBeGreaterThan(s.morphs.frame);
    expect(n.morphs.frame).toBeGreaterThan(w.morphs.frame);
  });

  it('알 수 없는/누락 body_type은 S로 폴백한다', () => {
    expect(deriveAvatarParams(emptyRow(null)).bodyType).toBe('S');
    expect(deriveAvatarParams(emptyRow('X')).bodyType).toBe('S');
    expect(deriveAvatarParams(emptyRow('')).bodyType).toBe('S');
  });

  it('풀네임 body_type(straight/wave/natural)도 정규화한다', () => {
    expect(deriveAvatarParams(emptyRow('wave')).bodyType).toBe('W');
    expect(deriveAvatarParams(emptyRow('natural')).bodyType).toBe('N');
  });

  it('ratio가 있으면 tier ratio — 최신 통합 행 형태 (prod: "1.15" 문자열)', () => {
    const p = deriveAvatarParams({ ...emptyRow('W'), ratio: '1.15' });
    expect(p.tier).toBe('ratio');
    expect(p.bodyType).toBe('W');
  });

  it('ratio 증가 → 어깨 모프 단조 증가 (단조성, 원리 §4)', () => {
    const at = (r: number): number =>
      deriveAvatarParams({ ...emptyRow('S'), ratio: r }).morphs.shoulder;
    expect(at(1.0)).toBeLessThan(at(1.2));
    expect(at(1.2)).toBeLessThan(at(1.4));
  });

  it('비정상 ratio(측정 오류)는 무시하고 preset으로 강등한다', () => {
    expect(deriveAvatarParams({ ...emptyRow('S'), ratio: 9.9 }).tier).toBe('preset');
    expect(deriveAvatarParams({ ...emptyRow('S'), ratio: 0.1 }).tier).toBe('preset');
    expect(deriveAvatarParams({ ...emptyRow('S'), ratio: 'abc' }).tier).toBe('preset');
  });

  it('구 V1 행(0-100 점수)은 비율 프록시로 tier ratio — 프록시가 모프에 반영된다', () => {
    const wideShoulder = deriveAvatarParams({
      body_type: 'S',
      ratio: null,
      shoulder: 85,
      waist: 62, // 프록시 1.37
      hip: 72,
    });
    const narrowShoulder = deriveAvatarParams({
      body_type: 'S',
      ratio: null,
      shoulder: 71,
      waist: 67, // 프록시 1.06 (prod 실측 행)
      hip: 89,
    });
    expect(wideShoulder.tier).toBe('ratio');
    expect(narrowShoulder.tier).toBe('ratio');
    // 프록시 비율 차이가 어깨 모프에 단조 반영
    expect(wideShoulder.morphs.shoulder).toBeGreaterThan(narrowShoulder.morphs.shoulder);
  });

  it('body_ratios(JSONB)가 있으면 tier full — waistToHipRatio가 힙 모프에 반영된다', () => {
    const curvy = deriveAvatarParams({
      ...emptyRow('S'),
      body_ratios: { shoulderToWaistRatio: 1.2, waistToHipRatio: 0.7 },
    });
    const straight = deriveAvatarParams({
      ...emptyRow('S'),
      body_ratios: { shoulderToWaistRatio: 1.2, waistToHipRatio: 1.0 },
    });
    expect(curvy.tier).toBe('full');
    expect(straight.tier).toBe('full');
    // 허리/힙 비율이 낮을수록(잘록) 힙 모프 큼
    expect(curvy.morphs.hip).toBeGreaterThan(straight.morphs.hip);
  });

  it('결정론 — 동일 입력은 항상 동일 출력', () => {
    const row: BodyRowForAvatar = { ...emptyRow('N'), ratio: 1.12 };
    expect(deriveAvatarParams(row)).toEqual(deriveAvatarParams(row));
  });

  it('모든 모프는 0-1 범위', () => {
    const rows: BodyRowForAvatar[] = [
      emptyRow('S'),
      { ...emptyRow('W'), ratio: 2.4 },
      { ...emptyRow('N'), ratio: 0.6 },
      { ...emptyRow('S'), body_ratios: { shoulderToWaistRatio: 2.4, waistToHipRatio: 0.5 } },
    ];
    for (const row of rows) {
      const { morphs } = deriveAvatarParams(row);
      for (const v of Object.values(morphs)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
