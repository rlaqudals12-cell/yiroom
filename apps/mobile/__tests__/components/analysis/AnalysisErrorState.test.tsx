/**
 * AnalysisErrorState 컴포넌트 테스트
 *
 * 대상: components/analysis/AnalysisErrorState.tsx
 * 분석 실패 시 표시되는 공통 에러 UI 검증
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { AnalysisErrorState } from '../../../components/analysis/AnalysisErrorState';

describe('AnalysisErrorState', () => {
  describe('기본 렌더링', () => {
    it('기본 testID "analysis-error"가 존재해야 한다', () => {
      const { getByTestId } = render(<AnalysisErrorState />);
      expect(getByTestId('analysis-error')).toBeTruthy();
    });

    it('커스텀 testID를 사용할 수 있어야 한다', () => {
      const { getByTestId } = render(
        <AnalysisErrorState testID="custom-error" />
      );
      expect(getByTestId('custom-error')).toBeTruthy();
    });

    it('기본 에러 메시지가 표시되어야 한다', () => {
      const { getByText } = render(<AnalysisErrorState />);
      expect(getByText('분석에 실패했습니다.')).toBeTruthy();
    });

    it('커스텀 에러 메시지가 표시되어야 한다', () => {
      const { getByText } = render(
        <AnalysisErrorState message="네트워크 오류가 발생했습니다." />
      );
      expect(getByText('네트워크 오류가 발생했습니다.')).toBeTruthy();
    });

    it('accessibilityRole이 "alert"이어야 한다', () => {
      const { getByTestId } = render(<AnalysisErrorState />);
      expect(getByTestId('analysis-error').props.accessibilityRole).toBe(
        'alert'
      );
    });
  });

  describe('재시도 버튼', () => {
    it('onRetry가 없으면 재시도 버튼이 표시되지 않아야 한다', () => {
      const { queryByTestId } = render(<AnalysisErrorState />);
      expect(queryByTestId('analysis-error-retry')).toBeNull();
    });

    it('onRetry가 있으면 재시도 버튼이 표시되어야 한다', () => {
      const mockRetry = jest.fn();
      const { getByTestId } = render(
        <AnalysisErrorState onRetry={mockRetry} />
      );
      expect(getByTestId('analysis-error-retry')).toBeTruthy();
    });

    it('기본 재시도 버튼 텍스트는 "다시 시도하기"여야 한다', () => {
      const mockRetry = jest.fn();
      const { getByText } = render(
        <AnalysisErrorState onRetry={mockRetry} />
      );
      expect(getByText('다시 시도하기')).toBeTruthy();
    });

    it('커스텀 재시도 버튼 텍스트를 사용할 수 있어야 한다', () => {
      const mockRetry = jest.fn();
      const { getByText } = render(
        <AnalysisErrorState onRetry={mockRetry} retryText="재분석" />
      );
      expect(getByText('재분석')).toBeTruthy();
    });

    it('재시도 버튼 클릭 시 onRetry 콜백이 호출되어야 한다', () => {
      const mockRetry = jest.fn();
      const { getByTestId } = render(
        <AnalysisErrorState onRetry={mockRetry} />
      );

      fireEvent.press(getByTestId('analysis-error-retry'));
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('재시도 버튼의 accessibilityRole이 "button"이어야 한다', () => {
      const mockRetry = jest.fn();
      const { getByTestId } = render(
        <AnalysisErrorState onRetry={mockRetry} />
      );
      expect(
        getByTestId('analysis-error-retry').props.accessibilityRole
      ).toBe('button');
    });

    it('재시도 버튼의 accessibilityLabel이 retryText와 일치해야 한다', () => {
      const mockRetry = jest.fn();
      const { getByTestId } = render(
        <AnalysisErrorState onRetry={mockRetry} retryText="다시 분석" />
      );
      expect(
        getByTestId('analysis-error-retry').props.accessibilityLabel
      ).toBe('다시 분석');
    });
  });

  describe('홈으로 돌아가기 버튼', () => {
    it('onGoHome이 없으면 홈 버튼이 표시되지 않아야 한다', () => {
      const { queryByTestId } = render(<AnalysisErrorState />);
      expect(queryByTestId('analysis-error-home')).toBeNull();
    });

    it('onGoHome이 있으면 홈 버튼이 표시되어야 한다', () => {
      const mockGoHome = jest.fn();
      const { getByTestId } = render(
        <AnalysisErrorState onGoHome={mockGoHome} />
      );
      expect(getByTestId('analysis-error-home')).toBeTruthy();
    });

    it('"홈으로 돌아가기" 텍스트가 표시되어야 한다', () => {
      const mockGoHome = jest.fn();
      const { getByText } = render(
        <AnalysisErrorState onGoHome={mockGoHome} />
      );
      expect(getByText('홈으로 돌아가기')).toBeTruthy();
    });

    it('홈 버튼 클릭 시 onGoHome 콜백이 호출되어야 한다', () => {
      const mockGoHome = jest.fn();
      const { getByTestId } = render(
        <AnalysisErrorState onGoHome={mockGoHome} />
      );

      fireEvent.press(getByTestId('analysis-error-home'));
      expect(mockGoHome).toHaveBeenCalledTimes(1);
    });

    it('홈 버튼의 accessibilityLabel이 "홈으로 돌아가기"여야 한다', () => {
      const mockGoHome = jest.fn();
      const { getByTestId } = render(
        <AnalysisErrorState onGoHome={mockGoHome} />
      );
      expect(
        getByTestId('analysis-error-home').props.accessibilityLabel
      ).toBe('홈으로 돌아가기');
    });
  });

  describe('버튼 조합', () => {
    it('재시도와 홈 버튼 모두 표시할 수 있어야 한다', () => {
      const mockRetry = jest.fn();
      const mockGoHome = jest.fn();
      const { getByTestId } = render(
        <AnalysisErrorState onRetry={mockRetry} onGoHome={mockGoHome} />
      );

      expect(getByTestId('analysis-error-retry')).toBeTruthy();
      expect(getByTestId('analysis-error-home')).toBeTruthy();
    });

    it('버튼 없이 에러 메시지만 표시할 수 있어야 한다', () => {
      const { getByText, queryByTestId } = render(
        <AnalysisErrorState message="서버 점검 중입니다." />
      );

      expect(getByText('서버 점검 중입니다.')).toBeTruthy();
      expect(queryByTestId('analysis-error-retry')).toBeNull();
      expect(queryByTestId('analysis-error-home')).toBeNull();
    });
  });

  describe('다크 모드', () => {
    it('isDark=true에서도 정상 렌더링되어야 한다', () => {
      const { getByTestId, getByText } = render(
        <AnalysisErrorState isDark={true} />
      );
      expect(getByTestId('analysis-error')).toBeTruthy();
      expect(getByText('분석에 실패했습니다.')).toBeTruthy();
    });

    it('다크 모드에서 재시도/홈 버튼이 정상 동작해야 한다', () => {
      const mockRetry = jest.fn();
      const mockGoHome = jest.fn();
      const { getByTestId } = render(
        <AnalysisErrorState
          isDark={true}
          onRetry={mockRetry}
          onGoHome={mockGoHome}
        />
      );

      fireEvent.press(getByTestId('analysis-error-retry'));
      expect(mockRetry).toHaveBeenCalledTimes(1);

      fireEvent.press(getByTestId('analysis-error-home'));
      expect(mockGoHome).toHaveBeenCalledTimes(1);
    });
  });

  describe('접근성', () => {
    it('에러 메시지에 accessibilityLabel이 설정되어야 한다', () => {
      const { getByText } = render(
        <AnalysisErrorState message="분석 오류" />
      );
      expect(getByText('분석 오류').props.accessibilityLabel).toBe(
        '분석 오류'
      );
    });
  });
});
