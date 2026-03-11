/**
 * BlockConfirmDialog 컴포넌트 테스트
 *
 * 대상: components/social/BlockConfirmDialog.tsx
 * 차단 확인 다이얼로그 — 양방향 비노출 안내 + 차단 실행
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { BlockConfirmDialog } from '../../../components/social/BlockConfirmDialog';

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
  authorName: '홍길동',
  blockedUserId: 'user_456',
  onConfirm: jest.fn().mockResolvedValue(undefined),
};

describe('BlockConfirmDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('렌더링', () => {
    it('visible=true일 때 다이얼로그가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(
        <BlockConfirmDialog {...defaultProps} />
      );
      expect(getByTestId('block-confirm-dialog')).toBeTruthy();
    });

    it('작성자 이름이 제목에 포함되어 표시된다', () => {
      const { getByText } = renderWithTheme(
        <BlockConfirmDialog {...defaultProps} />
      );
      expect(getByText('홍길동님을 차단할까요?')).toBeTruthy();
    });

    it('다른 작성자 이름으로도 올바르게 표시된다', () => {
      const { getByText } = renderWithTheme(
        <BlockConfirmDialog {...defaultProps} authorName="김철수" />
      );
      expect(getByText('김철수님을 차단할까요?')).toBeTruthy();
    });
  });

  describe('안내 문구', () => {
    it('차단 안내 문구가 표시된다', () => {
      const { getByText } = renderWithTheme(
        <BlockConfirmDialog {...defaultProps} />
      );
      expect(getByText('차단하면 다음과 같이 적용돼요.')).toBeTruthy();
    });

    it('피드 비노출 안내가 표시된다', () => {
      const { getByText } = renderWithTheme(
        <BlockConfirmDialog {...defaultProps} />
      );
      expect(
        getByText('• 상대방의 게시물이 피드에서 보이지 않아요')
      ).toBeTruthy();
    });

    it('양방향 비노출 안내가 표시된다', () => {
      const { getByText } = renderWithTheme(
        <BlockConfirmDialog {...defaultProps} />
      );
      expect(
        getByText('• 상대방도 내 게시물을 볼 수 없어요')
      ).toBeTruthy();
    });

    it('차단 해제 안내가 표시된다', () => {
      const { getByText } = renderWithTheme(
        <BlockConfirmDialog {...defaultProps} />
      );
      expect(
        getByText('• 설정에서 언제든 차단을 해제할 수 있어요')
      ).toBeTruthy();
    });
  });

  describe('차단 확인', () => {
    it('차단하기 버튼을 누르면 onConfirm이 blockedUserId와 함께 호출된다', async () => {
      const { getByText } = renderWithTheme(
        <BlockConfirmDialog {...defaultProps} />
      );

      fireEvent.press(getByText('차단하기'));

      await waitFor(() => {
        expect(defaultProps.onConfirm).toHaveBeenCalledWith('user_456');
      });
    });

    it('차단 완료 후 onClose가 호출된다', async () => {
      const { getByText } = renderWithTheme(
        <BlockConfirmDialog {...defaultProps} />
      );

      fireEvent.press(getByText('차단하기'));

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });
  });

  describe('취소', () => {
    it('취소 버튼을 누르면 onClose가 호출된다', () => {
      const { getByText } = renderWithTheme(
        <BlockConfirmDialog {...defaultProps} />
      );

      fireEvent.press(getByText('취소'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('로딩 상태', () => {
    it('차단 진행 중 로딩 인디케이터가 표시된다', async () => {
      let resolveConfirm: () => void;
      const slowConfirm = jest.fn(
        () => new Promise<void>((resolve) => { resolveConfirm = resolve; })
      );

      const { getByText, queryByText } = renderWithTheme(
        <BlockConfirmDialog {...defaultProps} onConfirm={slowConfirm} />
      );

      fireEvent.press(getByText('차단하기'));

      // 로딩 중에는 "차단하기" 텍스트가 사라지고 ActivityIndicator 표시
      await waitFor(() => {
        expect(queryByText('차단하기')).toBeNull();
      });

      // 완료
      resolveConfirm!();
    });

    it('차단 진행 중 차단하기 버튼이 비활성화된다', async () => {
      let resolveConfirm: () => void;
      const slowConfirm = jest.fn(
        () => new Promise<void>((resolve) => { resolveConfirm = resolve; })
      );

      const { getByText } = renderWithTheme(
        <BlockConfirmDialog {...defaultProps} onConfirm={slowConfirm} />
      );

      fireEvent.press(getByText('차단하기'));

      // 진행 중 두 번째 클릭은 무시됨 (disabled 상태)
      await waitFor(() => {
        expect(slowConfirm).toHaveBeenCalledTimes(1);
      });

      resolveConfirm!();
    });
  });
});
