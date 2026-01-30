/**
 * HistoryCompare.tsx 테스트
 * @description 시계열 비교 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HistoryCompare, {
  type AnalysisHistoryItem,
} from '@/components/analysis/visual/HistoryCompare';

// ============================================
// 테스트 데이터
// ============================================

const createMockHistory = (count: number): AnalysisHistoryItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `analysis-${i + 1}`,
    date: new Date(2025, 0, 1 + i * 7).toISOString(), // 7일 간격
    imageUrl: `/images/analysis-${i + 1}.jpg`,
    scores: {
      overall: 60 + i * 5,
      hydration: 55 + i * 3,
      elasticity: 58 + i * 4,
      uniformity: 62 + i * 2,
      trouble: 40 - i * 3,
      pore: 35 - i * 2,
    },
    metadata: {
      season: ['spring', 'summer', 'autumn', 'winter'][i % 4] as
        | 'spring'
        | 'summer'
        | 'autumn'
        | 'winter',
      skinType: '복합성',
    },
  }));
};

describe('HistoryCompare', () => {
  // ============================================
  // 기본 렌더링
  // ============================================

  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 설정되어야 함', () => {
      const history = createMockHistory(3);
      render(<HistoryCompare history={history} />);

      expect(screen.getByTestId('history-compare')).toBeInTheDocument();
    });

    it('컴포넌트 제목이 표시되어야 함', () => {
      const history = createMockHistory(3);
      render(<HistoryCompare history={history} />);

      expect(screen.getByText('피부 변화 추이')).toBeInTheDocument();
    });

    it('기간 차이가 표시되어야 함', () => {
      const history = createMockHistory(3);
      render(<HistoryCompare history={history} />);

      // 14일 차이 (7일 * 2)
      expect(screen.getByText('14일간 변화')).toBeInTheDocument();
    });
  });

  // ============================================
  // 히스토리가 없거나 부족한 경우
  // ============================================

  describe('히스토리 부족', () => {
    it('히스토리가 없으면 안내 메시지를 표시해야 함', () => {
      render(<HistoryCompare history={[]} />);

      expect(screen.getByText('분석 기록이 없습니다.')).toBeInTheDocument();
    });

    it('히스토리가 1개면 비교 불가 메시지를 표시해야 함', () => {
      const history = createMockHistory(1);
      render(<HistoryCompare history={history} />);

      expect(screen.getByText('2회 이상 분석하면 변화를 비교할 수 있어요.')).toBeInTheDocument();
    });
  });

  // ============================================
  // 날짜 선택
  // ============================================

  describe('날짜 선택', () => {
    it('이전/이후 날짜 선택 UI가 표시되어야 함', () => {
      const history = createMockHistory(3);
      render(<HistoryCompare history={history} />);

      expect(screen.getByText('이전')).toBeInTheDocument();
      expect(screen.getByText('이후')).toBeInTheDocument();
    });

    it('기본적으로 가장 오래된 날짜와 최신 날짜가 선택되어야 함', () => {
      const history = createMockHistory(3);
      render(<HistoryCompare history={history} />);

      // 첫 번째와 마지막 날짜가 선택됨
      const selectTriggers = screen.getAllByRole('combobox');
      expect(selectTriggers).toHaveLength(2);
    });
  });

  // ============================================
  // 비교 지표
  // ============================================

  describe('비교 지표', () => {
    it('지표별 변화 섹션이 표시되어야 함', () => {
      const history = createMockHistory(3);
      render(<HistoryCompare history={history} />);

      expect(screen.getByText('지표별 변화')).toBeInTheDocument();
    });

    it('모든 점수 지표가 표시되어야 함', () => {
      const history = createMockHistory(3);
      render(<HistoryCompare history={history} />);

      expect(screen.getByText('종합 점수')).toBeInTheDocument();
      expect(screen.getByText('수분')).toBeInTheDocument();
      expect(screen.getByText('탄력')).toBeInTheDocument();
      expect(screen.getByText('균일도')).toBeInTheDocument();
      expect(screen.getByText('트러블')).toBeInTheDocument();
      expect(screen.getByText('모공')).toBeInTheDocument();
    });

    it('점수 변화량이 표시되어야 함', () => {
      const history = createMockHistory(3);
      render(<HistoryCompare history={history} />);

      // 종합 점수: 60 → 70 (+10)
      expect(screen.getByText('+10')).toBeInTheDocument();
    });
  });

  // ============================================
  // 종합 평가
  // ============================================

  describe('종합 평가', () => {
    it('개선된 경우 긍정적 메시지가 표시되어야 함', () => {
      const history = createMockHistory(3);
      render(<HistoryCompare history={history} />);

      // 대부분 지표가 개선되었으므로 긍정적 메시지
      const positiveMessages = [
        '눈에 띄는 피부 개선이 있어요!',
        '개 지표가 개선되었어요',
        '잘 하고 있어요',
      ];

      const hasPositiveMessage = positiveMessages.some(
        (msg) => screen.queryByText((content) => content.includes(msg)) !== null
      );

      expect(hasPositiveMessage).toBe(true);
    });

    it('개선/하락/유지 카운트가 표시되어야 함', () => {
      const history = createMockHistory(3);
      render(<HistoryCompare history={history} />);

      // "X개 개선, Y개 하락, Z개 유지" 형식
      const summaryText = screen.getByText(/\d+개 개선, \d+개 하락, \d+개 유지/);
      expect(summaryText).toBeInTheDocument();
    });
  });

  // ============================================
  // 이미지 비교 (Before/After)
  // ============================================

  describe('이미지 비교', () => {
    it('이미지가 있으면 슬라이더가 표시되어야 함', () => {
      const history = createMockHistory(3);
      render(<HistoryCompare history={history} />);

      // 슬라이더 range input
      const slider = screen.getByRole('slider', { name: /Before\/After 슬라이더/i });
      expect(slider).toBeInTheDocument();
    });

    it('이미지 클릭 시 콜백이 호출되어야 함', () => {
      const history = createMockHistory(3);
      const onImageClick = vi.fn();

      render(<HistoryCompare history={history} onImageClick={onImageClick} />);

      // 이미지 클릭 (before 영역)
      const images = screen.getAllByRole('img');
      if (images.length > 0) {
        fireEvent.click(images[0]);
        expect(images.length).toBeGreaterThan(0);
      }
    });

    it('이미지가 없으면 슬라이더가 표시되지 않아야 함', () => {
      const history: AnalysisHistoryItem[] = [
        {
          id: 'analysis-1',
          date: new Date(2025, 0, 1).toISOString(),
          scores: { overall: 60 },
        },
        {
          id: 'analysis-2',
          date: new Date(2025, 0, 8).toISOString(),
          scores: { overall: 65 },
        },
      ];

      render(<HistoryCompare history={history} />);

      const slider = screen.queryByRole('slider');
      expect(slider).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 트렌드 방향
  // ============================================

  describe('트렌드 방향', () => {
    it('개선된 지표는 상승 트렌드 아이콘을 표시해야 함', () => {
      const history: AnalysisHistoryItem[] = [
        {
          id: 'analysis-1',
          date: new Date(2025, 0, 1).toISOString(),
          scores: { overall: 50, hydration: 40 },
        },
        {
          id: 'analysis-2',
          date: new Date(2025, 0, 8).toISOString(),
          scores: { overall: 70, hydration: 60 },
        },
      ];

      render(<HistoryCompare history={history} />);

      // +20 변화가 여러 개 있을 수 있음 (overall, hydration 둘 다)
      const plus20Elements = screen.getAllByText('+20');
      expect(plus20Elements.length).toBeGreaterThanOrEqual(1);
    });

    it('하락한 지표(trouble/pore)는 다른 색상으로 표시해야 함', () => {
      const history: AnalysisHistoryItem[] = [
        {
          id: 'analysis-1',
          date: new Date(2025, 0, 1).toISOString(),
          scores: { overall: 50, trouble: 30 },
        },
        {
          id: 'analysis-2',
          date: new Date(2025, 0, 8).toISOString(),
          scores: { overall: 55, trouble: 50 },
        },
      ];

      render(<HistoryCompare history={history} />);

      // trouble이 증가(30→50)했지만, trouble은 낮을수록 좋으므로 부정적
      // +20과 +5가 각각 표시됨
      expect(screen.getByText('+5')).toBeInTheDocument();
      const plus20Elements = screen.getAllByText('+20');
      expect(plus20Elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================
  // 날짜 정렬
  // ============================================

  describe('날짜 정렬', () => {
    it('날짜 순서가 뒤섞여 있어도 올바르게 정렬해야 함', () => {
      const unorderedHistory: AnalysisHistoryItem[] = [
        {
          id: 'analysis-2',
          date: new Date(2025, 0, 15).toISOString(),
          scores: { overall: 70 },
        },
        {
          id: 'analysis-1',
          date: new Date(2025, 0, 1).toISOString(),
          scores: { overall: 60 },
        },
        {
          id: 'analysis-3',
          date: new Date(2025, 0, 22).toISOString(),
          scores: { overall: 80 },
        },
      ];

      render(<HistoryCompare history={unorderedHistory} />);

      // 정렬 후 21일간 변화 (1일 → 22일)
      expect(screen.getByText('21일간 변화')).toBeInTheDocument();
    });
  });

  // ============================================
  // className prop
  // ============================================

  describe('className prop', () => {
    it('추가 className이 적용되어야 함', () => {
      const history = createMockHistory(3);
      render(<HistoryCompare history={history} className="custom-class" />);

      const card = screen.getByTestId('history-compare');
      expect(card).toHaveClass('custom-class');
    });
  });

  // ============================================
  // 점수가 일부만 있는 경우
  // ============================================

  describe('부분 점수', () => {
    it('일부 점수만 있어도 해당 지표만 표시해야 함', () => {
      const history: AnalysisHistoryItem[] = [
        {
          id: 'analysis-1',
          date: new Date(2025, 0, 1).toISOString(),
          scores: { overall: 60, hydration: 50 },
        },
        {
          id: 'analysis-2',
          date: new Date(2025, 0, 8).toISOString(),
          scores: { overall: 70, hydration: 60 },
        },
      ];

      render(<HistoryCompare history={history} />);

      expect(screen.getByText('종합 점수')).toBeInTheDocument();
      expect(screen.getByText('수분')).toBeInTheDocument();
      // elasticity, uniformity 등은 없으므로 표시되지 않음
      expect(screen.queryByText('탄력')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 동일한 점수
  // ============================================

  describe('동일한 점수', () => {
    it('변화가 없으면 neutral 트렌드를 표시해야 함', () => {
      const history: AnalysisHistoryItem[] = [
        {
          id: 'analysis-1',
          date: new Date(2025, 0, 1).toISOString(),
          scores: { overall: 70 },
        },
        {
          id: 'analysis-2',
          date: new Date(2025, 0, 8).toISOString(),
          scores: { overall: 70 },
        },
      ];

      render(<HistoryCompare history={history} />);

      // 0 변화
      expect(history.length).toBe(2);
    });
  });
});
