/**
 * 공통 컴포넌트 테스트
 *
 * ShareButton, ActionToast
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Share } from 'react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { ShareButton } from '../../../components/common/ShareButton';
import { ActionToast } from '../../../components/common/ActionToast';

// Share API mock
jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// ========================================
// ShareButton
// ========================================

describe('ShareButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('공유 라벨을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ShareButton message="테스트 메시지" />
    );
    expect(getByText('공유')).toBeTruthy();
  });

  it('커스텀 라벨을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ShareButton message="테스트" label="결과 공유" />
    );
    expect(getByText('결과 공유')).toBeTruthy();
  });

  it('iconOnly 모드에서 라벨을 숨겨야 한다', () => {
    const { queryByText } = renderWithTheme(
      <ShareButton message="테스트" iconOnly />
    );
    expect(queryByText('공유')).toBeNull();
  });

  it('누르면 Share.share를 호출해야 한다', async () => {
    const { getByText } = renderWithTheme(
      <ShareButton message="분석 결과입니다" />
    );
    await act(async () => {
      fireEvent.press(getByText('공유'));
    });
    expect(Share.share).toHaveBeenCalledWith({
      message: '분석 결과입니다',
    });
  });

  it('URL 포함 시 메시지에 URL을 추가해야 한다', async () => {
    const { getByText } = renderWithTheme(
      <ShareButton message="내 결과" url="https://yiroom.app/result/1" />
    );
    await act(async () => {
      fireEvent.press(getByText('공유'));
    });
    expect(Share.share).toHaveBeenCalledWith({
      message: '내 결과\nhttps://yiroom.app/result/1',
    });
  });

  it('testID를 설정해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <ShareButton message="테스트" testID="share-btn" />
    );
    expect(getByTestId('share-btn')).toBeTruthy();
  });

  it('접근성 라벨이 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ShareButton message="테스트" />
    );
    expect(getByLabelText('공유')).toBeTruthy();
  });

  it('iconOnly 모드에서 접근성 라벨이 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ShareButton message="테스트" iconOnly />
    );
    expect(getByLabelText('공유')).toBeTruthy();
  });

  it('다크모드에서 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <ShareButton message="테스트" />,
      true,
    );
    expect(getByText('공유')).toBeTruthy();
  });
});

// ========================================
// ActionToast
// ========================================

describe('ActionToast', () => {
  it('visible=true일 때 메시지를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ActionToast message="저장되었어요" visible={true} />
    );
    expect(getByText('저장되었어요')).toBeTruthy();
  });

  it('visible=false일 때 렌더링하지 않아야 한다', () => {
    const { queryByText } = renderWithTheme(
      <ActionToast message="저장되었어요" visible={false} />
    );
    expect(queryByText('저장되었어요')).toBeNull();
  });

  it('액션 버튼을 표시해야 한다', () => {
    const onAction = jest.fn();
    const { getByText } = renderWithTheme(
      <ActionToast
        message="삭제됨"
        visible={true}
        actionLabel="실행취소"
        onAction={onAction}
      />
    );
    expect(getByText('실행취소')).toBeTruthy();
  });

  it('액션 버튼을 누르면 onAction이 호출되어야 한다', () => {
    const onAction = jest.fn();
    const { getByText } = renderWithTheme(
      <ActionToast
        message="삭제됨"
        visible={true}
        actionLabel="실행취소"
        onAction={onAction}
      />
    );
    fireEvent.press(getByText('실행취소'));
    expect(onAction).toHaveBeenCalled();
  });

  it('actionLabel 없이 onAction만 있으면 액션 버튼을 숨겨야 한다', () => {
    const { queryByText } = renderWithTheme(
      <ActionToast
        message="삭제됨"
        visible={true}
        onAction={jest.fn()}
      />
    );
    expect(queryByText('실행취소')).toBeNull();
  });

  it('testID를 설정해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <ActionToast message="테스트" visible={true} testID="toast" />
    );
    expect(getByTestId('toast')).toBeTruthy();
  });

  it('접근성 라벨이 메시지여야 한다 (alert role)', () => {
    const { getByLabelText } = renderWithTheme(
      <ActionToast message="알림" visible={true} />
    );
    expect(getByLabelText('알림')).toBeTruthy();
  });

  it('접근성 라벨이 메시지를 포함해야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ActionToast message="저장 완료" visible={true} />
    );
    expect(getByLabelText('저장 완료')).toBeTruthy();
  });

  it('다크모드에서 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <ActionToast message="다크 토스트" visible={true} />,
      true,
    );
    expect(getByText('다크 토스트')).toBeTruthy();
  });

  it('success 타입으로 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <ActionToast message="성공!" visible={true} type="success" />
    );
    expect(getByText('성공!')).toBeTruthy();
  });

  it('error 타입으로 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <ActionToast message="오류 발생" visible={true} type="error" />
    );
    expect(getByText('오류 발생')).toBeTruthy();
  });
});
