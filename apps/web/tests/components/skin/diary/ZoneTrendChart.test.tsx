/**
 * ZoneTrendChart 컴포넌트 테스트
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ZoneTrendChart from '@/components/skin/diary/ZoneTrendChart';
import type { SkinDiaryEntry } from '@/lib/analysis/skin-v2/skin-diary-zone';
import type { DetailedZoneId } from '@/types/skin-zones';

const ALL_ZONES: DetailedZoneId[] = [
  'forehead_center',
  'forehead_left',
  'forehead_right',
  'eye_left',
  'eye_right',
  'cheek_left',
  'cheek_right',
  'nose_bridge',
  'nose_tip',
  'chin_center',
  'chin_left',
  'chin_right',
];

function makeEntry(
  date: string,
  baseScore: number,
  overrides?: Partial<Record<DetailedZoneId, number>>
): SkinDiaryEntry {
  const zoneScores: Partial<Record<DetailedZoneId, number>> = {};
  for (const z of ALL_ZONES) {
    zoneScores[z] = overrides?.[z] ?? baseScore;
  }
  return { date, zoneScores, vitalityScore: baseScore };
}

describe('ZoneTrendChart', () => {
  it('렌더링된다', () => {
    render(<ZoneTrendChart entries={[makeEntry('2026-03-01', 70)]} />);
    expect(screen.getByTestId('zone-trend-chart')).toBeInTheDocument();
  });

  it('데이터가 부족하면 안내 메시지를 표시한다', () => {
    render(<ZoneTrendChart entries={[makeEntry('2026-03-01', 70)]} />);
    expect(screen.getByText(/2회 이상 기록하면/)).toBeInTheDocument();
  });

  it('2개 이상 엔트리가 있으면 존별 트렌드를 표시한다', () => {
    const entries = [makeEntry('2026-03-01', 60), makeEntry('2026-03-10', 75)];
    render(<ZoneTrendChart entries={entries} periodDays={14} />);
    expect(screen.getByText('전체 바이탈리티')).toBeInTheDocument();
    expect(screen.getByText('최근 14일')).toBeInTheDocument();
  });

  it('개선 또는 악화 존 통계가 표시된다', () => {
    const entries = [
      makeEntry('2026-03-01', 40, { nose_tip: 80 }),
      makeEntry('2026-03-10', 70, { nose_tip: 25 }),
    ];
    render(<ZoneTrendChart entries={entries} periodDays={14} />);
    // 대부분 존 개선(40→70) 또는 nose_tip 악화(80→25)
    const text = screen.getByTestId('zone-trend-chart').textContent ?? '';
    expect(text).toMatch(/개선|악화/);
  });

  it('기록 수를 표시한다', () => {
    const entries = [
      makeEntry('2026-03-01', 60),
      makeEntry('2026-03-05', 65),
      makeEntry('2026-03-10', 70),
    ];
    render(<ZoneTrendChart entries={entries} />);
    expect(screen.getByText('기록 3회')).toBeInTheDocument();
  });

  it('존별 data-testid가 존재한다', () => {
    const entries = [makeEntry('2026-03-01', 50), makeEntry('2026-03-10', 70)];
    render(<ZoneTrendChart entries={entries} periodDays={14} />);
    expect(screen.getByTestId('zone-trend-forehead_center')).toBeInTheDocument();
  });
});
