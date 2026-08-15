/**
 * 피부 결과 → 피부 일기 CTA 정직성 가드 (2026-08 중급 수리 #3)
 *
 * 배경: 결과 페이지의 다이어리 CTA가 "악화 알림을 받을 수 있어요"라고 약속했지만,
 *   도착지(/analysis/skin/diary)에는 알림 기능이 없다(존별 실측 데이터가 없어
 *   존 트렌드/악화 알림은 렌더하지 않음). 실재하는 건 컨디션 추이(FactorTrendChart)와
 *   생활습관 상관(CorrelationChart) 둘뿐이다.
 *
 * 원칙: CTA는 도착지에 실재하는 기능과 1:1로만 약속한다(빈 약속 금지).
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const RESULT_SRC = fs.readFileSync(
  path.join(__dirname, '../../../app/(main)/analysis/skin/result/[id]/page.tsx'),
  'utf-8'
);

const DIARY_SRC = fs.readFileSync(
  path.join(__dirname, '../../../app/(main)/analysis/skin/diary/page.tsx'),
  'utf-8'
);

// 다이어리 CTA 블록만 잘라낸다(파일 전체가 아니라 해당 카드의 카피만 검사)
function extractDiaryCtaBlock(src: string): string {
  const start = src.indexOf('data-testid="skin-diary-cta"');
  expect(start).toBeGreaterThan(-1);
  return src.slice(start, start + 1200);
}

describe('피부 일기 CTA — 도착지에 없는 기능을 약속하지 않는다', () => {
  it('CTA 카피가 알림 기능을 약속하지 않는다', () => {
    const block = extractDiaryCtaBlock(RESULT_SRC);
    expect(block).not.toMatch(/알림/);
  });

  it('CTA 카피는 실재 기능(추이·상관)만 말한다', () => {
    const block = extractDiaryCtaBlock(RESULT_SRC);
    expect(block).toMatch(/추이/);
    expect(block).toMatch(/상관/);
  });

  it('도착지(다이어리)는 실제로 추이·상관 차트를 렌더한다', () => {
    expect(DIARY_SRC).toMatch(/<FactorTrendChart/);
    expect(DIARY_SRC).toMatch(/<CorrelationChart/);
  });

  it('도착지(다이어리)는 악화 알림 카드를 렌더하지 않는다(약속 근거 없음)', () => {
    expect(DIARY_SRC).not.toMatch(/<DeteriorationAlertCard/);
  });
});
