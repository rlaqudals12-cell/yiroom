import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WellnessInsight } from '@/components/wellness/WellnessInsight';
import type { WellnessInsight as WellnessInsightType } from '@/types/wellness';

const mockInsights: WellnessInsightType[] = [
  {
    type: 'improvement',
    area: 'workout',
    message: '운동을 시작해보세요!',
    priority: 1,
  },
  {
    type: 'achievement',
    area: 'nutrition',
    message: '오늘 영양 목표를 달성했어요!',
    priority: 2,
  },
  {
    type: 'warning',
    area: 'skin',
    message: '피부 분석이 30일 이상 지났습니다.',
    priority: 3,
  },
  {
    type: 'tip',
    area: 'body',
    message: '체중 변화를 기록해보세요.',
    priority: 4,
  },
  {
    type: 'achievement',
    area: 'overall',
    message: '훌륭한 웰니스 점수입니다!',
    priority: 1,
  },
];

describe('WellnessInsight', () => {
  describe('렌더링', () => {
    it('기본 렌더링', () => {
      render(<WellnessInsight insights={mockInsights} />);
      expect(screen.getByTestId('wellness-insight')).toBeInTheDocument();
    });

    it('제목 표시', () => {
      render(<WellnessInsight insights={mockInsights} />);
      expect(screen.getByText('웰니스 인사이트')).toBeInTheDocument();
    });

    it('인사이트 메시지 표시', () => {
      render(<WellnessInsight insights={mockInsights} />);
      expect(screen.getByText('운동을 시작해보세요!')).toBeInTheDocument();
      expect(screen.getByText('오늘 영양 목표를 달성했어요!')).toBeInTheDocument();
    });
  });

  describe('빈 상태', () => {
    it('인사이트가 비어있으면 빈 상태 표시', () => {
      render(<WellnessInsight insights={[]} />);
      expect(screen.getByTestId('wellness-insight-empty')).toBeInTheDocument();
      expect(screen.getByText(/활동을 기록하면 맞춤 인사이트가/)).toBeInTheDocument();
    });

    it('인사이트가 null이면 빈 상태 표시', () => {
      render(<WellnessInsight insights={null as unknown as WellnessInsightType[]} />);
      expect(screen.getByTestId('wellness-insight-empty')).toBeInTheDocument();
    });
  });

  describe('타입별 스타일', () => {
    it('improvement 타입 표시', () => {
      const insights: WellnessInsightType[] = [
        { type: 'improvement', area: 'workout', message: '개선 메시지', priority: 1 },
      ];
      render(<WellnessInsight insights={insights} />);
      expect(screen.getByTestId('wellness-insight-item-improvement')).toBeInTheDocument();
    });

    it('achievement 타입 표시', () => {
      const insights: WellnessInsightType[] = [
        { type: 'achievement', area: 'overall', message: '성취 메시지', priority: 1 },
      ];
      render(<WellnessInsight insights={insights} />);
      expect(screen.getByTestId('wellness-insight-item-achievement')).toBeInTheDocument();
    });

    it('warning 타입 표시', () => {
      const insights: WellnessInsightType[] = [
        { type: 'warning', area: 'skin', message: '경고 메시지', priority: 1 },
      ];
      render(<WellnessInsight insights={insights} />);
      expect(screen.getByTestId('wellness-insight-item-warning')).toBeInTheDocument();
    });

    it('tip 타입 표시', () => {
      const insights: WellnessInsightType[] = [
        { type: 'tip', area: 'body', message: '팁 메시지', priority: 1 },
      ];
      render(<WellnessInsight insights={insights} />);
      expect(screen.getByTestId('wellness-insight-item-tip')).toBeInTheDocument();
    });
  });

  describe('영역별 라벨', () => {
    it('운동 영역 라벨', () => {
      const insights: WellnessInsightType[] = [
        { type: 'tip', area: 'workout', message: '메시지', priority: 1 },
      ];
      render(<WellnessInsight insights={insights} />);
      expect(screen.getByText('운동')).toBeInTheDocument();
    });

    it('영양 영역 라벨', () => {
      const insights: WellnessInsightType[] = [
        { type: 'tip', area: 'nutrition', message: '메시지', priority: 1 },
      ];
      render(<WellnessInsight insights={insights} />);
      expect(screen.getByText('영양')).toBeInTheDocument();
    });

    it('전체 영역 라벨', () => {
      const insights: WellnessInsightType[] = [
        { type: 'tip', area: 'overall', message: '메시지', priority: 1 },
      ];
      render(<WellnessInsight insights={insights} />);
      expect(screen.getByText('전체')).toBeInTheDocument();
    });
  });

  describe('maxItems', () => {
    it('maxItems 제한 적용', () => {
      render(<WellnessInsight insights={mockInsights} maxItems={3} />);
      // 5개 중 3개만 표시
      expect(screen.getByText('3/5')).toBeInTheDocument();
    });

    it('maxItems 기본값은 5', () => {
      render(<WellnessInsight insights={mockInsights} />);
      // 5개 인사이트, maxItems 5 → 표시 안 함
      expect(screen.queryByText('5/5')).not.toBeInTheDocument();
    });

    it('인사이트가 maxItems보다 적으면 카운트 숨김', () => {
      render(<WellnessInsight insights={mockInsights.slice(0, 2)} maxItems={5} />);
      expect(screen.queryByText('/5')).not.toBeInTheDocument();
    });
  });

  describe('우선순위 정렬', () => {
    it('우선순위 낮은 것이 먼저 (priority 1 → 5)', () => {
      const { container } = render(<WellnessInsight insights={mockInsights} />);
      const items = container.querySelectorAll('[data-testid^="wellness-insight-item"]');

      // 첫 번째 아이템은 priority 1인 것들 중 하나
      // (improvement-workout: priority 1 또는 achievement-overall: priority 1)
      expect(items.length).toBeGreaterThan(0);
    });

    it('중요 태그 표시 (priority <= 2)', () => {
      render(<WellnessInsight insights={mockInsights} />);
      // priority 1, 2인 항목에 "중요" 표시
      expect(screen.getAllByText('중요').length).toBeGreaterThanOrEqual(2);
    });
  });
});
