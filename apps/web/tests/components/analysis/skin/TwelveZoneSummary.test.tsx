/**
 * TwelveZoneSummary 컴포넌트 테스트
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TwelveZoneSummary } from '@/components/analysis/skin/TwelveZoneSummary';
import type { DetailedZoneId } from '@/types/skin-zones';
import type { ZoneMetricsV2 } from '@/lib/analysis/skin-v2/types';

// 테스트용 기본 메트릭
function makeMetrics(overrides: Partial<ZoneMetricsV2> = {}): ZoneMetricsV2 {
  return {
    hydration: 60,
    oiliness: 50,
    pores: 55,
    texture: 65,
    pigmentation: 70,
    sensitivity: 40,
    elasticity: 60,
    ...overrides,
  };
}

// 12존 기본 데이터 생성
function makeZoneData(
  defaultScore = 70,
  overrides: Partial<Record<DetailedZoneId, { score: number; metrics: ZoneMetricsV2 }>> = {}
): { scores: Record<DetailedZoneId, number>; metrics: Record<DetailedZoneId, ZoneMetricsV2> } {
  const allZones: DetailedZoneId[] = [
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

  const scores: Record<string, number> = {};
  const metrics: Record<string, ZoneMetricsV2> = {};

  for (const zone of allZones) {
    const override = overrides[zone];
    scores[zone] = override?.score ?? defaultScore;
    metrics[zone] = override?.metrics ?? makeMetrics();
  }

  return {
    scores: scores as Record<DetailedZoneId, number>,
    metrics: metrics as Record<DetailedZoneId, ZoneMetricsV2>,
  };
}

describe('TwelveZoneSummary', () => {
  it('렌더링된다', () => {
    const { scores, metrics } = makeZoneData();
    render(<TwelveZoneSummary zoneScores={scores} zoneMetrics={metrics} />);
    expect(screen.getByTestId('twelve-zone-summary')).toBeInTheDocument();
    expect(screen.getByText('존별 피부 상태')).toBeInTheDocument();
  });

  it('상위 3개 문제 존을 하이라이트한다', () => {
    const { scores, metrics } = makeZoneData(70, {
      nose_tip: { score: 20, metrics: makeMetrics({ pores: 20, oiliness: 80 }) },
      chin_center: { score: 30, metrics: makeMetrics({ sensitivity: 80 }) },
      forehead_center: { score: 35, metrics: makeMetrics({ oiliness: 85 }) },
    });

    render(<TwelveZoneSummary zoneScores={scores} zoneMetrics={metrics} />);

    expect(screen.getByTestId('zone-highlight-0')).toBeInTheDocument();
    expect(screen.getByTestId('zone-highlight-1')).toBeInTheDocument();
    expect(screen.getByTestId('zone-highlight-2')).toBeInTheDocument();
  });

  it('최악 존이 가장 먼저 표시된다', () => {
    const { scores, metrics } = makeZoneData(70, {
      nose_tip: { score: 15, metrics: makeMetrics({ pores: 15 }) },
      chin_center: { score: 45, metrics: makeMetrics({ sensitivity: 70 }) },
      eye_left: { score: 30, metrics: makeMetrics({ elasticity: 25 }) },
    });

    render(<TwelveZoneSummary zoneScores={scores} zoneMetrics={metrics} />);

    const highlight0 = screen.getByTestId('zone-highlight-0');
    expect(highlight0).toHaveTextContent('15');
  });

  it('존별 맞춤 추천을 표시한다', () => {
    const { scores, metrics } = makeZoneData(70, {
      cheek_left: { score: 25, metrics: makeMetrics({ hydration: 20 }) },
    });

    render(<TwelveZoneSummary zoneScores={scores} zoneMetrics={metrics} />);

    expect(screen.getByText('존별 맞춤 추천')).toBeInTheDocument();
  });

  it('건강한 존만 있으면 추천을 표시하지 않는다', () => {
    const { scores, metrics } = makeZoneData(85);
    render(<TwelveZoneSummary zoneScores={scores} zoneMetrics={metrics} />);

    expect(screen.queryByText('존별 맞춤 추천')).not.toBeInTheDocument();
  });

  it('히트맵 보기 버튼 클릭 시 핸들러를 호출한다', () => {
    const onViewHeatmap = vi.fn();
    const { scores, metrics } = makeZoneData();

    render(
      <TwelveZoneSummary zoneScores={scores} zoneMetrics={metrics} onViewHeatmap={onViewHeatmap} />
    );

    const button = screen.getByRole('button', { name: '히트맵 상세 보기' });
    fireEvent.click(button);
    expect(onViewHeatmap).toHaveBeenCalledOnce();
  });

  it('onViewHeatmap이 없으면 히트맵 버튼이 없다', () => {
    const { scores, metrics } = makeZoneData();
    render(<TwelveZoneSummary zoneScores={scores} zoneMetrics={metrics} />);

    expect(screen.queryByRole('button', { name: '히트맵 상세 보기' })).not.toBeInTheDocument();
  });

  it('aria-label이 설정되어 있다', () => {
    const { scores, metrics } = makeZoneData();
    render(<TwelveZoneSummary zoneScores={scores} zoneMetrics={metrics} />);

    expect(screen.getByRole('region', { name: '12존 피부 분석 요약' })).toBeInTheDocument();
  });

  it('우선순위 뱃지가 올바르게 표시된다', () => {
    const { scores, metrics } = makeZoneData(70, {
      nose_tip: { score: 20, metrics: makeMetrics({ pores: 15, oiliness: 85 }) },
    });

    render(<TwelveZoneSummary zoneScores={scores} zoneMetrics={metrics} />);

    expect(screen.getByText('집중 관리')).toBeInTheDocument();
  });

  it('존 점수별 상태 라벨이 올바르게 표시된다', () => {
    const { scores, metrics } = makeZoneData(70, {
      nose_tip: { score: 15, metrics: makeMetrics() },
      chin_center: { score: 55, metrics: makeMetrics() },
      eye_left: { score: 85, metrics: makeMetrics() },
    });

    render(<TwelveZoneSummary zoneScores={scores} zoneMetrics={metrics} />);

    // 최악 3존 중 nose_tip(15) = 심각, chin_center(55) = 보통 등
    expect(screen.getByText('심각')).toBeInTheDocument();
  });
});
