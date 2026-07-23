/**
 * lib/color ↔ culori 교차검증 — 재현성 엔진의 독립 구현 오라클
 *
 * 왜: 퍼컬 판정의 근간(Lab D65 변환·CIEDE2000)이 자체 구현(ADR-066 SSOT)인데,
 * 지금까지 독립 구현과의 대조가 없었다. culori(MIT·의존성 0)는 동일 축(lab65 =
 * D65 백점 Lab, differenceCiede2000)을 구현한 경량 라이브러리 — devDependency
 * 테스트 오라클로만 사용한다(런타임 반입·SSOT 대체 금지, 디자인 자원 조사 2026-07-23).
 *
 * 허용오차 근거: 두 구현 모두 sRGB→XYZ(D65) 표준 행렬이지만 행렬 유효숫자·감마
 * 상수 표기가 달라 소수점 이하 미세 차이가 정상 — Lab 채널 0.5, ΔE00 0.3이면
 * 12톤 분류(경계 수 ΔE 단위)에 영향 없는 수준임을 검증하는 취지.
 */
import { describe, it, expect } from 'vitest';
import { converter, differenceCiede2000 } from 'culori';
import { hexToLab, calculateCIEDE2000 } from '@/lib/color';
import { getCardPalette } from '@/lib/share/tone-palettes';

const toLab65 = converter('lab65');
const ciede2000 = differenceCiede2000();

const TWELVE_TONES = [
  'light-spring',
  'true-spring',
  'bright-spring',
  'light-summer',
  'true-summer',
  'muted-summer',
  'muted-autumn',
  'true-autumn',
  'deep-autumn',
  'deep-winter',
  'true-winter',
  'bright-winter',
];

/** 12톤 큐레이션 전 hex(베스트+포인트+피할색) — 실사용 색 분포를 그대로 오라클 입력으로 */
function collectCurationHexes(): string[] {
  const hexes = new Set<string>();
  for (const tone of TWELVE_TONES) {
    const p = getCardPalette(tone, 'ko');
    if (!p) continue;
    for (const c of [...p.best, ...p.accent]) hexes.add(c.hex);
    for (const c of p.avoid) hexes.add(c.hex);
  }
  // 극단값 보강 — 순수 원색·무채색 경계
  for (const edge of ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#808080']) {
    hexes.add(edge);
  }
  return [...hexes];
}

describe('lib/color ↔ culori 오라클 (Lab D65 · CIEDE2000)', () => {
  const hexes = collectCurationHexes();

  it('큐레이션 전 색의 hexToLab이 culori lab65와 채널당 0.5 이내로 일치한다', () => {
    expect(hexes.length).toBeGreaterThan(100);
    for (const hex of hexes) {
      const ours = hexToLab(hex);
      const oracle = toLab65(hex);
      expect(oracle, hex).toBeDefined();
      expect(Math.abs(ours.L - oracle!.l), `${hex} L(${ours.L} vs ${oracle!.l})`).toBeLessThan(0.5);
      expect(Math.abs(ours.a - oracle!.a), `${hex} a(${ours.a} vs ${oracle!.a})`).toBeLessThan(0.5);
      expect(Math.abs(ours.b - oracle!.b), `${hex} b(${ours.b} vs ${oracle!.b})`).toBeLessThan(0.5);
    }
  });

  it('색쌍 CIEDE2000이 culori differenceCiede2000과 0.3 이내로 일치한다', () => {
    // 인접쌍 + 무작위성 없는 고정 간격쌍 — 근접색(작은 ΔE)과 원거리색(큰 ΔE) 모두 커버
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < hexes.length - 1; i++) pairs.push([hexes[i], hexes[i + 1]]);
    for (let i = 0; i + 37 < hexes.length; i += 11) pairs.push([hexes[i], hexes[i + 37]]);

    for (const [h1, h2] of pairs) {
      const ours = calculateCIEDE2000(hexToLab(h1), hexToLab(h2));
      const oracle = ciede2000(h1, h2);
      expect(Math.abs(ours - oracle), `${h1}↔${h2} (${ours} vs ${oracle})`).toBeLessThan(0.3);
    }
  });

  it('동일 색의 ΔE00은 정확히 0 (결정론 — 재현성 계약의 수학적 바닥)', () => {
    for (const hex of hexes.slice(0, 10)) {
      expect(calculateCIEDE2000(hexToLab(hex), hexToLab(hex))).toBe(0);
    }
  });
});
