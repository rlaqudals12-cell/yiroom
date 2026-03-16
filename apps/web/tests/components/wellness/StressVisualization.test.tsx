/**
 * StressVisualization 컴포넌트 테스트
 *
 * @description 스트레스 시각화 게이지, 피부 영향, 트렌드, 권장사항 UI 테스트
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StressVisualization } from '@/components/wellness/StressVisualization';
import type {
  StressVisualizationData,
  StressTrendAnalysis,
} from '@/lib/wellness/stress-visualization';

// 테스트 데이터: 높은 스트레스
const highStressData: StressVisualizationData = {
  stressLevel: 8,
  stressScore: 8,
  grade: 'high',
  gradeLabel: '높음',
  color: '#f97316',
  skinImpacts: [
    { area: '피지 분비', impact: '코르티솔이 피지선을 자극해 유분이 증가해요.', severity: 3 },
    { area: '피부 장벽', impact: '스트레스가 피부 장벽 회복을 늦춰요.', severity: 2 },
    { area: '트러블', impact: '면역력 저하로 여드름/트러블이 생기기 쉬워요.', severity: 2 },
  ],
  recommendations: [
    '진정 성분(시카, 알로에) 제품을 사용해보세요.',
    '고강도 운동 대신 가벼운 산책을 추천해요.',
    '수면 시간을 7시간 이상 확보하세요.',
  ],
  gaugePercent: 22,
};

// 테스트 데이터: 낮은 스트레스
const lowStressData: StressVisualizationData = {
  stressLevel: 2,
  stressScore: 22,
  grade: 'low',
  gradeLabel: '안정',
  color: '#22c55e',
  skinImpacts: [],
  recommendations: [
    '현재 스트레스 상태가 좋아요! 유지해주세요.',
    '가벼운 운동으로 컨디션을 더 올려보세요.',
  ],
  gaugePercent: 89,
};

const trendData: StressTrendAnalysis = {
  points: [
    { date: '2026-03-10', stressLevel: 7, grade: 'high' },
    { date: '2026-03-11', stressLevel: 6, grade: 'moderate' },
    { date: '2026-03-12', stressLevel: 5, grade: 'moderate' },
  ],
  averageLevel: 6,
  trend: 'improving',
  trendMessage: '스트레스가 줄어들고 있어요! 좋은 흐름이에요.',
};

describe('StressVisualization', () => {
  describe('렌더링', () => {
    it('메인 컨테이너가 렌더링된다', () => {
      render(<StressVisualization data={highStressData} />);
      expect(screen.getByTestId('stress-visualization')).toBeInTheDocument();
    });

    it('게이지 차트가 표시된다', () => {
      render(<StressVisualization data={highStressData} />);
      expect(screen.getByTestId('stress-gauge')).toBeInTheDocument();
    });

    it('스트레스 레벨 텍스트가 표시된다', () => {
      render(<StressVisualization data={highStressData} />);
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('등급 라벨이 표시된다', () => {
      render(<StressVisualization data={highStressData} />);
      expect(screen.getByText('높음')).toBeInTheDocument();
    });

    it('스트레스 수준 헤더가 표시된다', () => {
      render(<StressVisualization data={highStressData} />);
      expect(screen.getByText('스트레스 수준')).toBeInTheDocument();
    });
  });

  describe('피부 영향', () => {
    it('피부 영향 카드가 표시된다', () => {
      render(<StressVisualization data={highStressData} />);
      expect(screen.getAllByTestId('skin-impact-card')).toHaveLength(3);
    });

    it('피부 영향 영역명이 표시된다', () => {
      render(<StressVisualization data={highStressData} />);
      expect(screen.getByText('피지 분비')).toBeInTheDocument();
      expect(screen.getByText('피부 장벽')).toBeInTheDocument();
      expect(screen.getByText('트러블')).toBeInTheDocument();
    });

    it('피부 영향이 없으면 섹션이 숨겨진다', () => {
      render(<StressVisualization data={lowStressData} />);
      expect(screen.queryAllByTestId('skin-impact-card')).toHaveLength(0);
    });

    it('컴팩트 모드에서 피부 영향이 숨겨진다', () => {
      render(<StressVisualization data={highStressData} compact />);
      expect(screen.queryByText('피부에 미치는 영향')).not.toBeInTheDocument();
    });
  });

  describe('권장사항', () => {
    it('권장사항이 표시된다', () => {
      render(<StressVisualization data={highStressData} />);
      expect(screen.getByText('이렇게 해보세요')).toBeInTheDocument();
      expect(screen.getByText(/진정 성분/)).toBeInTheDocument();
    });

    it('컴팩트 모드에서 최대 2개만 표시된다', () => {
      render(<StressVisualization data={highStressData} compact />);
      // 3개 중 2개만 표시
      expect(screen.getByText(/진정 성분/)).toBeInTheDocument();
      expect(screen.getByText(/가벼운 산책/)).toBeInTheDocument();
      expect(screen.queryByText(/수면 시간/)).not.toBeInTheDocument();
    });
  });

  describe('주간 트렌드', () => {
    it('트렌드 데이터가 있으면 표시된다', () => {
      render(<StressVisualization data={highStressData} trend={trendData} />);
      expect(screen.getByTestId('weekly-trend')).toBeInTheDocument();
    });

    it('트렌드 메시지가 표시된다', () => {
      render(<StressVisualization data={highStressData} trend={trendData} />);
      expect(screen.getByText(/스트레스가 줄어들고 있어요/)).toBeInTheDocument();
    });

    it('트렌드 데이터가 없으면 표시되지 않는다', () => {
      render(<StressVisualization data={highStressData} />);
      expect(screen.queryByTestId('weekly-trend')).not.toBeInTheDocument();
    });
  });

  describe('스타일링', () => {
    it('className prop이 적용된다', () => {
      render(<StressVisualization data={highStressData} className="custom-class" />);
      expect(screen.getByTestId('stress-visualization')).toHaveClass('custom-class');
    });
  });
});
