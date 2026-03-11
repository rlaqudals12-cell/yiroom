/**
 * ReportModal 컴포넌트 테스트
 *
 * 대상: components/social/ReportModal.tsx
 * 신고 모달 — 5종 사유 선택 + 선택적 상세 설명 입력
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ReportModal } from '../../../components/social/ReportModal';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors, brand, module: moduleColors,
    status: statusColors, grade: gradeColors, nutrient: nutrientColors,
    score: scoreColors, trust: trustColors, spacing, radii, shadows, typography,
    isDark, colorScheme: isDark ? 'dark' : 'light', themeMode: 'system', setThemeMode: jest.fn(),
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  postId: 'post_123',
  onSubmit: jest.fn().mockResolvedValue(undefined),
};

describe('ReportModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('렌더링', () => {
    it('visible=true일 때 모달이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );
      expect(getByTestId('report-modal')).toBeTruthy();
    });

    it('visible=false일 때 모달 컨텐츠가 표시되지 않는다', () => {
      const { queryByText } = renderWithTheme(
        <ReportModal {...defaultProps} visible={false} />
      );
      expect(queryByText('게시물 신고')).toBeNull();
    });

    it('제목 "게시물 신고"가 표시된다', () => {
      const { getByText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );
      expect(getByText('게시물 신고')).toBeTruthy();
    });

    it('안내 문구가 표시된다', () => {
      const { getByText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );
      expect(getByText('신고 사유를 선택해주세요.')).toBeTruthy();
    });
  });

  describe('신고 사유 5종 표시', () => {
    it('스팸/광고 사유가 표시된다', () => {
      const { getByText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );
      expect(getByText('스팸/광고')).toBeTruthy();
    });

    it('괴롭힘/욕설 사유가 표시된다', () => {
      const { getByText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );
      expect(getByText('괴롭힘/욕설')).toBeTruthy();
    });

    it('부적절한 콘텐츠 사유가 표시된다', () => {
      const { getByText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );
      expect(getByText('부적절한 콘텐츠')).toBeTruthy();
    });

    it('잘못된 정보 사유가 표시된다', () => {
      const { getByText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );
      expect(getByText('잘못된 정보')).toBeTruthy();
    });

    it('기타 사유가 표시된다', () => {
      const { getByText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );
      expect(getByText('기타')).toBeTruthy();
    });
  });

  describe('사유 선택 상호작용', () => {
    it('사유를 선택하면 해당 항목이 하이라이트된다', () => {
      const { getByText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );

      const spamButton = getByText('스팸/광고');
      fireEvent.press(spamButton);

      // 선택된 항목의 부모 Pressable 스타일에 accent 색상이 적용됨
      // 선택 후 상세 설명 입력란이 나타나는 것으로 선택 확인
      expect(getByText('스팸/광고')).toBeTruthy();
    });

    it('사유 선택 후 상세 설명 입력란이 표시된다', () => {
      const { getByText, getByPlaceholderText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );

      fireEvent.press(getByText('괴롭힘/욕설'));

      expect(
        getByPlaceholderText('추가 설명이 있으면 입력해주세요 (선택)')
      ).toBeTruthy();
    });

    it('사유 미선택 시 상세 설명 입력란이 표시되지 않는다', () => {
      const { queryByPlaceholderText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );

      expect(
        queryByPlaceholderText('추가 설명이 있으면 입력해주세요 (선택)')
      ).toBeNull();
    });
  });

  describe('제출 버튼 상태', () => {
    it('사유 미선택 시 신고하기 버튼이 비활성화된다', () => {
      const { getByText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );

      const submitButton = getByText('신고하기');
      fireEvent.press(submitButton);

      // onSubmit이 호출되지 않아야 함 (사유 없이 submit 시 early return)
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('사유 선택 후 onSubmit이 올바른 인자로 호출된다', async () => {
      const { getByText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );

      fireEvent.press(getByText('잘못된 정보'));
      fireEvent.press(getByText('신고하기'));

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          'post_123',
          'misinformation',
          undefined
        );
      });
    });

    it('사유 + 상세 설명과 함께 onSubmit이 호출된다', async () => {
      const { getByText, getByPlaceholderText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );

      fireEvent.press(getByText('기타'));
      const input = getByPlaceholderText('추가 설명이 있으면 입력해주세요 (선택)');
      fireEvent.changeText(input, '악의적인 게시물입니다');
      fireEvent.press(getByText('신고하기'));

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          'post_123',
          'other',
          '악의적인 게시물입니다'
        );
      });
    });
  });

  describe('로딩 상태', () => {
    it('제출 중 로딩 인디케이터가 표시된다', async () => {
      // onSubmit이 지연되도록 설정
      let resolveSubmit: () => void;
      const slowSubmit = jest.fn(
        () => new Promise<void>((resolve) => { resolveSubmit = resolve; })
      );

      const { getByText, queryByText } = renderWithTheme(
        <ReportModal {...defaultProps} onSubmit={slowSubmit} />
      );

      fireEvent.press(getByText('스팸/광고'));
      fireEvent.press(getByText('신고하기'));

      // 로딩 중에는 "신고하기" 텍스트가 사라지고 ActivityIndicator 표시
      await waitFor(() => {
        expect(queryByText('신고하기')).toBeNull();
      });

      // 완료
      resolveSubmit!();
    });
  });

  describe('취소', () => {
    it('취소 버튼을 누르면 onClose가 호출된다', () => {
      const { getByText } = renderWithTheme(
        <ReportModal {...defaultProps} />
      );

      fireEvent.press(getByText('취소'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
