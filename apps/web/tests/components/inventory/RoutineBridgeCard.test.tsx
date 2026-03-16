/**
 * RoutineBridgeCard 컴포넌트 테스트
 *
 * @description 인벤토리-루틴 브릿지 카드 UI 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoutineBridgeCard } from '@/components/inventory/RoutineBridgeCard';
import type { RoutineInventoryResult } from '@/lib/inventory/routine-bridge';

// 완전한 루틴 결과
const fullResult: RoutineInventoryResult = {
  orderedSteps: [],
  stepMatches: [
    {
      step: 'cleansing',
      stepLabel: '클렌징',
      matchedProducts: [{ id: '1', name: '순한 클렌저' }],
      isMissing: false,
    },
    {
      step: 'toner',
      stepLabel: '토너',
      matchedProducts: [{ id: '2', name: '수분 토너' }],
      isMissing: false,
    },
    {
      step: 'serum',
      stepLabel: '세럼',
      matchedProducts: [],
      isMissing: true,
    },
    {
      step: 'cream',
      stepLabel: '크림',
      matchedProducts: [{ id: '3', name: '보습 크림', remainingPercent: 15 }],
      isMissing: false,
    },
    {
      step: 'sunscreen',
      stepLabel: '선크림',
      matchedProducts: [{ id: '4', name: 'SPF50 선크림' }],
      isMissing: false,
    },
  ],
  missingSteps: ['serum'],
  coveragePercent: 80,
  lowStockProducts: [{ id: '3', name: '보습 크림', remainingPercent: 15 }],
};

// 빈 루틴 결과
const emptyResult: RoutineInventoryResult = {
  orderedSteps: [],
  stepMatches: [
    { step: 'cleansing', stepLabel: '클렌징', matchedProducts: [], isMissing: true },
    { step: 'toner', stepLabel: '토너', matchedProducts: [], isMissing: true },
    { step: 'serum', stepLabel: '세럼', matchedProducts: [], isMissing: true },
    { step: 'cream', stepLabel: '크림', matchedProducts: [], isMissing: true },
    { step: 'sunscreen', stepLabel: '선크림', matchedProducts: [], isMissing: true },
  ],
  missingSteps: ['cleansing', 'toner', 'serum', 'cream', 'sunscreen'],
  coveragePercent: 0,
  lowStockProducts: [],
};

describe('RoutineBridgeCard', () => {
  describe('렌더링', () => {
    it('카드가 정상적으로 렌더링된다', () => {
      render(<RoutineBridgeCard result={fullResult} />);
      expect(screen.getByTestId('routine-bridge-card')).toBeInTheDocument();
    });

    it('시간대 라벨이 표시된다', () => {
      render(<RoutineBridgeCard result={fullResult} timeOfDay="morning" />);
      expect(screen.getByText('아침 루틴 현황')).toBeInTheDocument();
    });

    it('저녁 라벨이 표시된다', () => {
      render(<RoutineBridgeCard result={fullResult} timeOfDay="evening" />);
      expect(screen.getByText('저녁 루틴 현황')).toBeInTheDocument();
    });

    it('요약 메시지가 표시된다', () => {
      render(
        <RoutineBridgeCard result={fullResult} summaryMessage="아침 루틴이 거의 완성이에요!" />
      );
      expect(screen.getByText('아침 루틴이 거의 완성이에요!')).toBeInTheDocument();
    });
  });

  describe('완성도 바', () => {
    it('완성도 퍼센트가 표시된다', () => {
      render(<RoutineBridgeCard result={fullResult} />);
      expect(screen.getByTestId('coverage-bar')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('0% 완성도가 표시된다', () => {
      render(<RoutineBridgeCard result={emptyResult} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('루틴 단계', () => {
    it('모든 루틴 단계가 표시된다', () => {
      render(<RoutineBridgeCard result={fullResult} />);
      expect(screen.getAllByTestId('routine-step-item')).toHaveLength(5);
    });

    it('단계 라벨이 표시된다', () => {
      render(<RoutineBridgeCard result={fullResult} />);
      expect(screen.getByText('클렌징')).toBeInTheDocument();
      expect(screen.getByText('토너')).toBeInTheDocument();
      expect(screen.getByText('세럼')).toBeInTheDocument();
    });

    it('매칭된 제품명이 표시된다', () => {
      render(<RoutineBridgeCard result={fullResult} />);
      expect(screen.getByText('순한 클렌저')).toBeInTheDocument();
      expect(screen.getByText('수분 토너')).toBeInTheDocument();
    });

    it('누락 단계에 "없음" 배지가 표시된다', () => {
      render(<RoutineBridgeCard result={fullResult} />);
      expect(screen.getByText('없음')).toBeInTheDocument();
    });
  });

  describe('누락 단계 알림', () => {
    it('누락 메시지가 있으면 알림이 표시된다', () => {
      render(
        <RoutineBridgeCard
          result={fullResult}
          missingMessages={['세럼이(가) 없어요. 추가하면 루틴이 완성돼요!']}
        />
      );
      expect(screen.getByTestId('missing-step-alert')).toBeInTheDocument();
      expect(screen.getByText(/세럼이\(가\) 없어요/)).toBeInTheDocument();
    });

    it('누락 메시지가 없으면 알림이 숨겨진다', () => {
      render(<RoutineBridgeCard result={fullResult} missingMessages={[]} />);
      expect(screen.queryByTestId('missing-step-alert')).not.toBeInTheDocument();
    });
  });

  describe('재구매 필요', () => {
    it('잔여량 부족 제품이 표시된다', () => {
      render(<RoutineBridgeCard result={fullResult} />);
      expect(screen.getByTestId('low-stock-section')).toBeInTheDocument();
      expect(screen.getByText('재구매 필요')).toBeInTheDocument();
    });

    it('잔여량 부족 제품이 없으면 섹션이 숨겨진다', () => {
      render(<RoutineBridgeCard result={emptyResult} />);
      expect(screen.queryByTestId('low-stock-section')).not.toBeInTheDocument();
    });
  });

  describe('제품 추가 버튼', () => {
    it('누락 단계가 있고 onAddProduct이 있으면 버튼이 표시된다', () => {
      const onAdd = vi.fn();
      render(<RoutineBridgeCard result={fullResult} onAddProduct={onAdd} />);
      expect(screen.getByText('부족한 제품 추가하기')).toBeInTheDocument();
    });

    it('클릭 시 onAddProduct이 호출된다', () => {
      const onAdd = vi.fn();
      render(<RoutineBridgeCard result={fullResult} onAddProduct={onAdd} />);
      fireEvent.click(screen.getByText('부족한 제품 추가하기'));
      expect(onAdd).toHaveBeenCalled();
    });
  });

  describe('스타일링', () => {
    it('className prop이 적용된다', () => {
      render(<RoutineBridgeCard result={fullResult} className="custom-class" />);
      expect(screen.getByTestId('routine-bridge-card')).toHaveClass('custom-class');
    });
  });
});
