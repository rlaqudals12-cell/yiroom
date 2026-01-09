/**
 * N-1 간헐적 단식 타이머 컴포넌트 테스트
 * Task 2.17: 간헐적 단식 타이머
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

import FastingTimer from '@/components/nutrition/FastingTimer';

// 테스트용 현재 시간 설정 헬퍼
const setMockTime = (hour: number, minute: number = 0) => {
  const mockDate = new Date();
  mockDate.setHours(hour, minute, 0, 0);
  vi.setSystemTime(mockDate);
};

describe('FastingTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('비활성화 상태', () => {
    it('단식이 비활성화되면 활성화 유도 메시지를 표시한다', () => {
      render(
        <FastingTimer
          enabled={false}
          fastingType={null}
          fastingStartTime={null}
          eatingWindowHours={null}
        />
      );

      expect(screen.getByTestId('fasting-timer')).toBeInTheDocument();
      expect(screen.getByText('간헐적 단식')).toBeInTheDocument();
      expect(screen.getByText(/설정하기/)).toBeInTheDocument();
    });

    it('설정하기 버튼 클릭 시 설정 페이지로 이동한다', () => {
      render(
        <FastingTimer
          enabled={false}
          fastingType={null}
          fastingStartTime={null}
          eatingWindowHours={null}
        />
      );

      const settingsButton = screen.getByText(/설정하기/);
      fireEvent.click(settingsButton);

      expect(mockPush).toHaveBeenCalledWith('/nutrition/fasting');
    });
  });

  describe('단식 중 상태', () => {
    it('단식 시간에는 "단식 중" 상태를 표시한다', () => {
      // 현재 시간: 22:00 (단식 시간)
      // 단식 시작: 20:00, 8시간 식사 = 12:00~20:00 식사 가능
      setMockTime(22, 0);

      render(
        <FastingTimer
          enabled={true}
          fastingType="16:8"
          fastingStartTime="20:00"
          eatingWindowHours={8}
        />
      );

      expect(screen.getByText('단식 중')).toBeInTheDocument();
      expect(screen.getByTestId('fasting-status-icon')).toHaveClass('text-purple-600');
    });

    it('단식 중 남은 시간을 표시한다', () => {
      // 현재 시간: 22:00
      // 단식 시작: 20:00, 16시간 단식 = 다음날 12:00에 식사 가능
      // 남은 시간: 14시간
      setMockTime(22, 0);

      render(
        <FastingTimer
          enabled={true}
          fastingType="16:8"
          fastingStartTime="20:00"
          eatingWindowHours={8}
        />
      );

      // 남은 시간이 표시되어야 함
      expect(screen.getByTestId('remaining-time')).toBeInTheDocument();
      expect(screen.getByText(/14시간/)).toBeInTheDocument();
    });

    it('단식 시작 시간과 식사 가능 시간을 표시한다', () => {
      setMockTime(22, 0);

      render(
        <FastingTimer
          enabled={true}
          fastingType="16:8"
          fastingStartTime="20:00"
          eatingWindowHours={8}
        />
      );

      // 20:00은 "단식 시작"과 "식사 가능 시간" 모두에 표시됨
      expect(screen.getAllByText(/20:00/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/12:00 ~ 20:00/)).toBeInTheDocument();
    });
  });

  describe('식사 가능 상태', () => {
    it('식사 가능 시간에는 "식사 가능" 상태를 표시한다', () => {
      // 현재 시간: 14:00 (식사 가능 시간)
      // 단식 시작: 20:00, 8시간 식사 = 12:00~20:00 식사 가능
      setMockTime(14, 0);

      render(
        <FastingTimer
          enabled={true}
          fastingType="16:8"
          fastingStartTime="20:00"
          eatingWindowHours={8}
        />
      );

      expect(screen.getByText('식사 가능')).toBeInTheDocument();
      expect(screen.getByTestId('fasting-status-icon')).toHaveClass('text-green-600');
    });

    it('식사 가능 시간에 남은 식사 가능 시간을 표시한다', () => {
      // 현재 시간: 14:00
      // 식사 가능 시간: 12:00~20:00
      // 남은 식사 가능 시간: 6시간
      setMockTime(14, 0);

      render(
        <FastingTimer
          enabled={true}
          fastingType="16:8"
          fastingStartTime="20:00"
          eatingWindowHours={8}
        />
      );

      expect(screen.getByTestId('remaining-time')).toBeInTheDocument();
      expect(screen.getByText(/6시간/)).toBeInTheDocument();
    });
  });

  describe('다양한 단식 유형', () => {
    it('18:6 유형을 올바르게 표시한다', () => {
      setMockTime(14, 0);

      render(
        <FastingTimer
          enabled={true}
          fastingType="18:6"
          fastingStartTime="20:00"
          eatingWindowHours={6}
        />
      );

      expect(screen.getByText('18:6')).toBeInTheDocument();
    });

    it('20:4 유형을 올바르게 표시한다', () => {
      setMockTime(14, 0);

      render(
        <FastingTimer
          enabled={true}
          fastingType="20:4"
          fastingStartTime="20:00"
          eatingWindowHours={4}
        />
      );

      expect(screen.getByText('20:4')).toBeInTheDocument();
    });

    it('커스텀 유형을 올바르게 표시한다', () => {
      setMockTime(14, 0);

      render(
        <FastingTimer
          enabled={true}
          fastingType="custom"
          fastingStartTime="21:00"
          eatingWindowHours={7}
        />
      );

      expect(screen.getByText('커스텀')).toBeInTheDocument();
    });
  });

  describe('설정 버튼', () => {
    it('설정 버튼이 표시된다', () => {
      setMockTime(14, 0);

      render(
        <FastingTimer
          enabled={true}
          fastingType="16:8"
          fastingStartTime="20:00"
          eatingWindowHours={8}
        />
      );

      expect(screen.getByLabelText('단식 설정')).toBeInTheDocument();
    });

    it('설정 버튼 클릭 시 설정 페이지로 이동한다', () => {
      setMockTime(14, 0);

      render(
        <FastingTimer
          enabled={true}
          fastingType="16:8"
          fastingStartTime="20:00"
          eatingWindowHours={8}
        />
      );

      const settingsButton = screen.getByLabelText('단식 설정');
      fireEvent.click(settingsButton);

      expect(mockPush).toHaveBeenCalledWith('/nutrition/fasting');
    });
  });

  describe('프로그레스 표시', () => {
    it('단식 진행률을 표시한다', () => {
      setMockTime(22, 0);

      render(
        <FastingTimer
          enabled={true}
          fastingType="16:8"
          fastingStartTime="20:00"
          eatingWindowHours={8}
        />
      );

      expect(screen.getByTestId('fasting-progress')).toBeInTheDocument();
    });
  });

  describe('컴팩트 모드', () => {
    it('compact 모드에서는 간소화된 UI를 표시한다', () => {
      setMockTime(14, 0);

      render(
        <FastingTimer
          enabled={true}
          fastingType="16:8"
          fastingStartTime="20:00"
          eatingWindowHours={8}
          compact={true}
        />
      );

      expect(screen.getByTestId('fasting-timer-compact')).toBeInTheDocument();
    });
  });

  describe('시간 계산 로직', () => {
    it('자정을 넘어가는 단식 시간을 올바르게 계산한다', () => {
      // 단식 시작: 20:00, 16시간 단식
      // 식사 가능 시간: 12:00~20:00 (다음날 12:00부터)
      // 현재: 02:00 (다음날 새벽)
      // 남은 단식 시간: 10시간
      setMockTime(2, 0);

      render(
        <FastingTimer
          enabled={true}
          fastingType="16:8"
          fastingStartTime="20:00"
          eatingWindowHours={8}
        />
      );

      expect(screen.getByText('단식 중')).toBeInTheDocument();
      expect(screen.getByText(/10시간/)).toBeInTheDocument();
    });

    it('식사 시작 직후 시간을 올바르게 계산한다', () => {
      // 단식 시작: 20:00, 16시간 단식
      // 식사 가능 시간: 12:00~20:00
      // 현재: 12:30
      // 남은 식사 가능 시간: 7시간 30분
      setMockTime(12, 30);

      render(
        <FastingTimer
          enabled={true}
          fastingType="16:8"
          fastingStartTime="20:00"
          eatingWindowHours={8}
        />
      );

      expect(screen.getByText('식사 가능')).toBeInTheDocument();
      expect(screen.getByText(/7시간 30분/)).toBeInTheDocument();
    });
  });
});
